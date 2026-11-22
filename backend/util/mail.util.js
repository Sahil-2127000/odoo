const nodemailer = require("nodemailer");
require("dotenv").config();

// Same setup as the StudyNotion project: MAIL_HOST (e.g. smtp.gmail.com), MAIL_USER, MAIL_PASS
// (for Gmail, an "App password"). If they are not set, nothing is sent and the login is printed in the console.
const sendLoginEmail = async ({ to, name, password }) => {
  if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.log(`[mail not configured] login for ${name}: ${to} / ${password}`);
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });

  const portalUrl = `${process.env.FRONTEND_BASE_URL || "http://localhost:5173"}/login`;

  await transporter.sendMail({
    from: `"SolarConnect" <${process.env.MAIL_USER}>`,
    to,
    subject: "Your SolarConnect customer login",
    html: `
      <p>Hi ${name},</p>
      <p>Thank you for your enquiry. You can follow your solar installation, see your warranty,
         download invoices and raise complaints in your customer portal.</p>
      <p><b>Login:</b> <a href="${portalUrl}">${portalUrl}</a><br/>
         <b>Email:</b> ${to}<br/>
         <b>Password:</b> ${password}</p>
      <p>- Team SolarConnect</p>
    `,
  });
  return true;
};

module.exports = { sendLoginEmail };
