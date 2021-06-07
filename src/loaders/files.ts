import * as fs from 'fs';

export const SEED = 'wallet.seed';
export const SETTLER = 'settle.pub';
export const CONFIG = 'config.json';

export const read = (file: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        fs.readFile(file, 'utf8', (err, data) => {
            if (err) {
                return reject(err);
            }

            return resolve(data);
        });
    })
};
