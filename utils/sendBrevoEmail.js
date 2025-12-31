const axios = require("axios");

const sendBrevoEmail = async ({ to, subject, html }) => {
  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          email: process.env.BREVO_SENDER_EMAIL,
          name: process.env.BREVO_SENDER_NAME,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("❌ Brevo HTTP error:", err.response?.data || err.message);
    throw new Error("Email send failed");
  }
};

module.exports = sendBrevoEmail;
console.log("👉 BREVO_API_KEY:", process.env.BREVO_API_KEY ? "OK" : "MISSING");
console.log("👉 SENDER_EMAIL:", process.env.BREVO_SENDER_EMAIL);
console.log("👉 SENDER_NAME:", process.env.BREVO_SENDER_NAME);
