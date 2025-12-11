import { Timestamp } from 'firebase/firestore';

export interface Event {
  id?: string;
  title: string;
  description: string;
  bannerUrl?: string;
  startDate: Date | string | Timestamp;
  endDate: Date | string | Timestamp;
  moreDetails?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Get all events
export async function getEvents(): Promise<Event[]> {
  try {
    const res = await fetch('/api/events/get');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.events) {
        return data.events as Event[];
      }
    }
    return [];
  } catch (error) {
    console.error('Error getting events:', error);
    return [];
  }
}

// Get event by ID
export async function getEventById(id: string): Promise<Event | null> {
  try {
    const res = await fetch(`/api/events/get?id=${encodeURIComponent(id)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.event) {
        return data.event as Event;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting event:', error);
    return null;
  }
}

// Create event
export async function createEvent(event: Omit<Event, 'id'>) {
  try {
    const res = await fetch('/api/events/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event }),
    });

    let json: any = {};
    let resText = '';
    try {
      resText = await res.text();
      try {
        json = JSON.parse(resText || '{}');
      } catch (e) {
        json = { text: resText };
      }
    } catch (e) {
      console.error('Failed to read server response body', e);
    }

    if (!res.ok) {
      console.error('Server create failed', { status: res.status, body: json });
      return { success: false, error: json.error || json.text || 'Failed to create event' };
    }

    return { success: true, id: json.id };
  } catch (error) {
    console.error('Error creating event:', error);
    return { success: false, error };
  }
}

// Update event
export async function updateEvent(id: string, updates: Partial<Event>) {
  try {
    const res = await fetch('/api/events/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates }),
    });

    let json: any = {};
    let resText = '';
    try {
      resText = await res.text();
      try {
        json = JSON.parse(resText || '{}');
      } catch (e) {
        json = { text: resText };
      }
    } catch (e) {
      console.error('Failed to read server response body', e);
    }

    if (!res.ok) {
      console.error('Server update failed', { status: res.status, body: json });
      return { success: false, error: json.error || json.text || 'Failed to update event' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating event:', error);
    return { success: false, error };
  }
}

// Delete event
export async function deleteEvent(id: string) {
  try {
    const res = await fetch('/api/events/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    let json: any = {};
    let resText = '';
    try {
      resText = await res.text();
      try {
        json = JSON.parse(resText || '{}');
      } catch (e) {
        json = { text: resText };
      }
    } catch (e) {
      console.error('Failed to read server response body', e);
    }

    if (!res.ok) {
      console.error('Server delete failed', { status: res.status, body: json });
      return { success: false, error: json.error || json.text || 'Failed to delete event' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting event:', error);
    return { success: false, error };
  }
}

