'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, Notification } from '@/lib/services/notificationsService';
import Navbar from '@/app/components/Navbar';
import NewsletterSubscription from '@/app/components/NewsletterSubscription';
import Footer from '@/app/components/Footer';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Notifications - AvailCoupon';
    loadNotifications();
    
    // Listen for updates
    const handleUpdate = () => loadNotifications();
    window.addEventListener('notificationUpdated', handleUpdate);
    window.addEventListener('notificationAdded', handleUpdate);
    
    return () => {
      window.removeEventListener('notificationUpdated', handleUpdate);
      window.removeEventListener('notificationAdded', handleUpdate);
    };
  }, []);

  const loadNotifications = () => {
    setLoading(true);
    const data = getNotifications();
    setNotifications(data);
    setLoading(false);
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    loadNotifications();
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this notification?')) {
      deleteNotification(id);
      loadNotifications();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full">
      <Navbar />
      
      {/* Notifications Section */}
      <div className="w-full px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 bg-white overflow-x-hidden">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-gray-600 text-sm sm:text-base">
                  {unreadCount} {unreadCount === 1 ? 'unread notification' : 'unread notifications'}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors"
              >
                Mark All Read
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-gray-500 text-lg">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white border rounded-lg p-4 sm:p-6 transition-all duration-200 ${
                    notification.read
                      ? 'border-gray-200'
                      : 'border-orange-300 bg-orange-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                      {notification.link && (
                        <Link
                          href={notification.link}
                          className="inline-block mt-2 text-sm text-orange-600 hover:text-orange-700 font-semibold"
                        >
                          View →
                        </Link>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="Mark as read"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <NewsletterSubscription />
      <Footer />
    </div>
  );
}

