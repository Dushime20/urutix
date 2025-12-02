import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Initialize SMTP transporter
    this.logger.log('========== INITIALIZING EMAIL SERVICE ==========');
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    const smtpSecure = this.configService.get<boolean>('SMTP_SECURE', false);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    this.logger.log('SMTP Configuration Check:');
    this.logger.log(`  SMTP_HOST: ${smtpHost || 'NOT SET'}`);
    this.logger.log(`  SMTP_PORT: ${smtpPort}`);
    this.logger.log(`  SMTP_USER: ${smtpUser ? 'SET (hidden)' : 'NOT SET'}`);
    this.logger.log(`  SMTP_PASS: ${smtpPass ? 'SET (hidden)' : 'NOT SET'}`);
    this.logger.log(`  SMTP_SECURE: ${smtpSecure}`);
    this.logger.log(`  FRONTEND_URL: ${frontendUrl || 'NOT SET'}`);

    if (smtpHost && smtpUser && smtpPass) {
      try {
        // Auto-detect secure based on port if not explicitly set
        // Port 465 = SSL (secure: true), Port 587 = STARTTLS (secure: false)
        let useSecure = smtpSecure;
        if (smtpPort === 465) {
          useSecure = true;
          this.logger.log('Using SSL (port 465)');
        } else if (smtpPort === 587) {
          useSecure = false;
          this.logger.log('Using STARTTLS (port 587)');
        }

        // Build transporter config based on port
        const transporterConfig: any = {
          host: smtpHost,
          port: smtpPort,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        };

        // Configure based on port
        if (smtpPort === 587) {
          // Port 587 uses STARTTLS - connect in plain text, then upgrade to TLS
          // For Gmail, sometimes we need to be more explicit
          transporterConfig.secure = false; // Must be false - start with plain connection
          transporterConfig.requireTLS = false; // Don't require TLS, let server negotiate
          transporterConfig.ignoreTLS = false; // Don't ignore TLS
          // Remove any TLS config that might interfere
        } else if (smtpPort === 465) {
          // Port 465 uses SSL - immediate SSL connection
          transporterConfig.secure = true; // Must be true for SSL
          transporterConfig.tls = {
            rejectUnauthorized: false,
          };
        } else {
          // Other ports - use the configured secure value
          transporterConfig.secure = useSecure;
        }

        this.transporter = nodemailer.createTransport(transporterConfig);
        
        this.logger.log('✅ SMTP transporter created');
        this.logger.log(`Configuration: ${smtpHost}:${smtpPort}, secure: ${useSecure}`);
        this.logger.log(`Transporter config:`, JSON.stringify({
          host: transporterConfig.host,
          port: transporterConfig.port,
          secure: transporterConfig.secure,
          requireTLS: transporterConfig.requireTLS,
        }));
        
        // Verify connection (async, don't wait) - but don't fail if verification fails
        // Some SMTP servers don't support verification but still work for sending
        this.transporter.verify((error, success) => {
          if (error) {
            this.logger.warn('⚠️ SMTP connection verification failed (this is OK, emails may still work):', error.message);
            if ((error as any).code) {
              this.logger.warn('⚠️ Error code:', (error as any).code);
            }
            this.logger.warn('⚠️ Will attempt to send emails anyway. If emails fail, check:');
            this.logger.warn('   - For Gmail: Use port 587 with secure=false');
            this.logger.warn('   - For Gmail: Use port 465 with secure=true');
            this.logger.warn('   - Make sure you\'re using an App Password, not regular password');
          } else {
            this.logger.log('✅ SMTP transporter initialized and verified successfully');
            this.logger.log('✅ Ready to send emails');
          }
        });
      } catch (error: any) {
        this.logger.error('❌ Failed to create SMTP transporter:', error.message);
        this.transporter = null as any;
      }
    } else {
      this.logger.error('❌ SMTP configuration incomplete!');
      this.logger.error('❌ Missing required variables:');
      if (!smtpHost) this.logger.error('   - SMTP_HOST');
      if (!smtpUser) this.logger.error('   - SMTP_USER');
      if (!smtpPass) this.logger.error('   - SMTP_PASS');
      this.logger.warn(
        '⚠️ Email sending will be logged only. Add SMTP configuration to .env file and restart server.',
      );
      this.transporter = null as any;
    }
    this.logger.log('========== EMAIL SERVICE INITIALIZATION COMPLETE ==========');
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('EMAIL_FROM_ADDRESS') ||
      this.configService.get<string>('SMTP_USER') ||
      'noreply@urutix.com';

    this.logger.log(`Sending verification email to ${email}`);
    this.logger.log(`Verification URL: ${verificationUrl}`);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: fromAddress,
          to: email,
          subject: 'Verify your email address - UrutiX',
          html: this.getVerificationEmailTemplate(verificationUrl),
        });
        this.logger.log(`Verification email sent successfully to ${email}`);
      } catch (error) {
        this.logger.error(`Failed to send verification email: ${error.message}`);
        throw error;
      }
    } else {
      this.logger.warn(
        `SMTP not configured. Email would be sent to ${email} with URL: ${verificationUrl}`,
      );
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('EMAIL_FROM_ADDRESS') ||
      this.configService.get<string>('SMTP_USER') ||
      'noreply@urutix.com';

    this.logger.log(`Sending password reset email to ${email}`);
    this.logger.log(`Reset URL: ${resetUrl}`);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: fromAddress,
          to: email,
          subject: 'Reset your password - UrutiX',
          html: this.getPasswordResetEmailTemplate(resetUrl),
        });
        this.logger.log(`Password reset email sent successfully to ${email}`);
      } catch (error) {
        this.logger.error(`Failed to send password reset email: ${error.message}`);
        throw error;
      }
    } else {
      this.logger.warn(
        `SMTP not configured. Email would be sent to ${email} with URL: ${resetUrl}`,
      );
    }
  }

  async sendDriverPasswordSetupEmail(
    email: string,
    firstName: string,
    lastName: string,
    token: string,
  ): Promise<void> {
    this.logger.log('========== EMAIL SERVICE CALLED ==========');
    this.logger.log(`Attempting to send driver password setup email to: ${email}`);
    
    // Construct the setup URL - use FRONTEND_URL from env, or default to localhost:3001
    // This will work on whatever port the frontend is running on
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3001';
    // Remove trailing slash if present and construct the full URL
    const baseUrl = frontendUrl.replace(/\/$/, '');
    const setupUrl = `${baseUrl}/driver/setup-password?token=${token}`;
    
    this.logger.log(`📧 Password setup URL: ${setupUrl}`);
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('EMAIL_FROM_ADDRESS') ||
      this.configService.get<string>('SMTP_USER') ||
      'noreply@urutix.com';

    // Check SMTP configuration
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    
    this.logger.log(`SMTP Configuration Check:`);
    this.logger.log(`  SMTP_HOST: ${smtpHost ? 'SET' : 'NOT SET'}`);
    this.logger.log(`  SMTP_USER: ${smtpUser ? 'SET' : 'NOT SET'}`);
    this.logger.log(`  SMTP_PASS: ${smtpPass ? 'SET' : 'NOT SET'}`);
    this.logger.log(`  Transporter exists: ${this.transporter ? 'YES' : 'NO'}`);
    this.logger.log(`  Setup URL: ${setupUrl}`);
    this.logger.log(`  From Address: ${fromAddress}`);

    if (this.transporter) {
      this.logger.log('✅ SMTP transporter is configured, attempting to send email...');
      try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error(`Invalid email format: ${email}`);
        }

        const htmlContent = this.getDriverPasswordSetupEmailTemplate(
          firstName,
          lastName,
          setupUrl,
        );
        
        const plainTextContent = `
Welcome to UrutiX, ${firstName}!

Your truck owner has created a driver account for you. To get started, please set up your password by clicking the link below:

${setupUrl}

After setting your password, you'll be able to log in and access your driver dashboard.

If you didn't expect this email, please contact your truck owner or ignore this message.

This link will expire in 7 days.
        `.trim();

        const mailOptions = {
          from: fromAddress,
          to: email.trim().toLowerCase(), // Normalize email
          subject: 'Set up your UrutiX Driver Account Password',
          text: plainTextContent, // Plain text version
          html: htmlContent, // HTML version
        };
        
        this.logger.log('📧 Mail options:', JSON.stringify({
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject,
        }, null, 2));
        
        // Try to send the email
        // Note: Even if verify() failed, sendMail() might still work
        this.logger.log('📧 Attempting to send email via SMTP...');
        const result = await this.transporter.sendMail(mailOptions);
        
        // Check if email was actually accepted
        if (result.accepted && result.accepted.length > 0) {
          this.logger.log(`✅ Driver password setup email sent successfully to ${email}`);
          this.logger.log(`📧 Email result:`, JSON.stringify({
            messageId: result.messageId,
            accepted: result.accepted,
            rejected: result.rejected || [],
            response: result.response,
          }, null, 2));
        } else if (result.rejected && result.rejected.length > 0) {
          this.logger.error(`❌ Email was rejected by server`);
          this.logger.error(`❌ Rejected recipients:`, result.rejected);
          throw new Error(`Email was rejected: ${result.rejected.join(', ')}`);
        } else {
          this.logger.warn(`⚠️ Email sent but no acceptance/rejection info available`);
          this.logger.log(`📧 Email result:`, JSON.stringify(result, null, 2));
        }
      } catch (error: any) {
        this.logger.error(`❌ Failed to send driver password setup email to ${email}`);
        this.logger.error(`❌ Error message: ${error.message}`);
        if (error.code) {
          this.logger.error(`❌ Error code: ${error.code}`);
        }
        if (error.response) {
          this.logger.error(`❌ Error response: ${error.response}`);
        }
        if (error.responseCode) {
          this.logger.error(`❌ Error response code: ${error.responseCode}`);
        }
        if (error.command) {
          this.logger.error(`❌ Failed command: ${error.command}`);
        }
        this.logger.error(`❌ Full error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
        
        // Provide helpful error message
        if (error.code === 'ESOCKET' || error.message?.includes('wrong version number')) {
          this.logger.error('❌ SSL/TLS Configuration Error Detected!');
          this.logger.error('❌ Try switching to port 465 with secure=true in your .env:');
          this.logger.error('   SMTP_PORT=465');
          this.logger.error('   SMTP_SECURE=true');
        }
        
        // Re-throw so caller can handle it
        throw error;
      }
    } else {
      const warningMessage = `❌ SMTP NOT CONFIGURED! Email would be sent to ${email} with URL: ${setupUrl}. Please configure SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables in .env file and restart the server.`;
      this.logger.error(warningMessage);
      this.logger.error('❌ To fix: Add these to your .env file:');
      this.logger.error('   SMTP_HOST=smtp.gmail.com');
      this.logger.error('   SMTP_PORT=587');
      this.logger.error('   SMTP_USER=your-email@gmail.com');
      this.logger.error('   SMTP_PASS=your-app-password');
      this.logger.error('   FRONTEND_URL=http://localhost:3001');
      // Don't throw error if SMTP is not configured - just log warning
      // This allows driver creation to succeed even if email can't be sent
    }
    this.logger.log('========== EMAIL SERVICE CALL END ==========');
  }

  async sendLenderPasswordSetupEmail(
    email: string,
    lenderName: string,
    token: string,
  ): Promise<void> {
    this.logger.log('========== LENDER EMAIL SERVICE CALLED ==========');
    this.logger.log(`Attempting to send lender password setup email to: ${email}`);
    
    // Construct the setup URL - use FRONTEND_URL from env, or default to localhost:3001
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3001';
    const baseUrl = frontendUrl.replace(/\/$/, '');
    const setupUrl = `${baseUrl}/lender/setup-password?token=${token}`;
    
    this.logger.log(`📧 Lender password setup URL: ${setupUrl}`);
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('EMAIL_FROM_ADDRESS') ||
      this.configService.get<string>('SMTP_USER') ||
      'noreply@urutix.com';

    // Check SMTP configuration
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    
    this.logger.log(`SMTP Configuration Check for lender email:`);
    this.logger.log(`  SMTP_HOST: ${smtpHost ? 'SET' : 'NOT SET'}`);
    this.logger.log(`  SMTP_USER: ${smtpUser ? 'SET' : 'NOT SET'}`);
    this.logger.log(`  SMTP_PASS: ${smtpPass ? 'SET' : 'NOT SET'}`);
    this.logger.log(`  Transporter exists: ${this.transporter ? 'YES' : 'NO'}`);
    this.logger.log(`  Setup URL: ${setupUrl}`);
    this.logger.log(`  From Address: ${fromAddress}`);

    if (this.transporter) {
      this.logger.log('✅ SMTP transporter is configured, attempting to send email...');
      try {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error(`Invalid email format: ${email}`);
        }

        const htmlContent = this.getLenderPasswordSetupEmailTemplate(
          lenderName,
          setupUrl,
        );
        
        const plainTextContent = `
Welcome to UrutiX!

Your lender account "${lenderName}" has been created. To get started, please set up your password by clicking the link below:

${setupUrl}

After setting your password, you'll be able to log in and access your lender dashboard.

If you didn't expect this email, please contact support or ignore this message.

This link will expire in 7 days.
        `.trim();

        const mailOptions = {
          from: fromAddress,
          to: email.trim().toLowerCase(),
          subject: `Set up your UrutiX Lender Account Password - ${lenderName}`,
          text: plainTextContent,
          html: htmlContent,
        };
        
        this.logger.log('📧 Mail options:', JSON.stringify({
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject,
        }, null, 2));
        
        this.logger.log('📧 Attempting to send email via SMTP...');
        const result = await this.transporter.sendMail(mailOptions);
        
        this.logger.log('📧 Email send result:', JSON.stringify({
          messageId: result.messageId,
          accepted: result.accepted,
          rejected: result.rejected || [],
          response: result.response,
        }, null, 2));
        
        if (result.accepted && result.accepted.length > 0) {
          this.logger.log(`✅ Lender password setup email sent successfully to ${email}`);
          this.logger.log(`✅ Message ID: ${result.messageId}`);
        } else if (result.rejected && result.rejected.length > 0) {
          this.logger.error(`❌ Email was rejected by server`);
          this.logger.error(`❌ Rejected recipients:`, result.rejected);
          throw new Error(`Email was rejected: ${result.rejected.join(', ')}`);
        } else {
          this.logger.warn(`⚠️ Email sent but no acceptance/rejection info available`);
          this.logger.log(`📧 Email result:`, JSON.stringify(result, null, 2));
        }
      } catch (error: any) {
        this.logger.error(`❌ Failed to send lender password setup email to ${email}`);
        this.logger.error(`❌ Error: ${error.message}`);
        if (error.code) {
          this.logger.error(`❌ Error code: ${error.code}`);
        }
        if (error.response) {
          this.logger.error(`❌ Error response: ${error.response}`);
        }
        if (error.responseCode) {
          this.logger.error(`❌ Error response code: ${error.responseCode}`);
        }
        if (error.command) {
          this.logger.error(`❌ Failed command: ${error.command}`);
        }
        this.logger.error(`❌ Full error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
        throw error;
      }
    } else {
      const errorMessage = 'SMTP transporter is not configured. Email cannot be sent.';
      this.logger.error(`❌ ${errorMessage}`);
      this.logger.error('❌ To fix: Add SMTP configuration to your .env file:');
      this.logger.error('   SMTP_HOST=smtp.gmail.com');
      this.logger.error('   SMTP_PORT=587');
      this.logger.error('   SMTP_USER=your-email@gmail.com');
      this.logger.error('   SMTP_PASS=your-app-password');
      this.logger.error('   FRONTEND_URL=http://localhost:3001');
      // Throw error so caller knows email failed
      throw new Error(errorMessage);
    }
    this.logger.log('========== LENDER EMAIL SERVICE CALL END ==========');
  }

  async sendTenantPasswordSetupEmail(
    email: string,
    firstName: string,
    lastName: string,
    tenantName: string,
    token: string,
  ): Promise<void> {
    this.logger.log('========== TENANT EMAIL SERVICE CALLED ==========');
    this.logger.log(`Attempting to send tenant password setup email to: ${email}`);
    
    // Construct the setup URL - use FRONTEND_URL from env, or default to localhost:3001
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3001';
    const baseUrl = frontendUrl.replace(/\/$/, '');
    const setupUrl = `${baseUrl}/tenant/setup-password?token=${token}`;
    
    this.logger.log(`📧 Tenant password setup URL: ${setupUrl}`);
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('EMAIL_FROM_ADDRESS') ||
      this.configService.get<string>('SMTP_USER') ||
      'noreply@urutix.com';

    // Check SMTP configuration
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    
    this.logger.log(`SMTP Configuration Check for tenant email:`);
    this.logger.log(`  SMTP_HOST: ${smtpHost ? 'SET' : 'NOT SET'}`);
    this.logger.log(`  SMTP_USER: ${smtpUser ? 'SET' : 'NOT SET'}`);
    this.logger.log(`  SMTP_PASS: ${smtpPass ? 'SET' : 'NOT SET'}`);
    this.logger.log(`  Transporter exists: ${this.transporter ? 'YES' : 'NO'}`);
    this.logger.log(`  Setup URL: ${setupUrl}`);
    this.logger.log(`  From Address: ${fromAddress}`);

    if (this.transporter) {
      this.logger.log('✅ SMTP transporter is configured, attempting to send email...');
      try {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error(`Invalid email format: ${email}`);
        }

        const htmlContent = this.getTenantPasswordSetupEmailTemplate(
          firstName,
          lastName,
          tenantName,
          setupUrl,
        );
        
        const plainTextContent = `
Welcome to UrutiX, ${firstName}!

Your tenant account "${tenantName}" has been created. To get started, please set up your password by clicking the link below:

${setupUrl}

After setting your password, you'll be able to log in and access your tenant dashboard.

If you didn't expect this email, please contact support or ignore this message.

This link will expire in 7 days.
        `.trim();

        const mailOptions = {
          from: fromAddress,
          to: email.trim().toLowerCase(),
          subject: `Set up your UrutiX Tenant Account Password - ${tenantName}`,
          text: plainTextContent,
          html: htmlContent,
        };
        
        this.logger.log('📧 Mail options:', JSON.stringify({
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject,
        }, null, 2));
        
        this.logger.log('📧 Attempting to send email via SMTP...');
        const result = await this.transporter.sendMail(mailOptions);
        
        this.logger.log('📧 Email send result:', JSON.stringify({
          messageId: result.messageId,
          accepted: result.accepted,
          rejected: result.rejected || [],
          response: result.response,
        }, null, 2));
        
        if (result.accepted && result.accepted.length > 0) {
          this.logger.log(`✅ Tenant password setup email sent successfully to ${email}`);
          this.logger.log(`✅ Message ID: ${result.messageId}`);
        } else if (result.rejected && result.rejected.length > 0) {
          this.logger.error(`❌ Email was rejected by server`);
          this.logger.error(`❌ Rejected recipients:`, result.rejected);
          throw new Error(`Email was rejected: ${result.rejected.join(', ')}`);
        } else {
          this.logger.warn(`⚠️ Email sent but no acceptance/rejection info available`);
          this.logger.log(`📧 Email result:`, JSON.stringify(result, null, 2));
        }
      } catch (error: any) {
        this.logger.error(`❌ Failed to send tenant password setup email to ${email}`);
        this.logger.error(`❌ Error: ${error.message}`);
        if (error.code) {
          this.logger.error(`❌ Error code: ${error.code}`);
        }
        if (error.response) {
          this.logger.error(`❌ Error response: ${error.response}`);
        }
        if (error.responseCode) {
          this.logger.error(`❌ Error response code: ${error.responseCode}`);
        }
        if (error.command) {
          this.logger.error(`❌ Failed command: ${error.command}`);
        }
        this.logger.error(`❌ Full error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
        throw error;
      }
    } else {
      this.logger.error('❌ SMTP transporter is not configured. Email will not be sent.');
      this.logger.error('❌ To fix: Add SMTP configuration to your .env file:');
      this.logger.error('   SMTP_HOST=smtp.gmail.com');
      this.logger.error('   SMTP_PORT=587');
      this.logger.error('   SMTP_USER=your-email@gmail.com');
      this.logger.error('   SMTP_PASS=your-app-password');
      this.logger.error('   FRONTEND_URL=http://localhost:3001');
      // Don't throw error if SMTP is not configured - just log warning
      // This allows tenant creation to succeed even if email can't be sent
    }
    this.logger.log('========== TENANT EMAIL SERVICE CALL END ==========');
  }

  private getDriverPasswordSetupEmailTemplate(
    firstName: string,
    lastName: string,
    setupUrl: string,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Welcome to UrutiX, ${firstName}!</h2>
        <p>Your truck owner has created a driver account for you. To get started, please set up your password by clicking the link below:</p>
        <a href="${setupUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          Set Up Password
        </a>
        <p>After setting your password, you'll be able to log in and access your driver dashboard.</p>
        <p>If you didn't expect this email, please contact your truck owner or ignore this message.</p>
        <p>This link will expire in 7 days.</p>
      </div>
    `;
  }

  private getLenderPasswordSetupEmailTemplate(
    lenderName: string,
    setupUrl: string,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Welcome to UrutiX!</h2>
        <p>Your lender account "<strong>${lenderName}</strong>" has been created. To get started, please set up your password by clicking the link below:</p>
        <a href="${setupUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          Set Up Password
        </a>
        <p>After setting your password, you'll be able to log in and access your lender dashboard.</p>
        <p>If you didn't expect this email, please contact support or ignore this message.</p>
        <p>This link will expire in 7 days.</p>
      </div>
    `;
  }

  private getTenantPasswordSetupEmailTemplate(
    firstName: string,
    lastName: string,
    tenantName: string,
    setupUrl: string,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Welcome to UrutiX, ${firstName}!</h2>
        <p>Your tenant account "<strong>${tenantName}</strong>" has been created. To get started, please set up your password by clicking the link below:</p>
        <a href="${setupUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          Set Up Password
        </a>
        <p>After setting your password, you'll be able to log in and access your tenant dashboard.</p>
        <p>If you didn't expect this email, please contact support or ignore this message.</p>
        <p>This link will expire in 7 days.</p>
      </div>
    `;
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
