'use client';

import { useEffect, useState } from 'react';
import { getEmailSettings, updateEmailSettings, EmailSettings } from '@/lib/services/emailService';

export default function EmailPage() {
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const [email1, setEmail1] = useState('');
  const [email2, setEmail2] = useState('');
  const [email3, setEmail3] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchEmailSettings = async () => {
      setLoading(true);
      try {
        const settings = await getEmailSettings();
        setEmailSettings(settings);
        setEmail1(settings?.email1 || '');
        setEmail2(settings?.email2 || '');
        setEmail3(settings?.email3 || '');
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
    
    // Validate all emails if they are filled
    const emails = [email1.trim(), email2.trim(), email3.trim()];
    const filledEmails = emails.filter(email => email !== '');
    
    if (filledEmails.length === 0) {
      setMessage({ type: 'error', text: 'Please enter at least one email address' });
      return;
    }
    
    // Validate each filled email
    for (let i = 0; i < filledEmails.length; i++) {
      if (!emailRegex.test(filledEmails[i])) {
        setMessage({ type: 'error', text: `Please enter a valid email address for Email ${i + 1}` });
        return;
      }
    }

    setSaving(true);
    setMessage(null);

    try {
      const result = await updateEmailSettings(email1, email2, email3);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Email settings saved successfully!' });
        // Update local state
        setEmailSettings({
          ...emailSettings,
          email1: email1.trim(),
          email2: email2.trim(),
          email3: email3.trim(),
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
          <h2 className="text-xl font-bold text-gray-800 mb-2">Manage Email Addresses</h2>
          <p className="text-gray-600 text-sm">
            Set up to 3 email addresses where emails will be sent. All fields are editable and optional.
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
          <div className="space-y-6 mb-6">
            <div>
              <label htmlFor="email1" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address 1
              </label>
              <input
                type="email"
                id="email1"
                value={email1}
                onChange={(e) => setEmail1(e.target.value)}
                placeholder="admin@availcoupon.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="email2" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address 2
              </label>
              <input
                type="email"
                id="email2"
                value={email2}
                onChange={(e) => setEmail2(e.target.value)}
                placeholder="support@availcoupon.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="email3" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address 3
              </label>
              <input
                type="email"
                id="email3"
                value={email3}
                onChange={(e) => setEmail3(e.target.value)}
                placeholder="info@availcoupon.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
          </div>

          <div className="flex gap-4 flex-wrap items-center">
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
            <li>You can add up to 3 email addresses where emails will be sent.</li>
            <li>All email fields are editable and can be updated at any time.</li>
            <li>At least one email address is required to save settings.</li>
            <li>Make sure to use valid email addresses that you have access to.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

