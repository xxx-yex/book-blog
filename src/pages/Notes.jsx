import { useState, useEffect, useMemo } from 'react';
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

  // 按年份、月份和日期分组事件
  const groupedEvents = useMemo(() => {
    const grouped = {};
    events.forEach((event) => {
      if (!event.date) return;
      const date = new Date(event.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      if (!grouped[year]) {
        grouped[year] = {};
      }
      if (!grouped[year][month]) {
        grouped[year][month] = {};
      }
      if (!grouped[year][month][day]) {
        grouped[year][month][day] = [];
      }
      grouped[year][month][day].push(event);
    });

    // 对每个年份的月份进行排序（倒序）
    Object.keys(grouped).forEach((year) => {
      const months = Object.keys(grouped[year]).map(Number).sort((a, b) => b - a);
      const sortedMonths = {};
      months.forEach((month) => {
        const days = Object.keys(grouped[year][month]).map(Number).sort((a, b) => b - a);
        const sortedDays = {};
        days.forEach((day) => {
          sortedDays[day] = grouped[year][month][day];
        });
        sortedMonths[month] = sortedDays;
      });
      grouped[year] = sortedMonths;
    });

    // 对年份进行排序（倒序）
    return Object.keys(grouped)
      .map(Number)
      .sort((a, b) => b - a)
      .reduce((acc, year) => {
        acc[year] = grouped[year];
        return acc;
      }, {});
  }, [events]);

  const getMonthName = (month) => {
    return `${month}月`;
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
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-text-100 mb-2">
            时间笔记
          </h1>
          <p className="text-text-200 text-sm">记录了生活中的重要时刻</p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12 text-text-200 bg-white rounded-lg">
            <ClockCircleOutlined className="text-4xl mb-2 opacity-50" />
            <p>暂无时间事件</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedEvents).map(([year, months]) => (
              <div key={year} className="relative">
                {/* 年份标题 */}
                <h2 className="text-xl font-bold text-text-100 mb-6">{year}</h2>
                
                {/* 时间线容器 */}
                <div className="relative pl-28">
                  {/* 垂直时间线 */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-bg-300"></div>
                  
                  {/* 月份和事件 */}
                  <div className="space-y-8">
                    {Object.entries(months).map(([month, days]) => {
                      const monthNum = parseInt(month);
                      let isFirstDayInMonth = true;
                      
                      return (
                        <div key={`${year}-${month}`} className="space-y-6">
                          {Object.entries(days).map(([day, dayEvents], dayIndex) => {
                            const dayNum = parseInt(day);
                            const showMonth = isFirstDayInMonth;
                            if (isFirstDayInMonth) isFirstDayInMonth = false;
                            
                            return (
                              <div key={`${year}-${month}-${day}`} className="relative flex items-center">
                                {/* 日期圆圈 */}
                                <div className="absolute -left-20 w-[60px] h-[60px] rounded-full flex items-center justify-center z-10" style={{ backgroundColor: '#d4eaf7' }}>
                                  <span className="text-lg text-text-100 font-medium">
                                    {dayNum}
                                  </span>
                                </div>
                                
                                {/* 月份文字（只在每月的第一个日期显示，放在圆圈左侧） */}
                                {showMonth && (
                                  <div className="absolute -left-32 flex items-center justify-end pr-3 z-10">
                                    <span className="text-base font-medium text-text-100">
                                      {getMonthName(monthNum)}
                                    </span>
                                  </div>
                                )}
                                
                                {/* 事件列表 */}
                                <div className="flex-1 space-y-4 ml-2">
                                  {dayEvents.map((event, eventIndex) => (
                                    <div
                                      key={event._id}
                                      className="group cursor-pointer transition-all duration-200"
                                    >
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                          {/* 主标题 */}
                                          <div className="text-base font-medium text-text-100 mb-1">
                                            {event.title}
                                          </div>
                                          {/* 副标题（描述） */}
                                          {event.description && (
                                            <div className="text-sm text-text-200">
                                              {event.description}
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* 标签区域 */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          {event.location && (
                                            <span className="px-2.5 py-1 bg-bg-200 text-text-200 rounded-full text-xs whitespace-nowrap">
                                              {event.location}
                                            </span>
                                          )}
                                          {event.mood && (
                                            <span className="px-2.5 py-1 bg-bg-200 text-text-200 rounded-full text-xs whitespace-nowrap">
                                              {event.mood}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;

