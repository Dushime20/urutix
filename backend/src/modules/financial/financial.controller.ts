import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { FinancialService } from './financial.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../../entities/user.entity';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Financial Management')
@Controller('financial')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TENANT_ADMIN,
  UserRole.TRUCK_OWNER,
  UserRole.FLEET_MANAGER,
  UserRole.FLEET_ACCOUNTANT,
  UserRole.CARGO_OWNER,
  UserRole.LENDER,
)
@ApiBearerAuth('JWT-auth')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  // Invoice endpoints
  @Post('invoices')
  @ApiOperation({
    summary: 'Create invoice',
    description: 'Create a new invoice with items',
  })
  @ApiOkResponse({
    description: 'Invoice created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Invoice created successfully' },
        invoice: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid' },
            invoiceNumber: { type: 'string', example: 'INV-2024-001' },
            totalAmount: { type: 'number', example: 2750.0 },
            status: { type: 'string', example: 'draft' },
          },
        },
      },
    },
  })
  async createInvoice(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const invoice = await this.financialService.createInvoice(
      createInvoiceDto,
      req.user.userId,
      req.user.tenantId,
    );

    return {
      success: true,
      message: 'Invoice created successfully',
      data: { invoice },
      statusCode: 201,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('invoices')
  @ApiOperation({
    summary: 'Get all invoices',
    description: 'Retrieve all invoices with optional filtering',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by invoice status',
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    type: String,
    description: 'Filter by customer ID',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter by start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter by end date (YYYY-MM-DD)',
  })
  async getAllInvoices(
    @Query() query: any,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const invoices = await this.financialService.getAllInvoices(
      query,
      req.user.tenantId,
    );

    return {
      success: true,
      message: 'Invoices retrieved successfully',
      data: { invoices },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('invoices/:id')
  @ApiOperation({
    summary: 'Get invoice by ID',
    description: 'Retrieve a specific invoice by ID',
  })
  async getInvoiceById(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const invoice = await this.financialService.getInvoiceById(
      id,
      req.user.tenantId,
    );

    return {
      success: true,
      message: 'Invoice retrieved successfully',
      data: { invoice },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch('invoices/:id')
  @ApiOperation({
    summary: 'Update invoice',
    description: 'Update an existing invoice',
  })
  async updateInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInvoiceDto: Partial<CreateInvoiceDto>,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const invoice = await this.financialService.updateInvoice(
      id,
      updateInvoiceDto,
      req.user.tenantId,
    );

    return {
      success: true,
      message: 'Invoice updated successfully',
      data: { invoice },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('invoices/:id')
  @ApiOperation({
    summary: 'Delete invoice',
    description: 'Delete an invoice by ID',
  })
  async deleteInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<ApiResponseDto> {
    await this.financialService.deleteInvoice(id, req.user.tenantId);

    return {
      success: true,
      message: 'Invoice deleted successfully',
      data: {},
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  // Expense endpoints
  @Post('expenses')
  @ApiOperation({
    summary: 'Create expense',
    description: 'Create a new expense record',
  })
  async createExpense(
    @Body() createExpenseDto: any,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const expense = await this.financialService.createExpense(
      createExpenseDto,
      req.user.userId,
      req.user.tenantId,
    );

    return {
      success: true,
      message: 'Expense created successfully',
      data: { expense },
      statusCode: 201,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('expenses')
  @ApiOperation({
    summary: 'Get all expenses',
    description: 'Retrieve all expenses with optional filtering',
  })
  async getAllExpenses(
    @Query() query: any,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const expenses = await this.financialService.getAllExpenses(
      query,
      req.user.tenantId,
    );

    return {
      success: true,
      message: 'Expenses retrieved successfully',
      data: { expenses },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('expenses/:id')
  @ApiOperation({
    summary: 'Get expense by ID',
    description: 'Retrieve a specific expense by ID',
  })
  async getExpenseById(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const expense = await this.financialService.getExpenseById(
      id,
      req.user.tenantId,
    );

    return {
      success: true,
      message: 'Expense retrieved successfully',
      data: { expense },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch('expenses/:id')
  @ApiOperation({
    summary: 'Update expense',
    description: 'Update an existing expense',
  })
  async updateExpense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateExpenseDto: any,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const expense = await this.financialService.updateExpense(
      id,
      updateExpenseDto,
      req.user.tenantId,
    );

    return {
      success: true,
      message: 'Expense updated successfully',
      data: { expense },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('expenses/:id')
  @ApiOperation({
    summary: 'Delete expense',
    description: 'Delete an expense by ID',
  })
  async deleteExpense(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<ApiResponseDto> {
    await this.financialService.deleteExpense(id, req.user.tenantId);

    return {
      success: true,
      message: 'Expense deleted successfully',
      data: {},
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  // Payment endpoints
  @Post('payments')
  @ApiOperation({
    summary: 'Create payment',
    description: 'Create a new payment record',
  })
  async createPayment(
    @Body() createPaymentDto: any,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const payment = await this.financialService.createPayment(
      createPaymentDto,
      req.user.userId,
      req.user.tenantId,
    );

    return {
      success: true,
      message: 'Payment created successfully',
      data: { payment },
      statusCode: 201,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('payments')
  @ApiOperation({
    summary: 'Get all payments',
    description: 'Retrieve all payments with optional filtering',
  })
  async getAllPayments(
    @Query() query: any,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const payments = await this.financialService.getAllPayments(
      query,
      req.user.tenantId,
    );

    return {
      success: true,
      message: 'Payments retrieved successfully',
      data: { payments },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('payments/:id')
  @ApiOperation({
    summary: 'Get payment by ID',
    description: 'Retrieve a specific payment by ID',
  })
  async getPaymentById(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const payment = await this.financialService.getPaymentById(
      id,
      req.user.tenantId,
    );

    return {
      success: true,
      message: 'Payment retrieved successfully',
      data: { payment },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  // Financial Reports endpoints
  @Get('reports')
  @ApiOperation({
    summary: 'Get financial reports',
    description: 'Retrieve financial reports with optional filtering',
  })
  async getFinancialReports(
    @Query() query: any,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const reports = await this.financialService.getFinancialReports(
      query,
      req.user.tenantId,
    );

    return {
      success: true,
      message: 'Financial reports retrieved successfully',
      data: { reports },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }
  @Get('reports/templates')
  @ApiOperation({
    summary: 'Get report templates',
    description: 'Retrieve available financial report templates',
  })
  async getReportTemplates(): Promise<ApiResponseDto> {
    // Template IDs must match FinancialReportType enum values
    const templates = [
      {
        id: 'pl_statement',
        name: 'P&L Statement',
        description: 'Profit and loss from freight spend, invoices, and operating costs for the selected period.',
        category: 'financial',
        type: 'detailed',
        frequency: 'monthly',
        format: 'excel',
        estimatedTime: '4m',
        dataPoints: ['Revenue', 'Expenses', 'Net Income'],
        isScheduled: true,
      },
      {
        id: 'cash_flow',
        name: 'Cash Flow Analysis',
        description: 'Track cash inflows and outflows across freight payments and settlements.',
        category: 'financial',
        type: 'detailed',
        frequency: 'monthly',
        format: 'excel',
        estimatedTime: '3m',
        dataPoints: ['Operating Cash Flow', 'Investing', 'Financing'],
        isScheduled: true,
      },
      {
        id: 'revenue',
        name: 'Revenue Report',
        description: 'Breakdown of invoice and settlement revenue for your tenant.',
        category: 'financial',
        type: 'detailed',
        frequency: 'monthly',
        format: 'pdf',
        estimatedTime: '3m',
        dataPoints: ['Total Revenue', 'Revenue by Source', 'Growth Rate'],
        isScheduled: true,
      },
      {
        id: 'expense',
        name: 'Expense Analysis',
        description: 'Freight spend and operational expenses by category and period.',
        category: 'financial',
        type: 'detailed',
        frequency: 'monthly',
        format: 'excel',
        estimatedTime: '3m',
        dataPoints: ['Total Expenses', 'Expense by Category', 'Cost Trends'],
        isScheduled: true,
      },
      {
        id: 'profitability',
        name: 'Profitability Analysis',
        description: 'Margins, ROI, and profitability metrics derived from live shipment and payment data.',
        category: 'financial',
        type: 'analytical',
        frequency: 'quarterly',
        format: 'pdf',
        estimatedTime: '5m',
        dataPoints: ['Gross Profit', 'Net Profit', 'Profit Margins', 'ROI'],
        isScheduled: true,
      },
    ];

    return {
      success: true,
      message: 'Report templates retrieved successfully',
      data: { templates },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('reports/:id/download')
  @ApiOperation({
    summary: 'Download a financial report',
    description: 'Download a previously generated financial report as JSON',
  })
  async downloadFinancialReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
    @Res() res: Response,
  ): Promise<void> {
    const report = await this.financialService.getFinancialReportById(
      id,
      req.user.tenantId,
    );

    const filename = `financial-report-${report.type}-${id.slice(0, 8)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(JSON.stringify(report, null, 2));
  }

  @Post('reports')
  @ApiOperation({
    summary: 'Generate financial report',
    description: 'Generate a new financial report',
  })
  async generateFinancialReport(
    @Body() generateReportDto: any,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const report = await this.financialService.generateFinancialReport(
      generateReportDto,
      req.user.userId,
      req.user.tenantId,
      req.user.role,
    );

    return {
      success: true,
      message: 'Financial report generated successfully',
      data: { report },
      statusCode: 201,
      timestamp: new Date().toISOString(),
    };
  }

  // Analytics endpoints
  @Get('analytics/overview')
  @ApiOperation({
    summary: 'Get live financial overview',
    description:
      'Compute live revenue/expense/profit totals for the selected period without saving a report',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    type: String,
    description: 'week | month | quarter | year',
  })
  async getOverviewSummary(
    @Query('period') period: string,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const summary = await this.financialService.getOverviewSummary(
      period || 'month',
      req.user.tenantId,
      req.user.userId,
      req.user.role,
    );

    return {
      success: true,
      message: 'Financial overview retrieved successfully',
      data: { summary },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('analytics/performance')
  @ApiOperation({
    summary: 'Get performance metrics',
    description: 'Retrieve financial performance metrics',
  })
  async getPerformanceMetrics(
    @Query() query: any,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const metrics = await this.financialService.getPerformanceMetrics(
      query,
      req.user.tenantId,
    );

    return {
      success: true,
      message: 'Performance metrics retrieved successfully',
      data: { metrics },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('analytics/customers')
  @ApiOperation({
    summary: 'Get customer analytics',
    description: 'Retrieve customer profitability analytics',
  })
  async getCustomerAnalytics(
    @Query() query: any,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const analytics = await this.financialService.getCustomerAnalytics(
      query,
      req.user.tenantId,
    );

    return {
      success: true,
      message: 'Customer analytics retrieved successfully',
      data: { analytics },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('analytics/drivers')
  @ApiOperation({
    summary: 'Get driver analytics',
    description: 'Retrieve driver performance analytics',
  })
  async getDriverAnalytics(
    @Query() query: any,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const analytics = await this.financialService.getDriverAnalytics(
      query,
      req.user.tenantId,
    );

    return {
      success: true,
      message: 'Driver analytics retrieved successfully',
      data: { analytics },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('analytics/predictive')
  @ApiOperation({
    summary: 'Get predictive analytics',
    description: 'Retrieve AI-powered predictive analytics',
  })
  async getPredictiveAnalytics(
    @Query() query: any,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const analytics = await this.financialService.getPredictiveAnalytics(
      query,
      req.user.tenantId,
    );

    return {
      success: true,
      message: 'Predictive analytics retrieved successfully',
      data: { analytics },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }
}
