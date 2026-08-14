import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  getHealth(): any {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      modules: {
        financial: 'FinancialModule loaded',
        fleet: 'FleetModule loaded',
        auth: 'AuthModule loaded',
      },
    };
  }

  @Get('test-financial')
  testFinancial(): any {
    return {
      message: 'Financial module test endpoint',
      timestamp: new Date().toISOString(),
      status: 'working',
    };
  }
}
