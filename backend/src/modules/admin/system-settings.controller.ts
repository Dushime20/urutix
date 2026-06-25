import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { SystemSettingsService, CreateSettingDto, UpdateSettingDto } from '../../services/system-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SystemSettingsController {
    constructor(private readonly settingsService: SystemSettingsService) { }

    /**
     * Get all settings
     */
    @Get()
    async getAllSettings(@Query('includePrivate') includePrivate?: string) {
        return await this.settingsService.getAllSettings(includePrivate === 'true');
    }

    /**
     * Get settings by category
     */
    @Get('category/:category')
    async getSettingsByCategory(
        @Param('category') category: string,
        @Query('includePrivate') includePrivate?: string,
    ) {
        return await this.settingsService.getSettingsByCategory(
            category,
            includePrivate === 'true',
        );
    }

    /**
     * Get a specific setting
     */
    @Get(':category/:key')
    async getSetting(
        @Param('category') category: string,
        @Param('key') key: string,
    ) {
        const value = await this.settingsService.getSetting(category, key);
        return { category, key, value };
    }

    /**
     * Get platform configuration
     */
    @Get('config/platform')
    async getPlatformConfig() {
        return await this.settingsService.getPlatformConfig();
    }

    /**
     * Get notification settings
     */
    @Get('config/notifications')
    async getNotificationSettings() {
        return await this.settingsService.getNotificationSettings();
    }

    /**
     * Get API settings
     */
    @Get('config/api')
    async getApiSettings() {
        return await this.settingsService.getApiSettings();
    }

    /**
     * Create a new setting
     */
    @Post()
    async createSetting(@Body() data: CreateSettingDto, @Req() req: any) {
        data.updatedBy = req.user?.id;
        return await this.settingsService.createSetting(data);
    }

    /**
     * Update a setting
     */
    @Put(':category/:key')
    async updateSetting(
        @Param('category') category: string,
        @Param('key') key: string,
        @Body() data: UpdateSettingDto,
        @Req() req: any,
    ) {
        data.updatedBy = req.user?.id;
        return await this.settingsService.updateSetting(category, key, data);
    }

    /**
     * Update multiple settings in a category
     */
    @Put('category/:category')
    async updateCategorySettings(
        @Param('category') category: string,
        @Body() settings: Record<string, any>,
        @Req() req: any,
    ) {
        return await this.settingsService.updateCategorySettings(
            category,
            settings,
            req.user?.id,
        );
    }

    /**
     * Delete a setting
     */
    @Delete(':category/:key')
    async deleteSetting(
        @Param('category') category: string,
        @Param('key') key: string,
    ) {
        await this.settingsService.deleteSetting(category, key);
        return { message: 'Setting deleted successfully' };
    }

    /**
     * Clear settings cache
     */
    @Post('cache/clear')
    async clearCache() {
        this.settingsService.clearCache();
        return { message: 'Settings cache cleared successfully' };
    }

    /**
     * Refresh settings cache
     */
    @Post('cache/refresh')
    async refreshCache() {
        await this.settingsService.refreshCache();
        return { message: 'Settings cache refreshed successfully' };
    }

    /**
     * Test email configuration
     */
    @Post('test/email')
    async testEmailConfiguration(@Body('email') email: string) {
        return await this.settingsService.testEmailConfiguration(email);
    }

    /**
     * Test SMS configuration
     */
    @Post('test/sms')
    async testSmsConfiguration(@Body('phone') phone: string) {
        return await this.settingsService.testSmsConfiguration(phone);
    }

    /**
     * Export all settings
     */
    @Get('data/export')
    async exportSettings() {
        const settings = await this.settingsService.getAllSettings(true);
        return {
            exportedAt: new Date().toISOString(),
            version: '1.0',
            settings
        };
    }

    /**
     * Import settings
     */
    @Post('data/import')
    async importSettings(@Body() data: { settings: any[] }, @Req() req: any) {
        if (!data.settings || !Array.isArray(data.settings)) {
            throw new Error('Invalid settings data');
        }

        const stats = {
            processed: 0,
            updated: 0,
            created: 0,
            failed: 0
        };

        for (const setting of data.settings) {
            try {
                stats.processed++;
                // Try to update existing, or create new
                try {
                    await this.settingsService.updateSetting(setting.category, setting.key, {
                        value: setting.value,
                        description: setting.description,
                        isPublic: setting.isPublic,
                        updatedBy: req.user?.id
                    });
                    stats.updated++;
                } catch {
                    // If not found, create
                    await this.settingsService.createSetting({
                        ...setting,
                        updatedBy: req.user?.id
                    });
                    stats.created++;
                }
            } catch (e) {
                stats.failed++;
            }
        }

        await this.settingsService.refreshCache();
        return { message: 'Settings imported successfully', stats };
    }
}
