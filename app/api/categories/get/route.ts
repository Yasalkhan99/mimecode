// Server-side categories read route
// Uses MongoDB

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/lib/models/Category';
import { convertToAPIFormat, convertArrayToAPIFormat } from '@/lib/utils/mongodbHelpers';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // Get category by ID
    if (id) {
      const category = await Category.findById(id);
      if (category) {
        return NextResponse.json({
          success: true,
          category: convertToAPIFormat(category),
        });
      }
      return NextResponse.json({
        success: true,
        category: null,
      });
    }

    // Get all categories
    const categories = await Category.find({}).sort({ createdAt: -1 });
    const convertedCategories = convertArrayToAPIFormat(categories);

    return NextResponse.json({
      success: true,
      categories: convertedCategories,
    });
  } catch (error: any) {
    console.error('MongoDB get categories error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get categories',
        categories: [],
        category: null,
      },
      { status: 500 }
    );
  }
}

