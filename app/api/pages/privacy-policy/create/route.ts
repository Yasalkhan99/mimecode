// Server-side privacy policy creation route
// Uses MongoDB

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PrivacyPolicy from '@/lib/models/PrivacyPolicy';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { policy } = body;

    if (!policy || !policy.title || !policy.content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const newPolicy = new PrivacyPolicy({
      title: policy.title,
      content: policy.content,
      contactEmail: policy.contactEmail || 'privacy@mimecode.com',
      contactWebsite: policy.contactWebsite || 'www.mimecode.com',
      languageCode: policy.languageCode || 'en',
      lastUpdated: new Date(),
    });
    
    await newPolicy.save();

    const policyObj = newPolicy.toObject();
    return NextResponse.json({
      success: true,
      id: policyObj._id.toString(),
    });
  } catch (error: any) {
    console.error('MongoDB create privacy policy error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create privacy policy',
      },
      { status: 500 }
    );
  }
}

