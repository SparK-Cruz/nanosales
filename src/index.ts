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

(() => {
    const app = express();

    const PORT = 13380;

    app.use(bodyParser.json());

    Promise.all([loadConfig(), loadSettler(), loadSeed()]).then(data => {
        const [config, settlerAddress, seed] = data;

        // create node
        const node = new Node(config.nodeWs, config.nodeRpc);
        // create address pool
        const address = new Address(seed);
        // create receiver
        const receiver = new Receiver(node, settlerAddress);
        // create settler
        const settler = new Settler(settlerAddress);

        app.post('/sales', bindSaleAction(node, address));
        app.get('/sales/:address', saleInfoAction(node, address, receiver));
        app.delete('/sales/:address', settleSaleAction(node, address, settler));

        app.listen(PORT, () => {
            console.log(`Payment server running at port ${PORT}`);
        });

        // create watcher
        new Watcher(node, address, receiver);
    })
    .catch(err => {
        console.error(err);
    });
})();
