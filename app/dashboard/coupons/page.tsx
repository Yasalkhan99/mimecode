'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import Link from 'next/link';
import { getCoupons, Coupon, createCoupon, updateCoupon, deleteCoupon } from '@/lib/services/couponService';
import { getStores, Store } from '@/lib/services/storeService';
import { getCategories, Category } from '@/lib/services/categoryService';
import Image from 'next/image';

export default function UserCouponsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: '',
    storeName: '',
    discount: 0,
    discountType: 'percentage',
    description: '',
    isActive: true,
    maxUses: 100,
    currentUses: 0,
    expiryDate: null,
    couponType: 'code',
    categoryId: null,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allCoupons, allStores, allCategories] = await Promise.all([
        getCoupons(),
        getStores(),
        getCategories(),
      ]);
      
      // Filter coupons by userId
      const userCoupons = allCoupons.filter(coupon => coupon.userId === user?.uid);
      setCoupons(userCoupons);
      
      // Filter stores by userId
      const userStores = allStores.filter(store => store.userId === user?.uid);
      setStores(userStores);
      setCategories(allCategories);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('You must be logged in to create a coupon');
      return;
    }

    if (!formData.storeName) {
      alert('Store name is required');
      return;
    }

    try {
      const couponData = {
        ...formData,
        userId: user.uid, // Add user ID for ownership
        discount: Number(formData.discount) || 0,
        maxUses: Number(formData.maxUses) || 100,
        currentUses: Number(formData.currentUses) || 0,
        isActive: formData.isActive !== false,
      };

      if (editingCoupon && editingCoupon.id) {
        await updateCoupon(editingCoupon.id, couponData);
      } else {
        await createCoupon(couponData as Omit<Coupon, 'id'>);
      }

      // Reset form and reload data
      setFormData({
        code: '',
        storeName: '',
        discount: 0,
        discountType: 'percentage',
        description: '',
        isActive: true,
        maxUses: 100,
        currentUses: 0,
        expiryDate: null,
        couponType: 'code',
        categoryId: null,
      });
      setShowForm(false);
      setEditingCoupon(null);
      loadData();
    } catch (error) {
      console.error('Error saving coupon:', error);
      alert('Failed to save coupon. Please try again.');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      storeName: coupon.storeName,
      discount: coupon.discount,
      discountType: coupon.discountType,
      description: coupon.description,
      isActive: coupon.isActive,
      maxUses: coupon.maxUses,
      currentUses: coupon.currentUses,
      expiryDate: coupon.expiryDate,
      couponType: coupon.couponType,
      categoryId: coupon.categoryId,
      logoUrl: coupon.logoUrl,
      affiliateLink: coupon.affiliateLink,
    });
    setShowForm(true);
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) {
      return;
    }

    try {
      await deleteCoupon(couponId);
      loadData();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('Failed to delete coupon. Please try again.');
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Coupons</h1>
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (showForm) {
                  setEditingCoupon(null);
                  setFormData({
                    code: '',
                    storeName: '',
                    discount: 0,
                    discountType: 'percentage',
                    description: '',
                    isActive: true,
                    maxUses: 100,
                    currentUses: 0,
                    expiryDate: null,
                    couponType: 'code',
                    categoryId: null,
                  });
                }
              }}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              {showForm ? 'Cancel' : '+ Add Coupon'}
            </button>
          </div>

          {stores.length === 0 && !loading && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                <strong>Note:</strong> You need to create a store first before adding coupons.{' '}
                <Link href="/dashboard/stores" className="underline font-semibold">
                  Go to My Stores
                </Link>
              </p>
            </div>
          )}

          {showForm && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Store Name *
                  </label>
                  <select
                    value={formData.storeName}
                    onChange={(e) => {
                      const selectedStore = stores.find(s => s.name === e.target.value);
                      setFormData({ 
                        ...formData, 
                        storeName: e.target.value,
                        logoUrl: selectedStore?.logoUrl || formData.logoUrl,
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select a store</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.name}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Coupon Type *
                  </label>
                  <select
                    value={formData.couponType}
                    onChange={(e) => setFormData({ ...formData, couponType: e.target.value as 'code' | 'deal' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="code">Code (with coupon code)</option>
                    <option value="deal">Deal (no code needed)</option>
                  </select>
                </div>

                {formData.couponType === 'code' && (
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Coupon Code
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g., SAVE20"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Title/Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="e.g., Get 20% off on all products"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Discount Amount
                    </label>
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Discount Type
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Affiliate Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.affiliateLink || ''}
                    onChange={(e) => setFormData({ ...formData, affiliateLink: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={typeof formData.expiryDate === 'string' ? formData.expiryDate : ''}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Category
                  </label>
                  <select
                    value={formData.categoryId || ''}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value || null })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-gray-700 text-sm font-semibold">
                    Active (visible to users)
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingCoupon(null);
                      setFormData({
                        code: '',
                        storeName: '',
                        discount: 0,
                        discountType: 'percentage',
                        description: '',
                        isActive: true,
                        maxUses: 100,
                        currentUses: 0,
                        expiryDate: null,
                        couponType: 'code',
                        categoryId: null,
                      });
                    }}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="text-xl font-semibold">Loading coupons...</div>
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No coupons yet</h3>
              <p className="text-gray-600 mb-6">Create your first coupon or deal to share with users.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {coupon.logoUrl && (
                          <div className="w-12 h-12 relative">
                            <Image
                              src={coupon.logoUrl}
                              alt={coupon.storeName || 'Store logo'}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{coupon.storeName}</h3>
                          <span className={`text-xs px-2 py-1 rounded ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {coupon.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">{coupon.description}</p>
                      {coupon.couponType === 'code' && coupon.code && (
                        <div className="bg-green-50 border border-green-200 rounded px-3 py-2 inline-block mb-2">
                          <span className="text-green-700 font-mono font-bold">{coupon.code}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {coupon.discount > 0 && (
                          <span>Discount: {coupon.discount}{coupon.discountType === 'percentage' ? '%' : '$'} off</span>
                        )}
                        {coupon.expiryDate && (
                          <span>Expires: {typeof coupon.expiryDate === 'string' 
                            ? new Date(coupon.expiryDate).toLocaleDateString()
                            : coupon.expiryDate.toDate?.().toLocaleDateString() || 'N/A'
                          }</span>
                        )}
                        <span>Uses: {coupon.currentUses}/{coupon.maxUses}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => coupon.id && handleDelete(coupon.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}


