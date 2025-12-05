// Server-side events read route
// Uses MongoDB

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/lib/models/Event';
import { convertToAPIFormat, convertArrayToAPIFormat } from '@/lib/utils/mongodbHelpers';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // Get event by ID
    if (id) {
      const event = await Event.findById(id);
      if (event) {
        return NextResponse.json({
          success: true,
          event: convertToAPIFormat(event),
        });
      }
      return NextResponse.json({
        success: true,
        event: null,
      });
    }

    // Get all events, sorted by start date (newest first)
    const events = await Event.find({}).sort({ startDate: -1 });
    const convertedEvents = convertArrayToAPIFormat(events);

    return NextResponse.json({
      success: true,
      events: convertedEvents,
    });
  } catch (error: any) {
    console.error('MongoDB get events error:', error);
    // Return 200 with empty array instead of 500 to prevent frontend errors
    return NextResponse.json(
      {
        success: true,
        events: [],
        event: null,
      },
      { status: 200 }
    );
  }
}

