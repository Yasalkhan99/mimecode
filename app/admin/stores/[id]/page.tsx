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
import { getActiveRegions, Region } from '@/lib/services/regionService';
import {
  getStoreFAQs,
  createStoreFAQ,
  updateStoreFAQ,
  deleteStoreFAQ,
  StoreFAQ,
} from '@/lib/services/storeFaqService';
import { extractOriginalCloudinaryUrl, isCloudinaryUrl } from '@/lib/utils/cloudinary';

export default function EditStorePage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;

  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Store>>({});
  const [logoUrl, setLogoUrl] = useState('');
  const [extractedLogoUrl, setExtractedLogoUrl] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string>('');
  const [autoGenerateSlug, setAutoGenerateSlug] = useState<boolean>(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [extractingLogo, setExtractingLogo] = useState(false);
  const [logoUploadMethod, setLogoUploadMethod] = useState<'url' | 'file'>('url');
  const [storeFaqs, setStoreFaqs] = useState<StoreFAQ[]>([]);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqFormData, setFaqFormData] = useState<Partial<StoreFAQ>>({
    question: '',
    answer: '',
    order: 0,
    isActive: true,
  });

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
      const [storeData, categoriesData, regionsData] = await Promise.all([
        getStoreById(storeId),
        getCategories(),
        getActiveRegions()
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
      setRegions(regionsData);

      // Fetch store FAQs
      if (storeData) {
        const faqsData = await getStoreFAQs(storeId);
        setStoreFaqs(faqsData);
      }

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
    let logoUrlToSave = logoUrl ? extractOriginalCloudinaryUrl(logoUrl) : undefined;
    
    // If no logo URL is provided, use a default placeholder
    if (!logoUrlToSave || logoUrlToSave.trim() === '') {
      // Default placeholder image
      logoUrlToSave = 'https://www.iconpacks.net/icons/2/free-store-icon-2017-thumb.png';
    }
    
    const updates = {
      ...formData,
      logoUrl: logoUrlToSave,
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

  const handleExtractLogoFromUrl = async () => {
    if (!logoUrl.trim()) {
      alert('Please enter a URL in the Logo URL field');
      return;
    }

    // Check if it's already a direct image URL
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];
    const isDirectImageUrl = imageExtensions.some(ext => 
      logoUrl.toLowerCase().includes(ext)
    );

    if (isDirectImageUrl) {
      // If it's already an image URL, just use it
      handleLogoUrlChange(logoUrl);
      return;
    }

    setExtractingLogo(true);
    try {
      // Extract all metadata from the URL (same as store extraction)
      const response = await fetch('/api/stores/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: logoUrl }),
      });

      const data = await response.json();

      if (data.success) {
        // Only populate the logo field, even though we extracted all info
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
          handleLogoUrlChange(data.logoUrl);
          alert('Logo extracted successfully!');
        } else {
          alert('Logo extracted but no logo URL found on this page. You may need to enter a direct image URL.');
        }
      } else {
        alert(`Failed to extract logo: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error extracting logo:', error);
      alert('Failed to extract logo. Please check the URL and try again.');
    } finally {
      setExtractingLogo(false);
    }
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (1 MB = 1048576 bytes)
    const maxSize = 1048576; // 1 MB
    if (file.size > maxSize) {
      alert(`File size exceeds 1 MB limit. Your file is ${(file.size / 1048576).toFixed(2)} MB. Please choose a smaller file.`);
      e.target.value = ''; // Clear the input
      return;
    }

    // Check if it's an image file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, SVG, etc.)');
      e.target.value = ''; // Clear the input
      return;
    }

    setLogoFile(file);
    setUploadingLogo(true);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1]; // Remove data URL prefix
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload to Cloudinary
      const uploadResponse = await fetch('/api/stores/upload-cloudinary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || 'image/png',
          base64: base64,
        }),
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.success && uploadData.logoUrl) {
        // Set the Cloudinary URL
        setLogoUrl(uploadData.logoUrl);
        handleLogoUrlChange(uploadData.logoUrl);
        alert('✅ Logo uploaded to Cloudinary successfully!');
      } else {
        alert(`Upload failed: ${uploadData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert(`Error uploading: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingLogo(false);
      e.target.value = ''; // Clear the input after upload
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Edit Store</h1>
          <a
            href="#store-faqs"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold text-sm"
          >
            Manage Store FAQs ↓
          </a>
        </div>

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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${slugError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
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
              Description <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              rows={4}
            />
          </div>

          <div>
            <label htmlFor="voucherText" className="block text-sm font-semibold text-gray-700 mb-1">
              Voucher Text
            </label>
            <input
              id="voucherText"
              name="voucherText"
              type="text"
              placeholder="e.g., Upto 58% Voucher, Get 20% Off, etc."
              value={formData.voucherText || ''}
              onChange={(e) =>
                setFormData({ ...formData, voucherText: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">
              Voucher text that will be displayed on the store card
            </p>
          </div>

          {/* Detailed Store Info Fields */}
          <div className="border-t border-gray-300 pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Detailed Store Information</h3>

            <div>
              <label htmlFor="websiteUrl" className="block text-sm font-semibold text-gray-700 mb-1">
                Website URL
              </label>
              <input
                id="websiteUrl"
                name="websiteUrl"
                type="url"
                placeholder="https://example.com"
                value={formData.websiteUrl || ''}
                onChange={(e) =>
                  setFormData({ ...formData, websiteUrl: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="aboutText" className="block text-sm font-semibold text-gray-700 mb-1">
                About Text (Detailed)
              </label>
              <textarea
                id="aboutText"
                name="aboutText"
                value={formData.aboutText || ''}
                onChange={(e) =>
                  setFormData({ ...formData, aboutText: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={6}
                placeholder="Detailed about section for Store Info tab..."
              />
            </div>

            <div>
              <label htmlFor="whyTrustUs" className="block text-sm font-semibold text-gray-700 mb-1">
                Why Trust Us Section
              </label>
              <textarea
                id="whyTrustUs"
                name="whyTrustUs"
                value={formData.whyTrustUs || ''}
                onChange={(e) =>
                  setFormData({ ...formData, whyTrustUs: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={6}
                placeholder="Why should customers trust this store? Enter custom content here..."
              />
              <p className="mt-1 text-xs text-gray-500">
                This will appear in the sidebar "Why Trust Us?" section. Leave blank to use default content.
              </p>
            </div>

            <div>
              <label htmlFor="moreInformation" className="block text-sm font-semibold text-gray-700 mb-1">
                More Information Section
              </label>
              <textarea
                id="moreInformation"
                name="moreInformation"
                value={formData.moreInformation || ''}
                onChange={(e) =>
                  setFormData({ ...formData, moreInformation: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={8}
                placeholder="Enter detailed information about the store, coupons, how to use them, etc. You can use HTML tags for formatting."
              />
              <p className="mt-1 text-xs text-gray-500">
                This will appear in the "More Information On [Store Name] Coupons" section. Supports HTML formatting. Leave blank to use default content.
              </p>
            </div>

            <div>
              <label htmlFor="seoTitle" className="block text-sm font-semibold text-gray-700 mb-1">
                SEO Page Title
              </label>
              <input
                id="seoTitle"
                name="seoTitle"
                type="text"
                value={formData.seoTitle || ''}
                onChange={(e) =>
                  setFormData({ ...formData, seoTitle: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Best Nike Shoes Coupons & Deals 2024 - Save Up to 70%"
                maxLength={60}
              />
              <p className="mt-1 text-xs text-gray-500">
                Optimized title for search engines (shown in browser tab). Max 60 characters. Leave blank to use default: "[Store Name] Coupons & Deals - MimeCode"
              </p>
            </div>

            <div>
              <label htmlFor="seoDescription" className="block text-sm font-semibold text-gray-700 mb-1">
                SEO Meta Description
              </label>
              <textarea
                id="seoDescription"
                name="seoDescription"
                value={formData.seoDescription || ''}
                onChange={(e) =>
                  setFormData({ ...formData, seoDescription: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={3}
                placeholder="Get the latest Nike coupons, promo codes & deals. Save up to 70% on shoes, clothing & accessories. Verified daily!"
                maxLength={160}
              />
              <p className="mt-1 text-xs text-gray-500">
                Description shown in search results. Max 160 characters. Should include keywords and call-to-action.
              </p>
            </div>

            <div>
              <label htmlFor="features" className="block text-sm font-semibold text-gray-700 mb-1">
                Features (One per line)
              </label>
              <textarea
                id="features"
                name="features"
                value={formData.features ? formData.features.join('\n') : ''}
                onChange={(e) => {
                  const features = e.target.value.split('\n').filter(f => f.trim() !== '');
                  setFormData({ ...formData, features });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={4}
                placeholder="Free Shipping&#10;24/7 Support&#10;Easy Returns"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter one feature per line
              </p>
            </div>

            <div>
              <label htmlFor="shippingInfo" className="block text-sm font-semibold text-gray-700 mb-1">
                Shipping Information
              </label>
              <textarea
                id="shippingInfo"
                name="shippingInfo"
                value={formData.shippingInfo || ''}
                onChange={(e) =>
                  setFormData({ ...formData, shippingInfo: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={4}
                placeholder="Shipping information..."
              />
            </div>

            <div>
              <label htmlFor="returnPolicy" className="block text-sm font-semibold text-gray-700 mb-1">
                Return Policy
              </label>
              <textarea
                id="returnPolicy"
                name="returnPolicy"
                value={formData.returnPolicy || ''}
                onChange={(e) =>
                  setFormData({ ...formData, returnPolicy: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={4}
                placeholder="Return policy information..."
              />
            </div>

            <div>
              <label htmlFor="contactInfo" className="block text-sm font-semibold text-gray-700 mb-1">
                Contact Information
              </label>
              <textarea
                id="contactInfo"
                name="contactInfo"
                value={formData.contactInfo || ''}
                onChange={(e) =>
                  setFormData({ ...formData, contactInfo: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={3}
                placeholder="Contact information..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="establishedYear" className="block text-sm font-semibold text-gray-700 mb-1">
                  Established Year
                </label>
                <input
                  id="establishedYear"
                  name="establishedYear"
                  type="number"
                  min="1900"
                  max="2099"
                  placeholder="2020"
                  value={formData.establishedYear || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, establishedYear: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="headquarters" className="block text-sm font-semibold text-gray-700 mb-1">
                  Headquarters
                </label>
                <input
                  id="headquarters"
                  name="headquarters"
                  type="text"
                  placeholder="New York, USA"
                  value={formData.headquarters || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, headquarters: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="trustScore" className="block text-sm font-semibold text-gray-700 mb-1">
                  Trust Score (0-100)
                </label>
                <input
                  id="trustScore"
                  name="trustScore"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="85"
                  value={formData.trustScore || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, trustScore: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rating" className="block text-sm font-semibold text-gray-700 mb-1">
                  Rating (0.0 - 5.0)
                </label>
                <input
                  id="rating"
                  name="rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="4.5"
                  value={formData.rating || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, rating: e.target.value ? parseFloat(e.target.value) : undefined })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Store rating displayed as stars (e.g., 4.5 = 4.5 stars)
                </p>
              </div>

              <div>
                <label htmlFor="reviewCount" className="block text-sm font-semibold text-gray-700 mb-1">
                  Review Count
                </label>
                <input
                  id="reviewCount"
                  name="reviewCount"
                  type="number"
                  min="0"
                  placeholder="123"
                  value={formData.reviewCount || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, reviewCount: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Number of reviews (e.g., "123 reviews")
                </p>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="networkId" className="block text-sm font-semibold text-gray-700 mb-1">
              Network ID (Region)
            </label>
            <select
              id="networkId"
              name="networkId"
              value={formData.networkId || ''}
              onChange={(e) =>
                setFormData({ ...formData, networkId: e.target.value || undefined })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">No Network ID</option>
              {regions.map((region) => (
                <option key={region.id} value={region.networkId}>
                  {region.name} ({region.networkId})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Select the region/network ID for this store. <a href="/admin/regions" target="_blank" className="text-blue-600 hover:underline">Manage regions</a>
            </p>
          </div>

          <div>
            <label htmlFor="affiliateFallbackUrl" className="block text-sm font-semibold text-gray-700 mb-1">
              Affiliate Fallback URL
            </label>
            <input
              id="affiliateFallbackUrl"
              name="affiliateFallbackUrl"
              type="url"
              placeholder="https://example.com/affiliate-link"
              value={formData.affiliateFallbackUrl || ''}
              onChange={(e) =>
                setFormData({ ...formData, affiliateFallbackUrl: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">
              This URL will be used when a coupon has no code or deal URL. Used for affiliate redirections.
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Logo Upload Method
            </label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="logoUploadMethod"
                  value="url"
                  checked={logoUploadMethod === 'url'}
                  onChange={(e) => {
                    setLogoUploadMethod('url');
                    setLogoFile(null);
                  }}
                  className="mr-2"
                />
                URL / Extract from Website
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="logoUploadMethod"
                  value="file"
                  checked={logoUploadMethod === 'file'}
                  onChange={(e) => {
                    setLogoUploadMethod('file');
                    setLogoUrl('');
                  }}
                  className="mr-2"
                />
                Upload File (Max 1 MB)
              </label>
            </div>

            {logoUploadMethod === 'url' ? (
              <>
                <label htmlFor="logoUrl" className="block text-sm font-semibold text-gray-700 mb-1">
                  Logo URL (Cloudinary URL, direct image URL, or website URL to extract logo)
                </label>
                <div className="flex gap-2">
                  <input
                    id="logoUrl"
                    name="logoUrl"
                    type="url"
                    value={logoUrl}
                    onChange={(e) => handleLogoUrlChange(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="https://res.cloudinary.com/... or https://example.com/logo.png or https://example.com"
                  />
                  <button
                    type="button"
                    onClick={handleExtractLogoFromUrl}
                    disabled={extractingLogo || !logoUrl.trim()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {extractingLogo ? 'Extracting...' : 'Extract Logo'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter a direct image URL, Cloudinary URL, or a website URL to automatically extract the logo
                </p>
              </>
            ) : (
              <>
                <label htmlFor="logoFile" className="block text-sm font-semibold text-gray-700 mb-1">
                  Upload Logo File
                </label>
                <input
                  id="logoFile"
                  name="logoFile"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/gif"
                  onChange={handleLogoFileChange}
                  disabled={uploadingLogo}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {uploadingLogo && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Uploading to Cloudinary...</span>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Select an image file (PNG, JPG, SVG, WebP, or GIF). Maximum file size: 1 MB. The file will be uploaded to Cloudinary and the URL will be automatically filled.
                </p>
              </>
            )}

            {extractedLogoUrl && extractedLogoUrl !== logoUrl && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                <strong>Extracted Original URL:</strong>
                <div className="mt-1 break-all text-xs">{extractedLogoUrl}</div>
              </div>
            )}
            {logoUrl && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">Logo Preview:</p>
                <div className="flex items-center justify-start py-2">
                  <img 
                    src={extractedLogoUrl || logoUrl} 
                    alt="Logo preview" 
                    className="max-h-24 max-w-full object-contain"
                  />
                </div>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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

        {/* Store FAQ Management Section */}
        <div id="store-faqs" className="bg-white rounded-lg border border-gray-200 p-6 mt-8 scroll-mt-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Store FAQs</h2>
              <p className="text-sm text-gray-600 mt-1">Manage FAQs specific to this store</p>
            </div>
            <button
              onClick={() => {
                setShowFaqForm(true);
                setEditingFaqId(null);
                setFaqFormData({
                  question: '',
                  answer: '',
                  order: storeFaqs.length,
                  isActive: true,
                });
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Add FAQ
            </button>
          </div>

          {/* FAQ Form */}
          {showFaqForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {editingFaqId ? 'Edit FAQ' : 'Add New FAQ'}
              </h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!faqFormData.question || !faqFormData.answer) {
                    alert('Please fill in question and answer');
                    return;
                  }

                  if (editingFaqId) {
                    const result = await updateStoreFAQ(editingFaqId, faqFormData);
                    if (result.success) {
                      alert('FAQ updated successfully!');
                      const faqsData = await getStoreFAQs(storeId);
                      setStoreFaqs(faqsData);
                      setShowFaqForm(false);
                      setEditingFaqId(null);
                      setFaqFormData({ question: '', answer: '', order: 0, isActive: true });
                    }
                  } else {
                    const result = await createStoreFAQ({
                      storeId,
                      question: faqFormData.question,
                      answer: faqFormData.answer,
                      order: faqFormData.order || 0,
                      isActive: faqFormData.isActive !== false,
                    });
                    if (result.success) {
                      alert('FAQ created successfully!');
                      const faqsData = await getStoreFAQs(storeId);
                      setStoreFaqs(faqsData);
                      setShowFaqForm(false);
                      setFaqFormData({ question: '', answer: '', order: 0, isActive: true });
                    }
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Question
                  </label>
                  <input
                    type="text"
                    value={faqFormData.question || ''}
                    onChange={(e) => setFaqFormData({ ...faqFormData, question: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Answer
                  </label>
                  <textarea
                    value={faqFormData.answer || ''}
                    onChange={(e) => setFaqFormData({ ...faqFormData, answer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    rows={4}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Order
                    </label>
                    <input
                      type="number"
                      value={faqFormData.order || 0}
                      onChange={(e) => setFaqFormData({ ...faqFormData, order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <input
                      type="checkbox"
                      checked={faqFormData.isActive !== false}
                      onChange={(e) => setFaqFormData({ ...faqFormData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded mr-2"
                    />
                    <label className="text-gray-700">Active</label>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    {editingFaqId ? 'Update FAQ' : 'Create FAQ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFaqForm(false);
                      setEditingFaqId(null);
                      setFaqFormData({ question: '', answer: '', order: 0, isActive: true });
                    }}
                    className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* FAQs List */}
          {storeFaqs.length > 0 ? (
            <div className="space-y-4">
              {storeFaqs.map((faq) => (
                <div key={faq.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{faq.question}</h4>
                        {!faq.isActive && (
                          <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded">Inactive</span>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm">{faq.answer}</p>
                      <p className="text-xs text-gray-500 mt-2">Order: {faq.order || 0}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={async () => {
                          setEditingFaqId(faq.id || null);
                          setFaqFormData({
                            question: faq.question,
                            answer: faq.answer,
                            order: faq.order || 0,
                            isActive: faq.isActive,
                          });
                          setShowFaqForm(true);
                        }}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this FAQ?')) {
                            const result = await deleteStoreFAQ(faq.id!);
                            if (result.success) {
                              alert('FAQ deleted successfully!');
                              const faqsData = await getStoreFAQs(storeId);
                              setStoreFaqs(faqsData);
                            }
                          }
                        }}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No FAQs added yet. Click "Add FAQ" to create one.</p>
          )}
        </div>
      </div>
    </div>
  );
}

