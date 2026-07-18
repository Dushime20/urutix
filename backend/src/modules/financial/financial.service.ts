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
import {
  FinancialReport,
  FinancialReportType,
  FinancialReportPeriod,
} from './entities/financial-report.entity';
import { Budget } from './entities/budget.entity';
import { TaxRecord } from './entities/tax-record.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { Payment } from '../../entities/payment.entity';
import { Trip } from '../../entities/trip.entity';
import { Load } from '../../entities/load.entity';

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
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
    @InjectRepository(Load)
    private loadRepository: Repository<Load>,
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

    const take = query.limit ? Math.min(parseInt(query.limit, 10) || 10, 100) : 50;

    return this.financialReportRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take,
    });
  }

  async getFinancialReportById(
    id: string,
    tenantId: string,
  ): Promise<FinancialReport> {
    const report = await this.financialReportRepository.findOne({
      where: { id, tenant: { id: tenantId } },
    });

    if (!report) {
      throw new NotFoundException(`Financial report ${id} not found`);
    }

    return report;
  }

  private resolveReportType(rawType: string): FinancialReportType {
    const normalized = String(rawType || '')
      .trim()
      .toLowerCase()
      .replace(/-/g, '_');

    const aliases: Record<string, FinancialReportType> = {
      pl_statement: FinancialReportType.PL_STATEMENT,
      profit_loss: FinancialReportType.PL_STATEMENT,
      pnl: FinancialReportType.PL_STATEMENT,
      cash_flow: FinancialReportType.CASH_FLOW,
      revenue: FinancialReportType.REVENUE,
      expense: FinancialReportType.EXPENSE,
      expenses: FinancialReportType.EXPENSE,
      profitability: FinancialReportType.PROFITABILITY,
    };

    const resolved = aliases[normalized];
    if (!resolved) {
      throw new BadRequestException(
        `Invalid report type "${rawType}". Allowed: ${Object.values(FinancialReportType).join(', ')}`,
      );
    }
    return resolved;
  }

  private resolveReportPeriod(rawPeriod: string): FinancialReportPeriod {
    const normalized = String(rawPeriod || 'monthly').trim().toLowerCase();
    const allowed = Object.values(FinancialReportPeriod) as string[];
    if (!allowed.includes(normalized)) {
      return FinancialReportPeriod.MONTHLY;
    }
    return normalized as FinancialReportPeriod;
  }

  async generateFinancialReport(
    generateReportDto: any,
    userId: string,
    tenantId: string,
    role?: string,
  ): Promise<FinancialReport> {
    const type = this.resolveReportType(generateReportDto.type);
    const period = this.resolveReportPeriod(generateReportDto.period);
    const startDate = new Date(generateReportDto.startDate);
    const endDate = new Date(generateReportDto.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid startDate or endDate');
    }

    const financialData = await this.calculateFinancialData(
      type,
      period,
      startDate,
      endDate,
      tenantId,
      userId,
      role,
    );

    const report = this.financialReportRepository.create({
      type,
      period,
      startDate,
      endDate,
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
    type: FinancialReportType,
    _period: FinancialReportPeriod,
    startDate: Date,
    endDate: Date,
    tenantId: string,
    userId: string,
    role?: string,
  ): Promise<any> {
    const isCargoOwner = String(role || '').toUpperCase() === 'CARGO_OWNER';

    // Invoices (revenue side for transporters / general tenants)
    const invoices = await this.invoiceRepository.find({
      where: {
        tenant: { id: tenantId },
        issueDate: Between(startDate, endDate),
      },
    });

    // Explicit expense records
    const expenses = await this.expenseRepository.find({
      where: {
        tenant: { id: tenantId },
        date: Between(startDate, endDate),
      },
    });

    // Live freight payments for the period (cargo owners are typically payers)
    const paymentQb = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.tenantId = :tenantId', { tenantId })
      .andWhere('payment.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });

    if (isCargoOwner) {
      paymentQb.andWhere('payment.payerId = :userId', { userId });
    }

    const payments = await paymentQb.getMany();

    // Trips / loads for cargo-owner spend when payments are sparse
    const tripQb = this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.load', 'load')
      .where('trip.tenantId = :tenantId', { tenantId })
      .andWhere('trip.plannedStartTime BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });

    if (isCargoOwner) {
      tripQb.andWhere('load.cargoOwnerId = :userId', { userId });
    }

    const trips = await tripQb.getMany();

    const invoiceRevenue = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalAmount || 0),
      0,
    );

    const tripFreightSpend = trips.reduce(
      (sum, trip) => sum + Number(trip.agreedPrice || 0),
      0,
    );

    const paymentSpend = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    const expenseRecords = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0,
    );

    // Cargo owners: contracted freight is "revenue" (liability side / booked value);
    // payments + expense records are actual spend.
    const totalRevenue = isCargoOwner
      ? tripFreightSpend || invoiceRevenue
      : invoiceRevenue || tripFreightSpend;
    const totalExpenses = isCargoOwner
      ? (paymentSpend || expenseRecords || tripFreightSpend)
      : expenseRecords || paymentSpend;

    const revenueByCustomer = invoices.reduce((acc, invoice) => {
      const key = invoice.customerId || 'unknown';
      acc[key] = (acc[key] || 0) + Number(invoice.totalAmount || 0);
      return acc;
    }, {} as Record<string, number>);

    const expensesByCategory = expenses.reduce((acc, expense) => {
      const key = String(expense.category || 'other');
      acc[key] = (acc[key] || 0) + Number(expense.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    if (isCargoOwner && Object.keys(expensesByCategory).length === 0) {
      expensesByCategory['freight'] = totalExpenses;
    }

    const tripSpendByLoad = trips.reduce((acc, trip) => {
      const key = trip.loadId || trip.id;
      acc[key] = (acc[key] || 0) + Number(trip.agreedPrice || 0);
      return acc;
    }, {} as Record<string, number>);

    const monthKey = (d: Date | string | null | undefined): string | null => {
      if (!d) return null;
      const date = d instanceof Date ? d : new Date(d);
      if (isNaN(date.getTime())) return null;
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    };

    const revenueByMonth: Record<string, number> = {};
    for (const invoice of invoices) {
      const key = monthKey(invoice.issueDate);
      if (!key) continue;
      revenueByMonth[key] =
        (revenueByMonth[key] || 0) + Number(invoice.totalAmount || 0);
    }

    const expensesByMonth: Record<string, number> = {};
    for (const expense of expenses) {
      const key = monthKey(expense.date);
      if (!key) continue;
      expensesByMonth[key] =
        (expensesByMonth[key] || 0) + Number(expense.amount || 0);
    }
    for (const payment of payments) {
      const key = monthKey(payment.createdAt);
      if (!key) continue;
      expensesByMonth[key] =
        (expensesByMonth[key] || 0) + Number(payment.amount || 0);
    }
    if (isCargoOwner) {
      for (const trip of trips) {
        const key = monthKey(trip.plannedStartTime);
        if (!key) continue;
        revenueByMonth[key] =
          (revenueByMonth[key] || 0) + Number(trip.agreedPrice || 0);
        // Prefer explicit payments; only fall back to trip prices when no payment rows
        if (payments.length === 0) {
          expensesByMonth[key] =
            (expensesByMonth[key] || 0) + Number(trip.agreedPrice || 0);
        }
      }
    } else if (Object.keys(revenueByMonth).length === 0) {
      for (const trip of trips) {
        const key = monthKey(trip.plannedStartTime);
        if (!key) continue;
        revenueByMonth[key] =
          (revenueByMonth[key] || 0) + Number(trip.agreedPrice || 0);
      }
    }

    const totalProfit = totalRevenue - totalExpenses;
    const profitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const base = {
      revenue: {
        total: totalRevenue,
        byCustomer: revenueByCustomer,
        byTrip: isCargoOwner ? {} : tripSpendByLoad,
        byMonth: revenueByMonth,
      },
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory,
        byTruck: {},
        byMonth: expensesByMonth,
        byTrip: isCargoOwner ? tripSpendByLoad : {},
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
      meta: {
        reportType: type,
        invoiceCount: invoices.length,
        expenseCount: expenses.length,
        paymentCount: payments.length,
        tripCount: trips.length,
        scopedToCargoOwner: isCargoOwner,
      },
    };

    return base;
  }

  /**
   * Live overview totals for the Financial Hub (no persisted report row).
   */
  async getOverviewSummary(
    period: string,
    tenantId: string,
    userId: string,
    role?: string,
  ): Promise<any> {
    const now = new Date();
    const endDate = new Date(now);
    const startDate = new Date(now);

    switch (String(period || 'month').toLowerCase()) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'month':
      default:
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const reportPeriod =
      period === 'week'
        ? FinancialReportPeriod.WEEKLY
        : period === 'quarter'
          ? FinancialReportPeriod.QUARTERLY
          : period === 'year'
            ? FinancialReportPeriod.YEARLY
            : FinancialReportPeriod.MONTHLY;

    return this.calculateFinancialData(
      FinancialReportType.PL_STATEMENT,
      reportPeriod,
      startDate,
      endDate,
      tenantId,
      userId,
      role,
    );
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
