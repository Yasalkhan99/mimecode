'use client';

import { useEffect, useState } from 'react';
import { getCoupons, Coupon } from '@/lib/services/couponService';
import { getStores, Store } from '@/lib/services/storeService';

export default function DashboardPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [couponsData, storesData] = await Promise.all([
        getCoupons(),
        getStores()
      ]);
      setCoupons(couponsData);
      setStores(storesData);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Filter coupons by selected store
  const filteredCoupons = selectedStoreId
    ? coupons.filter(coupon => {
        // Check if coupon has storeIds array and includes selected store
        if (coupon.storeIds && coupon.storeIds.length > 0) {
          return coupon.storeIds.includes(selectedStoreId);
        }
        // Fallback: check storeName if storeIds not available
        const selectedStore = stores.find(s => s.id === selectedStoreId);
        return selectedStore && coupon.storeName === selectedStore.name;
      })
    : coupons;

  const stats: {
    totalCoupons: number;
    activeCoupons: number;
    totalUses: number;
    averageDiscount: string;
  } = {
    totalCoupons: filteredCoupons.length,
    activeCoupons: filteredCoupons.filter((c) => c.isActive).length,
    // ensure currentUses is numeric
    totalUses: filteredCoupons.reduce((sum, c) => sum + (c.currentUses || 0), 0),
    // always produce a string like "0.00"
    averageDiscount:
      filteredCoupons.length > 0
        ? (
            filteredCoupons.reduce((sum, c) => sum + (c.discount || 0), 0) / filteredCoupons.length
          ).toFixed(2)
        : '0.00',
  };

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-8">Dashboard</h1>

      {/* Store Search/Select Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
        <label htmlFor="storeSelect" className="block text-sm font-semibold text-gray-700 mb-2">
          Search Coupons by Store
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            id="storeSelect"
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          >
            <option value="">All Stores</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
          {selectedStoreId && (
            <button
              onClick={() => setSelectedStoreId('')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium whitespace-nowrap"
            >
              Clear Filter
            </button>
          )}
        </div>
        {selectedStoreId && selectedStore && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{selectedStore.name}</span> has{' '}
              <span className="font-bold text-blue-600 text-lg">{filteredCoupons.length}</span>{' '}
              {filteredCoupons.length === 1 ? 'coupon' : 'coupons'}
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
            <div className="bg-blue-50 p-4 sm:p-6 rounded-lg border border-blue-200">
              <div className="text-gray-600 text-xs sm:text-sm font-semibold">
                Total Coupons
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mt-2">
                {stats.totalCoupons}
              </div>
            </div>

            <div className="bg-green-50 p-4 sm:p-6 rounded-lg border border-green-200">
              <div className="text-gray-600 text-xs sm:text-sm font-semibold">
                Active Coupons
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mt-2">
                {stats.activeCoupons}
              </div>
            </div>

            <div className="bg-purple-50 p-4 sm:p-6 rounded-lg border border-purple-200">
              <div className="text-gray-600 text-xs sm:text-sm font-semibold">
                Total Uses
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 mt-2">
                {stats.totalUses}
              </div>
            </div>

            <div className="bg-orange-50 p-4 sm:p-6 rounded-lg border border-orange-200">
              <div className="text-gray-600 text-xs sm:text-sm font-semibold">
                Avg Discount
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-orange-600 mt-2">
                {stats.averageDiscount}%
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
              {selectedStoreId ? `${selectedStore?.name} Coupons` : 'Recent Coupons'}
            </h2>
            {filteredCoupons.length === 0 ? (
              <p className="text-gray-500">
                {selectedStoreId ? `No coupons found for ${selectedStore?.name}` : 'No coupons yet'}
              </p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-xs sm:text-sm min-w-[500px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 text-left font-semibold">
                        Store Name
                      </th>
                      <th className="px-2 sm:px-4 py-2 text-left font-semibold">
                        Code
                      </th>
                      <th className="px-2 sm:px-4 py-2 text-left font-semibold">
                        Discount
                      </th>
                      <th className="px-2 sm:px-4 py-2 text-left font-semibold">
                        Status
                      </th>
                      <th className="px-2 sm:px-4 py-2 text-left font-semibold">Uses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCoupons.slice(0, 5).map((coupon) => (
                      <tr key={coupon.id} className="border-b hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-2 text-sm font-semibold text-gray-900">
                          {coupon.storeName || 'N/A'}
                        </td>
                        <td className="px-2 sm:px-4 py-2 font-mono font-semibold">
                          {coupon.code || 'N/A'}
                        </td>
                        <td className="px-2 sm:px-4 py-2">
                          {coupon.discount}
                          %
                        </td>
                        <td className="px-2 sm:px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              coupon.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {coupon.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2">
                          {coupon.currentUses} / {coupon.maxUses}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
