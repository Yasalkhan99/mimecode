'use client';

import { useEffect, useState } from 'react';
import {
  getNews,
  createNewsFromUrl,
  updateNews,
  deleteNews,
  NewsArticle,
} from '@/lib/services/newsService';
import { extractOriginalCloudinaryUrl, isCloudinaryUrl } from '@/lib/utils/cloudinary';

export default function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<NewsArticle>>({
    title: '',
    description: '',
    content: '',
    imageUrl: '',
    articleUrl: '',
    date: '',
    layoutPosition: null,
  });
  const [articleUrl, setArticleUrl] = useState('');
  const [extracting, setExtracting] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    const data = await getNews();
    setNews(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleExtractFromUrl = async () => {
    if (!articleUrl.trim()) {
      alert('Please enter an article URL');
      return;
    }

    setExtracting(true);
    try {
      const response = await fetch('/api/stores/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: articleUrl }),
      });

      const data = await response.json();

      if (data.success) {
        // Auto-populate form fields
        setFormData({
          ...formData,
          title: data.name || formData.title || '',
          description: data.description || formData.description || '',
          imageUrl: data.logoUrl || formData.imageUrl || '',
          articleUrl: data.siteUrl || articleUrl || '',
        });

        // Show success message
        alert(`Successfully extracted article info from ${data.name || 'the website'}!`);
      } else {
        alert(`Failed to extract metadata: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error extracting metadata:', error);
      alert('Failed to extract metadata. Please check the URL and try again.');
    } finally {
      setExtracting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.imageUrl) {
      alert('Please enter title and image URL or extract from article URL');
      return;
    }
    
    // Check if layout position is already taken
    if (formData.layoutPosition !== null) {
      const newsAtPosition = news.filter(
        n => n.id && n.layoutPosition === formData.layoutPosition
      );
      if (newsAtPosition.length > 0) {
        if (!confirm(`Layout ${formData.layoutPosition} is already assigned to "${newsAtPosition[0].title}". Replace it?`)) {
          return;
        }
        // Clear position from other article
        await updateNews(newsAtPosition[0].id!, { layoutPosition: null });
      }
    }
    
    const result = await createNewsFromUrl(
      formData.title || '',
      formData.articleUrl || articleUrl || '',
      formData.imageUrl || '',
      formData.description || '',
      formData.content || '',
      formData.layoutPosition !== undefined ? formData.layoutPosition : null,
      formData.date || undefined
    );
    
    if (result.success) {
      fetchNews();
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        content: '',
        imageUrl: '',
        articleUrl: '',
        date: '',
        layoutPosition: null,
      });
      setArticleUrl('');
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this article?')) {
      await deleteNews(id);
      fetchNews();
    }
  };

  const handleAssignLayoutPosition = async (article: NewsArticle, position: number | null) => {
    if (!article.id) return;
    
    // Check if position is already taken by another article
    if (position !== null) {
      const newsAtPosition = news.filter(
        n => n.id !== article.id && n.layoutPosition === position
      );
      if (newsAtPosition.length > 0) {
        if (!confirm(`Layout ${position} is already assigned to "${newsAtPosition[0].title}". Replace it?`)) {
          return;
        }
        // Clear position from other article
        await updateNews(newsAtPosition[0].id!, { layoutPosition: null });
      }
    }
    
    await updateNews(article.id, { layoutPosition: position });
    fetchNews();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage News & Articles</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'Cancel' : 'Create New Article'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Create New Article
          </h2>
          
          {/* URL Extraction Section */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label htmlFor="articleUrl" className="block text-gray-700 text-sm font-semibold mb-2">
              Extract Article Info from URL (e.g., blog article URL)
            </label>
            <div className="flex gap-2">
              <input
                id="articleUrl"
                name="articleUrl"
                type="text"
                value={articleUrl}
                onChange={(e) => setArticleUrl(e.target.value)}
                placeholder="Enter article URL (e.g., https://example.com/article)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleExtractFromUrl}
                disabled={extracting || !articleUrl.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {extracting ? 'Extracting...' : 'Extract Info'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              This will automatically extract article title, description, and image from the URL.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-gray-700 text-sm font-semibold mb-2">
                Article Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="Article Title (e.g., Trendsetter Chronicles:)"
                value={formData.title || ''}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-gray-700 text-sm font-semibold mb-2">
                Description (Short Summary)
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Article description (e.g., Lorem Ipsum is simply a dummy text)"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-gray-700 text-sm font-semibold mb-2">
                Full Blog Content (HTML supported)
              </label>
              <textarea
                id="content"
                name="content"
                placeholder="Enter the full blog content here. You can use HTML tags for formatting."
                value={formData.content || ''}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={10}
              />
              <p className="mt-1 text-xs text-gray-500">
                This content will be displayed on the blog detail page. You can use HTML tags like &lt;p&gt;, &lt;h2&gt;, &lt;strong&gt;, etc.
              </p>
            </div>

            <div>
              <label htmlFor="imageUrl" className="block text-gray-700 text-sm font-semibold mb-2">
                Image URL (Cloudinary URL or Direct URL)
              </label>
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                value={formData.imageUrl || ''}
                onChange={(e) => {
                  const url = e.target.value;
                  setFormData({ ...formData, imageUrl: url });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://res.cloudinary.com/... or https://example.com/image.jpg"
                required
              />
              {formData.imageUrl && (
                <div className="mt-2">
                  <img
                    src={formData.imageUrl}
                    alt="Article preview"
                    className="h-32 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-gray-700 text-sm font-semibold mb-2">
                  Date (e.g., 18 Oct 2005)
                </label>
                <input
                  id="date"
                  name="date"
                  type="text"
                  placeholder="18 Oct 2005"
                  value={formData.date || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="layoutPosition" className="block text-gray-700 text-sm font-semibold mb-2">
                  Assign to Layout Position (1-4)
                </label>
                <select
                  id="layoutPosition"
                  name="layoutPosition"
                  value={formData.layoutPosition || ''}
                  onChange={(e) => {
                    const position = e.target.value ? parseInt(e.target.value) : null;
                    setFormData({ ...formData, layoutPosition: position });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Not Assigned</option>
                  {[1, 2, 3, 4].map((pos) => {
                    const isTaken = news.some(
                      n => n.layoutPosition === pos && n.id
                    );
                    const takenBy = news.find(
                      n => n.layoutPosition === pos && n.id
                    );
                    return (
                      <option key={pos} value={pos}>
                        Layout {pos} {isTaken ? `(Currently: ${takenBy?.title})` : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Articles will be displayed in a 2x2 grid layout on the homepage.
                </p>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Create Article
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading articles...</div>
      ) : news.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No articles created yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Image</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Layout Position</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {news.map((article) => (
                  <tr key={article.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {article.imageUrl ? (
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="h-16 w-24 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="h-16 w-24 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-500">No Image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold">{article.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{article.date || '-'}</td>
                    <td className="px-6 py-4">
                      <select
                        value={article.layoutPosition || ''}
                        onChange={(e) => {
                          const position = e.target.value ? parseInt(e.target.value) : null;
                          handleAssignLayoutPosition(article, position);
                        }}
                        className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Not Assigned</option>
                        {[1, 2, 3, 4].map((pos) => (
                          <option key={pos} value={pos}>
                            Layout {pos}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

