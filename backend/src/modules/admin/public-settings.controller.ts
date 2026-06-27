import { Controller, Get, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemSettingsService } from '../../services/system-settings.service';

@Controller('settings/public')
export class PublicSettingsController {
  private readonly logger = new Logger(PublicSettingsController.name);

  constructor(
    private readonly settingsService: SystemSettingsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Returns public contact settings.
   * Priority: system_settings table → CONTACT_* env vars → empty strings.
   * No hardcoded values — if nothing is configured, fields return empty.
   */
  @Get('contact')
  async getPublicContactSettings() {
    try {
      const [phone, email, address] = await Promise.all([
        this.settingsService.getSetting('contact', 'phone')
          .catch(() => this.configService.get<string>('CONTACT_PHONE') || ''),
        this.settingsService.getSetting('contact', 'email')
          .catch(() => this.configService.get<string>('CONTACT_EMAIL') || ''),
        this.settingsService.getSetting('contact', 'address')
          .catch(() => this.configService.get<string>('CONTACT_ADDRESS') || ''),
      ]);

      return { phone, email, address };
    } catch (error) {
      this.logger.error(`Failed to load contact settings: ${error.message}`);
      return {
        phone:   this.configService.get<string>('CONTACT_PHONE')   || '',
        email:   this.configService.get<string>('CONTACT_EMAIL')   || '',
        address: this.configService.get<string>('CONTACT_ADDRESS') || '',
      };
    }
  }
}
