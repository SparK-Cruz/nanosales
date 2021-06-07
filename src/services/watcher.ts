import * as https from 'https';
import * as http from 'http';
import { Address } from "./address";
import { Node } from "./node";
import { Receiver } from "./receiver";

export class Watcher {
    public constructor(private node: Node, private address: Address, private receiver: Receiver) {
        node.on('block', this.handleBlock);
    }

    private handleBlock(data: any): void {
        const address = data.message.block.link_as_account;
        const subject = this.address.find(address);
        if (!subject) {
            console.error(`Receiving address not in pool: ${address}`)
            return;
        }
        this.receiver.receive(subject)
            .then(paymentInfo => {
                this.address.addPayment(address, paymentInfo);
                this.notifyUser(subject.order.callbackUrl);
                this.node.removeSub(address);
            })
            .catch(err => {
                console.error(err);
            });
    }

    private notifyUser(url: string): void {
        const parsed = new URL(url);
        const driver = parsed.protocol === 'https' ? https : http;

        driver.request(parsed);
    }
}
