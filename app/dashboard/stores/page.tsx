'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import Link from 'next/link';
import { getStores, Store, createStore, updateStore, deleteStore } from '@/lib/services/storeService';
import { getCategories, Category } from '@/lib/services/categoryService';
import Image from 'next/image';

export default function UserStoresPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logoUrl: '',
    websiteUrl: '',
    categoryId: '',
    voucherText: '',
  });
  const [extractingUrl, setExtractingUrl] = useState('');
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allStores, allCategories] = await Promise.all([
        getStores(),
        getCategories(),
      ]);
      
      // Filter stores by userId
      const userStores = allStores.filter(store => store.userId === user?.uid);
      setStores(userStores);
      setCategories(allCategories);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractFromUrl = async () => {
    if (!extractingUrl) {
      alert('Please enter a website URL');
      return;
    }

    try {
      setExtracting(true);
      const response = await fetch('/api/stores/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: extractingUrl }),
      });

      const data = await response.json();

      if (data.success && data.name) {
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          description: data.description || prev.description,
          logoUrl: data.logoUrl || prev.logoUrl,
          websiteUrl: extractingUrl,
          slug: data.slug || (data.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        }));
        alert(`Successfully extracted data from ${data.name}!`);
      } else {
        alert('Failed to extract data. Please fill in the details manually.');
      }
    } catch (error) {
      console.error('Error extracting metadata:', error);
      alert('Failed to extract data. Please fill in the details manually.');
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('You must be logged in to create a store');
      return;
    }

    if (!formData.name) {
      alert('Store name is required');
      return;
    }

    try {
      const storeData = {
        ...formData,
        userId: user.uid, // Add user ID for ownership
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      };

      if (editingStore && editingStore.id) {
        await updateStore(editingStore.id, storeData);
      } else {
        await createStore(storeData as Omit<Store, 'id'>);
      }

      // Reset form and reload data
      setFormData({
        name: '',
        slug: '',
        description: '',
        logoUrl: '',
        websiteUrl: '',
        categoryId: '',
        voucherText: '',
      });
      setShowForm(false);
      setEditingStore(null);
      loadData();
    } catch (error) {
      console.error('Error saving store:', error);
      alert('Failed to save store. Please try again.');
    }
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      slug: store.slug || '',
      description: store.description || '',
      logoUrl: store.logoUrl || '',
      websiteUrl: store.websiteUrl || '',
      categoryId: store.categoryId || '',
      voucherText: store.voucherText || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (storeId: string) => {
    if (!confirm('Are you sure you want to delete this store?')) {
      return;
    }

    try {
      await deleteStore(storeId);
      loadData();
    } catch (error) {
      console.error('Error deleting store:', error);
      alert('Failed to delete store. Please try again.');
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Stores</h1>
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (showForm) {
                  setEditingStore(null);
                  setFormData({
                    name: '',
                    slug: '',
                    description: '',
                    logoUrl: '',
                    websiteUrl: '',
                    categoryId: '',
                    voucherText: '',
                  });
                }
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              {showForm ? 'Cancel' : '+ Add Store'}
            </button>
          </div>

          {showForm && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingStore ? 'Edit Store' : 'Create New Store'}
              </h2>

              {/* URL Extraction */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Extract Store Info from URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={extractingUrl}
                    onChange={(e) => setExtractingUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleExtractFromUrl}
                    disabled={extracting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {extracting ? 'Extracting...' : 'Extract'}
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Store Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Slug (URL friendly name)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated-from-name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Voucher Text
                  </label>
                  <input
                    type="text"
                    value={formData.voucherText}
                    onChange={(e) => setFormData({ ...formData, voucherText: e.target.value })}
                    placeholder="e.g., 5 Coupons Available"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    {editingStore ? 'Update Store' : 'Create Store'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingStore(null);
                      setFormData({
                        name: '',
                        slug: '',
                        description: '',
                        logoUrl: '',
                        websiteUrl: '',
                        categoryId: '',
                        voucherText: '',
                      });
                    }}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="text-xl font-semibold">Loading stores...</div>
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No stores yet</h3>
              <p className="text-gray-600 mb-6">Create your first store to start adding coupons and deals.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <div key={store.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                  {store.logoUrl && (
                    <div className="mb-4 h-24 relative">
                      <Image
                        src={store.logoUrl}
                        alt={store.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{store.name}</h3>
                  {store.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{store.description}</p>
                  )}
                  {store.voucherText && (
                    <p className="text-green-600 text-sm font-semibold mb-4">{store.voucherText}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(store)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => store.id && handleDelete(store.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}


