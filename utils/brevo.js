require('dotenv').config();
const { BrevoClient } = require('@getbrevo/brevo');


exports.sendSingleEmail = async (options) => {
  try {
    const apikey = process.env.BREVO_API_KEY;
    if (!apikey) {
      throw new Error("BREVO_API_KEY is not configured");
    }
    if (!process.env.BREVO_SENDER_NAME || !process.env.BREVO_SENDER_EMAIL) {
      throw new Error("BREVO sender name and email are not configured");
    }

    const apiInstance = new BrevoClient({ apiKey: apikey });
    const email = {
      sender: { name: process.env.BREVO_SENDER_NAME, email: process.env.BREVO_SENDER_EMAIL },
      subject: options.subject,
      to: options.name
        ? [{ email: options.email, name: options.name }]
        : [{ email: options.email }],
      htmlContent: options.html,
    };
    if (options.text) {
      email.textContent = options.text;
    }
    if (process.env.BREVO_REPLY_TO_EMAIL) {
      email.replyTo = {
        email: process.env.BREVO_REPLY_TO_EMAIL,
        name: process.env.BREVO_REPLY_TO_NAME || process.env.BREVO_SENDER_NAME,
      };
    }
    await apiInstance.transactionalEmails.sendTransacEmail(email);
    console.log("Email sent to:", options.email);
  } catch (error) {
    const status = error?.response?.status;
    const brevoMessage = error?.response?.data?.message || error.message;
    const emailError = new Error(`Email not sent to ${options.email}: ${brevoMessage}`);

    emailError.code = 'BREVO_EMAIL_FAILED';
    emailError.status = status;
    emailError.brevoMessage = brevoMessage;

    console.error('Brevo email failed:', {
      recipient: options.email,
      status,
      message: brevoMessage
    });

    throw emailError;
  }
};