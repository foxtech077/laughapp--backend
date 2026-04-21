import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  private readonly sensitiveKeys = new Set([
    'password',
    'passwordHash',
    'refreshToken',
    'accessToken',
    'token',
    'authorization',
  ]);
  private readonly maxBodyLogLength = 2048;

  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') return body;
    if (Array.isArray(body)) return body.map((item) => this.sanitizeBody(item));

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      if (this.sensitiveKeys.has(key)) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      sanitized[key] = this.sanitizeBody(value);
    }
    return sanitized;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const now = Date.now();

    if (!url.includes('/auth/')) {
      const bodyString = JSON.stringify(this.sanitizeBody(body));
      const truncatedBody =
        bodyString.length > this.maxBodyLogLength
          ? `${bodyString.slice(0, this.maxBodyLogLength)}...[TRUNCATED]`
          : bodyString;

      this.logger.log(`➡️  ${method} ${url} - Request body: ${truncatedBody}`);
    } else {
      this.logger.log(`➡️  ${method} ${url}`);
    }

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const duration = Date.now() - now;
        this.logger.log(`⬅️  ${method} ${url} ${statusCode} - ${duration}ms`);
      }),
    );
  }
}
