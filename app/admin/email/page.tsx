'use client';

import { useEffect, useState } from 'react';
import { getEmailSettings, updateEmailSettings, EmailSettings } from '@/lib/services/emailService';

export default function EmailPage() {
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchEmailSettings = async () => {
      setLoading(true);
      try {
        const settings = await getEmailSettings();
        setEmailSettings(settings);
        setNewsletterEmail(settings?.newsletterEmail || '');
      } catch (error) {
        console.error('Error fetching email settings:', error);
        setMessage({ type: 'error', text: 'Failed to load email settings' });
      } finally {
        setLoading(false);
      }
    };

    fetchEmailSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newsletterEmail.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email address' });
      return;
    }
    
    if (!emailRegex.test(newsletterEmail.trim())) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const result = await updateEmailSettings(newsletterEmail);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Email settings saved successfully!' });
        // Update local state
        setEmailSettings({
          ...emailSettings,
          newsletterEmail: newsletterEmail.trim(),
        } as EmailSettings);
      } else {
        setMessage({ type: 'error', text: 'Failed to save email settings' });
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      setMessage({ type: 'error', text: 'An error occurred while saving' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-8">Manage Email</h1>
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-8">Manage Email</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Newsletter Subscription Email</h2>
          <p className="text-gray-600 text-sm">
            Set the email address where newsletter subscription requests will be sent when users click "Send" on the newsletter form.
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="mb-6">
            <label htmlFor="newsletterEmail" className="block text-sm font-semibold text-gray-700 mb-2">
              Newsletter Email Address
            </label>
            <input
              type="email"
              id="newsletterEmail"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="admin@availcoupon.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              All newsletter subscription requests will be sent to this email address.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Email Settings'}
            </button>
            {emailSettings?.updatedAt && (
              <div className="flex items-center text-sm text-gray-500">
                Last updated: {emailSettings.updatedAt.toDate().toLocaleString()}
              </div>
            )}
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>When a user enters their email and clicks "Send" on the newsletter form, the subscription request will be sent to the email address above.</li>
            <li>You can change this email address at any time from this page.</li>
            <li>Make sure to use a valid email address that you have access to.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

