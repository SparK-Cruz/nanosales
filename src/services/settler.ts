import * as nano from 'nanocurrency';
import { AddressInfo } from "./address";
import { BlockType, Node } from './node';
import { Work } from './work';
import { SettlementPersistence, SettlementInfo } from './settlement_persistence';

const RETRY_TIMER = 15000;

export class Settler {
    public constructor(private node: Node, private work: Work, private settler: string) {}

    public settle(subject: AddressInfo): Promise<string> {
        return new Promise((resolve, reject) => {
            if (typeof subject.payment === 'undefined') {
                reject('E03: No payment present for address!');
                return;
            }

            console.log('Generating settlement:', subject.address);

            this.prepareSend(subject)
                .then(blockData => {
                    this.node.checkWork(blockData.work, blockData.previous)
                        .then(result => {
                            console.log(result);
                            this.node.publish(subject, BlockType.SEND, blockData)
                                .then(hash => {
                                    const info: SettlementInfo = {
                                        url: subject.order.callbackUrl,
                                        hash,
                                        amount: subject.payment.amount,
                                    };

                                    resolve(hash);

                                    SettlementPersistence.save(info);
                                })
                                .catch(reject);
                        })
                        .catch(err => {
                            console.error(err);
                            console.log('Scheduling retry in', RETRY_TIMER/1000, 'seconds');
                            setTimeout(() => {
                                this.settle(subject);
                            }, RETRY_TIMER);
                        });
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

        // Assynchronous part
        return new Promise((resolve, reject) => {
            this.work.work(subject.payment.block, BlockType.SEND)
                .then(work => {
                    data.work = work;
                    resolve(data);
                })
                .catch(reject)
        });
    }
}
