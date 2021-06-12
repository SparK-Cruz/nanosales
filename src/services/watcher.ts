import { Address, AddressInfo, OrderInfo } from "./address";
import { BlockType, Node } from "./node";
import { Receiver } from "./receiver";
import axios from 'axios';

export class Watcher {
    public constructor(private node: Node, private address: Address, private receiver: Receiver) {
        this.node.on('block', data => this.handleBlock(data));
    }

    public handleBlock(data: any): void {
        if (data.message.block.subtype !== BlockType.SEND) {
            return;
        }

        const address = data.message.block.link_as_account;
        console.log('Handling block for account:', address);

        const subject = this.address.find(address);
        if (!subject) {
            console.error(`Receiving address not in pool: ${address}`)
            return;
        }

        this.receiveAddress(subject);
    }

    public receiveAddress(subject: AddressInfo) {
        if (typeof subject.order === 'undefined')
            return;

        if (typeof subject.payment !== 'undefined')
            return;

        this.receiver.receive(subject)
            .then(paymentInfo => {
                console.log('Payment received', subject.address, paymentInfo);
                this.address.addPayment(subject.address, paymentInfo);
                this.notifyUser(subject.order);
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
