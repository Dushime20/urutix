import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityLogService } from '../services/activity-log.service';

@Injectable()
export class ActivityLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ActivityLoggingInterceptor.name);

  constructor(private readonly activityLogService: ActivityLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, headers } = request;

    // Skip logging for certain endpoints
    const skipPaths = [
      '/api/health',
      '/api/activity-logs',
      '/api/notifications/my/unread-count',
      '/socket.io',
    ];

    const shouldSkip = skipPaths.some(path => url.includes(path));
    if (shouldSkip) {
      return next.handle();
    }

    // Extract action and resource from URL and method
    const { action, resource, resourceId } = this.parseRequest(method, url);

    return next.handle().pipe(
      tap({
        next: async (response) => {
          // Only log if user is authenticated
          if (user && user.userId) {
            try {
              await this.activityLogService.logActivity({
                userId: user.userId,
                action,
                resource,
                resourceId,
                details: {
                  method,
                  url,
                  statusCode: 200,
                  userRole: user.role,
                  tenantId: user.tenantId,
                },
                ipAddress: ip || headers['x-forwarded-for'] || headers['x-real-ip'],
                userAgent: headers['user-agent'],
                sessionId: request.session?.id,
              });
            } catch (error) {
              this.logger.error(`Failed to log activity: ${error.message}`);
            }
          }
        },
        error: async (error) => {
          // Log failed requests too
          if (user && user.userId) {
            try {
              await this.activityLogService.logActivity({
                userId: user.userId,
                action: `${action}_FAILED`,
                resource,
                resourceId,
                details: {
                  method,
                  url,
                  statusCode: error.status || 500,
                  error: error.message,
                  userRole: user.role,
                  tenantId: user.tenantId,
                },
                ipAddress: ip || headers['x-forwarded-for'] || headers['x-real-ip'],
                userAgent: headers['user-agent'],
                sessionId: request.session?.id,
              });
            } catch (logError) {
              this.logger.error(`Failed to log error activity: ${logError.message}`);
            }
          }
        },
      }),
    );
  }

  private parseRequest(method: string, url: string): { action: string; resource: string; resourceId?: string } {
    // Remove query parameters
    const cleanUrl = url.split('?')[0];
    
    // Remove /api prefix
    const path = cleanUrl.replace('/api/', '');
    
    // Split path into segments
    const segments = path.split('/').filter(s => s);
    
    // Extract resource (first segment)
    const resource = segments[0] || 'unknown';
    
    // Extract resource ID if it looks like a UUID or number
    let resourceId: string | undefined;
    if (segments.length > 1) {
      const potentialId = segments[1];
      // Check if it's a UUID or numeric ID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(potentialId) || 
          /^\d+$/.test(potentialId)) {
        resourceId = potentialId;
      }
    }
    
    // Determine action based on method and path
    let action = method.toUpperCase();
    
    // Map HTTP methods to more descriptive actions
    const actionMap: Record<string, string> = {
      'POST': 'CREATE',
      'GET': 'VIEW',
      'PUT': 'UPDATE',
      'PATCH': 'UPDATE',
      'DELETE': 'DELETE',
    };
    
    action = actionMap[method.toUpperCase()] || method.toUpperCase();
    
    // Add more specific actions based on path patterns
    if (path.includes('/login')) action = 'LOGIN';
    if (path.includes('/logout')) action = 'LOGOUT';
    if (path.includes('/register')) action = 'REGISTER';
    if (path.includes('/verify')) action = 'VERIFY';
    if (path.includes('/approve')) action = 'APPROVE';
    if (path.includes('/reject')) action = 'REJECT';
    if (path.includes('/suspend')) action = 'SUSPEND';
    if (path.includes('/activate')) action = 'ACTIVATE';
    if (path.includes('/deactivate')) action = 'DEACTIVATE';
    if (path.includes('/assign')) action = 'ASSIGN';
    if (path.includes('/unassign')) action = 'UNASSIGN';
    if (path.includes('/bid')) action = 'BID';
    if (path.includes('/payment')) action = 'PAYMENT';
    if (path.includes('/refund')) action = 'REFUND';
    
    // Combine action with resource for clarity
    const fullAction = `${action}_${resource.toUpperCase()}`;
    
    return { action: fullAction, resource, resourceId };
  }
}
