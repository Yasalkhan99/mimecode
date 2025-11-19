import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { extractOriginalCloudinaryUrl } from '@/lib/utils/cloudinary';

export interface NewsArticle {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  articleUrl?: string; // Original article URL if extracted from URL
  date?: string; // Date display (e.g., "18 Oct 2005")
  layoutPosition?: number | null; // Position in news layout (1-4)
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const news = 'news';

// Create a new news article from URL (extracts article info automatically)
export async function createNewsFromUrl(title: string, articleUrl: string, imageUrl: string, description?: string, layoutPosition?: number | null, date?: string) {
  try {
    // Extract original URL if it's a Cloudinary URL
    const extractedImageUrl = extractOriginalCloudinaryUrl(imageUrl);
    
    const docRef = await addDoc(collection(db, news), {
      title: title || '',
      description: description || '',
      imageUrl: extractedImageUrl || imageUrl,
      articleUrl: articleUrl,
      date: date || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      layoutPosition: layoutPosition !== undefined ? layoutPosition : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating news article from URL:', error);
    return { success: false, error };
  }
}

// Get all news articles
export async function getNews(): Promise<NewsArticle[]> {
  try {
    const querySnapshot = await getDocs(collection(db, news));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as NewsArticle));
  } catch (error) {
    console.error('Error getting news:', error);
    return [];
  }
}

// Get news by ID
export async function getNewsById(id: string): Promise<NewsArticle | null> {
  try {
    const docRef = doc(db, news, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as NewsArticle;
    }
    return null;
  } catch (error) {
    console.error('Error getting news:', error);
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
    const docRef = doc(db, news, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating news:', error);
    return { success: false, error };
  }
}

// Delete a news article
export async function deleteNews(id: string) {
  try {
    const docRef = doc(db, news, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting news:', error);
    return { success: false, error };
  }
}

