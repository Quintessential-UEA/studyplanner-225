import express from "express";
import db from "../db/index.js";

const router = express.Router();

router.post("/set-email", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    console.log("Setting email:", email);

    db.prepare(
      "UPDATE user_events SET email = ?"
    ).run(email);

    res.json({ success: true });
  } catch (err) {
    console.error("DB error:", err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
