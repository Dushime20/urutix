import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface LendingResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  requestId: string;
}

@Injectable()
export class LendingResponseInterceptor<T>
  implements NestInterceptor<T, LendingResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<LendingResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const requestId = request.headers['x-request-id'] || 'unknown';

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        message: 'Operation completed successfully',
        timestamp: new Date().toISOString(),
        requestId,
      })),
    );
  }
}
