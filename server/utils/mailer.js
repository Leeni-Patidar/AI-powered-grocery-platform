export const buildClientUrl = (path) => {
  const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
  return `${baseUrl}${path}`;
};

export const sendAuthLink = async ({ to, subject, url }) => {
  console.log(`[auth email] To: ${to}`);
  console.log(`[auth email] ${subject}: ${url}`);
};

export const sendOtpEmail = async ({ to, subject, otp }) => {
  console.log(`[auth email] To: ${to}`);
  console.log(`[auth email] ${subject}: OTP ${otp}`);
};
