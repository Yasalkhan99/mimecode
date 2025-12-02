// Server-side privacy policy read route
// Uses MongoDB

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PrivacyPolicy from '@/lib/models/PrivacyPolicy';
import { convertToAPIFormat } from '@/lib/utils/mongodbHelpers';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get the privacy policy (there should only be one, but we'll get the latest)
    const policy = await PrivacyPolicy.findOne({}).sort({ updatedAt: -1 });

    if (policy) {
      return NextResponse.json({
        success: true,
        privacyPolicy: convertToAPIFormat(policy),
      });
    }

    return NextResponse.json({
      success: true,
      privacyPolicy: null,
    });
  } catch (error: any) {
    console.error('MongoDB get privacy policy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get privacy policy',
        privacyPolicy: null,
      },
      { status: 500 }
    );
  }
}

