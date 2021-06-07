import { EventEmitter } from 'events';
import * as WebSocket from 'ws';
import * as nano from '@thelamer/nanocurrency';

import { RpcClient } from './rpc_client';
import { AddressInfo } from './address';

export enum BlockType {
    SEND = 'send',
    RECEIVE = 'receive'
}

export interface Pending {
    block: string,
    amount: number,
}

export interface BlockInfo {
    blockAccount: string,
    amount: number,
    balance: number,
    height: number,
    localTimestamp: number,
    confirmed: boolean,
    contents: {
        type: string,
        account: string,
        previous: string,
        representative: string,
        balance: number,
        link: string,
        linkAsAccount: string,
        signature: string,
        work: string
    },
    subtype: string
}

export class Node extends EventEmitter {
    private ws: WebSocket;
    private rpc: RpcClient;

    public constructor(ws: string, rpc: string) {
        super();

        this.rpc = new RpcClient(rpc);
        this.bindSocket(new WebSocket(ws));
    }

    public head(address: string): Promise<{hash: string, balance: number}> {
        const payload = {
            action: 'account_info',
            account: address,
        };

        return new Promise((resolve, reject) => {
            this.rpc.send(payload)
                .then(info => {
                    if (typeof info.error !== 'undefined') {
                        resolve({
                            hash: null,
                            balance: 0
                        });
                        return;
                    }

                    resolve({
                        hash: info.frontier,
                        balance: Number.parseInt(info.balance)
                    });
                })
                .catch(reject);
        });
    }

    public pending(address: string): Promise<Pending[]> {
        const payload = {
            action: 'pending',
            account: address
        };

        return new Promise((resolve, reject) => {
            this.rpc.send(payload)
                .then(data => {
                    const list: Pending[] = [];
                    for(let hash in data.blocks) {
                        list.push({
                            block: hash,
                            amount: Number.parseInt(data.blocks[hash])
                        });
                    }
                    resolve(list);
                })
                .catch(reject);
        });
    }

    public info(blockHash: string): Promise<BlockInfo> {
        const payload: any = {
            action: "block_info",
            json_block: "true",
            hash: blockHash
        };

        return new Promise((resolve, reject) => {
            this.rpc.send(payload)
                .then(obj => {
                    resolve({
                        blockAccount: obj.block_account,
                        amount: Number.parseInt(obj.amount),
                        balance: Number.parseInt(obj.balance),
                        height: Number.parseInt(obj.height),
                        localTimestamp: Number.parseInt(obj.local_timestamp),
                        confirmed: obj.confirmed === 'true',
                        contents: {
                            type: obj.contents.type,
                            account: obj.contents.account,
                            previous: obj.contents.previous,
                            representative: obj.contents.representative,
                            balance: Number.parseInt(obj.contents.balance),
                            link: obj.contents.link,
                            linkAsAccount: obj.contents.link_as_account,
                            signature: obj.contents.signature,
                            work: obj.contents.work
                        },
                        subtype: obj.subtype
                    });
                })
                .catch(reject);
        })
    }

    public publish(address: AddressInfo, type: BlockType, block: nano.BlockData): Promise<string> {
        const payload: any = {
            action: 'process',
            json_block: 'true',
            subtype: type,
            block: nano.createBlock(address.key, block)
        };

        return new Promise((resolve, reject) => {
            this.rpc.send(payload)
                .then(res => {
                    resolve(res.hash);
                })
                .catch(reject);
        });
    }

    public addSub(address: string): void {
        this.ws.send({
            "action": "update",
            "topic": "confirmation",
            "options": {
                "accounts_add": [address]
            }
        });
    }

    public removeSub(address: string): void {
        this.ws.send({
            "action": "update",
            "topic": "confirmation",
            "options": {
                "accounts_del": [address]
            }
        });
    }

    private bindSocket(ws: WebSocket): void {
        this.ws = ws;

        ws.on('open', () => {
            ws.send({
                "action": "subscribe",
                "topic": "confirmation",
                "options": {
                    "accounts": []
                }
            });
        });

        ws.on('message', (message: any) => {
            const parsed = JSON.parse(message.data);

            switch(parsed.topic) {
                case "confirmation":
                    return this.handleConfirm(parsed);
            }
        });

        ws.on('error', err => {
            console.error(err);
            console.error('Can\'t continue without a node socket to listen to!');
            process.exit(1);
        });
    }

    private handleConfirm(data: any): void {
        this.emit('block', data);
    }
}
