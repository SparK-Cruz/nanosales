export function rawToString(raw: number) {
    var str = raw.toFixed(0);
    if (str.indexOf('e+') === -1)
        return str;

    str = str.replace('.', '').split('e+').reduce(function(base: string, power: string) {
        return base + Array(Number.parseInt(power) - base.length + 2).join('0');
    });

    return str;
};
