import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { MetricsService } from '../observability/metrics.service';
import { RequestWithContext } from '../observability/request-context.middleware';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly metricsService?: MetricsService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithContext>();
    const requestId = request.requestId || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error occurred';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message || message;
        error = (res as any).error || error;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        error = 'Conflict';
        message = 'A record with the provided unique value already exists';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        error = 'Not Found';
        message = 'Requested record was not found';
      } else if (exception.code === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        message = 'Invalid foreign key reference';
      } else {
        status = HttpStatus.BAD_REQUEST;
        error = 'Database Request Error';
        message = exception.message;
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      error = 'Bad Request';
      message = 'Invalid query or input payload';
    } else if (exception instanceof Error) {
      message = process.env.NODE_ENV === 'production' ? 'Internal server error occurred' : exception.message;
      error = exception.name;
    }

    this.metricsService?.record(status, 0);

    if (process.env.NODE_ENV === 'production') {
      this.logger.error(
        JSON.stringify({
          level: 'error',
          timestamp: new Date().toISOString(),
          requestId,
          method: request.method,
          url: request.url,
          statusCode: status,
          error,
          message,
        }),
      );
    } else if (process.env.NODE_ENV !== 'test') {
      this.logger.error(
        `[${requestId}] [${request.method}] ${request.url} - Status: ${status} - Error: ${JSON.stringify(message)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
      error,
      message,
    });
  }
}
