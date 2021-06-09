import * as nano from 'nanocurrency';
import { AddressInfo } from "./address";
import { BlockType, Node } from './node';
import { Work } from './work';

export class Settler {
    public constructor(private node: Node, private work: Work, private settler: string) {}

    public settle(subject: AddressInfo): Promise<string> {
        return new Promise((resolve, reject) => {
            this.prepareSend(subject)
                .then(blockData => {
                    this.node.publish(subject, BlockType.SEND, blockData)
                    .then(resolve)
                    .catch(reject);
                });
        });
    }

    private prepareSend(subject: AddressInfo): Promise<nano.BlockData> {
        const data: nano.BlockData = {
            balance: '0',
            representative: this.settler, // placeholder
            work: null,
            link: this.settler,
            previous: subject.payment.block
        };
        const block = nano.createBlock(subject.key, data);

        // Assynchronous part
        return new Promise((resolve, reject) => {
            this.work.work(block.hash, BlockType.SEND)
                .then(work => {
                    data.work = work;
                    resolve(data);
                })
                .catch(reject)
        });
    }
}
