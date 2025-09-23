import { validationResult } from "express-validator";
import nodemailer from "nodemailer";

// Public contact form handler
export const publicContact = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Invalid input", errors: errors.array() });
    }
    
    const { name, email, subject, message } = req.body;

    // Configure transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: process.env.ADMIN_EMAIL,
      replyTo: email || process.env.ADMIN_EMAIL,
      subject: `[CraftConnect Public Contact] ${subject}`,
      html: `
        <h2>New Public Contact Message</h2>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><small>Sent from CraftConnect public contact form</small></p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Your message was sent to the admin." });
  } catch (err) {
    console.error("❌ Public contact error:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
};
