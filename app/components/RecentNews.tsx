'use client';

import { useEffect, useState } from 'react';
import { getNewsWithLayout, NewsArticle } from '@/lib/services/newsService';
import Link from 'next/link';

export default function RecentNews() {
  const [articles, setArticles] = useState<(NewsArticle | null)[]>(Array(4).fill(null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const data = await getNewsWithLayout();
        setArticles(data);
      } catch (error) {
        console.error('Error fetching news articles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  // Filter out null articles
  const validArticles = articles.filter(article => article !== null) as NewsArticle[];

  if (loading) {
    return (
      <div className="w-full px-2 sm:px-4 md:px-6 py-8 sm:py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-4 h-64 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-32 h-32 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="w-24 h-4 bg-gray-200 rounded"></div>
                    <div className="w-full h-4 bg-gray-200 rounded"></div>
                    <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (validArticles.length === 0) {
    return null; // Don't show section if no articles
  }

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12 lg:py-16 bg-white animate-fade-in-up">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 md:mb-8 gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold animate-slide-in-left">
            <span className="text-gray-900">Recent</span>{' '}
            <span className="text-orange-600">News & Articles</span>
          </h2>
          <Link
            href="/blogs"
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap text-sm sm:text-base animate-slide-in-right"
          >
            See All Blogs
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Articles Grid - Compact on mobile, 2x2 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          {articles.map((article, index) => (
            article ? (
              <div
                key={article.id}
                className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col sm:flex-row animate-scale-in ${index > 0 ? 'animate-delay-' + (index % 4 + 1) : ''}`}
              >
                {/* Image - Top on mobile, Left on desktop */}
                <div className="w-full sm:w-1/2 h-48 sm:h-auto sm:min-h-[200px] md:min-h-[250px] bg-gray-100 flex-shrink-0 relative">
                  {article.imageUrl ? (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center"><span class="text-gray-400 text-sm">No Image</span></div>';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No Image</span>
                    </div>
                  )}
                </div>

                {/* Content - Bottom on mobile, Right on desktop */}
                <div className="w-full sm:w-1/2 p-3 sm:p-4 md:p-5 flex flex-col relative">
                  {/* Date Badge - Top Right */}
                  {article.date && (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-pink-500 text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                      {article.date}
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-2 pr-10 sm:pr-12 md:pr-16 mt-0 sm:mt-1 line-clamp-2">
                    {article.title || 'Trendsetter Chronicles:'}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4 flex-grow line-clamp-3">
                    {article.description || 'Lorem Ipsum is simply a dummy text'}
                  </p>

                  {/* Read More Button */}
                  {article.id ? (
                    <Link
                      href={`/blogs/${article.id}`}
                      className="inline-flex items-center gap-1 sm:gap-2 border-2 border-orange-600 text-orange-600 bg-white hover:bg-orange-600 hover:text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors font-semibold text-xs sm:text-sm w-fit mt-auto"
                    >
                      READ MORE
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : (
                    <div className="inline-flex items-center gap-1 sm:gap-2 border-2 border-gray-300 text-gray-400 bg-gray-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm w-fit mt-auto cursor-not-allowed">
                      READ MORE
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                key={`empty-${index}`}
                className="bg-white rounded-lg shadow-md border-2 border-dashed border-gray-200 flex min-h-[200px] sm:min-h-[250px]"
              >
                <div className="w-1/2 h-auto bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <div className="text-gray-400 text-center">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs font-medium">Layout {index + 1}</p>
                    <p className="text-xs text-gray-400 mt-1">Empty</p>
                  </div>
                </div>
                <div className="w-1/2 p-4 flex flex-col items-center justify-center">
                  <p className="text-gray-400 text-xs text-center">No article assigned</p>
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}

