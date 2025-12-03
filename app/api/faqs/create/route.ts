// Server-side FAQ creation route
// Uses MongoDB

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FAQ from '@/lib/models/FAQ';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { faq } = body;

    if (!faq || !faq.question || !faq.answer) {
      return NextResponse.json(
        { success: false, error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    const newFAQ = new FAQ({
      question: faq.question,
      answer: faq.answer,
      order: faq.order || 0,
      isActive: faq.isActive !== false,
    });
    
    await newFAQ.save();

    const faqObj = newFAQ.toObject();
    return NextResponse.json({
      success: true,
      id: faqObj._id.toString(),
    });
  } catch (error: any) {
    console.error('MongoDB create FAQ error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create FAQ',
      },
      { status: 500 }
    );
  }
}
