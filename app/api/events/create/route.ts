// Server-side event creation route
// Uses MongoDB

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/lib/models/Event';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { event } = body;

    if (!event || !event.title || !event.description || !event.startDate || !event.endDate) {
      return NextResponse.json(
        { success: false, error: 'Event title, description, start date, and end date are required' },
        { status: 400 }
      );
    }

    const newEvent = new Event({
      title: event.title,
      description: event.description,
      bannerUrl: event.bannerUrl || undefined,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      moreDetails: event.moreDetails || undefined,
    });
    
    await newEvent.save();

    const eventObj = newEvent.toObject();
    return NextResponse.json({
      success: true,
      id: eventObj._id.toString(),
    });
  } catch (error: any) {
    console.error('MongoDB create event error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create event',
      },
      { status: 500 }
    );
  }
}

