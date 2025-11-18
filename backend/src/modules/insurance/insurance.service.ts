import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { InsurancePolicy, PolicyStatus, PolicyType } from '../../entities/insurance-policy.entity';
import { InsuranceClaim, ClaimStatus, ClaimType, ClaimPriority } from '../../entities/insurance-claim.entity';
import { InsuranceRenewal, RenewalStatus } from '../../entities/insurance-renewal.entity';
import { Truck } from '../../entities/truck.entity';

export interface PolicyFilters {
  search?: string;
  status?: PolicyStatus;
  truckId?: string;
  insuranceCompany?: string;
  startDate?: Date;
  endDate?: Date;
  policyType?: PolicyType;
}

export interface ClaimFilters {
  search?: string;
  status?: ClaimStatus;
  claimType?: ClaimType;
  policyId?: string;
  truckId?: string;
  startDate?: Date;
  endDate?: Date;
  priority?: ClaimPriority;
}

export interface RenewalFilters {
  search?: string;
  status?: RenewalStatus;
  policyId?: string;
  truckId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface DashboardStats {
  policies: {
    totalPolicies: number;
    activePolicies: number;
    totalCoverage: number;
    totalPremium: number;
    expiringSoon: number;
  };
  claims: {
    totalClaims: number;
    pendingClaims: number;
    totalEstimatedAmount: number;
    totalApprovedAmount: number;
    totalPaidAmount: number;
  };
  renewals: {
    totalRenewals: number;
    urgentRenewals: number;
    totalCurrentPremium: number;
    totalEstimatedPremium: number;
  };
}

export interface UrgentAlert {
  type: string;
  priority: string;
  message: string;
  itemId: string;
  itemType: string;
  date: Date;
}

@Injectable()
export class InsuranceService {
  constructor(
    @InjectRepository(InsurancePolicy)
    private policyRepository: Repository<InsurancePolicy>,
    @InjectRepository(InsuranceClaim)
    private claimRepository: Repository<InsuranceClaim>,
    @InjectRepository(InsuranceRenewal)
    private renewalRepository: Repository<InsuranceRenewal>,
    @InjectRepository(Truck)
    private truckRepository: Repository<Truck>,
  ) {}

  // ===== INSURANCE POLICIES =====

  async getPolicies(
    page: number = 1,
    limit: number = 10,
    filters: PolicyFilters = {},
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const queryBuilder = this.policyRepository
      .createQueryBuilder('policy')
      .leftJoinAndSelect('policy.truck', 'truck')
      .leftJoinAndSelect('policy.documents', 'documents');

    // Apply filters
    if (filters.search) {
      queryBuilder.andWhere(
        '(policy.policyNumber ILIKE :search OR policy.insuranceCompany ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.status) {
      queryBuilder.andWhere('policy.status = :status', { status: filters.status });
    }

    if (filters.truckId) {
      queryBuilder.andWhere('policy.truckId = :truckId', { truckId: filters.truckId });
    }

    if (filters.insuranceCompany) {
      queryBuilder.andWhere('policy.insuranceCompany ILIKE :insuranceCompany', {
        insuranceCompany: `%${filters.insuranceCompany}%`,
      });
    }

    if (filters.policyType) {
      queryBuilder.andWhere('policy.policyType = :policyType', { policyType: filters.policyType });
    }

    if (filters.startDate || filters.endDate) {
      if (filters.startDate && filters.endDate) {
        queryBuilder.andWhere('policy.startDate BETWEEN :startDate AND :endDate', {
          startDate: filters.startDate,
          endDate: filters.endDate,
        });
      } else if (filters.startDate) {
        queryBuilder.andWhere('policy.startDate >= :startDate', { startDate: filters.startDate });
      } else if (filters.endDate) {
        queryBuilder.andWhere('policy.startDate <= :endDate', { endDate: filters.endDate });
      }
    }

    // Apply sorting
    queryBuilder.orderBy(`policy.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [policies, total] = await queryBuilder.getManyAndCount();

    return {
      policies,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  async getPolicyById(id: string) {
    const policy = await this.policyRepository.findOne({
      where: { id },
      relations: ['truck', 'claims', 'renewals'],
    });

    if (!policy) {
      throw new NotFoundException('Insurance policy not found');
    }

    return policy;
  }

  async createPolicy(policyData: Partial<InsurancePolicy>) {
    // Validate truck exists
    const truck = await this.truckRepository.findOne({ where: { id: policyData.truckId } });
    if (!truck) {
      throw new BadRequestException('Truck not found');
    }

    // Check for overlapping policies
    const overlappingPolicy = await this.policyRepository.findOne({
      where: {
        truckId: policyData.truckId,
        status: In([PolicyStatus.ACTIVE, PolicyStatus.PENDING]),
      },
    });

    if (overlappingPolicy) {
      // Check if dates overlap
      const hasOverlap = this.checkDateOverlap(
        policyData.startDate,
        policyData.endDate,
        overlappingPolicy.startDate,
        overlappingPolicy.endDate,
      );

      if (hasOverlap) {
        throw new BadRequestException('Policy dates overlap with existing active policy');
      }
    }

    // Generate policy number if not provided
    if (!policyData.policyNumber) {
      policyData.policyNumber = await this.generatePolicyNumber();
    }

    const policy = this.policyRepository.create(policyData);
    const savedPolicy = await this.policyRepository.save(policy);

    return this.getPolicyById(savedPolicy.id);
  }

  async updatePolicy(id: string, updateData: Partial<InsurancePolicy>) {
    const policy = await this.getPolicyById(id);

    // Check for overlapping policies if dates are being updated
    if (updateData.startDate || updateData.endDate) {
      const startDate = updateData.startDate || policy.startDate;
      const endDate = updateData.endDate || policy.endDate;

      const overlappingPolicy = await this.policyRepository.findOne({
        where: {
          id: In([id]),
          truckId: policy.truckId,
          status: In([PolicyStatus.ACTIVE, PolicyStatus.PENDING]),
        },
      });

      if (overlappingPolicy) {
        const hasOverlap = this.checkDateOverlap(
          startDate,
          endDate,
          overlappingPolicy.startDate,
          overlappingPolicy.endDate,
        );

        if (hasOverlap) {
          throw new BadRequestException('Policy dates overlap with existing active policy');
        }
      }
    }

    Object.assign(policy, updateData);
    const updatedPolicy = await this.policyRepository.save(policy);

    return this.getPolicyById(updatedPolicy.id);
  }

  async deletePolicy(id: string) {
    const policy = await this.getPolicyById(id);

    // Check if policy has active claims
    const activeClaims = await this.claimRepository.count({
      where: {
        policyId: id,
        status: In([ClaimStatus.PENDING, ClaimStatus.INVESTIGATING, ClaimStatus.APPROVED]),
      },
    });

    if (activeClaims > 0) {
      throw new BadRequestException('Cannot delete policy with active claims');
    }

    await this.policyRepository.remove(policy);
    return { message: 'Insurance policy deleted successfully' };
  }

  // ===== INSURANCE CLAIMS =====

  async getClaims(
    page: number = 1,
    limit: number = 10,
    filters: ClaimFilters = {},
    sortBy: string = 'reportedDate',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const queryBuilder = this.claimRepository
      .createQueryBuilder('claim')
      .leftJoinAndSelect('claim.policy', 'policy')
      .leftJoinAndSelect('claim.truck', 'truck');

    // Apply filters
    if (filters.search) {
      queryBuilder.andWhere(
        '(claim.claimNumber ILIKE :search OR claim.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.status) {
      queryBuilder.andWhere('claim.status = :status', { status: filters.status });
    }

    if (filters.claimType) {
      queryBuilder.andWhere('claim.claimType = :claimType', { claimType: filters.claimType });
    }

    if (filters.policyId) {
      queryBuilder.andWhere('claim.policyId = :policyId', { policyId: filters.policyId });
    }

    if (filters.truckId) {
      queryBuilder.andWhere('claim.truckId = :truckId', { truckId: filters.truckId });
    }

    if (filters.priority) {
      queryBuilder.andWhere('claim.priority = :priority', { priority: filters.priority });
    }

    if (filters.startDate || filters.endDate) {
      if (filters.startDate && filters.endDate) {
        queryBuilder.andWhere('claim.incidentDate BETWEEN :startDate AND :endDate', {
          startDate: filters.startDate,
          endDate: filters.endDate,
        });
      } else if (filters.startDate) {
        queryBuilder.andWhere('claim.incidentDate >= :startDate', { startDate: filters.startDate });
      } else if (filters.endDate) {
        queryBuilder.andWhere('claim.incidentDate <= :endDate', { endDate: filters.endDate });
      }
    }

    // Apply sorting
    queryBuilder.orderBy(`claim.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [claims, total] = await queryBuilder.getManyAndCount();

    return {
      claims,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  async getClaimById(id: string) {
    const claim = await this.claimRepository.findOne({
      where: { id },
      relations: ['policy', 'truck'],
    });

    if (!claim) {
      throw new NotFoundException('Insurance claim not found');
    }

    return claim;
  }

  async createClaim(claimData: Partial<InsuranceClaim>) {
    // Validate policy exists and is active
    const policy = await this.policyRepository.findOne({ where: { id: claimData.policyId } });
    if (!policy) {
      throw new BadRequestException('Insurance policy not found');
    }

    if (policy.status !== PolicyStatus.ACTIVE) {
      throw new BadRequestException('Cannot create claim for inactive policy');
    }

    // Validate truck exists
    const truck = await this.truckRepository.findOne({ where: { id: claimData.truckId } });
    if (!truck) {
      throw new BadRequestException('Truck not found');
    }

    // Generate claim number if not provided
    if (!claimData.claimNumber) {
      claimData.claimNumber = await this.generateClaimNumber();
    }

    const claim = this.claimRepository.create(claimData);
    const savedClaim = await this.claimRepository.save(claim);

    // Update policy claims count and total amount
    await this.policyRepository.update(claimData.policyId, {
      claimsCount: policy.claimsCount + 1,
      totalClaimsAmount: policy.totalClaimsAmount + (claimData.estimatedAmount || 0),
    });

    return this.getClaimById(savedClaim.id);
  }

  async updateClaim(id: string, updateData: Partial<InsuranceClaim>) {
    const claim = await this.getClaimById(id);

    // If approved amount is being updated, update policy total
    if (updateData.approvedAmount !== undefined && updateData.approvedAmount !== claim.approvedAmount) {
      const difference = updateData.approvedAmount - (claim.approvedAmount || 0);
      await this.policyRepository.update(claim.policyId, {
        totalClaimsAmount: claim.policy.totalClaimsAmount + difference,
      });
    }

    Object.assign(claim, updateData);
    const updatedClaim = await this.claimRepository.save(claim);

    return this.getClaimById(updatedClaim.id);
  }

  async deleteClaim(id: string) {
    const claim = await this.getClaimById(id);

    // Check if claim can be deleted
    if (claim.status === ClaimStatus.APPROVED || claim.status === ClaimStatus.CLOSED) {
      throw new BadRequestException('Cannot delete approved or closed claims');
    }

    // Update policy claims count and total amount
    await this.policyRepository.update(claim.policyId, {
      claimsCount: claim.policy.claimsCount - 1,
      totalClaimsAmount: claim.policy.totalClaimsAmount - (claim.estimatedAmount || 0),
    });

    await this.claimRepository.remove(claim);
    return { message: 'Insurance claim deleted successfully' };
  }

  // ===== INSURANCE RENEWALS =====

  async getRenewals(
    page: number = 1,
    limit: number = 10,
    filters: RenewalFilters = {},
    sortBy: string = 'renewalDate',
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ) {
    const queryBuilder = this.renewalRepository
      .createQueryBuilder('renewal')
      .leftJoinAndSelect('renewal.policy', 'policy')
      .leftJoinAndSelect('renewal.truck', 'truck');

    // Apply filters
    if (filters.search) {
      queryBuilder.andWhere('renewal.renewalNumber ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('renewal.status = :status', { status: filters.status });
    }

    if (filters.policyId) {
      queryBuilder.andWhere('renewal.policyId = :policyId', { policyId: filters.policyId });
    }

    if (filters.truckId) {
      queryBuilder.andWhere('renewal.truckId = :truckId', { truckId: filters.truckId });
    }

    if (filters.startDate || filters.endDate) {
      if (filters.startDate && filters.endDate) {
        queryBuilder.andWhere('renewal.renewalDate BETWEEN :startDate AND :endDate', {
          startDate: filters.startDate,
          endDate: filters.endDate,
        });
      } else if (filters.startDate) {
        queryBuilder.andWhere('renewal.renewalDate >= :startDate', { startDate: filters.startDate });
      } else if (filters.endDate) {
        queryBuilder.andWhere('renewal.renewalDate <= :endDate', { endDate: filters.endDate });
      }
    }

    // Apply sorting
    queryBuilder.orderBy(`renewal.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [renewals, total] = await queryBuilder.getManyAndCount();

    return {
      renewals,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  async getRenewalById(id: string) {
    const renewal = await this.renewalRepository.findOne({
      where: { id },
      relations: ['policy', 'truck'],
    });

    if (!renewal) {
      throw new NotFoundException('Insurance renewal not found');
    }

    return renewal;
  }

  async createRenewal(renewalData: Partial<InsuranceRenewal>) {
    // Validate policy exists
    const policy = await this.policyRepository.findOne({ where: { id: renewalData.policyId } });
    if (!policy) {
      throw new BadRequestException('Insurance policy not found');
    }

    // Validate truck exists
    const truck = await this.truckRepository.findOne({ where: { id: renewalData.truckId } });
    if (!truck) {
      throw new BadRequestException('Truck not found');
    }

    // Check if renewal already exists for this policy
    const existingRenewal = await this.renewalRepository.findOne({
      where: {
        policyId: renewalData.policyId,
        status: In([RenewalStatus.PENDING, RenewalStatus.URGENT]),
      },
    });

    if (existingRenewal) {
      throw new BadRequestException('Renewal already exists for this policy');
    }

    // Generate renewal number if not provided
    if (!renewalData.renewalNumber) {
      renewalData.renewalNumber = await this.generateRenewalNumber();
    }

    const renewal = this.renewalRepository.create(renewalData);
    const savedRenewal = await this.renewalRepository.save(renewal);

    return this.getRenewalById(savedRenewal.id);
  }

  async updateRenewal(id: string, updateData: Partial<InsuranceRenewal>) {
    const renewal = await this.getRenewalById(id);

    Object.assign(renewal, updateData);
    const updatedRenewal = await this.renewalRepository.save(renewal);

    return this.getRenewalById(updatedRenewal.id);
  }

  async deleteRenewal(id: string) {
    const renewal = await this.getRenewalById(id);

    // Check if renewal can be deleted
    if (renewal.status === RenewalStatus.COMPLETED) {
      throw new BadRequestException('Cannot delete completed renewal');
    }

    await this.renewalRepository.remove(renewal);
    return { message: 'Insurance renewal deleted successfully' };
  }

  // ===== ANALYTICS & DASHBOARD =====

  async getDashboardStats(dateRange?: { start: Date; end: Date }): Promise<DashboardStats> {
    let dateFilter = {};
    if (dateRange) {
      dateFilter = {
        createdAt: Between(dateRange.start, dateRange.end),
      };
    }

    // Get policy statistics
    const policyStats = await this.policyRepository
      .createQueryBuilder('policy')
      .select([
        'COUNT(*) as totalPolicies',
        'SUM(CASE WHEN policy.status = :activeStatus THEN 1 ELSE 0 END) as activePolicies',
        'SUM(policy.coverageAmount) as totalCoverage',
        'SUM(policy.premium) as totalPremium',
        'SUM(CASE WHEN policy.endDate BETWEEN :now AND :thirtyDaysLater THEN 1 ELSE 0 END) as expiringSoon',
      ])
      .setParameters({
        activeStatus: PolicyStatus.ACTIVE,
        now: new Date(),
        thirtyDaysLater: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .getRawOne();

    // Get claims statistics
    const claimsStats = await this.claimRepository
      .createQueryBuilder('claim')
      .select([
        'COUNT(*) as totalClaims',
        'SUM(CASE WHEN claim.status = :pendingStatus THEN 1 ELSE 0 END) as pendingClaims',
        'SUM(claim.estimatedAmount) as totalEstimatedAmount',
        'SUM(claim.approvedAmount) as totalApprovedAmount',
        'SUM(claim.paidAmount) as totalPaidAmount',
      ])
      .setParameters({
        pendingStatus: ClaimStatus.PENDING,
      })
      .getRawOne();

    // Get renewal statistics
    const renewalStats = await this.renewalRepository
      .createQueryBuilder('renewal')
      .select([
        'COUNT(*) as totalRenewals',
        'SUM(CASE WHEN renewal.status = :urgentStatus THEN 1 ELSE 0 END) as urgentRenewals',
        'SUM(renewal.currentPremium) as totalCurrentPremium',
        'SUM(renewal.estimatedPremium) as totalEstimatedPremium',
      ])
      .setParameters({
        urgentStatus: RenewalStatus.URGENT,
      })
      .getRawOne();

    return {
      policies: {
        totalPolicies: parseInt(policyStats.totalPolicies) || 0,
        activePolicies: parseInt(policyStats.activePolicies) || 0,
        totalCoverage: parseFloat(policyStats.totalCoverage) || 0,
        totalPremium: parseFloat(policyStats.totalPremium) || 0,
        expiringSoon: parseInt(policyStats.expiringSoon) || 0,
      },
      claims: {
        totalClaims: parseInt(claimsStats.totalClaims) || 0,
        pendingClaims: parseInt(claimsStats.pendingClaims) || 0,
        totalEstimatedAmount: parseFloat(claimsStats.totalEstimatedAmount) || 0,
        totalApprovedAmount: parseFloat(claimsStats.totalApprovedAmount) || 0,
        totalPaidAmount: parseFloat(claimsStats.totalPaidAmount) || 0,
      },
      renewals: {
        totalRenewals: parseInt(renewalStats.totalRenewals) || 0,
        urgentRenewals: parseInt(renewalStats.urgentRenewals) || 0,
        totalCurrentPremium: parseFloat(renewalStats.totalCurrentPremium) || 0,
        totalEstimatedPremium: parseFloat(renewalStats.totalEstimatedPremium) || 0,
      },
    };
  }

  async getUrgentAlerts(): Promise<UrgentAlert[]> {
    const alerts: UrgentAlert[] = [];

    // Get policies expiring soon
    const expiringPolicies = await this.policyRepository
      .createQueryBuilder('policy')
      .leftJoinAndSelect('policy.truck', 'truck')
      .where('policy.endDate BETWEEN :now AND :thirtyDaysLater', {
        now: new Date(),
        thirtyDaysLater: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .andWhere('policy.status = :activeStatus', { activeStatus: PolicyStatus.ACTIVE })
      .getMany();

    expiringPolicies.forEach(policy => {
      alerts.push({
        type: 'policy_expiring',
        priority: 'high',
        message: `Policy ${policy.policyNumber} expires in ${policy.daysUntilExpiration} days`,
        itemId: policy.id,
        itemType: 'policy',
        date: policy.endDate,
      });
    });

    // Get urgent renewals
    const urgentRenewals = await this.renewalRepository
      .createQueryBuilder('renewal')
      .leftJoinAndSelect('renewal.policy', 'policy')
      .leftJoinAndSelect('renewal.truck', 'truck')
      .where('renewal.status = :urgentStatus', { urgentStatus: RenewalStatus.URGENT })
      .getMany();

    urgentRenewals.forEach(renewal => {
      alerts.push({
        type: 'renewal_urgent',
        priority: 'high',
        message: `Renewal ${renewal.renewalNumber} requires immediate attention`,
        itemId: renewal.id,
        itemType: 'renewal',
        date: renewal.renewalDate,
      });
    });

    // Get high-priority claims
    const highPriorityClaims = await this.claimRepository
      .createQueryBuilder('claim')
      .leftJoinAndSelect('claim.policy', 'policy')
      .leftJoinAndSelect('claim.truck', 'truck')
      .where('claim.priority = :urgentPriority', { urgentPriority: ClaimPriority.URGENT })
      .andWhere('claim.status IN (:...pendingStatuses)', {
        pendingStatuses: [ClaimStatus.PENDING, ClaimStatus.INVESTIGATING],
      })
      .getMany();

    highPriorityClaims.forEach(claim => {
      alerts.push({
        type: 'claim_urgent',
        priority: 'high',
        message: `Claim ${claim.claimNumber} requires immediate attention`,
        itemId: claim.id,
        itemType: 'claim',
        date: claim.incidentDate,
      });
    });

    // Sort alerts by priority and date
    alerts.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return alerts.slice(0, 10); // Return top 10 alerts
  }

  // ===== UTILITY METHODS =====

  private async generatePolicyNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.policyRepository.count({
      where: {
        createdAt: Between(new Date(year, 0, 1), new Date(year, 11, 31)),
      },
    });
    return `INS-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  private async generateClaimNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.claimRepository.count({
      where: {
        createdAt: Between(new Date(year, 0, 1), new Date(year, 11, 31)),
      },
    });
    return `CLM-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async generateRenewalNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.renewalRepository.count({
      where: {
        createdAt: Between(new Date(year, 0, 1), new Date(year, 11, 31)),
      },
    });
    return `REN-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  private checkDateOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date,
  ): boolean {
    return start1 < end2 && start2 < end1;
  }
}
