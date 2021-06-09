import { Address, OrderInfo } from "./address";
import { Node } from "./node";
import { Receiver } from "./receiver";
import axios from 'axios';

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
                console.log('Payment received', address, paymentInfo);
                this.address.addPayment(address, paymentInfo);
                this.notifyUser(subject.order);
                this.node.removeSub(address);
            })
            .catch(err => {
                console.error(err);
            });
    }

    public notifyUser(order: OrderInfo): void {
        const request = axios.create();
        request.get(order.callbackUrl);
    }
}
