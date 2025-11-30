'use client';

import { useEffect, useState } from 'react';
import {
  getRegions,
  createRegion,
  updateRegion,
  deleteRegion,
  Region,
} from '@/lib/services/regionService';
import Link from 'next/link';

export default function RegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Region>>({
    name: '',
    networkId: '',
    description: '',
    isActive: true,
  });

  const fetchRegions = async () => {
    setLoading(true);
    const data = await getRegions();
    setRegions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.networkId) {
      alert('Please fill in all required fields (Name and Network ID)');
      return;
    }

    if (editingId) {
      const result = await updateRegion(editingId, formData);
      if (result.success) {
        alert('Region updated successfully!');
        fetchRegions();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          name: '',
          networkId: '',
          description: '',
          isActive: true,
        });
      } else {
        alert(`Error updating region: ${result.error}`);
      }
    } else {
      const result = await createRegion({
        name: formData.name,
        networkId: formData.networkId,
        description: formData.description || '',
        isActive: formData.isActive !== false,
      });
      if (result.success) {
        alert('Region created successfully!');
        fetchRegions();
        setShowForm(false);
        setFormData({
          name: '',
          networkId: '',
          description: '',
          isActive: true,
        });
      } else {
        alert(`Error creating region: ${result.error}`);
      }
    }
  };

  const handleEdit = (region: Region) => {
    setEditingId(region.id || null);
    setFormData({
      name: region.name,
      networkId: region.networkId,
      description: region.description || '',
      isActive: region.isActive !== false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this region? This will not delete stores using this network ID.')) {
      const result = await deleteRegion(id);
      if (result.success) {
        alert('Region deleted successfully!');
        fetchRegions();
      } else {
        alert(`Error deleting region: ${result.error}`);
      }
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-8">Manage Regions</h1>
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Manage Regions</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/stores"
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Stores
          </Link>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({
                name: '',
                networkId: '',
                description: '',
                isActive: true,
              });
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add Region'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Region' : 'Create New Region'}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">
                Region Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g., North America, Europe, Asia Pacific"
                value={formData.name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                The name of the region (e.g., "North America", "Europe")
              </p>
            </div>

            <div>
              <label htmlFor="networkId" className="block text-gray-700 text-sm font-semibold mb-2">
                Network ID *
              </label>
              <input
                id="networkId"
                name="networkId"
                type="text"
                required
                placeholder="e.g., NET-001, NET-EU-001, NET-AP-001"
                value={formData.networkId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, networkId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Unique network ID for this region. This will be used when creating stores.
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-gray-700 text-sm font-semibold mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Optional description for this region"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive !== false}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-gray-700 text-sm font-semibold">
                Active (visible in dropdowns)
              </label>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingId ? 'Update Region' : 'Create Region'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({
                  name: '',
                  networkId: '',
                  description: '',
                  isActive: true,
                });
              }}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Region Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Network ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {regions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No regions found. Create your first region above.
                  </td>
                </tr>
              ) : (
                regions.map((region) => (
                  <tr key={region.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {region.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        {region.networkId}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {region.description || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          region.isActive !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {region.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(region)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(region.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

