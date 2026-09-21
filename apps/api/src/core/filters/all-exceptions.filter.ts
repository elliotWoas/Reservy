import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ZodError } from 'zod';
import { DomainError, DomainErrorCode } from '@reservy/domain';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(@Optional() private readonly httpAdapterHost?: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();
    const request = ctx.getRequest<any>();

    const httpAdapter = this.httpAdapterHost?.httpAdapter;
    const method = httpAdapter
      ? httpAdapter.getRequestMethod(request)
      : request?.method || 'UNKNOWN';
    const path = httpAdapter
      ? httpAdapter.getRequestUrl(request)
      : request?.originalUrl || request?.url || '';

    const sendResponse = (statusCode: number, errorBody: { code: string; message: string; details?: any }) => {
      const responsePayload = { error: errorBody };
      if (httpAdapter) {
        httpAdapter.reply(response, responsePayload, statusCode);
      } else if (typeof response?.status === 'function' && typeof response?.json === 'function') {
        response.status(statusCode).json(responsePayload);
      } else if (typeof response?.code === 'function' && typeof response?.send === 'function') {
        response.code(statusCode).send(responsePayload);
      } else {
        response.statusCode = statusCode;
        if (typeof response?.setHeader === 'function') {
          response.setHeader('Content-Type', 'application/json');
        }
        response?.end?.(JSON.stringify(responsePayload));
      }
    };

    // 1. Zod Schema Validation Error
    if (exception instanceof ZodError) {
      const fieldErrors = exception.flatten().fieldErrors;
      const firstField = Object.keys(fieldErrors)[0];
      const firstMsg =
        firstField && fieldErrors[firstField]?.[0]
          ? `${firstField}: ${fieldErrors[firstField]![0]}`
          : exception.errors[0]?.message || 'اطلاعات ارسالی نامعتبر است';

      console.warn(`\x1b[33m[VALIDATION_ERROR]\x1b[0m ${method} ${path} - 400 Bad Request`);
      console.warn(`  ↳ Reason: ${firstMsg}`);

      return sendResponse(HttpStatus.BAD_REQUEST, {
        code: DomainErrorCode.VALIDATION_ERROR,
        message: firstMsg,
        details: fieldErrors,
      });
    }

    // 2. Pure Domain Error
    if (exception instanceof DomainError) {
      let statusCode = HttpStatus.BAD_REQUEST;
      if (exception.code === DomainErrorCode.UNAUTHENTICATED) statusCode = HttpStatus.UNAUTHORIZED;
      if (
        exception.code === DomainErrorCode.FORBIDDEN_PERMISSION ||
        exception.code === DomainErrorCode.UNAUTHORIZED_TENANT_ACCESS
      ) {
        statusCode = HttpStatus.FORBIDDEN;
      }
      if (
        exception.code === DomainErrorCode.BOOKING_NOT_FOUND ||
        exception.code === DomainErrorCode.SERVICE_NOT_FOUND ||
        exception.code === DomainErrorCode.STAFF_NOT_FOUND ||
        exception.code === DomainErrorCode.ORGANIZATION_NOT_FOUND ||
        exception.code === DomainErrorCode.CUSTOMER_NOT_FOUND ||
        exception.code === DomainErrorCode.PAYMENT_NOT_FOUND
      ) {
        statusCode = HttpStatus.NOT_FOUND;
      }
      if (
        exception.code === DomainErrorCode.CONCURRENCY_CONFLICT ||
        exception.code === DomainErrorCode.BOOKING_SLOT_UNAVAILABLE ||
        exception.code === DomainErrorCode.USER_ALREADY_EXISTS ||
        exception.code === DomainErrorCode.SLUG_ALREADY_EXISTS
      ) {
        statusCode = HttpStatus.CONFLICT;
      }

      console.warn(
        `\x1b[33m[DOMAIN_ERROR]\x1b[0m ${method} ${path} - ${statusCode} [${exception.code}] - ${exception.message}`
      );

      return sendResponse(statusCode, {
        code: exception.code,
        message: exception.message,
        details: exception.details,
      });
    }

    // 3. NestJS Built-in HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resPayload: any = exception.getResponse();
      const message =
        typeof resPayload === 'object' && resPayload.message
          ? Array.isArray(resPayload.message)
            ? resPayload.message.join(', ')
            : resPayload.message
          : exception.message;

      console.warn(`\x1b[33m[HTTP_EXCEPTION]\x1b[0m ${method} ${path} - ${status} - ${message}`);

      return sendResponse(status, {
        code: typeof resPayload === 'object' && resPayload.code ? resPayload.code : 'HTTP_ERROR',
        message,
        details: typeof resPayload === 'object' && resPayload.details ? resPayload.details : undefined,
      });
    }

    // 4. Unhandled Internal Server Error
    console.error(`\x1b[31m[UNHANDLED_ERROR]\x1b[0m ${method} ${path} - 500 Internal Server Error`);
    console.error(`  ↳ Stack:`, (exception as Error)?.stack || exception);

    return sendResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'یک خطای غیرمنتظره در سرور رخ داده است. لطفاً مجدداً تلاش کنید.',
    });
  }
}
