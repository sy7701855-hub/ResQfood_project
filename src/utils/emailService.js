const nodemailer = require('nodemailer');

/**
 * Creates and returns a Nodemailer transporter using Gmail SMTP.
 * Returns null if credentials are not configured.
 */
function createTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      '[EmailService] WARNING: EMAIL_USER or EMAIL_PASS is not set. Email notifications are disabled.'
    );
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Sends an OTP claim notification email to the donor.
 *
 * @param {string} donorEmail    - Donor's email address
 * @param {string} donorName     - Donor's display name
 * @param {string} claimerName   - Name of the person claiming the food
 * @param {string} foodTitle     - Title/description of the food listing
 * @param {string} otpCode       - One-time password for verification
 */
async function sendClaimNotification(donorEmail, donorName, claimerName, foodTitle, otpCode) {
  const transporter = createTransporter();
  if (!transporter) return;

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Food Claim Notification – ResQFood</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#2e7d32;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;letter-spacing:1px;">🍱 ResQFood</h1>
              <p style="margin:8px 0 0;color:#c8e6c9;font-size:14px;">Reducing food waste, one meal at a time</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#2e7d32;font-size:20px;">Someone wants your donation!</h2>
              <p style="margin:0 0 12px;color:#424242;font-size:15px;line-height:1.6;">
                Hi <strong>${donorName}</strong>,
              </p>
              <p style="margin:0 0 20px;color:#424242;font-size:15px;line-height:1.6;">
                Great news! <strong>${claimerName}</strong> would like to claim your food donation:
              </p>

              <!-- Food card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#e8f5e9;border-left:4px solid #2e7d32;border-radius:4px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#1b5e20;font-size:16px;font-weight:bold;">🥘 ${foodTitle}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;color:#424242;font-size:15px;line-height:1.6;">
                To confirm the handover, share the following <strong>One-Time Password (OTP)</strong> with
                <strong>${claimerName}</strong> when they arrive to collect the food:
              </p>

              <!-- OTP box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background-color:#2e7d32;color:#ffffff;font-size:36px;font-weight:bold;letter-spacing:12px;padding:20px 40px;border-radius:8px;">
                      ${otpCode}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#757575;font-size:13px;line-height:1.6;">
                ⚠️ Do <strong>not</strong> share this OTP with anyone other than the claimer in person.
                The OTP is used to verify the successful handover of your donation.
              </p>
              <p style="margin:0 0 0;color:#757575;font-size:13px;line-height:1.6;">
                If you did not expect this claim, please log in to ResQFood to review or cancel it.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f1f8e9;padding:24px 40px;text-align:center;border-top:1px solid #dcedc8;">
              <p style="margin:0;color:#9e9e9e;font-size:12px;">
                © ${new Date().getFullYear()} ResQFood. All rights reserved.<br/>
                This is an automated message — please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const mailOptions = {
    from: `"ResQFood" <${process.env.EMAIL_USER}>`,
    to: donorEmail,
    subject: `🍱 Your donation "${foodTitle}" has been claimed – OTP inside`,
    html: htmlBody,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Claim notification sent to donor (${donorEmail}): ${info.messageId}`);
  } catch (error) {
    console.error(`[EmailService] Failed to send claim notification to ${donorEmail}:`, error.message);
  }
}

/**
 * Sends a verification-complete confirmation email to the claimer.
 *
 * @param {string} claimerEmail  - Claimer's email address
 * @param {string} claimerName   - Claimer's display name
 * @param {string} foodTitle     - Title/description of the food listing
 */
async function sendVerificationComplete(claimerEmail, claimerName, foodTitle) {
  const transporter = createTransporter();
  if (!transporter) return;

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Claim Verified – ResQFood</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#2e7d32;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;letter-spacing:1px;">🍱 ResQFood</h1>
              <p style="margin:8px 0 0;color:#c8e6c9;font-size:14px;">Reducing food waste, one meal at a time</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <!-- Success badge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background-color:#e8f5e9;border:2px solid #2e7d32;border-radius:50%;width:72px;height:72px;line-height:72px;font-size:36px;text-align:center;">
                      ✅
                    </div>
                  </td>
                </tr>
              </table>

              <h2 style="margin:0 0 16px;color:#2e7d32;font-size:20px;text-align:center;">Claim Successfully Verified!</h2>
              <p style="margin:0 0 12px;color:#424242;font-size:15px;line-height:1.6;">
                Hi <strong>${claimerName}</strong>,
              </p>
              <p style="margin:0 0 20px;color:#424242;font-size:15px;line-height:1.6;">
                Your food claim has been <strong>verified and completed</strong>. You have successfully received:
              </p>

              <!-- Food card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#e8f5e9;border-left:4px solid #2e7d32;border-radius:4px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#1b5e20;font-size:16px;font-weight:bold;">🥘 ${foodTitle}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;color:#424242;font-size:15px;line-height:1.6;">
                Thank you for using ResQFood to rescue surplus food and help reduce waste in your community.
                Every meal saved makes a difference! 🌱
              </p>

              <p style="margin:0;color:#757575;font-size:13px;line-height:1.6;">
                If you have any issues or concerns about this donation, please contact us through the ResQFood platform.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f1f8e9;padding:24px 40px;text-align:center;border-top:1px solid #dcedc8;">
              <p style="margin:0;color:#9e9e9e;font-size:12px;">
                © ${new Date().getFullYear()} ResQFood. All rights reserved.<br/>
                This is an automated message — please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const mailOptions = {
    from: `"ResQFood" <${process.env.EMAIL_USER}>`,
    to: claimerEmail,
    subject: `✅ You've successfully claimed "${foodTitle}" – ResQFood`,
    html: htmlBody,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Verification complete email sent to claimer (${claimerEmail}): ${info.messageId}`);
  } catch (error) {
    console.error(`[EmailService] Failed to send verification email to ${claimerEmail}:`, error.message);
  }
}

module.exports = {
  sendClaimNotification,
  sendVerificationComplete,
};
