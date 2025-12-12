'use client';

import { useState } from 'react';
import { createStore, updateStore } from '@/lib/services/storeService';
import { createCouponFromUrl, updateCoupon } from '@/lib/services/couponService';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';

interface ExcelStore {
  'Store ID'?: string;
  'Store Name': string;
  'Description'?: string;
  'Logo URL'?: string;
  'Website URL'?: string;
  'Voucher Text'?: string;
  'Category ID'?: string;
  'Slug'?: string;
  'About Text'?: string;
  'Established Year'?: number;
  'Headquarters'?: string;
  'Trust Score'?: number;
  [key: string]: any;
}

interface ExcelCoupon {
  'Coupon ID'?: string;
  'Store ID'?: string;
  'Store IDs'?: string; // Comma-separated store IDs
  'Title': string;
  'Description': string;
  'Code'?: string;
  'Type': 'code' | 'deal';
  'Discount': number;
  'Discount Type': 'percentage' | 'fixed';
  'Coupon URL'?: string;
  'Tracking URL'?: string;
  'Logo URL'?: string;
  'Expiry Date'?: string;
  'Button Text'?: string;
  'Deal Scope'?: 'sitewide' | 'online-only';
  'Category ID'?: string;
  'Is Popular'?: boolean | string;
  'Is Active'?: boolean | string;
  [key: string]: any;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'stores' | 'coupons'>('stores');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      
      // Preview data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', importType);
      
      try {
        const response = await fetch('/api/import/excel', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        if (data.success) {
          setExcelData(data.data);
          setPreviewData(data.data.slice(0, 10)); // Show first 10 rows
          setShowPreview(true);
        } else {
          alert(`Error reading file: ${data.error}`);
        }
      } catch (error: any) {
        alert(`Error: ${error.message}`);
      }
    }
  };

  const handleImport = async () => {
    if (!file || excelData.length === 0) return;
    
    setImporting(true);
    setResult(null);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      const imported: string[] = [];

      if (importType === 'stores') {
        for (const row of excelData as ExcelStore[]) {
          try {
            const storeName = row['Store Name'];
            if (!storeName || storeName.trim() === '') {
              throw new Error('Store Name is required');
            }

            const storeId = row['Store ID'] ? String(row['Store ID']).trim() : '';

            // Read fields from multiple possible column names so exports can be reused directly
            const description =
              row['Description'] ?? row['description'] ?? row.description ?? '';

            // Get Logo Url from various possible column names (handling CSV variations)
            let logoUrl =
              row['Logo URL'] ?? row['Logo Url'] ?? row['logoUrl'] ?? row['Logo'] ?? row.logoUrl ?? row.logo ?? '';

            // Get Store Url from various possible column names (handling CSV variations)
            const storeUrl =
              row['Store URL'] ?? row['Store Url'] ?? row['storeUrl'] ?? 
              row['Website URL'] ?? row['Website Url'] ?? row['websiteUrl'] ?? row.websiteUrl ?? '';

            // Helper function to extract logo from a URL
            const extractLogoFromUrl = async (url: string): Promise<string | null> => {
              if (!url || url.trim() === '') return null;

              // Check if it's already a direct image URL
              const imageExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];
              const isDirectImageUrl = imageExtensions.some(ext => 
                url.toLowerCase().includes(ext)
              );

              // If it's a direct image URL, return it as-is
              if (isDirectImageUrl) {
                return url;
              }

              // If it's not a direct image URL, extract logo from the website
              try {
                const extractResponse = await fetch('/api/stores/extract-metadata', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url: url }),
                });

                const extractData = await extractResponse.json();

                if (extractData.success && extractData.logoUrl) {
                  // Return the extracted logo URL
                  return extractData.logoUrl;
                }
              } catch (extractError) {
                console.warn(`Failed to extract logo from ${url}:`, extractError);
              }

              return null;
            };

            // Default logo URL
            const defaultLogoUrl = 'https://www.iconpacks.net/icons/2/free-store-icon-2017-thumb.png';

            // Try to extract logo from Logo Url first
            let extractedLogoUrl: string | null = null;
            if (logoUrl && logoUrl.trim() !== '') {
              extractedLogoUrl = await extractLogoFromUrl(logoUrl);
            }

            // If Logo Url extraction failed or is empty, try extracting from Store Url
            if (!extractedLogoUrl && storeUrl && storeUrl.trim() !== '') {
              extractedLogoUrl = await extractLogoFromUrl(storeUrl);
            }

            // Use extracted logo if found, otherwise use default
            if (extractedLogoUrl) {
              logoUrl = extractedLogoUrl;
            } else {
              // If extraction failed or no logo URL was provided, use default logo
              logoUrl = defaultLogoUrl;
            }

            const websiteUrl = storeUrl;

            const voucherText =
              row['Voucher Text'] ?? row['voucherText'] ?? row.voucherText ?? '';

            const categoryId =
              row['Category ID'] ?? row['Category Id'] ?? row.categoryId ?? null;

            const slug =
              row['Slug'] ?? row.slug ?? storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            const merchantId =
              row['Merchant ID'] ?? row['Merchant Id'] ?? row.merchantId ?? '';

            const networkId =
              row['Network ID'] ?? row['Network Id'] ?? row.networkId ?? '';

            // Common store payload from Excel row
            const storePayload = {
              name: storeName.trim(),
              description,
              logoUrl,
              websiteUrl,
              voucherText,
              categoryId,
              slug,
              aboutText: row['About Text'] || '',
              establishedYear: row['Established Year'] ? Number(row['Established Year']) : undefined,
              headquarters: row['Headquarters'] || '',
              trustScore: row['Trust Score'] ? Number(row['Trust Score']) : undefined,
              isTrending: false,
              layoutPosition: null,
              merchantId,
              networkId,
            };

            if (storeId) {
              // Update existing store by Store ID
              const result = await updateStore(storeId, storePayload);
              if (!result.success) {
                throw new Error(result.error || 'Failed to update store');
              }
            } else {
              // Create new store when no Store ID is provided
              await createStore(storePayload);
            }

            successCount++;
            imported.push(storeName);
          } catch (error: any) {
            errorCount++;
            errors.push(`Row ${successCount + errorCount + 1} - ${row['Store Name'] || 'Unknown'}: ${error.message}`);
          }
        }
      } else {
        // Coupons import (supports both create and update by Coupon ID)
        for (const row of excelData as ExcelCoupon[]) {
          try {
            const title = row['Title'];
            if (!title || title.trim() === '') {
              throw new Error('Title is required');
            }

            const couponId = row['Coupon ID'] ? String(row['Coupon ID']).trim() : '';
            const couponType = (row['Type'] || 'code').toLowerCase() as 'code' | 'deal';
            const finalUrl = row['Tracking URL'] || row['Coupon URL'] || '';
            
            // Parse Store IDs - can be single ID or comma-separated
            let storeIds: string[] = [];
            if (row['Store IDs']) {
              storeIds = String(row['Store IDs']).split(',').map(id => id.trim()).filter(id => id);
            } else if (row['Store ID']) {
              storeIds = [String(row['Store ID']).trim()];
            }

            // Parse expiry date
            let expiryDate: Timestamp | null = null;
            if (row['Expiry Date']) {
              try {
                const date = new Date(row['Expiry Date']);
                if (!isNaN(date.getTime())) {
                  expiryDate = Timestamp.fromDate(date);
                }
              } catch (e) {
                console.warn('Invalid expiry date:', row['Expiry Date']);
              }
            }

            // Parse boolean values
            const isActive = row['Is Active'] === undefined ? true : 
                           String(row['Is Active']).toLowerCase() === 'true' || 
                           row['Is Active'] === true || 
                           Number(row['Is Active']) === 1;
            
            const isPopular = String(row['Is Popular']).toLowerCase() === 'true' || 
                            row['Is Popular'] === true || 
                            Number(row['Is Popular']) === 1;

            if (couponId) {
              // Bulk update existing coupon by Coupon ID
              const updates: any = {
                code: row['Code'] || '',
                storeName: title.trim(),
                discount: Number(row['Discount']) || 0,
                discountType: (row['Discount Type'] || 'percentage') as 'percentage' | 'fixed',
                description: row['Description'] || title,
                isActive: isActive,
                couponType: couponType,
                categoryId: row['Category ID'] || null,
              };

              if (finalUrl) {
                // API route expects dealUrl for updating URL-like field
                updates.dealUrl = finalUrl;
              }

              if (expiryDate) {
                try {
                  updates.expiryDate = (expiryDate as any).toDate
                    ? (expiryDate as any).toDate().toISOString()
                    : new Date(row['Expiry Date'] as any).toISOString();
                } catch {
                  // Ignore invalid expiry conversions
                }
              }

              const result = await updateCoupon(couponId, updates);
              if (!result.success) {
                throw new Error(result.error || 'Failed to update coupon');
              }
            } else {
              // Create new coupon when no Coupon ID is provided
              await createCouponFromUrl({
                code: row['Code'] || '',
                storeName: title.trim(),
                storeIds: storeIds.length > 0 ? storeIds : undefined,
                discount: Number(row['Discount']) || 0,
                discountType: (row['Discount Type'] || 'percentage') as 'percentage' | 'fixed',
                description: row['Description'] || title,
                isActive: isActive,
                maxUses: 1000,
                currentUses: 0,
                expiryDate: expiryDate,
                couponType: couponType,
                url: finalUrl,
                buttonText: row['Button Text'] || '',
                dealScope: row['Deal Scope'] as 'sitewide' | 'online-only' | undefined,
                categoryId: row['Category ID'] || null,
                isPopular: isPopular,
                layoutPosition: null,
                isLatest: false,
                latestLayoutPosition: null,
              }, row['Logo URL'] || '');
            }
            
            successCount++;
            imported.push(title);
          } catch (error: any) {
            errorCount++;
            errors.push(`Row ${successCount + errorCount + 1} - ${row['Title'] || 'Unknown'}: ${error.message}`);
          }
        }
      }

      setResult({
        success: true,
        successCount,
        errorCount,
        errors: errors.slice(0, 20), // Show first 20 errors
        imported: imported.slice(0, 10), // Show first 10 imported items
      });
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
      });
    } finally {
      setImporting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreviewData([]);
    setExcelData([]);
    setShowPreview(false);
    setResult(null);
    // Reset file input
    const fileInput = document.getElementById('excel-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Import from Excel</h1>
            <p className="text-gray-600">Upload Excel files to bulk import stores and coupons</p>
          </div>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Import Type Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Step 1: Select Import Type</h2>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setImportType('stores');
                resetForm();
              }}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                importType === 'stores'
                  ? 'bg-[#16a34a] text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🏪 Stores
            </button>
            <button
              onClick={() => {
                setImportType('coupons');
                resetForm();
              }}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                importType === 'coupons'
                  ? 'bg-[#16a34a] text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🎟️ Coupons
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Step 2: Upload Excel File</h2>
          
          {/* Expected Format Info */}
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Expected Columns for {importType === 'stores' ? 'Stores' : 'Coupons'}:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {importType === 'stores' ? (
                <>
                  <div className="text-sm text-blue-800">✓ <strong>Store Name</strong> (required)</div>
                  <div className="text-sm text-blue-800">• Store ID (optional)</div>
                  <div className="text-sm text-blue-800">• Description</div>
                  <div className="text-sm text-blue-800">• Logo URL</div>
                  <div className="text-sm text-blue-800">• Website URL</div>
                  <div className="text-sm text-blue-800">• Voucher Text</div>
                  <div className="text-sm text-blue-800">• Category ID</div>
                  <div className="text-sm text-blue-800">• Slug</div>
                  <div className="text-sm text-blue-800">• About Text</div>
                  <div className="text-sm text-blue-800">• Established Year</div>
                  <div className="text-sm text-blue-800">• Headquarters</div>
                  <div className="text-sm text-blue-800">• Trust Score (0-100)</div>
                </>
              ) : (
                <>
                  <div className="text-sm text-blue-800">✓ <strong>Title</strong> (required)</div>
                  <div className="text-sm text-blue-800">• Coupon ID (optional)</div>
                  <div className="text-sm text-blue-800">• Store ID or Store IDs (comma-separated)</div>
                  <div className="text-sm text-blue-800">• Description</div>
                  <div className="text-sm text-blue-800">• Code (for code type)</div>
                  <div className="text-sm text-blue-800">• Type (code/deal)</div>
                  <div className="text-sm text-blue-800">• Discount (number)</div>
                  {/* <div className="text-sm text-blue-800">• Discount Type (percentage/fixed)</div> */}
                  <div className="text-sm text-blue-800">• Coupon URL</div>
                  {/* <div className="text-sm text-blue-800">• Tracking URL (priority over Coupon URL)</div> */}
                  <div className="text-sm text-blue-800">• Logo URL</div>
                  <div className="text-sm text-blue-800">• Expiry Date (YYYY-MM-DD)</div>
                  <div className="text-sm text-blue-800">• Button Text</div>
                  {/* <div className="text-sm text-blue-800">• Deal Scope (sitewide/online-only)</div> */}
                  <div className="text-sm text-blue-800">• Category ID</div>
                  <div className="text-sm text-blue-800">• Is Popular (true/false)</div>
                  <div className="text-sm text-blue-800">• Is Active (true/false)</div>
                </>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Excel File (.xlsx or .xls)
            </label>
            <input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-3 hover:bg-gray-100 transition"
            />
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{file.name}</span>
              <span className="text-gray-500">({excelData.length} rows)</span>
              <button
                onClick={resetForm}
                className="ml-auto text-red-600 hover:text-red-800 font-semibold"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Preview Data */}
        {showPreview && previewData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Step 3: Preview Data (First 10 rows)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">#</th>
                    {Object.keys(previewData[0]).map((key) => (
                      <th key={key} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500 font-medium">{idx + 1}</td>
                      {Object.values(row).map((value: any, i) => (
                        <td key={i} className="px-3 py-2 text-gray-900 max-w-xs truncate" title={String(value || '')}>
                          {String(value || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Total rows to import: <strong>{excelData.length}</strong>
            </p>
          </div>
        )}

        {/* Import Button */}
        {file && excelData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Step 4: Start Import</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex-1 px-6 py-4 bg-[#16a34a] text-white font-bold rounded-lg hover:bg-[#15803d] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Importing {importType}... Please wait
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import {excelData.length} {importType}
                  </>
                )}
              </button>
              {!importing && (
                <button
                  onClick={resetForm}
                  className="px-6 py-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Cancel
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              ⚠️ This will create {excelData.length} new {importType} in your database. Make sure the data is correct before importing.
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className={`rounded-lg shadow-lg p-6 ${
            result.success ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'
          }`}>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              {result.success ? (
                <>
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-green-900">Import Complete!</span>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-900">Import Failed</span>
                </>
              )}
            </h2>
            
            {result.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-gray-600 mb-1">Successfully Imported</p>
                    <p className="text-3xl font-bold text-green-600">{result.successCount}</p>
                  </div>
                  {result.errorCount > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-red-200">
                      <p className="text-sm text-gray-600 mb-1">Failed</p>
                      <p className="text-3xl font-bold text-red-600">{result.errorCount}</p>
                    </div>
                  )}
                </div>

                {result.imported && result.imported.length > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <p className="font-semibold text-green-900 mb-2">Sample Imported Items:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                      {result.imported.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                    {result.successCount > result.imported.length && (
                      <p className="text-xs text-gray-600 mt-2">
                        ...and {result.successCount - result.imported.length} more
                      </p>
                    )}
                  </div>
                )}
                
                {result.errorCount > 0 && result.errors.length > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-red-200">
                    <p className="font-semibold text-red-900 mb-2">Errors ({result.errorCount} total):</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700 max-h-60 overflow-y-auto">
                      {result.errors.map((error: string, idx: number) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Link
                    href={importType === 'stores' ? '/admin/stores' : '/admin/coupons'}
                    className="px-6 py-3 bg-[#16a34a] text-white rounded-lg hover:bg-[#15803d] transition font-semibold"
                  >
                    View {importType === 'stores' ? 'Stores' : 'Coupons'} →
                  </Link>
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                  >
                    Import More Files
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <p className="text-red-800 font-medium">{result.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Instructions</h2>
          <div className="space-y-3 text-gray-700">
            <p className="flex items-start gap-2">
              <span className="font-bold text-[#16a34a] flex-shrink-0">1.</span>
              <span>Prepare your Excel file with the required columns listed above</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-[#16a34a] flex-shrink-0">2.</span>
              <span>Make sure column names match exactly (case-sensitive)</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-[#16a34a] flex-shrink-0">3.</span>
              <span>Multiple sheets are supported - all sheets will be processed</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-[#16a34a] flex-shrink-0">4.</span>
              <span>For Logo URLs and Tracking URLs, use complete HTTP/HTTPS URLs</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-[#16a34a] flex-shrink-0">5.</span>
              <span>The system will automatically extract and optimize Cloudinary URLs</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-[#16a34a] flex-shrink-0">6.</span>
              <span>Store IDs and Coupon IDs will be auto-generated by Firestore</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-[#16a34a] flex-shrink-0">7.</span>
              <span>You can view all IDs in the Dashboard after import</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

