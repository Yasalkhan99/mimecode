'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getStoreById,
  updateStore,
  Store,
  isSlugUnique,
} from '@/lib/services/storeService';
import { getCategories, Category } from '@/lib/services/categoryService';
import { extractOriginalCloudinaryUrl, isCloudinaryUrl } from '@/lib/utils/cloudinary';

export default function EditStorePage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;

  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Store>>({});
  const [logoUrl, setLogoUrl] = useState('');
  const [extractedLogoUrl, setExtractedLogoUrl] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string>('');
  const [autoGenerateSlug, setAutoGenerateSlug] = useState<boolean>(false);

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  // Validate slug uniqueness
  const validateSlug = async (slug: string): Promise<boolean> => {
    if (!slug || slug.trim() === '') {
      setSlugError('Slug is required');
      return false;
    }
    
    // Check slug format (only lowercase letters, numbers, and hyphens)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugError('Slug can only contain lowercase letters, numbers, and hyphens');
      return false;
    }
    
    const isUnique = await isSlugUnique(slug, storeId);
    if (!isUnique) {
      setSlugError('This slug is already taken. Please use a different one.');
      return false;
    }
    
    setSlugError('');
    return true;
  };

  useEffect(() => {
    const fetchData = async () => {
      const [storeData, categoriesData] = await Promise.all([
        getStoreById(storeId),
        getCategories()
      ]);
      if (storeData) {
        setStore(storeData);
        setFormData(storeData);
        // Check if slug matches auto-generated slug from name
        const autoSlug = generateSlug(storeData.name || '');
        setAutoGenerateSlug(storeData.slug === autoSlug);
        if (storeData.logoUrl) {
          setLogoUrl(storeData.logoUrl);
          if (isCloudinaryUrl(storeData.logoUrl)) {
            setExtractedLogoUrl(extractOriginalCloudinaryUrl(storeData.logoUrl));
          }
        }
      }
      setCategories(categoriesData);
      setLoading(false);
    };
    fetchData();
  }, [storeId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Validate slug
    if (!formData.slug || formData.slug.trim() === '') {
      alert('Please enter a slug for the store');
      setSaving(false);
      return;
    }
    
    const slugValid = await validateSlug(formData.slug);
    if (!slugValid) {
      setSaving(false);
      return;
    }
    
    // Extract original URL if it's a Cloudinary URL
    const logoUrlToSave = logoUrl ? extractOriginalCloudinaryUrl(logoUrl) : undefined;
    const updates = {
      ...formData,
      ...(logoUrlToSave ? { logoUrl: logoUrlToSave } : {}),
    };
    
    const result = await updateStore(storeId, updates);
    if (result.success) {
      router.push('/admin/stores');
    }
    setSaving(false);
  };

  const handleLogoUrlChange = (url: string) => {
    setLogoUrl(url);
    if (isCloudinaryUrl(url)) {
      const extracted = extractOriginalCloudinaryUrl(url);
      setExtractedLogoUrl(extracted);
    } else {
      setExtractedLogoUrl(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading store...</div>;
  }

  if (!store) {
    return <div className="text-center py-12">Store not found</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 font-semibold"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Store</h1>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                Store Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name || ''}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData({ 
                    ...formData, 
                    name,
                    // Auto-generate slug from name only if auto-generate is enabled
                    slug: autoGenerateSlug ? generateSlug(name) : formData.slug
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="subStoreName" className="block text-sm font-semibold text-gray-700 mb-1">
                Sub Store Name (Displayed on store page)
              </label>
              <input
                id="subStoreName"
                name="subStoreName"
                type="text"
                value={formData.subStoreName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, subStoreName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                This name will be displayed on the store page when visiting the store
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="slug" className="block text-sm font-semibold text-gray-700">
                  Slug (URL-friendly name)
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={autoGenerateSlug}
                    onChange={(e) => {
                      const isAuto = e.target.checked;
                      setAutoGenerateSlug(isAuto);
                      // If enabling auto-generate, update slug from name
                      if (isAuto && formData.name) {
                        setFormData({ ...formData, slug: generateSlug(formData.name) });
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span>Auto-generate from name</span>
                </label>
              </div>
              <input
                id="slug"
                name="slug"
                type="text"
                placeholder={autoGenerateSlug ? "Auto-generated from name" : "Enter custom slug (e.g., nike-store)"}
                value={formData.slug || ''}
                onChange={async (e) => {
                  // If auto-generate is enabled, don't allow manual editing
                  if (autoGenerateSlug) return;
                  
                  const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  setFormData({ ...formData, slug });
                  if (slug) {
                    await validateSlug(slug);
                  } else {
                    setSlugError('');
                  }
                }}
                disabled={autoGenerateSlug}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  slugError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                } ${autoGenerateSlug ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                required
              />
              {slugError && (
                <p className="mt-1 text-xs text-red-600">{slugError}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                URL will be: /stores/{formData.slug || 'slug'}
                {autoGenerateSlug && <span className="text-blue-600 ml-2">(Auto-generated)</span>}
              </p>
            </div>
          </div>


          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
            />
          </div>

          <div>
            <label htmlFor="categoryId" className="block text-sm font-semibold text-gray-700 mb-1">
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId || ''}
              onChange={(e) => {
                const categoryId = e.target.value || null;
                setFormData({ ...formData, categoryId });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Assign this store to a category
            </p>
          </div>

          <div>
            <label htmlFor="logoUrl" className="block text-sm font-semibold text-gray-700 mb-1">
              Logo URL (Cloudinary URL or direct URL)
            </label>
            <input
              id="logoUrl"
              name="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => handleLogoUrlChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://res.cloudinary.com/... or https://example.com/logo.png"
            />
            {extractedLogoUrl && extractedLogoUrl !== logoUrl && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                <strong>Extracted Original URL:</strong>
                <div className="mt-1 break-all text-xs">{extractedLogoUrl}</div>
              </div>
            )}
            {logoUrl && (
              <div className="mt-2">
                <img src={extractedLogoUrl || logoUrl} alt="Logo preview" className="h-16 object-contain" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                id="isTrending"
                name="isTrending"
                type="checkbox"
                checked={formData.isTrending || false}
                onChange={(e) => {
                  const isTrending = e.target.checked;
                  setFormData({ 
                    ...formData, 
                    isTrending,
                    // Clear layout position if trending is disabled
                    layoutPosition: isTrending ? formData.layoutPosition : null
                  });
                }}
                className="w-4 h-4 rounded mr-2"
              />
              <label htmlFor="isTrending" className="text-gray-700">
                Mark as Trending
              </label>
            </div>

            <div>
              <label htmlFor="layoutPosition" className="block text-sm font-semibold text-gray-700 mb-1">
                Layout Position (1-8)
              </label>
              <select
                id="layoutPosition"
                name="layoutPosition"
                value={formData.layoutPosition || ''}
                onChange={(e) => {
                  const position = e.target.value ? parseInt(e.target.value) : null;
                  setFormData({ 
                    ...formData, 
                    layoutPosition: position,
                    // Auto-enable trending if layout position is assigned
                    isTrending: position !== null ? true : formData.isTrending
                  });
                }}
                disabled={!formData.isTrending && !formData.layoutPosition}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not Assigned</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => (
                  <option key={pos} value={pos}>
                    Layout {pos}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

