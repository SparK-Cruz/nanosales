import * as nano from 'nanocurrency';
import { AddressInfo } from "./address";

export class Settler {
    public constructor(private settler: string) {}

    public settle(subject: AddressInfo): Promise<nano.BlockData> {
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
            nano.computeWork(block.hash, {workThreshold: 'fffffff800000000'})
                .then(work => {
                    data.work = work;
                    resolve(data);
                })
                .catch(reject)
        });
    }
}
