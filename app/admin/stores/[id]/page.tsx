'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getStoreById,
  updateStore,
  Store,
} from '@/lib/services/storeService';
import { extractOriginalCloudinaryUrl, isCloudinaryUrl } from '@/lib/utils/cloudinary';

export default function EditStorePage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Store>>({});
  const [logoUrl, setLogoUrl] = useState('');
  const [extractedLogoUrl, setExtractedLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchStore = async () => {
      const data = await getStoreById(storeId);
      if (data) {
        setStore(data);
        setFormData(data);
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
          if (isCloudinaryUrl(data.logoUrl)) {
            setExtractedLogoUrl(extractOriginalCloudinaryUrl(data.logoUrl));
          }
        }
      }
      setLoading(false);
    };
    fetchStore();
  }, [storeId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
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
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="voucherText" className="block text-sm font-semibold text-gray-700 mb-1">
                Voucher Text (e.g., Upto 58% Voucher)
              </label>
              <input
                id="voucherText"
                name="voucherText"
                type="text"
                value={formData.voucherText || ''}
                onChange={(e) =>
                  setFormData({ ...formData, voucherText: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Upto 58% Voucher"
              />
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

