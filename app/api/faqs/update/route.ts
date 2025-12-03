// Server-side FAQ update route
// Uses MongoDB

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FAQ from '@/lib/models/FAQ';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'FAQ ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (updates.question !== undefined) updateData.question = updates.question;
    if (updates.answer !== undefined) updateData.answer = updates.answer;
    if (updates.order !== undefined) updateData.order = updates.order;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    const faq = await FAQ.findByIdAndUpdate(id, updateData, { new: true });

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
    console.error('MongoDB update FAQ error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update FAQ',
      },
      { status: 500 }
    );
  }
}
