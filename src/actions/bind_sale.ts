import * as express from 'express';
import { rawToString } from '../patches/number';
import { Address } from '../services/address';
import { Node } from '../services/node';
import { SettlementPersistence } from '../services/settlement_persistence';

export function bindSaleAction(node: Node, address: Address): express.RequestHandler {
    return (req: express.Request, res: express.Response) => {
        try {
            const info = SettlementPersistence.load(req.body.callback);
            if (info) {
                res.status(200).json({ paid: true });
                return;
            }

            const result = address.bindAvailable({
                callbackUrl: req.body.callback,
                amount: req.body.amount
            });

            if (typeof result.payment !== 'undefined' &&
                result.payment.amount >= result.order.amount) {
                res.status(200).json({ paid: true });
                return;
            }

            const url = [
                'nano:',
                result.address,
                '?amount=',
                rawToString(req.body.amount)
            ].join('');

            res.status(201).send({
                address: url,
                wallet: result.address,
            });

            node.addSub(result.address);
        } catch (err) {
            console.error(err);
            res.status(500).json({
                error: err
            });
        }
    }
}
