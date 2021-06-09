import * as express from 'express';
import { Address } from '../services/address';
import { BlockType, Node } from '../services/node';
import { Settler } from '../services/settler';

export function settleSaleAction(address: Address, settler: Settler): express.RequestHandler {
    return (req: express.Request, res: express.Response) => {
        const catcher = (err: any) => {
            res.status(500).json({
                error: err
            });
            console.error(err);
        };

        try {
            const subject = address.find(req.params.address);
            settler.settle(subject)
                .then(hash => {
                    address.release(subject.address);
                    console.log('Settlement', subject.address, hash);
                })
                .catch(catcher);
        } catch(err) {
            catcher(err);
            throw(err);
        }
    };
}
