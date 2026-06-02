import express from "express";
import transporter from "../services/email.js";

const router = express.Router();

router.post("/send", async (req, res) => {
  const { to, subject, message } = req.body;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: message,
      html: `<p>${message}</p>`,
    });

    res.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
