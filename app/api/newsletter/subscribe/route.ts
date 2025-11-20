import { NextRequest, NextResponse } from 'next/server';
import { getEmailSettings } from '@/lib/services/emailService';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { Resend } from 'resend';

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

    // Send email using Resend (if API key is configured)
    let emailSent = false;
    let emailError: any = null;
    
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        // Use your verified domain or default Resend domain
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'AvailCoupon <onboarding@resend.dev>';
        
        console.log('📤 Attempting to send email via Resend:', {
          from: fromEmail,
          to: recipientEmail,
          hasApiKey: !!resendApiKey
        });
        
        const emailResult = await resend.emails.send({
          from: fromEmail,
          to: recipientEmail,
          subject: 'New Newsletter Subscription Request',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #ea580c; margin-bottom: 20px;">New Newsletter Subscription</h2>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">A new user has subscribed to your newsletter:</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c;">
                <p style="margin: 0; color: #333;"><strong>Email:</strong> ${email.trim()}</p>
                <p style="margin: 10px 0 0 0; color: #333;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">Please add this email to your newsletter list.</p>
            </div>
          `,
          text: `New Newsletter Subscription\n\nEmail: ${email.trim()}\nDate: ${new Date().toLocaleString()}\n\nPlease add this email to your newsletter list.`,
        });
        
        emailSent = true;
        console.log('✅ Email sent successfully via Resend:', {
          recipientEmail,
          result: emailResult
        });
      } catch (err: any) {
        emailError = err;
        console.error('❌ Error sending email via Resend:', {
          error: err,
          message: err?.message,
          recipientEmail,
          hasApiKey: !!resendApiKey
        });
        // Continue - subscription is saved in Firestore even if email fails
      }
    } else {
      console.warn('⚠️ RESEND_API_KEY is not set. Email will not be sent via Resend.');
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

