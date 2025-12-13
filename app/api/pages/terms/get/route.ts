// Server-side terms and conditions read route
// Uses MongoDB

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TermsAndConditions from '@/lib/models/TermsAndConditions';
import { convertToAPIFormat } from '@/lib/utils/mongodbHelpers';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get language from query parameter, default to 'en'
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || 'en';

    // Try to get language-specific terms first, fallback to default
    let terms = await TermsAndConditions.findOne({ languageCode: lang }).sort({ updatedAt: -1 });
    
    // If no language-specific terms found, get default (English or any)
    if (!terms) {
      terms = await TermsAndConditions.findOne({}).sort({ updatedAt: -1 });
    }

    if (terms) {
      return NextResponse.json({
        success: true,
        terms: convertToAPIFormat(terms),
      });
    }

    return NextResponse.json({
      success: true,
      terms: null,
    });
  } catch (error: any) {
    console.error('MongoDB get terms and conditions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get terms and conditions',
        terms: null,
      },
      { status: 500 }
    );
  }
}

