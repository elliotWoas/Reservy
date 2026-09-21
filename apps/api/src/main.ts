import 'reflect-metadata';
import './config/env';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import path from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ENV } from './config/env';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Security & Headers
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  
  const corsOrigin = ENV.CORS_ORIGIN.includes(',')
    ? ENV.CORS_ORIGIN.split(',').map((s) => s.trim())
    : ENV.CORS_ORIGIN === '*' ? true : ENV.CORS_ORIGIN;

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Optional Global API Prefix (e.g. 'reservy-api' or 'api/reservy')
  const apiPrefix = ENV.API_PREFIX.replace(/^\/+|\/+$/g, '');
  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
  }

  // Serve Static Uploads
  const uploadPath = path.resolve(process.cwd(), ENV.LOCAL_STORAGE_PATH);
  const staticPrefix = apiPrefix ? `/${apiPrefix}/uploads` : '/uploads';
  app.useStaticAssets(uploadPath, { prefix: staticPrefix });

  // Global Exceptions Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = ENV.PORT || 4002;
  await app.listen(port);

  const healthPath = apiPrefix ? `/${apiPrefix}/health` : '/health';
  console.log(`🚀 NestJS Reservy API Server running on port ${port} [${ENV.NODE_ENV}]`);
  console.log(`📍 Health Check: http://localhost:${port}${healthPath}`);
}

bootstrap();
