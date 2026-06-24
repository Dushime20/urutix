import { Controller, Get } from '@nestjs/common';
import { SystemSettingsService } from '../../services/system-settings.service';

@Controller('settings/public')
export class PublicSettingsController {
    constructor(private readonly settingsService: SystemSettingsService) { }

    /**
     * Get public contact settings (no auth required)
     */
    @Get('contact')
    async getPublicContactSettings() {
        try {
            const [phone, email, address] = await Promise.all([
                this.settingsService.getSetting('contact', 'phone').catch(() => '+250788309463'),
                this.settingsService.getSetting('contact', 'email').catch(() => 'hello@urutix.com'),
                this.settingsService.getSetting('contact', 'address').catch(() => 'Kigali, Rwanda · Nairobi, Kenya'),
            ]);

            return {
                phone,
                email,
                address,
            };
        } catch (error) {
            // Return defaults if settings not found
            return {
                phone: '+250788309463',
                email: 'hello@urutix.com',
                address: 'Kigali, Rwanda · Nairobi, Kenya',
            };
        }
    }
}
