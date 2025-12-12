// Test Takeads API Key - Verify if the key is valid
import { NextRequest, NextResponse } from 'next/server';
import { fetchTakeadsMerchants } from '@/lib/services/takeadsService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let apiKey = body.apiKey || process.env.TAKEADS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'API key is required',
          message: 'Please provide API key in request body or set TAKEADS_API_KEY in environment variables'
        },
        { status: 400 }
      );
    }

    // Remove "Bearer " prefix if present
    apiKey = apiKey.replace(/^Bearer\s+/i, '').trim();

    // Debug info
    const apiKeyPreview = apiKey.length > 12 
      ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
      : '***';
    
    console.log(`🧪 Testing API key: ${apiKeyPreview} (length: ${apiKey.length})`);

    // Try to fetch just 1 merchant to test the API key
    try {
      const response = await fetchTakeadsMerchants(apiKey, {
        limit: 1,
        isActive: true,
      });

      return NextResponse.json({
        success: true,
        message: 'API key is valid! ✅',
        testResult: {
          apiKeyPreview,
          apiKeyLength: apiKey.length,
          merchantsFound: response.data.length,
          hasMorePages: response.meta.next !== null,
        },
      });
    } catch (error: any) {
      // Parse the error to give better feedback
      const errorMessage = error.message || String(error);
      
      // Check if it's a 401 error
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        return NextResponse.json({
          success: false,
          error: 'API key is invalid or unauthorized',
          message: 'The API key you provided is not valid. Please check:',
          troubleshooting: [
            '1. Verify the API key is correct in your Takeads dashboard',
            '2. Make sure you copied the full API key (no spaces or extra characters)',
            '3. Check if the API key has expired or been revoked',
            '4. Ensure you have proper permissions for the Monetize API',
            '5. The API key should NOT include "Bearer " prefix - just the key itself',
          ],
          errorDetails: errorMessage,
        }, { status: 401 });
      }

      // Other errors
      return NextResponse.json({
        success: false,
        error: 'API test failed',
        message: errorMessage,
        errorDetails: errorMessage,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ Test API key error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to test API key',
      },
      { status: 500 }
    );
  }
}


