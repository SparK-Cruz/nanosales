import * as express from 'express';
import { Address } from '../services/address';
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
            if (!subject) {
                catcher('E02: Address not found!');
                return;
            }

            settler.settle(subject)
                .then(hash => {
                    address.release(subject.address);
                    console.log('Settlement', subject.address, hash);
                    res.status(200).json({
                        hash,
                    });
                })
                .catch(catcher);
        } catch(err) {
            catcher(err);
            throw(err);
        }
    };
}
