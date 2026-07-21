const nodemailer = require("nodemailer");

// Only creates a real transporter if credentials are present.
// This means your app won't crash if you haven't set up email yet -
// it'll just log a warning and skip sending.
let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // must be a 16-character Gmail App Password, not your real password
    },
  });
} else {
  console.warn(
    "[mailer] EMAIL_USER / EMAIL_PASS not set in .env - alert emails will be skipped, not sent."
  );
}

async function sendAlertEmail(reviewText, polarity, aspect) {
  if (!transporter) {
    console.log("[mailer] Skipped alert (email not configured):", reviewText);
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ALERT_TO || process.env.EMAIL_USER,
      subject: `Urgent: highly negative review flagged (${aspect})`,
      text: `A highly negative customer review was just submitted.

Review: "${reviewText}"
Sentiment polarity: ${polarity} (below -0.5 threshold)
Category: ${aspect}

Consider following up with this customer directly.`,
    });
    console.log("[mailer] Alert email sent.");
    return true;
  } catch (err) {
    console.error("[mailer] Failed to send alert:", err.message);
    return false;
  }
}

module.exports = { sendAlertEmail };
