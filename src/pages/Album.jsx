import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Image } from 'antd';
import { photoAPI } from '../utils/api';
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

const Album = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [imageDimensions, setImageDimensions] = useState({});
  const containerRef = useRef(null);
  const PAGE_SIZE = 20; // 每页加载20张照片

  useEffect(() => {
    loadPhotos(1, true);
  }, []);

  // 加载照片
  const loadPhotos = async (pageNum = 1, isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const response = await photoAPI.getAll({ page: pageNum, limit: PAGE_SIZE });
      
      if (response.photos) {
        // 分页格式
        if (isInitial) {
          setPhotos(response.photos);
        } else {
          setPhotos(prev => [...prev, ...response.photos]);
        }
        setHasMore(response.hasMore);
        setPage(pageNum);
      } else {
        // 数组格式（向后兼容）
        if (isInitial) {
          setPhotos(response);
        } else {
          setPhotos(prev => [...prev, ...response]);
        }
        setHasMore(false);
      }
    } catch (error) {
      message.error('加载照片失败');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 滚动加载更多
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || loadingMore || !hasMore) return;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // 当滚动到距离底部100px时加载更多
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadPhotos(page + 1, false);
    }
  }, [page, hasMore, loadingMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  const handleImageLoad = (photoId, event) => {
    const img = event.target;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    setImageDimensions(prev => ({
      ...prev,
      [photoId]: aspectRatio
    }));
  };

  const handleImageClick = (index) => {
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };

  // 根据宽高比确定网格项的大小
  const getGridClass = (aspectRatio) => {
    if (!aspectRatio) return ''; // 默认大小，等待图片加载
    if (aspectRatio > 1.6) {
      // 宽图（宽 > 高 * 1.6），占2列
      return 'md:col-span-2 lg:col-span-2';
    } else if (aspectRatio < 0.625) {
      // 竖图（高 > 宽 * 1.6），占2行
      return 'md:row-span-2';
    } else {
      // 正方形或接近正方形，正常大小
      return '';
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-bg-100 overflow-y-auto">
        <div className="p-4 md:p-8">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-bg-300 rounded mb-6"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-square bg-bg-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-bg-100 overflow-y-auto">
      <div className="p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-text-100 mb-4 md:mb-6">生活相册</h1>
        
        {photos.length > 0 ? (
          <>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3" style={{ gridAutoFlow: 'row dense' }}>
              {photos.map((photo, index) => {
                const aspectRatio = imageDimensions[photo._id];
                const gridClass = getGridClass(aspectRatio);
                
                return (
                  <div
                    key={photo._id}
                    className={`group relative overflow-hidden rounded-lg cursor-pointer ${gridClass}`}
                    onClick={() => handleImageClick(index)}
                    style={{
                      aspectRatio: aspectRatio || '1',
                      gridRowEnd: aspectRatio && aspectRatio < 0.67 ? 'span 2' : undefined
                    }}
                  >
                    <ImageWithFallback
                      src={normalizeImageUrl(photo.thumbnailUrl || photo.url)}
                      alt={photo.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                      timeout={3000}
                      onLoad={(e) => handleImageLoad(photo._id, e)}
                      onError={(e) => {
                        // 如果缩略图加载失败，尝试加载原图
                        if (photo.thumbnailUrl && photo.url && e.target.src !== normalizeImageUrl(photo.url)) {
                          e.target.src = normalizeImageUrl(photo.url);
                          return;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end pointer-events-none">
                      <div className="w-full p-2 md:p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-xs md:text-sm font-medium truncate">{photo.title || '未命名'}</div>
                        {photo.description && (
                          <div className="text-xs text-white/80 truncate mt-1">{photo.description}</div>
                        )}
                        <div className="text-xs text-white/60 mt-1">{formatDate(photo.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {loadingMore && (
              <div className="text-center py-8">
                <div className="text-text-200">加载中...</div>
              </div>
            )}
            
            {!hasMore && photos.length > 0 && (
              <div className="text-center py-8">
                <div className="text-text-200">已加载全部照片</div>
              </div>
            )}
          </>
        ) : (
          !loading && (
            <div className="text-center py-16">
              <div className="text-text-200 text-lg mb-2">暂无照片</div>
              <div className="text-text-200 text-sm">还没有上传照片</div>
            </div>
          )
        )}

        <Image.PreviewGroup
          preview={{
            visible: previewVisible,
            current: previewIndex,
            onVisibleChange: (visible) => setPreviewVisible(visible),
            onChange: (current) => setPreviewIndex(current),
          }}
        >
          {photos.map((photo) => (
            <Image
              key={photo._id}
              src={normalizeImageUrl(photo.url)}
              alt={photo.title}
              style={{ display: 'none' }}
            />
          ))}
        </Image.PreviewGroup>
      </div>
    </div>
  );
};

export default Album;
