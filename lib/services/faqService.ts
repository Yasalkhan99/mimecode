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

export interface FAQ {
  id?: string;
  question: string;
  answer: string;
  order?: number; // For ordering FAQs
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const faqs = 'faqs';

// Create a new FAQ
export async function createFAQ(faq: Omit<FAQ, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, faqs), {
      ...faq,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return { success: false, error };
  }
}

// Get all FAQs (ordered by order field, then by createdAt)
export async function getFAQs(): Promise<FAQ[]> {
  try {
    // Get all FAQs without composite index query (sort in memory instead)
    const querySnapshot = await getDocs(collection(db, faqs));
    const faqsList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as FAQ));
    
    // Sort in memory: first by order, then by createdAt
    return faqsList.sort((a, b) => {
      const orderA = a.order || 0;
      const orderB = b.order || 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // If order is same, sort by createdAt
      const createdAtA = a.createdAt?.toMillis() || 0;
      const createdAtB = b.createdAt?.toMillis() || 0;
      return createdAtA - createdAtB;
    });
  } catch (error) {
    console.error('Error getting FAQs:', error);
    return [];
  }
}

// Get active FAQs only
export async function getActiveFAQs(): Promise<FAQ[]> {
  try {
    // Get all FAQs without composite index query (filter and sort in memory)
    const querySnapshot = await getDocs(collection(db, faqs));
    const faqsList = querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as FAQ))
      .filter((faq) => faq.isActive !== false);
    
    // Sort in memory: first by order, then by createdAt
    return faqsList.sort((a, b) => {
      const orderA = a.order || 0;
      const orderB = b.order || 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // If order is same, sort by createdAt
      const createdAtA = a.createdAt?.toMillis() || 0;
      const createdAtB = b.createdAt?.toMillis() || 0;
      return createdAtA - createdAtB;
    });
  } catch (error) {
    console.error('Error getting active FAQs:', error);
    return [];
  }
}

// Get a single FAQ by ID
export async function getFAQById(id: string): Promise<FAQ | null> {
  try {
    const docRef = doc(db, faqs, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as FAQ;
    }
    return null;
  } catch (error) {
    console.error('Error getting FAQ:', error);
    return null;
  }
}

// Update an FAQ
export async function updateFAQ(id: string, faq: Partial<Omit<FAQ, 'id'>>) {
  try {
    const docRef = doc(db, faqs, id);
    await updateDoc(docRef, {
      ...faq,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return { success: false, error };
  }
}

// Delete an FAQ
export async function deleteFAQ(id: string) {
  try {
    const docRef = doc(db, faqs, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return { success: false, error };
  }
}

