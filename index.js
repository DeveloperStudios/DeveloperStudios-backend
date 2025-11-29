require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");


const app = express();
const PORT = 5000;

// ===============================
// ZOHO SMTP CONFIG (WORKS 100%)
// ===============================
// Use your Zoho Mail + App Password
const transporter = nodemailer.createTransport({
    host: "smtp.zoho.in",
    port: 465,
    secure: true,
    auth: {
        user: process.env.USER,
        pass: process.env.PASS              
    }
});

// Test connection
transporter.verify((err) => {
    if (err) console.log("❌ SMTP Error:", err);
    else console.log("✅ SMTP Connected Successfully");
});

app.use(cors());
app.use(express.json());

// =========================================
// RATE LIMIT — user can submit only 1 time
// every 3 minutes
// =========================================
let lastSubmitTime = 0;
const LIMIT_TIME = 3 * 60 * 1000; // 3 minutes

app.post("/api/contact", async (req, res) => {
    const now = Date.now();
    if (now - lastSubmitTime < LIMIT_TIME) {
        return res.status(429).json({
            success: false,
            message: "Please wait a few minutes before sending again."
        });
    }

    lastSubmitTime = now;

    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: "All fields required" });
    }

    // =========================
    // Email to Company
    // =========================
    const sendToCompany = {
        from: "DeveloperStudios <developerstudios@zohomail.in>",
        replyTo: email,
        to: "service@developerstudios.in",
        subject: `New Contact Submission from ${name}`,
        html: `
            <h2>New Inquiry Received</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p style="border:1px solid #ddd;padding:10px">${message}</p>
        `
    };

    // =========================
    // Confirmation email to user
    // =========================
    const sendToUser = {
        from: "DeveloperStudios <developerstudios@zohomail.in>",
        to: email,
        subject: "We Received Your Inquiry ✔",
        html: `
            <h3>Hello ${name},</h3>
            <p>Thank you for contacting <strong>DeveloperStudios</strong>.</p>
            <p>Our team will reach out within <strong>24 hours</strong>.</p>
            <p><strong>Your Message:</strong></p>
            <blockquote>${message}</blockquote>
            <br/>
            <p>Best regards,<br/>DeveloperStudios Team</p>
        `
    };

    try {
        await transporter.sendMail(sendToCompany);
        await transporter.sendMail(sendToUser);

        console.log("📨 Email sent successfully from:", email);

        res.json({ success: true, message: "Message sent" });
    } catch (err) {
        console.log("❌ Email Error:", err);
        res.status(500).json({ success: false, message: "Email sending failed" });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
