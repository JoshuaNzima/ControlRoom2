import React from 'react';
import { Head, Link } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import { Card } from '@/Components/ui/card';

type Article = {
  id: number;
  title: string;
  slug: string;
  content: string;
  category: string;
  view_count: number;
  created_at: string;
};

type RelatedArticle = {
  id: number;
  title: string;
  slug: string;
  category: string;
};

type Props = {
  article: Article;
  relatedArticles: RelatedArticle[];
  isAuthenticated: boolean;
  userRole?: string | null;
};

export default function HelpShow({ article, relatedArticles, isAuthenticated, userRole }: Props) {
  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-4">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">{line.replace('# ', '')}</h1>;
      }
      
      // Lists
      if (line.startsWith('- ')) {
        return <li key={i} className="ml-4 text-gray-600 dark:text-gray-400">{line.replace('- ', '')}</li>;
      }
      if (line.match(/^\d+\. /)) {
        return <li key={i} className="ml-4 text-gray-600 dark:text-gray-400 list-decimal">{line.replace(/^\d+\. /, '')}</li>;
      }
      
      // Bold
      const boldText = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Empty lines
      if (!line.trim()) {
        return <br key={i} />;
      }
      
      return <p key={i} className="text-gray-600 dark:text-gray-400 mb-2" dangerouslySetInnerHTML={{ __html: boldText }} />;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head title={article.title} />

      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Link
                href={isAuthenticated ? route('dashboard') : route('public.home')}
                className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1"
              >
                <IconMapper name="ArrowLeft" size={14} />
                {isAuthenticated ? 'Dashboard' : 'Home'}
              </Link>
              <IconMapper name="ChevronRight" size={14} className="text-gray-400" />
              <Link href={route('help.index')} className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                Help Center
              </Link>
              <IconMapper name="ChevronRight" size={14} className="text-gray-400" />
              <span className="text-gray-900 dark:text-gray-100 font-medium truncate">{article.title}</span>
            </div>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Article Content */}
          <article className="lg:col-span-3">
            <Card className="p-6 sm:p-8 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                  {article.category}
                </span>
                <span>·</span>
                <span>{article.view_count} views</span>
                <span>·</span>
                <span>Updated {new Date(article.created_at).toLocaleDateString()}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                {article.title}
              </h1>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                {renderContent(article.content)}
              </div>

              {/* Help Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Was this article helpful?
                  </p>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                      Yes, thanks!
                    </button>
                    <button className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      Needs improvement
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <Card className="p-4 dark:bg-gray-800 dark:border-gray-700 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">Related Articles</h3>
                <div className="space-y-2">
                  {relatedArticles.map((related) => (
                    <Link
                      key={related.id}
                      href={route('help.show', related.slug)}
                      className="block text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      {related.title}
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* Contact Support */}
            <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">Need More Help?</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <Link
                href={route('help.index')}
                className="block w-full text-center px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Contact Support
              </Link>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
