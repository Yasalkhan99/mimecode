// Server-side store update route
// Uses Supabase

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const body = await req.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing store ID' },
        { status: 400 }
      );
    }

    console.log('Updating store:', id, 'with updates:', Object.keys(updates));

    // Convert camelCase field names to Supabase column names
    const supabaseUpdates: any = {
      'Modify Date': new Date().toISOString(),
    };

    // Map common fields
    if (updates.name !== undefined) supabaseUpdates['Store Name'] = updates.name;
    if (updates.slug !== undefined) supabaseUpdates['Slug'] = updates.slug;
    if (updates.description !== undefined) supabaseUpdates['description'] = updates.description;
    if (updates.logoUrl !== undefined) supabaseUpdates['Store Logo'] = updates.logoUrl;
    if (updates.websiteUrl !== undefined) {
      supabaseUpdates['Tracking Url'] = updates.websiteUrl;
      supabaseUpdates['Store Display Url'] = updates.websiteUrl;
      supabaseUpdates['website_url'] = updates.websiteUrl;
    }
    if (updates.networkId !== undefined) supabaseUpdates['Network Id'] = updates.networkId;
    if (updates.categoryId !== undefined) supabaseUpdates['Parent Category Id'] = updates.categoryId;
    if (updates.aboutText !== undefined) supabaseUpdates['about_text'] = updates.aboutText;
    if (updates.features !== undefined) supabaseUpdates['features'] = updates.features;
    if (updates.shippingInfo !== undefined) supabaseUpdates['shipping_info'] = updates.shippingInfo;
    if (updates.returnPolicy !== undefined) supabaseUpdates['return_policy'] = updates.returnPolicy;
    if (updates.contactInfo !== undefined) supabaseUpdates['contact_info'] = updates.contactInfo;
    if (updates.trustScore !== undefined) supabaseUpdates['trust_score'] = updates.trustScore;
    if (updates.establishedYear !== undefined) supabaseUpdates['established_year'] = updates.establishedYear;
    if (updates.headquarters !== undefined) supabaseUpdates['headquarters'] = updates.headquarters;
    if (updates.voucherText !== undefined) supabaseUpdates['voucher_text'] = updates.voucherText;
    if (updates.layoutPosition !== undefined) supabaseUpdates['layout_position'] = updates.layoutPosition;
    
    // Add new dynamic content fields
    if (updates.whyTrustUs !== undefined) supabaseUpdates['why_trust_us'] = updates.whyTrustUs;
    if (updates.moreInformation !== undefined) supabaseUpdates['more_information'] = updates.moreInformation;
    
    // Add rating and review count fields
    if (updates.rating !== undefined) supabaseUpdates['rating'] = updates.rating;
    if (updates.reviewCount !== undefined) supabaseUpdates['review_count'] = updates.reviewCount;
    
    // Add SEO fields
    if (updates.seoTitle !== undefined) supabaseUpdates['seo_title'] = updates.seoTitle;
    if (updates.seoDescription !== undefined) supabaseUpdates['seo_description'] = updates.seoDescription;
    if (updates.merchantId !== undefined) supabaseUpdates['Merchant Id'] = updates.merchantId;

    console.log('Supabase updates:', supabaseUpdates);

    // Update store by Store Id
    const { data, error } = await supabaseAdmin
      .from('stores')
      .update(supabaseUpdates)
      .eq('Store Id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      
      // Check for duplicate slug error
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { success: false, error: 'Store with this slug already exists' },
          { status: 400 }
        );
      }
      
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }

    console.log('Store updated successfully:', id);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Supabase update store error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update store',
      },
      { status: 500 }
    );
  }
}
