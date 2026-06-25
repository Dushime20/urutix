import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { getEnvConfig } from '../../../config/env.config';

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

  /**
   * Get frontend URL - REQUIRED, no fallback
   * Throws error if FRONTEND_URL is not set in environment
   */
  private getFrontendUrl(): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    
    if (!frontendUrl) {
      const errorMessage = 
        '❌ CRITICAL ERROR: FRONTEND_URL environment variable is not set!\n' +
        '❌ This is REQUIRED for email links to work correctly.\n' +
        '❌ Please add FRONTEND_URL to your .env file:\n' +
        '❌   Set FRONTEND_URL to your actual server URL (e.g. http://your-ip:5173 or https://yourdomain.com)\n' +
        '❌   For production: FRONTEND_URL=https://urutix.com\n' +
        '❌   Or use your domain: FRONTEND_URL=https://yourdomain.com';
      
      this.logger.error(errorMessage);
      throw new Error('FRONTEND_URL environment variable is required but not set');
    }
    
    return frontendUrl;
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.getFrontendUrl();
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      getEnvConfig().smtpFrom;

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
    this.logger.log('========== PASSWORD RESET EMAIL SERVICE CALLED ==========');
    this.logger.log(`Attempting to send password reset email to: ${email}`);

    const { frontendUrl } = getEnvConfig();
    const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${token}`;

    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      getEnvConfig().smtpFrom;

    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    this.logger.log('SMTP Configuration Check:');
    this.logger.log(`  SMTP_HOST: ${smtpHost ? 'SET' : 'NOT SET'}`);
    this.logger.log(`  SMTP_USER: ${smtpUser ? 'SET' : 'NOT SET'}`);
    this.logger.log(`  SMTP_PASS: ${smtpPass ? 'SET' : 'NOT SET'}`);
    this.logger.log(`  Transporter exists: ${this.transporter ? 'YES' : 'NO'}`);
    this.logger.log(`  Reset URL: ${resetUrl}`);
    this.logger.log(`  From Address: ${fromAddress}`);

    if (this.transporter) {
      this.logger.log('✅ SMTP transporter is configured, attempting to send password reset email...');
      try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error(`Invalid email format: ${email}`);
        }

        const plainTextContent = `
Reset your UrutiX password

You requested a password reset. Click the link below to set a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

The UrutiX Team
        `.trim();

        const mailOptions = {
          from: fromAddress,
          to: email.trim().toLowerCase(),
          subject: 'Reset your password - UrutiX',
          text: plainTextContent,
          html: this.getPasswordResetEmailTemplate(resetUrl),
        };

        this.logger.log('📧 Mail options:', JSON.stringify({
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject,
        }, null, 2));

        this.logger.log('📧 Attempting to send password reset email via SMTP...');
        const result = await this.transporter.sendMail(mailOptions);

        this.logger.log('📧 Email send result:', JSON.stringify({
          messageId: result.messageId,
          accepted: result.accepted,
          rejected: result.rejected || [],
          response: result.response,
        }, null, 2));

        if (result.accepted && result.accepted.length > 0) {
          this.logger.log(`✅ Password reset email sent successfully to ${email}`);
          this.logger.log(`✅ Message ID: ${result.messageId}`);
        } else if (result.rejected && result.rejected.length > 0) {
          this.logger.error(`❌ Password reset email was rejected by server`);
          this.logger.error(`❌ Rejected recipients:`, result.rejected);
          throw new Error(`Email was rejected: ${result.rejected.join(', ')}`);
        } else {
          this.logger.warn(`⚠️ Password reset email sent but no acceptance/rejection info available`);
        }
      } catch (error: any) {
        this.logger.error(`❌ Failed to send password reset email to ${email}`);
        this.logger.error(`❌ Error message: ${error.message}`);
        if (error.code) this.logger.error(`❌ Error code: ${error.code}`);
        if (error.response) this.logger.error(`❌ Error response: ${error.response}`);
        if (error.responseCode) this.logger.error(`❌ Error response code: ${error.responseCode}`);
        if (error.command) this.logger.error(`❌ Failed command: ${error.command}`);
        this.logger.error(`❌ Full error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
        // Re-throw so the caller knows the email failed
        throw error;
      }
    } else {
      this.logger.error('❌ SMTP NOT CONFIGURED! Password reset email cannot be sent.');
      this.logger.error('❌ To fix: Add these to your .env file:');
      this.logger.error('   SMTP_HOST=smtp.gmail.com');
      this.logger.error('   SMTP_PORT=465');
      this.logger.error('   SMTP_USER=your-email@gmail.com');
      this.logger.error('   SMTP_PASS=your-app-password');
      throw new Error('SMTP not configured. Cannot send password reset email.');
    }
    this.logger.log('========== PASSWORD RESET EMAIL SERVICE CALL END ==========');
  }

  async sendDriverPasswordSetupEmail(
    email: string,
    firstName: string,
    lastName: string,
    token: string,
  ): Promise<void> {
    this.logger.log('========== EMAIL SERVICE CALLED ==========');
    this.logger.log(`Attempting to send driver password setup email to: ${email}`);
    
    const { frontendUrl } = getEnvConfig();
    // Remove trailing slash if present and construct the full URL
    const baseUrl = frontendUrl.replace(/\/$/, '');
    const setupUrl = `${baseUrl}/driver/setup-password?token=${token}`;
    
    this.logger.log(`📧 Password setup URL: ${setupUrl}`);
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      getEnvConfig().smtpFrom;

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
      // Don't throw error if SMTP is not configured - just log warning
      // This allows driver creation to succeed even if email can't be sent
    }
    this.logger.log('========== EMAIL SERVICE CALL END ==========');
  }

  async sendDriverWelcomeEmail(
    email: string,
    firstName: string,
    lastName: string,
  ): Promise<void> {
    this.logger.log('========== EMAIL SERVICE CALLED ==========');
    this.logger.log(`Attempting to send driver welcome email to: ${email}`);
    
    const { frontendUrl } = getEnvConfig();
    const loginUrl = `${frontendUrl.replace(/\/$/, '')}/auth`;
    
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      getEnvConfig().smtpFrom;

    if (this.transporter) {
      try {
        const htmlContent = this.getDriverWelcomeEmailTemplate(
          firstName,
          lastName,
          loginUrl,
        );
        
        const plainTextContent = `
Welcome to the fleet, ${firstName}!

A truck owner has added you as a driver on UrutiX. Since you already have an account, you can log in directly using your existing credentials to access your new driver dashboard:

${loginUrl}

If you have any questions, please contact your truck owner or our support team.

Best regards,
The UrutiX Team
        `.trim();

        await this.transporter.sendMail({
          from: fromAddress,
          to: email.trim().toLowerCase(),
          subject: 'You have been added as a Driver on UrutiX',
          text: plainTextContent,
          html: htmlContent,
        });
        this.logger.log(`✅ Driver welcome email sent successfully to ${email}`);
      } catch (error: any) {
        this.logger.error(`❌ Failed to send driver welcome email: ${error.message}`);
        throw error;
      }
    } else {
      this.logger.warn(`❌ SMTP NOT CONFIGURED! Welcome email to ${email} skipped.`);
    }
  }

  async sendLenderPasswordSetupEmail(
    email: string,
    lenderName: string,
    token: string,
  ): Promise<void> {
    this.logger.log('========== LENDER EMAIL SERVICE CALLED ==========');
    this.logger.log(`Attempting to send lender password setup email to: ${email}`);
    
    // Construct the setup URL - use FRONTEND_URL from env
    const { frontendUrl } = getEnvConfig();
    const baseUrl = frontendUrl.replace(/\/$/, '');
    const setupUrl = `${baseUrl}/lender/setup-password?token=${token}`;
    
    this.logger.log(`📧 Lender password setup URL: ${setupUrl}`);
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      getEnvConfig().smtpFrom;

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
    
    // Construct the setup URL - use FRONTEND_URL from env
    const { frontendUrl } = getEnvConfig();
    const baseUrl = frontendUrl.replace(/\/$/, '');
    const setupUrl = `${baseUrl}/tenant/setup-password?token=${token}`;
    
    this.logger.log(`📧 Tenant password setup URL: ${setupUrl}`);
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      getEnvConfig().smtpFrom;

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
      // Don't throw error if SMTP is not configured - just log warning
      // This allows tenant creation to succeed even if email can't be sent
    }
    this.logger.log('========== TENANT EMAIL SERVICE CALL END ==========');
  }

  async sendCargoOwnerPasswordSetupEmail(
    email: string,
    firstName: string,
    lastName: string,
    token: string,
  ): Promise<void> {
    this.logger.log('========== CARGO OWNER EMAIL SERVICE CALLED ==========');
    this.logger.log(`Attempting to send cargo owner password setup email to: ${email}`);
    
    // Construct the setup URL - use FRONTEND_URL from env
    const { frontendUrl } = getEnvConfig();
    const baseUrl = frontendUrl.replace(/\/$/, '');
    const setupUrl = `${baseUrl}/cargo-owner/setup-password?token=${token}`;
    
    this.logger.log(`📧 Cargo owner password setup URL: ${setupUrl}`);
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      getEnvConfig().smtpFrom;

    // Check SMTP configuration
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    
    this.logger.log(`SMTP Configuration Check for cargo owner email:`);
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

        const htmlContent = this.getCargoOwnerPasswordSetupEmailTemplate(
          firstName,
          lastName,
          setupUrl,
        );
        
        const plainTextContent = `
Welcome to UrutiX, ${firstName}!

Your cargo owner account has been created. To get started, please set up your password by clicking the link below:

${setupUrl}

After setting your password, you'll be able to log in and access your cargo owner dashboard to:
- Create and manage cargo shipments
- Track your shipments in real-time
- Manage receivers and delivery locations
- View shipping history and analytics

If you didn't expect this email, please contact support or ignore this message.

This link will expire in 7 days.
        `.trim();

        const mailOptions = {
          from: fromAddress,
          to: email.trim().toLowerCase(),
          subject: `Set up your UrutiX Cargo Owner Account Password`,
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
          this.logger.log(`✅ Cargo owner password setup email sent successfully to ${email}`);
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
        this.logger.error(`❌ Failed to send cargo owner password setup email to ${email}`);
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
      // Don't throw error if SMTP is not configured - just log warning
      // This allows cargo owner creation to succeed even if email can't be sent
    }
    this.logger.log('========== CARGO OWNER EMAIL SERVICE CALL END ==========');
  }

  async sendBrokerPasswordSetupEmail(
    email: string,
    firstName: string,
    lastName: string,
    token: string,
  ): Promise<void> {
    this.logger.log('========== BROKER EMAIL SERVICE CALLED ==========');
    this.logger.log(`Attempting to send broker password setup email to: ${email}`);
    
    // Construct the setup URL - use FRONTEND_URL from env
    const { frontendUrl } = getEnvConfig();
    const baseUrl = frontendUrl.replace(/\/$/, '');
    const setupUrl = `${baseUrl}/broker/setup-password?token=${token}`;
    
    this.logger.log(`📧 Broker password setup URL: ${setupUrl}`);
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      getEnvConfig().smtpFrom;

    // Check SMTP configuration
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    
    this.logger.log(`SMTP Configuration Check for broker email:`);
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

        const htmlContent = this.getBrokerPasswordSetupEmailTemplate(
          firstName,
          lastName,
          setupUrl,
        );
        
        const plainTextContent = `
Welcome to UrutiX, ${firstName}!

Your broker account has been created. To get started, please set up your password by clicking the link below:

${setupUrl}

After setting your password, you'll be able to log in and access your broker dashboard to:
- Browse and bid on available loads
- Manage your load assignments and commissions
- Track shipment progress and delivery status
- View earnings and payout history
- Communicate with cargo owners and truck owners

If you didn't expect this email, please contact support or ignore this message.

This link will expire in 7 days.
        `.trim();

        const mailOptions = {
          from: fromAddress,
          to: email.trim().toLowerCase(),
          subject: `Set up your UrutiX Broker Account Password`,
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
          this.logger.log(`✅ Broker password setup email sent successfully to ${email}`);
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
        this.logger.error(`❌ Failed to send broker password setup email to ${email}`);
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
      // Don't throw error if SMTP is not configured - just log warning
      // This allows broker creation to succeed even if email can't be sent
    }
    this.logger.log('========== BROKER EMAIL SERVICE CALL END ==========');
  }

  async sendTruckOwnerPasswordSetupEmail(
    email: string,
    firstName: string,
    lastName: string,
    token: string,
  ): Promise<void> {
    this.logger.log('========== TRUCK OWNER EMAIL SERVICE CALLED ==========');
    this.logger.log(`Attempting to send truck owner password setup email to: ${email}`);
    
    // Construct the setup URL - use FRONTEND_URL from env
    const { frontendUrl } = getEnvConfig();
    const baseUrl = frontendUrl.replace(/\/$/, '');
    const setupUrl = `${baseUrl}/truck-owner/setup-password?token=${token}`;
    
    this.logger.log(`📧 Truck owner password setup URL: ${setupUrl}`);
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      getEnvConfig().smtpFrom;

    // Check SMTP configuration
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    
    this.logger.log(`SMTP Configuration Check for truck owner email:`);
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

        const htmlContent = this.getTruckOwnerPasswordSetupEmailTemplate(
          firstName,
          lastName,
          setupUrl,
        );
        
        const plainTextContent = `
Welcome to UrutiX, ${firstName}!

Your truck owner account has been created. To get started, please set up your password by clicking the link below:

${setupUrl}

After setting your password, you'll be able to log in and access your truck owner dashboard to:
- Manage your fleet of trucks and drivers
- Track vehicle locations and performance
- Monitor fuel consumption and expenses
- Handle maintenance schedules and records
- View earnings and financial reports

If you didn't expect this email, please contact support or ignore this message.

This link will expire in 7 days.
        `.trim();

        const mailOptions = {
          from: fromAddress,
          to: email.trim().toLowerCase(),
          subject: `Set up your UrutiX Truck Owner Account Password`,
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
          this.logger.log(`✅ Truck owner password setup email sent successfully to ${email}`);
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
        this.logger.error(`❌ Failed to send truck owner password setup email to ${email}`);
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
      // Don't throw error if SMTP is not configured - just log warning
      // This allows truck owner creation to succeed even if email can't be sent
    }
    this.logger.log('========== TRUCK OWNER EMAIL SERVICE CALL END ==========');
  }

  async sendAgentPasswordSetupEmail(
    email: string,
    firstName: string,
    lastName: string,
    token: string,
  ): Promise<void> {
    this.logger.log('========== AGENT EMAIL SERVICE CALLED ==========');
    this.logger.log(`Attempting to send agent password setup email to: ${email}`);
    
    // Construct the setup URL - use FRONTEND_URL from env
    const { frontendUrl } = getEnvConfig();
    const baseUrl = frontendUrl.replace(/\/$/, '');
    const setupUrl = `${baseUrl}/agent/setup-password?token=${token}`;
    
    this.logger.log(`📧 Agent password setup URL: ${setupUrl}`);
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      getEnvConfig().smtpFrom;

    // Check SMTP configuration
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    
    this.logger.log(`SMTP Configuration Check for agent email:`);
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

        const htmlContent = this.getAgentPasswordSetupEmailTemplate(
          firstName,
          lastName,
          setupUrl,
        );
        
        const plainTextContent = `
Welcome to UrutiX, ${firstName}!

Your agent account has been created. To get started, please set up your password by clicking the link below:

${setupUrl}

After setting your password, you'll be able to log in and access your agent dashboard to:
- Assist clients with logistics and transportation needs
- Coordinate between cargo owners and truck owners
- Manage client relationships and communications
- Track shipments and provide status updates
- Generate reports and handle documentation

If you didn't expect this email, please contact support or ignore this message.

This link will expire in 7 days.
        `.trim();

        const mailOptions = {
          from: fromAddress,
          to: email.trim().toLowerCase(),
          subject: `Set up your UrutiX Agent Account Password`,
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
          this.logger.log(`✅ Agent password setup email sent successfully to ${email}`);
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
        this.logger.error(`❌ Failed to send agent password setup email to ${email}`);
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
      // Don't throw error if SMTP is not configured - just log warning
      // This allows agent creation to succeed even if email can't be sent
    }
    this.logger.log('========== AGENT EMAIL SERVICE CALL END ==========');
  }

  async sendCustomsOfficerPasswordSetupEmail(
    email: string,
    firstName: string,
    lastName: string,
    token: string,
  ): Promise<void> {
    this.logger.log('========== CUSTOMS OFFICER EMAIL SERVICE CALLED ==========');
    this.logger.log(`Attempting to send customs officer password setup email to: ${email}`);

    const { frontendUrl } = getEnvConfig();
    const baseUrl = frontendUrl.replace(/\/$/, '');
    const setupUrl = `${baseUrl}/customs-officer/setup-password?token=${token}`;

    this.logger.log(`📧 Customs Officer password setup URL: ${setupUrl}`);
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      getEnvConfig().smtpFrom;

    if (this.transporter) {
      this.logger.log('✅ SMTP transporter is configured, attempting to send email...');
      try {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error(`Invalid email format: ${email}`);
        }

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #345E85;">Welcome to UrutiX, ${firstName}!</h2>
            <p>Your Customs Officer account has been created on the UrutiX platform. To get started, please set up your password by clicking the link below:</p>
            <a href="${setupUrl}" style="display: inline-block; padding: 12px 24px; background-color: #345E85; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
              Set Up Your Password
            </a>
            <p>After setting your password, you'll be able to log in and access your Customs Officer dashboard to:</p>
            <ul>
              <li>Search and inspect incoming vehicles and shipments</li>
              <li>Manage cargo inspection workflows</li>
              <li>Flag high-risk and restricted goods</li>
              <li>Manage border checkpoint records</li>
              <li>Access inspection reports and audit logs</li>
            </ul>
            <p>If you didn't expect this email, please contact your administrator or ignore this message.</p>
            <p style="color: #888;">This link will expire in 7 days.</p>
          </div>
        `;

        const plainTextContent = `
Welcome to UrutiX, ${firstName}!

Your Customs Officer account has been created. To get started, please set up your password by clicking the link below:

${setupUrl}

After setting your password, you'll be able to log in and access your Customs Officer dashboard.

If you didn't expect this email, please contact your administrator or ignore this message.

This link will expire in 7 days.
        `.trim();

        const mailOptions = {
          from: fromAddress,
          to: email.trim().toLowerCase(),
          subject: `Set up your UrutiX Customs Officer Account Password`,
          text: plainTextContent,
          html: htmlContent,
        };

        this.logger.log('📧 Attempting to send email via SMTP...');
        const result = await this.transporter.sendMail(mailOptions);

        if (result.accepted && result.accepted.length > 0) {
          this.logger.log(`✅ Customs officer password setup email sent successfully to ${email}`);
          this.logger.log(`✅ Message ID: ${result.messageId}`);
        } else if (result.rejected && result.rejected.length > 0) {
          this.logger.error(`❌ Email was rejected by server`);
          throw new Error(`Email was rejected: ${result.rejected.join(', ')}`);
        } else {
          this.logger.warn(`⚠️ Email sent but no acceptance/rejection info available`);
        }
      } catch (error: any) {
        this.logger.error(`❌ Failed to send customs officer password setup email to ${email}`);
        this.logger.error(`❌ Error: ${error.message}`);
        throw error;
      }
    } else {
      this.logger.error('❌ SMTP transporter is not configured. Email will not be sent.');
    }
    this.logger.log('========== CUSTOMS OFFICER EMAIL SERVICE CALL END ==========');
  }

  /**
   * Generic email sending method for any service to use.
   * Sends via the configured SMTP transporter with proper from/replyTo headers.
   */
  async sendGenericEmail(options: {
    to: string;
    subject: string;
    textBody?: string;
    htmlBody?: string;
    replyTo?: string;
    fromName?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { to, subject, textBody, htmlBody, replyTo, fromName } = options;

    const smtpFrom =
      this.configService.get<string>('SMTP_FROM') ||
      getEnvConfig().smtpFrom;

    // Build the from address with optional display name
    const from = fromName ? `"${fromName}" <${smtpFrom}>` : smtpFrom;

    if (!this.transporter) {
      this.logger.warn(`⚠️ SMTP not configured — email to ${to} with subject "${subject}" was NOT sent.`);
      return { success: false, error: 'SMTP transporter is not configured' };
    }

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
        throw new Error(`Invalid email format: ${to}`);
      }

      const mailOptions: any = {
        from,
        to: to.trim().toLowerCase(),
        subject,
      };

      if (replyTo) {
        mailOptions.replyTo = replyTo;
      }
      if (htmlBody) {
        mailOptions.html = htmlBody;
      }
      if (textBody) {
        mailOptions.text = textBody;
      }

      this.logger.log(`📧 Sending generic email → to: ${to}, subject: "${subject}", replyTo: ${replyTo || 'none'}`);
      const result = await this.transporter.sendMail(mailOptions);

      if (result.accepted && result.accepted.length > 0) {
        this.logger.log(`✅ Email sent to ${to} | messageId: ${result.messageId}`);
        return { success: true, messageId: result.messageId };
      } else if (result.rejected && result.rejected.length > 0) {
        this.logger.error(`❌ Email rejected for ${to}: ${result.rejected.join(', ')}`);
        return { success: false, error: `Rejected: ${result.rejected.join(', ')}` };
      }

      this.logger.warn(`⚠️ Email to ${to} — no accept/reject info`);
      return { success: true, messageId: result.messageId };
    } catch (error: any) {
      this.logger.error(`❌ Failed to send email to ${to}: ${error.message}`);
      return { success: false, error: error.message };
    }
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

  async sendReceiverInvitationEmail(
    email: string,
    firstName: string,
    lastName: string,
    cargoOwnerEmail: string,
    token: string,
  ): Promise<void> {
    this.logger.log('========== RECEIVER INVITATION EMAIL SERVICE CALLED ==========');
    this.logger.log(`Attempting to send receiver invitation email to: ${email}`);
    
    const { frontendUrl } = getEnvConfig();
    const baseUrl = frontendUrl.replace(/\/$/, '');
    const setupUrl = `${baseUrl}/receiver/setup-password?token=${token}`;
    
    this.logger.log(`📧 Receiver password setup URL: ${setupUrl}`);
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      getEnvConfig().smtpFrom;

    if (this.transporter) {
      this.logger.log('✅ SMTP transporter is configured, attempting to send email...');
      try {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error(`Invalid email format: ${email}`);
        }

        const htmlContent = this.getReceiverInvitationEmailTemplate(
          firstName,
          lastName,
          cargoOwnerEmail,
          setupUrl,
        );
        
        const plainTextContent = `
Welcome to UrutiX, ${firstName}!

You have been invited by ${cargoOwnerEmail} to become a cargo receiver on UrutiX. To get started, please set up your password by clicking the link below:

${setupUrl}

After setting your password, you'll be able to log in and access your receiver account to view and manage assigned cargo.

If you didn't expect this email, please contact ${cargoOwnerEmail} or ignore this message.

This link will expire in 7 days.
        `.trim();

        const mailOptions = {
          from: fromAddress,
          to: email.trim().toLowerCase(),
          subject: `Set up your UrutiX Receiver Account Password`,
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
          this.logger.log(`✅ Receiver invitation email sent successfully to ${email}`);
          this.logger.log(`✅ Message ID: ${result.messageId}`);
        } else if (result.rejected && result.rejected.length > 0) {
          this.logger.error(`❌ Email was rejected by server`);
          this.logger.error(`❌ Rejected recipients:`, result.rejected);
          throw new Error(`Email was rejected: ${result.rejected.join(', ')}`);
        } else {
          this.logger.warn(`⚠️ Email sent but no acceptance/rejection info available`);
        }
      } catch (error: any) {
        this.logger.error(`❌ Failed to send receiver invitation email to ${email}`);
        this.logger.error(`❌ Error: ${error.message}`);
        throw error;
      }
    } else {
      this.logger.error('❌ SMTP transporter is not configured. Email will not be sent.');
    }
    this.logger.log('========== RECEIVER INVITATION EMAIL SERVICE CALL END ==========');
  }

  private getReceiverInvitationEmailTemplate(
    firstName: string,
    lastName: string,
    cargoOwnerEmail: string,
    setupUrl: string,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome to UrutiX, ${firstName}!</h2>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
            You have been invited by <strong>${cargoOwnerEmail}</strong> to become a cargo receiver on UrutiX.
          </p>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            To get started, please set up your password by clicking the button below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${setupUrl}" style="display: inline-block; padding: 14px 28px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Set Up Password
            </a>
          </div>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
            After setting your password, you'll be able to log in and access your receiver account to view and manage assigned cargo.
          </p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            If you didn't expect this email, please contact ${cargoOwnerEmail} or ignore this message.
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
            This link will expire in 7 days.
          </p>
        </div>
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

  private getCargoOwnerPasswordSetupEmailTemplate(
    firstName: string,
    lastName: string,
    setupUrl: string,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome to UrutiX, ${firstName}!</h2>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
            Your cargo owner account has been created. To get started, please set up your password by clicking the button below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${setupUrl}" style="display: inline-block; padding: 14px 28px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Set Up Password
            </a>
          </div>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
            After setting your password, you'll be able to log in and access your cargo owner dashboard to:
          </p>
          <ul style="color: #4b5563; line-height: 1.6; margin-bottom: 20px; padding-left: 20px;">
            <li>Create and manage cargo shipments</li>
            <li>Track your shipments in real-time</li>
            <li>Manage receivers and delivery locations</li>
            <li>View shipping history and analytics</li>
          </ul>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            If you didn't expect this email, please contact support or ignore this message.
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
            This link will expire in 7 days.
          </p>
        </div>
      </div>
    `;
  }

  private getBrokerPasswordSetupEmailTemplate(
    firstName: string,
    lastName: string,
    setupUrl: string,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome to UrutiX, ${firstName}!</h2>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
            Your broker account has been created. To get started, please set up your password by clicking the button below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${setupUrl}" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Set Up Password
            </a>
          </div>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
            After setting your password, you'll be able to log in and access your broker dashboard to:
          </p>
          <ul style="color: #4b5563; line-height: 1.6; margin-bottom: 20px; padding-left: 20px;">
            <li>Browse and bid on available loads</li>
            <li>Manage your load assignments and commissions</li>
            <li>Track shipment progress and delivery status</li>
            <li>View earnings and payout history</li>
            <li>Communicate with cargo owners and truck owners</li>
          </ul>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            If you didn't expect this email, please contact support or ignore this message.
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
            This link will expire in 7 days.
          </p>
        </div>
      </div>
    `;
  }

  private getTruckOwnerPasswordSetupEmailTemplate(
    firstName: string,
    lastName: string,
    setupUrl: string,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome to UrutiX, ${firstName}!</h2>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
            Your truck owner account has been created. To get started, please set up your password by clicking the button below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${setupUrl}" style="display: inline-block; padding: 14px 28px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Set Up Password
            </a>
          </div>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
            After setting your password, you'll be able to log in and access your truck owner dashboard to:
          </p>
          <ul style="color: #4b5563; line-height: 1.6; margin-bottom: 20px; padding-left: 20px;">
            <li>Manage your fleet of trucks and drivers</li>
            <li>Track vehicle locations and performance</li>
            <li>Monitor fuel consumption and expenses</li>
            <li>Handle maintenance schedules and records</li>
            <li>View earnings and financial reports</li>
          </ul>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            If you didn't expect this email, please contact support or ignore this message.
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
            This link will expire in 7 days.
          </p>
        </div>
      </div>
    `;
  }

  private getAgentPasswordSetupEmailTemplate(
    firstName: string,
    lastName: string,
    setupUrl: string,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome to UrutiX, ${firstName}!</h2>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
            Your agent account has been created. To get started, please set up your password by clicking the button below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${setupUrl}" style="display: inline-block; padding: 14px 28px; background-color: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Set Up Password
            </a>
          </div>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
            After setting your password, you'll be able to log in and access your agent dashboard to:
          </p>
          <ul style="color: #4b5563; line-height: 1.6; margin-bottom: 20px; padding-left: 20px;">
            <li>Assist clients with logistics and transportation needs</li>
            <li>Coordinate between cargo owners and truck owners</li>
            <li>Manage client relationships and communications</li>
            <li>Track shipments and provide status updates</li>
            <li>Generate reports and handle documentation</li>
          </ul>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            If you didn't expect this email, please contact support or ignore this message.
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">
            This link will expire in 7 days.
          </p>
        </div>
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

  async sendBrokerLoadAssignmentEmail(
    recipientEmail: string,
    brokerName: string,
    loadTitle: string,
    loadId: string,
    commissionRate: number,
    commissionAmount: number,
  ): Promise<void> {
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      getEnvConfig().smtpFrom;

    const subject = `New Load Assignment: ${loadTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>New Load Assignment</h2>
        <p>Dear ${brokerName},</p>
        <p>You have been assigned to a new load: <strong>${loadTitle}</strong> (ID: ${loadId}).</p>
        <p>Your commission rate for this load is <strong>${commissionRate}%</strong>, amounting to <strong>${commissionAmount}</strong>.</p>
        <p>You can view the load details and manage your commissions in your dashboard.</p>
        <p>Thank you for your excellent work!</p>
        <p>The UrutiX Team</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: fromAddress,
          to: recipientEmail,
          subject,
          html,
        });
        this.logger.log(`Broker load assignment email sent to ${recipientEmail}`);
      } catch (error) {
        this.logger.error(`Failed to send broker load assignment email: ${error.message}`);
        throw error;
      }
    } else {
      this.logger.warn(`SMTP not configured. Email would be sent to ${recipientEmail}`);
    }
  }

  async sendCommissionStatusUpdateEmail(
    recipientEmail: string,
    brokerName: string,
    loadTitle: string,
    commissionAmount: number,
    status: string,
  ): Promise<void> {
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      getEnvConfig().smtpFrom;

    const subject = `Commission Update for Load: ${loadTitle} - Status: ${status}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Commission Status Update</h2>
        <p>Dear ${brokerName},</p>
        <p>The status of your commission for load <strong>${loadTitle}</strong> (Amount: ${commissionAmount}) has been updated to <strong>${status}</strong>.</p>
        <p>Please check your dashboard for more details.</p>
        <p>The UrutiX Team</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: fromAddress,
          to: recipientEmail,
          subject,
          html,
        });
        this.logger.log(`Commission status update email sent to ${recipientEmail}`);
      } catch (error) {
        this.logger.error(`Failed to send commission status update email: ${error.message}`);
        throw error;
      }
    } else {
      this.logger.warn(`SMTP not configured. Email would be sent to ${recipientEmail}`);
    }
  }

  async sendCommissionPayoutRequestEmail(
    recipientEmail: string,
    brokerName: string,
    totalAmount: number,
    payoutMethod: string,
    accountDetails: string,
  ): Promise<void> {
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      getEnvConfig().smtpFrom;

    const subject = `Commission Payout Request Submitted`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Payout Request Submitted</h2>
        <p>Dear ${brokerName},</p>
        <p>Your request for a commission payout totaling <strong>${totalAmount}</strong> has been successfully submitted.</p>
        <p>Payout Method: ${payoutMethod}</p>
        <p>Account Details: ${accountDetails}</p>
        <p>We will process your request shortly. You will receive another notification once the payout is approved and processed.</p>
        <p>The UrutiX Team</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: fromAddress,
          to: recipientEmail,
          subject,
          html,
        });
        this.logger.log(`Commission payout request email sent to ${recipientEmail}`);
      } catch (error) {
        this.logger.error(`Failed to send commission payout request email: ${error.message}`);
        throw error;
      }
    } else {
      this.logger.warn(`SMTP not configured. Email would be sent to ${recipientEmail}`);
    }
  }

  private getDriverWelcomeEmailTemplate(
    firstName: string,
    lastName: string,
    loginUrl: string,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Welcome back to UrutiX, ${firstName}!</h2>
        <p>A truck owner has added you as a driver to their fleet on UrutiX.</p>
        <p>Since you already have an account, you can log in directly using your existing credentials to access your new driver dashboard:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="display: inline-block; padding: 14px 28px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Go to My Dashboard
          </a>
        </div>
        <p>If you have any questions, please contact your truck owner or our support team.</p>
        <p>Best regards,<br>The UrutiX Team</p>
      </div>
    `;
  }
}

