import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { LendingException } from '../exceptions/lending.exceptions';

@Catch(LendingException)
export class LendingExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(LendingExceptionFilter.name);

  catch(exception: LendingException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // Log the error with structured information
    this.logger.error('Lending operation failed', {
      error: {
        code: exception.code,
        message: exception.message,
        details: exception.details,
      },
      request: {
        method: request.method,
        url: request.url,
        userId: request.user?.id,
        tenantId: request.user?.tenantId,
        ip: request.ip,
      },
      timestamp: new Date().toISOString(),
    });

    // Return structured error response
    const errorResponse = {
      success: false,
      error: {
        code: exception.code,
        message: exception.message,
        details: exception.details,
        timestamp: new Date().toISOString(),
        requestId: request.headers['x-request-id'] || 'unknown',
      },
    };

    response.status(exception.statusCode).json(errorResponse);
  }
}
