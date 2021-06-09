import * as nano from 'nanocurrency';
import { rawToString } from '../patches/number';
import { AddressInfo, PaymentInfo } from "./address";
import { BlockType, Node, Pending } from "./node";
import { Work } from './work';

const FIRST_BLOCK = '0000000000000000000000000000000000000000000000000000000000000000';

export class Receiver {
    public constructor(private node: Node, private work: Work, private rep: string) {}

    public receive(info: AddressInfo): Promise<PaymentInfo> {
        console.log('Attempting receive', info.address);
        return new Promise((resolve, reject) => {
            this.node.head(info.address)
                .then(data => {
                    const last: PaymentInfo = {
                        block: data.hash || FIRST_BLOCK,
                        amount: 0,
                        balance: data.balance || 0,
                    };

                    this.node.pending(info.address)
                        .then(blocks => {
                            console.log(blocks);
                            resolve(this.handlePending(info, blocks, last));
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
    }

    // <!> RECURSIVE
    private handlePending(address: AddressInfo, pending: Pending[], last: PaymentInfo): Promise<PaymentInfo> {
        return new Promise((resolve, reject) => {
            if (pending.length == 0) {
                resolve(last);
                return;
            }

            console.log(last);

            const first = pending.shift();
            this.receiveOne(address, first, last).then(info => {
                info.amount += last.amount;
                this.handlePending(address, pending, info).then(resolve);
            })
            .catch(reject);
        });
    }

    private receiveOne(address: AddressInfo, pending: Pending, prev: PaymentInfo): Promise<PaymentInfo> {
        return new Promise((resolve, reject) => {
            const balance = prev.balance + pending.amount;

            this.prepareReceive(address, pending, balance, prev.block)
                .then(block => {
                    this.node.publish(address, BlockType.RECEIVE, block)
                        .then(hash => {
                            resolve({
                                block: hash,
                                amount: pending.amount,
                                balance: balance,
                            });
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
    }

    private prepareReceive(address: AddressInfo, pending: Pending, balance: number, prev: string): Promise<nano.BlockData> {
        console.log(pending);

        const data: nano.BlockData = {
            balance: rawToString(balance),
            representative: this.rep,
            work: null,
            link: pending.block,
            previous: prev
        };
        const block = nano.createBlock(address.key, data);

        // Assynchronous part
        return new Promise((resolve, reject) => {
            this.work.work(block.hash, BlockType.RECEIVE)
                .then(work => {
                    data.work = work;
                    resolve(data);
                })
                .catch(reject);
        });
    }
}
