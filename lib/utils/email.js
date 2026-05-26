import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendBroadcastEmail(emails, message) {
  const chunks = [];
  for (let i = 0; i < emails.length; i += 50) chunks.push(emails.slice(i, i + 50));
  for (const chunk of chunks) {
    await transporter.sendMail({
      from: `KaamSetu <${process.env.GMAIL_USER}>`,
      bcc: chunk.join(","),
      subject: "KaamSetu — Important Update",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#0f172a;margin:0 0 16px;">KaamSetu</h2>
          <p style="color:#374151;font-size:15px;line-height:1.6;white-space:pre-line;">${message}</p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
          <p style="color:#9ca3af;font-size:12px;margin:0;">This message was sent by the KaamSetu admin team.</p>
        </div>
      `,
    });
  }
}

export async function sendApprovalEmail(email, name) {
  await transporter.sendMail({
    from: `KaamSetu <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "KaamSetu — Your account has been approved!",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#0f172a;margin:0 0 4px;">KaamSetu</h2>
        <p style="color:#6b7280;margin:0 0 24px;font-size:14px;">Worker Account Approved</p>
        <div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:10px;padding:20px;margin-bottom:20px;text-align:center;">
          <p style="font-size:32px;margin:0 0 8px;">✅</p>
          <p style="font-size:18px;font-weight:900;color:#15803d;margin:0;">Account Approved!</p>
        </div>
        <p style="color:#374151;font-size:15px;line-height:1.6;">नमस्ते ${name || ""},<br><br>
        आपका KaamSetu worker account approve हो गया है। अब आप login करके jobs accept कर सकते हैं।<br><br>
        Your KaamSetu worker account has been approved. You can now log in and start accepting jobs.</p>
        <a href="https://kaamsetu.in/auth/login" style="display:inline-block;margin-top:16px;background:#0f172a;color:#fff;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;">Login करें / Login Now</a>
        <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
        <p style="color:#9ca3af;font-size:12px;margin:0;">KaamSetu — Connecting workers and clients</p>
      </div>
    `,
  });
}

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
