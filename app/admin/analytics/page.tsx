"use client";

import { useEffect, useState } from 'react';
import { getCoupons, Coupon } from '@/lib/services/couponService';

export default function AnalyticsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [expiringSoonCount, setExpiringSoonCount] = useState(0);

  useEffect(() => {
    const fetchCoupons = async () => {
      const data = await getCoupons();
      setCoupons(data);

      const now = Date.now();
      const expiring = data.filter((c) => {
        if (!c.expiryDate) return false;
        const daysUntilExpiry = Math.floor(
          (c.expiryDate.toDate().getTime() - now) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
      }).length;
      setExpiringSoonCount(expiring);

      setLoading(false);
    };

    fetchCoupons();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading analytics...</div>;
  }

  const topCoupons = [...coupons]
    .sort((a, b) => b.currentUses - a.currentUses)
    .slice(0, 5);

  const percentageCoupons = coupons.filter((c) => c.discountType === 'percentage');

  const avgUsageRate =
    coupons.length > 0
      ? (
          coupons.reduce((sum, c) => sum + (c.currentUses / c.maxUses) * 100, 0) /
          coupons.length
        ).toFixed(1)
      : '0.0';

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
          <div className="text-gray-600 text-sm font-semibold">Avg Usage Rate</div>
          <div className="text-3xl font-bold text-indigo-600 mt-2">{avgUsageRate}%</div>
        </div>

        <div className="bg-cyan-50 p-6 rounded-lg border border-cyan-200">
          <div className="text-gray-600 text-sm font-semibold">Percentage Coupons</div>
          <div className="text-3xl font-bold text-cyan-600 mt-2">{percentageCoupons.length}</div>
        </div>

        <div className="bg-pink-50 p-6 rounded-lg border border-pink-200">
          <div className="text-gray-600 text-sm font-semibold">Expiring Soon</div>
          <div className="text-3xl font-bold text-pink-600 mt-2">{expiringSoonCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top 5 Most Used Coupons</h2>
          {topCoupons.length === 0 ? (
            <p className="text-gray-500">No coupon usage data yet</p>
          ) : (
            <div className="space-y-3">
              {topCoupons.map((coupon, index) => (
                <div key={coupon.id} className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-3 text-sm font-bold">{index + 1}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{coupon.code}</div>
                    <div className="text-sm text-gray-600">{coupon.currentUses} uses</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-800">{((coupon.currentUses / coupon.maxUses) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Coupon Type Distribution</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 font-semibold">Percentage Coupons</span>
                <span className="text-gray-600">{percentageCoupons.length} ({percentageCoupons.length > 0 ? ((percentageCoupons.length / coupons.length) * 100).toFixed(1) : 0}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: coupons.length > 0 ? `${(percentageCoupons.length / coupons.length) * 100}%` : '0%' }}></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
