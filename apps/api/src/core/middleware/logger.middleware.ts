import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    res.setHeader('X-Request-Id', correlationId);

    const start = Date.now();
    const method = req.method;
    const url = req.originalUrl || req.url;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;

      const statusColor =
        status >= 500
          ? '\x1b[31m'
          : status >= 400
          ? '\x1b[33m'
          : status >= 300
          ? '\x1b[36m'
          : '\x1b[32m';
      const reset = '\x1b[0m';

      console.log(`[HTTP] ${method.padEnd(6)} ${url} ${statusColor}${status}${reset} (${duration}ms)`);
    });

    next();
  }
}
