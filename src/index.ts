import * as express from 'express';
import * as bodyParser from 'body-parser';
import { loadConfig } from './loaders/config_loader';
import { loadSettler } from './loaders/settler_loader';
import { loadSeed } from './loaders/seed_loader';
import { Address } from './services/address';
import { Node } from './services/node';
import { Watcher } from './services/watcher';
import { Receiver } from './services/receiver';
import { Settler } from './services/settler';
import { saleInfoAction } from './actions/sale_info';
import { settleSaleAction } from './actions/settle_sale';
import { bindSaleAction } from './actions/bind_sale';
import { errorLogger, requestLogger } from './middleware/logging';

(() => {
    const app = express();

    const PORT = 13380;

    app.use(bodyParser.json());
    app.use(requestLogger);
    app.use(errorLogger);

    Promise.all([loadConfig(), loadSettler(), loadSeed()]).then(data => {
        const [config, settlerAddress, seed] = data;

        const node = new Node(config.nodeWs, config.nodeRpc);
        const address = new Address(seed);
        const receiver = new Receiver(node, settlerAddress);
        const settler = new Settler(settlerAddress);

        const pending: string[] = [];
        address.on('pending', address => {
            pending.push(address);
        });
        node.once('open', () => {
            setTimeout(() => {
                pending.forEach(address => node.addSub(address));
            }, 5000);
        });

        app.post('/sales', bindSaleAction(node, address));
        app.get('/sales/:address', saleInfoAction(node, address, receiver));
        app.delete('/sales/:address', settleSaleAction(node, address, settler));

        app.listen(PORT, () => {
            console.log(`Payment server running at port ${PORT}`);
        });

        new Watcher(node, address, receiver);
    })
    .catch(err => {
        console.error(err);
    });
})();
