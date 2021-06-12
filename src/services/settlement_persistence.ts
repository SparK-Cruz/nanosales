import * as fs from 'fs';
import * as crypto from 'crypto';

export interface SettlementInfo {
    url: string,
    hash: string,
    amount: number
}

const SECRET = 'settlement_digest';
function md5(str: string): string {
    const hasher = crypto.createHmac('md5', SECRET);
    return hasher.update(str).digest('hex');
}

export class SettlementPersistence {
    public static load(url: string): SettlementInfo {
        try {
            const file = `data/settlements/${md5(url)}.json`;
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        } catch (err) {
            console.info('SETTLEMENT FILE NOT FOUND');
            return null;
        }
    }

    public static save(info: SettlementInfo): void {
        const file = `data/settlements/${md5(info.url)}.json`;
        fs.writeFile(file, JSON.stringify(info), err => {
            if (!!err) {
                console.error(err);
                console.warn('SETTLEMENT NOT SAVED TO DRIVE - UNSAFE GATEWAY OPERATION');
            }
        });
    }
}
