// Server-side privacy policy deletion route
// Uses MongoDB

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PrivacyPolicy from '@/lib/models/PrivacyPolicy';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Privacy policy ID is required' },
        { status: 400 }
      );
    }

    const policy = await PrivacyPolicy.findByIdAndDelete(id);

    if (!policy) {
      return NextResponse.json(
        { success: false, error: 'Privacy policy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('MongoDB delete privacy policy error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete privacy policy',
      },
      { status: 500 }
    );
  }
}

