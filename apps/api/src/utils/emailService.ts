import nodemailer from 'nodemailer';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: { filename: string; path: string }[];
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!process.env.SMTP_USER) {
    logger.warn('Email not configured. Skipping email send.');
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'CDDAS System <noreply@college.edu>',
      ...options,
    });
    logger.info(`Email sent to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
    return true;
  } catch (error) {
    logger.error('Email send failed:', error);
    return false;
  }
}

export function buildApprovalEmailHTML(params: {
  recipientName: string;
  documentTitle: string;
  requesterName: string;
  action: string;
  comments?: string;
  link?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Inter, Arial, sans-serif; background: #F8FAFC; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #4338CA, #7C3AED); padding: 32px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 24px; }
        .body { padding: 32px; }
        .detail-box { background: #F8FAFC; border-radius: 12px; padding: 16px; margin: 16px 0; border-left: 4px solid #6366F1; }
        .btn { display: inline-block; background: #6366F1; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; margin-top: 16px; }
        .footer { background: #F8FAFC; padding: 16px 32px; text-align: center; font-size: 12px; color: #94A3B8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 CDDAS Approval System</h1>
          <p>Document Approval Notification</p>
        </div>
        <div class="body">
          <p>Dear <strong>${params.recipientName}</strong>,</p>
          <p>An approval action has been performed on a document that requires your attention.</p>
          <div class="detail-box">
            <p><strong>Document:</strong> ${params.documentTitle}</p>
            <p><strong>Requested By:</strong> ${params.requesterName}</p>
            <p><strong>Action:</strong> <span style="color: #6366F1; font-weight: 600;">${params.action}</span></p>
            ${params.comments ? `<p><strong>Comments:</strong> ${params.comments}</p>` : ''}
          </div>
          ${params.link ? `<a href="${params.link}" class="btn">View Document →</a>` : ''}
        </div>
        <div class="footer">
          <p>This is an automated message from CDDAS. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
