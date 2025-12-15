// Server-side privacy policy update route
// Uses MongoDB

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PrivacyPolicy from '@/lib/models/PrivacyPolicy';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Privacy policy ID is required' },
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

    const policy = await PrivacyPolicy.findByIdAndUpdate(id, updateData, { new: true });

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
    console.error('MongoDB update privacy policy error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update privacy policy',
      },
      { status: 500 }
    );
  }
}

