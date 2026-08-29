const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  console.log('Connecting to Gmail SMTP with:', process.env.SMTP_USER);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const info = await transporter.sendMail({
    from: `"EduSuite Notifications" <${process.env.SMTP_USER}>`,
    to: process.env.ADMIN_NOTIFICATION_EMAIL,
    subject: '🎉 EduSuite Email Notification Setup Verified!',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 25px; background: #F3E8CE; color: #16233F;">
        <div style="background: #FBF6E9; border: 2px solid rgba(22,35,63,0.2); padding: 25px; border-radius: 10px; max-width: 550px; margin: 0 auto;">
          <h2 style="color: #122A24; margin-top: 0;">🏫 EduSuite Notification Connected</h2>
          <p style="font-size: 14px; line-height: 1.5; color: #1E1C16;">
            Your Gmail notification setup for <strong>EduSuite ERP</strong> is working properly.
          </p>
          <div style="background: #122A24; color: #F3EFDD; padding: 12px; border-radius: 6px; font-size: 13px; margin: 20px 0;">
            ✓ You will receive all demo & onboarding requests directly at <strong>blistedx@gmail.com</strong>.
          </div>
          <p style="font-size: 12px; color: #7d7a6c; margin-bottom: 0;">
            Sent automatically by EduSuite Cloud Platform.
          </p>
        </div>
      </div>
    `
  });

  console.log('✅ Email successfully sent to blistedx@gmail.com! Message ID:', info.messageId);
}

testEmail().catch(err => {
  console.error('❌ Email error:', err);
});
