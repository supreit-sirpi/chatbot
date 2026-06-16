import Otp from '../models/Otp';

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = async (email: string): Promise<string> => {
  // Delete any existing OTPs for this email first
  await Otp.deleteMany({ email });

  const code = generateOTP();
  await Otp.create({
    email,
    code
  });

  // Log OTP to terminal console so that the developer/tester can access it immediately
  console.log('\n========================================');
  console.log(`[OTP SERVICE] Verification code for ${email}: ${code}`);
  console.log('========================================\n');

  return code;
};

export const verifyOTP = async (email: string, code: string): Promise<boolean> => {
  const record = await Otp.findOne({ email, code });
  if (record) {
    // Delete OTP after verification to prevent reuse
    await Otp.deleteOne({ _id: record._id });
    return true;
  }
  return false;
};
