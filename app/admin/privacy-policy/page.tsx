'use client';

import { useEffect, useState } from 'react';
import { getPrivacyPolicy, createPrivacyPolicy, updatePrivacyPolicy, deletePrivacyPolicy, PrivacyPolicy } from '@/lib/services/privacyPolicyService';
import { languages } from '@/lib/contexts/LanguageContext';

export default function PrivacyPolicyPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [policy, setPolicy] = useState<PrivacyPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('Privacy Policy');
  const [content, setContent] = useState('');
  const [contactEmail, setContactEmail] = useState('privacy@mimecode.com');
  const [contactWebsite, setContactWebsite] = useState('www.mimecode.com');

  const fetchPolicy = async (langCode: string) => {
    setLoading(true);
    const data = await getPrivacyPolicy(langCode);
    if (data) {
      setPolicy(data);
      setTitle(data.title);
      setContent(data.content);
      setContactEmail(data.contactEmail);
      setContactWebsite(data.contactWebsite);
    } else {
      setPolicy(null);
      setTitle('Privacy Policy');
      setContent('');
      setContactEmail('privacy@mimecode.com');
      setContactWebsite('www.mimecode.com');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPolicy(selectedLanguage);
  }, [selectedLanguage]);

  const resetForm = () => {
    if (policy) {
      setTitle(policy.title);
      setContent(policy.content);
      setContactEmail(policy.contactEmail);
      setContactWebsite(policy.contactWebsite);
    } else {
      setTitle('Privacy Policy');
      setContent('');
      setContactEmail('privacy@mimecode.com');
      setContactWebsite('www.mimecode.com');
    }
    setShowForm(false);
  };

  const handleLanguageChange = (langCode: string) => {
    setSelectedLanguage(langCode);
    setShowForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Please fill in title and content');
      return;
    }

    const policyData: Omit<PrivacyPolicy, 'id'> = {
      title: title.trim(),
      content: content.trim(),
      contactEmail: contactEmail.trim(),
      contactWebsite: contactWebsite.trim(),
      languageCode: selectedLanguage,
      lastUpdated: new Date(),
    };

    const result = policy
      ? await updatePrivacyPolicy(policy.id!, policyData)
      : await createPrivacyPolicy(policyData);

    if (result.success) {
      alert('Privacy Policy saved successfully!');
      fetchPolicy(selectedLanguage);
      setShowForm(false);
    } else {
      alert('Failed to save privacy policy. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!policy || !policy.id) return;
    
    if (!confirm('Are you sure you want to delete this privacy policy?')) return;

    const result = await deletePrivacyPolicy(policy.id);
    if (result.success) {
      alert('Privacy Policy deleted successfully!');
      setPolicy(null);
      resetForm();
    } else {
      alert('Failed to delete privacy policy. Please try again.');
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

  const selectedLang = languages.find(l => l.code === selectedLanguage) || languages[0];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy Management</h1>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700">Language:</label>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABC443] bg-white"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#ABC443] hover:bg-[#16a34a] text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            {policy ? 'Edit Privacy Policy' : '+ Create Privacy Policy'}
          </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
              {policy ? 'Edit Privacy Policy' : 'Create Privacy Policy'}
            </h2>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <span className="text-2xl">{selectedLang.flag}</span>
                <span className="font-semibold text-gray-700">{selectedLang.name}</span>
              </div>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABC443]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABC443]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Contact Website *
                  </label>
                  <input
                    type="text"
                    value={contactWebsite}
                    onChange={(e) => setContactWebsite(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABC443]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Content * (HTML supported)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Use HTML tags for formatting: &lt;h1&gt;, &lt;h2&gt;, &lt;h3&gt;, &lt;h4&gt;, &lt;h5&gt;, &lt;h6&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, etc.
                </p>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABC443] font-mono text-sm"
                  rows={25}
                  required
                  placeholder="Enter privacy policy content (HTML supported)..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-[#ABC443] hover:bg-[#16a34a] text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                >
                  {policy ? 'Update Privacy Policy' : 'Create Privacy Policy'}
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
            <p className="text-gray-600">Loading privacy policy...</p>
          </div>
        ) : !policy ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">No privacy policy found for {selectedLang.flag} {selectedLang.name}.</p>
            <p className="text-gray-500 text-sm">Create privacy policy for this language!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{policy.title}</h2>
                    <span className="text-xl">{selectedLang.flag}</span>
                    <span className="text-sm text-gray-500">({selectedLang.name})</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Last Updated: {policy.lastUpdated ? formatDate(policy.lastUpdated) : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Contact: {policy.contactEmail} | {policy.contactWebsite}
                  </p>
                  {policy.languageCode && (
                    <p className="text-xs text-gray-400 mt-1">
                      Language Code: {policy.languageCode}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowForm(true)}
                    className="text-[#ABC443] hover:text-[#16a34a] font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-900 font-semibold ml-4"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div 
                className="prose prose-sm max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-h5:text-base prose-h6:text-sm"
                dangerouslySetInnerHTML={{ __html: policy.content }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
