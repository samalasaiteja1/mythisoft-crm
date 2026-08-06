import nodemailer from 'nodemailer';

const isSmtpConfigured = () =>
  process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_USER !== 'your_email@gmail.com';

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

export const sendPasswordResetEmail = async (email, resetToken) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  if (!isSmtpConfigured()) {
    console.log('\n========== PASSWORD RESET (SMTP not configured) ==========');
    console.log(`To: ${email}`);
    console.log(`Reset link: ${resetUrl}`);
    console.log('Configure SMTP_USER and SMTP_PASS in server/.env to send real emails.');
    console.log('==========================================================\n');
    return { sent: false, resetUrl, devMode: true };
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"MYTHISOFT CRM" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'MYTHISOFT CRM - Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #001B4E; padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">MYTHISOFT CRM</h1>
          <p style="color: #3ABEF9; margin: 8px 0 0;">Innovating Today, Empowering Tomorrow</p>
        </div>
        <div style="padding: 32px; background: #f9f9f9;">
          <h2 style="color: #001B4E;">Password Reset Request</h2>
          <p>You requested a password reset for your MYTHISOFT CRM account.</p>
          <p>Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #3ABEF9; color: #001B4E; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">Or copy this link: ${resetUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">If you did not request this, ignore this email.</p>
        </div>
      </div>
    `,
  });

  return { sent: true, resetUrl };
};

export const sendCrmEmail = async ({ to, subject, body, fromName = 'MYTHISOFT CRM' }) => {
  if (!isSmtpConfigured()) {
    throw new Error('SMTP not configured. Add SMTP settings in server/.env');
  }

  const transporter = createTransporter();
  const from = `"${fromName}" <${process.env.SMTP_USER}>`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #001B4E; padding: 20px; text-align: center;">
        <h2 style="color: #fff; margin: 0;">MYTHISOFT CRM</h2>
        <p style="color: #3ABEF9; margin: 6px 0 0; font-size: 12px;">Innovating Today, Empowering Tomorrow</p>
      </div>
      <div style="padding: 24px; background: #f9f9f9; color: #333;">
        ${body.replace(/\n/g, '<br>')}
      </div>
      <div style="padding: 12px; text-align: center; font-size: 11px; color: #999;">
        Sent via MYTHISOFT INNOVATION PRIVATE LIMITED CRM
      </div>
    </div>
  `;

  const info = await transporter.sendMail({
    from,
    to,
    subject: subject || 'Message from MYTHISOFT CRM',
    text: body,
    html,
  });

  return { sent: true, messageId: info.messageId, from: process.env.SMTP_USER };
};

const clientPortalUrl = (path = '') => {
  const base = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

/** Notify customer that their project is ready for acceptance */
export const sendProjectDeliveryEmail = async ({
  to,
  customerName,
  projectName,
  deliveryVersion,
  deliveryDate,
  deliveryNotes,
  reviewUrl,
}) => {
  const reviewLink = reviewUrl || clientPortalUrl('/projects');
  const dateLabel = deliveryDate
    ? new Date(deliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  const htmlBody = `
    <h2 style="color: #001B4E;">Your project is ready for review</h2>
    <p>Hello ${customerName || 'there'},</p>
    <p><strong>${projectName}</strong> has been delivered and is awaiting your acceptance in the MYTHISOFT customer portal.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 6px 0; color: #666;">Version</td><td style="padding: 6px 0;"><strong>${deliveryVersion || 'v1.0.0'}</strong></td></tr>
      <tr><td style="padding: 6px 0; color: #666;">Delivery date</td><td style="padding: 6px 0;"><strong>${dateLabel}</strong></td></tr>
    </table>
    ${deliveryNotes ? `<p style="background: #fff; padding: 12px; border-radius: 6px; border: 1px solid #eee;"><strong>Delivery notes</strong><br>${deliveryNotes.replace(/\n/g, '<br>')}</p>` : ''}
    <p>You can <strong>accept the project</strong>, <strong>request changes</strong>, or <strong>open a support ticket</strong> from your portal.</p>
    <a href="${reviewLink}" style="display: inline-block; background: #3ABEF9; color: #001B4E; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">
      Review project in portal
    </a>
  `;

  if (!isSmtpConfigured()) {
    console.log('\n========== PROJECT DELIVERY EMAIL (SMTP not configured) ==========');
    console.log(`To: ${to}`);
    console.log(`Project: ${projectName}`);
    console.log(`Review link: ${reviewLink}`);
    console.log('==================================================================\n');
    return { sent: false, devMode: true, reviewLink };
  }

  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: `"MYTHISOFT CRM" <${process.env.SMTP_USER}>`,
    to,
    subject: `Project delivered — ${projectName} (Pending your acceptance)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #001B4E; padding: 20px; text-align: center;">
          <h2 style="color: #fff; margin: 0;">MYTHISOFT CRM</h2>
          <p style="color: #3ABEF9; margin: 6px 0 0; font-size: 12px;">Project delivery notification</p>
        </div>
        <div style="padding: 24px; background: #f9f9f9; color: #333;">
          ${htmlBody}
        </div>
      </div>
    `,
    text: `${projectName} has been delivered. Version: ${deliveryVersion || 'v1.0.0'}. Review: ${reviewLink}`,
  });

  return { sent: true, messageId: info.messageId };
};
