import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { getCachedSettings, setCachedSettings } from '@/lib/cache/pageSettingsCache';

export async function GET(req: NextRequest) {
  try {
    // Check cache first
    const cachedData = getCachedSettings();
    if (cachedData) {
      return NextResponse.json(
        { success: true, settings: cachedData },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        }
      );
    }

    if (!supabaseAdmin) {
      const defaultSettings = {
        id: 'default',
        eventsNavLabel: 'Events',
        eventsSlug: 'events',
        blogsNavLabel: 'Blogs',
        blogsSlug: 'blogs',
      };
      // Cache default settings
      setCachedSettings(defaultSettings);
      return NextResponse.json(
        { success: true, settings: defaultSettings },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('page_settings')
      .select('*')
      .limit(1)
      .single();
    
    if (error || !data) {
      const defaultSettings = {
        id: 'default',
        eventsNavLabel: 'Events',
        eventsSlug: 'events',
        blogsNavLabel: 'Blogs',
        blogsSlug: 'blogs',
      };
      // Cache default settings
      setCachedSettings(defaultSettings);
      return NextResponse.json(
        { success: true, settings: defaultSettings },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        }
      );
    }
    
    const settingsData = {
      id: data.id,
      eventsNavLabel: data.events_nav_label || 'Events',
      eventsSlug: data.events_slug || 'events',
      blogsNavLabel: data.blogs_nav_label || 'Blogs',
      blogsSlug: data.blogs_slug || 'blogs',
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : undefined,
    };
    
    // Cache the settings
    setCachedSettings(settingsData);
    
    return NextResponse.json(
      { success: true, settings: settingsData },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error getting page settings:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

