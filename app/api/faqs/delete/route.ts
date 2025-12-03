// Server-side FAQ deletion route
// Uses MongoDB

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FAQ from '@/lib/models/FAQ';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'FAQ ID is required' },
        { status: 400 }
      );
    }

    const faq = await FAQ.findByIdAndDelete(id);

    if (!faq) {
      return NextResponse.json(
        { success: false, error: 'FAQ not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('MongoDB delete FAQ error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete FAQ',
      },
      { status: 500 }
    );
  }
}
