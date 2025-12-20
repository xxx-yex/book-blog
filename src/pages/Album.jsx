import { useState, useEffect } from 'react';
import { Modal, Image } from 'antd';
import { photoAPI } from '../utils/api';
import { message } from 'antd';

const Album = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const data = await photoAPI.getAll();
      setPhotos(data);
    } catch (error) {
      message.error('加载照片失败');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (index) => {
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
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
    <div className="w-full h-full bg-bg-100 overflow-y-auto">
      <div className="p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-text-100 mb-4 md:mb-6">生活相册</h1>
        
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo._id}
                className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer bg-bg-200"
                onClick={() => handleImageClick(index)}
              >
                <img
                  src={`http://localhost:3001${photo.thumbnailUrl || photo.url}`}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.target.src = `http://localhost:3001${photo.url}`;
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end">
                  <div className="w-full p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-sm font-medium truncate">{photo.title || '未命名'}</div>
                    {photo.description && (
                      <div className="text-xs text-white/80 truncate mt-1">{photo.description}</div>
                    )}
                    <div className="text-xs text-white/60 mt-1">{formatDate(photo.createdAt)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-text-200 text-lg mb-2">暂无照片</div>
            <div className="text-text-200 text-sm">还没有上传照片</div>
          </div>
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
              src={`http://localhost:3001${photo.url}`}
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
