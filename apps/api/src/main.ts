import 'reflect-metadata';
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
  app.enableCors({
    origin: ENV.CORS_ORIGIN,
    credentials: true,
  });

  // Serve Static Uploads
  const uploadPath = path.resolve(process.cwd(), ENV.LOCAL_STORAGE_PATH);
  app.useStaticAssets(uploadPath, { prefix: '/uploads' });

  // Global Exceptions Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = ENV.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 NestJS Reservy API Server running on port ${port} [${ENV.NODE_ENV}]`);
  console.log(`📍 Health Check: http://localhost:${port}/health`);
}

bootstrap();
