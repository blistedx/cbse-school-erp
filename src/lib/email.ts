import nodemailer from 'nodemailer';

export interface DemoRequestPayload {
  schoolName: string;
  city: string;
  strength: string;
  board: string;
  contactName: string;
  email: string;
  phone: string;
  notes?: string;
  generatedSchoolCode?: string;
}

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpUser = process.env.SMTP_USER || 'blistedx@gmail.com';
  const smtpPass = process.env.SMTP_PASS || 'nwnfrdibwtqnfvjd';

  const isGmail = (smtpHost && smtpHost.includes('gmail')) || (smtpUser && smtpUser.includes('gmail'));

  const transportConfig = isGmail
    ? {
        service: 'gmail',
        pool: true,
        maxConnections: 5,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      }
    : {
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        pool: true,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      };

  cachedTransporter = nodemailer.createTransport(transportConfig as any);
  return cachedTransporter;
}

export async function sendDemoRequestEmail(payload: DemoRequestPayload): Promise<{ success: boolean; message: string }> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'blistedx@gmail.com';
  const smtpUser = process.env.SMTP_USER || 'blistedx@gmail.com';

  console.log(`\n======================================================`);
  console.log(`📬 NEW DEMO REQUEST RECEIVED: ${payload.schoolName} (${payload.city})`);
  console.log(`👤 Contact: ${payload.contactName} | 📧 ${payload.email} | 📞 ${payload.phone}`);
  console.log(`🏫 Strength: ${payload.strength} students | Board: ${payload.board}`);
  console.log(`📝 Notes: ${payload.notes || 'None'}`);
  console.log(`======================================================\n`);

  try {
    const transporter = getTransporter();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background: #F8FAFC; padding: 30px; color: #0F172A;">
        <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="border-bottom: 2px solid #C4432B; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="color: #122A24; margin: 0; font-size: 22px;">🏫 New Demo & Onboarding Request</h2>
            <p style="color: #C4432B; margin: 5px 0 0; font-size: 13px; font-weight: bold; text-transform: uppercase;">EduGit Multi-School Platform</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <td style="padding: 10px 0; font-weight: bold; width: 140px; color: #0F172A;">School Name:</td>
              <td style="padding: 10px 0; color: #122A24; font-size: 16px; font-weight: bold;">${payload.schoolName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <td style="padding: 10px 0; font-weight: bold; color: #0F172A;">City / Location:</td>
              <td style="padding: 10px 0; color: #334155;">${payload.city}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <td style="padding: 10px 0; font-weight: bold; color: #0F172A;">Student Strength:</td>
              <td style="padding: 10px 0; color: #334155;">${payload.strength} students</td>
            </tr>
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <td style="padding: 10px 0; font-weight: bold; color: #0F172A;">Board / Curriculum:</td>
              <td style="padding: 10px 0; color: #334155;">${payload.board || 'CBSE'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <td style="padding: 10px 0; font-weight: bold; color: #0F172A;">Contact Person:</td>
              <td style="padding: 10px 0; color: #334155;">${payload.contactName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <td style="padding: 10px 0; font-weight: bold; color: #0F172A;">Email:</td>
              <td style="padding: 10px 0; color: #C4432B;"><a href="mailto:${payload.email}" style="color: #C4432B; text-decoration: none; font-weight: bold;">${payload.email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <td style="padding: 10px 0; font-weight: bold; color: #0F172A;">Phone Number:</td>
              <td style="padding: 10px 0; color: #122A24; font-weight: bold;">${payload.phone}</td>
            </tr>
            ${payload.generatedSchoolCode ? `
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <td style="padding: 10px 0; font-weight: bold; color: #0F172A;">Generated Code:</td>
              <td style="padding: 10px 0; font-family: monospace; font-size: 15px; color: #122A24; font-weight: bold;">${payload.generatedSchoolCode}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 10px 0; font-weight: bold; vertical-align: top; color: #0F172A;">Notes / Focus:</td>
              <td style="padding: 10px 0; color: #64748B; line-height: 1.5;">${payload.notes || 'N/A'}</td>
            </tr>
          </table>

          <div style="background: #122A24; color: #FFFFFF; padding: 15px; border-radius: 8px; font-size: 13px; text-align: center;">
            ✦ Action Required: Review in <a href="http://localhost:3000/agency" style="color: #FFFFFF; text-decoration: underline; font-weight: bold;">Agency Console</a> to approve.
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"EduGit Notifications" <${smtpUser}>`,
      to: adminEmail,
      replyTo: payload.email,
      subject: `🚨 New Demo Request: ${payload.schoolName} (${payload.city})`,
      text: `New Demo Request from ${payload.schoolName} (${payload.city})\nContact: ${payload.contactName} (${payload.phone}, ${payload.email})\nStudents: ${payload.strength} | Board: ${payload.board}\nNotes: ${payload.notes}`,
      html: htmlContent
    });

    console.log(`✅ Demo notification email sent successfully to ${adminEmail}!`);
    return {
      success: true,
      message: 'Email notification sent successfully!'
    };
  } catch (error: any) {
    console.error('❌ Failed to send demo email:', error);
    return {
      success: false,
      message: `Failed to send email: ${error.message}`
    };
  }
}
