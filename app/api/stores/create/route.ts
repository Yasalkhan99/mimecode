// Server-side store creation route
// Uses MongoDB

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Store from '@/lib/models/Store';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { store } = body;

    if (!store || !store.name) {
      return NextResponse.json(
        { success: false, error: 'Store name is required' },
        { status: 400 }
      );
    }

    const newStore = new Store(store);
    await newStore.save();

    const storeObj = newStore.toObject();
    return NextResponse.json({
      success: true,
      id: storeObj._id.toString(),
    });
  } catch (error: any) {
    console.error('MongoDB create store error:', error);
    
    // Handle duplicate key error (slug)
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Store with this slug already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create store',
      },
      { status: 500 }
    );
  }
}

