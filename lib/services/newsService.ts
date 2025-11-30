import { Timestamp } from 'firebase/firestore';

export interface NewsArticle {
  id?: string;
  title: string;
  description: string;
  content?: string; // Full blog content (HTML or plain text)
  imageUrl: string;
  articleUrl?: string; // Original article URL if extracted from URL
  date?: string; // Date display (e.g., "18 Oct 2005")
  layoutPosition?: number | null; // Position in news layout (1-4)
  createdAt?: Timestamp | number; // Can be Timestamp or number (milliseconds)
  updatedAt?: Timestamp | number; // Can be Timestamp or number (milliseconds)
}

// Use environment variable to separate collections between projects
// Default to 'news-mimecode' for this new project
const news = process.env.NEXT_PUBLIC_NEWS_COLLECTION || 'news-mimecode';

// Create a new news article from URL (extracts article info automatically)
export async function createNewsFromUrl(title: string, articleUrl: string, imageUrl: string, description?: string, content?: string, layoutPosition?: number | null, date?: string) {
  try {
    const res = await fetch('/api/news/create-from-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        articleUrl,
        imageUrl,
        description,
        content,
        layoutPosition,
        date,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('Server create failed', { status: res.status, body: json });
      return { success: false, error: json.error || 'Failed to create news article from URL' };
    }

    return { success: true, id: json.id };
  } catch (error) {
    console.error('Error creating news article from URL:', error);
    return { success: false, error };
  }
}

// Get all news articles
export async function getNews(): Promise<NewsArticle[]> {
  try {
    // Use server-side API to fetch news from Supabase
    const res = await fetch('/api/news/get');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.news) {
        return data.news as NewsArticle[];
      }
    }
    
    // If API returns error, check what type
    const errorData = await res.json().catch(() => ({}));
    console.warn('⚠️ Server API failed:', res.status, errorData.error || 'Unknown error');
    return [];
  } catch (error: any) {
    console.warn('⚠️ Error getting news:', error.message || error);
    return [];
  }
}

// Get news by ID
export async function getNewsById(id: string): Promise<NewsArticle | null> {
  try {
    // Use server-side API to fetch news from Supabase
    const res = await fetch(`/api/news/get?id=${encodeURIComponent(id)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.news) {
        return data.news as NewsArticle;
      }
      return null;
    }
    
    console.warn('⚠️ Server API failed:', res.status);
    return null;
  } catch (error: any) {
    console.warn('⚠️ Error getting news by ID:', error.message || error);
    return null;
  }
}

// Get news with layout positions (1-4)
export async function getNewsWithLayout(): Promise<(NewsArticle | null)[]> {
  try {
    const allNews = await getNews();
    // Filter news with layout positions (1-4)
    const newsWithPositions = allNews
      .filter(article => article.layoutPosition && article.layoutPosition >= 1 && article.layoutPosition <= 4)
      .sort((a, b) => (a.layoutPosition || 0) - (b.layoutPosition || 0));
    
    // Create array of 4 slots (positions 1-4)
    const layoutSlots: (NewsArticle | null)[] = Array(4).fill(null);
    
    // Fill slots with news at their assigned positions
    newsWithPositions.forEach(article => {
      if (article.layoutPosition && article.layoutPosition >= 1 && article.layoutPosition <= 4) {
        layoutSlots[article.layoutPosition - 1] = article; // layoutPosition 1 = index 0
      }
    });
    
    return layoutSlots;
  } catch (error) {
    console.error('Error getting news with layout:', error);
    return Array(4).fill(null);
  }
}

// Update a news article
export async function updateNews(id: string, updates: Partial<NewsArticle>) {
  try {
    const res = await fetch('/api/news/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        updates,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('Server update failed', { status: res.status, body: json });
      return { success: false, error: json.error || 'Failed to update news article' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating news:', error);
    return { success: false, error };
  }
}

// Delete a news article
export async function deleteNews(id: string) {
  try {
    const res = await fetch('/api/news/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('Server delete failed', { status: res.status, body: json });
      return { success: false, error: json.error || 'Failed to delete news article' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting news:', error);
    return { success: false, error };
  }
}

