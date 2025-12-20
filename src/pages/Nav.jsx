import { useState, useEffect } from 'react';
import { LinkOutlined, ExportOutlined } from '@ant-design/icons';
import { bookmarkAPI } from '../utils/api';
import { message } from 'antd';

const Nav = () => {
  const [bookmarks, setBookmarks] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const data = await bookmarkAPI.getAll();
      setBookmarks(data);
      setCategories(Object.keys(data).sort());
    } catch (error) {
      message.error('加载导航站失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取网站图标
  const getFavicon = (url) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-bg-100 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-bg-300 rounded mb-6 w-48"></div>
            <div className="space-y-4">
              <div className="h-6 bg-bg-300 rounded w-32"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-24 bg-bg-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-bg-100 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-text-100 mb-6 md:mb-8">导航站</h1>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-200">暂无书签，请先添加</p>
          </div>
        ) : (
          <div className="space-y-12">
            {categories.map((category) => (
              <div key={category}>
                <h2 className="text-xl font-semibold text-text-100 mb-4 pb-2 border-b border-bg-300">
                  {category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bookmarks[category]?.map((bookmark) => (
                    <a
                      key={bookmark._id}
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-white rounded-lg p-4 hover:shadow-md transition-all duration-200 border border-bg-300 hover:border-primary-300"
                    >
                      <div className="flex items-start gap-3">
                        {bookmark.icon ? (
                          <img
                            src={bookmark.icon}
                            alt={bookmark.title}
                            className="w-8 h-8 rounded flex-shrink-0"
                            onError={(e) => {
                              const favicon = getFavicon(bookmark.url);
                              if (favicon) {
                                e.target.src = favicon;
                              } else {
                                e.target.style.display = 'none';
                              }
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-bg-200 flex items-center justify-center flex-shrink-0">
                            <LinkOutlined className="text-text-200" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-text-100 group-hover:text-primary-300 transition-colors truncate">
                              {bookmark.title}
                            </h3>
                            <ExportOutlined className="text-text-200 text-xs flex-shrink-0" />
                          </div>
                          {bookmark.description && (
                            <p className="text-xs text-text-200 line-clamp-2">
                              {bookmark.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Nav;
