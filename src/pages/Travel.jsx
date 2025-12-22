import { useState, useEffect, useMemo } from 'react';
import { ShareAltOutlined, EnvironmentOutlined, SunOutlined, CarOutlined } from '@ant-design/icons';
import { travelAPI } from '../utils/api';
import { message } from 'antd';
import ImageWithFallback from '../components/ImageWithFallback';

// 规范化图片 URL
const normalizeImageUrl = (url) => {
  if (!url) return '';
  const urlString = String(url).trim();
  if (!urlString) return '';
  if (urlString.startsWith('/')) {
    return urlString;
  }
  if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
    try {
      const urlObj = new URL(urlString);
      return urlObj.pathname + urlObj.search;
    } catch (e) {
      const match = urlString.match(/\/uploads\/[^\s]*/);
      return match ? match[0] : urlString;
    }
  }
  return '/' + urlString;
};

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekday = weekdays[date.getDay()];
  return {
    year,
    month,
    day,
    weekday,
    fullDate: `${month}月${day}日${weekday}`,
    yearMonth: `${year}年${month}月`
  };
};

// 渲染星级评分
const renderStars = (rating) => {
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(
      <span
        key={i}
        className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    );
  }
  return <div className="flex gap-0.5">{stars}</div>;
};

const Travel = () => {
  const [travels, setTravels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTravels();
  }, []);

  const loadTravels = async () => {
    try {
      setLoading(true);
      const data = await travelAPI.getAll();
      setTravels(data);
    } catch (error) {
      message.error('加载旅行记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 按年月分组旅行记录
  const groupedTravels = useMemo(() => {
    const grouped = {};
    travels.forEach((travel) => {
      if (!travel.date) return;
      const { yearMonth } = formatDate(travel.date);
      if (!grouped[yearMonth]) {
        grouped[yearMonth] = [];
      }
      grouped[yearMonth].push(travel);
    });

    // 对每个月的记录按日期倒序排列
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    // 对月份进行排序（倒序）
    return Object.keys(grouped)
      .sort((a, b) => {
        const dateA = new Date(a.replace('年', '-').replace('月', ''));
        const dateB = new Date(b.replace('年', '-').replace('月', ''));
        return dateB - dateA;
      })
      .reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {});
  }, [travels]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: '旅行记录',
        text: '记录旅行的美好时光,分享沿途的精彩瞬间',
        url: window.location.href,
      }).catch((error) => {
        console.log('分享失败:', error);
      });
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href).then(() => {
        message.success('链接已复制到剪贴板');
      }).catch(() => {
        message.error('复制失败');
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full py-4 md:py-8 px-4 md:px-8 bg-bg-100">
        <div className="w-full max-w-3xl my-0 mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-bg-300 rounded mb-4"></div>
            <div className="h-4 bg-bg-300 rounded mb-8"></div>
            <div className="h-64 bg-bg-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full py-4 md:py-8 px-4 md:px-8 bg-bg-100 overflow-y-auto">
      <div className="w-full max-w-3xl my-0 mx-auto">
        {/* 标题区域 */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-text-100 mb-2">旅行记录</h1>
            <p className="text-text-200">记录旅行的美好时光,分享沿途的精彩瞬间</p>
          </div>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-bg-200 rounded-lg transition-colors"
            title="分享"
          >
            <ShareAltOutlined className="text-xl text-text-200" />
          </button>
        </div>

        {/* 旅行记录列表 */}
        {travels.length === 0 ? (
          <div className="text-center py-12 text-text-200 bg-white rounded-lg">
            <p>暂无旅行记录</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedTravels).map(([yearMonth, monthTravels]) => (
              <div key={yearMonth} className="space-y-6">
                {/* 月份标题 */}
                <h2 className="text-xl font-semibold text-text-100">{yearMonth}</h2>

                {/* 该月的旅行记录 */}
                {monthTravels.map((travel) => {
                  const { day, fullDate } = formatDate(travel.date);
                  const displayImages = travel.images?.slice(0, 6) || [];
                  const remainingCount = (travel.images?.length || 0) - 6;

                  return (
                    <div
                      key={travel._id}
                      className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* 日期圆圈和标题 */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-medium text-text-100">{day}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-text-100 mb-2">
                            {travel.title}
                          </h3>
                          {/* 元数据行 */}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-text-200">
                            {travel.location && (
                              <div className="flex items-center gap-1">
                                <EnvironmentOutlined />
                                <span>{travel.location}</span>
                              </div>
                            )}
                            {travel.rating && (
                              <div className="flex items-center">
                                {renderStars(travel.rating)}
                              </div>
                            )}
                            <div>{fullDate}</div>
                            {travel.weather && (
                              <div className="flex items-center gap-1">
                                <SunOutlined />
                                <span>{travel.weather}</span>
                              </div>
                            )}
                            {travel.transport && (
                              <div className="flex items-center gap-1">
                                <CarOutlined />
                                <span>{travel.transport}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 描述 */}
                      {travel.description && (
                        <p className="text-text-200 mb-4 leading-relaxed whitespace-pre-line">
                          {travel.description}
                        </p>
                      )}

                      {/* 图片网格 */}
                      {displayImages.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {displayImages.map((imageUrl, index) => {
                            const isLast = index === displayImages.length - 1;
                            const showOverlay = isLast && remainingCount > 0;

                            return (
                              <div
                                key={index}
                                className="relative aspect-square overflow-hidden rounded-lg bg-bg-200 group cursor-pointer"
                              >
                                <ImageWithFallback
                                  src={normalizeImageUrl(imageUrl)}
                                  alt={`${travel.title} - 图片 ${index + 1}`}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                  loading="lazy"
                                />
                                {showOverlay && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <span className="text-white text-lg font-semibold">
                                      +{remainingCount}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Travel;
