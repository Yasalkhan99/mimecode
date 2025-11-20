import { NextRequest, NextResponse } from 'next/server';
import { getEmailSettings } from '@/lib/services/emailService';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get recipient email from settings
    const emailSettings = await getEmailSettings();
    const recipientEmail = emailSettings?.newsletterEmail || 'yasalkhan90@gmail.com';
    
    console.log('📧 Email Settings:', {
      emailSettings: emailSettings ? { newsletterEmail: emailSettings.newsletterEmail } : null,
      recipientEmail,
      subscriberEmail: email.trim()
    });

    // Store subscription in Firestore
    await addDoc(collection(db, 'newsletterSubscriptions'), {
      email: email.trim(),
      recipientEmail: recipientEmail,
      subscribedAt: Timestamp.now(),
      status: 'pending',
    });

    // Send email using SMTP (Nodemailer)
    let emailSent = false;
    let emailError: any = null;
    
    // SMTP Configuration from environment variables
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM || smtpUser || 'AvailCoupon <noreply@availcoupon.com>';
    
    if (smtpHost && smtpUser && smtpPassword) {
      try {
        console.log('📤 Attempting to send email via SMTP:', {
          host: smtpHost,
          port: smtpPort,
          user: smtpUser,
          to: recipientEmail,
          from: smtpFrom
        });
        
        // Create transporter with timeout and connection settings
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465, // true for 465 (SSL), false for 587 (TLS)
          auth: {
            user: smtpUser,
            pass: smtpPassword,
          },
          connectionTimeout: 10000, // 10 seconds
          socketTimeout: 10000, // 10 seconds
          greetingTimeout: 10000, // 10 seconds
          // For Gmail, try alternative connection method
          requireTLS: smtpPort === 587,
          tls: {
            rejectUnauthorized: false, // Allow self-signed certificates (if needed)
            ciphers: 'SSLv3'
          }
        });
        
        // Verify connection with timeout
        console.log('🔌 Verifying SMTP connection...');
        await Promise.race([
          transporter.verify(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection verification timeout')), 10000)
          )
        ]);
        console.log('✅ SMTP connection verified');
        
        // Send email
        const mailOptions = {
          from: smtpFrom,
          to: recipientEmail,
          subject: 'New Newsletter Subscription Request',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #ea580c; margin-bottom: 20px;">New Newsletter Subscription</h2>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">A new user has subscribed to your newsletter:</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c;">
                <p style="margin: 0; color: #333;"><strong>Subscriber Email:</strong> ${email.trim()}</p>
                <p style="margin: 10px 0 0 0; color: #333;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">Please add this email to your newsletter list.</p>
            </div>
          `,
          text: `New Newsletter Subscription\n\nSubscriber Email: ${email.trim()}\nDate: ${new Date().toLocaleString()}\n\nPlease add this email to your newsletter list.`,
        };
        
        const info = await transporter.sendMail(mailOptions);
        
        emailSent = true;
        console.log('✅ Email sent successfully via SMTP:', {
          recipientEmail,
          messageId: info.messageId
        });
      } catch (err: any) {
        emailError = err;
        console.error('❌ Error sending email via SMTP:', {
          error: err,
          message: err?.message,
          code: err?.code,
          recipientEmail,
          host: smtpHost,
          port: smtpPort
        });
        
        // Try port 465 if 587 fails (for Gmail)
        if (err?.code === 'ETIMEDOUT' || err?.code === 'ESOCKET' || err?.code === 'ECONNREFUSED') {
          if (smtpHost === 'smtp.gmail.com' && smtpPort === 587) {
            console.log('🔄 Port 587 failed, trying port 465 with SSL...');
            try {
              const transporterSSL = nodemailer.createTransport({
                host: smtpHost,
                port: 465,
                secure: true, // SSL
                auth: {
                  user: smtpUser,
                  pass: smtpPassword,
                },
                connectionTimeout: 15000,
                socketTimeout: 15000,
                tls: {
                  rejectUnauthorized: false
                }
              });
              
              await transporterSSL.verify();
              console.log('✅ SMTP connection verified on port 465');
              
              const mailOptions = {
                from: smtpFrom,
                to: recipientEmail,
                subject: 'New Newsletter Subscription Request',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #ea580c; margin-bottom: 20px;">New Newsletter Subscription</h2>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">A new user has subscribed to your newsletter:</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c;">
                      <p style="margin: 0; color: #333;"><strong>Subscriber Email:</strong> ${email.trim()}</p>
                      <p style="margin: 10px 0 0 0; color: #333;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Please add this email to your newsletter list.</p>
                  </div>
                `,
                text: `New Newsletter Subscription\n\nSubscriber Email: ${email.trim()}\nDate: ${new Date().toLocaleString()}\n\nPlease add this email to your newsletter list.`,
              };
              
              const info = await transporterSSL.sendMail(mailOptions);
              emailSent = true;
              emailError = null;
              console.log('✅ Email sent successfully via SMTP (port 465):', {
                recipientEmail,
                messageId: info.messageId
              });
            } catch (sslErr: any) {
              console.error('❌ Port 465 also failed:', sslErr);
              emailError = {
                ...err,
                retryError: sslErr,
                suggestion: 'Please check your SMTP settings, firewall, or try a different email provider.'
              };
            }
          }
        }
        // Continue - subscription is saved in Firestore even if email fails
      }
    } else {
      console.warn('⚠️ SMTP configuration is incomplete. Email will not be sent.');
      console.warn('⚠️ Required: SMTP_HOST, SMTP_USER, SMTP_PASSWORD');
      emailError = {
        message: 'SMTP configuration is incomplete. Please check your environment variables.',
        code: 'SMTP_CONFIG_MISSING'
      };
    }

    // Return success with email status
    return NextResponse.json({
      success: true,
      message: 'Thank you for subscribing! Your email has been saved successfully.',
      emailSent,
      recipientEmail,
      emailError: emailError ? emailError.message : null,
    });
  } catch (error: any) {
    console.error('Error processing newsletter subscription:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process subscription',
      },
      { status: 500 }
    );
  }
}

