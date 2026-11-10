const { VERIFICATION_OTP_TTL_MINUTES } = require('./otp');

function getParentVerificationEmail(name, otp) {
    return {
        subject: 'Verify Your IMOLE Account',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Welcome to IMOLE, ${name}!</h2>

                <p>Thank you for creating a parent account.</p>

                <p>Use the verification code below to verify your email address:</p>

                <h1 style="letter-spacing: 5px;">${otp}</h1>

                <p>This code expires in ${VERIFICATION_OTP_TTL_MINUTES} minutes.</p>

                <p>If you did not create this account, please ignore this email.</p>
            </div>
        `,
        text: `Welcome to IMOLE, ${name}. Your email verification code is ${otp}. It expires in ${VERIFICATION_OTP_TTL_MINUTES} minutes.`
    };
}

module.exports = { getParentVerificationEmail };