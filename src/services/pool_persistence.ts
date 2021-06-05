import * as fs from 'fs';
import { AddressInfo } from "./address";

export class PoolPersistence {
    public static load(): AddressInfo[] {
        try {
            return JSON.parse(fs.readFileSync('data/pool.json', 'utf8'));
        } catch (err) {
            console.warn('NO POOL FILE LOADED, STARTING FRESH');
            return [];
        }
    }

    public static save(info: AddressInfo[]): void {
        fs.writeFile('data/pool.json', JSON.stringify(info), err => {
            if (!!err) {
                console.error(err);
                console.warn('POOL NOT SAVED TO DRIVE - UNSAFE GATEWAY OPERATION');
            }
        });
    }
}
