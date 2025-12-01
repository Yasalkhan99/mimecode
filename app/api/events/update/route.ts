// Server-side event update route
// Uses MongoDB

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/lib/models/Event';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.bannerUrl !== undefined) updateData.bannerUrl = updates.bannerUrl;
    if (updates.startDate !== undefined) updateData.startDate = new Date(updates.startDate);
    if (updates.endDate !== undefined) updateData.endDate = new Date(updates.endDate);
    if (updates.moreDetails !== undefined) updateData.moreDetails = updates.moreDetails;

    const event = await Event.findByIdAndUpdate(id, updateData, { new: true });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('MongoDB update event error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update event',
      },
      { status: 500 }
    );
  }
}

