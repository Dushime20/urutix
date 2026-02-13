import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantPlan, PlanStatus } from '../../entities/tenant-plan.entity';
import { UserSubscription, SubscriptionStatus } from '../../entities/user-subscription.entity';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class TenantSubscriptionsService {
  constructor(
    @InjectRepository(TenantPlan)
    private tenantPlanRepository: Repository<TenantPlan>,
    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,
  ) {}

  // ==================== TENANT PLAN MANAGEMENT ====================

  async createPlan(tenantId: string, createPlanDto: CreatePlanDto): Promise<TenantPlan> {
    const plan = this.tenantPlanRepository.create({
      ...createPlanDto,
      tenantId,
      status: PlanStatus.ACTIVE,
    });

    return await this.tenantPlanRepository.save(plan);
  }

  async getTenantPlans(tenantId: string, includeInactive = false): Promise<TenantPlan[]> {
    const query = this.tenantPlanRepository
      .createQueryBuilder('plan')
      .where('plan.tenantId = :tenantId', { tenantId })
      .leftJoinAndSelect('plan.subscriptions', 'subscriptions')
      .orderBy('plan.displayOrder', 'ASC')
      .addOrderBy('plan.createdAt', 'DESC');

    if (!includeInactive) {
      query.andWhere('plan.status = :status', { status: PlanStatus.ACTIVE });
    }

    return await query.getMany();
  }

  async getPlanById(planId: string, tenantId: string): Promise<TenantPlan> {
    const plan = await this.tenantPlanRepository.findOne({
      where: { id: planId, tenantId },
      relations: ['subscriptions'],
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  async updatePlan(
    planId: string,
    tenantId: string,
    updateData: Partial<CreatePlanDto>,
  ): Promise<TenantPlan> {
    const plan = await this.getPlanById(planId, tenantId);

    Object.assign(plan, updateData);
    return await this.tenantPlanRepository.save(plan);
  }

  async togglePlanStatus(planId: string, tenantId: string): Promise<TenantPlan> {
    const plan = await this.getPlanById(planId, tenantId);

    plan.status = plan.status === PlanStatus.ACTIVE ? PlanStatus.INACTIVE : PlanStatus.ACTIVE;
    return await this.tenantPlanRepository.save(plan);
  }

  async deletePlan(planId: string, tenantId: string): Promise<void> {
    const plan = await this.getPlanById(planId, tenantId);

    // Check if plan has active subscriptions
    const activeSubscriptions = await this.userSubscriptionRepository.count({
      where: {
        planId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestException(
        `Cannot delete plan with ${activeSubscriptions} active subscriptions`,
      );
    }

    await this.tenantPlanRepository.softDelete(planId);
  }

  // ==================== SUBSCRIPTION STATISTICS ====================

  async getPlanStatistics(planId: string, tenantId: string) {
    const plan = await this.getPlanById(planId, tenantId);

    const [totalSubscribers, activeSubscribers, revenue] = await Promise.all([
      this.userSubscriptionRepository.count({ where: { planId } }),
      this.userSubscriptionRepository.count({
        where: { planId, status: SubscriptionStatus.ACTIVE },
      }),
      this.userSubscriptionRepository
        .createQueryBuilder('sub')
        .select('SUM(sub.amountPaid)', 'total')
        .where('sub.planId = :planId', { planId })
        .andWhere('sub.status = :status', { status: SubscriptionStatus.ACTIVE })
        .getRawOne(),
    ]);

    return {
      plan,
      totalSubscribers,
      activeSubscribers,
      totalRevenue: parseFloat(revenue?.total || '0'),
      monthlyRecurringRevenue: activeSubscribers * parseFloat(plan.price.toString()),
    };
  }

  async getTenantSubscriptionOverview(tenantId: string) {
    const plans = await this.getTenantPlans(tenantId, true);

    const overview = await Promise.all(
      plans.map(async (plan) => {
        const activeCount = await this.userSubscriptionRepository.count({
          where: { planId: plan.id, status: SubscriptionStatus.ACTIVE },
        });

        const revenue = await this.userSubscriptionRepository
          .createQueryBuilder('sub')
          .select('SUM(sub.amountPaid)', 'total')
          .where('sub.planId = :planId', { planId: plan.id })
          .andWhere('sub.status = :status', { status: SubscriptionStatus.ACTIVE })
          .getRawOne();

        return {
          planId: plan.id,
          planName: plan.name,
          status: plan.status,
          activeSubscribers: activeCount,
          revenue: parseFloat(revenue?.total || '0'),
        };
      }),
    );

    const totalRevenue = overview.reduce((sum, item) => sum + item.revenue, 0);
    const totalSubscribers = overview.reduce((sum, item) => sum + item.activeSubscribers, 0);

    return {
      plans: overview,
      totalRevenue,
      totalSubscribers,
      activePlans: plans.filter((p) => p.status === PlanStatus.ACTIVE).length,
    };
  }

  // ==================== USER SUBSCRIPTION MANAGEMENT ====================

  async getSubscribersByPlan(planId: string, tenantId: string) {
    await this.getPlanById(planId, tenantId); // Verify ownership

    return await this.userSubscriptionRepository.find({
      where: { planId },
      relations: ['user', 'plan'],
      order: { createdAt: 'DESC' },
    });
  }

  async getExpiringSubscriptions(tenantId: string, daysAhead = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return await this.userSubscriptionRepository
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.user', 'user')
      .leftJoinAndSelect('sub.plan', 'plan')
      .where('sub.tenantId = :tenantId', { tenantId })
      .andWhere('sub.status = :status', { status: SubscriptionStatus.ACTIVE })
      .andWhere('sub.expiresAt <= :futureDate', { futureDate })
      .andWhere('sub.expiresAt > :now', { now: new Date() })
      .orderBy('sub.expiresAt', 'ASC')
      .getMany();
  }
}
