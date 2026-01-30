// pages/api/send-broadcast-email.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { emails, taskTitle } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ message: 'No recipients provided' });
  }

  // 🔹 SMTP Configuration from Environment Variables
  // User needs to add these to .env file
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER, // e.g. company@gmail.com
      pass: process.env.SMTP_PASS, // e.g. app-specific password
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Cehpoint Portal" <${process.env.SMTP_USER}>`,
      bcc: emails.join(','), // Using BCC to protect privacy
      subject: `🚀 New Project Broadcast: ${taskTitle}`,
      text: `Hello,\n\nA new project matching your skills has been posted on the Cehpoint Work Portal: "${taskTitle}".\n\nLogin to your dashboard to view details and accept the task.\n\nBest regards,\nCehpoint Team`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e1e8ed;">
            
            <!-- Header with Gradient Area -->
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
              <div style="background-color: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 14px; margin: 0 auto 20px; display: table;">
                <span style="display: table-cell; vertical-align: middle; font-size: 30px;">🚀</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">New Project Opportunity</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">A task matching your elite skill set is live.</p>
            </div>

            <div style="padding: 40px 35px;">
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                Hello there, <br><br>
                Our system has identified you as a top candidate for a recently broadcasted project. This is a high-priority task waiting for your expert touch.
              </p>

              <!-- Project Highlight Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid #4f46e5; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <span style="text-transform: uppercase; font-size: 11px; font-weight: 800; color: #6366f1; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">Project Title</span>
                <strong style="color: #1e293b; font-size: 20px; line-height: 1.3; display: block; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.05));">
                  ${taskTitle}
                </strong>
              </div>

              <div style="text-align: center; margin-top: 40px;">
                <a href="${(process.env.NEXT_PUBLIC_SITE_URL ? (process.env.NEXT_PUBLIC_SITE_URL.startsWith('http') ? process.env.NEXT_PUBLIC_SITE_URL : `https://${process.env.NEXT_PUBLIC_SITE_URL}`) : 'http://localhost:5000')}/tasks" 
                   style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 16px 36px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3); transition: transform 0.2s ease;">
                  Review & Accept Project
                </a>
                <p style="color: #94a3b8; font-size: 13px; margin-top: 20px;">
                  Quick action is recommended as broadcasted tasks are filled on a first-come basis.
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
              <div style="margin-top: 15px;">
                <a href="#" style="color: #64748b; text-decoration: underline; font-size: 12px;">Update Notification Preferences</a>
              </div>
            </div>
          </div>
        </div>
      `,
    });

    console.log('[Mail] Success:', info.messageId);
    return res.status(200).json({ message: 'Emails sent successfully' });
  } catch (error) {
    console.error('[Mail] Error:', error);
    return res.status(500).json({ message: 'Failed to send emails', error: String(error) });
  }
}
