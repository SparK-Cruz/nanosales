import * as fs from 'fs';
import { AddressInfo } from "./address";

const FILE = 'data/pool.json';

export class PoolPersistence {
    public static load(): AddressInfo[] {
        try {
            return JSON.parse(fs.readFileSync(FILE, 'utf8'));
        } catch (err) {
            console.warn('NO POOL FILE LOADED, STARTING FRESH');
            return [];
        }
    }

    public static save(info: AddressInfo[]): void {
        fs.writeFile(FILE, JSON.stringify(info), err => {
            if (!!err) {
                console.error(err);
                console.warn('POOL NOT SAVED TO DRIVE - UNSAFE GATEWAY OPERATION');
            }
        });
    }
}
