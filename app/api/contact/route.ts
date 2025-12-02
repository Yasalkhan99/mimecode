import { NextRequest, NextResponse } from 'next/server';
import { getEmailSettingsServer } from '@/lib/services/emailService.server';
import { getAdminFirestore, default as admin } from '@/lib/firebase-admin';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    // Validation
    if (!name || !name.trim() || !email || !email.trim() || !message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and message are required' },
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

    // Get recipient emails from settings (server-side)
    const emailSettings = await getEmailSettingsServer();
    // Collect all non-empty email addresses (email1 through email6)
    const recipientEmails = [
      emailSettings?.email1,
      emailSettings?.email2,
      emailSettings?.email3,
      emailSettings?.email4,
      emailSettings?.email5,
      emailSettings?.email6,
    ].filter(e => e && e.trim() !== '');
    
    // If no emails configured, use default
    const recipients = recipientEmails.length > 0 ? recipientEmails : ['yasalkhan90@gmail.com'];
    const recipientEmailsString = recipients.join(', ');
    
    console.log('📧 Contact Form Submission:', {
      from: email.trim(),
      to: recipients,
      totalRecipients: recipients.length,
      subject: subject || 'Contact Support Inquiry'
    });
    console.log(`✉️  Sending to ${recipients.length} email(s):`, recipients);

    // Store contact form submission in Firestore using Admin SDK
    // Use environment variable to separate collections between projects
    const contactSubmissionsCollection = process.env.NEXT_PUBLIC_CONTACT_SUBMISSIONS_COLLECTION || 'contactSubmissions-mimecode';
    const firestore = getAdminFirestore();
    await firestore.collection(contactSubmissionsCollection).add({
      name: name.trim(),
      email: email.trim(),
      subject: subject?.trim() || 'Contact Support Inquiry',
      message: message.trim(),
      recipientEmails: recipients,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
    });

    // Send email using SMTP
    let emailSent = false;
    let emailError: any = null;
    
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM || smtpUser || 'MimeCode <noreply@mimecode.com>';
    
    if (smtpHost && smtpUser && smtpPassword) {
      try {
        console.log('📤 Attempting to send contact email via SMTP:', {
          host: smtpHost,
          port: smtpPort,
          to: recipients
        });
        
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPassword,
          },
          connectionTimeout: 10000,
          socketTimeout: 10000,
          greetingTimeout: 10000,
          requireTLS: smtpPort === 587,
          tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
          }
        });
        
        await Promise.race([
          transporter.verify(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection verification timeout')), 10000)
          )
        ]);
        console.log('✅ SMTP connection verified');
        
        const mailOptions = {
          from: smtpFrom,
          to: recipients.join(', '),
          replyTo: email.trim(),
          subject: subject?.trim() || `Contact Support: ${name.trim()}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #ea580c; margin-bottom: 20px;">New Contact Support Inquiry</h2>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">You have received a new contact form submission:</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c;">
                <p style="margin: 0; color: #333;"><strong>Name:</strong> ${name.trim()}</p>
                <p style="margin: 10px 0 0 0; color: #333;"><strong>Email:</strong> ${email.trim()}</p>
                ${subject ? `<p style="margin: 10px 0 0 0; color: #333;"><strong>Subject:</strong> ${subject.trim()}</p>` : ''}
                <p style="margin: 10px 0 0 0; color: #333;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h3 style="color: #333; margin-top: 0; margin-bottom: 10px;">Message:</h3>
                <p style="color: #333; font-size: 16px; line-height: 1.6; white-space: pre-wrap; margin: 0;">${message.trim()}</p>
              </div>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">You can reply directly to this email to respond to ${name.trim()}.</p>
            </div>
          `,
          text: `New Contact Support Inquiry\n\nName: ${name.trim()}\nEmail: ${email.trim()}\n${subject ? `Subject: ${subject.trim()}\n` : ''}Date: ${new Date().toLocaleString()}\n\nMessage:\n${message.trim()}\n\nYou can reply directly to this email to respond.`,
        };
        
        const info = await transporter.sendMail(mailOptions);
        
        emailSent = true;
        console.log('✅ Contact email sent successfully via SMTP:', {
          recipientEmail,
          messageId: info.messageId
        });
      } catch (err: any) {
        emailError = err;
        console.error('❌ Error sending contact email via SMTP:', {
          error: err,
          message: err?.message,
          code: err?.code,
          recipientEmail
        });
        
        // Try port 465 if 587 fails (for Gmail)
        if ((err?.code === 'ETIMEDOUT' || err?.code === 'ESOCKET' || err?.code === 'ECONNREFUSED') 
            && smtpHost === 'smtp.gmail.com' && smtpPort === 587) {
          console.log('🔄 Port 587 failed, trying port 465 with SSL...');
          try {
            const transporterSSL = nodemailer.createTransport({
              host: smtpHost,
              port: 465,
              secure: true,
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
              replyTo: email.trim(),
              subject: subject?.trim() || `Contact Support: ${name.trim()}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #ea580c; margin-bottom: 20px;">New Contact Support Inquiry</h2>
                  <p style="color: #333; font-size: 16px; line-height: 1.6;">You have received a new contact form submission:</p>
                  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c;">
                    <p style="margin: 0; color: #333;"><strong>Name:</strong> ${name.trim()}</p>
                    <p style="margin: 10px 0 0 0; color: #333;"><strong>Email:</strong> ${email.trim()}</p>
                    ${subject ? `<p style="margin: 10px 0 0 0; color: #333;"><strong>Subject:</strong> ${subject.trim()}</p>` : ''}
                    <p style="margin: 10px 0 0 0; color: #333;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                  </div>
                  <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
                    <h3 style="color: #333; margin-top: 0; margin-bottom: 10px;">Message:</h3>
                    <p style="color: #333; font-size: 16px; line-height: 1.6; white-space: pre-wrap; margin: 0;">${message.trim()}</p>
                  </div>
                  <p style="color: #333; font-size: 16px; line-height: 1.6;">You can reply directly to this email to respond to ${name.trim()}.</p>
                </div>
              `,
              text: `New Contact Support Inquiry\n\nName: ${name.trim()}\nEmail: ${email.trim()}\n${subject ? `Subject: ${subject.trim()}\n` : ''}Date: ${new Date().toLocaleString()}\n\nMessage:\n${message.trim()}\n\nYou can reply directly to this email to respond.`,
            };
            
            const info = await transporterSSL.sendMail(mailOptions);
            emailSent = true;
            emailError = null;
            console.log('✅ Contact email sent successfully via SMTP (port 465):', {
              recipientEmail,
              messageId: info.messageId
            });
          } catch (sslErr: any) {
            console.error('❌ Port 465 also failed:', sslErr);
            emailError = {
              ...err,
              retryError: sslErr
            };
          }
        }
      }
    } else {
      console.warn('⚠️ SMTP configuration is incomplete. Email will not be sent.');
      emailError = {
        message: 'SMTP configuration is incomplete.',
        code: 'SMTP_CONFIG_MISSING'
      };
    }

    // Return success even if email fails (form is saved in Firestore)
    return NextResponse.json({
      success: true,
      message: 'Your message has been received. We will get back to you soon!',
      emailSent,
      emailError: emailError ? emailError.message : null,
    });
  } catch (error: any) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process contact form',
      },
      { status: 500 }
    );
  }
}

