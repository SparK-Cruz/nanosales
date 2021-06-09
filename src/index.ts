import * as express from 'express';
import * as bodyParser from 'body-parser';
import { loadConfig } from './loaders/config_loader';
import { loadSettler } from './loaders/settler_loader';
import { loadSeed } from './loaders/seed_loader';
import { Address, AddressInfo } from './services/address';
import { Node } from './services/node';
import { Watcher } from './services/watcher';
import { Receiver } from './services/receiver';
import { Settler } from './services/settler';
import { saleInfoAction } from './actions/sale_info';
import { settleSaleAction } from './actions/settle_sale';
import { bindSaleAction } from './actions/bind_sale';
import { errorLogger, requestLogger } from './middleware/logging';
import { Work } from './services/work';

(() => {
    const app = express();

    const PORT = 13380;

    app.use(bodyParser.json());
    app.use(requestLogger);
    app.use(errorLogger);

    Promise.all([loadConfig(), loadSettler(), loadSeed()]).then(data => {
        const [config, settlerAddress, seed] = data;

        const node = new Node(config.nodeWs, config.nodeRpc);
        const work = new Work(node, config.workRpc);
        const address = new Address(seed, config.minPoolAddresses);
        const receiver = new Receiver(node, work, settlerAddress);
        const settler = new Settler(node, work, settlerAddress);

        const watcher = new Watcher(node, address, receiver);

        const pending: AddressInfo[] = [];
        address.on('pending', account => {
            if (typeof account.order !== 'undefined' && typeof account.payment === 'undefined') {
                pending.push(account);
            }
        });
        node.once('open', () => {
            setTimeout(() => {
                pending.forEach(account => {
                    receiver.receive(account)
                        .then(info => {
                            address.addPayment(account.address, info);
                            watcher.notifyUser(account.order);
                        })
                        .catch(err => {
                            console.warn(err);
                            node.addSub(account.address);
                        });
                });
            }, 5000);
        });

        app.post('/sales', bindSaleAction(node, address));
        app.get('/sales/:address', saleInfoAction(node, address, receiver));
        app.delete('/sales/:address', settleSaleAction(address, settler));

        app.listen(PORT, () => {
            console.log(`Payment server running at port ${PORT}`);
        });
    })
    .catch(err => {
        console.error(err);
    });
})();
