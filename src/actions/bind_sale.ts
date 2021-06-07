import * as express from 'express';
import { Address } from '../services/address';
import { Node } from '../services/node';

export function bindSaleAction(node: Node, address: Address): express.RequestHandler {
    return (req: express.Request, res: express.Response) => {
        try {
            const result = address.bindAvailable({
                callbackUrl: req.body.callback,
                amount: req.body.amount
            });

            const url = [
                'nano:',
                result,
                '?amount=',
                req.body.amount
            ].join('');

            res.status(201).send({
                address: url
            });

            node.addSub(result);
        } catch (err) {
            res.status(500).json({
                error: err
            });
        }
    }
}
