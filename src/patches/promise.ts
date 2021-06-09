function wrap(call: () => Promise<any>, resolve: (obj: any) => any, next: (obj: any) => any): (obj: any) => Promise<any> {
    return (obj: any) => {
        return call()
            .then(resolve)
            .catch(err => {
                console.error(err);
                next(err);
            });
    }
}


export function fallback(list: (() => Promise<any>)[]): Promise<any> {
    return new Promise((resolve, reject) => {
        list.reverse().reduce((acc, el) => {
            return wrap(el, resolve, acc);
        }, (obj: any) => reject(obj))(null);
    });
}
