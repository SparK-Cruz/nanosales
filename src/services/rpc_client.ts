import { AxiosResponse } from "axios";
import axios from "axios";

export class RpcClient {
    public constructor(private base: string) {}

    public send(data: any): Promise<any> {
        return this.buildRequest(data);
    }

    private buildRequest(data: any): Promise<any> {
        const request = axios.create();

        return new Promise((resolve, reject) => {
            request.post(this.base, data)
                .then((res: AxiosResponse) => {
                    resolve(res.data);
                })
                .catch(reject);
        });
    }
}
