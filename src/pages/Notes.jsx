import { useState, useEffect } from 'react';
import { ClockCircleOutlined } from '@ant-design/icons';
import { eventAPI } from '../utils/api';
import { message } from 'antd';

const Notes = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventAPI.getAll();
      setEvents(data);
    } catch (error) {
      console.error('加载时间事件失败:', error);
      message.error('加载时间事件失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-bg-100 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 md:p-8">
          <div className="animate-pulse space-y-3">
            <div className="h-12 bg-bg-300 rounded-lg"></div>
            <div className="h-12 bg-bg-300 rounded-lg"></div>
            <div className="h-12 bg-bg-300 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-bg-100 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-text-100 mb-2 flex items-center gap-2">
            <ClockCircleOutlined />
            时间事件
          </h1>
          <p className="text-text-200 text-sm">记录生活中的重要时刻</p>
        </div>

        <div className="space-y-2">
          {events.length === 0 ? (
            <div className="text-center py-12 text-text-200 bg-white rounded-lg">
              <ClockCircleOutlined className="text-4xl mb-2 opacity-50" />
              <p>暂无时间事件</p>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event._id}
                className="group cursor-pointer rounded-lg px-4 py-3 transition-all duration-200 flex items-center justify-between bg-white text-text-100 hover:bg-bg-200"
                onClick={() => {
                  // 可以添加点击事件，比如跳转到详情页
                  console.log('点击了事件:', event.title);
                }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <ClockCircleOutlined className="text-lg text-text-200 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-100 truncate">
                      {event.title}
                    </div>
                    {event.description && (
                      <div className="text-xs text-text-200 mt-0.5 truncate">
                        {event.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-text-200 flex-shrink-0 ml-4">
                  {formatDate(event.date)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notes;

