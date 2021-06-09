import * as express from 'express';
import * as winston from 'winston';

const consoleLog = new winston.transports.Console();

export const requestLogger = createRequestLogger(consoleLog);
export const errorLogger = createErrorLogger(consoleLog);

function createRequestLogger(transports: winston.transport|winston.transport[]): any {
    const reqLogger = winston.createLogger({
        format: getRequestLogFormatter(),
        transports: transports
    });

    return function logRequest(req: express.Request, res: express.Response, next: Function): void {
        reqLogger.info({req, res});
        next();
    };
}

function createErrorLogger(transports: winston.transport|winston.transport[]): any {
    const errLogger = winston.createLogger({
        level: 'error',
        transports: transports
    });

    return function logError(err: any, req: express.Request, res: express.Response, next: Function): void {
        errLogger.error({err, req, res});
        next();
    };
}

function getRequestLogFormatter() {
    const {combine, timestamp, printf} = winston.format;

    return combine(
        timestamp(),
        printf(info => {
            const {req} = <any>info.message;
            return `${info.timestamp} ${info.level}: ${req.hostname}${req.port || ''}${req.originalUrl}`;
        })
    );
}
