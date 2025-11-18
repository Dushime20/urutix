import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private readonly LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);
    const key = `auth_${ip}`;

    const now = Date.now();
    const entry = this.rateLimitMap.get(key);

    if (entry) {
      // Check if window has expired
      if (now > entry.resetTime) {
        this.rateLimitMap.delete(key);
      } else {
        // Check if account is locked
        if (entry.count >= this.MAX_ATTEMPTS) {
          const lockoutEnd = entry.resetTime + this.LOCKOUT_MS;
          if (now < lockoutEnd) {
            throw new HttpException(
              'Too many failed attempts. Please try again later.',
              HttpStatus.TOO_MANY_REQUESTS,
            );
          } else {
            // Reset after lockout period
            this.rateLimitMap.delete(key);
          }
        }
      }
    }

    return true;
  }

  recordFailedAttempt(ip: string): void {
    const key = `auth_${ip}`;
    const now = Date.now();
    const entry = this.rateLimitMap.get(key);

    if (entry && now <= entry.resetTime) {
      entry.count++;
    } else {
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
      });
    }
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string) ||
      (request.headers['x-real-ip'] as string) ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}
