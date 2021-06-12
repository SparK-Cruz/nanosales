import * as nano from 'nanocurrency';
import { parentPort, Worker, isMainThread } from 'worker_threads';

if (!isMainThread) {
    parentPort.on('message', async (args: {hash: string, threshold: string, index: number, pool: number}) => {
        const { hash, threshold, index, pool } = args;
        parentPort.postMessage(await nano.computeWork(hash, {
            workThreshold: threshold,
            workerIndex: index,
            workerCount: pool,
        }));
    });
}

export class LocalWorkerManager {
    private workers: Worker[] = [];

    public constructor(num: number) {
        this.workers.push(...Array(num).fill(null).map(e => new Worker('./dist/services/local_worker.js')));
    }

    public work(hash: string, threshold: string): Promise<string> {
        const pool = this.workers.length;

        return new Promise((resolve, reject) => {
            this.race(this.workers)
                .then((work: string) => {
                    this.terminate(this.workers);
                    resolve(work);
                });

            this.workers.forEach((w, index) => {
                w.postMessage({
                    hash,
                    threshold,
                    index,
                    pool,
                });
            });
        });
    }

    private race(workers: Worker[]) {
        return Promise.race(workers.map(worker => new Promise((resolve, reject) => {
            worker.on('message', work => {
                if (work) resolve(work);
            });
        })));
    }

    private terminate(workers: Worker[]) {
        workers.forEach(worker => worker.terminate());
    }
}
