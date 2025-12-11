// Server-side event deletion route
// Uses MongoDB

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/lib/models/Event';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const event = await Event.findByIdAndDelete(id);

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
    console.error('MongoDB delete event error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete event',
      },
      { status: 500 }
    );
  }
}

