import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function GET() {
  try {
    // Check if MONGODB_URI is set
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return NextResponse.json(
        {
          success: false,
          error: 'MONGODB_URI not found in environment variables',
          hint: 'Please add MONGODB_URI to .env.local',
        },
        { status: 500 }
      );
    }

    // Mask password in URI for logging
    const maskedUri = uri.replace(/:([^:@]+)@/, ':***@');

    console.log('🔌 Attempting MongoDB connection...');
    console.log('📍 Connection string:', maskedUri);

    await connectDB();

    return NextResponse.json({
      success: true,
      message: 'MongoDB connected successfully!',
      connectionString: maskedUri,
    });
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error);

    let errorMessage = error.message || 'Failed to connect to MongoDB';
    let hint = '';
    let username = '';

    // Extract username from connection string for better error messages
    try {
      const uri = process.env.MONGODB_URI || '';
      const match = uri.match(/mongodb\+srv:\/\/([^:]+):/);
      if (match) {
        username = match[1];
      }
    } catch (e) {
      // Ignore parsing errors
    }

    // Provide helpful hints based on error type
    if (errorMessage.includes('authentication failed') || errorMessage.includes('bad auth')) {
      hint = `Authentication failed for user "${username}". ` +
        `Please verify:\n` +
        `1. The password in your .env.local matches the password set in MongoDB Atlas\n` +
        `2. If your password contains special characters (@, #, $, etc.), they must be URL encoded\n` +
        `3. Go to MongoDB Atlas → Database Access → Edit user "${username}" → Check/Reset password\n` +
        `4. Make sure you're using a password-based user (not Google-authenticated user)`;
    } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
      hint = 'Check your internet connection and MongoDB cluster URL.';
    } else if (errorMessage.includes('IP') || errorMessage.includes('whitelist')) {
      hint = 'Add your IP address to MongoDB Atlas Network Access (0.0.0.0/0 for testing).';
    } else if (errorMessage.includes('timeout')) {
      hint = 'Connection timeout. Check network access settings in MongoDB Atlas.';
    }

    const uriForError = process.env.MONGODB_URI || '';
    const maskedUriForError = uriForError ? uriForError.replace(/:([^:@]+)@/, ':***@') : undefined;

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        hint: hint,
        username: username || undefined,
        connectionString: maskedUriForError,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

