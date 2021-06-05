import * as WebSocket from 'ws';
import { EventEmitter } from 'events';
import { Config } from '../loaders/config_loader';

export class Node extends EventEmitter {
    private ws: WebSocket;

    public constructor(config: Config) {
        super();

        this.bindSocket(new WebSocket(config.nodeWs));
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
