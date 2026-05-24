import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOTPEmail(email, otp) {
  await transporter.sendMail({
    from: `KaamSetu <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `${otp} is your KaamSetu OTP`,
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#0f172a;margin:0 0 4px;">KaamSetu</h2>
        <p style="color:#6b7280;margin:0 0 24px;font-size:14px;">Verify your mobile number</p>
        <div style="background:#f8fafc;border:2px solid #0f172a;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:12px;">Your OTP</p>
          <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#0f172a;">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:13px;margin:0;">Valid for <strong>10 minutes</strong>. Do not share this OTP with anyone.</p>
      </div>
    `,
  });
}
