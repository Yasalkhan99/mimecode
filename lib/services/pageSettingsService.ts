export interface PageSettings {
  id?: string;
  eventsNavLabel?: string;
  eventsSlug?: string;
  blogsNavLabel?: string;
  blogsSlug?: string;
  updatedAt?: number;
}

// Get page settings
export async function getPageSettings(): Promise<PageSettings | null> {
  try {
    const res = await fetch('/api/page-settings/get', {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.settings) {
        return data.settings as PageSettings;
      }
    }
    return { 
      eventsNavLabel: 'Events', 
      eventsSlug: 'events',
      blogsNavLabel: 'Blogs',
      blogsSlug: 'blogs'
    };
  } catch (error) {
    console.error('Error getting page settings:', error);
    return { 
      eventsNavLabel: 'Events', 
      eventsSlug: 'events',
      blogsNavLabel: 'Blogs',
      blogsSlug: 'blogs'
    };
  }
}

// Update page settings
export async function updatePageSettings(settings: Partial<PageSettings>) {
  try {
    const res = await fetch('/api/page-settings/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true };
    }
    const errorData = await res.json();
    return { success: false, error: errorData.error || 'Failed to update settings' };
  } catch (error) {
    console.error('Error updating page settings:', error);
    return { success: false, error: String(error) };
  }
}

