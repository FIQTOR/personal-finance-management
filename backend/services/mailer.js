const nodemailer = require('nodemailer');
const env = require('../config/env');

const transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465,
    auth: {
        user: env.EMAIL_USERNAME,
        pass: env.EMAIL_PASSWORD,
    },
    // NOTE: do NOT disable TLS verification (tls.rejectUnauthorized:false).
    // Gmail SMTP presents a valid certificate, so the default verification is
    // both correct and safer against MITM attacks.
});

exports.SendVerificationEmail = async (to, token) => {
    const url = `${env.FRONTEND_HOST}/verify-email?token=${token}`;

    const mailOptions = {
        from: env.EMAIL_FROM,
        to: to,
        subject: 'Email Verification',
        text: `Please verify your email by clicking the following link: ${url}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4)); border-radius: 16px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.3); position: relative; overflow: hidden;">
            
            <div style="position: relative; z-index: 1;">
                <h2 style="color: transparent; background: linear-gradient(to right, #3b82f6, #8b5cf6); -webkit-background-clip: text; background-clip: text; font-size: 24px; text-align: center; margin-bottom: 20px;">Email Verification</h2>
                
                <p style="color: #4B5563; margin-bottom: 15px;">Hi there!</p>
                <p style="color: #4B5563; margin-bottom: 20px;">Thank you for registering with us. To complete your registration, please verify your email address by clicking the button below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${url}" style="background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Verify Email</a>
                </div>
                
                <p style="color: #4B5563; margin-bottom: 10px;">If the button above doesn't work, you can copy and paste the following link into your browser:</p>
                <p style="background: rgba(255,255,255,0.5); padding: 12px; border-radius: 8px; word-break: break-all; color: #4B5563; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.5);">${url}</p>
                
                <p style="color: #4B5563; margin-bottom: 10px;">Thank you for being a part of our community!</p>
                <p style="color: #4B5563;">Best regards,<br>Your App Team</p>
            </div>
        </div>`,
    };

    await transporter.sendMail(mailOptions);
};

exports.SendResetPasswordEmail = async (to, token) => {
    const url = `${env.FRONTEND_HOST}/reset-password?token=${token}`;

    const mailOptions = {
        from: env.EMAIL_FROM,
        to: to,
        subject: 'Password Reset Request',
        text: `Hello, You recently requested to reset your password. Click here to reset: ${url}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4)); border-radius: 16px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.3); position: relative; overflow: hidden;">
            
            <div style="position: relative; z-index: 1;">
                <h2 style="color: transparent; background: linear-gradient(to right, #3b82f6, #8b5cf6); -webkit-background-clip: text; background-clip: text; font-size: 24px; text-align: center; margin-bottom: 20px;">Password Reset Request</h2>
                
                <p style="color: #4B5563; margin-bottom: 15px;">Hello,</p>
                <p style="color: #4B5563; margin-bottom: 20px;">You recently requested to reset your password for your account. To complete the password reset process, please click on the button below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${url}" style="background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Reset Password</a>
                </div>
                
                <p style="color: #4B5563; margin-bottom: 10px;">If the button above doesn't work, you can copy and paste the following link into your browser:</p>
                <p style="background: rgba(255,255,255,0.5); padding: 12px; border-radius: 8px; word-break: break-all; color: #4B5563; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.5);">${url}</p>
                
                <p style="color: #4B5563; font-size: 0.9em; margin-bottom: 10px;">If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
                <p style="color: #4B5563; font-size: 0.9em; margin-bottom: 20px;">This password reset link will expire in 24 hours.</p>
                
                <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.3); margin: 20px 0;">
                <p style="color: #4B5563; font-size: 0.9em;">Best regards,<br>Your App Team</p>
            </div>
        </div>`,
    };

    await transporter.sendMail(mailOptions);
};

