import * as nano from '@thelamer/nanocurrency';
import { PoolPersistence } from './pool_persistence';

export interface CheckInfo {
    requestedAmount: number,
    receivedAmount: number,
    paid: boolean,
}

export interface OrderInfo {
    callbackUrl: string,
    amount: number, // requested amount
}

export interface PaymentInfo {
    block: string, // receive block on our wallet
    amount: number, // received amount
}

export interface AddressInfo {
    key: string,
    address: string,
    order?: null|OrderInfo,
    payment?: null|PaymentInfo,
}

export class Address {
    private info: AddressInfo[] = [];

    public constructor(private seed: string, private settler: string) {
        this.info = PoolPersistence.load();
    }

    public get length(): number {
        return this.info.length;
    }

    /***
     * Creates addresses in the pool
     * @return AddressInfo first created address
     */
    public create(many: number = 1): void {
        if (isNaN(many) || !Number.isInteger(many) || many < 1)
            return;

        const next = this.info.length;

        for (let i = 0; i < many; i++) {
            const key = nano.deriveSecretKey(this.seed, next + i);
            const pub = nano.derivePublicKey(key);

            this.info.push({
                key: key,
                address: nano.deriveAddress(pub, {useNanoPrefix: true}),
            });
        }

        this.save();
    }

    public bindAvailable(order: OrderInfo): string {
        const subject = this.info.find((value, index, obj) => {
            return !value.order;
        });

        if (!subject) {
            this.create();
            return this.bindAvailable(order);
        }

        
        subject.order = order;
        this.save();
        return subject.address;
    }

    public check(address: string): CheckInfo|null {
        const subject = this.info.find((value, index, obj) => {
            return value.address === address;
        });

        if (!subject || !subject.order)
            return null;
        
        const [req, rec] = [subject.order.amount, subject.payment?.amount || 0];
        return {
            requestedAmount: req,
            receivedAmount: rec,
            paid: rec >= req,
        };
    }

    public settle(address: string) {
        const subject = this.info.find((value, index, obj) => {
            return value.address === address;
        });

        // TODO add work

        nano.createBlock(subject.key, {
            balance: '0',
            representative: this.settler, // placeholder
            work: null, // TODO add work
            link: this.settler,
            previous: subject.payment.block
        });
    }

    private save() {
        PoolPersistence.save(this.info);
    }
}