import {
  Controller,
  Get,
  Header,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as express from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsAccessGuard } from './reports-access.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import {
  TenantReportQuery,
  TenantReportsService,
  ReportScope,
} from './tenant-reports.service';

type ReportRequest = {
  user?: {
    userId?: string;
    id?: string;
    role?: string;
    tenantId?: string;
    email?: string;
  };
};

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
@UseGuards(JwtAuthGuard, TenantGuard, ReportsAccessGuard)
export class ReportsController {
  constructor(
    private readonly reports: TenantReportsService,
    private readonly access: ReportsAccessGuard,
  ) {}

  private scope(req: ReportRequest): ReportScope {
    return {
      userId: req.user?.userId || req.user?.id || '',
      role: req.user?.role || '',
      tenantId: req.user?.tenantId || '',
      email: req.user?.email,
    };
  }

  @Header('Cache-Control', 'no-store')
  @Get('catalog')
  @ApiOperation({
    summary: 'Available report categories for the authenticated role',
  })
  async catalog(@Request() req: ReportRequest) {
    const scope = this.scope(req);
    return {
      success: true,
      data: await this.access.filterCatalog(
        scope,
        this.reports.catalog(scope.role),
      ),
    };
  }

  @Header('Cache-Control', 'no-store')
  @Get()
  @ApiOperation({
    summary: 'Paginated role-scoped report with filtered summaries',
  })
  async preview(
    @Request() req: ReportRequest,
    @Query() query: TenantReportQuery,
  ) {
    const scope = this.scope(req);
    const data = await this.reports.generate(scope.tenantId, query, scope);
    return {
      success: true,
      statusCode: 200,
      message: `${data.title} report generated`,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Header('Cache-Control', 'no-store')
  @Get('export-data')
  @ApiOperation({
    summary:
      'Fresh authorized report data for PDF, Excel and printing; maximum 5000 records',
  })
  async exportData(
    @Request() req: ReportRequest,
    @Query() query: TenantReportQuery,
  ) {
    const scope = this.scope(req);
    return {
      success: true,
      data: await this.reports.generate(scope.tenantId, query, scope, true),
    };
  }

  @Get('export')
  @ApiOperation({
    summary: 'Download a fresh role-scoped report as CSV; maximum 5000 records',
  })
  async export(
    @Res() res: express.Response,
    @Request() req: ReportRequest,
    @Query() query: TenantReportQuery,
  ): Promise<void> {
    const scope = this.scope(req);
    const report = await this.reports.generate(
      scope.tenantId,
      query,
      scope,
      true,
    );
    const filename = `${report.category}-${report.metadata.generatedAt.slice(0, 10)}.csv`;
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    });
    res.send('\uFEFF' + this.reports.toCsv(report));
  }
}
