import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { AlertDocument, AlertSeverity } from '../../schemas/alert.schema';

/**
 * Email Notification Service
 *
 * Handles sending email notifications for critical alerts
 * Requirements: 8.2
 */
@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.fromAddress =
      this.configService.get<string>('email.from') ||
      'noreply@livestock-monitor.com';
    this.frontendUrl =
      this.configService.get<string>('frontendUrl') || 'http://localhost:3000';

    this.initializeTransporter();
  }

  /**
   * Initialize the nodemailer transporter
   */
  private initializeTransporter(): void {
    const host = this.configService.get<string>('email.host');
    const port = this.configService.get<number>('email.port');
    const user = this.configService.get<string>('email.user');
    const pass = this.configService.get<string>('email.pass');

    // Only initialize if SMTP settings are configured
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port || 587,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });

      this.logger.log('Email transporter initialized');
    } else {
      this.logger.warn(
        'Email transporter not initialized - SMTP settings not configured',
      );
    }
  }

  /**
   * Check if email service is configured and available
   */
  isConfigured(): boolean {
    return this.transporter !== null;
  }

  /**
   * Send alert notification email
   * Requirements: 8.2
   */
  async sendAlertNotification(
    alert: AlertDocument,
    recipientEmails: string[],
  ): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        'Cannot send email notification - transporter not configured',
      );
      return false;
    }

    if (recipientEmails.length === 0) {
      this.logger.warn('No recipients provided for alert notification');
      return false;
    }

    try {
      const subject = this.getEmailSubject(alert);
      const html = this.getEmailHtml(alert);

      await this.transporter.sendMail({
        from: this.fromAddress,
        to: recipientEmails.join(', '),
        subject,
        html,
      });

      this.logger.log(
        `Alert notification sent to ${recipientEmails.length} recipients for alert: ${alert.title}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send alert notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Generate email subject based on alert severity
   */
  private getEmailSubject(alert: AlertDocument): string {
    const severityPrefix = this.getSeverityPrefix(alert.severity);
    return `${severityPrefix} Livestock Monitor Alert: ${alert.title}`;
  }

  /**
   * Get severity prefix for email subject
   */
  private getSeverityPrefix(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return '🚨 CRITICAL';
      case AlertSeverity.WARNING:
        return '⚠️ WARNING';
      case AlertSeverity.INFO:
        return 'ℹ️ INFO';
      default:
        return '📢';
    }
  }

  /**
   * Generate HTML email content
   */
  private getEmailHtml(alert: AlertDocument): string {
    const severityColor = this.getSeverityColor(alert.severity);
    const alertUrl = `${this.frontendUrl}/alerts`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alert Notification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: ${severityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">${this.getSeverityPrefix(alert.severity)} Alert</h1>
  </div>
  
  <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="margin-top: 0; color: #333;">${alert.title}</h2>
    
    <p style="margin-bottom: 20px;">${alert.message}</p>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Type:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${alert.type}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Severity:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
          <span style="background-color: ${severityColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
            ${alert.severity.toUpperCase()}
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Status:</strong></td>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${alert.status}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0;"><strong>Created:</strong></td>
        <td style="padding: 8px 0;">${new Date(alert.createdAt).toLocaleString()}</td>
      </tr>
    </table>
    
    <div style="text-align: center; margin-top: 20px;">
      <a href="${alertUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
        View Alert Details
      </a>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
    <p>This is an automated notification from the Livestock Monitoring System.</p>
    <p>Please do not reply to this email.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get color based on severity
   */
  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return '#dc3545'; // Red
      case AlertSeverity.WARNING:
        return '#ffc107'; // Yellow/Orange
      case AlertSeverity.INFO:
        return '#17a2b8'; // Blue
      default:
        return '#6c757d'; // Gray
    }
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error(
        `SMTP connection verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }
}
