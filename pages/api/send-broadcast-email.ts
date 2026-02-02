// pages/api/send-broadcast-email.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { emails, taskTitle, type } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ message: 'No recipients provided' });
  }

  const isAssignment = type === 'assignment';

  // 🔹 SMTP Configuration from Environment Variables
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const subject = isAssignment ? `📍 Mission Assigned: ${taskTitle}` : `🚀 Priority Mission: ${taskTitle}`;
    const headerTitle = isAssignment ? "Assignment Confirmed" : "New Project Opportunity";
    const headerIcon = isAssignment ? "📍" : "🚀";
    const bodyText = isAssignment
      ? `You have been explicitly selected for the following mission: "${taskTitle}".`
      : `A new project matching your skills has been posted: "${taskTitle}".`;
    const subText = isAssignment ? "Assignment Details" : "Mission Title";
    const buttonLabel = isAssignment ? "Go to Workspace" : "Review & Accept Mission";

    console.log(`[Mail] Sending ${type || 'info'} for "${taskTitle}" to ${emails.length} users.`);

    const info = await transporter.sendMail({
      from: `"Cehpoint Work" <${process.env.SMTP_USER}>`,
      bcc: emails,
      subject: subject,
      text: `Hello,\n\n${bodyText}\n\nLogin to your dashboard to view details.\n\nBest regards,\nCehpoint Team`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e1e8ed;">
            
            <div style="background: linear-gradient(135deg, ${isAssignment ? '#4f46e5 0%, #06b6d4 100%' : '#4f46e5 0%, #7c3aed 100%'}); padding: 40px 30px; text-align: center;">
              <div style="background-color: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 14px; margin: 0 auto 20px; display: table;">
                <span style="display: table-cell; vertical-align: middle; font-size: 30px;">${headerIcon}</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">${headerTitle}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">${isAssignment ? 'A direct assignment has been registered.' : 'A mission matching your expertise is live.'}</p>
            </div>

            <div style="padding: 40px 35px;">
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                Hello Specialist, <br><br>
                ${bodyText}
              </p>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid #4f46e5; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <span style="text-transform: uppercase; font-size: 11px; font-weight: 800; color: #6366f1; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">${subText}</span>
                <strong style="color: #1e293b; font-size: 20px; line-height: 1.3; display: block;">
                  ${taskTitle}
                </strong>
              </div>

              <div style="text-align: center; margin-top: 40px;">
                <a href="${(process.env.NEXT_PUBLIC_SITE_URL ? (process.env.NEXT_PUBLIC_SITE_URL.startsWith('http') ? process.env.NEXT_PUBLIC_SITE_URL : `https://${process.env.NEXT_PUBLIC_SITE_URL}`) : 'http://localhost:5000')}/dashboard" 
                   style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 16px 36px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);">
                  ${buttonLabel}
                </a>
                <p style="color: #94a3b8; font-size: 13px; margin-top: 20px;">
                  Login to your workspace to view the complete briefing.
                </p>
              </div>
            </div>
                <p style="color: #94a3b8; font-size: 13px; margin-top: 20px;">
                  This is a first-come, first-served opportunity. Review it on your dashboard now.
                </p>
              </div>
            </div>

            <!-- Footer Area -->
            <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 30px; text-align: center;">
              <div style="margin-bottom: 15px;">
                <span style="font-weight: 800; color: #1e293b; font-size: 16px;">Cehpoint <span style="color: #4f46e5;">Work</span></span>
              </div>
              <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
                You received this priority alert because you are a verified member of the Cehpoint community.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log('[Mail] Broadcast sent successfully. Message ID:', info.messageId);
    return res.status(200).json({ message: 'Emails sent successfully', messageId: info.messageId });
  } catch (error) {
    console.error('[Mail] Critical Error:', error);
    return res.status(500).json({ message: 'Failed to send emails', error: String(error) });
  }
}
