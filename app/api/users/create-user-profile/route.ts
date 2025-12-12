import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { uid, email, displayName, role } = await request.json();

    if (!uid || !email) {
      return NextResponse.json(
        { success: false, error: 'UID and email are required' },
        { status: 400 }
      );
    }

    // Create user profile in Firestore
    const db = getAdminFirestore();
    const userRef = db.collection('users').doc(uid);
    
    await userRef.set({
      email,
      displayName: displayName || null,
      role: role || 'user', // Default to 'user' role
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'User profile created successfully',
    });
  } catch (error: any) {
    console.error('Error creating user profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create user profile' },
      { status: 500 }
    );
  }
}


