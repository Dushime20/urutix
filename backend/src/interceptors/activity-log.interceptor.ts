import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityLogService } from '../services/activity-log.service';

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
    constructor(private readonly activityLogService: ActivityLogService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, user, ip, headers } = request;

        // Skip logging for certain endpoints
        const skipPaths = [
            '/api/health',
            '/api/metrics',
            '/socket.io',
            '/favicon.ico',
        ];

        if (skipPaths.some(path => url.includes(path))) {
            return next.handle();
        }

        // Determine action based on HTTP method
        const actionMap: Record<string, string> = {
            GET: 'VIEW',
            POST: 'CREATE',
            PUT: 'UPDATE',
            PATCH: 'UPDATE',
            DELETE: 'DELETE',
        };

        const action = actionMap[method] || method;

        // Extract resource from URL
        const resource = this.extractResource(url);

        // Log the activity after the request completes
        return next.handle().pipe(
            tap({
                next: () => {
                    // Only log if user is authenticated
                    if (user?.id) {
                        this.activityLogService.logActivity({
                            userId: user.id,
                            action: `${action}_${resource.toUpperCase()}`,
                            resource: resource,
                            resourceId: this.extractResourceId(url),
                            ipAddress: ip || headers['x-forwarded-for'] || headers['x-real-ip'],
                            userAgent: headers['user-agent'],
                            sessionId: request.session?.id,
                            details: {
                                method,
                                url,
                                statusCode: 200,
                            },
                        }).catch(err => {
                            console.error('Failed to log activity:', err);
                        });
                    }
                },
                error: (error) => {
                    // Log failed attempts
                    if (user?.id) {
                        this.activityLogService.logActivity({
                            userId: user.id,
                            action: `${action}_${resource.toUpperCase()}_FAILED`,
                            resource: resource,
                            resourceId: this.extractResourceId(url),
                            ipAddress: ip || headers['x-forwarded-for'] || headers['x-real-ip'],
                            userAgent: headers['user-agent'],
                            sessionId: request.session?.id,
                            details: {
                                method,
                                url,
                                error: error.message,
                                statusCode: error.status || 500,
                            },
                        }).catch(err => {
                            console.error('Failed to log activity:', err);
                        });
                    }
                },
            }),
        );
    }

    private extractResource(url: string): string {
        // Remove query parameters
        const cleanUrl = url.split('?')[0];
        
        // Extract resource from URL pattern
        // e.g., /api/admin/tenants -> tenants
        // e.g., /api/loads/123 -> loads
        const parts = cleanUrl.split('/').filter(Boolean);
        
        // Find the main resource (usually after 'api')
        const apiIndex = parts.indexOf('api');
        if (apiIndex !== -1 && parts.length > apiIndex + 1) {
            // Skip 'admin' or other prefixes
            let resourceIndex = apiIndex + 1;
            if (parts[resourceIndex] === 'admin' && parts.length > resourceIndex + 1) {
                resourceIndex++;
            }
            return parts[resourceIndex] || 'unknown';
        }
        
        return 'unknown';
    }

    private extractResourceId(url: string): string | undefined {
        // Extract UUID or numeric ID from URL
        const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
        const match = url.match(uuidRegex);
        if (match) {
            return match[0];
        }

        // Try to extract numeric ID
        const numericMatch = url.match(/\/(\d+)(?:\/|$|\?)/);
        if (numericMatch) {
            return numericMatch[1];
        }

        return undefined;
    }
}
