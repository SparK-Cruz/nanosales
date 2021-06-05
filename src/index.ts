import { Config, loadConfig } from './loaders/config_loader';
import { loadSettler } from './loaders/settler_loader';

(() => {
    Promise.all([loadConfig(), loadSettler()]).then(data => {
        const [options, settler] = data;
        const config: Config = <Config>options;

        console.log(config.minPoolAddresses);
        console.log(settler);
    })
    .catch(err => {
        console.error(err);
    });
})();

// TODO
// listen and route
// watch confirmations, create receive blocks
// notification queue with workers and retries for callback urls
// settlement blocks