"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCoupons, Coupon } from '@/lib/services/couponService';
import { motion } from 'framer-motion';

interface ClickStats {
  totalClicks: number;
  byCountry: Record<string, number>;
  byDevice: Record<string, number>;
  byType: Record<string, number>;
  topStores: Record<string, number>;
}

export default function AnalyticsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [expiringSoonCount, setExpiringSoonCount] = useState(0);
  const [clickStats, setClickStats] = useState<ClickStats | null>(null);
  const [todayClicks, setTodayClicks] = useState(0);
  const [weekClicks, setWeekClicks] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch coupons
        const data = await getCoupons();
        setCoupons(data);

        const now = Date.now();
        const expiring = data.filter((c) => {
          if (!c.expiryDate) return false;
          let expiryTime: Date;
          if (c.expiryDate instanceof Date) {
            expiryTime = c.expiryDate;
          } else if (c.expiryDate && typeof (c.expiryDate as any).toDate === 'function') {
            expiryTime = (c.expiryDate as any).toDate();
          } else if (typeof c.expiryDate === 'string') {
            expiryTime = new Date(c.expiryDate);
          } else if (typeof c.expiryDate === 'number') {
            expiryTime = new Date(c.expiryDate);
          } else {
            return false;
          }
          const daysUntilExpiry = Math.floor(
            (expiryTime.getTime() - now) / (1000 * 60 * 60 * 24)
          );
          return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
        }).length;
        setExpiringSoonCount(expiring);

        // Fetch click stats
        const clickRes = await fetch('/api/admin/coupon-clicks?limit=1000');
        const clickData = await clickRes.json();
        if (clickData.success) {
          setClickStats(clickData.stats);
          
          // Calculate today's and week's clicks
          const clicks = clickData.clicks || [];
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          
          let todayCount = 0;
          let weekCount = 0;
          clicks.forEach((click: any) => {
            const clickDate = new Date(click.clicked_at);
            if (clickDate >= today) todayCount++;
            if (clickDate >= weekAgo) weekCount++;
          });
          setTodayClicks(todayCount);
          setWeekClicks(weekCount);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Export to CSV
  const exportToCSV = async () => {
    try {
      const res = await fetch('/api/admin/coupon-clicks?limit=10000');
      const data = await res.json();
      
      if (!data.success || !data.clicks.length) {
        alert('No data to export');
        return;
      }

      const clicks = data.clicks;
      const headers = ['Time', 'Store', 'Type', 'Code', 'Country', 'City', 'Device', 'Browser', 'IP'];
      const rows = clicks.map((c: any) => [
        new Date(c.clicked_at).toLocaleString(),
        c.store_name || '',
        c.coupon_type || 'deal',
        c.coupon_code || '',
        c.country || '',
        c.city || '',
        c.device_type || '',
        c.browser || '',
        c.ip_address || ''
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map((cell: string) => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `coupon-clicks-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const topCoupons = [...coupons]
    .sort((a, b) => (b.currentUses || 0) - (a.currentUses || 0))
    .slice(0, 5);

  const percentageCoupons = coupons.filter((c) => c.discountType === 'percentage');

  const avgUsageRate =
    coupons.length > 0
      ? (
          coupons.reduce((sum, c) => sum + ((c.currentUses || 0) / (c.maxUses || 1)) * 100, 0) /
          coupons.length
        ).toFixed(1)
      : '0.0';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">📊 Analytics Dashboard</h1>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
          <Link
            href="/admin/analytics/clicks"
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            Check Clicks
          </Link>
        </div>
      </div>

      {/* Click Analytics Summary - Featured */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 mb-8 text-white"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              🖱️ Coupon Click Tracking
            </h2>
            <p className="text-orange-100 mb-4">Track every coupon click with location, device & more</p>
          </div>
          <Link
            href="/admin/analytics/clicks"
            className="inline-flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-orange-50 transition shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Detailed Click Analytics →
          </Link>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-orange-100 text-sm">Total Clicks</p>
            <p className="text-3xl font-bold">{clickStats?.totalClicks?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-orange-100 text-sm">Today</p>
            <p className="text-3xl font-bold">{todayClicks}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-orange-100 text-sm">This Week</p>
            <p className="text-3xl font-bold">{weekClicks}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-orange-100 text-sm">Countries</p>
            <p className="text-3xl font-bold">{Object.keys(clickStats?.byCountry || {}).length}</p>
          </div>
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-indigo-50 p-6 rounded-lg border border-indigo-200"
        >
          <div className="text-gray-600 text-sm font-semibold">Avg Usage Rate</div>
          <div className="text-3xl font-bold text-indigo-600 mt-2">{avgUsageRate}%</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-cyan-50 p-6 rounded-lg border border-cyan-200"
        >
          <div className="text-gray-600 text-sm font-semibold">Percentage Coupons</div>
          <div className="text-3xl font-bold text-cyan-600 mt-2">{percentageCoupons.length}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-amber-50 p-6 rounded-lg border border-amber-200"
        >
          <div className="text-gray-600 text-sm font-semibold">Expiring Soon (7 days)</div>
          <div className="text-3xl font-bold text-amber-600 mt-2">{expiringSoonCount}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-green-50 p-6 rounded-lg border border-green-200"
        >
          <div className="text-gray-600 text-sm font-semibold">Total Coupons</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{coupons.length}</div>
        </motion.div>
      </div>

      {/* Device & Type Breakdown */}
      {clickStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Device Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">📱 Clicks by Device</h3>
            <div className="space-y-3">
              {Object.entries(clickStats.byDevice || {}).map(([device, count]) => (
                <div key={device} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {device === 'desktop' ? '💻' : device === 'mobile' ? '📱' : '📱'}
                    </span>
                    <span className="capitalize text-gray-700">{device}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(count / (clickStats.totalClicks || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-gray-900 w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Type Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">🏷️ Codes vs Deals</h3>
            <div className="flex items-center justify-center gap-8 py-4">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold text-blue-600">{clickStats.byType?.code || 0}</span>
                </div>
                <p className="text-sm text-gray-600">Codes</p>
              </div>
              <div className="text-4xl text-gray-300">vs</div>
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold text-green-600">{clickStats.byType?.deal || 0}</span>
                </div>
                <p className="text-sm text-gray-600">Deals</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Top Countries & Top Stores */}
      {clickStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Countries */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">🌍 Top Countries</h3>
            <div className="space-y-2">
              {Object.entries(clickStats.byCountry || {})
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([country, count], index) => (
                  <div key={country} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-mono text-sm w-6">#{index + 1}</span>
                      <span className="text-gray-800">{country}</span>
                    </div>
                    <span className="font-bold text-blue-600">{count}</span>
                  </div>
                ))}
            </div>
          </motion.div>

          {/* Top Stores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">🏪 Top Clicked Stores</h3>
            <div className="space-y-2">
              {Object.entries(clickStats.topStores || {})
                .slice(0, 8)
                .map(([store, count], index) => (
                  <div key={store} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-mono text-sm w-6">#{index + 1}</span>
                      <span className="text-gray-800 truncate max-w-[200px]" title={store}>{store}</span>
                    </div>
                    <span className="font-bold text-green-600">{count} clicks</span>
                  </div>
                ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Top Coupons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">🏆 Top 5 Most Used Coupons</h2>
          {topCoupons.length === 0 ? (
            <p className="text-gray-500">No coupon usage data yet</p>
          ) : (
            <div className="space-y-3">
              {topCoupons.map((coupon, index) => (
                <div key={coupon.id} className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-3 text-sm font-bold">{index + 1}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{coupon.code || coupon.storeName || 'Unknown'}</div>
                    <div className="text-sm text-gray-600">{coupon.currentUses || 0} uses</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-800">
                      {(((coupon.currentUses || 0) / (coupon.maxUses || 1)) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">📈 Coupon Type Distribution</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 font-semibold">Percentage Coupons</span>
                <span className="text-gray-600">{percentageCoupons.length} ({percentageCoupons.length > 0 ? ((percentageCoupons.length / coupons.length) * 100).toFixed(1) : 0}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: coupons.length > 0 ? `${(percentageCoupons.length / coupons.length) * 100}%` : '0%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 font-semibold">Fixed Amount Coupons</span>
                <span className="text-gray-600">{coupons.length - percentageCoupons.length} ({coupons.length > 0 ? (((coupons.length - percentageCoupons.length) / coupons.length) * 100).toFixed(1) : 0}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-green-600 h-3 rounded-full transition-all" style={{ width: coupons.length > 0 ? `${((coupons.length - percentageCoupons.length) / coupons.length) * 100}%` : '0%' }}></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

