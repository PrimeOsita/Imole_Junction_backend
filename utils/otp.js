// const otpGenerator = require("otp-generator");

// const VERIFICATION_OTP_TTL_MINUTES = 10;
// // const RESET_PASSWORD_OTP_TTL_MINUTES = 5;
// // const RESEND_OTP_COOLDOWN_SECONDS = 60;

// const generateNumericOtp = () =>
//   otpGenerator.generate(6, {
//     upperCaseAlphabets: true,
//     lowerCaseAlphabets: true,
//     specialChars: false,
//   });

// const getOtpExpiryDate = (minutes = VERIFICATION_OTP_TTL_MINUTES) =>
//   new Date(Date.now() + minutes * 60 * 1000);

// // const getResendCooldownKey = (role, email) =>
// //   `otp_resend_cooldown:${role}:${email.toLowerCase()}`;

// // const getResendCooldownSeconds = async (redisClient, role, email) => {
// //   if (!redisClient?.isOpen) {
// //     return 0;
// //   }

// //   const ttl = await redisClient.ttl(getResendCooldownKey(role, email));
// //   return ttl > 0 ? ttl : 0;
// // };

// const setResendCooldown = async (redisClient, role, email) => {
//   if (!redisClient?.isOpen) {
//     return;
//   }

//   await redisClient.set(getResendCooldownKey(role, email), "1", {
//     EX: RESEND_OTP_COOLDOWN_SECONDS,
//   });
// };

// module.exports = {
//   VERIFICATION_OTP_TTL_MINUTES,
//   RESET_PASSWORD_OTP_TTL_MINUTES,
//   RESEND_OTP_COOLDOWN_SECONDS,
//   generateNumericOtp,
//   getOtpExpiryDate,
//   getResendCooldownSeconds,
//   setResendCooldown,
// };



// const otpGenerator = require("otp-generator");

// // OTP expiry durations
// const VERIFICATION_OTP_TTL_MINUTES = 10;
// const PARENT_LINK_OTP_TTL_MINUTES = 10;
// const RESET_PASSWORD_OTP_TTL_MINUTES = 5;

// // Resend cooldown
// const RESEND_OTP_COOLDOWN_SECONDS = 60;

// // Generate a 6-digit numeric OTP
// const generateNumericOtp = () =>
//     otpGenerator.generate(6, {
//         digits: true,
//         upperCaseAlphabets: false,
//         lowerCaseAlphabets: false,
//         specialChars: false,
//     });

// // Generate email verification OTP
// const generateEmailVerificationOtp = () =>
//     generateNumericOtp();

// // Generate parent-child linking OTP
// const generateParentLinkOtp = () =>
//     generateNumericOtp();

// // Calculate OTP expiry date
// const getOtpExpiryDate = (minutes = VERIFICATION_OTP_TTL_MINUTES) =>
//     new Date(Date.now() + minutes * 60 * 1000);

// // Generate resend cooldown key
// const getResendCooldownKey = (purpose, role, email) =>
//     `otp_resend_cooldown:${purpose}:${role}:${email.toLowerCase()}`;

// // Check remaining resend cooldown
// const getResendCooldownSeconds = async (
//     redisClient,
//     purpose,
//     role,
//     email
// ) => {
//     if (!redisClient?.isOpen) {
//         return 0;
//     }

//     const key = getResendCooldownKey(purpose, role, email);
//     const ttl = await redisClient.ttl(key);

//     return ttl > 0 ? ttl : 0;
// };

// // Set resend cooldown
// const setResendCooldown = async (
//     redisClient,
//     purpose,
//     role,
//     email
// ) => {
//     if (!redisClient?.isOpen) {
//         return;
//     }

//     const key = getResendCooldownKey(purpose, role, email);

//     await redisClient.set(key, "1", {
//         EX: RESEND_OTP_COOLDOWN_SECONDS,
//     });
// };

// module.exports = {
//     VERIFICATION_OTP_TTL_MINUTES,
//     PARENT_LINK_OTP_TTL_MINUTES,
//     RESET_PASSWORD_OTP_TTL_MINUTES,
//     RESEND_OTP_COOLDOWN_SECONDS,

//     generateNumericOtp,
//     generateEmailVerificationOtp,
//     generateParentLinkOtp,
//     getOtpExpiryDate,
//     getResendCooldownKey,
//     getResendCooldownSeconds,
//     setResendCooldown,
// };



const otpGenerator = require("otp-generator");

// OTP expiry durations
const VERIFICATION_OTP_TTL_MINUTES = 10;
const PARENT_LINK_OTP_TTL_MINUTES = 10;
const RESET_PASSWORD_OTP_TTL_MINUTES = 5;

// Resend cooldown
const RESEND_OTP_COOLDOWN_SECONDS = 60;

// Generate 4-digit email verification OTP
const generateEmailVerificationOtp = () =>
    otpGenerator.generate(4, {
        digits: true,
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
    });

// Generate 6-character parent linking code
const generateParentLinkOtp = () =>
    otpGenerator.generate(6, {
        digits: true,
        upperCaseAlphabets: true,
        lowerCaseAlphabets: false,
        specialChars: false,
    });

// Calculate OTP expiry date
const getOtpExpiryDate = (minutes = VERIFICATION_OTP_TTL_MINUTES) =>
    new Date(Date.now() + minutes * 60 * 1000);

module.exports = {
    VERIFICATION_OTP_TTL_MINUTES,
    PARENT_LINK_OTP_TTL_MINUTES,
    RESET_PASSWORD_OTP_TTL_MINUTES,
    RESEND_OTP_COOLDOWN_SECONDS,
    generateEmailVerificationOtp,
    generateParentLinkOtp,
    getOtpExpiryDate,
};
