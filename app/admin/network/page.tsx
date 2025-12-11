'use client';

import { useEffect, useState } from 'react';
import type { Store } from '@/lib/services/storeService';
import { getStores } from '@/lib/services/storeService';
import type { Region } from '@/lib/services/regionService';
import { getRegions, createRegion } from '@/lib/services/regionService';

interface NetworkRow {
  networkId: string;
  networkName: string;
  networkUrl: string;
}

export default function NetworkPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewNetworkForm, setShowNewNetworkForm] = useState(false);
  const [newNetworkName, setNewNetworkName] = useState('');
  const [newNetworkUrl, setNewNetworkUrl] = useState('');
  const [creating, setCreating] = useState(false);

  const pageSize = 22;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Admin - Networks';
    }

    const fetchData = async () => {
      try {
        const [storesData, regionsData] = await Promise.all([getStores(), getRegions()]);
        setStores(storesData || []);
        setRegions(regionsData || []);
      } catch (error) {
        console.error('Error loading network data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Build unique list of networks from regions and stores
  const networkRows: NetworkRow[] = (() => {
    const networkIdSet = new Set<string>();
    const urlByNetworkId: Record<string, string> = {};

    // Collect from stores (for URLs)
    stores.forEach((store) => {
      if (!store.networkId) return;
      const id = store.networkId;
      networkIdSet.add(id);
      if (!urlByNetworkId[id] && store.websiteUrl) {
        urlByNetworkId[id] = store.websiteUrl;
      }
    });

    // Collect from regions (for IDs/names, and fallback URL via description)
    regions.forEach((region) => {
      if (!region.networkId) return;
      networkIdSet.add(region.networkId);
      if (!urlByNetworkId[region.networkId] && region.description) {
        urlByNetworkId[region.networkId] = region.description;
      }
    });

    const rows: NetworkRow[] = Array.from(networkIdSet).map((networkId) => {
      const region = regions.find((r) => r.networkId === networkId);
      return {
        networkId,
        networkName: region?.name || 'Unknown',
        networkUrl: urlByNetworkId[networkId] || '',
      };
    });

    return rows.sort((a, b) => a.networkId.localeCompare(b.networkId));
  })();

  const totalPages = Math.max(1, Math.ceil(networkRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedRows = networkRows.slice(startIndex, startIndex + pageSize);

  const handleCreateNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNetworkName.trim() || !newNetworkUrl.trim()) {
      alert('Please enter both Network Name and URL.');
      return;
    }

    // Generate a slug-like Network ID from the name
    const networkId = newNetworkName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!networkId) {
      alert('Network name is invalid. Please use letters and numbers.');
      return;
    }

    // Prevent duplicates by Network ID
    const existing = regions.find((r) => r.networkId === networkId);
    if (existing) {
      alert('A network with this name/ID already exists.');
      return;
    }

    setCreating(true);
    try {
      const result = await createRegion({
        name: newNetworkName.trim(),
        networkId,
        description: newNetworkUrl.trim() || undefined, // store URL in description as fallback
        isActive: true,
      });

      if (!result.success) {
        alert(result.error || 'Failed to create network.');
        return;
      }

      const updatedRegions = await getRegions();
      setRegions(updatedRegions || []);

      setNewNetworkName('');
      setNewNetworkUrl('');
      setShowNewNetworkForm(false);
    } catch (err: any) {
      console.error('Error creating network:', err);
      alert(err?.message || 'Error creating network.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Networks</h1>
        <div>
          <button
            type="button"
            onClick={() => setShowNewNetworkForm((prev) => !prev)}
            className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg transition text-sm font-semibold"
          >
            {showNewNetworkForm ? 'Cancel' : 'Create New Network'}
          </button>
        </div>
      </div>

      {showNewNetworkForm && (
        <div className="new-network bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <form
            onSubmit={handleCreateNetwork}
            className="flex flex-col sm:flex-row gap-3 items-start sm:items-end"
          >
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Network Name
              </label>
              <input
                type="text"
                value={newNetworkName}
                onChange={(e) => setNewNetworkName(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Cettire USA"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Network URL
              </label>
              <input
                type="url"
                value={newNetworkUrl}
                onChange={(e) => setNewNetworkUrl(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[220px]"
                placeholder="https://example.com"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Save Network'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Network ID
                </th>
                {/* <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-56">
                  Network Name
                </th> */}
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Network Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Store URL
                </th>
                {/* <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Merchant ID
                </th> */}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading network data...
                  </td>
                </tr>
              ) : networkRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No stores with a network ID found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.networkId} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm text-gray-800">{row.networkId}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{row.networkName}</td>
                    <td className="px-6 py-4 text-sm text-blue-600">
                      {row.networkUrl ? (
                        <a
                          href={row.networkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline break-all"
                        >
                          {row.networkUrl}
                        </a>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && networkRows.length > 0 && (
        <div className="px-6 py-4 justify-end border-t border-gray-200 flex flex-col sm:flex-row items-center  gap-4">
          {/* <div className="text-sm text-gray-700">
            Showing{' '}
            <span className="font-semibold">
              {networkRows.length === 0 ? 0 : startIndex + 1} -{' '}
              {Math.min(startIndex + pageSize, networkRows.length)}
            </span>{' '}
            of <span className="font-semibold">{networkRows.length}</span> records
          </div> */}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safePage === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>

            <span className="text-sm text-gray-700 px-3">
              Page <span className="font-semibold">{safePage}</span> of{' '}
              <span className="font-semibold">{totalPages}</span>
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safePage >= totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage >= totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

