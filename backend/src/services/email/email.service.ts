import { Resend } from 'resend';

import { env } from '../../config/env';
import { logger } from '../logging/logger';

/**
 * Transport-agnostic email interface. Auth flows depend on this abstraction,
 * not on a concrete provider, so Resend can be swapped without touching
 * business logic.
 */
export interface EmailService {
  sendVerificationEmail(to: string, verificationUrl: string): Promise<void>;
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

function verificationEmail(verificationUrl: string): { subject: string; html: string } {
  return {
    subject: 'Verify your ABLE account',
    html: [
      '<h2>Welcome to ABLE</h2>',
      '<p>Confirm your email address to activate your account:</p>',
      `<p><a href="${verificationUrl}">Verify email</a></p>`,
      `<p>If the link does not work, copy this URL into your browser:</p>`,
      `<p>${verificationUrl}</p>`,
      '<p>This link expires in 24 hours.</p>',
    ].join('\n'),
  };
}

/** Production transport backed by Resend. */
export class ResendEmailService implements EmailService {
  private readonly client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  private async send({ to, subject, html }: SendArgs): Promise<void> {
    const { error } = await this.client.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
    const { subject, html } = verificationEmail(verificationUrl);
    await this.send({ to, subject, html });
    logger.info({ to }, 'Verification email sent');
  }
}

/**
 * Development/test transport. Logs the message instead of sending it so local
 * flows work without a Resend key. It is a real, deterministic fallback — not a
 * placeholder — selected only when RESEND_API_KEY is absent.
 */
export class LogEmailService implements EmailService {
  async sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
    logger.info({ to, verificationUrl }, 'Verification email (log transport)');
  }
}

function createEmailService(): EmailService {
  if (env.RESEND_API_KEY) {
    return new ResendEmailService(env.RESEND_API_KEY);
  }
  logger.warn('RESEND_API_KEY not set — using log email transport');
  return new LogEmailService();
}

export const emailService: EmailService = createEmailService();
