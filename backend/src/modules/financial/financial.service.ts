import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Invoice, InvoiceItem } from './entities/invoice.entity';
import { Expense } from './entities/expense.entity';
import { FinancialPayment } from './entities/payment.entity';
import { FinancialReport } from './entities/financial-report.entity';
import { Budget } from './entities/budget.entity';
import { TaxRecord } from './entities/tax-record.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class FinancialService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemRepository: Repository<InvoiceItem>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(FinancialPayment)
    private financialPaymentRepository: Repository<FinancialPayment>,
    @InjectRepository(FinancialReport)
    private financialReportRepository: Repository<FinancialReport>,
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    @InjectRepository(TaxRecord)
    private taxRecordRepository: Repository<TaxRecord>,
  ) {}

  // Invoice methods
  async createInvoice(
    createInvoiceDto: CreateInvoiceDto,
    userId: string,
    tenantId: string,
  ): Promise<Invoice> {
    const invoice = this.invoiceRepository.create({
      ...createInvoiceDto,
      createdBy: { id: userId },
      tenant: { id: tenantId },
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Create invoice items
    const invoiceItems = createInvoiceDto.items.map((item) =>
      this.invoiceItemRepository.create({
        ...item,
        invoice: savedInvoice,
      }),
    );

    await this.invoiceItemRepository.save(invoiceItems);

    return this.invoiceRepository.findOne({
      where: { id: savedInvoice.id },
      relations: ['items'],
    });
  }

  async getAllInvoices(query: any, tenantId: string): Promise<Invoice[]> {
    const where: any = { tenant: { id: tenantId } };

    if (query.status) {
      where.status = query.status;
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.startDate && query.endDate) {
      where.issueDate = Between(
        new Date(query.startDate),
        new Date(query.endDate),
      );
    }

    return this.invoiceRepository.find({
      where,
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async getInvoiceById(id: string, tenantId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id, tenant: { id: tenantId } },
      relations: ['items'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async updateInvoice(
    id: string,
    updateInvoiceDto: Partial<CreateInvoiceDto>,
    tenantId: string,
  ): Promise<Invoice> {
    const invoice = await this.getInvoiceById(id, tenantId);

    Object.assign(invoice, updateInvoiceDto);
    return this.invoiceRepository.save(invoice);
  }

  async deleteInvoice(id: string, tenantId: string): Promise<void> {
    const invoice = await this.getInvoiceById(id, tenantId);
    await this.invoiceRepository.remove(invoice);
  }

  // Expense methods
  async createExpense(
    createExpenseDto: any,
    userId: string,
    tenantId: string,
  ): Promise<Expense> {
    const expense = this.expenseRepository.create({
      ...createExpenseDto,
      createdBy: { id: userId },
      tenant: { id: tenantId },
    });

    const savedExpense = await this.expenseRepository.save(expense);
    return Array.isArray(savedExpense) ? savedExpense[0] : savedExpense;
  }

  async getAllExpenses(query: any, tenantId: string): Promise<Expense[]> {
    const where: any = { tenant: { id: tenantId } };

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate && query.endDate) {
      where.date = Between(new Date(query.startDate), new Date(query.endDate));
    }

    return this.expenseRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getExpenseById(id: string, tenantId: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id, tenant: { id: tenantId } },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async updateExpense(
    id: string,
    updateExpenseDto: any,
    tenantId: string,
  ): Promise<Expense> {
    const expense = await this.getExpenseById(id, tenantId);

    Object.assign(expense, updateExpenseDto);
    const savedExpense = await this.expenseRepository.save(expense);
    return Array.isArray(savedExpense) ? savedExpense[0] : savedExpense;
  }

  async deleteExpense(id: string, tenantId: string): Promise<void> {
    const expense = await this.getExpenseById(id, tenantId);
    await this.expenseRepository.remove(expense);
  }

  // Payment methods
  async createPayment(
    createPaymentDto: any,
    userId: string,
    tenantId: string,
  ): Promise<FinancialPayment> {
    const payment = this.financialPaymentRepository.create({
      ...createPaymentDto,
      createdBy: { id: userId },
      tenant: { id: tenantId },
    });

    const savedPayment = await this.financialPaymentRepository.save(payment);
    return Array.isArray(savedPayment) ? savedPayment[0] : savedPayment;
  }

  async getAllPayments(
    query: any,
    tenantId: string,
  ): Promise<FinancialPayment[]> {
    const where: any = { tenant: { id: tenantId } };

    if (query.status) {
      where.status = query.status;
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.startDate && query.endDate) {
      where.paymentDate = Between(
        new Date(query.startDate),
        new Date(query.endDate),
      );
    }

    return this.financialPaymentRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getPaymentById(
    id: string,
    tenantId: string,
  ): Promise<FinancialPayment> {
    const payment = await this.financialPaymentRepository.findOne({
      where: { id, tenant: { id: tenantId } },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  // Financial Reports methods
  async getFinancialReports(
    query: any,
    tenantId: string,
  ): Promise<FinancialReport[]> {
    const where: any = { tenant: { id: tenantId } };

    if (query.type) {
      where.type = query.type;
    }

    if (query.period) {
      where.period = query.period;
    }

    return this.financialReportRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async generateFinancialReport(
    generateReportDto: any,
    userId: string,
    tenantId: string,
  ): Promise<FinancialReport> {
    // Calculate financial data based on the report type and period
    const financialData = await this.calculateFinancialData(
      generateReportDto.type,
      generateReportDto.period,
      generateReportDto.startDate,
      generateReportDto.endDate,
      tenantId,
    );

    const report = this.financialReportRepository.create({
      ...generateReportDto,
      data: financialData,
      generatedAt: new Date(),
      generatedBy: userId,
      createdBy: { id: userId },
      tenant: { id: tenantId },
    });

    const savedReport = await this.financialReportRepository.save(report);
    return Array.isArray(savedReport) ? savedReport[0] : savedReport;
  }

  private async calculateFinancialData(
    type: string,
    period: string,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<any> {
    // Get invoices for the period
    const invoices = await this.invoiceRepository.find({
      where: {
        tenant: { id: tenantId },
        issueDate: Between(startDate, endDate),
      },
    });

    // Get expenses for the period
    const expenses = await this.expenseRepository.find({
      where: {
        tenant: { id: tenantId },
        date: Between(startDate, endDate),
      },
    });

    // Calculate revenue
    const totalRevenue = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalAmount),
      0,
    );
    const revenueByCustomer = invoices.reduce((acc, invoice) => {
      acc[invoice.customerId] =
        (acc[invoice.customerId] || 0) + Number(invoice.totalAmount);
      return acc;
    }, {});

    // Calculate expenses
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0,
    );
    const expensesByCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] =
        (acc[expense.category] || 0) + Number(expense.amount);
      return acc;
    }, {});

    // Calculate profit
    const totalProfit = totalRevenue - totalExpenses;
    const profitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      revenue: {
        total: totalRevenue,
        byCustomer: revenueByCustomer,
        byTrip: {},
        byMonth: {},
      },
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory,
        byTruck: {},
        byMonth: {},
      },
      profit: {
        total: totalProfit,
        margin: profitMargin,
        byCustomer: {},
        byTrip: {},
      },
      cashFlow: {
        operating: totalRevenue - totalExpenses,
        investing: 0,
        financing: 0,
        netChange: totalRevenue - totalExpenses,
      },
    };
  }

  // Analytics methods
  async getPerformanceMetrics(query: any, tenantId: string): Promise<any[]> {
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    const invoices = await this.invoiceRepository.find({
      where: {
        tenant: { id: tenantId },
        issueDate: Between(startDate, endDate),
      },
    });

    const expenses = await this.expenseRepository.find({
      where: {
        tenant: { id: tenantId },
        date: Between(startDate, endDate),
      },
    });

    const totalRevenue = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalAmount),
      0,
    );
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0,
    );
    const profitMargin =
      totalRevenue > 0
        ? ((totalRevenue - totalExpenses) / totalRevenue) * 100
        : 0;

    return [
      {
        id: 'metric-1',
        name: 'Monthly Revenue',
        value: totalRevenue,
        target: totalRevenue * 1.1, // 10% growth target
        unit: 'USD',
        trend: 'up',
        change: totalRevenue * 0.05, // 5% increase
        changePercentage: 5,
        period: 'monthly',
        date: new Date(),
      },
      {
        id: 'metric-2',
        name: 'Profit Margin',
        value: profitMargin,
        target: 20,
        unit: '%',
        trend: profitMargin > 15 ? 'up' : 'down',
        change: profitMargin - 15,
        changePercentage: ((profitMargin - 15) / 15) * 100,
        period: 'monthly',
        date: new Date(),
      },
    ];
  }

  async getCustomerAnalytics(query: any, tenantId: string): Promise<any[]> {
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    const invoices = await this.invoiceRepository.find({
      where: {
        tenant: { id: tenantId },
        issueDate: Between(startDate, endDate),
      },
    });

    // Group invoices by customer
    const customerData = invoices.reduce((acc, invoice) => {
      if (!acc[invoice.customerId]) {
        acc[invoice.customerId] = {
          customerId: invoice.customerId,
          customerName: invoice.customerName,
          totalRevenue: 0,
          totalTrips: 0,
          invoices: [],
        };
      }

      acc[invoice.customerId].totalRevenue += Number(invoice.totalAmount);
      acc[invoice.customerId].totalTrips += 1;
      acc[invoice.customerId].invoices.push(invoice);

      return acc;
    }, {});

    return Object.values(customerData).map((customer: any) => ({
      customerId: customer.customerId,
      customerName: customer.customerName,
      totalRevenue: customer.totalRevenue,
      totalTrips: customer.totalTrips,
      averageRate: customer.totalRevenue / customer.totalTrips,
      profitMargin: 18.5, // Mock data
      paymentHistory: {
        onTime: Math.floor(customer.totalTrips * 0.8),
        late: Math.floor(customer.totalTrips * 0.2),
        averageDaysToPay: 28,
      },
      satisfaction: 4.5,
      churnRisk: 'low',
      lastActivity: new Date(),
    }));
  }

  async getDriverAnalytics(query: any, tenantId: string): Promise<any[]> {
    // Mock driver analytics data
    return [
      {
        driverId: 'drv-001',
        driverName: 'John Smith',
        totalTrips: 25,
        totalMiles: 15000,
        revenue: 62500,
        expenses: 8500,
        profit: 54000,
        efficiency: 92.5,
        safetyScore: 88,
        retentionScore: 95,
        lastActivity: new Date(),
      },
      {
        driverId: 'drv-002',
        driverName: 'Mike Johnson',
        totalTrips: 20,
        totalMiles: 12000,
        revenue: 52000,
        expenses: 7200,
        profit: 44800,
        efficiency: 89.2,
        safetyScore: 92,
        retentionScore: 88,
        lastActivity: new Date(),
      },
    ];
  }

  async getPredictiveAnalytics(query: any, tenantId: string): Promise<any> {
    // Mock predictive analytics data
    return {
      demandForecast: {
        period: 'Q2 2024',
        predictedVolume: 180,
        confidence: 85,
        factors: [
          'Seasonal demand increase',
          'New customer contracts',
          'Market expansion',
        ],
      },
      priceOptimization: {
        recommendedRate: 2850,
        marketRate: 2700,
        competitiveAdvantage: 5.6,
        factors: [
          'Fuel price increase',
          'Capacity constraints',
          'Customer demand',
        ],
      },
      maintenancePrediction: {
        truckId: 'truck-001',
        nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        confidence: 92,
        recommendedActions: ['Oil change', 'Tire rotation', 'Brake inspection'],
      },
      fuelOptimization: {
        recommendedRoutes: ['Route A-1', 'Route B-2', 'Route C-3'],
        expectedSavings: 1200,
        efficiencyImprovement: 8.5,
      },
      riskAssessment: {
        riskLevel: 'low',
        riskFactors: ['Driver shortage', 'Fuel price volatility'],
        mitigationStrategies: [
          'Driver retention program',
          'Fuel hedging strategy',
        ],
      },
    };
  }
}
