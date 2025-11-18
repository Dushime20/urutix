import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {}

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;

    // In a real implementation, you would use a proper email service like SendGrid, AWS SES, etc.
    this.logger.log(`Verification email sent to ${email} with token: ${token}`);
    this.logger.log(`Verification URL: ${verificationUrl}`);

    // TODO: Implement actual email sending
    // Example with SendGrid:
    // await this.sendGridService.send({
    //   to: email,
    //   from: 'noreply@yourdomain.com',
    //   subject: 'Verify your email address',
    //   html: this.getVerificationEmailTemplate(verificationUrl),
    // });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

    this.logger.log(
      `Password reset email sent to ${email} with token: ${token}`,
    );
    this.logger.log(`Reset URL: ${resetUrl}`);

    // TODO: Implement actual email sending
  }

  private getVerificationEmailTemplate(verificationUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify your email address</h2>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
          Verify Email
        </a>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `;
  }

  private getPasswordResetEmailTemplate(resetUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 4px;">
          Reset Password
        </a>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      </div>
    `;
  }
}
