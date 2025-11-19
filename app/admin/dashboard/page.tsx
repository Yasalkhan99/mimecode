'use client';

import { useEffect, useState } from 'react';
import { getCoupons, Coupon } from '@/lib/services/couponService';

export default function DashboardPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoupons = async () => {
      const data = await getCoupons();
      setCoupons(data);
      setLoading(false);
    };
    fetchCoupons();
  }, []);

  const stats: {
    totalCoupons: number;
    activeCoupons: number;
    totalUses: number;
    averageDiscount: string;
  } = {
    totalCoupons: coupons.length,
    activeCoupons: coupons.filter((c) => c.isActive).length,
    // ensure currentUses is numeric
    totalUses: coupons.reduce((sum, c) => sum + (c.currentUses || 0), 0),
    // always produce a string like "0.00"
    averageDiscount:
      coupons.length > 0
        ? (
            coupons.reduce((sum, c) => sum + (c.discount || 0), 0) / coupons.length
          ).toFixed(2)
        : '0.00',
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <div className="text-gray-600 text-sm font-semibold">
                Total Coupons
              </div>
              <div className="text-3xl font-bold text-blue-600 mt-2">
                {stats.totalCoupons}
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <div className="text-gray-600 text-sm font-semibold">
                Active Coupons
              </div>
              <div className="text-3xl font-bold text-green-600 mt-2">
                {stats.activeCoupons}
              </div>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <div className="text-gray-600 text-sm font-semibold">
                Total Uses
              </div>
              <div className="text-3xl font-bold text-purple-600 mt-2">
                {stats.totalUses}
              </div>
            </div>

            <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
              <div className="text-gray-600 text-sm font-semibold">
                Avg Discount
              </div>
              <div className="text-3xl font-bold text-orange-600 mt-2">
                {stats.averageDiscount}%
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Recent Coupons
            </h2>
            {coupons.length === 0 ? (
              <p className="text-gray-500">No coupons yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">
                        Code
                      </th>
                      <th className="px-4 py-2 text-left font-semibold">
                        Discount
                      </th>
                      <th className="px-4 py-2 text-left font-semibold">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left font-semibold">Uses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.slice(0, 5).map((coupon) => (
                      <tr key={coupon.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono font-semibold">
                          {coupon.code}
                        </td>
                        <td className="px-4 py-2">
                          {coupon.discount}
                          {coupon.discountType === 'percentage' ? '%' : ' AED'}
                        </td>
                        <td className="px-4 py-2">
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
                        <td className="px-4 py-2">
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
