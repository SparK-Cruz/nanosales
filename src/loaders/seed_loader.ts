import * as nano from 'nanocurrency';
import * as files from './files';

export const loadSeed = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        files.read(files.SEED)
            .then(data => {
                resolve(data);
            })
            .catch(err => {
                if (err.code !== 'ENOENT') {
                    return reject(err);
                }

                nano.generateSeed()
                    .then(resolve)
                    .catch(reject)
            });
    });
};
