'use client';

import { useEffect, useState } from 'react';
import {
  getFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  FAQ,
} from '@/lib/services/faqService';
import Link from 'next/link';

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FAQ>>({
    question: '',
    answer: '',
    order: 0,
    isActive: true,
  });

  const fetchFAQs = async () => {
    setLoading(true);
    const data = await getFAQs();
    setFaqs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFAQs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question || !formData.answer) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingId) {
      const result = await updateFAQ(editingId, formData);
      if (result.success) {
        alert('FAQ updated successfully!');
        fetchFAQs();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          question: '',
          answer: '',
          order: 0,
          isActive: true,
        });
      } else {
        alert('Error updating FAQ');
      }
    } else {
      const result = await createFAQ({
        question: formData.question,
        answer: formData.answer,
        order: formData.order || 0,
        isActive: formData.isActive !== false,
      });
      if (result.success) {
        alert('FAQ created successfully!');
        fetchFAQs();
        setShowForm(false);
        setFormData({
          question: '',
          answer: '',
          order: 0,
          isActive: true,
        });
      } else {
        alert('Error creating FAQ');
      }
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingId(faq.id || null);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      order: faq.order || 0,
      isActive: faq.isActive !== false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this FAQ?')) {
      const result = await deleteFAQ(id);
      if (result.success) {
        alert('FAQ deleted successfully!');
        fetchFAQs();
      } else {
        alert('Error deleting FAQ');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      question: '',
      answer: '',
      order: 0,
      isActive: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manage FAQs</h1>
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
            >
              Back to Admin
            </Link>
          </div>
        </div>

        {/* Add FAQ Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium"
          >
            + Add New FAQ
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">
              {editingId ? 'Edit FAQ' : 'Add New FAQ'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="question" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                  Question *
                </label>
                <input
                  id="question"
                  type="text"
                  value={formData.question || ''}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label htmlFor="answer" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                  Answer *
                </label>
                <textarea
                  id="answer"
                  value={formData.answer || ''}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base resize-y"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="order" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                    Order (for sorting)
                  </label>
                  <input
                    id="order"
                    type="number"
                    value={formData.order || 0}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 mt-6 sm:mt-8">
                    <input
                      type="checkbox"
                      checked={formData.isActive !== false}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm sm:text-base text-gray-700 font-semibold">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 sm:gap-4">
                <button
                  type="submit"
                  className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium"
                >
                  {editingId ? 'Update FAQ' : 'Create FAQ'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 sm:px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FAQs List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading FAQs...</p>
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg">No FAQs found. Create your first FAQ!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Order</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Question</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Answer</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {faqs.map((faq) => (
                    <tr key={faq.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs sm:text-sm text-gray-900">{faq.order || 0}</td>
                      <td className="px-4 py-3 text-xs sm:text-sm text-gray-900 max-w-xs truncate">{faq.question}</td>
                      <td className="px-4 py-3 text-xs sm:text-sm text-gray-600 max-w-md truncate">{faq.answer}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            faq.isActive !== false
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {faq.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(faq)}
                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => faq.id && handleDelete(faq.id)}
                            className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

