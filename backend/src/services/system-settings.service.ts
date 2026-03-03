import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettings } from '../entities/system-settings.entity';
import { EventsGateway } from '../modules/events/events.gateway';

export interface CreateSettingDto {
    category: string;
    key: string;
    value: any;
    dataType: 'string' | 'number' | 'boolean' | 'json';
    description?: string;
    isPublic?: boolean;
    updatedBy?: string;
}

export interface UpdateSettingDto {
    value: any;
    description?: string;
    isPublic?: boolean;
    updatedBy?: string;
}

@Injectable()
export class SystemSettingsService implements OnModuleInit {
    private settingsCache: Map<string, any> = new Map();
    private cacheExpiry: Map<string, number> = new Map();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    constructor(
        @InjectRepository(SystemSettings)
        private settingsRepository: Repository<SystemSettings>,
        private eventsGateway: EventsGateway,
    ) { }

    async onModuleInit() {
        await this.initializeCache();
    }

    /**
     * Initialize settings cache
     */
    private async initializeCache() {
        const settings = await this.settingsRepository.find();
        settings.forEach(setting => {
            const cacheKey = `${setting.category}:${setting.key}`;
            this.settingsCache.set(cacheKey, this.parseValue(setting));
            this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);
        });
    }

    /**
     * Parse setting value based on data type
     */
    private parseValue(setting: SystemSettings): any {
        switch (setting.dataType) {
            case 'string':
                return String(setting.value);
            case 'number':
                return Number(setting.value);
            case 'boolean':
                return Boolean(setting.value);
            case 'json':
                return setting.value;
            default:
                return setting.value;
        }
    }

    /**
     * Get all settings
     */
    async getAllSettings(includePrivate: boolean = false): Promise<SystemSettings[]> {
        const query = this.settingsRepository.createQueryBuilder('setting');

        if (!includePrivate) {
            query.where('setting.isPublic = :isPublic', { isPublic: true });
        }

        return await query.orderBy('setting.category', 'ASC').addOrderBy('setting.key', 'ASC').getMany();
    }

    /**
     * Get settings by category
     */
    async getSettingsByCategory(category: string, includePrivate: boolean = false): Promise<SystemSettings[]> {
        const query = this.settingsRepository
            .createQueryBuilder('setting')
            .where('setting.category = :category', { category });

        if (!includePrivate) {
            query.andWhere('setting.isPublic = :isPublic', { isPublic: true });
        }

        return await query.orderBy('setting.key', 'ASC').getMany();
    }

    /**
     * Get a specific setting
     */
    async getSetting(category: string, key: string): Promise<any> {
        const cacheKey = `${category}:${key}`;

        // Check cache first
        if (this.settingsCache.has(cacheKey)) {
            const expiry = this.cacheExpiry.get(cacheKey);
            if (expiry && expiry > Date.now()) {
                return this.settingsCache.get(cacheKey);
            }
        }

        // Fetch from database
        const setting = await this.settingsRepository.findOne({
            where: { category, key },
        });

        if (!setting) {
            throw new NotFoundException(`Setting ${category}:${key} not found`);
        }

        const value = this.parseValue(setting);

        // Update cache
        this.settingsCache.set(cacheKey, value);
        this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

        return value;
    }

    /**
     * Create a setting
     */
    async createSetting(data: CreateSettingDto): Promise<SystemSettings> {
        const existing = await this.settingsRepository.findOne({
            where: { category: data.category, key: data.key },
        });

        if (existing) {
            throw new BadRequestException('Setting already exists');
        }

        const setting = this.settingsRepository.create(data);
        const saved = await this.settingsRepository.save(setting);

        // Update cache
        const cacheKey = `${data.category}:${data.key}`;
        this.settingsCache.set(cacheKey, this.parseValue(saved));
        this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

        return saved;
    }

    /**
     * Update a setting
     */
    async updateSetting(category: string, key: string, data: UpdateSettingDto): Promise<SystemSettings> {
        const setting = await this.settingsRepository.findOne({
            where: { category, key },
        });

        if (!setting) {
            throw new NotFoundException(`Setting ${category}:${key} not found`);
        }

        setting.value = data.value;
        if (data.description !== undefined) setting.description = data.description;
        if (data.isPublic !== undefined) setting.isPublic = data.isPublic;
        if (data.updatedBy) setting.updatedBy = data.updatedBy;

        const saved = await this.settingsRepository.save(setting);

        // Update cache
        const cacheKey = `${category}:${key}`;
        this.settingsCache.set(cacheKey, this.parseValue(saved));
        this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

        // Emit system update event
        this.eventsGateway.emitToAll('system_update', {
            type: 'setting_update',
            message: `System setting updated: ${category}.${key}`,
            data: { category, key, value: saved.value }
        });

        return saved;
    }

    /**
     * Update multiple settings in a category
     */
    async updateCategorySettings(category: string, settings: Record<string, any>, updatedBy?: string): Promise<SystemSettings[]> {
        const updated: SystemSettings[] = [];

        for (const [key, value] of Object.entries(settings)) {
            try {
                const setting = await this.updateSetting(category, key, { value, updatedBy });
                updated.push(setting);
            } catch (error) {
                // Skip if setting doesn't exist
                console.error(`Failed to update ${category}:${key}`, error);
            }
        }

        return updated;
    }

    /**
     * Delete a setting
     */
    async deleteSetting(category: string, key: string): Promise<void> {
        const setting = await this.settingsRepository.findOne({
            where: { category, key },
        });

        if (!setting) {
            throw new NotFoundException(`Setting ${category}:${key} not found`);
        }

        await this.settingsRepository.remove(setting);

        // Remove from cache
        const cacheKey = `${category}:${key}`;
        this.settingsCache.delete(cacheKey);
        this.cacheExpiry.delete(cacheKey);
    }

    /**
     * Clear settings cache
     */
    clearCache(): void {
        this.settingsCache.clear();
        this.cacheExpiry.clear();
    }

    /**
     * Refresh cache
     */
    async refreshCache(): Promise<void> {
        this.clearCache();
        await this.initializeCache();
    }

    /**
     * Get platform configuration (commonly used settings)
     */
    async getPlatformConfig() {
        return {
            platformName: await this.getSetting('general', 'platform_name'),
            defaultTimezone: await this.getSetting('general', 'default_timezone'),
            defaultCurrency: await this.getSetting('general', 'default_currency'),
            defaultLanguage: await this.getSetting('general', 'default_language'),
            maintenanceMode: await this.getSetting('features', 'maintenance_mode'),
            userRegistration: await this.getSetting('features', 'user_registration'),
            biddingEnabled: await this.getSetting('features', 'bidding_enabled'),
        };
    }

    /**
     * Get notification settings
     */
    async getNotificationSettings() {
        return {
            emailEnabled: await this.getSetting('notifications', 'email_enabled'),
            smsEnabled: await this.getSetting('notifications', 'sms_enabled'),
            pushEnabled: await this.getSetting('notifications', 'push_enabled'),
        };
    }

    /**
     * Get API settings
     */
    async getApiSettings() {
        return {
            rateLimitPerMinute: await this.getSetting('api', 'rate_limit_per_minute'),
            maxUploadSizeMb: await this.getSetting('api', 'max_upload_size_mb'),
        };
    }

    /**
     * Test email configuration
     */
    async testEmailConfiguration(testEmail: string): Promise<{ success: boolean; message: string }> {
        // This would integrate with your email service
        // For now, just return a mock response
        const emailEnabled = await this.getSetting('notifications', 'email_enabled');

        if (!emailEnabled) {
            return {
                success: false,
                message: 'Email notifications are disabled',
            };
        }

        // TODO: Implement actual email sending test
        return {
            success: true,
            message: `Test email would be sent to ${testEmail}`,
        };
    }

    /**
     * Test SMS configuration
     */
    async testSmsConfiguration(testPhone: string): Promise<{ success: boolean; message: string }> {
        // This would integrate with your SMS service
        // For now, just return a mock response
        const smsEnabled = await this.getSetting('notifications', 'sms_enabled');

        if (!smsEnabled) {
            return {
                success: false,
                message: 'SMS notifications are disabled',
            };
        }

        // TODO: Implement actual SMS sending test
        return {
            success: true,
            message: `Test SMS would be sent to ${testPhone}`,
        };
    }

    /**
     * Send email
     */
    async sendEmail(to: string, subject: string, body: string): Promise<void> {
        // Retrieve settings to check if email is enabled or get config
        const emailEnabled = await this.getSetting('notifications', 'email_enabled');
        if (!emailEnabled) {
            console.warn('Email sending attempted but email is disabled');
            return;
        }

        console.log(`Sending email to ${to}: ${subject}`);
        // Integration with nodemailer or external service would go here
    }

    /**
     * Send SMS
     */
    async sendSms(to: string, message: string): Promise<void> {
        const smsEnabled = await this.getSetting('notifications', 'sms_enabled');
        if (!smsEnabled) {
            console.warn('SMS sending attempted but SMS is disabled');
            return;
        }

        console.log(`Sending SMS to ${to}: ${message}`);
        // Integration with Twilio/AfricasTalking would go here
    }
}
