import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAttempt: number;
  blockedUntil?: number;
}

interface IpInfo {
  ip: string;
  userAgent?: string;
  country?: string;
  isp?: string;
}

@Injectable()
export class EnhancedRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(EnhancedRateLimitGuard.name);
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private readonly LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes
  private readonly EXTENDED_LOCKOUT_MS = 2 * 60 * 60 * 1000; // 2 hours for repeated violations
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

  constructor() {
    // Clean up old entries periodically
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);
    const userAgent = request.headers['user-agent'];
    const key = `auth_${ip}`;

    const now = Date.now();
    const entry = this.rateLimitMap.get(key);

    // Log the attempt
    this.logger.debug(
      `Rate limit check for IP: ${ip}, User-Agent: ${userAgent}`,
    );

    if (entry) {
      // Check if IP is blocked
      if (entry.blockedUntil && now < entry.blockedUntil) {
        const remainingTime = Math.ceil((entry.blockedUntil - now) / 1000 / 60);
        this.logger.warn(
          `Blocked IP attempting access: ${ip}, remaining time: ${remainingTime} minutes`,
        );
        throw new HttpException(
          `Too many failed attempts. Please try again in ${remainingTime} minutes.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Check if window has expired
      if (now > entry.resetTime) {
        this.rateLimitMap.delete(key);
        this.logger.debug(`Rate limit window expired for IP: ${ip}`);
      } else {
        // Check if account is locked
        if (entry.count >= this.MAX_ATTEMPTS) {
          const lockoutEnd = entry.resetTime + this.LOCKOUT_MS;
          if (now < lockoutEnd) {
            const remainingTime = Math.ceil((lockoutEnd - now) / 1000 / 60);
            this.logger.warn(
              `Rate limit exceeded for IP: ${ip}, remaining time: ${remainingTime} minutes`,
            );
            throw new HttpException(
              `Too many failed attempts. Please try again in ${remainingTime} minutes.`,
              HttpStatus.TOO_MANY_REQUESTS,
            );
          } else {
            // Reset after lockout period
            this.rateLimitMap.delete(key);
            this.logger.debug(`Rate limit lockout expired for IP: ${ip}`);
          }
        }
      }
    }

    return true;
  }

  recordFailedAttempt(ip: string, userAgent?: string): void {
    const key = `auth_${ip}`;
    const now = Date.now();
    const entry = this.rateLimitMap.get(key);

    if (entry && now <= entry.resetTime) {
      entry.count++;
      entry.lastAttempt = now;

      // Implement progressive lockout
      if (entry.count >= this.MAX_ATTEMPTS * 2) {
        // Extended lockout for repeated violations
        entry.blockedUntil = now + this.EXTENDED_LOCKOUT_MS;
        this.logger.warn(
          `Extended lockout applied to IP: ${ip} for repeated violations`,
        );
      } else if (entry.count >= this.MAX_ATTEMPTS) {
        // Regular lockout
        entry.blockedUntil = now + this.LOCKOUT_MS;
        this.logger.warn(
          `Lockout applied to IP: ${ip} after ${entry.count} failed attempts`,
        );
      }
    } else {
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
        lastAttempt: now,
      });
    }

    this.logger.warn(
      `Failed authentication attempt recorded for IP: ${ip}, User-Agent: ${userAgent}, Count: ${entry?.count || 1}`,
    );
  }

  recordSuccessfulAttempt(ip: string): void {
    const key = `auth_${ip}`;
    this.rateLimitMap.delete(key);
    this.logger.debug(
      `Successful authentication, cleared rate limit for IP: ${ip}`,
    );
  }

  getRateLimitInfo(
    ip: string,
  ): { count: number; remainingAttempts: number; resetTime?: number } | null {
    const key = `auth_${ip}`;
    const entry = this.rateLimitMap.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.resetTime) {
      this.rateLimitMap.delete(key);
      return null;
    }

    return {
      count: entry.count,
      remainingAttempts: Math.max(0, this.MAX_ATTEMPTS - entry.count),
      resetTime: entry.resetTime,
    };
  }

  isBlocked(ip: string): boolean {
    const key = `auth_${ip}`;
    const entry = this.rateLimitMap.get(key);

    if (!entry) {
      return false;
    }

    const now = Date.now();
    return !!(entry.blockedUntil && now < entry.blockedUntil);
  }

  private getClientIp(request: Request): string {
    // Check for forwarded headers first (for proxy setups)
    const forwardedFor = request.headers['x-forwarded-for'] as string;
    if (forwardedFor) {
      // Take the first IP in the list (original client IP)
      return forwardedFor.split(',')[0].trim();
    }

    const realIp = request.headers['x-real-ip'] as string;
    if (realIp) {
      return realIp;
    }

    // Fallback to connection info
    const remoteAddress =
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown';

    // Handle IPv6 addresses
    if (remoteAddress.startsWith('::ffff:')) {
      return remoteAddress.substring(7);
    }

    return remoteAddress;
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.rateLimitMap.entries()) {
      if (
        now > entry.resetTime &&
        (!entry.blockedUntil || now > entry.blockedUntil)
      ) {
        this.rateLimitMap.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(
        `Cleaned up ${cleanedCount} expired rate limit entries`,
      );
    }
  }

  // Method to get statistics for monitoring
  getStatistics(): {
    totalEntries: number;
    blockedIps: number;
    activeEntries: number;
  } {
    const now = Date.now();
    let blockedCount = 0;
    let activeCount = 0;

    for (const entry of this.rateLimitMap.values()) {
      if (entry.blockedUntil && now < entry.blockedUntil) {
        blockedCount++;
      }
      if (now <= entry.resetTime) {
        activeCount++;
      }
    }

    return {
      totalEntries: this.rateLimitMap.size,
      blockedIps: blockedCount,
      activeEntries: activeCount,
    };
  }
}
