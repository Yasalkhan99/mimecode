// Server-side terms and conditions deletion route
// Uses MongoDB

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TermsAndConditions from '@/lib/models/TermsAndConditions';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Terms and conditions ID is required' },
        { status: 400 }
      );
    }

    const terms = await TermsAndConditions.findByIdAndDelete(id);

    if (!terms) {
      return NextResponse.json(
        { success: false, error: 'Terms and conditions not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('MongoDB delete terms and conditions error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete terms and conditions',
      },
      { status: 500 }
    );
  }
}

