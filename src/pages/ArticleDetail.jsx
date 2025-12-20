import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LikeOutlined, EyeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Button, message, Image } from 'antd';
import { articleAPI } from '../utils/api';
import './ArticleDetail.css';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const contentRef = useRef(null);

  useEffect(() => {
    loadArticle();
  }, [id]);

  // 处理图片点击预览
  useEffect(() => {
    if (!contentRef.current) return;

    const handleImageClick = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
        e.stopPropagation();
        const src = e.target.src;
        setPreviewImage(src);
        setPreviewVisible(true);
      }
    };

    const contentElement = contentRef.current;
    contentElement.addEventListener('click', handleImageClick);

    return () => {
      contentElement.removeEventListener('click', handleImageClick);
    };
  }, [article]);

  const loadArticle = async () => {
    try {
      const data = await articleAPI.getById(id);
      setArticle(data);
      // 增加浏览量
      articleAPI.incrementViews(id).catch(() => {});
    } catch (error) {
      message.error('加载文章失败');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-bg-200 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="bg-bg-100 rounded-xl shadow-sm border border-bg-300 p-6 md:p-10">
            <div className="h-10 w-3/4 bg-bg-300 rounded-lg mb-6 animate-pulse"></div>
            <div className="h-6 w-1/2 bg-bg-300 rounded mb-8 animate-pulse"></div>
            <div className="space-y-4">
              <div className="h-4 bg-bg-300 rounded animate-pulse"></div>
              <div className="h-4 bg-bg-300 rounded animate-pulse"></div>
              <div className="h-4 w-5/6 bg-bg-300 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="w-full h-full bg-bg-200 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="bg-bg-100 rounded-xl shadow-sm border border-bg-300 p-6 md:p-12 text-center">
            <div className="text-text-200 text-lg mb-2">文章不存在</div>
            <div className="text-text-200 text-sm">请返回列表查看其他文章</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-bg-200 overflow-y-auto">
      {/* 文章内容区 */}
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-2 text-text-200 hover:text-text-100 transition-colors group"
        >
          <ArrowLeftOutlined className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">返回列表</span>
        </button>

        {/* 文章卡片 */}
        <div className="bg-bg-100 rounded-xl shadow-sm border border-bg-300 p-10">
          {/* 文章标题 */}
          <h1 className="text-4xl font-bold mb-6 text-text-100 leading-tight">{article.title}</h1>
          
          {/* 文章元信息 */}
          <div className="flex items-center gap-6 text-sm text-text-200 mb-10 pb-6 border-b border-bg-300">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(article.createdAt)}
            </span>
            {article.category && (
              <span className="px-3 py-1 bg-bg-200 text-text-100 rounded-full text-xs font-medium">
                {article.category.name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <LikeOutlined />
              <span>{article.likes || 0}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <EyeOutlined />
              <span>{article.views || 0}</span>
            </span>
          </div>

          {/* 文章内容 */}
          <div 
            ref={contentRef}
            className="prose max-w-none article-content prose-headings:text-text-100 prose-p:text-text-200 prose-a:text-text-100 prose-strong:text-text-100"
            dangerouslySetInnerHTML={{ __html: article.content }}
            style={{
              lineHeight: '1.8',
            }}
          />
          
          {/* 图片预览 */}
          <div style={{ display: 'none' }}>
            <Image
              preview={{
                visible: previewVisible,
                src: previewImage,
                onVisibleChange: (visible) => {
                  setPreviewVisible(visible);
                  if (!visible) {
                    setPreviewImage('');
                  }
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;

