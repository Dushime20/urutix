import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  fromName?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;
  private readonly frontendUrl: string;
  private readonly smtpHost?: string;
  private readonly smtpPort: number;
  private readonly smtpUser?: string;
  private readonly smtpPass?: string;
  private readonly smtpSecure: boolean;

  constructor(private readonly configService: ConfigService) {
    this.smtpHost = configService.get<string>('SMTP_HOST') || undefined;
    // Env vars are always strings in Docker — Number() so 465 is actually 465, not "465"
    this.smtpPort = Number(configService.get('SMTP_PORT') ?? 587);
    this.smtpUser = configService.get<string>('SMTP_USER') || undefined;
    this.smtpPass = configService.get<string>('SMTP_PASS') || undefined;

    const secureFlag = configService.get<string>('SMTP_SECURE');
    this.smtpSecure =
      secureFlag !== undefined && secureFlag !== ''
        ? ['true', '1', 'yes'].includes(String(secureFlag).toLowerCase())
        : this.smtpPort === 465;

    // Read FRONTEND_URL directly — never depend on getEnvConfig() which
    // requires BACKEND_URL and SMTP_USER to also be set.
    this.frontendUrl = (
      configService.get<string>('FRONTEND_URL') || ''
    ).replace(/\/$/, '');

    this.fromAddress =
      configService.get<string>('SMTP_FROM') ||
      configService.get<string>('EMAIL_FROM_ADDRESS') ||
      this.smtpUser ||
      '';

    if (!this.frontendUrl) {
      this.logger.warn('[EMAIL] FRONTEND_URL is not set — email links will be broken');
    }

    if (!this.smtpHost || !this.smtpUser || !this.smtpPass) {
      this.logger.warn('Email service: SMTP not fully configured — emails will be logged but not delivered');
      this.logger.warn(`Missing: ${[!this.smtpHost && 'SMTP_HOST', !this.smtpUser && 'SMTP_USER', !this.smtpPass && 'SMTP_PASS'].filter(Boolean).join(', ')}`);
      return;
    }

    if (this.smtpPort === 465 && !this.smtpSecure) {
      this.logger.warn('[EMAIL] SMTP_PORT=465 but SMTP_SECURE is false — Gmail will close the socket. Forcing secure=true.');
    }
    if (this.smtpPort === 587 && this.smtpSecure) {
      this.logger.warn('[EMAIL] SMTP_PORT=587 with SMTP_SECURE=true is invalid (587 uses STARTTLS). Forcing secure=false.');
    }

    this.initTransporter();
  }

  private resolvedSecure(): boolean {
    if (this.smtpPort === 465) return true;
    if (this.smtpPort === 587) return false;
    return this.smtpSecure;
  }

  private createTransporter(): nodemailer.Transporter {
    const secure = this.resolvedSecure();
    return nodemailer.createTransport({
      host: this.smtpHost,
      port: this.smtpPort,
      secure,
      auth: { user: this.smtpUser, pass: this.smtpPass },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
      },
      requireTLS: !secure,
    });
  }

  private initTransporter(): void {
    try {
      const secure = this.resolvedSecure();
      this.transporter = this.createTransporter();
      this.logger.log(
        `[EMAIL] SMTP transporter created — ${this.smtpHost}:${this.smtpPort} secure=${secure} from=${this.fromAddress}`,
      );

      this.transporter.verify((err) => {
        if (err) {
          this.logger.warn(`[EMAIL] SMTP verify failed: ${err.message} — emails may still deliver`);
          this.logger.warn(`[EMAIL] Hint: for Gmail use port 465 + SMTP_SECURE=true, or port 587 + SMTP_SECURE=false`);
        } else {
          this.logger.log(`[EMAIL] SMTP ready ✓ — ${this.smtpHost}:${this.smtpPort} | from=${this.fromAddress}`);
        }
      });
    } catch (err: any) {
      this.logger.error(`Failed to create SMTP transporter: ${err.message}`);
    }
  }

  // ─── Core send method ──────────────────────────────────────────────────────

  /**
   * Sends a single email. All public methods funnel through here.
   * Returns a result object — never throws.
   */
  async sendGenericEmail(options: {
    to: string;
    subject: string;
    htmlBody?: string;
    textBody?: string;
    replyTo?: string;
    fromName?: string;
  }): Promise<SendResult> {
    const { to, subject, htmlBody, textBody, replyTo, fromName } = options;

    const from = fromName
      ? `"${fromName}" <${this.fromAddress}>`
      : this.fromAddress;

    // ── Pre-flight checks ───────────────────────────────────────────────────
    this.logger.log(`[EMAIL] Preparing to send → to=${to} | subject="${subject}"`);

    if (!this.transporter) {
      this.logger.error(`[EMAIL] BLOCKED — SMTP transporter not initialized.`);
      this.logger.error(`[EMAIL] Check that SMTP_HOST, SMTP_USER, SMTP_PASS are set in .env and the server was restarted after changing them.`);
      this.logger.warn(`[EMAIL SKIPPED] to=${to} | subject="${subject}"`);
      return { success: false, error: 'SMTP not configured' };
    }

    if (!this.fromAddress) {
      this.logger.error(`[EMAIL] BLOCKED — from address is empty. Set SMTP_FROM or SMTP_USER in .env.`);
      return { success: false, error: 'From address not configured' };
    }

    if (!this.isValidEmail(to)) {
      this.logger.error(`[EMAIL] BLOCKED — Invalid recipient address: "${to}"`);
      return { success: false, error: `Invalid email address: ${to}` };
    }

    this.logger.log(
      `[EMAIL] from="${from}" | replyTo="${replyTo || 'none'}" | hasHtml=${!!htmlBody} | hasText=${!!textBody} | smtp=${this.smtpHost}:${this.smtpPort} secure=${this.resolvedSecure()}`,
    );

    const mail = {
      from,
      to: to.trim().toLowerCase(),
      subject,
      ...(htmlBody  ? { html: htmlBody }   : {}),
      ...(textBody  ? { text: textBody }   : {}),
      ...(replyTo   ? { replyTo }          : {}),
    };

    try {
      return await this.dispatchMail(mail, to, subject);
    } catch (err: any) {
      if (this.isRetryableSmtpError(err)) {
        this.logger.warn(`[EMAIL] retrying after "${err.message}" — recreating SMTP transporter`);
        this.initTransporter();
        try {
          return await this.dispatchMail(mail, to, subject);
        } catch (retryErr: any) {
          return this.logSendFailure(to, subject, retryErr);
        }
      }
      return this.logSendFailure(to, subject, err);
    }
  }

  private async dispatchMail(
    mail: Record<string, unknown>,
    to: string,
    subject: string,
  ): Promise<SendResult> {
    const result = await this.transporter!.sendMail(mail);

    this.logger.log(`[EMAIL] SMTP response: accepted=${JSON.stringify(result.accepted)} rejected=${JSON.stringify(result.rejected || [])} messageId=${result.messageId}`);

    if (result.rejected?.length) {
      this.logger.error(`[EMAIL] REJECTED by server for: ${result.rejected.join(', ')}`);
      return { success: false, error: `Rejected: ${result.rejected.join(', ')}` };
    }

    this.logger.log(`[EMAIL] DELIVERED ✓ → ${to} | "${subject}" | id=${result.messageId}`);
    return { success: true, messageId: result.messageId };
  }

  private isRetryableSmtpError(err: any): boolean {
    const message = `${err?.message || ''} ${err?.code || ''}`;
    return /socket close|ECONNRESET|ETIMEDOUT|ECONNECTION|connection closed|EPIPE|ESOCKET/i.test(message);
  }

  private logSendFailure(to: string, subject: string, err: any): SendResult {
    this.logger.error(`[EMAIL] SEND FAILED → to=${to} | subject="${subject}"`);
    this.logger.error(`[EMAIL] Error: ${err.message}`);
    if (err.code)         this.logger.error(`[EMAIL] Code: ${err.code}`);
    if (err.response)     this.logger.error(`[EMAIL] SMTP response: ${err.response}`);
    if (err.responseCode) this.logger.error(`[EMAIL] SMTP code: ${err.responseCode}`);
    if (err.command)      this.logger.error(`[EMAIL] Failed command: ${err.command}`);
    return { success: false, error: err.message };
  }

  // ─── Auth emails ───────────────────────────────────────────────────────────

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    
    const url = `${this.frontendUrl}/verify-email?token=${token}`;
    const result = await this.sendGenericEmail({
      to: email,
      subject: 'Verify your email address — UrutiX',
      htmlBody: this.renderEmail({
        title:    'Verify Your Email Address',
        greeting: 'Thanks for signing up!',
        body:     'Please click the button below to verify your email address and activate your account.',
        ctaLabel: 'Verify Email',
        ctaUrl:   url,
        ctaColor: '#345E85',
        note:     "If you didn't create an account, you can safely ignore this email.",
      }),
    });
    if (!result.success) {
      this.logger.error(`[EMAIL] sendVerificationEmail FAILED for ${email}: ${result.error}`);
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    
    const url = `${this.frontendUrl}/reset-password?token=${token}`;
    const result = await this.sendGenericEmail({
      to: email,
      subject: 'Reset your password — UrutiX',
      htmlBody: this.renderEmail({
        title:    'Reset Your Password',
        greeting: 'We received a password reset request.',
        body:     'Click the button below to set a new password. This link expires in <strong>1 hour</strong>.',
        ctaLabel: 'Reset Password',
        ctaUrl:   url,
        ctaColor: '#e11d48',
        note:     "If you didn't request a password reset, you can safely ignore this email.",
      }),
      textBody: `Reset your UrutiX password\n\nClick here to reset your password: ${url}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.`,
    });
    if (!result.success) throw new Error(result.error || 'Failed to send password reset email');
  }

  // ─── Account setup emails (per role) ──────────────────────────────────────

  async sendDriverPasswordSetupEmail(
    email: string, firstName: string, _lastName: string, token: string,
  ): Promise<void> {
    
    await this.sendAndLog('sendDriverPasswordSetupEmail', email, {
      subject: 'Set up your UrutiX Driver Account',
      htmlBody: this.renderSetupEmail({
        firstName, role: 'Driver', ctaColor: '#345E85',
        setupUrl: `${this.frontendUrl}/driver/setup-password?token=${token}`,
        features: ['Accept and manage trip assignments', 'Track your routes in real time', 'Submit proof-of-delivery reports', 'View your earnings and schedules'],
      }),
    }, true);
  }

  /**
   * Generic password-setup email for roles without a dedicated template
   * (Admin, Super Admin, fleet roles, parking manager, etc.).
   */
  async sendAccountPasswordSetupEmail(
    email: string, firstName: string, roleLabel: string, token: string,
  ): Promise<void> {
    await this.sendAndLog('sendAccountPasswordSetupEmail', email, {
      subject: `Set up your UrutiX ${roleLabel} Account`,
      htmlBody: this.renderSetupEmail({
        firstName, role: roleLabel, ctaColor: '#345E85',
        setupUrl: `${this.frontendUrl}/setup-password?token=${token}`,
        features: [
          'Sign in to your UrutiX workspace',
          'Access the tools for your role',
          'Manage your profile and notifications',
        ],
      }),
    }, true);
  }

  async sendSuperAdminPasswordSetupEmail(
    email: string, firstName: string, _lastName: string, token: string,
  ): Promise<void> {
    await this.sendAndLog('sendSuperAdminPasswordSetupEmail', email, {
      subject: 'Set up your UrutiX Super Admin Account',
      htmlBody: this.renderSetupEmail({
        firstName, role: 'Super Admin', ctaColor: '#7c3aed',
        setupUrl: `${this.frontendUrl}/setup-password?token=${token}`,
        features: [
          'Manage all tenants and platform users',
          'Configure system settings and permissions',
          'Monitor operations across the platform',
          'Access billing, revenue, and audit logs',
        ],
      }),
    }, true);
  }

  async sendAdminPasswordSetupEmail(
    email: string, firstName: string, _lastName: string, token: string,
  ): Promise<void> {
    await this.sendAndLog('sendAdminPasswordSetupEmail', email, {
      subject: 'Set up your UrutiX Admin Account',
      htmlBody: this.renderSetupEmail({
        firstName, role: 'Admin', ctaColor: '#345E85',
        setupUrl: `${this.frontendUrl}/setup-password?token=${token}`,
        features: [
          'Manage users and tenant operations',
          'Review platform activity and reports',
          'Configure operational settings',
        ],
      }),
    }, true);
  }

  async sendDriverWelcomeEmail(
    email: string, firstName: string, _lastName: string,
  ): Promise<void> {
    
    await this.sendAndLog('sendDriverWelcomeEmail', email, {
      subject: 'You have been added as a Driver on UrutiX',
      htmlBody: this.renderEmail({
        title: 'Welcome to Your Fleet', greeting: `Welcome back, ${firstName}!`,
        body:  'A truck owner has added you as a driver to their fleet on UrutiX. Since you already have an account, you can log in directly using your existing credentials.',
        ctaLabel: 'Go to Dashboard', ctaUrl: `${this.frontendUrl}/auth`, ctaColor: '#345E85',
        note: 'If you have questions, contact your truck owner or our support team.',
      }),
    });
  }

  async sendTenantPasswordSetupEmail(
    email: string, firstName: string, _lastName: string, tenantName: string, token: string,
  ): Promise<void> {
    
    await this.sendAndLog('sendTenantPasswordSetupEmail', email, {
      subject: `Set up your UrutiX Tenant Account — ${tenantName}`,
      htmlBody: this.renderSetupEmail({
        firstName, role: 'Tenant Admin', ctaColor: '#0f172a',
        setupUrl: `${this.frontendUrl}/tenant/setup-password?token=${token}`,
        features: [`Manage your "${tenantName}" workspace`, 'Invite and manage team members', 'Configure subscription and billing', 'Monitor all fleet operations'],
      }),
    }, true);
  }

  async sendCargoOwnerPasswordSetupEmail(
    email: string, firstName: string, _lastName: string, token: string,
  ): Promise<void> {
    
    await this.sendAndLog('sendCargoOwnerPasswordSetupEmail', email, {
      subject: 'Set up your UrutiX Cargo Owner Account',
      htmlBody: this.renderSetupEmail({
        firstName, role: 'Cargo Owner', ctaColor: '#345E85',
        setupUrl: `${this.frontendUrl}/cargo-owner/setup-password?token=${token}`,
        features: ['Create and publish cargo shipments', 'Find and assign vetted carriers', 'Track shipments in real time', 'View analytics and shipping history'],
      }),
    }, true);
  }

  async sendBrokerPasswordSetupEmail(
    email: string, firstName: string, _lastName: string, token: string,
  ): Promise<void> {
    
    await this.sendAndLog('sendBrokerPasswordSetupEmail', email, {
      subject: 'Set up your UrutiX Broker Account',
      htmlBody: this.renderSetupEmail({
        firstName, role: 'Broker', ctaColor: '#059669',
        setupUrl: `${this.frontendUrl}/broker/setup-password?token=${token}`,
        features: ['Browse and bid on available loads', 'Manage assignments and commissions', 'Track shipment progress', 'View earnings and payout history'],
      }),
    }, true);
  }

  async sendTruckOwnerPasswordSetupEmail(
    email: string, firstName: string, _lastName: string, token: string,
  ): Promise<void> {
    
    await this.sendAndLog('sendTruckOwnerPasswordSetupEmail', email, {
      subject: 'Set up your UrutiX Truck Owner Account',
      htmlBody: this.renderSetupEmail({
        firstName, role: 'Truck Owner', ctaColor: '#d97706',
        setupUrl: `${this.frontendUrl}/truck-owner/setup-password?token=${token}`,
        features: ['Manage your fleet of trucks and drivers', 'Track vehicles and performance', 'Monitor fuel and maintenance', 'View earnings and financial reports'],
      }),
    }, true);
  }

  async sendLenderPasswordSetupEmail(
    email: string, lenderName: string, token: string,
  ): Promise<void> {
    
    await this.sendAndLog('sendLenderPasswordSetupEmail', email, {
      subject: `Set up your UrutiX Lender Account — ${lenderName}`,
      htmlBody: this.renderSetupEmail({
        firstName: lenderName, role: 'Lender', ctaColor: '#7c3aed',
        setupUrl: `${this.frontendUrl}/lender/setup-password?token=${token}`,
        features: ['Manage loan applications and approvals', 'Set lending policies and interest rates', 'Track repayments and portfolio performance', 'View financial reports and analytics'],
      }),
    }, true);
  }

  async sendAgentPasswordSetupEmail(
    email: string, firstName: string, _lastName: string, token: string,
  ): Promise<void> {
    
    await this.sendAndLog('sendAgentPasswordSetupEmail', email, {
      subject: 'Set up your UrutiX Agent Account',
      htmlBody: this.renderSetupEmail({
        firstName, role: 'Agent', ctaColor: '#6d28d9',
        setupUrl: `${this.frontendUrl}/agent/setup-password?token=${token}`,
        features: ['Coordinate cargo owners and carriers', 'Manage client relationships', 'Track shipments and provide updates', 'Handle documentation and reports'],
      }),
    }, true);
  }

  async sendCustomsOfficerPasswordSetupEmail(
    email: string, firstName: string, _lastName: string, token: string,
  ): Promise<void> {
    
    await this.sendAndLog('sendCustomsOfficerPasswordSetupEmail', email, {
      subject: 'Set up your UrutiX Customs Officer Account',
      htmlBody: this.renderSetupEmail({
        firstName, role: 'Customs Officer', ctaColor: '#0369a1',
        setupUrl: `${this.frontendUrl}/customs-officer/setup-password?token=${token}`,
        features: ['Inspect incoming vehicles and shipments', 'Manage cargo inspection workflows', 'Flag restricted goods', 'Access audit logs and reports'],
      }),
    }, true);
  }

  async sendReceiverInvitationEmail(
    email: string, firstName: string, _lastName: string, cargoOwnerEmail: string, token: string,
  ): Promise<void> {
    
    await this.sendAndLog('sendReceiverInvitationEmail', email, {
      subject: 'You have been invited to UrutiX as a Cargo Receiver',
      htmlBody: this.renderEmail({
        title: 'You Have Been Invited', greeting: `Hello ${firstName},`,
        body:  `<strong>${cargoOwnerEmail}</strong> has invited you to become a cargo receiver on UrutiX. Click the button below to set up your password and access your account.`,
        ctaLabel: 'Accept Invitation & Set Password',
        ctaUrl:   `${this.frontendUrl}/receiver/setup-password?token=${token}`,
        ctaColor: '#345E85',
        note: `If you didn't expect this email, you can ignore it or contact ${cargoOwnerEmail}.`,
      }),
    }, true);
  }

  async sendAuctionCreatedTruckOwnerEmail(
    recipientEmail: string,
    truckOwnerName: string,
    cargoTitle: string,
    route: string,
    auctionId: string,
    auctionEnd: string,
    reservePrice?: string,
  ): Promise<void> {
    const reserveLine = reservePrice
      ? `<strong>Reserve / target price:</strong> ${reservePrice}<br>`
      : '';
    await this.sendAndLog('sendAuctionCreatedTruckOwnerEmail', recipientEmail, {
      subject: `New auction available: ${cargoTitle} — UrutiX`,
      htmlBody: this.renderEmail({
        title: 'New auction — ready to bid',
        greeting: `Hello ${truckOwnerName},`,
        body: `A new cargo auction is available in your tenant. Get ready to place your bid.<br><br>
          <strong>Cargo:</strong> ${cargoTitle}<br>
          <strong>Route:</strong> ${route}<br>
          ${reserveLine}
          <strong>Auction ends:</strong> ${auctionEnd}<br>
          <strong>Auction ID:</strong> ${auctionId}<br><br>
          Open bidding now to compete for this load.`,
        ctaLabel: 'View auction & bid',
        ctaUrl: `${this.getFrontendUrl()}/dashboard/bidding`,
        ctaColor: '#345E85',
        note: 'This notice was sent to truck owners in the same tenant as the cargo.',
      }),
    });
  }

  // ─── Broker / commission emails ────────────────────────────────────────────

  async sendBrokerLoadAssignmentEmail(
    recipientEmail: string, brokerName: string, loadTitle: string,
    loadId: string, commissionRate: number, commissionAmount: number,
    route?: string, currency?: string,
  ): Promise<void> {
    const currencyCode = currency || 'KES';
    const routeLine = route ? `<strong>Route:</strong> ${route}<br>` : '';
    await this.sendAndLog('sendBrokerLoadAssignmentEmail', recipientEmail, {
      subject: `New cargo assignment: ${loadTitle} — UrutiX`,
      htmlBody: this.renderEmail({
        title: 'New cargo assignment',
        greeting: `Hello ${brokerName},`,
        body: `You have been assigned as the broker for a cargo load. Please review and accept the contract to begin managing this load.<br><br>
          <strong>Cargo:</strong> ${loadTitle}<br>
          ${routeLine}
          <strong>Load ID:</strong> ${loadId}<br>
          <strong>Commission rate:</strong> ${commissionRate}%<br>
          <strong>Estimated commission:</strong> ${currencyCode} ${Number(commissionAmount).toLocaleString()}<br><br>
          Next step: open your broker dashboard and accept the pending contract.`,
        ctaLabel: 'View assignment',
        ctaUrl: `${this.getFrontendUrl()}/dashboard/broker/loads`,
        ctaColor: '#059669',
        note: 'You must accept the contract before you can run auctions, bidding, or matching for this cargo.',
      }),
    });
  }

  async sendCommissionStatusUpdateEmail(
    recipientEmail: string, brokerName: string, loadTitle: string,
    commissionAmount: number, status: string,
  ): Promise<void> {
    await this.sendAndLog('sendCommissionStatusUpdateEmail', recipientEmail, {
      subject: `Commission Update: ${loadTitle} — ${status}`,
      htmlBody: this.renderEmail({
        title: 'Commission Status Update', greeting: `Hello ${brokerName},`,
        body: `Your commission for <strong>${loadTitle}</strong> (amount: ${commissionAmount}) has been updated to <strong>${status}</strong>.`,
        ctaLabel: 'View Commission', ctaUrl: `${this.getFrontendUrl()}/dashboard/broker`, ctaColor: '#345E85',
      }),
    });
  }

  async sendCommissionPayoutRequestEmail(
    recipientEmail: string, brokerName: string, totalAmount: number,
    payoutMethod: string, accountDetails: string,
  ): Promise<void> {
    await this.sendAndLog('sendCommissionPayoutRequestEmail', recipientEmail, {
      subject: 'Payout Request Submitted — UrutiX',
      htmlBody: this.renderEmail({
        title: 'Payout Request Submitted', greeting: `Hello ${brokerName},`,
        body: `Your commission payout request has been submitted successfully.<br><br>
          <strong>Amount:</strong> ${totalAmount}<br>
          <strong>Method:</strong> ${payoutMethod}<br>
          <strong>Account:</strong> ${accountDetails}<br><br>
          We will process your request shortly and notify you once it has been approved.`,
        ctaLabel: 'View Payouts', ctaUrl: `${this.getFrontendUrl()}/dashboard/broker`, ctaColor: '#345E85',
      }),
    });
  }

  // ─── Parking reservation emails ─────────────────────────────────────────────

  async sendParkingReservationEmail(options: {
    to: string;
    subject: string;
    title: string;
    greeting?: string;
    body: string;
    extraHtml?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    note?: string;
    textBody?: string;
  }) {
    return this.sendGenericEmail({
      to: options.to,
      subject: options.subject,
      htmlBody: this.renderEmail({
        title: options.title,
        greeting: options.greeting,
        body: options.body,
        extraHtml: options.extraHtml,
        ctaLabel: options.ctaLabel,
        ctaUrl: options.ctaUrl,
        note: options.note,
      }),
      textBody: options.textBody,
      fromName: 'Nova Parking 365',
    });
  }

  // ─── HTML template engine ──────────────────────────────────────────────────

  /**
   * Renders a complete transactional email with the UrutiX brand wrapper.
   */
  private renderEmail(opts: {
    title: string;
    greeting?: string;
    body: string;
    extraHtml?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    ctaColor?: string;
    note?: string;
    expiryNote?: string;
  }): string {
    const { title, greeting, body, extraHtml, ctaLabel, ctaUrl, ctaColor = '#345E85', note, expiryNote } = opts;
    const year = new Date().getFullYear();

    const ctaBlock = ctaLabel && ctaUrl ? `
      <div style="text-align:center;margin:32px 0;">
        <a href="${ctaUrl}"
           style="display:inline-block;padding:14px 32px;background-color:${ctaColor};color:#ffffff;
                  text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;
                  letter-spacing:0.3px;line-height:1;">
          ${ctaLabel}
        </a>
      </div>
      <p style="margin:0 0 16px;font-size:13px;color:#94a3b8;text-align:center;">
        Or copy this link: <a href="${ctaUrl}" style="color:${ctaColor};word-break:break-all;">${ctaUrl}</a>
      </p>` : '';

    const noteBlock  = note  ? `<p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">${note}</p>` : '';
    const expiryBlock = expiryNote ? `<p style="margin:8px 0 0;font-size:12px;color:#cbd5e1;">${expiryNote}</p>` : '';
    const greetingBlock = greeting ? `<p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#0f172a;">${greeting}</p>` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background-color:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;
                    box-shadow:0 1px 3px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background-color:#0f172a;padding:28px 40px;text-align:center;">
            <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:3px;
                         text-transform:uppercase;">UrutiX</span>
            <p style="margin:4px 0 0;font-size:11px;color:#64748b;letter-spacing:2px;
                      text-transform:uppercase;">Logistics Intelligence Platform</p>
          </td>
        </tr>

        <!-- Title bar -->
        <tr>
          <td style="padding:32px 40px 8px;">
            <h1 style="margin:0;font-size:20px;font-weight:800;color:#0f172a;line-height:1.3;">
              ${title}
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:16px 40px 32px;font-size:15px;line-height:1.7;color:#334155;">
            ${greetingBlock}
            <p style="margin:0 0 16px;">${body}</p>
            ${extraHtml || ''}
            ${ctaBlock}
            ${noteBlock}
            ${expiryBlock}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;background-color:#f8fafc;
                     border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
              &copy; ${year} UrutiX. All rights reserved.
            </p>
            <p style="margin:0;font-size:11px;color:#cbd5e1;">
              You are receiving this email because an account was created or a request was made on UrutiX.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  /**
   * Renders a role-based account setup email with a feature list.
   */
  private renderSetupEmail(opts: {
    firstName: string;
    role: string;
    setupUrl: string;
    ctaColor: string;
    features: string[];
  }): string {
    const featureItems = opts.features
      .map(f => `<li style="margin:0 0 8px;color:#475569;">${f}</li>`)
      .join('');

    const body = `
      Your <strong>${opts.role}</strong> account has been created on UrutiX. Click the button below to
      set your password and get started.<br><br>
      Once you're in, you'll be able to:
      <ul style="margin:16px 0;padding-left:20px;line-height:1.8;">
        ${featureItems}
      </ul>
      <p style="margin:0;font-size:13px;color:#94a3b8;">
        This setup link expires in <strong>7 days</strong>.
      </p>`;

    return this.renderEmail({
      title:    `Welcome to UrutiX, ${opts.firstName}!`,
      greeting: `Hello ${opts.firstName},`,
      body,
      ctaLabel: 'Set Up My Password',
      ctaUrl:   opts.setupUrl,
      ctaColor: opts.ctaColor,
      note:     "If you didn't expect this email, you can safely ignore it.",
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Shared wrapper used by all public email methods.
   * Calls sendGenericEmail and logs the outcome with the caller's name
   * so docker logs show exactly which email type succeeded or failed.
   */
  private async sendAndLog(
    methodName: string,
    to: string,
    options: { subject: string; htmlBody?: string; textBody?: string; replyTo?: string },
    throwOnError = false,
  ): Promise<void> {
    this.logger.log(`[EMAIL] ${methodName} → to=${to} | subject="${options.subject}"`);
    const result = await this.sendGenericEmail({ to, ...options });
    if (result.success) {
      this.logger.log(`[EMAIL] ${methodName} SUCCESS ✓ → ${to} | id=${result.messageId}`);
    } else {
      this.logger.error(`[EMAIL] ${methodName} FAILED ✗ → ${to} | ${result.error}`);
      if (throwOnError) {
        throw new Error(result.error || `Failed to send email via ${methodName}`);
      }
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private getFrontendUrl(): string {
    return this.frontendUrl;
  }
}
