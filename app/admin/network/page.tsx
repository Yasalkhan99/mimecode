'use client';

import { useEffect, useState } from 'react';
import type { Store } from '@/lib/services/storeService';
import { getStores } from '@/lib/services/storeService';
import type { Region } from '@/lib/services/regionService';
import { getRegions } from '@/lib/services/regionService';

interface NetworkRow {
  networkId: string;
  networkName: string;
  storeId: string;
  storeName: string;
  merchantId: string;
}

export default function NetworkPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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

  const networkRows: NetworkRow[] = stores
    .filter((store) => !!store.networkId)
    .map((store) => {
      const region = regions.find((r) => r.networkId === store.networkId);
      return {
        networkId: store.networkId || '-',
        networkName: region?.name || 'Unknown',
        storeId: store.id || '-',
        storeName: store.name,
        merchantId: store.merchantId || '-',
      };
    })
    .sort((a, b) => {
      if (a.networkId === b.networkId) {
        return a.storeName.localeCompare(b.storeName);
      }
      return a.networkId.localeCompare(b.networkId);
    });

  const totalPages = Math.max(1, Math.ceil(networkRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedRows = networkRows.slice(startIndex, startIndex + pageSize);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Networks</h1>
      </div>

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
                  Store ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Store Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Merchant ID
                </th>
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
                  <tr key={`${row.networkId}-${row.storeId}`} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm text-gray-800">{row.networkId}</td>
                    {/* <td className="px-6 py-4 text-sm text-gray-900">{row.networkName}</td> */}
                    <td className="px-6 py-4 font-mono text-sm text-gray-800">{row.storeId}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{row.storeName}</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-800">{row.merchantId}</td>
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

