"use client";

import { useEffect, useState } from 'react';
import { getBanners, createBanner, createBannerFromUrl, deleteBanner, updateBanner, Banner } from '@/lib/services/bannerService';
import Image from 'next/image';
import { extractOriginalCloudinaryUrl, isCloudinaryUrl } from '@/lib/utils/cloudinary';

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [title, setTitle] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [imageUrl, setImageUrl] = useState('');
  const [extractedUrl, setExtractedUrl] = useState<string | null>(null);
  const [layoutPosition, setLayoutPosition] = useState<number | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const fetchBanners = async () => {
    setLoading(true);
    const data = await getBanners();
    setBanners(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBanners();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if layout position is already taken
    if (layoutPosition !== null) {
      const bannersAtPosition = banners.filter(
        b => b.id && b.layoutPosition === layoutPosition
      );
      if (bannersAtPosition.length > 0) {
        if (!confirm(`Layout ${layoutPosition} is already assigned to "${bannersAtPosition[0].title}". Replace it?`)) {
          return;
        }
        // Clear position from other banner
        const { updateBanner } = await import('@/lib/services/bannerService');
        await updateBanner(bannersAtPosition[0].id!, { layoutPosition: null });
      }
    }
    
    if (uploadMethod === 'file') {
      if (!imageFile) return;
      const result = await createBanner(title, imageFile, layoutPosition);
      if (result.success) {
        fetchBanners();
        setShowForm(false);
        setTitle('');
        setImageFile(null);
        setImagePreview(null);
        setLayoutPosition(null);
        setFileInputKey(prev => prev + 1);
      }
    } else {
      if (!imageUrl.trim()) return;
      const result = await createBannerFromUrl(title, imageUrl, layoutPosition);
      if (result.success) {
        fetchBanners();
        setShowForm(false);
        setTitle('');
        setImageUrl('');
        setExtractedUrl(null);
        setLayoutPosition(null);
        setFileInputKey(prev => prev + 1);
      }
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    if (isCloudinaryUrl(url)) {
      const extracted = extractOriginalCloudinaryUrl(url);
      setExtractedUrl(extracted);
      setImagePreview(extracted);
    } else {
      setExtractedUrl(null);
      setImagePreview(url);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this banner?')) {
      await deleteBanner(id);
      fetchBanners();
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setImageUrl(banner.imageUrl);
    setLayoutPosition(banner.layoutPosition || null);
    setUploadMethod('url');
    setImageFile(null);
    setImagePreview(banner.imageUrl);
    setExtractedUrl(null);
    setShowForm(false);
  };

  const handleCancelEdit = () => {
    setEditingBanner(null);
    setTitle('');
    setImageUrl('');
    setLayoutPosition(null);
    setImageFile(null);
    setImagePreview(null);
    setExtractedUrl(null);
    setUploadMethod('file');
    setFileInputKey(prev => prev + 1);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner?.id) return;

    // Check if layout position is already taken
    if (layoutPosition !== null) {
      const bannersAtPosition = banners.filter(
        b => b.id !== editingBanner.id && b.layoutPosition === layoutPosition
      );
      if (bannersAtPosition.length > 0) {
        if (!confirm(`Layout ${layoutPosition} is already assigned to "${bannersAtPosition[0].title}". Replace it?`)) {
          return;
        }
        // Clear position from other banner
        await updateBanner(bannersAtPosition[0].id!, { layoutPosition: null });
      }
    }

    // Update banner
    const updates: Partial<Banner> = {
      title,
      layoutPosition,
    };

    // Only update imageUrl if it changed
    if (imageUrl && imageUrl !== editingBanner.imageUrl) {
      const finalUrl = isCloudinaryUrl(imageUrl) ? extractOriginalCloudinaryUrl(imageUrl) : imageUrl;
      updates.imageUrl = finalUrl;
    }

    const result = await updateBanner(editingBanner.id, updates);
    if (result.success) {
      fetchBanners();
      handleCancelEdit();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Banners</h1>
        <button
          onClick={() => {
            if (editingBanner) {
              handleCancelEdit();
            } else {
              setShowForm(!showForm);
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showForm || editingBanner ? 'Cancel' : 'Create New Banner'}
        </button>
      </div>

      {(showForm || editingBanner) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {editingBanner ? 'Edit Banner' : 'Create New Banner'}
          </h2>
          <form onSubmit={editingBanner ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-gray-700 text-sm font-semibold mb-2">Title</label>
              <input
                id="title"
                name="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Banner Title"
                required
              />
            </div>
            
            {!editingBanner && (
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Upload Method</label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="uploadMethod"
                      value="file"
                      checked={uploadMethod === 'file'}
                      onChange={(e) => {
                        setUploadMethod('file');
                        setImageUrl('');
                        setExtractedUrl(null);
                      }}
                      className="mr-2"
                    />
                    File Upload
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="uploadMethod"
                      value="url"
                      checked={uploadMethod === 'url'}
                      onChange={(e) => {
                        setUploadMethod('url');
                        setImageFile(null);
                      }}
                      className="mr-2"
                    />
                    URL (Cloudinary or Direct URL)
                  </label>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="layoutPosition" className="block text-gray-700 text-sm font-semibold mb-2">
                Assign to Layout Position (1-6)
              </label>
              <select
                id="layoutPosition"
                name="layoutPosition"
                value={layoutPosition || ''}
                onChange={(e) => {
                  const position = e.target.value ? parseInt(e.target.value) : null;
                  setLayoutPosition(position);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not Assigned</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((pos) => {
                  const isTaken = banners.some(
                    b => b.layoutPosition === pos && b.id
                  );
                  const takenBy = banners.find(
                    b => b.layoutPosition === pos && b.id
                  );
                  return (
                    <option key={pos} value={pos}>
                      Layout {pos} {isTaken ? `(Currently: ${takenBy?.title})` : ''}
                    </option>
                  );
                })}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Layout 1-4: Hero Section | Layout 5: Spotlight Section (below Popular Coupons, 618×568px recommended) | Layout 6: Categories Page Banner (1728×547px) | Layout 7: About Us Page Banner (1728×547px) | Layout 8-9: About Us Page Images (618×588px recommended) | Layout 10: Stores Page Banner (1728×547px) | Layout 11: FAQs Page Banner (1728×547px)
              </p>
            </div>

            {editingBanner ? (
              <div>
                <label htmlFor="imageUrl" className="block text-gray-700 text-sm font-semibold mb-2">
                  Image URL (Cloudinary URL or Direct URL)
                </label>
                <input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  value={imageUrl || ''}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://res.cloudinary.com/..."
                />
                {extractedUrl && extractedUrl !== imageUrl && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                    <strong>Extracted Original URL:</strong>
                    <div className="mt-1 break-all text-xs">{extractedUrl}</div>
                  </div>
                )}
                {imagePreview && (
                  <div className="mt-2">
                    <Image src={imagePreview} alt="Banner preview" width={300} height={96} className="h-24 object-contain" />
                  </div>
                )}
              </div>
            ) : uploadMethod === 'file' ? (
              <div>
                <label htmlFor="image" className="block text-gray-700 text-sm font-semibold mb-2">Banner Image (PNG/JPG/SVG)</label>
                <input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setImageFile(file);
                    if (file) {
                      setImagePreview(URL.createObjectURL(file));
                    } else {
                      setImagePreview(null);
                    }
                  }}
                  className="w-full"
                  required={uploadMethod === 'file'}
                  key={`file-input-${fileInputKey}`}
                />
                {imagePreview && (
                  <div className="mt-2">
                    <Image src={imagePreview} alt="Banner preview" width={300} height={96} className="h-24 object-contain" />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label htmlFor="imageUrl" className="block text-gray-700 text-sm font-semibold mb-2">
                  Image URL (Cloudinary URL or Direct URL)
                </label>
                <input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  value={imageUrl || ''}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://res.cloudinary.com/..."
                  required={uploadMethod === 'url'}
                />
                {extractedUrl && extractedUrl !== imageUrl && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                    <strong>Extracted Original URL:</strong>
                    <div className="mt-1 break-all text-xs">{extractedUrl}</div>
                  </div>
                )}
                {imagePreview && (
                  <div className="mt-2">
                    <Image src={imagePreview} alt="Banner preview" width={300} height={96} className="h-24 object-contain" />
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                {editingBanner ? 'Update Banner' : 'Create Banner'}
              </button>
              {editingBanner && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading banners...</div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No banners created yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Layout Position</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Image</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner) => (
                  <tr key={banner.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold">{banner.title}</td>
                    <td className="px-6 py-4">
                      <select
                        value={banner.layoutPosition || ''}
                        onChange={async (e) => {
                          const position = e.target.value ? parseInt(e.target.value) : null;
                          
                          // Check if position is already taken
                          if (position !== null) {
                            const bannersAtPosition = banners.filter(
                              b => b.id !== banner.id && b.layoutPosition === position
                            );
                            if (bannersAtPosition.length > 0) {
                              if (!confirm(`Layout ${position} is already assigned to "${bannersAtPosition[0].title}". Replace it?`)) {
                                return;
                              }
                              // Clear position from other banner
                              const { updateBanner } = await import('@/lib/services/bannerService');
                              await updateBanner(bannersAtPosition[0].id!, { layoutPosition: null });
                            }
                          }
                          
                          // Update current banner
                          const { updateBanner } = await import('@/lib/services/bannerService');
                          await updateBanner(banner.id!, { layoutPosition: position });
                          fetchBanners();
                        }}
                        className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Not Assigned</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((pos) => (
                          <option key={pos} value={pos}>
                            Layout {pos}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <Image src={banner.imageUrl} alt={banner.title} width={120} height={64} className="h-16 object-contain" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(banner)}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
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
  );
}
