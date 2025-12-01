'use client';

import { useEffect, useState } from 'react';
import { getEvents, createEvent, updateEvent, deleteEvent, Event } from '@/lib/services/eventService';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [moreDetails, setMoreDetails] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    const data = await getEvents();
    setEvents(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setBannerUrl('');
    setStartDate('');
    setEndDate('');
    setMoreDetails('');
    setEditingEvent(null);
    setShowForm(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !startDate || !endDate) {
      alert('Please fill in all required fields');
      return;
    }

    const eventData: Omit<Event, 'id'> = {
      title: title.trim(),
      description: description.trim(),
      bannerUrl: bannerUrl.trim() || undefined,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      moreDetails: moreDetails.trim() || undefined,
    };

    const result = editingEvent
      ? await updateEvent(editingEvent.id!, eventData)
      : await createEvent(eventData);

    if (result.success) {
      fetchEvents();
      resetForm();
    } else {
      alert('Failed to save event. Please try again.');
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description);
    setBannerUrl(event.bannerUrl || '');
    setStartDate(event.startDate instanceof Date 
      ? event.startDate.toISOString().split('T')[0]
      : typeof event.startDate === 'string'
      ? event.startDate.split('T')[0]
      : '');
    setEndDate(event.endDate instanceof Date
      ? event.endDate.toISOString().split('T')[0]
      : typeof event.endDate === 'string'
      ? event.endDate.split('T')[0]
      : '');
    setMoreDetails(event.moreDetails || '');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    const result = await deleteEvent(id);
    if (result.success) {
      fetchEvents();
    } else {
      alert('Failed to delete event. Please try again.');
    }
  };

  const formatDate = (date: Date | string | any) => {
    if (!date) return 'N/A';
    try {
      const d = date instanceof Date ? date : new Date(date);
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Events Management</h1>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-[#ABC443] hover:bg-[#16a34a] text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            + Create Event
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABC443]"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Event Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABC443]"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Banner Image URL
                </label>
                <input
                  type="url"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABC443]"
                  placeholder="https://example.com/banner.jpg"
                />
                {bannerUrl && (
                  <img src={bannerUrl} alt="Banner preview" className="mt-2 max-w-xs rounded-lg" />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABC443]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABC443]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  More Event Details
                </label>
                <textarea
                  value={moreDetails}
                  onChange={(e) => setMoreDetails(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABC443]"
                  rows={6}
                  placeholder="Additional details about the event..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-[#ABC443] hover:bg-[#16a34a] text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-6 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600">No events found. Create your first event!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{event.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-2">{event.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(event.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(event.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(event)}
                        className="text-[#ABC443] hover:text-[#16a34a] mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(event.id!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

