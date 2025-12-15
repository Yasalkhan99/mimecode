// Server-side terms and conditions update route
// Uses MongoDB

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TermsAndConditions from '@/lib/models/TermsAndConditions';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Terms and conditions ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.contactEmail !== undefined) updateData.contactEmail = updates.contactEmail;
    if (updates.contactWebsite !== undefined) updateData.contactWebsite = updates.contactWebsite;
    if (updates.languageCode !== undefined) updateData.languageCode = updates.languageCode;
    if (updates.lastUpdated !== undefined) {
      updateData.lastUpdated = updates.lastUpdated instanceof Date 
        ? updates.lastUpdated 
        : new Date(updates.lastUpdated);
    } else {
      updateData.lastUpdated = new Date();
    }

    const terms = await TermsAndConditions.findByIdAndUpdate(id, updateData, { new: true });

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
    console.error('MongoDB update terms and conditions error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update terms and conditions',
      },
      { status: 500 }
    );
  }
}

