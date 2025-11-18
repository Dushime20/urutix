import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly rateLimits = new Map<string, RateLimitInfo>();
  private readonly MAX_REQUESTS = 2; // 2 requests per 30 seconds (every 30 seconds)
  private readonly WINDOW_MS = 30000; // 30 seconds

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();
    const clientId = client.id;

    const now = Date.now();
    const limitInfo = this.rateLimits.get(clientId);

    // Clean up old entries
    if (limitInfo && now > limitInfo.resetTime) {
      this.rateLimits.delete(clientId);
    }

    if (!limitInfo) {
      // First request
      this.rateLimits.set(clientId, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
      });
      return true;
    }

    if (limitInfo.count >= this.MAX_REQUESTS) {
      // Rate limit exceeded
      client.emit('error', {
        message:
          'Rate limit exceeded. Please wait before sending more location updates.',
        retryAfter: Math.ceil((limitInfo.resetTime - now) / 1000),
      });
      return false;
    }

    // Increment count
    limitInfo.count++;
    return true;
  }

  // Clean up expired rate limits
  cleanup() {
    const now = Date.now();
    for (const [clientId, limitInfo] of this.rateLimits.entries()) {
      if (now > limitInfo.resetTime) {
        this.rateLimits.delete(clientId);
      }
    }
  }
}
