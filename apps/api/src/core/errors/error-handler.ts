import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { DomainError, DomainErrorCode } from '@reservy/domain';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.originalUrl || req.url;

  // 1. Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors;
    // Extract first friendly error message from field errors or form errors
    const firstField = Object.keys(fieldErrors)[0];
    const firstMsg = firstField && fieldErrors[firstField]?.[0]
      ? `${firstField}: ${fieldErrors[firstField]![0]}`
      : (err.errors[0]?.message || 'اطلاعات ارسالی نامعتبر است');

    console.warn(`\x1b[33m[VALIDATION_ERROR]\x1b[0m ${method} ${path} - 400 Bad Request`);
    console.warn(`  ↳ Reason: ${firstMsg}`);
    console.warn(`  ↳ Details:`, JSON.stringify(fieldErrors, null, 2));

    res.status(400).json({
      error: {
        code: DomainErrorCode.VALIDATION_ERROR,
        message: firstMsg,
        details: fieldErrors,
      },
    });
    return;
  }

  // 2. Handle Pure Domain Errors
  if (err instanceof DomainError) {
    let statusCode = 400;
    if (err.code === DomainErrorCode.UNAUTHENTICATED) statusCode = 401;
    if (err.code === DomainErrorCode.FORBIDDEN_PERMISSION || err.code === DomainErrorCode.UNAUTHORIZED_TENANT_ACCESS) statusCode = 403;
    if (
      err.code === DomainErrorCode.BOOKING_NOT_FOUND ||
      err.code === DomainErrorCode.SERVICE_NOT_FOUND ||
      err.code === DomainErrorCode.STAFF_NOT_FOUND ||
      err.code === DomainErrorCode.ORGANIZATION_NOT_FOUND
    ) {
      statusCode = 404;
    }
    if (err.code === DomainErrorCode.CONCURRENCY_CONFLICT || err.code === DomainErrorCode.BOOKING_SLOT_UNAVAILABLE) {
      statusCode = 409;
    }

    console.warn(`\x1b[33m[DOMAIN_ERROR]\x1b[0m ${method} ${path} - ${statusCode} [${err.code}] - ${err.message}`);

    res.status(statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // 3. Handle Unexpected Server Errors
  console.error(`\x1b[31m[UNHANDLED_ERROR]\x1b[0m ${method} ${path} - 500 Internal Server Error`);
  console.error(`  ↳ Stack:`, err.stack || err);

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'یک خطای غیرمنتظره در سرور رخ داده است. لطفاً مجدداً تلاش کنید.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
  });
}
