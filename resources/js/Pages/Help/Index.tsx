import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import { Card } from '@/Components/ui/card';

type Article = {
  id: number;
  title: string;
  slug: string;
  category: string;
  view_count: number;
};

type Props = {
  articles: { data: Article[]; links: any; meta: any };
  categories: Record<string, string>;
  popularArticles: Article[];
  filters: { search: string; category: string };
  isAuthenticated: boolean;
  userRole?: string | null;
};

export default function HelpIndex({ articles, categories, popularArticles, filters, isAuthenticated, userRole }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [selectedCategory, setSelectedCategory] = useState(filters.category || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(route('help.index'), { search, category: selectedCategory }, { preserveState: true });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    router.get(route('help.index'), { search, category }, { preserveState: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head title="Help Center" />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-red-600 to-red-800 text-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            href={isAuthenticated ? route('dashboard') : route('public.home')}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 text-sm transition-colors"
          >
            <IconMapper name="ArrowLeft" size={16} />
            Back to {isAuthenticated ? 'Dashboard' : 'Home'}
          </Link>

          <div className="text-center">
            <div className="p-4 bg-white/20 rounded-full inline-block mb-4">
              <IconMapper name="HelpCircle" size={32} />
            </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">How can we help you?</h1>
          <p className="text-red-100 mb-6 text-sm sm:text-base">
            Search our knowledge base or browse categories below
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="relative">
              <IconMapper name="Search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for help articles..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-0 focus:ring-2 focus:ring-white/50 text-sm sm:text-base"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Categories */}
            <Card className="p-4 dark:bg-gray-800 dark:border-gray-700 mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => handleCategoryChange('')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === '' 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  All Articles
                </button>
                {Object.entries(categories).map(([key, name]) => (
                  <button
                    key={key}
                    onClick={() => handleCategoryChange(key)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === key 
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </Card>

            {/* Popular Articles */}
            {popularArticles.length > 0 && (
              <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">Popular Articles</h3>
                <div className="space-y-2">
                  {popularArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={route('help.show', article.slug)}
                      className="block text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      {article.title}
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Articles Grid */}
          <div className="lg:col-span-3">
            {filters.search && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Showing results for "{filters.search}"
              </p>
            )}

            {articles.data.length === 0 ? (
              <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
                <IconMapper name="FileQuestion" size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">No articles found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Try a different search term or browse categories
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {articles.data.map((article) => (
                  <Link
                    key={article.id}
                    href={route('help.show', article.slug)}
                    className="block"
                  >
                    <Card className="p-4 dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg hover:border-red-300 dark:hover:border-red-700 transition-all h-full">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0">
                          <IconMapper name="FileText" size={20} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1 truncate">
                            {article.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {categories[article.category] || article.category}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {article.view_count} views
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {articles.meta?.last_page > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {articles.meta.links?.map((link: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => link.url && router.get(link.url)}
                    disabled={!link.url}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      link.active
                        ? 'bg-red-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    } disabled:opacity-50`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
