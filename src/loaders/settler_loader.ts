import * as nano from 'nanocurrency';
import * as files from './files';

export const loadSettler = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        files.read(files.SETTLER)
            .then((data: string) => {
                const address = data.trim();
                if (!nano.checkAddress(address))
                    return reject(new Error('Invalid settlement address!'));

                return resolve(address);
            })
            .catch(reject);
    });
};
