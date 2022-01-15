import * as express from 'express';
import { Address } from '../services/address';
import { Node } from '../services/node';
import { Receiver } from '../services/receiver';

const attemptReceive = (
    addressService: Address,
    receiver: Receiver,
    address: string,
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const subject = addressService.find(address);
        receiver.receive(subject)
            .then(paymentInfo => {
                addressService.addPayment(address, paymentInfo);
                resolve();
            })
            .catch(reject);
    });
}

export function saleInfoAction(address: Address, receiver: Receiver): express.RequestHandler {
    return (req: express.Request, res: express.Response) => {
        try {
            const payload = address.check(req.params.address);
            if (payload.paid) {
                res.json(payload);
                return;
            }

            attemptReceive(address, receiver, req.params.address)
                .then(() => {})
                .catch((err: any) => {})
                .then(() => {
                    res.json(payload);
                });
        } catch(err) {
            res.status(500).json({
                error: err
            });
            throw err;
        }
    };
}
