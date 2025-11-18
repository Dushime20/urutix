import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

interface RateLimitInfo {
  count: number;
  resetTime: number;
  lastRequestTime: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly rateLimits = new Map<string, RateLimitInfo>();

  // Rate limit configuration
  private readonly MAX_REQUESTS = 10; // 10 requests per window
  private readonly WINDOW_MS = 60000; // 1 minute window
  private readonly MIN_INTERVAL_MS = 1000; // Minimum 1 second between requests

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const clientId = this.getClientId(request);
    const now = Date.now();

    // Clean up old entries
    this.cleanup();

    const limitInfo = this.rateLimits.get(clientId);

    // Check if window has reset
    if (limitInfo && now > limitInfo.resetTime) {
      this.rateLimits.delete(clientId);
    }

    // Check minimum interval between requests
    if (limitInfo && now - limitInfo.lastRequestTime < this.MIN_INTERVAL_MS) {
      throw new HttpException(
        {
          message:
            'Too many requests. Please wait before making another request.',
          retryAfter: Math.ceil(
            (this.MIN_INTERVAL_MS - (now - limitInfo.lastRequestTime)) / 1000,
          ),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!limitInfo) {
      // First request in window
      this.rateLimits.set(clientId, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
        lastRequestTime: now,
      });
      return true;
    }

    if (limitInfo.count >= this.MAX_REQUESTS) {
      // Rate limit exceeded
      throw new HttpException(
        {
          message:
            'Rate limit exceeded. Please wait before making more requests.',
          retryAfter: Math.ceil((limitInfo.resetTime - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment count and update last request time
    limitInfo.count++;
    limitInfo.lastRequestTime = now;
    return true;
  }

  private getClientId(request: Request): string {
    // Use user ID if available, otherwise use IP address
    const userId = (request as any).user?.userId;
    const ip = request.ip || request.connection.remoteAddress || 'unknown';

    return userId ? `user:${userId}` : `ip:${ip}`;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [clientId, limitInfo] of this.rateLimits.entries()) {
      if (now > limitInfo.resetTime) {
        this.rateLimits.delete(clientId);
      }
    }
  }

  // Method to get current rate limit info for monitoring
  getRateLimitInfo(clientId: string): RateLimitInfo | undefined {
    return this.rateLimits.get(clientId);
  }

  // Method to reset rate limit for a specific client (admin use)
  resetRateLimit(clientId: string): void {
    this.rateLimits.delete(clientId);
  }
}
