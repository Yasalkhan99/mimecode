// Server-side store creation route
// Uses Supabase

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    console.log('=== Create Store API Called ===');
    
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not initialized');
      throw new Error('Supabase admin client not initialized');
    }

    const body = await req.json();
    console.log('📦 Request body received');
    
    const { store } = body;

    if (!store || !store.name) {
      console.error('❌ Missing store name');
      return NextResponse.json(
        { success: false, error: 'Store name is required' },
        { status: 400 }
      );
    }

    console.log('✅ Creating store:', store.name);

    // Generate a sequential numeric Store Id starting from 1
    // Ignore timestamp-based IDs (those > 100000) and only consider reasonable sequential IDs
    const { data: existingStores, error: fetchError } = await supabaseAdmin
      .from('stores')
      .select('"Store Id"');

    let storeId: string;
    
    if (fetchError) {
      console.error('❌ Error fetching existing stores:', fetchError);
      // Start from 1 if fetch fails
      storeId = '1';
    } else {
      // Find the maximum numeric ID, but only consider IDs that are reasonable (not timestamps)
      // Timestamp-based IDs are typically > 100000, so we ignore those
      const MAX_REASONABLE_ID = 100000;
      let maxId = 0;
      
      if (existingStores && existingStores.length > 0) {
        for (const storeRow of existingStores) {
          const id = storeRow['Store Id'];
          if (id) {
            // Try to parse as number
            const numericId = parseInt(String(id), 10);
            // Only consider IDs that are reasonable (not timestamp-based)
            if (!isNaN(numericId) && numericId <= MAX_REASONABLE_ID && numericId > maxId) {
              maxId = numericId;
            }
          }
        }
      }
      // Generate next sequential ID starting from 1
      storeId = String(maxId + 1);
    }

    // Convert camelCase to snake_case for Supabase
    const supabaseStore: any = {
      'Store Id': storeId,
      'Store Name': store.name,
      'Slug': store.slug,
      'description': store.description || '',
      'Created Date': new Date().toISOString(),
      'Modify Date': new Date().toISOString(),
    };

    // Add optional fields only if they have values
    if (store.logoUrl) supabaseStore['Store Logo'] = store.logoUrl;
    if (store.voucherText) supabaseStore['voucher_text'] = store.voucherText;
    if (store.networkId) supabaseStore['Network Id'] = store.networkId;
    if (store.categoryId) supabaseStore['Parent Category Id'] = store.categoryId;
    if (store.merchantId) supabaseStore['Merchant Id'] = store.merchantId;
    if (store.websiteUrl) {
      supabaseStore['website_url'] = store.websiteUrl;
      supabaseStore['Tracking Url'] = store.websiteUrl;
      supabaseStore['Store Display Url'] = store.websiteUrl;
    }
    if (store.layoutPosition !== null && store.layoutPosition !== undefined) {
      supabaseStore['layout_position'] = store.layoutPosition;
    }

    // Add more optional fields
    if (store.subStoreName) supabaseStore['sub_store_name'] = store.subStoreName;
    if (store.aboutText) supabaseStore['about_text'] = store.aboutText;
    if (store.features) supabaseStore['features'] = store.features;
    if (store.shippingInfo) supabaseStore['shipping_info'] = store.shippingInfo;
    if (store.returnPolicy) supabaseStore['return_policy'] = store.returnPolicy;
    if (store.contactInfo) supabaseStore['contact_info'] = store.contactInfo;
    if (store.trustScore !== null && store.trustScore !== undefined) {
      supabaseStore['trust_score'] = store.trustScore;
    }
    if (store.establishedYear) supabaseStore['established_year'] = store.establishedYear;
    if (store.headquarters) supabaseStore['headquarters'] = store.headquarters;
    if (store.whyTrustUs) supabaseStore['why_trust_us'] = store.whyTrustUs;
    if (store.moreInformation) supabaseStore['more_information'] = store.moreInformation;
    if (store.rating !== null && store.rating !== undefined) {
      supabaseStore['rating'] = store.rating;
    }
    if (store.reviewCount !== null && store.reviewCount !== undefined) {
      supabaseStore['review_count'] = store.reviewCount;
    }
    if (store.seoTitle) supabaseStore['seo_title'] = store.seoTitle;
    if (store.seoDescription) supabaseStore['seo_description'] = store.seoDescription;

    console.log('💾 Inserting into Supabase...');
    console.log('📝 Store data:', JSON.stringify(supabaseStore, null, 2));

    const { data, error } = await supabaseAdmin
      .from('stores')
      .insert([supabaseStore])
      .select('"Store Id", "Store Name"')
      .single();

    if (error) {
      console.error('❌ Supabase create store error:', error);
      
      // Check for duplicate slug error
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { success: false, error: 'Store with this slug already exists' },
          { status: 400 }
        );
      }
      
      throw error;
    }

    console.log('Store created successfully with ID:', storeId);

    return NextResponse.json({
      success: true,
      id: storeId,
    });
  } catch (error: any) {
    console.error('Create store error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create store',
      },
      { status: 500 }
    );
  }
}
