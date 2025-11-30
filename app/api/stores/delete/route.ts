// Server-side store delete route
// Uses MongoDB

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Store from '@/lib/models/Store';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing store ID' },
        { status: 400 }
      );
    }

    const store = await Store.findByIdAndDelete(id);

    if (!store) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('MongoDB delete store error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete store',
      },
      { status: 500 }
    );
  }
}

