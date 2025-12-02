'use client';

import { useEffect, useState } from 'react';
import { getCoupons, Coupon } from '@/lib/services/couponService';
import { getStores, Store } from '@/lib/services/storeService';
import Link from 'next/link';

export default function DashboardPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  console.log('coupons:', coupons);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch dashboard stats and all coupons
        const dashboardRes = await fetch('/api/coupons/get-dashboard');
        const dashboardData = await dashboardRes.json();
        
        // Fetch stores
        const storesData = await getStores();
        
        if (dashboardData.success) {
          setCoupons(dashboardData.coupons || []);
        } else {
          // Fallback to regular API if dashboard API fails
          const couponsData = await getCoupons();
          setCoupons(couponsData);
        }
        
        setStores(storesData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Fallback to regular API
        const [couponsData, storesData] = await Promise.all([
          getCoupons(),
          getStores()
        ]);
        setCoupons(couponsData);
        setStores(storesData);
      } finally {
        setLoading(false);
      }
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

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-[#16a34a] to-[#15803d] rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/import"
            className="bg-white hover:bg-gray-50 rounded-lg p-4 transition shadow-md hover:shadow-xl group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-[#16a34a] text-white p-3 rounded-lg group-hover:scale-110 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Import Excel</h3>
                <p className="text-sm text-gray-600">Bulk import stores & coupons</p>
              </div>
            </div>
          </Link>
          
          <Link
            href="/admin/stores"
            className="bg-white hover:bg-gray-50 rounded-lg p-4 transition shadow-md hover:shadow-xl group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-3 rounded-lg group-hover:scale-110 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Manage Stores</h3>
                <p className="text-sm text-gray-600">View & edit all stores</p>
              </div>
            </div>
          </Link>
          
          <Link
            href="/admin/coupons"
            className="bg-white hover:bg-gray-50 rounded-lg p-4 transition shadow-md hover:shadow-xl group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 text-white p-3 rounded-lg group-hover:scale-110 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Manage Coupons</h3>
                <p className="text-sm text-gray-600">View & edit all coupons</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

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

            <div className="bg-[#ABC443]/10 p-4 sm:p-6 rounded-lg border border-[#ABC443]/20">
              <div className="text-gray-600 text-xs sm:text-sm font-semibold">
                Avg Discount
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#ABC443] mt-2">
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
