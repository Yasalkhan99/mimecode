'use client';

import { useEffect, useState } from 'react';
import {
  getLogos,
  createLogoFromUrl,
  updateLogo,
  deleteLogo,
  Logo,
} from '@/lib/services/logoService';
import { extractOriginalCloudinaryUrl, isCloudinaryUrl } from '@/lib/utils/cloudinary';

export default function LogosPage() {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Logo>>({
    name: '',
    logoUrl: '',
    websiteUrl: '',
    layoutPosition: null,
  });
  const [logoUrl, setLogoUrl] = useState('');
  const [extractedLogoUrl, setExtractedLogoUrl] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [extracting, setExtracting] = useState(false);

  const fetchLogos = async () => {
    setLoading(true);
    const data = await getLogos();
    setLogos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogos();
  }, []);

  const handleExtractFromUrl = async () => {
    if (!websiteUrl.trim()) {
      alert('Please enter a website URL');
      return;
    }

    setExtracting(true);
    try {
      const response = await fetch('/api/stores/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
          handleLogoUrlChange(data.logoUrl);
        }
        
        // Auto-populate form fields
        setFormData({
          ...formData,
          name: data.name || formData.name || '',
          logoUrl: data.logoUrl || formData.logoUrl || '',
          websiteUrl: data.siteUrl || websiteUrl || formData.websiteUrl || '',
        });

        // Show success message
        alert(`Successfully extracted logo from ${data.name || 'the website'}!`);
      } else {
        alert(`Failed to extract metadata: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error extracting metadata:', error);
      alert('Failed to extract metadata. Please check the URL and try again.');
    } finally {
      setExtracting(false);
    }
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use extracted logoUrl if available, otherwise use manually entered logoUrl
    const finalLogoUrl = logoUrl || formData.logoUrl || '';
    
    if (!finalLogoUrl.trim()) {
      alert('Please enter a logo URL or extract from website URL');
      return;
    }
    
    // Check if layout position is already taken
    if (formData.layoutPosition !== null) {
      const logosAtPosition = logos.filter(
        l => l.id && l.layoutPosition === formData.layoutPosition
      );
      if (logosAtPosition.length > 0) {
        if (!confirm(`Layout ${formData.layoutPosition} is already assigned to "${logosAtPosition[0].name}". Replace it?`)) {
          return;
        }
        // Clear position from other logo
        await updateLogo(logosAtPosition[0].id!, { layoutPosition: null });
      }
    }
    
    const result = await createLogoFromUrl(
      formData.name || '',
      finalLogoUrl,
      formData.layoutPosition !== undefined ? formData.layoutPosition : null,
      formData.websiteUrl || websiteUrl || ''
    );
    
    if (result.success) {
      fetchLogos();
      setShowForm(false);
      setFormData({
        name: '',
        logoUrl: '',
        websiteUrl: '',
        layoutPosition: null,
      });
      setLogoUrl('');
      setWebsiteUrl('');
      setExtractedLogoUrl(null);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this logo?')) {
      await deleteLogo(id);
      fetchLogos();
    }
  };

  const handleAssignLayoutPosition = async (logo: Logo, position: number | null) => {
    if (!logo.id) return;
    
    // Check if position is already taken by another logo
    if (position !== null) {
      const logosAtPosition = logos.filter(
        l => l.id !== logo.id && l.layoutPosition === position
      );
      if (logosAtPosition.length > 0) {
        if (!confirm(`Layout ${position} is already assigned to "${logosAtPosition[0].name}". Replace it?`)) {
          return;
        }
        // Clear position from other logo
        await updateLogo(logosAtPosition[0].id!, { layoutPosition: null });
      }
    }
    
    await updateLogo(logo.id, { layoutPosition: position });
    fetchLogos();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Logos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'Cancel' : 'Create New Logo'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Create New Logo
          </h2>
          
          {/* URL Extraction Section */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label htmlFor="websiteUrl" className="block text-gray-700 text-sm font-semibold mb-2">
              Extract Logo from Website URL (e.g., nike.com, amazon.com)
            </label>
            <div className="flex gap-2">
              <input
                id="websiteUrl"
                name="websiteUrl"
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="Enter website URL (e.g., nike.com or https://nike.com)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleExtractFromUrl}
                disabled={extracting || !websiteUrl.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {extracting ? 'Extracting...' : 'Extract Logo'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              This will automatically extract logo and company name from the website.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">
                Company/Logo Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Company Name (e.g., Nike)"
                value={formData.name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="logoUrl" className="block text-gray-700 text-sm font-semibold mb-2">
                Logo URL (Cloudinary URL or Direct URL)
              </label>
              <input
                id="logoUrl"
                name="logoUrl"
                type="url"
                value={logoUrl}
                onChange={(e) => handleLogoUrlChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://res.cloudinary.com/... or https://example.com/logo.png"
                required
              />
              {extractedLogoUrl && extractedLogoUrl !== logoUrl && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                  <strong>Extracted Original URL:</strong>
                  <div className="mt-1 break-all text-xs">{extractedLogoUrl}</div>
                </div>
              )}
              {logoUrl && (
                <div className="mt-2">
                  <img
                    src={extractedLogoUrl || logoUrl}
                    alt="Logo preview"
                    className="h-16 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="layoutPosition" className="block text-gray-700 text-sm font-semibold mb-2">
                Assign to Layout Position (1-18)
              </label>
              <select
                id="layoutPosition"
                name="layoutPosition"
                value={formData.layoutPosition || ''}
                onChange={(e) => {
                  const position = e.target.value ? parseInt(e.target.value) : null;
                  setFormData({ ...formData, layoutPosition: position });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not Assigned</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((pos) => {
                  const isTaken = logos.some(
                    l => l.layoutPosition === pos && l.id
                  );
                  const takenBy = logos.find(
                    l => l.layoutPosition === pos && l.id
                  );
                  return (
                    <option key={pos} value={pos}>
                      Layout {pos} {isTaken ? `(Currently: ${takenBy?.name})` : ''}
                    </option>
                  );
                })}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Logos will be displayed in a grid layout on the homepage. Position 1-18 represents the order in the grid.
              </p>
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Create Logo
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading logos...</div>
      ) : logos.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No logos created yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Logo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Website URL</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Layout Position</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logos.map((logo) => (
                  <tr key={logo.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {logo.logoUrl ? (
                        <img
                          src={logo.logoUrl}
                          alt={logo.name}
                          className="h-12 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-500">{logo.name.charAt(0)}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold">{logo.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {logo.websiteUrl ? (
                        <a href={logo.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                          {logo.websiteUrl}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={logo.layoutPosition || ''}
                        onChange={(e) => {
                          const position = e.target.value ? parseInt(e.target.value) : null;
                          handleAssignLayoutPosition(logo, position);
                        }}
                        className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Not Assigned</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((pos) => (
                          <option key={pos} value={pos}>
                            Layout {pos}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        onClick={() => handleDelete(logo.id)}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
                      >
                        Delete
                      </button>
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

