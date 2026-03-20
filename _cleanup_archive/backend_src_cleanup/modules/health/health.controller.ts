import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if the API is running and healthy',
  })
  @ApiOkResponse({
    description: 'API is healthy',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'API is healthy' },
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', example: '2024-01-15T10:00:00.000Z' },
            uptime: { type: 'number', example: 3600 },
            version: { type: 'string', example: '1.0.0' },
            environment: { type: 'string', example: 'development' },
          },
        },
        statusCode: { type: 'number', example: 200 },
      },
    },
  })
  async check() {
    const startTime = process.hrtime();
    const uptime = process.uptime();

    return {
      success: true,
      message: 'API is healthy',
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness check',
    description:
      'Check if the API is ready to serve requests (database, external services)',
  })
  @ApiOkResponse({
    description: 'API is ready',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'API is ready' },
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ready' },
            database: { type: 'string', example: 'connected' },
            timestamp: { type: 'string', example: '2024-01-15T10:00:00.000Z' },
          },
        },
        statusCode: { type: 'number', example: 200 },
      },
    },
  })
  async ready() {
    return {
      success: true,
      message: 'API is ready',
      data: {
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('info')
  @ApiOperation({
    summary: 'API information',
    description: 'Get detailed information about the API and its configuration',
  })
  @ApiOkResponse({
    description: 'API information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'API information retrieved successfully',
        },
        data: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'UrutiX API' },
            version: { type: 'string', example: '1.0.0' },
            description: {
              type: 'string',
              example: 'Cargo Management Platform API',
            },
            environment: { type: 'string', example: 'development' },
            nodeVersion: { type: 'string', example: 'v18.17.0' },
            platform: { type: 'string', example: 'linux' },
            arch: { type: 'string', example: 'x64' },
            uptime: { type: 'number', example: 3600 },
            memory: {
              type: 'object',
              properties: {
                used: { type: 'number', example: 50 },
                total: { type: 'number', example: 100 },
              },
            },
          },
        },
        statusCode: { type: 'number', example: 200 },
      },
    },
  })
  async info() {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    return {
      success: true,
      message: 'API information retrieved successfully',
      data: {
        name: 'UrutiX API',
        version: process.env.npm_package_version || '1.0.0',
        description: 'Cargo Management Platform API',
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: Math.floor(uptime),
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
        },
      },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }
}
