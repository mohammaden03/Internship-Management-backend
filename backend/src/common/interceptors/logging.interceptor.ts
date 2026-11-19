import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../observability/metrics.service';
import { RequestWithContext } from '../observability/request-context.middleware';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const { method, url, ip } = request;
    const requestId = request.requestId || 'unknown';
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const durationMs = Date.now() - start;

        this.metricsService.record(statusCode, durationMs);

        if (process.env.NODE_ENV === 'production') {
          this.logger.log(
            JSON.stringify({
              level: 'info',
              timestamp: new Date().toISOString(),
              requestId,
              method,
              url,
              statusCode,
              durationMs,
              ip,
            }),
          );
        } else if (process.env.NODE_ENV !== 'test') {
          this.logger.log(`[${requestId}] [${method}] ${url} ${statusCode} +${durationMs}ms`);
        }
      }),
    );
  }
}
