import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from './../entities/user.entity';
import * as os from 'os';

@Injectable()
export class MonitoringService {
    private readonly logger = new Logger(MonitoringService.name);
    private readonly startTime = Date.now();

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    /**
     * Get overall system health status
     */
    async getSystemHealth() {
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        const memoryUsage = process.memoryUsage();
        const systemMemory = {
            total: os.totalmem(),
            free: os.freemem(),
            used: os.totalmem() - os.freemem()
        };

        // Test database connection
        let dbStatus = 'healthy';
        let dbResponseTime = 0;
        try {
            const start = Date.now();
            await this.userRepository.query('SELECT 1');
            dbResponseTime = Date.now() - start;
        } catch (error) {
            dbStatus = 'unhealthy';
            this.logger.error('Database health check failed', error);
        }

        return {
            status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: {
                seconds: uptime,
                formatted: this.formatUptime(uptime)
            },
            services: {
                database: {
                    status: dbStatus,
                    responseTime: `${dbResponseTime}ms`
                },
                api: {
                    status: 'healthy',
                    uptime: uptime
                }
            },
            resources: {
                memory: {
                    process: {
                        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
                        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                        external: Math.round(memoryUsage.external / 1024 / 1024)
                    },
                    system: {
                        total: Math.round(systemMemory.total / 1024 / 1024 / 1024), // GB
                        free: Math.round(systemMemory.free / 1024 / 1024 / 1024),
                        used: Math.round(systemMemory.used / 1024 / 1024 / 1024),
                        usagePercent: Math.round((systemMemory.used / systemMemory.total) * 100)
                    }
                },
                cpu: {
                    cores: os.cpus().length,
                    model: os.cpus()[0]?.model || 'Unknown',
                    loadAverage: os.loadavg().map(load => Math.round(load * 100) / 100)
                }
            },
            platform: {
                os: os.platform(),
                arch: os.arch(),
                nodeVersion: process.version,
                hostname: os.hostname()
            }
        };
    }

    /**
     * Get performance metrics
     */
    async getPerformanceMetrics() {
        // For now, return basic metrics
        // In production, you'd integrate with APM tools or custom middleware
        const memUsage = process.memoryUsage();

        return {
            timestamp: new Date().toISOString(),
            memory: {
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                rss: Math.round(memUsage.rss / 1024 / 1024)
            },
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            // Placeholder for actual metrics - would be populated by middleware
            requests: {
                total: 0,
                perSecond: 0,
                avgResponseTime: 0
            },
            errors: {
                total: 0,
                rate: 0
            }
        };
    }

    /**
     * Get audit logs with filtering
     */
    async getAuditLogs(filters: {
        page: number;
        limit: number;
        userId?: string;
        action?: string;
        resource?: string;
        startDate?: string;
        endDate?: string;
    }) {
        try {
            const { page, limit, userId, action, resource, startDate, endDate } = filters;
            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    pal.id,
                    pal.user_id,
                    u.email as user_email,
                    pal.admin_id,
                    admin.email as admin_email,
                    pal.permission,
                    pal.action,
                    pal.reason,
                    pal.metadata,
                    pal.created_at
                FROM permission_audit_log pal
                LEFT JOIN users u ON pal.user_id = u.id
                LEFT JOIN users admin ON pal.admin_id = admin.id
                WHERE 1=1
            `;

            const params: any[] = [];
            let paramIndex = 1;

            if (userId) {
                query += ` AND pal.user_id = $${paramIndex++}`;
                params.push(userId);
            }

            if (action) {
                query += ` AND pal.action = $${paramIndex++}`;
                params.push(action);
            }

            if (resource) {
                query += ` AND pal.permission LIKE $${paramIndex++}`;
                params.push(`${resource}:%`);
            }

            if (startDate) {
                query += ` AND pal.created_at >= $${paramIndex++}`;
                params.push(startDate);
            }

            if (endDate) {
                query += ` AND pal.created_at <= $${paramIndex++}`;
                params.push(endDate);
            }

            // Get total count
            const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered`;
            const countResult = await this.userRepository.query(countQuery, params);
            const total = parseInt(countResult[0]?.total || '0');

            // Add pagination
            query += ` ORDER BY pal.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
            params.push(limit, offset);

            const logs = await this.userRepository.query(query, params);

            return {
                data: logs,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            this.logger.error('Failed to fetch audit logs', error);
            return {
                data: [],
                pagination: { page: 1, limit: filters.limit, total: 0, totalPages: 0 }
            };
        }
    }

    /**
     * Get user activity metrics
     */
    async getUserActivityMetrics() {
        try {
            const now = new Date();
            const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Active users (logged in recently)
            const activeUsers24h = await this.userRepository.count({
                where: {
                    lastLoginAt: Between(last24h, now)
                }
            });

            const activeUsers7d = await this.userRepository.count({
                where: {
                    lastLoginAt: Between(last7d, now)
                }
            });

            const activeUsers30d = await this.userRepository.count({
                where: {
                    lastLoginAt: Between(last30d, now)
                }
            });

            // Total users by status
            const usersByStatus = await this.userRepository
                .createQueryBuilder('user')
                .select('user.status', 'status')
                .addSelect('COUNT(*)', 'count')
                .groupBy('user.status')
                .getRawMany();

            // Users by role
            const usersByRole = await this.userRepository
                .createQueryBuilder('user')
                .select('user.role', 'role')
                .addSelect('COUNT(*)', 'count')
                .groupBy('user.role')
                .getRawMany();

            // New users in last 30 days
            const newUsers = await this.userRepository.count({
                where: {
                    createdAt: Between(last30d, now)
                }
            });

            return {
                timestamp: new Date().toISOString(),
                activeUsers: {
                    last24h: activeUsers24h,
                    last7d: activeUsers7d,
                    last30d: activeUsers30d
                },
                usersByStatus: usersByStatus.map(item => ({
                    status: item.status,
                    count: parseInt(item.count)
                })),
                usersByRole: usersByRole.map(item => ({
                    role: item.role,
                    count: parseInt(item.count)
                })),
                newUsers: {
                    last30d: newUsers
                }
            };
        } catch (error) {
            this.logger.error('Failed to fetch user activity metrics', error);
            throw error;
        }
    }

    /**
     * Get database statistics
     */
    async getDatabaseStats() {
        try {
            // Get table sizes
            const tableSizes = await this.userRepository.query(`
                SELECT 
                    schemaname as schema,
                    tablename as table,
                    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
                FROM pg_tables
                WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
                ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
                LIMIT 20
            `);

            // Get database size
            const dbSize = await this.userRepository.query(`
                SELECT pg_size_pretty(pg_database_size(current_database())) as size
            `);

            // Get connection stats
            const connections = await this.userRepository.query(`
                SELECT 
                    count(*) as total,
                    count(*) FILTER (WHERE state = 'active') as active,
                    count(*) FILTER (WHERE state = 'idle') as idle
                FROM pg_stat_activity
                WHERE datname = current_database()
            `);

            return {
                timestamp: new Date().toISOString(),
                database: {
                    size: dbSize[0]?.size || 'Unknown'
                },
                connections: connections[0] || { total: 0, active: 0, idle: 0 },
                tables: tableSizes
            };
        } catch (error) {
            this.logger.error('Failed to fetch database stats', error);
            throw error;
        }
    }

    /**
     * Format uptime in human-readable format
     */
    private formatUptime(seconds: number): string {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

        return parts.join(' ');
    }
}
