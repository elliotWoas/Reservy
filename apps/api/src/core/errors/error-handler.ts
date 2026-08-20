import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { DomainError, DomainErrorCode } from '@reservy/domain';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: DomainErrorCode.VALIDATION_ERROR,
        message: 'اطلاعات ارسالی نامعتبر است',
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  // Handle Domain Errors
  if (err instanceof DomainError) {
    let statusCode = 400;
    if (err.code === DomainErrorCode.UNAUTHENTICATED) statusCode = 401;
    if (err.code === DomainErrorCode.FORBIDDEN_PERMISSION || err.code === DomainErrorCode.UNAUTHORIZED_TENANT_ACCESS) statusCode = 403;
    if (err.code === DomainErrorCode.BOOKING_NOT_FOUND || err.code === DomainErrorCode.SERVICE_NOT_FOUND || err.code === DomainErrorCode.STAFF_NOT_FOUND || err.code === DomainErrorCode.ORGANIZATION_NOT_FOUND) statusCode = 404;
    if (err.code === DomainErrorCode.CONCURRENCY_CONFLICT || err.code === DomainErrorCode.BOOKING_SLOT_UNAVAILABLE) statusCode = 409;

    res.status(statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  console.error('[UNHANDLED_SERVER_ERROR]', err);

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'یک خطای غیرمنتظره در سرور رخ داده است. لطفاً مجدداً تلاش کنید.',
    },
  });
}
