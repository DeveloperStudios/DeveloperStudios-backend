// backend/index.js
require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
    host: "smtp.zoho.in",
    port: 465,
    secure: true,
    auth: {
        user: process.env.USER,
        pass: process.env.PASS              
    }
});

app.post("/api/contact", async (req, res) => {
    const { name, email, phone, projectType, message } = req.body;

    if (!name || !email || !phone || !projectType || !message) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Email to Admin
    const adminMail = {
        from: `"DeveloperStudios Leads" <hello@developerstudios.in>`,
        to: "service@developerstudios.in",
        subject: `🔥 New Lead: ${projectType} - ${name}`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
                <h2 style="color: #333;">New Project Inquiry Received</h2>
                <hr/>
                <p><strong>Client Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Service Requested:</strong> ${projectType}</p>
                <p><strong>Message:</strong></p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">${message}</div>
            </div>
        `
    };

    // Auto-reply to User
    const userMail = {
        from: `"DeveloperStudios" <hello@developerstudios.in>`,
        to: email,
        subject: "We've received your project brief! ✔",
        html: `
            <div style="font-family: sans-serif; max-width: 600px; line-height: 1.6;">
                <h3>Hello ${name},</h3>
                <p>Thank you for reaching out to <strong>DeveloperStudios</strong>.</p>
                <p>Our team in <strong>Riyadh</strong> has received your inquiry regarding <strong>${projectType}</strong>. One of our experts is reviewing your brief right now.</p>
                <p>We typically respond within <strong>2 hours</strong> during business hours.</p>
                <br/>
                <p style="color: #666; font-size: 14px;">Regards,<br/>The DeveloperStudios Team</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(adminMail);
        await transporter.sendMail(userMail);
        res.json({ success: true, message: "Inquiry sent successfully" });
    } catch (err) {
        console.error("❌ Email Error:", err);
        res.status(500).json({ success: false, message: "Server error. Try again later." });
    }
});

app.listen(PORT, () => console.log(`🚀 Expert Backend running on port ${PORT}`));