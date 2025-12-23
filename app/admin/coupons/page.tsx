'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import {
  getCoupons,
  getCouponById,
  createCoupon,
  createCouponFromUrl,
  updateCoupon,
  deleteCoupon,
  deleteAllCoupons,
  Coupon,
} from '@/lib/services/couponService';
import { getCategories, Category } from '@/lib/services/categoryService';
import Link from 'next/link';
import { extractOriginalCloudinaryUrl, isCloudinaryUrl } from '@/lib/utils/cloudinary';
import { getStores, Store } from '@/lib/services/storeService';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Omit<Coupon, 'expiryDate'> & { expiryDate: string | Date | null }>>({
    code: '',
    storeName: '',
    title: '', // Coupon title field
    discount: 0,
    discountType: 'percentage',
    description: '',
    isActive: true,
    maxUses: 100,
    currentUses: 0,
    expiryDate: null,
    isPopular: false,
    layoutPosition: null,
    isLatest: false,
    latestLayoutPosition: null,
    categoryId: null,
    couponType: 'code',
    imageAlt: '',
    priority: 0,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploadMethod, setLogoUploadMethod] = useState<'file' | 'url'>('file');
  const [logoUrl, setLogoUrl] = useState('');
  const [extractedLogoUrl, setExtractedLogoUrl] = useState<string | null>(null);
  const [uploadingToCloudinary, setUploadingToCloudinary] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [manualStoreId, setManualStoreId] = useState<string>('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'enable' | 'disable'>('all');
  const [selectedCouponIds, setSelectedCouponIds] = useState<string[]>([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const storeDropdownRef = useRef<HTMLDivElement>(null);
  
  // Excel bulk upload states
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importingFromExcel, setImportingFromExcel] = useState(false);
  const [excelPreviewData, setExcelPreviewData] = useState<any[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [showExcelPreview, setShowExcelPreview] = useState(false);

  const handleExportCoupons = () => {
    if (!coupons || coupons.length === 0) {
      alert('No coupons available to export.');
      return;
    }

    // Export all known coupon fields
    const headers = [
      'Coupon ID',
      'Code',
      'Store Name',
      'Store IDs',
      'Title',
      'Description',
      'Discount',
      'Discount Type',
      'Coupon URL',
      'Affiliate Link',
      'Logo URL',
      'Coupon Type',
      'Status',
      'Is Popular',
      'Popular Layout Position',
      'Is Latest',
      'Latest Layout Position',
      'Category ID',
      'Button Text',
      'Deal Scope',
      'Max Uses',
      'Current Uses',
      'Expiry Date',
      'User ID',
      'Created At',
      'Updated At',
    ];

    const escapeCsv = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const formatDate = (value: any): string => {
      if (!value) return '';
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (value && typeof value.toDate === 'function') {
        // Firestore Timestamp
        return value.toDate().toISOString();
      }
      if (typeof value === 'string' || typeof value === 'number') {
        return new Date(value).toISOString();
      }
      return '';
    };

    const rows = coupons.map((coupon) =>
      [
        escapeCsv(coupon.id),
        escapeCsv(coupon.code),
        escapeCsv(coupon.storeName),
        escapeCsv(coupon.storeIds && Array.isArray(coupon.storeIds) ? coupon.storeIds.join('; ') : ''),
        escapeCsv(coupon.title),
        escapeCsv(coupon.description),
        escapeCsv(coupon.discount),
        escapeCsv(coupon.discountType),
        escapeCsv(coupon.url),
        escapeCsv(coupon.affiliateLink),
        escapeCsv(coupon.logoUrl),
        escapeCsv(coupon.couponType),
        escapeCsv(coupon.isActive ? 'Active' : 'Inactive'),
        escapeCsv(coupon.isPopular ? 'Yes' : 'No'),
        escapeCsv(coupon.layoutPosition),
        escapeCsv(coupon.isLatest ? 'Yes' : 'No'),
        escapeCsv(coupon.latestLayoutPosition),
        escapeCsv(coupon.categoryId),
        escapeCsv(coupon.buttonText),
        escapeCsv(coupon.dealScope),
        escapeCsv(coupon.maxUses),
        escapeCsv(coupon.currentUses),
        escapeCsv(formatDate(coupon.expiryDate)),
        escapeCsv(coupon.userId),
        escapeCsv(formatDate((coupon as any).createdAt)),
        escapeCsv(formatDate((coupon as any).updatedAt)),
      ].join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `coupons-full-records-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(event.target as Node)) {
        setIsStoreDropdownOpen(false);
      }
    };

    if (isStoreDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStoreDropdownOpen]);

  const fetchCoupons = async (bypassCache = false) => {
    setLoading(true);
    try {
      // Always use cache-busting to ensure fresh data
      const url = `/api/coupons/get?collection=coupons-mimecode&_t=${Date.now()}`;
      
      console.log('🔄 Fetching coupons from:', url);
      const res = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
      if (res.ok) {
        const responseData = await res.json();
        console.log('📦 API Response:', {
          success: responseData.success,
          couponCount: responseData.coupons?.length || 0,
          hasCoupons: !!responseData.coupons,
          couponsType: Array.isArray(responseData.coupons) ? 'array' : typeof responseData.coupons,
          fullResponseKeys: responseData ? Object.keys(responseData) : 'no response'
        });
        
        // Log first coupon if exists for debugging
        if (responseData.coupons && Array.isArray(responseData.coupons) && responseData.coupons.length > 0) {
          console.log('📋 First coupon sample:', responseData.coupons[0]);
          console.log('📋 First coupon keys:', Object.keys(responseData.coupons[0]));
        } else if (responseData.coupons && !Array.isArray(responseData.coupons)) {
          console.warn('⚠️ Coupons is not an array:', typeof responseData.coupons, responseData.coupons);
        } else {
          console.warn('⚠️ No coupons array in response. Response structure:', responseData);
        }
        
        if (responseData.success) {
          if (responseData.coupons && Array.isArray(responseData.coupons)) {
            console.log(`✅ Found ${responseData.coupons.length} coupons in API response`);
            const sortedCoupons = responseData.coupons.sort((a: Coupon, b: Coupon) => {
              const idA = parseInt(String(a.id || '0'), 10) || 0;
              const idB = parseInt(String(b.id || '0'), 10) || 0;
              return idA - idB;
            });
            setCoupons(sortedCoupons);
            console.log(`✅ Set ${sortedCoupons.length} coupons in state`);
          } else {
            console.warn('⚠️ API returned success but coupons array is missing or not an array');
            // Don't clear existing coupons if API returns invalid format
            console.log('⚠️ Keeping existing coupons, not clearing state');
          }
        } else {
          console.error('❌ API returned success: false', responseData);
          // Don't clear existing coupons on API failure
          console.log('⚠️ Keeping existing coupons due to API failure');
        }
      } else {
        console.error('❌ API request failed:', res.status, res.statusText);
        const errorText = await res.text();
        console.error('❌ Error response:', errorText);
        
        // Fallback to getCoupons() if direct fetch fails
        try {
          const data = await getCoupons();
          console.log(`📦 Fallback: Found ${data.length} coupons from getCoupons()`);
          if (data.length > 0) {
            const sortedCoupons = data.sort((a, b) => {
              const idA = parseInt(String(a.id || '0'), 10) || 0;
              const idB = parseInt(String(b.id || '0'), 10) || 0;
              return idA - idB;
            });
            setCoupons(sortedCoupons);
          }
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          // Don't clear coupons on fallback failure
        }
      }
    } catch (error) {
      console.error('❌ Error fetching coupons:', error);
      // Fallback to getCoupons() if error
      try {
        const data = await getCoupons();
        console.log(`📦 Error fallback: Found ${data.length} coupons from getCoupons()`);
        if (data.length > 0) {
          const sortedCoupons = data.sort((a, b) => {
            const idA = parseInt(String(a.id || '0'), 10) || 0;
            const idB = parseInt(String(b.id || '0'), 10) || 0;
            return idA - idB;
          });
          setCoupons(sortedCoupons);
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        // Don't clear coupons on error - keep existing state
        console.log('⚠️ Keeping existing coupons due to error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Excel file handle karne ka function
  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setExcelFile(selectedFile);
      
      // Preview data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', 'coupons');
      
      try {
        const response = await fetch('/api/import/excel', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        if (data.success) {
          setExcelData(data.data);
          setExcelPreviewData(data.data.slice(0, 10)); // Show first 10 rows
          setShowExcelPreview(true);
        } else {
          alert(`Error reading file: ${data.error}`);
        }
      } catch (error: any) {
        alert(`Error: ${error.message}`);
      }
    }
  };

  // Excel se coupons import karne ka function
  const handleImportFromExcel = async () => {
    if (!excelFile || excelData.length === 0) return;
    
    setImportingFromExcel(true);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      // Get all stores to map store names to IDs
      const allStores = await getStores();
      console.log(`📊 Total stores in database: ${allStores.length}`);
      console.log('📋 Sample stores from database:', allStores.slice(0, 5).map(s => ({ name: s.name, id: s.id, numericId: (s as any).storeId })));
      
      // Get unique store names from Excel
      const excelStoreNames = new Set<string>();
      excelData.forEach(row => {
        const storeName = row['Store Name'] || row['store name'] || row['StoreName'] || '';
        if (storeName) excelStoreNames.add(storeName.toString().trim());
      });
      console.log(`📊 Unique store names in Excel file: ${excelStoreNames.size}`);
      console.log('📋 Store names from Excel:', Array.from(excelStoreNames).slice(0, 10));
      
      // Helper function to normalize store names for matching
      const normalizeStoreName = (name: string): string => {
        return name.toLowerCase().trim().replace(/\s+/g, ' '); // Normalize whitespace
      };
      
      // Create multiple lookup maps for flexible matching
      // IMPORTANT: Use store.id (UUID) for consistency with manually created coupons
      // The create API will convert UUID to numeric Store Id when saving to 'Store  Id' field
      const exactMatchMap = new Map<string, { id: string; name: string; numericId?: string }>();
      const normalizedMatchMap = new Map<string, { id: string; name: string; numericId?: string }>();
      
      allStores.forEach(store => {
        if (store.name && store.id) {
          // Use store.id (UUID) as primary ID for consistency with manual creation
          // Also keep numeric Store Id for reference
          const numericStoreId = (store as any).storeId;
          const normalizedName = normalizeStoreName(store.name);
          const storeInfo = { 
            id: store.id, // UUID - this is what we'll use in storeIds array
            name: store.name,
            numericId: numericStoreId // Keep for reference
          };
          exactMatchMap.set(store.name.toLowerCase().trim(), storeInfo);
          normalizedMatchMap.set(normalizedName, storeInfo);
        }
      });
      
      console.log(`📊 Created lookup maps: ${exactMatchMap.size} exact matches, ${normalizedMatchMap.size} normalized matches`);
      
      // Helper function to find store by name (with flexible matching)
      const findStoreId = (excelStoreName: string): { id: string; name: string } | null => {
        const normalizedExcelName = normalizeStoreName(excelStoreName);
        
        // Try 1: Exact match (case-insensitive, trimmed)
        let match = exactMatchMap.get(excelStoreName.toLowerCase().trim());
        if (match) return match;
        
        // Try 2: Normalized exact match
        match = normalizedMatchMap.get(normalizedExcelName);
        if (match) return match;
        
        // Try 3: Partial match - Excel name contains in database store name
        for (const [dbName, storeInfo] of normalizedMatchMap.entries()) {
          if (dbName.includes(normalizedExcelName) || normalizedExcelName.includes(dbName)) {
            return storeInfo;
          }
        }
        
        // Try 4: Word-by-word match (e.g., "32 Degrees" matches "32 Degrees HEAT COOL")
        const excelWords = normalizedExcelName.split(/\s+/).filter(w => w.length > 0);
        if (excelWords.length > 0) {
          for (const [dbName, storeInfo] of normalizedMatchMap.entries()) {
            const dbWords = dbName.split(/\s+/).filter(w => w.length > 0);
            // Check if all words from Excel are in database store name
            const allWordsMatch = excelWords.every(word => 
              dbWords.some(dbWord => dbWord.includes(word) || word.includes(dbWord))
            );
            if (allWordsMatch && excelWords.length > 0) {
              return storeInfo;
            }
          }
        }
        
        return null;
      };
      
      for (const row of excelData) {
        try {
          const storeName = row['Store Name'] || row['store name'] || row['StoreName'] || '';
          if (!storeName || storeName.toString().trim() === '') {
            throw new Error('Store Name is required');
          }
          
          // Find store ID from store name (with flexible matching)
          console.log(`🔍 Looking for store: "${storeName}"`);
          const storeMatch = findStoreId(storeName.toString());
          if (!storeMatch) {
            // Suggest similar store names
            const excelNormalized = normalizeStoreName(storeName.toString());
            console.log(`❌ Store not found: "${storeName}" (normalized: "${excelNormalized}")`);
            console.log(`📋 Available stores in database (first 20):`, Array.from(exactMatchMap.keys()).slice(0, 20));
            
            const suggestions = Array.from(normalizedMatchMap.keys())
              .filter(name => {
                const words = excelNormalized.split(/\s+/);
                return words.some(word => name.includes(word)) || 
                       name.split(/\s+/).some(word => excelNormalized.includes(word));
              })
              .slice(0, 5)
              .map(name => {
                const info = normalizedMatchMap.get(name);
                return info ? info.name : name;
              });
            
            const suggestionText = suggestions.length > 0 
              ? ` Similar stores found: ${suggestions.join(', ')}`
              : '';
            throw new Error(`Store "${storeName}" not found in database.${suggestionText}`);
          }
          
          console.log(`✅ Found store: "${storeMatch.name}" (UUID: ${storeMatch.id}, Numeric ID: ${(storeMatch as any).numericId || 'N/A'})`);
          
          const storeId = storeMatch.id;
          const actualStoreName = storeMatch.name;
          
          const title = row['Title'] || row['title'] || storeName;
          const description = row['Description'] || row['description'] || title;
          const code = row['Code'] || row['code'] || '';
          const type = (row['Type'] || row['type'] || 'deal').toString().toLowerCase();
          const couponType = type === 'code' ? 'code' : 'deal';
          const expiryDateStr = row['Expiry'] || row['expiry'] || row['Expiry Date'] || row['ExpiryDate'] || '';
          const deeplink = row['Deeplink'] || row['deeplink'] || '';
          
          // Parse expiry date - convert to ISO string for API
          let expiryDate: string | null = null;
          if (expiryDateStr) {
            try {
              const parsedDate = new Date(expiryDateStr);
              if (!isNaN(parsedDate.getTime())) {
                expiryDate = parsedDate.toISOString();
              }
            } catch (e) {
              console.warn('Invalid expiry date:', expiryDateStr);
            }
          }
          
          // Create coupon (actualStoreName already found above)
          // storeMatch.id is UUID, which is correct - API will convert to numeric Store Id
          console.log(`Creating coupon: ${title} for store: ${actualStoreName} (UUID: ${storeMatch.id}, Numeric ID: ${(storeMatch as any).numericId || 'N/A'})`);
          const result = await createCouponFromUrl({
            code: code.toString(),
            storeName: actualStoreName, // Use actual store name from database
            title: title.toString().trim(), // Pass title as title field
            storeIds: [storeMatch.id], // Use UUID from storeMatch for consistency with manual creation
            discount: 0, // Default, can be extracted from description if needed
            discountType: 'percentage',
            description: description.toString().trim(),
            isActive: true,
            maxUses: 1000,
            currentUses: 0,
            expiryDate: expiryDate as any, // API will handle the string format
            couponType: couponType,
            url: deeplink.toString() || undefined,
          }, ''); // No logo URL from Excel
          
          if (result.success) {
            console.log(`✅ Coupon created successfully: ${title}`);
            successCount++;
          } else {
            throw new Error(result.error || 'Failed to create coupon');
          }
        } catch (error: any) {
          console.error(`❌ Error creating coupon for row ${successCount + errorCount + 1}:`, error);
          errorCount++;
          const errorMessage = error.message || error.toString() || 'Unknown error';
          errors.push(`Row ${successCount + errorCount + 1} - ${row['Store Name'] || row['store name'] || 'Unknown'}: ${errorMessage}`);
        }
      }
      
      const errorSummary = errors.length > 0 
        ? `\n\nFirst 10 errors:\n${errors.slice(0, 10).join('\n')}` 
        : '';
      
      alert(`Import completed!\n✅ Success: ${successCount}\n❌ Errors: ${errorCount}${errorSummary}`);
      
      // Refresh coupons list - force full refresh with cache bypass
      console.log('⏳ Waiting 2 seconds for database to update...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('🔄 Refreshing coupons list from Supabase...');
      
      // Direct API call with cache bypass to ensure we get fresh data
      setLoading(true);
      try {
        const url = `/api/coupons/get?_t=${Date.now()}`;
        console.log('📡 Fetching from:', url);
        const res = await fetch(url);
        
        if (res.ok) {
          const responseData = await res.json();
          console.log('📦 API Response after import:', {
            success: responseData.success,
            couponCount: responseData.coupons?.length || 0,
            hasCoupons: !!responseData.coupons
          });
          
          if (responseData.success && responseData.coupons && Array.isArray(responseData.coupons)) {
            console.log(`✅ Found ${responseData.coupons.length} coupons in API response after import`);
            const sortedCoupons = responseData.coupons.sort((a: Coupon, b: Coupon) => {
              const idA = parseInt(String(a.id || '0'), 10) || 0;
              const idB = parseInt(String(b.id || '0'), 10) || 0;
              return idA - idB;
            });
            setCoupons(sortedCoupons);
            console.log(`✅ Set ${sortedCoupons.length} coupons in state after import`);
          } else {
            console.error('❌ Invalid response format:', responseData);
            // Try fallback
            const fallbackData = await getCoupons();
            const sortedFallback = fallbackData.sort((a, b) => {
              const idA = parseInt(String(a.id || '0'), 10) || 0;
              const idB = parseInt(String(b.id || '0'), 10) || 0;
              return idA - idB;
            });
            setCoupons(sortedFallback);
            console.log(`✅ Fallback: Set ${sortedFallback.length} coupons from getCoupons()`);
          }
        } else {
          console.error('❌ API request failed:', res.status);
          // Fallback to getCoupons
          const fallbackData = await getCoupons();
          const sortedFallback = fallbackData.sort((a, b) => {
            const idA = parseInt(String(a.id || '0'), 10) || 0;
            const idB = parseInt(String(b.id || '0'), 10) || 0;
            return idA - idB;
          });
          setCoupons(sortedFallback);
          console.log(`✅ Fallback: Set ${sortedFallback.length} coupons from getCoupons()`);
        }
      } catch (error) {
        console.error('❌ Error refreshing coupons after import:', error);
        // Final fallback
        try {
          const fallbackData = await getCoupons();
          const sortedFallback = fallbackData.sort((a, b) => {
            const idA = parseInt(String(a.id || '0'), 10) || 0;
            const idB = parseInt(String(b.id || '0'), 10) || 0;
            return idA - idB;
          });
          setCoupons(sortedFallback);
        } catch (fallbackError) {
          console.error('❌ All refresh methods failed:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
      
      // Reset form
      setExcelFile(null);
      setExcelData([]);
      setExcelPreviewData([]);
      setShowExcelPreview(false);
      const fileInput = document.getElementById('excel-import-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error: any) {
      alert(`Import failed: ${error.message}`);
    } finally {
      setImportingFromExcel(false);
    }
  };

  useEffect(() => {
    fetchCoupons(true); // Always bypass cache on initial load
    getCategories().then(setCategories);
    getStores().then((storesData) => {
      // Sort stores by numeric ID (1, 2, 3...)
      const sortedStores = storesData.sort((a, b) => {
        const idA = parseInt(String(a.id || '0'), 10) || 0;
        const idB = parseInt(String(b.id || '0'), 10) || 0;
        return idA - idB;
      });
      setStores(sortedStores);
    });
  }, []);

  // Compute selected store display text
  const selectedStoreDisplay = selectedStoreId 
    ? (() => {
        const selectedStore = stores.find(s => String(s.id) === String(selectedStoreId));
        return selectedStore ? `Selected: ${selectedStore.name}` : 'Select store...';
      })()
    : 'Select store...';

  // Refresh coupons when page becomes visible (e.g., returning from edit page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Page became visible, refreshing coupons...');
        fetchCoupons(true);
      }
    };

    const handleFocus = () => {
      console.log('🎯 Window focused, refreshing coupons...');
      fetchCoupons(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isCreating) return; // Prevent double submission
    
    setIsCreating(true);
    
    // Validate coupon code only if coupon type is 'code'
    if (formData.couponType === 'code' && (!formData.code || formData.code.trim() === '')) {
      alert('Please enter a coupon code (required for code type coupons)');
      setIsCreating(false);
      return;
    }
    
    // Validate required fields
    if (!formData.storeName || formData.storeName.trim() === '') {
      alert('Please enter a store name (Coupon Title)');
      setIsCreating(false);
      return;
    }
    
    // Check if popular layout position is already taken
    if (formData.layoutPosition && formData.isPopular) {
      const couponsAtPosition = coupons.filter(
        c => c.id && c.layoutPosition === formData.layoutPosition && c.isPopular
      );
      if (couponsAtPosition.length > 0) {
        if (!confirm(`Popular Layout ${formData.layoutPosition} is already assigned to "${couponsAtPosition[0].code}". Replace it?`)) {
          return;
        }
        // Clear position from other coupon
        await updateCoupon(couponsAtPosition[0].id!, { layoutPosition: null });
      }
    }
    
    // Check if latest layout position is already taken
    if (formData.latestLayoutPosition && formData.isLatest) {
      const couponsAtPosition = coupons.filter(
        c => c.id && c.latestLayoutPosition === formData.latestLayoutPosition && c.isLatest
      );
      if (couponsAtPosition.length > 0) {
        if (!confirm(`Latest Layout ${formData.latestLayoutPosition} is already assigned to "${couponsAtPosition[0].code}". Replace it?`)) {
          return;
        }
        // Clear position from other coupon
        await updateCoupon(couponsAtPosition[0].id!, { latestLayoutPosition: null });
      }
    }
    
    // Only set layoutPosition if coupon is popular
    const layoutPositionToSave = formData.isPopular ? formData.layoutPosition : null;
    // Only set latestLayoutPosition if coupon is latest
    const latestLayoutPositionToSave = formData.isLatest ? formData.latestLayoutPosition : null;
    
    // Prepare coupon data
    const couponData: any = {
      ...formData,
      discountType: 'percentage', // Always use percentage
      layoutPosition: layoutPositionToSave,
      latestLayoutPosition: latestLayoutPositionToSave,
    };
    
    // For deal type, don't include code field
    if (formData.couponType === 'deal') {
      delete couponData.code;
    }
    
    // Always include storeIds (even if empty array) to ensure it's saved
    // Filter out any undefined/null values
    // Convert to string and trim - handle both string and number types
    const validStoreIds = selectedStoreId ? [selectedStoreId] : []
      .map(id => String(id || ''))
      .filter(id => id.trim() !== '');
    couponData.storeIds = validStoreIds.length > 0 ? validStoreIds : [];
    
    // Debug log
    console.log('📝 Creating coupon with data:', {
      storeName: couponData.storeName,
      storeIds: couponData.storeIds,
      selectedStoreId: selectedStoreId,
      validStoreIds: validStoreIds,
      logoUrl: logoUrl,
      logoUploadMethod: logoUploadMethod,
      hasLogoFile: !!logoFile
    });
    
    try {
      let result;
      
      // Default placeholder image
      const defaultLogoUrl = 'https://www.iconpacks.net/icons/2/free-store-icon-2017-thumb.png';
      
      // If logoUrl is set (from Cloudinary upload), use URL method
      // Otherwise, if file is selected, try to upload it
      if (logoUrl && logoUrl.trim() !== '') {
        // Use the Cloudinary URL that was automatically uploaded
        console.log('Creating coupon with Cloudinary URL:', logoUrl);
        result = await createCouponFromUrl(couponData as Omit<Coupon, 'id'>, logoUrl);
      } else if (logoUploadMethod === 'file' && logoFile) {
        // File upload method - upload to Cloudinary first, then create coupon
        console.log('Creating coupon with file upload, logoFile:', logoFile);
        result = await createCoupon(couponData as Omit<Coupon, 'id'>, logoFile || undefined);
      } else {
        // URL method - use default logo if no logoUrl is provided
        const finalLogoUrl = logoUrl && logoUrl.trim() !== '' ? logoUrl : defaultLogoUrl;
        console.log('Creating coupon with URL, logoUrl:', finalLogoUrl);
        result = await createCouponFromUrl(couponData as Omit<Coupon, 'id'>, finalLogoUrl);
      }
      
      if (result.success && result.id) {
        alert('Coupon created successfully!');
        // Fetch only the newly created coupon instead of all coupons (much faster)
        try {
          const newCoupon = await getCouponById(result.id);
          if (newCoupon) {
            setCoupons(prevCoupons => {
              // Check if coupon already exists (avoid duplicates)
              const exists = prevCoupons.some(c => c.id === newCoupon.id);
              if (exists) {
                // Update existing coupon instead of adding duplicate
                return prevCoupons.map(c => c.id === newCoupon.id ? newCoupon : c);
              }
              // Add new coupon if it doesn't exist
              const updated = [...prevCoupons, newCoupon];
              // Sort to maintain order
              return updated.sort((a, b) => {
                const idA = parseInt(String(a.id || '0'), 10) || 0;
                const idB = parseInt(String(b.id || '0'), 10) || 0;
                return idA - idB;
              });
            });
          } else {
            // Fallback to full refresh if single fetch fails
            fetchCoupons();
          }
        } catch (error) {
          console.error('Error fetching new coupon, falling back to full refresh:', error);
          fetchCoupons();
        }
        setShowForm(false);
        setFormData({
          code: '',
          storeName: '',
          title: '', // Reset title field
          discount: 0,
          discountType: 'percentage',
          description: '',
          url: '',
          isActive: true,
          maxUses: 100,
          currentUses: 0,
          expiryDate: null,
          isPopular: false,
          layoutPosition: null,
          isLatest: false,
          latestLayoutPosition: null,
          categoryId: null,
          couponType: 'code',
          imageAlt: '',
          priority: 0,
          buttonText: '',
        });
        setLogoFile(null);
        setLogoPreview(null);
        setLogoUrl('');
        setExtractedLogoUrl(null);
        setFileInputKey(prev => prev + 1);
        setSelectedStoreId(null); // Reset selected store
        setUploadingToCloudinary(false); // Reset upload state
        setLogoUploadMethod('file'); // Reset to file method
      } else {
        // Show error message
        const errorMessage = result.error instanceof Error 
          ? result.error.message 
          : typeof result.error === 'string'
          ? result.error
          : 'Failed to create coupon. Please check console for details.';
        alert(`Error: ${errorMessage}`);
        console.error('Coupon creation failed:', result.error);
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
      alert(`Error creating coupon: ${error instanceof Error ? error.message : 'Unknown error. Please check console.'}`);
    } finally {
      setIsCreating(false);
    }
  };


  const handleLogoUrlChange = (url: string) => {
    setLogoUrl(url);
    if (isCloudinaryUrl(url)) {
      const extracted = extractOriginalCloudinaryUrl(url);
      setExtractedLogoUrl(extracted);
      setLogoPreview(extracted);
    } else {
      setExtractedLogoUrl(null);
      setLogoPreview(url);
    }
  };

  // Helper function to get logo from website URL (favicon)
  const getLogoFromWebsite = (url: string | null | undefined): string | null => {
    if (!url) return null;
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
    } catch {
      return null;
    }
  };

  // Function to fetch logo from store URLs (trackingLink, trackingUrl, websiteUrl)
  const fetchLogoFromStoreUrls = async (store: Store): Promise<string | null> => {
    // Priority 1: Use existing logoUrl if available
    if (store.logoUrl && store.logoUrl.trim() !== '') {
      return store.logoUrl;
    }

    // Priority 2: Try to extract from trackingLink
    if (store.trackingLink && store.trackingLink.trim() !== '') {
      try {
        const response = await fetch('/api/stores/extract-metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: store.trackingLink }),
        });
        const data = await response.json();
        if (data.success && data.logoUrl) {
          return data.logoUrl;
        }
      } catch (error) {
        console.warn('Failed to extract logo from trackingLink:', error);
      }
      // Fallback to favicon if extraction fails
      const favicon = getLogoFromWebsite(store.trackingLink);
      if (favicon) return favicon;
    }

    // Priority 3: Try to extract from trackingUrl
    if (store.trackingUrl && store.trackingUrl.trim() !== '') {
      try {
        const response = await fetch('/api/stores/extract-metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: store.trackingUrl }),
        });
        const data = await response.json();
        if (data.success && data.logoUrl) {
          return data.logoUrl;
        }
      } catch (error) {
        console.warn('Failed to extract logo from trackingUrl:', error);
      }
      // Fallback to favicon if extraction fails
      const favicon = getLogoFromWebsite(store.trackingUrl);
      if (favicon) return favicon;
    }

    // Priority 4: Try to extract from websiteUrl
    if (store.websiteUrl && store.websiteUrl.trim() !== '') {
      try {
        const response = await fetch('/api/stores/extract-metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: store.websiteUrl }),
        });
        const data = await response.json();
        if (data.success && data.logoUrl) {
          return data.logoUrl;
        }
      } catch (error) {
        console.warn('Failed to extract logo from websiteUrl:', error);
      }
      // Fallback to favicon if extraction fails
      const favicon = getLogoFromWebsite(store.websiteUrl);
      if (favicon) return favicon;
    }

    return null;
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this coupon?')) {
      // Optimistically remove from UI immediately
      const couponToDelete = coupons.find(c => c.id === id);
      setCoupons(prevCoupons => prevCoupons.filter(c => c.id !== id));
      
      try {
        const result = await deleteCoupon(id);
        if (!result.success) {
          // Restore coupon if delete failed
          if (couponToDelete) {
            setCoupons(prevCoupons => {
              const updated = [...prevCoupons, couponToDelete];
              // Sort to maintain order
              return updated.sort((a, b) => {
                const idA = parseInt(String(a.id || '0'), 10) || 0;
                const idB = parseInt(String(b.id || '0'), 10) || 0;
                return idA - idB;
              });
            });
          }
          alert(`Failed to delete coupon: ${result.error || 'Unknown error'}`);
        }
      } catch (error: any) {
        // Restore coupon if delete failed
        if (couponToDelete) {
          setCoupons(prevCoupons => {
            const updated = [...prevCoupons, couponToDelete];
            // Sort to maintain order
            return updated.sort((a, b) => {
              const idA = parseInt(String(a.id || '0'), 10) || 0;
              const idB = parseInt(String(b.id || '0'), 10) || 0;
              return idA - idB;
            });
          });
        }
        alert(`Failed to delete coupon: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleDeleteAll = async () => {
    const couponCount = coupons.length;
    if (couponCount === 0) {
      alert('No coupons to delete.');
      return;
    }

    // First confirmation
    const firstConfirm = confirm(
      `⚠️ WARNING: This will delete ALL ${couponCount} coupons!\n\nAre you sure you want to continue?`
    );

    if (!firstConfirm) return;

    // Second confirmation (double check for safety)
    const secondConfirm = confirm(
      `🚨 FINAL WARNING: You are about to DELETE ALL ${couponCount} COUPONS!\n\nThis action CANNOT be undone!\n\nType OK in the next prompt to confirm.`
    );

    if (!secondConfirm) return;

    // Third confirmation with text input simulation
    const finalText = prompt(
      `Type "DELETE ALL" (without quotes) to confirm deletion of all ${couponCount} coupons:`
    );

    if (finalText !== 'DELETE ALL') {
      alert('Deletion cancelled. You must type "DELETE ALL" exactly to confirm.');
      return;
    }

    try {
      // Optimistically clear the UI
      setCoupons([]);
      
      const result = await deleteAllCoupons();
      
      if (result.success) {
        alert(`✅ Successfully deleted ${result.deletedCount || couponCount} coupons!`);
        // Refresh the list (should be empty now)
        fetchCoupons();
      } else {
        // Restore coupons if delete failed
        fetchCoupons();
        alert(`❌ Failed to delete all coupons: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      // Restore coupons if delete failed
      fetchCoupons();
      alert(`❌ Failed to delete all coupons: ${error.message || 'Unknown error'}`);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    if (coupon.id) {
      const newActiveStatus = !coupon.isActive;
      // Optimistically update UI immediately
      setCoupons(prevCoupons =>
        prevCoupons.map(c =>
          c.id === coupon.id ? { ...c, isActive: newActiveStatus } : c
        )
      );
      
      try {
        await updateCoupon(coupon.id, { isActive: newActiveStatus });
      } catch (error: any) {
        // Revert on error
        setCoupons(prevCoupons =>
          prevCoupons.map(c =>
            c.id === coupon.id ? { ...c, isActive: coupon.isActive } : c
          )
        );
        alert(`Failed to update coupon: ${error.message || 'Unknown error'}`);
      }
    }
  };

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredCoupons.map(coupon => coupon.id).filter(Boolean) as string[];
      setSelectedCouponIds(allIds);
      setIsSelectAll(true);
    } else {
      setSelectedCouponIds([]);
      setIsSelectAll(false);
    }
  };

  // Handle individual coupon checkbox
  const handleCouponSelect = (couponId: string, checked: boolean) => {
    if (checked) {
      setSelectedCouponIds([...selectedCouponIds, couponId]);
    } else {
      setSelectedCouponIds(selectedCouponIds.filter(id => id !== couponId));
      setIsSelectAll(false);
    }
  };

  // Bulk enable/disable coupons
  const handleBulkStatusUpdate = async (isActive: boolean) => {
    if (selectedCouponIds.length === 0) {
      alert('Please select at least one coupon.');
      return;
    }
    
    if (!confirm(`Are you sure you want to ${isActive ? 'enable' : 'disable'} ${selectedCouponIds.length} coupon(s)?`)) {
      return;
    }
    
    setBulkUpdating(true);
    try {
      const updatePromises = selectedCouponIds.map(couponId => 
        updateCoupon(couponId, { isActive })
      );
      
      await Promise.all(updatePromises);
      
      // Refresh coupons
      await fetchCoupons(true);
      
      // Clear selection
      setSelectedCouponIds([]);
      setIsSelectAll(false);
      
      alert(`Successfully ${isActive ? 'enabled' : 'disabled'} ${selectedCouponIds.length} coupon(s).`);
    } catch (error) {
      console.error('Error updating coupons:', error);
      alert('Failed to update coupons. Please try again.');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleToggleLatest = async (coupon: Coupon) => {
    if (coupon.id) {
      const newLatestStatus = !coupon.isLatest;
      // If removing from latest, also clear layout position
      const updates: Partial<Coupon> = { 
        isLatest: newLatestStatus,
        ...(newLatestStatus ? {} : { latestLayoutPosition: null })
      };
      
      // Optimistically update UI immediately
      setCoupons(prevCoupons =>
        prevCoupons.map(c =>
          c.id === coupon.id ? { ...c, ...updates } : c
        )
      );
      
      try {
        await updateCoupon(coupon.id, updates);
      } catch (error: any) {
        // Revert on error
        setCoupons(prevCoupons =>
          prevCoupons.map(c =>
            c.id === coupon.id ? { ...c, isLatest: coupon.isLatest, latestLayoutPosition: coupon.latestLayoutPosition } : c
          )
        );
        alert(`Failed to update coupon: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleTogglePopular = async (coupon: Coupon) => {
    if (coupon.id) {
      const newPopularStatus = !coupon.isPopular;
      // If removing from popular, also clear layout position
      const updates: Partial<Coupon> = { 
        isPopular: newPopularStatus,
        ...(newPopularStatus ? {} : { layoutPosition: null })
      };
      
      // Optimistically update UI immediately
      setCoupons(prevCoupons =>
        prevCoupons.map(c =>
          c.id === coupon.id ? { ...c, ...updates } : c
        )
      );
      
      try {
        await updateCoupon(coupon.id, updates);
      } catch (error: any) {
        // Revert on error
        setCoupons(prevCoupons =>
          prevCoupons.map(c =>
            c.id === coupon.id ? { ...c, isPopular: coupon.isPopular, layoutPosition: coupon.layoutPosition } : c
          )
        );
        alert(`Failed to update coupon: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleAssignLatestLayoutPosition = async (coupon: Coupon, position: number | null) => {
    if (!coupon.id) return;
    
    // Check if position is already taken by another coupon
    let couponToClear: Coupon | null = null;
    if (position !== null) {
      const couponsAtPosition = coupons.filter(
        c => c.id !== coupon.id && c.latestLayoutPosition === position && c.isLatest
      );
      if (couponsAtPosition.length > 0) {
        if (!confirm(`Latest Layout ${position} is already assigned to "${couponsAtPosition[0].code}". Replace it?`)) {
          return;
        }
        couponToClear = couponsAtPosition[0];
      }
    }
    
    // Optimistically update UI immediately
    setCoupons(prevCoupons =>
      prevCoupons.map(c => {
        if (c.id === coupon.id) {
          return { ...c, latestLayoutPosition: position };
        }
        if (couponToClear && c.id === couponToClear.id) {
          return { ...c, latestLayoutPosition: null };
        }
        return c;
      })
    );
    
    try {
      if (couponToClear) {
        await updateCoupon(couponToClear.id!, { latestLayoutPosition: null });
      }
      await updateCoupon(coupon.id, { latestLayoutPosition: position });
    } catch (error: any) {
      // Revert on error
      fetchCoupons();
      alert(`Failed to update layout position: ${error.message || 'Unknown error'}`);
    }
  };

  const handleAssignLayoutPosition = async (coupon: Coupon, position: number | null) => {
    if (!coupon.id) return;
    
    // Check if position is already taken by another coupon
    let couponToClear: Coupon | null = null;
    if (position !== null) {
      const couponsAtPosition = coupons.filter(
        c => c.id !== coupon.id && c.layoutPosition === position && c.isPopular
      );
      if (couponsAtPosition.length > 0) {
        if (!confirm(`Popular Layout ${position} is already assigned to "${couponsAtPosition[0].code}". Replace it?`)) {
          return;
        }
        couponToClear = couponsAtPosition[0];
      }
    }
    
    // Optimistically update UI immediately
    setCoupons(prevCoupons =>
      prevCoupons.map(c => {
        if (c.id === coupon.id) {
          return { ...c, layoutPosition: position };
        }
        if (couponToClear && c.id === couponToClear.id) {
          return { ...c, layoutPosition: null };
        }
        return c;
      })
    );
    
    try {
      if (couponToClear) {
        await updateCoupon(couponToClear.id!, { layoutPosition: null });
      }
      await updateCoupon(coupon.id, { layoutPosition: position });
    } catch (error: any) {
      // Revert on error
      fetchCoupons();
      alert(`Failed to update layout position: ${error.message || 'Unknown error'}`);
    }
  };

  // Filter coupons based on search query and status
  const filteredCoupons = useMemo(() => {
    let filtered = coupons;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(coupon => {
        const isActive = coupon.isActive !== false; // Default to true if not set
        return statusFilter === 'enable' ? isActive : !isActive;
      });
    }
    
    // Apply search query filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(coupon => 
        coupon.storeName?.toLowerCase().includes(query) ||
        coupon.code?.toLowerCase().includes(query) ||
        coupon.title?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [coupons, searchQuery, statusFilter]);

  // Update select all state when individual selections change
  useEffect(() => {
    if (filteredCoupons.length > 0) {
      const allSelected = filteredCoupons.every(coupon => 
        coupon.id && selectedCouponIds.includes(coupon.id)
      );
      setIsSelectAll(allSelected);
    } else {
      setIsSelectAll(false);
    }
  }, [selectedCouponIds, filteredCoupons]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Manage Coupons</h1>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportCoupons}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-semibold whitespace-nowrap"
          >
            Export Coupons (CSV)
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
          >
            {showForm ? 'Cancel' : 'Create New Coupon'}
          </button>
          <button
            type="button"
            onClick={handleDeleteAll}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-semibold whitespace-nowrap"
            title="Delete all coupons (⚠️ This action cannot be undone)"
          >
            🗑️ Delete All Coupons
          </button>
        </div>
      </div>

      {/* Excel Bulk Upload Section */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            📤 Bulk Upload Coupons from Excel
          </h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-700 mb-2">
              Upload an Excel file (.xlsx) with the following columns:
            </p>
            <ul className="text-xs text-gray-600 list-disc list-inside mb-4 bg-white p-3 rounded border border-gray-200">
              <li><strong>Store Name</strong> (required) - Must match existing store name in database</li>
              <li><strong>Title</strong> - Coupon title/name</li>
              <li><strong>Description</strong> - Coupon description</li>
              <li><strong>Code</strong> - Coupon code (if type is "code")</li>
              <li><strong>Type</strong> - "code" or "deal"</li>
              <li><strong>Expiry</strong> - Expiry date (MM/DD/YYYY or any valid date format)</li>
              <li><strong>Deeplink</strong> - Coupon URL/deeplink</li>
            </ul>
            
            <input
              id="excel-import-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-500 file:text-white
                hover:file:bg-blue-600
                cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={importingFromExcel}
            />
          </div>
          
          {showExcelPreview && excelPreviewData.length > 0 && (
            <div className="bg-white p-3 rounded border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Preview ({excelData.length} total rows, showing first {excelPreviewData.length}):
              </h4>
              <div className="overflow-x-auto max-h-64 overflow-y-auto border border-gray-200 rounded">
                <table className="min-w-full text-xs">
                  <thead className="bg-blue-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left font-semibold">Store Name</th>
                      <th className="px-2 py-1 text-left font-semibold">Title</th>
                      <th className="px-2 py-1 text-left font-semibold">Code</th>
                      <th className="px-2 py-1 text-left font-semibold">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excelPreviewData.map((row, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-2 py-1">{row['Store Name'] || row['store name'] || row['StoreName'] || ''}</td>
                        <td className="px-2 py-1">{row['Title'] || row['title'] || ''}</td>
                        <td className="px-2 py-1 font-mono">{row['Code'] || row['code'] || ''}</td>
                        <td className="px-2 py-1">{row['Type'] || row['type'] || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {excelData.length > 0 && (
            <button
              onClick={handleImportFromExcel}
              disabled={importingFromExcel}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 text-sm"
            >
              {importingFromExcel ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Importing {excelData.length} coupons...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>📤 Import {excelData.length} Coupons from Excel</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Create New Coupon
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            {/* Add this new section for store selection */}
            <div>
              {/* Title */}
              <h3 className="text-center font-bold text-gray-700 mb-3">Select Store (Optional)</h3>
              
              {stores.length > 0 ? (
                <div className="relative" ref={storeDropdownRef}>
                  {/* Collapsed Dropdown Button */}
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={selectedStoreDisplay}
                      onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-gray-50 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      <svg
                        className={`w-5 h-5 transition-transform ${isStoreDropdownOpen ? 'transform rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Dropdown Menu */}
                  {isStoreDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {/* Search Bar */}
                      <div className="p-2 border-b border-gray-200">
                        <input
                          type="text"
                          value={manualStoreId}
                          onChange={(e) => {
                            setManualStoreId(e.target.value);
                          }}
                          onFocus={() => setIsStoreDropdownOpen(true)}
                          placeholder="Search by name or ID..."
                          className="w-full px-3 py-2 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
                        />
                      </div>
                      
                      {/* Store List */}
                      <div className="max-h-60 overflow-y-auto">
                        {stores
                          .filter((store, index) => {
                            // Filter stores based on manualStoreId input (can be name or ID)
                            if (!manualStoreId.trim()) {
                              return true; // Show all stores if no input
                            }
                            
                            const searchQuery = manualStoreId.trim().toLowerCase();
                            
                            // Search by store name (case-insensitive)
                            const nameMatch = store.name?.toLowerCase().includes(searchQuery);
                            
                            // Search by numeric Store ID
                            const numericStoreId = (store as any).storeId;
                            const storeIdMatch = numericStoreId && String(numericStoreId).includes(searchQuery);
                            
                            // Search by UUID (id field) - convert to string first
                            const uuidMatch = store.id && String(store.id).toLowerCase().includes(searchQuery);
                            
                            // Search by index (1-based) if input is a number
                            const inputNum = parseInt(searchQuery, 10);
                            const indexMatch = !isNaN(inputNum) && (index + 1 === inputNum);
                            
                            // Return true if any match is found
                            return nameMatch || storeIdMatch || uuidMatch || indexMatch;
                          })
                          .map((store, index) => {
                            // Get the actual store ID from the table (numeric storeId or UUID id)
                            const actualStoreId = (store as any).storeId || store.id || '-';
                            const isSelected = selectedStoreId === String(store.id || '');
                            return (
                              <label
                                key={store.id}
                                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <input
                                  type="radio"
                                  name="selectedStore"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (!store.id) {
                                      console.warn('⚠️ Store has no ID:', store);
                                      return;
                                    }
                                    
                                    const storeIdStr = String(store.id);
                                    
                                    // Single selection - set the selected store
                                    setSelectedStoreId(storeIdStr);
                                    
                                    // Auto-populate storeName and logoUrl from selected store
                                    const updates: Partial<Coupon> = { storeName: store.name };
                                    
                                    // Fetch logo from store (logoUrl, trackingLink, trackingUrl, or websiteUrl)
                                    const fetchLogo = async () => {
                                      const logo = await fetchLogoFromStoreUrls(store);
                                      if (logo) {
                                        updates.logoUrl = logo;
                                        setLogoUrl(logo);
                                        handleLogoUrlChange(logo);
                                        // Switch to URL method if logo is set
                                        setLogoUploadMethod('url');
                                        // Set logo preview to show the logo
                                        setLogoPreview(logo);
                                      } else {
                                        // Clear logo if store doesn't have one
                                        setLogoPreview(null);
                                        setLogoUrl('');
                                      }
                                      setFormData({ ...formData, ...updates } as any);
                                    };
                                    
                                    fetchLogo();
                                  }}
                                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="ml-3 text-sm text-gray-700">
                                  #{actualStoreId} {store.name}
                                </span>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                  <p className="text-sm text-gray-500">No stores available. Please create stores first.</p>
                </div>
              )}
            </div>

            {/* Coupon Type Selection */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Coupon Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center text-gray-900">
                  <input
                    type="radio"
                    name="couponType"
                    value="code"
                    checked={formData.couponType === 'code'}
                    onChange={(e) =>
                      setFormData({ ...formData, couponType: 'code' as const, code: formData.code || '' })
                    }
                    className="mr-2"
                  />
                  Code
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="radio"
                    name="couponType"
                    value="deal"
                    checked={formData.couponType === 'deal'}
                    onChange={(e) =>
                      setFormData({ ...formData, couponType: 'deal' as const, code: '' })
                    }
                    className="mr-2"
                  />
                  Deal
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Select whether this is a coupon code or a deal. Frontend will show "Get Code" for codes and "Get Deal" for deals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.couponType === 'code' && (
                <div>
                  <label htmlFor="code" className="block text-gray-700 text-sm font-semibold mb-2">
                    Coupon Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    placeholder="Coupon Code (e.g., SAVE20)"
                    value={formData.code || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Required for code type coupons
                  </p>
                </div>
              )}
              <div>
                <label htmlFor="title" className="block text-gray-700 text-sm font-semibold mb-2">
                  Coupon Title (Optional)
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="Coupon Title (e.g., 20% Off Sitewide)"
                  value={formData.title || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional: Title for this coupon (will be displayed on coupon card)
                </p>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Logo Upload Method</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center text-gray-900">
                  <input
                    type="radio"
                    name="logoUploadMethod"
                    value="file"
                    checked={logoUploadMethod === 'file'}
                    onChange={(e) => {
                      setLogoUploadMethod('file');
                      setLogoUrl('');
                      setExtractedLogoUrl(null);
                    }}
                    className="mr-2"
                  />
                  File Upload
                </label>
                <label className="flex items-center text-gray-900">
                  <input
                    type="radio"
                    name="logoUploadMethod"
                    value="url"
                    checked={logoUploadMethod === 'url'}
                    onChange={(e) => {
                      setLogoUploadMethod('url');
                      setLogoFile(null);
                    }}
                    className="mr-2"
                  />
                  URL (Cloudinary)
                </label>
              </div>
              
              {logoUploadMethod === 'file' ? (
                <>
                  <label htmlFor="logo" className="sr-only">Logo (PNG / SVG)</label>
                  <input
                    id="logo"
                    name="logo"
                    type="file"
                    accept="image/png,image/svg+xml,image/jpeg,image/jpg,image/webp"
                    onChange={async (e) => {
                      const file = e.target.files?.[0] ?? null;
                      setLogoFile(file);
                      
                      if (file) {
                        // Show preview immediately
                        setLogoPreview(URL.createObjectURL(file));
                        
                        // Automatically upload to Cloudinary
                        setUploadingToCloudinary(true);
                        try {
                          // Convert file to base64
                          const base64 = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => {
                              const result = reader.result as string;
                              const base64 = result.split(',')[1]; // Remove data URL prefix
                              resolve(base64);
                            };
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                          });

                          // Upload to Cloudinary via API
                          const uploadResponse = await fetch('/api/coupons/upload', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              fileName: file.name,
                              contentType: file.type || 'image/png',
                              base64: base64,
                            }),
                          });

                          const uploadData = await uploadResponse.json();

                          if (uploadData.success && uploadData.logoUrl) {
                            // Set the Cloudinary URL automatically
                            const cloudinaryUrl = uploadData.logoUrl;
                            setLogoUrl(cloudinaryUrl);
                            setExtractedLogoUrl(cloudinaryUrl);
                            
                            // Switch to URL method to show the uploaded URL
                            setLogoUploadMethod('url');
                            
                            console.log('✅ Logo uploaded to Cloudinary:', cloudinaryUrl);
                            console.log('📋 Cloudinary URL saved to state:', cloudinaryUrl);
                            alert('✅ Logo uploaded to Cloudinary successfully! URL has been copied.');
                          } else {
                            console.error('❌ Upload failed:', uploadData.error);
                            alert(`Upload failed: ${uploadData.error || 'Unknown error'}`);
                          }
                        } catch (error) {
                          console.error('❌ Error uploading to Cloudinary:', error);
                          alert(`Error uploading: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        } finally {
                          setUploadingToCloudinary(false);
                        }
                      } else {
                        setLogoPreview(null);
                        setLogoUrl('');
                        setExtractedLogoUrl(null);
                      }
                    }}
                    className="w-full"
                    key={`file-input-${fileInputKey}`}
                    disabled={uploadingToCloudinary}
                  />
                  {uploadingToCloudinary && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Uploading to Cloudinary...</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <label htmlFor="logoUrl" className="block text-gray-700 text-sm font-semibold mb-2">
                    Logo URL (Cloudinary URL)
                  </label>
                  <input
                    id="logoUrl"
                    name="logoUrl"
                    type="url"
                    value={logoUrl || ''}
                    onChange={(e) => handleLogoUrlChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="https://res.cloudinary.com/..."
                  />
                  {extractedLogoUrl && extractedLogoUrl !== logoUrl && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                      <strong>Extracted Original URL:</strong>
                      <div className="mt-1 break-all text-xs">{extractedLogoUrl}</div>
                    </div>
                  )}
                </>
              )}
              
              {/* Show Cloudinary URL if uploaded */}
              {logoUrl && logoUploadMethod === 'url' && (
                <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                  <strong>✅ Uploaded to Cloudinary:</strong>
                  <div className="mt-1 break-all text-xs">{logoUrl}</div>
                </div>
              )}
              
              {/* Show logo preview for both file uploads and URL-based logos */}
              {(logoPreview || (logoUrl && logoUploadMethod === 'url')) && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Logo Preview:</p>
                  <img 
                    src={logoPreview || logoUrl} 
                    alt="Logo preview" 
                    className="h-16 object-contain border border-gray-200 rounded p-1 bg-white"
                    onError={(e) => {
                      console.error('❌ Logo image failed to load:', logoPreview || logoUrl);
                      // Hide image on error
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('✅ Logo image loaded successfully:', logoPreview || logoUrl);
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="description" className="sr-only">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="url" className="block text-gray-700 text-sm font-semibold mb-2">
                Coupon URL (Where user should be redirected when clicking "Get Deal")
              </label>
              <input
                id="url"
                name="url"
                type="url"
                placeholder="https://example.com/coupon-page"
                value={formData.url || ''}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <p className="mt-1 text-xs text-gray-500">
                When user clicks "Get Deal", they will be redirected to this URL and the coupon code will be revealed.
              </p>
            </div>

            <div>
              <label htmlFor="expiryDate" className="block text-gray-700 text-sm font-semibold mb-2">
                Expiry Date (Optional)
              </label>
              <input
                id="expiryDate"
                name="expiryDate"
                type="date"
                value={
                  formData.expiryDate
                    ? (() => {
                        try {
                          let date: Date;
                          if (formData.expiryDate instanceof Date) {
                            date = formData.expiryDate;
                          } else if (formData.expiryDate && typeof (formData.expiryDate as any).toDate === 'function') {
                            // Firestore Timestamp
                            date = (formData.expiryDate as any).toDate();
                          } else if (typeof formData.expiryDate === 'string') {
                            date = new Date(formData.expiryDate);
                          } else {
                            date = new Date(formData.expiryDate as any);
                          }
                          return date.toISOString().slice(0, 10);
                        } catch {
                          return '';
                        }
                      })()
                    : ''
                }
                onChange={(e) => {
                  const dateValue = e.target.value;
                  if (dateValue) {
                    const date = new Date(dateValue);
                    setFormData({ ...formData, expiryDate: date.toISOString() } as any);
                  } else {
                    setFormData({ ...formData, expiryDate: null } as any);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional: Set when this coupon expires. Leave empty if no expiry date.
              </p>
            </div>

            <div>
              <label htmlFor="imageAlt" className="block text-gray-700 text-sm font-semibold mb-2">
                Coupon Image Alt
              </label>
              <input
                id="imageAlt"
                name="imageAlt"
                type="text"
                placeholder="Alt text for coupon image (for accessibility and SEO)"
                value={formData.imageAlt || ''}
                onChange={(e) =>
                  setFormData({ ...formData, imageAlt: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional: Alt text for the coupon image/logo (improves accessibility and SEO)
              </p>
            </div>

            <div>
              <label htmlFor="priority" className="block text-gray-700 text-sm font-semibold mb-2">
                Coupon Priority
              </label>
              <input
                id="priority"
                name="priority"
                type="number"
                placeholder="Priority (higher number = higher priority)"
                value={formData.priority || 0}
                onChange={(e) =>
                  setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional: Priority number (higher = shown first). Default is 0.
              </p>
            </div>

            <div className="flex items-center">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive || false}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-gray-700">Active</label>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Coupon'
              )}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading coupons...</div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No coupons created yet</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">
            {searchQuery || statusFilter !== 'all' 
              ? `No coupons found${searchQuery ? ` matching "${searchQuery}"` : ''}${statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}`
              : 'No coupons found'}
          </p>
          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="mt-4 text-blue-600 hover:text-blue-800 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Status Filter and Bulk Actions */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Status Filter */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-gray-700">Status Filter:</label>
                <div className="flex gap-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="statusFilter"
                      value="all"
                      checked={statusFilter === 'all'}
                      onChange={() => setStatusFilter('all')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">All</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="statusFilter"
                      value="enable"
                      checked={statusFilter === 'enable'}
                      onChange={() => setStatusFilter('enable')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Enable</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="statusFilter"
                      value="disable"
                      checked={statusFilter === 'disable'}
                      onChange={() => setStatusFilter('disable')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Disable</span>
                  </label>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedCouponIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 font-medium">
                    {selectedCouponIds.length} coupon(s) selected
                  </span>
                  <button
                    onClick={() => handleBulkStatusUpdate(true)}
                    disabled={bulkUpdating}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bulkUpdating ? 'Updating...' : 'Enable All'}
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate(false)}
                    disabled={bulkUpdating}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bulkUpdating ? 'Updating...' : 'Disable All'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCouponIds([]);
                      setIsSelectAll(false);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900">
                    <input
                      type="checkbox"
                      checked={isSelectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900">
                    Coupon ID
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">
                    Store Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">
                    Title
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">
                    Code
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">
                    Description
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">
                    Expiry Date
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Calculate pagination
                  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const paginatedCoupons = filteredCoupons.slice(startIndex, endIndex);
                  
                  return paginatedCoupons.map((coupon, index) => {
                    const isSelected = coupon.id && selectedCouponIds.includes(coupon.id);
                    return (
                      <tr key={`coupon-${coupon.id}-${index}`} className={`border-b hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                        <td className="px-3 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected || false}
                            onChange={(e) => coupon.id && handleCouponSelect(coupon.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-4">
                          <div className="font-mono text-xs text-gray-800 font-medium max-w-[120px] truncate" title={coupon.id}>
                            {startIndex + index + 1}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-gray-900">
                          {coupon.storeName || 'N/A'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={coupon.title || ''}>
                          {coupon.title || 'N/A'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-mono font-semibold text-xs sm:text-sm text-gray-900">
                          {coupon.code || (coupon.couponType === 'deal' ? 'deal' : 'N/A')}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-800 max-w-xs truncate" title={coupon.description}>
                          {coupon.description || 'No description'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-700">
                          {coupon.expiryDate 
                            ? (() => {
                                try {
                                  let date: Date;
                                  if (coupon.expiryDate instanceof Date) {
                                    date = coupon.expiryDate;
                                  } else if (coupon.expiryDate && typeof (coupon.expiryDate as any).toDate === 'function') {
                                    // Firestore Timestamp
                                    date = (coupon.expiryDate as any).toDate();
                                  } else if (typeof coupon.expiryDate === 'string') {
                                    date = new Date(coupon.expiryDate);
                                  } else {
                                    date = new Date(coupon.expiryDate as any);
                                  }
                                  return date.toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  });
                                } catch {
                                  return 'Invalid Date';
                                }
                              })()
                            : 'N/A'}
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <button
                            onClick={() => handleToggleActive(coupon)}
                            className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer whitespace-nowrap ${
                              coupon.isActive
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {coupon.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                            <Link
                              href={`/admin/coupons/${coupon.id}`}
                              className="inline-block bg-blue-100 text-blue-700 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-blue-200 text-center"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(coupon.id)}
                              className="bg-red-100 text-red-700 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Items per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-900"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600 ml-4">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredCoupons.length)} - {Math.min(currentPage * itemsPerPage, filteredCoupons.length)} of {filteredCoupons.length}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-700 px-3">
                Page {currentPage} of {Math.ceil(filteredCoupons.length / itemsPerPage)}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredCoupons.length / itemsPerPage), prev + 1))}
                disabled={currentPage >= Math.ceil(filteredCoupons.length / itemsPerPage)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(Math.ceil(filteredCoupons.length / itemsPerPage))}
                disabled={currentPage >= Math.ceil(filteredCoupons.length / itemsPerPage)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


