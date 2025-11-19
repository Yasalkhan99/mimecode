'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getCouponById,
  updateCoupon,
  Coupon,
} from '@/lib/services/couponService';
import { getCategories, Category } from '@/lib/services/categoryService';
import { extractOriginalCloudinaryUrl, isCloudinaryUrl } from '@/lib/utils/cloudinary';

export default function EditCouponPage() {
  const params = useParams();
  const router = useRouter();
  const couponId = params.id as string;

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Coupon>>({});
  const [logoUrl, setLogoUrl] = useState('');
  const [extractedLogoUrl, setExtractedLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [couponData, categoriesData] = await Promise.all([
        getCouponById(couponId),
        getCategories()
      ]);
      if (couponData) {
        setCoupon(couponData);
        setFormData(couponData);
        if (couponData.logoUrl) {
          setLogoUrl(couponData.logoUrl);
          if (isCloudinaryUrl(couponData.logoUrl)) {
            setExtractedLogoUrl(extractOriginalCloudinaryUrl(couponData.logoUrl));
          }
        }
      }
      setCategories(categoriesData);
      setLoading(false);
    };
    fetchData();
  }, [couponId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Extract original URL if it's a Cloudinary URL
    const logoUrlToSave = logoUrl ? extractOriginalCloudinaryUrl(logoUrl) : undefined;
    const updates = {
      ...formData,
      ...(logoUrlToSave ? { logoUrl: logoUrlToSave } : {}),
    };
    
    const result = await updateCoupon(couponId, updates);
    if (result.success) {
      router.push('/admin/coupons');
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
    return <div className="text-center py-12">Loading coupon...</div>;
  }

  if (!coupon) {
    return <div className="text-center py-12">Coupon not found</div>;
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
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Coupon</h1>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-1">
                Coupon Code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                value={formData.code || ''}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="storeName" className="block text-sm font-semibold text-gray-700 mb-1">
                Store Name (Displayed on coupon card)
              </label>
              <input
                id="storeName"
                name="storeName"
                type="text"
                placeholder="Store/Brand Name (e.g., Nike)"
                value={formData.storeName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, storeName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                This name will be displayed on the coupon card instead of the coupon code
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="discount" className="block text-sm font-semibold text-gray-700 mb-1">
                Discount Value
              </label>
              <input
                id="discount"
                name="discount"
                type="number"
                value={formData.discount || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount: parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="discountType" className="block text-sm font-semibold text-gray-700 mb-1">
                Discount Type
              </label>
              <select
                id="discountType"
                name="discountType"
                value={formData.discountType || 'percentage'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountType: e.target.value as 'percentage' | 'fixed',
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (AED)</option>
              </select>
            </div>

            <div>
              <label htmlFor="maxUses" className="block text-sm font-semibold text-gray-700 mb-1">
                Max Uses
              </label>
              <input
                id="maxUses"
                name="maxUses"
                type="number"
                value={formData.maxUses || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxUses: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="currentUses" className="block text-sm font-semibold text-gray-700 mb-1">
              Current Uses
            </label>
            <input
              id="currentUses"
              name="currentUses"
              type="number"
              value={formData.currentUses || 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  currentUses: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
            />
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-semibold text-gray-700 mb-1">
              Coupon URL (Where user should be redirected when clicking "Get Deal")
            </label>
            <input
              id="url"
              name="url"
              type="url"
              placeholder="https://example.com/coupon-page"
              value={formData.url || ''}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              When user clicks "Get Deal", they will be redirected to this URL and the coupon code will be revealed.
            </p>
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
              Assign this coupon to a category
            </p>
          </div>

          <div>
            <label htmlFor="logoUrl" className="block text-sm font-semibold text-gray-700 mb-1">
              Logo URL (Cloudinary URL)
            </label>
            <input
              id="logoUrl"
              name="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => handleLogoUrlChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://res.cloudinary.com/..."
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive || false}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 rounded mr-2"
              />
              <label htmlFor="isActive" className="text-gray-700">
                Active
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="isLatest"
                name="isLatest"
                type="checkbox"
                checked={formData.isLatest || false}
                onChange={(e) => {
                  const isLatest = e.target.checked;
                  setFormData({ 
                    ...formData, 
                    isLatest,
                    // Clear layout position if latest is disabled
                    latestLayoutPosition: isLatest ? formData.latestLayoutPosition : null
                  });
                }}
                className="w-4 h-4 rounded mr-2"
              />
              <label htmlFor="isLatest" className="text-gray-700">
                Mark as Latest
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="isPopular"
                name="isPopular"
                type="checkbox"
                checked={formData.isPopular || false}
                onChange={(e) => {
                  const isPopular = e.target.checked;
                  setFormData({ 
                    ...formData, 
                    isPopular,
                    // Clear layout position if popular is disabled
                    layoutPosition: isPopular ? formData.layoutPosition : null
                  });
                }}
                className="w-4 h-4 rounded mr-2"
              />
              <label htmlFor="isPopular" className="text-gray-700">
                Mark as Popular
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="latestLayoutPosition" className="block text-sm font-semibold text-gray-700 mb-1">
                Latest Coupons Layout Position (1-8)
              </label>
              <select
                id="latestLayoutPosition"
                name="latestLayoutPosition"
                value={formData.latestLayoutPosition || ''}
                onChange={(e) => {
                  const position = e.target.value ? parseInt(e.target.value) : null;
                  setFormData({ 
                    ...formData, 
                    latestLayoutPosition: position,
                    // Auto-enable latest if layout position is assigned
                    isLatest: position !== null ? true : formData.isLatest
                  });
                }}
                disabled={!formData.isLatest && !formData.latestLayoutPosition}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not Assigned</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => (
                  <option key={pos} value={pos}>
                    Layout {pos}
                  </option>
                ))}
              </select>
              {!formData.isLatest && !formData.latestLayoutPosition && (
                <p className="mt-1 text-xs text-gray-400">Enable "Mark as Latest" or select a layout position</p>
              )}
            </div>

            <div>
              <label htmlFor="layoutPosition" className="block text-sm font-semibold text-gray-700 mb-1">
                Popular Coupons Layout Position (1-8)
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
                    // Auto-enable popular if layout position is assigned
                    isPopular: position !== null ? true : formData.isPopular
                  });
                }}
                disabled={!formData.isPopular && !formData.layoutPosition}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not Assigned</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => (
                  <option key={pos} value={pos}>
                    Layout {pos}
                  </option>
                ))}
              </select>
              {!formData.isPopular && !formData.layoutPosition && (
                <p className="mt-1 text-xs text-gray-400">Enable "Mark as Popular" or select a layout position</p>
              )}
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
