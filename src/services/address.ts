import * as nano from 'nanocurrency';
import { EventEmitter } from 'events';
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
    balance?: number, // address total balance (optional)
}

export interface AddressInfo {
    key: string,
    address: string,
    order?: null|OrderInfo,
    payment?: null|PaymentInfo,
}

export class Address extends EventEmitter {
    private info: AddressInfo[] = [];

    public constructor(private seed: string) {
        super();

        this.info = PoolPersistence.load();

        this.info.forEach(address => {
            setTimeout(() => this.emit('pending', address.address), 0);
        });
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
        const subject = this.findAvailable(order.callbackUrl);

        subject.order = order;
        this.save();

        return subject.address;
    }

    public addPayment(address: string, payment: PaymentInfo): void {
        const subject = this.find(address);
        subject.payment = payment;
        this.save();
    }

    public check(address: string): CheckInfo|null {
        const subject = this.find(address);

        if (!subject || !subject.order)
            throw 'E01: Unknown address!';

        const [req, rec] = [subject.order.amount, subject.payment?.amount || 0];
        return {
            paid: rec >= req,
            requestedAmount: req,
            receivedAmount: rec,
        };
    }

    public release(address: string) {
        const subject = this.find(address);

        delete subject.payment;
        delete subject.order;

        this.save();
    }

    public find(address: string): AddressInfo {
        return this.info.find((value, index, obj) => {
            return value.address === address;
        });
    }

    private findAvailable(avoidDuplicateUrl: string): AddressInfo {
        const subject = this.info.find((value, index, obj) => {
            return !value.order;
        });

        const duplicate = this.info.find((value, index, obj) => {
            return value.order?.callbackUrl === avoidDuplicateUrl;
        });

        if (!!duplicate) {
            return duplicate;
        }

        if (!subject) {
            this.create();
            return this.findAvailable(avoidDuplicateUrl);
        }

        return subject;
    }

    private save() {
        PoolPersistence.save(this.info);
    }
}
