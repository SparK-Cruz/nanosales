import * as http from 'http';
import * as https from 'https';

enum Method {
    GET = 'GET',
    POST = 'POST'
}

export class RpcClient {
    private driver: string;
    private host: string;
    private port: number;
    private path: string;

    public constructor(base: string) {
        const url = new URL(base);
        this.driver = url.protocol;
        this.host = url.host;
        this.port = url.port || url.protocol === 'https' ? 443 : 80;
        this.path = url.pathname;
    }

    public send(data: any): Promise<any> {
        return this.buildRequest(Method.POST, data);
    }

    private buildRequest(method: Method, data: any): Promise<any> {
        const payload = JSON.stringify(data);

        const driver = this.driver === 'https' ? https : http;

        const options: any = {
            hostname: this.host,
            port: this.port,
            path: this.path,
            method: method,
        }

        if (method === Method.POST) {
            options.headers = {
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        }

        return new Promise((resolve, reject) => {
            const req = driver.request(options, res => {
                res.on('data', d => {
                    resolve(JSON.parse(d));
                });
            });

            req.on('error', err => {
                reject(err);
            });

            if (method === Method.POST)
                req.write(payload);

            req.end();
        });
    }
}
