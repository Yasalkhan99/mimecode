// Server-side store creation route
// Uses Supabase

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const body = await req.json();
    const { store } = body;

    if (!store || !store.name) {
      return NextResponse.json(
        { success: false, error: 'Store name is required' },
        { status: 400 }
      );
    }

    console.log('Creating store:', store.name);

    // Generate a unique Store Id (use timestamp + random)
    const storeId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Convert camelCase to snake_case for Supabase
    const supabaseStore: any = {
      'Store Id': storeId,
      'Store Name': store.name,
      'Slug': store.slug,
      'description': store.description,
      'Store Logo': store.logoUrl,
      'voucher_text': store.voucherText,
      'Network Id': store.networkId,
      'Parent Category Id': store.categoryId,
      'website_url': store.websiteUrl,
      'Tracking Url': store.websiteUrl,
      'Store Display Url': store.websiteUrl,
      'layout_position': store.layoutPosition,
      'created_at': new Date().toISOString(),
      'updated_at': new Date().toISOString(),
    };

    // Add optional fields
    if (store.subStoreName) supabaseStore['sub_store_name'] = store.subStoreName;
    if (store.aboutText) supabaseStore['about_text'] = store.aboutText;
    if (store.features) supabaseStore['features'] = store.features;
    if (store.shippingInfo) supabaseStore['shipping_info'] = store.shippingInfo;
    if (store.returnPolicy) supabaseStore['return_policy'] = store.returnPolicy;
    if (store.contactInfo) supabaseStore['contact_info'] = store.contactInfo;
    if (store.trustScore) supabaseStore['trust_score'] = store.trustScore;
    if (store.establishedYear) supabaseStore['established_year'] = store.establishedYear;
    if (store.headquarters) supabaseStore['headquarters'] = store.headquarters;
    if (store.whyTrustUs) supabaseStore['why_trust_us'] = store.whyTrustUs;
    if (store.moreInformation) supabaseStore['more_information'] = store.moreInformation;
    if (store.rating) supabaseStore['rating'] = store.rating;
    if (store.reviewCount) supabaseStore['review_count'] = store.reviewCount;
    if (store.seoTitle) supabaseStore['seo_title'] = store.seoTitle;
    if (store.seoDescription) supabaseStore['seo_description'] = store.seoDescription;

    const { data, error } = await supabaseAdmin
      .from('stores')
      .insert([supabaseStore])
      .select()
      .single();

    if (error) {
      console.error('Supabase create store error:', error);
      
      // Check for duplicate slug error
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { success: false, error: 'Store with this slug already exists' },
          { status: 400 }
        );
      }
      
      throw error;
    }

    console.log('Store created successfully');

    // Get the Store Id from the created record
    const storeId = data['Store Id'] || data.id;

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
