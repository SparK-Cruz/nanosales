import * as nano from '@thelamer/nanocurrency';
import * as files from './files';

export const loadSettler = () => {
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