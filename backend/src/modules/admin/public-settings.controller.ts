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
   * Returns how tenant admins should pay subscription fees (public-safe fields).
   */
  @Get('subscription-payment')
  async getSubscriptionPaymentConfig() {
    const empty = {
      payment_method: 'mobile_money',
      momo_provider: 'MTN',
      bank_name: '',
      account_holder: '',
      bank_account_masked: '',
      configured: false,
    };

    try {
      const settings = await this.settingsService.getSettingsByCategory('subscription', true);
      const map: Record<string, string> = {};
      settings.forEach((row) => {
        map[row.key] = String(row.value ?? '');
      });

      const paymentMethod = map.payment_method || 'mobile_money';
      const momoPhone = map.momo_phone || '';
      const bankAccount = map.bank_account || '';

      return {
        payment_method: paymentMethod,
        momo_provider: map.momo_provider || 'MTN',
        bank_name: map.bank_name || '',
        account_holder: map.account_holder || '',
        bank_account_masked: bankAccount.length > 4
          ? `${'*'.repeat(Math.max(0, bankAccount.length - 4))}${bankAccount.slice(-4)}`
          : bankAccount,
        configured: paymentMethod === 'mobile_money'
          ? Boolean(momoPhone.trim())
          : Boolean(map.bank_name?.trim() && bankAccount.trim() && map.account_holder?.trim()),
      };
    } catch (error) {
      this.logger.error(`Failed to load subscription payment settings: ${error.message}`);
      const envPhone = this.configService.get<string>('MOBILE_MONEY_ACCOUNT_PHONE') || '';
      return {
        ...empty,
        configured: Boolean(envPhone),
      };
    }
  }

  /**
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
