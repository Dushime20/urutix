/**
 * Re-export the auth EmailService as the notifications EmailService.
 *
 * Previously this was a stub that silently discarded all emails.
 * Now it is simply the real SMTP-backed service so all callers in the
 * notifications module get actual email delivery.
 */
export { EmailService } from '../../auth/services/email.service';
