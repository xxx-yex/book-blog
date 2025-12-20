import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LikeOutlined, EyeOutlined } from '@ant-design/icons';
import { articleAPI, categoryAPI } from '../utils/api';
import { message } from 'antd';

const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [articlesData, categoriesData] = await Promise.all([
        articleAPI.getAll(),
        categoryAPI.getAll(),
      ]);
      setArticles(articlesData);
      // 按 sortOrder 排序分类
      const sortedCategories = [...categoriesData].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setCategories(sortedCategories);
      
      // 默认选择第一个分类
      if (sortedCategories.length > 0) {
        setSelectedCategory(sortedCategories[0]);
      }
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };

  const getExcerpt = (content) => {
    if (!content) return '';
    const text = content.replace(/<[^>]*>/g, '').trim();
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const getCategoryArticles = (categoryId) => {
    return articles.filter(article => article.category?._id === categoryId);
  };

  const getDisplayArticles = () => {
    if (selectedCategory) {
      return getCategoryArticles(selectedCategory._id);
    }
    return articles;
  };

  const displayArticles = getDisplayArticles()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (loading) {
    return (
      <div className="w-full h-full py-4 md:py-8 px-4 md:px-8 bg-bg-100">
        <div className="flex gap-4 md:gap-8 h-full">
          <div className="hidden md:block w-64 animate-pulse">
            <div className="h-6 w-32 bg-bg-300 rounded mb-4"></div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-bg-300 rounded mb-2"></div>
            ))}
          </div>
          <div className="flex-1 animate-pulse">
            <div className="h-8 w-48 bg-bg-300 rounded mb-4"></div>
            <div className="h-4 w-32 bg-bg-300 rounded mb-8"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-bg-300 pb-6 mb-6">
                <div className="h-6 w-3/4 bg-bg-300 rounded mb-3"></div>
                <div className="h-4 w-full bg-bg-300 rounded mb-2"></div>
                <div className="h-4 w-2/3 bg-bg-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-bg-100 overflow-y-auto">
      <div className="flex h-full">
        {/* 左侧分类侧边栏 */}
        <aside className="hidden md:block w-64 flex-shrink-0 p-6 border-r border-bg-300 overflow-y-auto">
          <h2 className="text-xl font-bold text-text-100 mb-4">技术文档</h2>
          <div className="space-y-1">
            {categories.map((category) => {
              const categoryArticles = getCategoryArticles(category._id);
              const count = categoryArticles.length;
              const isSelected = selectedCategory?._id === category._id;

              return (
                <div
                  key={category._id}
                  className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? 'text-text-100'
                      : 'bg-white text-text-100 hover:bg-bg-200'
                  }`}
                  style={isSelected ? { backgroundColor: '#cccccc' } : {}}
                  onClick={() => handleCategoryClick(category)}
                >
                  <span className={`text-sm font-medium ${isSelected ? 'text-text-100' : 'text-text-100'}`}>
                    {category.name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
                    isSelected
                      ? 'bg-white/20 text-text-100'
                      : 'bg-bg-200 text-text-200'
                  }`}>
                    {count}篇
                  </span>
                </div>
              );
            })}
          </div>
        </aside>

        {/* 右侧文章列表 */}
        <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-text-100 mb-2">
              {selectedCategory?.name || '技术文章'}
            </h1>
            <p className="text-sm text-text-200">
              共 {displayArticles.length} 篇文章
            </p>
          </div>

          <div className="space-y-8">
            {displayArticles.length > 0 ? (
              displayArticles.map((article) => (
                <article
                  key={article._id}
                  className="border-b border-bg-300 pb-8 last:border-b-0 last:pb-0 cursor-pointer group"
                  onClick={() => navigate(`/article/${article._id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-2xl font-normal text-text-100 group-hover:text-primary-300 transition-colors leading-tight flex-1">
                      {article.title}
                    </h2>

                    <div className="flex items-center gap-3 text-sm text-text-200 flex-shrink-0">
                      <time className="flex items-center gap-1.5 whitespace-nowrap">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(article.createdAt)}
                      </time>
                      
                      {article.category && (
                        <span className="px-2.5 py-1 bg-bg-200 text-text-100 rounded-full text-xs font-medium whitespace-nowrap">
                          {article.category.name}
                        </span>
                      )}
                      
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <LikeOutlined className="text-text-200" />
                        <span>{article.likes || 0}</span>
                      </span>
                      
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <EyeOutlined className="text-text-200" />
                        <span>{article.views || 0}</span>
                      </span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="text-text-200 text-lg mb-2">暂无文章</div>
                <div className="text-text-200 text-sm">
                  {selectedCategory ? '该分类下还没有文章' : '还没有发布文章'}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Articles;

