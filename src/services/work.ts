import { Node, BlockType } from "./node";
import { fallback } from '../patches/promise';
import { RpcClient } from './rpc_client';
import { LocalWorkerManager } from './local_worker';

const WORK_THRESHOLD = 'fffffff800000000';
const RECEIVE_WORK_THRESHOLD = 'fffffe0000000000';

const MAX_LOCAL_WORKERS = 6;

export class Work {
    private rpc: RpcClient;

    constructor(private node: Node, private workRpcUrl?: string) {
        if (!!this.workRpcUrl) {
            this.rpc = new RpcClient(this.workRpcUrl);
        }
    }

    public work(hash: string, blockType: BlockType): Promise<string> {
        const threshold = blockType === BlockType.RECEIVE ? RECEIVE_WORK_THRESHOLD : WORK_THRESHOLD;

        return fallback([
            () => this.serverPow(hash, threshold),
            () => this.nodePow(hash, threshold),
            () => this.localPow(hash, threshold),
        ]);
    }

    private nodePow(hash: string, threshold: string): Promise<string> {
        return this.node.work(hash, threshold);
    }

    private serverPow(hash: string, difficulty: string): Promise<string> {
        const payload: any = {
            action: 'work_generate',
            hash,
            difficulty
        };

        return new Promise((resolve, reject) => {
            if (!this.workRpcUrl) {
                reject('No work server configured');
                return;
            }

            this.rpc.send(payload)
                .then(res => {
                    if (typeof res.error !== 'undefined') {
                        reject(res.error);
                        return;
                    }

                    resolve(res.work);
                })
                .catch(reject);
        });
    }

    private localPow(hash: string, threshold: string): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                const localWork = new LocalWorkerManager(MAX_LOCAL_WORKERS);
                localWork.work(hash, threshold).then(resolve);
            } catch (err) {
                reject(err);
            }
        });
    }
}
