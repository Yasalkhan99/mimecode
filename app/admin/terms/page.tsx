'use client';

import { useEffect, useState } from 'react';
import { getTermsAndConditions, createTermsAndConditions, updateTermsAndConditions, deleteTermsAndConditions, TermsAndConditions } from '@/lib/services/termsService';
import { languages } from '@/lib/contexts/LanguageContext';

export default function TermsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [terms, setTerms] = useState<TermsAndConditions | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('Terms and Conditions');
  const [content, setContent] = useState('');
  const [contactEmail, setContactEmail] = useState('legal@mimecode.com');
  const [contactWebsite, setContactWebsite] = useState('www.mimecode.com');

  const fetchTerms = async (langCode: string) => {
    setLoading(true);
    const data = await getTermsAndConditions(langCode);
    if (data) {
      setTerms(data);
      setTitle(data.title);
      setContent(data.content);
      setContactEmail(data.contactEmail);
      setContactWebsite(data.contactWebsite);
    } else {
      setTerms(null);
      setTitle('Terms and Conditions');
      setContent('');
      setContactEmail('legal@mimecode.com');
      setContactWebsite('www.mimecode.com');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTerms(selectedLanguage);
  }, [selectedLanguage]);

  const resetForm = () => {
    if (terms) {
      setTitle(terms.title);
      setContent(terms.content);
      setContactEmail(terms.contactEmail);
      setContactWebsite(terms.contactWebsite);
    } else {
      setTitle('Terms and Conditions');
      setContent('');
      setContactEmail('legal@mimecode.com');
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

    const termsData: Omit<TermsAndConditions, 'id'> = {
      title: title.trim(),
      content: content.trim(),
      contactEmail: contactEmail.trim(),
      contactWebsite: contactWebsite.trim(),
      languageCode: selectedLanguage,
      lastUpdated: new Date(),
    };

    const result = terms
      ? await updateTermsAndConditions(terms.id!, termsData)
      : await createTermsAndConditions(termsData);

    if (result.success) {
      alert('Terms and Conditions saved successfully!');
      fetchTerms(selectedLanguage);
      setShowForm(false);
    } else {
      alert('Failed to save terms and conditions. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!terms || !terms.id) return;
    
    if (!confirm('Are you sure you want to delete this terms and conditions?')) return;

    const result = await deleteTermsAndConditions(terms.id);
    if (result.success) {
      alert('Terms and Conditions deleted successfully!');
      setTerms(null);
      resetForm();
    } else {
      alert('Failed to delete terms and conditions. Please try again.');
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
          <h1 className="text-3xl font-bold text-gray-900">Terms & Conditions Management</h1>
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
              {terms ? 'Edit Terms & Conditions' : '+ Create Terms & Conditions'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {terms ? 'Edit Terms & Conditions' : 'Create Terms & Conditions'}
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
                  Use HTML tags for formatting: &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, etc.
                </p>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABC443] font-mono text-sm"
                  rows={25}
                  required
                  placeholder="Enter terms and conditions content (HTML supported)..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-[#ABC443] hover:bg-[#16a34a] text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                >
                  {terms ? 'Update Terms & Conditions' : 'Create Terms & Conditions'}
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
            <p className="text-gray-600">Loading terms and conditions...</p>
          </div>
        ) : !terms ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">No terms and conditions found for {selectedLang.flag} {selectedLang.name}.</p>
            <p className="text-gray-500 text-sm">Create terms and conditions for this language!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{terms.title}</h2>
                    <span className="text-xl">{selectedLang.flag}</span>
                    <span className="text-sm text-gray-500">({selectedLang.name})</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Last Updated: {terms.lastUpdated ? formatDate(terms.lastUpdated) : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Contact: {terms.contactEmail} | {terms.contactWebsite}
                  </p>
                  {terms.languageCode && (
                    <p className="text-xs text-gray-400 mt-1">
                      Language Code: {terms.languageCode}
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
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: terms.content }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
