import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import * as express from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { TenantReportCategory, TenantReportsService } from './tenant-reports.service';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ReportsController {
  constructor(private readonly reports: TenantReportsService) {}

  private scope(req: { user?: { userId?: string; id?: string; role?: string; tenantId?: string; email?: string } }) {
    return {
      userId: req.user?.userId || req.user?.id || '',
      role: req.user?.role || '',
      tenantId: req.user?.tenantId || '',
      email: req.user?.email,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Preview a role-scoped report for the current user' })
  @ApiQuery({ name: 'category', required: true })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async preview(
    @Request() req: { user?: { userId?: string; id?: string; role?: string; tenantId?: string; email?: string } },
    @Query('category') category: TenantReportCategory,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    if (!category) {
      throw new BadRequestException('category is required');
    }
    const scope = this.scope(req);
    const data = await this.reports.generate(scope.tenantId, {
      category,
      status,
      priority,
      search,
      dateFrom,
      dateTo,
    }, scope);
    return {
      success: true,
      statusCode: 200,
      message: `${data.title} report generated`,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('export')
  @ApiOperation({ summary: 'Download a role-scoped report as CSV' })
  async export(
    @Res() res: express.Response,
    @Request() req: { user?: { userId?: string; id?: string; role?: string; tenantId?: string; email?: string } },
    @Query('category') category: TenantReportCategory,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<void> {
    if (!category) {
      throw new BadRequestException('category is required');
    }
    const scope = this.scope(req);
    const report = await this.reports.generate(scope.tenantId, {
      category,
      status,
      priority,
      search,
      dateFrom,
      dateTo,
    }, scope);
    const csv = this.reports.toCsv(report);
    const stamp = new Date().toISOString().split('T')[0];
    const filename = `${report.title.toLowerCase().replace(/\s+/g, '-')}-${stamp}.csv`;
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(csv);
  }
}
