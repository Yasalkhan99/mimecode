'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface CouponClick {
  id: string;
  coupon_id: string;
  coupon_code: string;
  coupon_type: string;
  store_name: string;
  store_id: string;
  ip_address: string;
  country: string;
  country_code: string;
  region: string;
  city: string;
  timezone: string;
  device_type: string;
  browser: string;
  os: string;
  clicked_at: string;
}

interface Stats {
  totalClicks: number;
  byCountry: Record<string, number>;
  byDevice: Record<string, number>;
  byType: Record<string, number>;
  topStores: Record<string, number>;
}

// Country code to flag emoji
const countryFlags: Record<string, string> = {
  'US': '🇺🇸', 'GB': '🇬🇧', 'UK': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺', 'DE': '🇩🇪',
  'FR': '🇫🇷', 'IN': '🇮🇳', 'PK': '🇵🇰', 'BR': '🇧🇷', 'MX': '🇲🇽', 'JP': '🇯🇵',
  'CN': '🇨🇳', 'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱', 'PL': '🇵🇱', 'RU': '🇷🇺',
  'AE': '🇦🇪', 'SA': '🇸🇦', 'SG': '🇸🇬', 'MY': '🇲🇾', 'TH': '🇹🇭', 'PH': '🇵🇭',
  'ID': '🇮🇩', 'VN': '🇻🇳', 'KR': '🇰🇷', 'ZA': '🇿🇦', 'NG': '🇳🇬', 'EG': '🇪🇬',
  'TR': '🇹🇷', 'AR': '🇦🇷', 'CL': '🇨🇱', 'CO': '🇨🇴', 'NZ': '🇳🇿', 'IE': '🇮🇪',
  'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'BE': '🇧🇪', 'CH': '🇨🇭',
  'AT': '🇦🇹', 'PT': '🇵🇹', 'GR': '🇬🇷', 'IL': '🇮🇱', 'LO': '🏠', 'XX': '🌍',
};

export default function CouponClicksAnalytics() {
  const [clicks, setClicks] = useState<CouponClick[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0, hasMore: false });

  useEffect(() => {
    fetchData();
  }, [pagination.offset]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/coupon-clicks?limit=${pagination.limit}&offset=${pagination.offset}`);
      const data = await res.json();
      
      if (data.success) {
        setClicks(data.clicks);
        setStats(data.stats);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to load data');
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFlag = (countryCode: string) => {
    return countryFlags[countryCode?.toUpperCase()] || '🌍';
  };

  const getDeviceIcon = (device: string) => {
    switch (device?.toLowerCase()) {
      case 'mobile': return '📱';
      case 'tablet': return '📱';
      case 'desktop': return '💻';
      default: return '🖥️';
    }
  };

  if (loading && clicks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">📊 Coupon Click Analytics</h1>
            <p className="text-gray-600 mt-1">Track coupon usage by location and device</p>
          </div>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Clicks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Clicks</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalClicks.toLocaleString()}</p>
                </div>
                <div className="text-4xl">🖱️</div>
              </div>
            </motion.div>

            {/* Codes vs Deals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <p className="text-sm text-gray-500 mb-2">Codes vs Deals</p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xl font-bold text-blue-600">{stats.byType['code'] || 0}</p>
                  <p className="text-xs text-gray-500">Codes</p>
                </div>
                <div className="text-2xl text-gray-300">/</div>
                <div>
                  <p className="text-xl font-bold text-green-600">{stats.byType['deal'] || 0}</p>
                  <p className="text-xs text-gray-500">Deals</p>
                </div>
              </div>
            </motion.div>

            {/* Device Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <p className="text-sm text-gray-500 mb-2">By Device</p>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{stats.byDevice['desktop'] || 0}</p>
                  <p className="text-xs text-gray-500">💻</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{stats.byDevice['mobile'] || 0}</p>
                  <p className="text-xs text-gray-500">📱</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{stats.byDevice['tablet'] || 0}</p>
                  <p className="text-xs text-gray-500">📱</p>
                </div>
              </div>
            </motion.div>

            {/* Top Country */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <p className="text-sm text-gray-500 mb-2">Top Countries</p>
              <div className="space-y-1">
                {Object.entries(stats.byCountry)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3)
                  .map(([country, count]) => (
                    <div key={country} className="flex items-center justify-between text-sm">
                      <span>{country}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Top Stores */}
        {stats && Object.keys(stats.topStores).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🏪 Top Stores</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(stats.topStores).map(([store, count], index) => (
                <div key={store} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">#{index + 1}</p>
                  <p className="font-semibold text-gray-900 truncate" title={store}>{store}</p>
                  <p className="text-sm text-blue-600 font-bold">{count} clicks</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Clicks Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Clicks</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clicks.map((click) => (
                  <tr key={click.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {formatDate(click.clicked_at)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {click.store_name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        click.coupon_type === 'code' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {click.coupon_type || 'deal'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                      {click.coupon_code || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <span className="mr-1">{getFlag(click.country_code)}</span>
                      {click.city && click.city !== 'Unknown' ? `${click.city}, ` : ''}
                      {click.country || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="mr-1">{getDeviceIcon(click.device_type)}</span>
                      {click.device_type} / {click.browser}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                      {click.ip_address}
                    </td>
                  </tr>
                ))}
                {clicks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No click data yet. Clicks will appear here when users interact with coupons.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(p => ({ ...p, offset: Math.max(0, p.offset - p.limit) }))}
                  disabled={pagination.offset === 0}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(p => ({ ...p, offset: p.offset + p.limit }))}
                  disabled={!pagination.hasMore}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

