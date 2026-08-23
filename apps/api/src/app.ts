import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';
import { ENV } from './config/env';
import { errorHandler } from './core/errors/error-handler';
import { authRouter } from './modules/auth/auth.controller';
import { organizationRouter } from './modules/organization/organization.controller';
import { catalogRouter } from './modules/catalog/catalog.controller';
import { availabilityRouter } from './modules/availability/availability.controller';
import { bookingRouter } from './modules/booking/booking.controller';
import { paymentRouter } from './modules/payment/payment.controller';
import { crmRouter } from './modules/crm/crm.controller';
import { reportingRouter } from './modules/reporting/reporting.controller';
import { adminRouter } from './modules/admin/admin.controller';
import { publicRouter } from './modules/public/public.controller';

export function createApp() {
  const app = express();

  // Security & Middleware
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Correlation ID & Request Logger middleware
  app.use((req, res, next) => {
    const correlationId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    res.setHeader('X-Request-Id', correlationId);

    const start = Date.now();
    const method = req.method;
    const url = req.originalUrl || req.url;

    // Log on response finish
    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;

      const statusColor =
        status >= 500
          ? '\x1b[31m' // Red
          : status >= 400
          ? '\x1b[33m' // Yellow
          : status >= 300
          ? '\x1b[36m' // Cyan
          : '\x1b[32m'; // Green
      const reset = '\x1b[0m';

      console.log(
        `[HTTP] ${method.padEnd(6)} ${url} ${statusColor}${status}${reset} (${duration}ms)`
      );
    });

    next();
  });

  // Serve static uploads
  const uploadPath = path.resolve(process.cwd(), ENV.LOCAL_STORAGE_PATH);
  app.use('/uploads', express.static(uploadPath));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mount API Routers
  app.use('/public', publicRouter);
  app.use('/auth', authRouter);
  app.use('/organizations', organizationRouter);
  app.use('/catalog', catalogRouter);
  app.use('/availability', availabilityRouter);
  app.use('/bookings', bookingRouter);
  app.use('/payments', paymentRouter);
  app.use('/crm', crmRouter);
  app.use('/reporting', reportingRouter);
  app.use('/admin', adminRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
