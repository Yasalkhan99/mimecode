// Get Takeads API Key from environment (server-side only)
// This endpoint allows client to check if API key is set in env
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.TAKEADS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { apiKey: null, message: 'TAKEADS_API_KEY not set in environment variables' },
        { status: 200 }
      );
    }

    // Return masked API key (first 8 chars + ...)
    const maskedKey = apiKey.length > 8 
      ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
      : '***';

    return NextResponse.json({
      apiKey: apiKey, // Return full key for use
      masked: maskedKey,
      message: 'API key loaded from environment',
    });
  } catch (error: any) {
    return NextResponse.json(
      { apiKey: null, error: error.message || 'Failed to get API key' },
      { status: 500 }
    );
  }
}


