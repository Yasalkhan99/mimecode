// Server-side FAQs read route
// Uses MongoDB

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FAQ from '@/lib/models/FAQ';
import { convertToAPIFormat, convertArrayToAPIFormat } from '@/lib/utils/mongodbHelpers';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // Get FAQ by ID
    if (id) {
      const faq = await FAQ.findById(id);
      if (faq) {
        return NextResponse.json({
          success: true,
          faq: convertToAPIFormat(faq),
        });
      }
      return NextResponse.json({
        success: true,
        faq: null,
      });
    }

    // Build query
    const query: any = {};
    if (activeOnly) {
      query.isActive = true;
    }

    // Get all FAQs, sorted by order (ascending), then by createdAt (descending)
    const faqs = await FAQ.find(query).sort({ order: 1, createdAt: -1 });
    const convertedFAQs = convertArrayToAPIFormat(faqs);

    return NextResponse.json({
      success: true,
      faqs: convertedFAQs,
    });
  } catch (error: any) {
    console.error('MongoDB get FAQs error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get FAQs',
        faqs: [],
        faq: null,
      },
      { status: 500 }
    );
  }
}
