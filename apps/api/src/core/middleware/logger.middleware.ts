import { Injectable, NestMiddleware } from '@nestjs/common';
import crypto from 'crypto';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: (error?: any) => void) {
    const correlationId = (req?.headers?.['x-request-id'] as string) || crypto.randomUUID();
    if (typeof res?.setHeader === 'function') {
      res.setHeader('X-Request-Id', correlationId);
    } else if (typeof res?.header === 'function') {
      res.header('X-Request-Id', correlationId);
    }

    const start = Date.now();
    const method = req?.method || 'GET';
    const url = req?.originalUrl || req?.url || '/';

    // Immediate log when request reaches NestJS Express pipeline
    console.log(`[HTTP INCOMING] ${method.padEnd(6)} ${url} (ip: ${req.ip || req.headers['x-real-ip'] || 'unknown'}, correlationId: ${correlationId})`);

    if (typeof res?.on === 'function') {
      res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode || 200;

        const statusColor =
          status >= 500
            ? '\x1b[31m'
            : status >= 400
            ? '\x1b[33m'
            : status >= 300
            ? '\x1b[36m'
            : '\x1b[32m';
        const reset = '\x1b[0m';

        console.log(`[HTTP FINISH]   ${method.padEnd(6)} ${url} ${statusColor}${status}${reset} (${duration}ms)`);
      });
    }

    next();
  }
}
