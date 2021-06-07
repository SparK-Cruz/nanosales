import * as files from './files';

export interface Config {
    minPoolAddresses: number,
    nodeWs: string,
    nodeRpc: string,
};

export const loadConfig = (): Promise<Config> => {
    return new Promise((resolve, reject) => {
        files.read(files.CONFIG)
            .then((data: string) => {
                resolve(JSON.parse(data));
            })
            .catch(reject);
    });
};
