import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requestId, schoolCode, adminId, adminPin, action } = body;

    if (!requestId) {
      return NextResponse.json({ success: false, error: 'Request ID is required' }, { status: 400 });
    }

    if (action === 'REJECT') {
      await Database.rejectDemoRequest(requestId);
      return NextResponse.json({ success: true, message: 'Demo request rejected.' });
    }

    // Approve & Provision
    const result = await Database.approveDemoRequest(requestId, schoolCode, adminId, adminPin);

    if (!result.success || !result.school) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to approve request' }, { status: 400 });
    }

    // Optional: send confirmation email to the school principal with credentials
    const requests = await Database.getDemoRequests();
    const originalReq = requests.find(r => r.id === requestId);

    if (originalReq && originalReq.email && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const isGmail = (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail')) || (process.env.SMTP_USER && process.env.SMTP_USER.includes('gmail'));
        const transporter = nodemailer.createTransport(
          isGmail
            ? { service: 'gmail', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
            : { host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT) || 465, secure: Number(process.env.SMTP_PORT) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
        );

        await transporter.sendMail({
          from: `"EduSuite ERP" <${process.env.SMTP_USER}>`,
          to: originalReq.email,
          subject: `🎉 Your EduSuite School ERP Account is Ready (${result.school.school_name})`,
          html: `
            <div style="font-family: Arial, sans-serif; background: #F8FAFC; padding: 25px; color: #0F172A;">
              <div style="max-width: 550px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; padding: 25px; border-radius: 10px;">
                <h2 style="color: #122A24; margin-top: 0;">Welcome to EduSuite Cloud ERP!</h2>
                <p>Dear ${originalReq.contact_name},</p>
                <p>Your demo & onboarding application for <strong>${result.school.school_name}</strong> has been approved. Your dedicated institutional workspace is now active.</p>
                
                <div style="background: #122A24; color: #FFFFFF; padding: 18px; border-radius: 8px; font-family: monospace; font-size: 14px; margin: 20px 0;">
                  <div style="margin-bottom: 8px;">🏫 School Code: <strong>${result.school.school_code}</strong></div>
                  <div style="margin-bottom: 8px;">👤 Admin ID / Username: <strong>${result.school.admin_id}</strong></div>
                  <div>🔑 Temporary Password: <strong>${result.school.admin_pin}</strong></div>
                </div>

                <p><a href="http://localhost:3000/login" style="display: inline-block; background: #C4432B; color: #FFFFFF; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Sign In to School Portal →</a></p>
                
                <p style="font-size: 12px; color: #64748B; margin-top: 25px;">Please change your password upon initial sign in.</p>
              </div>
            </div>
          `
        });
      } catch (mailErr) {
        console.warn('Notice sending credentials email to principal:', mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      school: result.school,
      message: `School ${result.school.school_name} approved and activated with code [${result.school.school_code}]!`
    });
  } catch (error: any) {
    console.error('Approval error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
