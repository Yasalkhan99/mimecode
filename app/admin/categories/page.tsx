'use client';

import { useEffect, useState } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory, Category } from '@/lib/services/categoryService';

// Color names with their hex codes
const COLOR_OPTIONS = [
  { name: 'Pink', value: '#FF6B9D' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Orange', value: '#FF8C00' },
  { name: 'Yellow', value: '#FFD700' },
  { name: 'Green', value: '#32CD32' },
  { name: 'Blue', value: '#1E90FF' },
  { name: 'Purple', value: '#9370DB' },
  { name: 'Indigo', value: '#4B0082' },
  { name: 'Cyan', value: '#00CED1' },
  { name: 'Magenta', value: '#FF00FF' },
  { name: 'Lime', value: '#00FF00' },
  { name: 'Teal', value: '#008080' },
  { name: 'Navy', value: '#000080' },
  { name: 'Maroon', value: '#800000' },
  { name: 'Olive', value: '#808000' },
  { name: 'Coral', value: '#FF7F50' },
  { name: 'Salmon', value: '#FA8072' },
  { name: 'Gold', value: '#DAA520' },
  { name: 'Turquoise', value: '#40E0D0' },
  { name: 'Violet', value: '#8A2BE2' },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [backgroundColor, setBackgroundColor] = useState('#FF6B9D');
  const [extractingLogo, setExtractingLogo] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const fetchCategories = async () => {
    setLoading(true);
    const data = await getCategories();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Auto-extract logo when category name changes
  useEffect(() => {
    // Don't extract if file is uploaded
    if (logoFile) {
      return;
    }

    // Don't extract if we're editing and already have a logo
    if (editingCategory && logoUrl && logoPreview) {
      return;
    }

    const extractLogo = async () => {
      if (!name.trim() || name.length < 2) {
        // Only clear if we're creating new category and no logo exists
        if (!editingCategory && !logoUrl && !logoPreview) {
          setLogoUrl('');
          setLogoPreview(null);
        }
        return;
      }

      // Debounce: wait 1 second after user stops typing
      const timer = setTimeout(async () => {
        // Double check - don't extract if file was uploaded during debounce
        if (logoFile) return;
        
        // Don't re-extract if we already have a logo for this name
        // (This prevents clearing the logo after it's been set)
        if (logoUrl && logoPreview) {
          return;
        }

        setExtractingLogo(true);
        try {
          const response = await fetch('/api/categories/extract-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoryName: name }),
          });

          const data = await response.json();
          console.log('Logo extraction response:', data);

          if (data.success && data.logoUrl) {
            // Set the extracted logo - this will persist
            setLogoUrl(data.logoUrl);
            setLogoPreview(data.logoUrl);
            setLogoFile(null); // Clear file if URL is found
            console.log('Logo extracted successfully:', data.logoUrl);
          } else {
            console.log('No logo found for category:', name, data.error || 'Unknown error');
            // Only clear if we don't have any logo at all and not editing
            if (!logoUrl && !logoPreview && !editingCategory) {
              setLogoUrl('');
              setLogoPreview(null);
            }
          }
        } catch (error) {
          console.error('Error extracting logo:', error);
          // Don't clear existing logo on error
        } finally {
          setExtractingLogo(false);
        }
      }, 1000);

      return () => clearTimeout(timer);
    };

    extractLogo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Need either logo file or logo URL
    if (!logoFile && !logoUrl) {
      alert('Please wait for logo to be extracted or upload a logo manually');
      return;
    }

    const result = editingCategory
      ? await updateCategory(editingCategory.id!, { name, backgroundColor, logoUrl }, logoFile || undefined)
      : await createCategory(name, backgroundColor, logoFile || undefined, logoUrl || undefined);

    if (result.success) {
      fetchCategories();
      resetForm();
    } else {
      alert('Failed to save category. Please try again.');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setBackgroundColor(category.backgroundColor);
    setLogoUrl(category.logoUrl || '');
    setLogoPreview(category.logoUrl || null);
    setLogoFile(null);
    setShowForm(true);
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this category?')) {
      await deleteCategory(id);
      fetchCategories();
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setName('');
    setLogoFile(null);
    setLogoPreview(null);
    setLogoUrl('');
    setBackgroundColor('#FF6B9D');
    setFileInputKey(prev => prev + 1);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Manage Categories</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="bg-blue-600 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
        >
          {showForm ? 'Cancel' : 'Create New Category'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {editingCategory ? 'Edit Category' : 'Create New Category'}
          </h2>
          
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">
                Category Name <span className="text-red-500">*</span>
                {extractingLogo && (
                  <span className="ml-2 text-xs text-blue-600">Extracting logo...</span>
                )}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={name || ''}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Electronics, Fashion, Food"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Logo will be automatically extracted based on category name
              </p>
            </div>

            <div>
              <label htmlFor="logo" className="block text-gray-700 text-sm font-semibold mb-2">
                Category Logo (Auto-extracted or upload manually)
              </label>
              {logoPreview ? (
                <div className="mb-2">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="h-24 w-24 object-contain rounded border border-gray-200"
                        onError={(e) => {
                          // If image fails to load, show fallback
                          const target = e.target as HTMLImageElement;
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.logo-fallback')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'logo-fallback h-24 w-24 rounded-full flex items-center justify-center border border-gray-200';
                            fallback.style.backgroundColor = backgroundColor || '#FF6B9D';
                            fallback.innerHTML = `
                              <div class="w-3/4 h-3/4 rounded-full bg-gray-200 flex items-center justify-center">
                                <span class="text-2xl font-bold text-gray-700">${name.charAt(0).toUpperCase()}</span>
                              </div>
                            `;
                            target.style.display = 'none';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">
                        {logoUrl ? 'Auto-extracted logo' : 'Uploaded logo'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview(null);
                          setLogoUrl('');
                        }}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove Logo
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-2">
                  {extractingLogo ? 'Extracting logo...' : 'No logo found. Please upload manually.'}
                </p>
              )}
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setLogoFile(file);
                  if (file) {
                    setLogoPreview(URL.createObjectURL(file));
                    setLogoUrl(''); // Clear auto-extracted URL if file is uploaded
                  } else {
                    if (!logoUrl) {
                      setLogoPreview(null);
                    }
                  }
                }}
                className="w-full"
                key={`file-input-${fileInputKey}`}
              />
            </div>

            <div>
              <label htmlFor="backgroundColor" className="block text-gray-700 text-sm font-semibold mb-2">
                Circle Background Color <span className="text-red-500">*</span>
              </label>
              <select
                id="backgroundColor"
                name="backgroundColor"
                value={backgroundColor || '#FF6B9D'}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {COLOR_OPTIONS.map((color, index) => (
                  <option key={`${color.name}-${index}`} value={color.value}>
                    {color.name}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: backgroundColor || '#FF6B9D' }}
                ></div>
                <span className="text-xs text-gray-600">{backgroundColor || '#FF6B9D'}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 sm:mb-6">All Categories</h2>
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No categories yet. Create your first category!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden"
                      style={{ backgroundColor: category.backgroundColor }}
                    >
                      {category.logoUrl ? (
                        <img
                          src={category.logoUrl}
                          alt={category.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: category.backgroundColor }}>
                          <div className="w-3/4 h-3/4 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xl sm:text-2xl font-bold text-gray-700">
                              {category.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">{category.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: category.backgroundColor }}
                        ></div>
                        <span className="text-xs text-gray-600">{category.backgroundColor}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

