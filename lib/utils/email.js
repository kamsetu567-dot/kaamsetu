import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendBroadcastEmail(emails, message) {
  const valid = (emails || []).filter(e => typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  const safeMessage = escapeHtml(message);
  const chunks = [];
  for (let i = 0; i < valid.length; i += 50) chunks.push(valid.slice(i, i + 50));

  let sent = 0;
  const failures = [];
  for (const chunk of chunks) {
    try {
      await transporter.sendMail({
        from: `KaamSetu <${process.env.GMAIL_USER}>`,
        bcc: chunk.join(","),
        subject: "KaamSetu — Important Update",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
            <h2 style="color:#0f172a;margin:0 0 16px;">KaamSetu</h2>
            <p style="color:#374151;font-size:15px;line-height:1.6;white-space:pre-line;">${safeMessage}</p>
            <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
            <p style="color:#9ca3af;font-size:12px;margin:0;">This message was sent by the KaamSetu admin team.</p>
          </div>
        `,
      });
      sent += chunk.length;
    } catch (err) {
      failures.push({ size: chunk.length, err: err?.message || "send failed" });
    }
  }
  return { sent, total: valid.length, failures };
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
        <a href="https://www.kaamsetu.live/worker/dashboard" style="display:inline-block;margin-top:16px;background:#0f172a;color:#fff;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;">Login करें / Login Now</a>
        <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
        <p style="color:#9ca3af;font-size:12px;margin:0;">KaamSetu — Connecting workers and clients</p>
      </div>
    `,
  });
}

export async function sendJobAcceptedEmail(email, clientName, workerName, workerMobile, category, subcategory) {
  await transporter.sendMail({
    from: `KaamSetu <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "KaamSetu — आपकी Job Accept हो गई! 🎉",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#0f172a;margin:0 0 4px;">KaamSetu</h2>
        <p style="color:#6b7280;margin:0 0 24px;font-size:14px;">Job Accepted Notification</p>
        <div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:10px;padding:20px;margin-bottom:20px;text-align:center;">
          <p style="font-size:32px;margin:0 0 8px;">✅</p>
          <p style="font-size:18px;font-weight:900;color:#15803d;margin:0;">Job Accept हो गई!</p>
          <p style="color:#166534;font-size:14px;margin:8px 0 0;">${subcategory || category}</p>
        </div>
        <p style="color:#374151;font-size:15px;line-height:1.6;">नमस्ते ${clientName || ""},<br><br>
        एक worker ने आपकी job accept कर ली है। वो जल्द ही आपको call करेगा।<br><br>
        A worker has accepted your job request and will call you shortly.</p>
        <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
          <p style="margin:0 0 6px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Worker Details</p>
          <p style="margin:0 0 4px;font-weight:700;color:#0f172a;font-size:16px;">${workerName || "Worker"}</p>
          <p style="margin:0;color:#374151;font-size:15px;">📞 +91 ${workerMobile}</p>
        </div>
        <a href="tel:${workerMobile}" style="display:inline-block;margin-top:4px;background:#16a34a;color:#fff;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;">📞 Call Worker Now</a>
        <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
        <p style="color:#9ca3af;font-size:12px;margin:0;">KaamSetu — Connecting workers and clients</p>
      </div>
    `,
  });
}

const REASON_LABELS = {
  fake_profile: "Fake Profile",
  fraud: "Fraud / Cheating",
  bad_behaviour: "Bad Behaviour",
  spam: "Spam",
  wrong_work: "Wrong / Poor Work",
};

export async function sendWorkerBlockedEmail(email, name, reason, action) {
  const reasonLabel = REASON_LABELS[reason] || reason || "Policy violation";
  const isDeleted = action === "delete_worker";
  const headlineHi = isDeleted ? "Account हटा दिया गया" : "Account Block कर दिया गया";
  const headlineEn = isDeleted ? "Account Removed" : "Account Blocked";
  const bodyHi = isDeleted
    ? "आपका KaamSetu account हटा दिया गया है। अब आप login नहीं कर पाएंगे।"
    : "आपका KaamSetu account block कर दिया गया है। अब आप jobs accept नहीं कर पाएंगे।";
  const bodyEn = isDeleted
    ? "Your KaamSetu account has been removed. You will no longer be able to log in."
    : "Your KaamSetu account has been blocked. You will no longer be able to accept jobs.";

  await transporter.sendMail({
    from: `KaamSetu <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `KaamSetu — ${headlineEn}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#0f172a;margin:0 0 4px;">KaamSetu</h2>
        <p style="color:#6b7280;margin:0 0 24px;font-size:14px;">Account Action Notice</p>
        <div style="background:#fef2f2;border:2px solid #dc2626;border-radius:10px;padding:20px;margin-bottom:20px;text-align:center;">
          <p style="font-size:32px;margin:0 0 8px;">⚠️</p>
          <p style="font-size:18px;font-weight:900;color:#991b1b;margin:0;">${headlineHi}</p>
          <p style="color:#991b1b;font-size:14px;margin:6px 0 0;">${headlineEn}</p>
        </div>
        <p style="color:#374151;font-size:15px;line-height:1.6;">नमस्ते ${name || ""},<br><br>
        ${bodyHi}<br><br>
        ${bodyEn}</p>
        <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
          <p style="margin:0 0 6px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Reason</p>
          <p style="margin:0;font-weight:700;color:#0f172a;font-size:15px;">${reasonLabel}</p>
        </div>
        <p style="color:#374151;font-size:14px;line-height:1.6;">अगर आपको लगता है कि यह गलती से हुआ है, तो हमसे संपर्क करें।<br>
        If you believe this is a mistake, please contact our support team.</p>
        <a href="mailto:${process.env.GMAIL_USER || "support@kaamsetu.live"}" style="display:inline-block;margin-top:12px;background:#0f172a;color:#fff;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;">Contact Support</a>
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
