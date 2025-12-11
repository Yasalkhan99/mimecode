// Server-side terms and conditions creation route
// Uses MongoDB

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TermsAndConditions from '@/lib/models/TermsAndConditions';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { terms } = body;

    if (!terms || !terms.title || !terms.content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const newTerms = new TermsAndConditions({
      title: terms.title,
      content: terms.content,
      contactEmail: terms.contactEmail || 'legal@mimecode.com',
      contactWebsite: terms.contactWebsite || 'www.mimecode.com',
      lastUpdated: new Date(),
    });
    
    await newTerms.save();

    const termsObj = newTerms.toObject();
    return NextResponse.json({
      success: true,
      id: termsObj._id.toString(),
    });
  } catch (error: any) {
    console.error('MongoDB create terms and conditions error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create terms and conditions',
      },
      { status: 500 }
    );
  }
}

