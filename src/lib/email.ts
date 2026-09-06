/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
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
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = process.env.SMTP_PASS || '';

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
            <p style="color: #C4432B; margin: 5px 0 0; font-size: 13px; font-weight: bold; text-transform: uppercase;">Giterp Multi-School Platform</p>
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

export interface PasswordResetEmailPayload {
  schoolName: string;
  schoolCode: string;
  userId: string;
  userName: string;
  userRole: string;
  newPasscode: string;
  userEmail?: string;
  userPhone?: string;
}

export async function sendPasswordResetEmail(payload: PasswordResetEmailPayload): Promise<{ success: boolean; message: string }> {
  const targetEmail = 'blistedx@gmail.com';
  const smtpUser = process.env.SMTP_USER || 'blistedx@gmail.com';

  console.log(`\n======================================================`);
  console.log(`🔐 PASSCODE RESET INITIATED FOR: ${payload.userId} (${payload.userName})`);
  console.log(`🏫 School: ${payload.schoolName} [${payload.schoolCode}] | Role: ${payload.userRole}`);
  console.log(`🔑 New Passcode: ${payload.newPasscode}`);
  console.log(`📧 Destination: ${targetEmail}`);
  console.log(`======================================================\n`);

  try {
    const transporter = getTransporter();

    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' });

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; padding: 32px; color: #0F172A;">
        <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
          <div style="border-bottom: 2px solid #C4432B; padding-bottom: 18px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <h2 style="color: #122A24; margin: 0; font-size: 22px; font-weight: 700;">🔐 Security Passcode Reset</h2>
              <span style="background: #FEF2F2; color: #C4432B; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">Urgent Credentials</span>
            </div>
            <p style="color: #52796F; margin: 6px 0 0; font-size: 13px; font-weight: 500;">EduGit Multi-School Enterprise Platform</p>
          </div>

          <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
            A passcode reset request was received for an account registered under your school ERP system. A new security passcode has been automatically generated and updated in the system.
          </p>

          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr style="border-bottom: 1px solid #EDF2F7;">
                <td style="padding: 9px 0; font-weight: 600; width: 140px; color: #64748B;">School Name:</td>
                <td style="padding: 9px 0; color: #0F172A; font-weight: bold;">${payload.schoolName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #EDF2F7;">
                <td style="padding: 9px 0; font-weight: 600; color: #64748B;">School Code:</td>
                <td style="padding: 9px 0; color: #122A24; font-family: monospace; font-weight: bold; font-size: 15px;">${payload.schoolCode}</td>
              </tr>
              <tr style="border-bottom: 1px solid #EDF2F7;">
                <td style="padding: 9px 0; font-weight: 600; color: #64748B;">User ID / Login ID:</td>
                <td style="padding: 9px 0; color: #0F172A; font-family: monospace; font-weight: bold; font-size: 15px;">${payload.userId}</td>
              </tr>
              <tr style="border-bottom: 1px solid #EDF2F7;">
                <td style="padding: 9px 0; font-weight: 600; color: #64748B;">Full Name:</td>
                <td style="padding: 9px 0; color: #0F172A; font-weight: 600;">${payload.userName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #EDF2F7;">
                <td style="padding: 9px 0; font-weight: 600; color: #64748B;">Account Role:</td>
                <td style="padding: 9px 0; color: #0F172A;">
                  <span style="background: #F1F5F9; color: #1E293B; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${payload.userRole}</span>
                </td>
              </tr>
              ${payload.userEmail ? `
              <tr style="border-bottom: 1px solid #EDF2F7;">
                <td style="padding: 9px 0; font-weight: 600; color: #64748B;">User Email:</td>
                <td style="padding: 9px 0; color: #334155;">${payload.userEmail}</td>
              </tr>` : ''}
              ${payload.userPhone ? `
              <tr style="border-bottom: 1px solid #EDF2F7;">
                <td style="padding: 9px 0; font-weight: 600; color: #64748B;">Contact Phone:</td>
                <td style="padding: 9px 0; color: #334155;">${payload.userPhone}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 9px 0; font-weight: 600; color: #64748B;">Request Time:</td>
                <td style="padding: 9px 0; color: #64748B; font-size: 13px;">${timestamp} IST</td>
              </tr>
            </table>
          </div>

          <div style="background: linear-gradient(135deg, #122A24 0%, #1C443A 100%); border-radius: 10px; padding: 22px; text-align: center; margin-bottom: 24px;">
            <p style="color: #A3E635; margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
              ⚡ Newly Generated Security Passcode
            </p>
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; color: #FFFFFF; letter-spacing: 6px; padding: 8px 16px; background: rgba(255,255,255,0.1); border-radius: 8px; display: inline-block;">
              ${payload.newPasscode}
            </div>
            <p style="color: #94A3B8; margin: 10px 0 0; font-size: 12px;">
              Use this passcode along with School Code <strong style="color: #FFFFFF;">${payload.schoolCode}</strong> and User ID <strong style="color: #FFFFFF;">${payload.userId}</strong> to log in.
            </p>
          </div>

          <div style="border-top: 1px solid #E2E8F0; padding-top: 18px; font-size: 12px; color: #64748B; line-height: 1.5;">
            <p style="margin: 0 0 6px;">🛡️ <strong>Security Tip:</strong> It is recommended to change this temporary passcode from your ERP profile settings once logged in.</p>
            <p style="margin: 0;">If you did not authorize this password reset, please secure the account immediately in the Agency Admin Console.</p>
          </div>
        </div>
      </div>
    `;

    const recipients = [targetEmail];
    if (payload.userEmail && payload.userEmail.includes('@') && payload.userEmail.toLowerCase() !== targetEmail.toLowerCase()) {
      recipients.push(payload.userEmail);
    }

    await transporter.sendMail({
      from: `"EduGit Security" <${smtpUser}>`,
      to: targetEmail,
      cc: payload.userEmail && payload.userEmail.includes('@') && payload.userEmail.toLowerCase() !== targetEmail.toLowerCase() ? payload.userEmail : undefined,
      subject: `🔐 New Passcode for ${payload.userId} - ${payload.schoolName} (${payload.schoolCode})`,
      text: `Passcode Reset Request\n\nSchool: ${payload.schoolName} (${payload.schoolCode})\nUser ID: ${payload.userId}\nName: ${payload.userName}\nRole: ${payload.userRole}\n\nNew Passcode: ${payload.newPasscode}\n\nGenerated At: ${timestamp} IST`,
      html: htmlContent
    });

    console.log(`✅ Passcode reset email successfully delivered to ${targetEmail}!`);
    return {
      success: true,
      message: 'New passcode has been emailed successfully!'
    };
  } catch (error: any) {
    console.error('❌ Failed to send passcode reset email:', error);
    return {
      success: false,
      message: `Failed to send email: ${error.message}`
    };
  }
}

