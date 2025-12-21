import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GithubOutlined, CameraOutlined, EyeOutlined, UserOutlined, LikeOutlined } from '@ant-design/icons';
import { homeAPI, articleAPI, photoAPI } from '../utils/api';
import { message } from 'antd';
import ImageWithFallback from '../components/ImageWithFallback';

// 规范化图片 URL，确保是相对路径
const normalizeImageUrl = (url) => {
  if (!url) return '';
  
  const urlString = String(url).trim();
  if (!urlString) return '';
  
  // 如果已经是相对路径（以 / 开头），直接返回
  if (urlString.startsWith('/')) {
    return urlString;
  }
  
  // 如果是完整 URL（http:// 或 https://），提取路径部分
  if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
    try {
      const urlObj = new URL(urlString);
      return urlObj.pathname + urlObj.search;
    } catch (e) {
      // 如果不是有效 URL，尝试手动提取路径
      const match = urlString.match(/\/uploads\/[^\s]*/);
      return match ? match[0] : urlString;
    }
  }
  
  // 如果既不是以 / 开头也不是 http，添加 /
  return '/' + urlString;
};

const Home = () => {
  const navigate = useNavigate();
  const [homeData, setHomeData] = useState(null);
  const [articles, setArticles] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [bannerImageLoaded, setBannerImageLoaded] = useState(false);

  useEffect(() => {
    loadHomeData();
    loadArticles();
    loadPhotos();
  }, []);

  // 预加载关键图片
  useEffect(() => {
    if (homeData?.bannerImage) {
      const img = new Image();
      img.src = normalizeImageUrl(homeData.bannerImage);
      img.onload = () => {
        setBannerImageLoaded(true);
      };
    }
  }, [homeData]);

  const loadHomeData = async () => {
    try {
      const data = await homeAPI.get();
      setHomeData(data);
    } catch (error) {
      message.error('加载首页内容失败');
    } finally {
      setLoading(false);
    }
  };

  const loadArticles = async () => {
    try {
      setArticlesLoading(true);
      const data = await articleAPI.getAll();
      // 按创建时间倒序排列，只取最新的
      const sortedArticles = data
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20); // 只显示最新20篇
      setArticles(sortedArticles);
    } catch (error) {
      message.error('加载文章列表失败');
    } finally {
      setArticlesLoading(false);
    }
  };

  const loadPhotos = async () => {
    try {
      const data = await photoAPI.getAll();
      setPhotos(data);
    } catch (error) {
      // 静默失败，不影响其他内容加载
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}`;
  };

  const formatYear = (dateString) => {
    return new Date(dateString).getFullYear();
  };

  const getYearForRow = (currentArticle, previousArticle) => {
    if (!previousArticle) {
      return formatYear(currentArticle.createdAt);
    }
    const currentYear = formatYear(currentArticle.createdAt);
    const previousYear = formatYear(previousArticle.createdAt);
    return currentYear !== previousYear ? currentYear : '';
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-bg-100 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="animate-pulse">
            <div className="h-64 bg-bg-300 rounded-lg mb-8"></div>
            <div className="h-8 bg-bg-300 rounded mb-4"></div>
            <div className="h-4 bg-bg-300 rounded mb-2"></div>
            <div className="h-4 bg-bg-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!homeData) {
    return (
      <div className="w-full h-full bg-bg-100 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="text-center text-text-200">暂无内容</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-bg-100 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Banner 区域 */}
        <div 
          className="relative w-full h-64 rounded-lg overflow-hidden mb-8"
        >
          {/* 背景层 - 使用 img 标签以获得更好的加载性能 */}
          <div className="absolute inset-0 banner-bg-animated overflow-hidden">
            {homeData.bannerImage ? (
              <>
                {/* 占位背景 */}
                <div 
                  className="absolute inset-0 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                    opacity: bannerImageLoaded ? 0 : 1
                  }}
                ></div>
                {/* 实际图片 */}
                <img
                  src={normalizeImageUrl(homeData.bannerImage)}
                  alt="Banner"
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                    bannerImageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    objectPosition: 'center',
                    imageRendering: 'auto'
                  }}
                  loading="eager"
                  fetchPriority="high"
                  onLoad={() => setBannerImageLoaded(true)}
                  onError={() => setBannerImageLoaded(false)}
                />
              </>
            ) : (
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
                }}
              ></div>
            )}
          </div>
          {/* 内容层 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="w-24 h-24 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center mb-4 overflow-hidden">
              {homeData.avatarImage ? (
                <img 
                  src={normalizeImageUrl(homeData.avatarImage)}
                  loading="eager"
                  fetchPriority="high" 
                  alt="头像" 
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white"></div>
              )}
            </div>
            <div className="text-2xl font-bold text-white">{homeData.name || 'OBJECTX'}</div>
          </div>
        </div>

        {/* 自我介绍 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-100 mb-4">
            你好 👋, 我是 {homeData.name || 'ObjectX'}
          </h1>
          {homeData.subtitle && (
            <p className="text-text-200 leading-relaxed mb-4">{homeData.subtitle}</p>
          )}
          {homeData.introduction && (
            <p className="text-text-200 leading-relaxed whitespace-pre-line">
              {homeData.introduction}
            </p>
          )}
        </div>

        {/* 社交账号 */}
        {homeData.socialLinks && homeData.socialLinks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-text-100 mb-4">社交账号</h2>
            <div className="flex flex-wrap gap-3">
              {homeData.socialLinks.map((link, index) => (
                link && link.url && (
                  <a 
                    key={index}
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-bg-200 transition-colors"
                  >
                    {link.name === 'Github' && <GithubOutlined className="text-text-100" />}
                    <span className="text-sm text-text-100">{link.name || '链接'}</span>
                  </a>
                )
              ))}
            </div>
          </div>
        )}

        {/* 生活相册 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-100 flex items-center gap-2">
              <CameraOutlined />
              生活相册
            </h2>
            {photos.length > 0 && (
              <button
                onClick={() => navigate('/album')}
                className="text-sm text-text-200 hover:text-text-100 transition-colors"
              >
                查看更多 →
              </button>
            )}
          </div>
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.slice(0, 8).map((photo) => (
                <div
                  key={photo._id}
                  className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer bg-bg-200"
                  onClick={() => navigate('/album')}
                >
                <ImageWithFallback
                  src={normalizeImageUrl(photo.thumbnailUrl || photo.url)}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                  timeout={3000}
                  onError={(e) => {
                    // 如果缩略图加载失败，尝试加载原图
                    if (photo.thumbnailUrl && photo.url && e.target.src !== normalizeImageUrl(photo.url)) {
                      e.target.src = normalizeImageUrl(photo.url);
                      return;
                    }
                  }}
                />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-200 bg-white rounded-lg">
              <CameraOutlined className="text-4xl mb-2 opacity-50" />
              <p>暂无照片</p>
            </div>
          )}
        </div>

        {/* 教育经历 */}
        {homeData.education && homeData.education.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-text-100 mb-4">教育经历</h2>
            {homeData.education.map((edu, index) => (
              edu && edu.title && (
                <div key={index} className="bg-white rounded-lg p-4 mb-3">
                  <div className="text-text-100 font-medium mb-1">{edu.title}</div>
                  {edu.period && (
                    <div className="text-text-200 text-sm">{edu.period}</div>
                  )}
                </div>
              )
            ))}
          </div>
        )}

        {/* 工作经历 */}
        {homeData.work && homeData.work.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-text-100 mb-4">工作经历</h2>
            {homeData.work.map((w, index) => (
              w && w.title && (
                <div key={index} className="bg-white rounded-lg p-4 mb-3">
                  <div className="text-text-100 font-medium mb-1">{w.title}</div>
                  {w.period && (
                    <div className="text-text-200 text-sm">{w.period}</div>
                  )}
                </div>
              )
            ))}
          </div>
        )}

        {/* 技术文章列表 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
              <div className="bg-green-500 rounded-tl"></div>
              <div className="bg-blue-500 rounded-tr"></div>
              <div className="bg-yellow-500 rounded-bl"></div>
              <div className="bg-red-500 rounded-br"></div>
            </div>
            <h2 className="text-2xl font-bold text-text-100">技术文章</h2>
          </div>

          {articlesLoading ? (
            <div className="animate-pulse">
              <div className="h-12 bg-bg-300 rounded mb-2"></div>
              <div className="h-12 bg-bg-300 rounded mb-2"></div>
              <div className="h-12 bg-bg-300 rounded"></div>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-8 text-text-200">
              <p>暂无文章</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-bg-300">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-text-200 w-20">年份</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-text-200 w-24">日期</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-text-200">标题</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-text-200 w-20"></th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-text-200 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((article, index) => {
                      const previousArticle = index > 0 ? articles[index - 1] : null;
                      const year = getYearForRow(article, previousArticle);
                      
                      return (
                        <tr
                          key={article._id}
                          className="border-b border-bg-300 hover:bg-bg-200 cursor-pointer transition-colors"
                          onClick={() => navigate(`/article/${article._id}`)}
                        >
                          <td className="px-4 py-3 text-sm text-text-200">
                            {year}
                          </td>
                          <td className="px-4 py-3 text-sm text-text-200">
                            {formatDate(article.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-sm text-text-100">
                            {article.title}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 text-sm text-text-200">
                              <LikeOutlined />
                              <span>{article.likes || 0}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 text-sm text-text-200">
                              <EyeOutlined />
                              <span>{article.views || 0}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {articles.length > 0 && (
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/articles')}
                className="text-text-200 hover:text-text-100 transition-colors text-sm"
              >
                查看更多文章 →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;

