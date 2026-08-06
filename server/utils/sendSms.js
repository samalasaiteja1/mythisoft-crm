import twilio from 'twilio';

const isTwilioConfigured = () =>
  Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER &&
    !process.env.TWILIO_ACCOUNT_SID.includes('your_')
  );

const formatPhone = (phone) => {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
  if (cleaned.length === 10) return `+91${cleaned}`;
  return `+${cleaned}`;
};

export const sendCrmSms = async ({ to, body }) => {
  if (!isTwilioConfigured()) {
    throw new Error(
      'SMS not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in server/.env'
    );
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const formattedTo = formatPhone(to);

  const message = await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: formattedTo,
  });

  return {
    sent: true,
    sid: message.sid,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: formattedTo,
    status: message.status,
  };
};

export const isSmsEnabled = () => isTwilioConfigured();
