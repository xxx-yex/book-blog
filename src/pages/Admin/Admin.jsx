import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  message, 
  Popconfirm,
  Card,
  Upload
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ExportOutlined,
  ImportOutlined,
  UploadOutlined,
  LinkOutlined,
  ClockCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { categoryAPI, articleAPI, photoAPI, bookmarkAPI, homeAPI, eventAPI } from '../../utils/api';
import { isAuthenticated } from '../../utils/auth';
import LocationPicker from '../../components/LocationPicker';
import { marked } from 'marked';

const Admin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedArticleIds, setSelectedArticleIds] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [photoForm] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [bookmarkForm] = Form.useForm();
  const [events, setEvents] = useState([]);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm] = Form.useForm();
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  
  // 从 URL 参数或 localStorage 获取当前选中的标签
  const activeTab = searchParams.get('tab') || localStorage.getItem('adminActiveTab') || 'categories';

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/');
      message.warning('请先登录');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesData, articlesData, photosData, bookmarksData, eventsData] = await Promise.all([
        categoryAPI.getAll(),
        articleAPI.getAll(),
        photoAPI.getAll(),
        bookmarkAPI.getAll(),
        eventAPI.getAll(),
      ]);
      setCategories(categoriesData);
      setArticles(articlesData);
      setPhotos(photosData);
      // 将书签对象转换为数组
      const bookmarksArray = Object.values(bookmarksData).flat();
      setBookmarks(bookmarksArray);
      setEvents(eventsData);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async (values) => {
    try {
      if (editingCategory) {
        await categoryAPI.update(editingCategory._id, values);
        message.success('分类更新成功');
      } else {
        await categoryAPI.create(values);
        message.success('分类创建成功');
      }
      setCategoryModalOpen(false);
      setEditingCategory(null);
      categoryForm.resetFields();
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleCategoryEdit = (record) => {
    setEditingCategory(record);
    categoryForm.setFieldsValue(record);
    setCategoryModalOpen(true);
  };

  const handleCategoryDelete = async (id) => {
    try {
      await categoryAPI.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleBatchCategoryDelete = async () => {
    if (selectedCategoryIds.length === 0) {
      message.warning('请先选择要删除的分类');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedCategoryIds.length} 个分类吗？此操作不可恢复，且会删除该分类下的所有文章。`,
      onOk: async () => {
        try {
          await categoryAPI.batchDelete(selectedCategoryIds);
          message.success(`成功删除 ${selectedCategoryIds.length} 个分类`);
          setSelectedCategoryIds([]);
          loadData();
        } catch (error) {
          message.error(error.response?.data?.message || '批量删除失败');
        }
      },
    });
  };

  const handleArticleDelete = async (id) => {
    try {
      await articleAPI.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedArticleIds.length === 0) {
      message.warning('请先选择要删除的文章');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedArticleIds.length} 篇文章吗？此操作不可恢复。`,
      onOk: async () => {
        try {
          await articleAPI.batchDelete(selectedArticleIds);
          message.success(`成功删除 ${selectedArticleIds.length} 篇文章`);
          setSelectedArticleIds([]);
          loadData();
        } catch (error) {
          message.error(error.response?.data?.message || '批量删除失败');
        }
      },
    });
  };

  const handleExport = () => {
    if (articles.length === 0) {
      message.warning('没有可导出的文章');
      return;
    }

    // 准备导出数据
    const exportData = articles.map(article => ({
      title: article.title,
      content: article.content,
      category: article.category?._id || null,
      tags: article.tags || [],
      views: article.views || 0,
      likes: article.likes || 0,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    }));

    // 创建 JSON 文件并下载
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `articles_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    message.success('导出成功');
  };

  const handleImport = async (file) => {
    try {
      const fileName = file.name || '';
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      const text = await file.text();

      let importData = [];

      // 处理 Markdown 文件
      if (fileExtension === 'md' || fileExtension === 'markdown') {
        // 提取标题（从文件名或第一行 # 标题）
        let title = fileName.replace(/\.(md|markdown)$/i, '').trim();
        
        // 尝试从内容第一行提取标题
        const lines = text.split('\n');
        const firstLine = lines[0]?.trim();
        if (firstLine && firstLine.startsWith('#')) {
          title = firstLine.replace(/^#+\s*/, '').trim();
        }
        
        // 如果没有找到标题，使用文件名
        if (!title) {
          title = fileName.replace(/\.(md|markdown)$/i, '');
        }

        // 将 Markdown 转换为 HTML
        const htmlContent = marked(text);

        importData = [{
          title: title || '未命名文章',
          content: htmlContent,
          tags: [],
          views: 0,
          likes: 0,
        }];
      } 
      // 处理 JSON 文件
      else if (fileExtension === 'json') {
        const parsedData = JSON.parse(text);

        if (!Array.isArray(parsedData)) {
          message.error('导入文件格式错误：必须是文章数组');
          return false;
        }

        importData = parsedData;
      } 
      else {
        message.error('不支持的文件格式，请导入 .json 或 .md 文件');
        return false;
      }

      if (importData.length === 0) {
        message.error('导入文件为空');
        return false;
      }

      Modal.confirm({
        title: '确认导入',
        content: `确定要导入 ${importData.length} 篇文章吗？`,
        onOk: async () => {
          try {
            const result = await articleAPI.batchImport(importData);
            message.success(
              `导入完成：成功 ${result.importedCount} 篇，失败 ${result.errorCount} 篇`
            );
            if (result.errors && result.errors.length > 0) {
              console.error('导入错误:', result.errors);
            }
            setSelectedArticleIds([]);
            loadData();
          } catch (error) {
            message.error(error.response?.data?.message || '导入失败');
          }
        },
      });

      return false; // 阻止默认上传行为
    } catch (error) {
      message.error('读取文件失败：' + error.message);
      return false;
    }
  };

  // 导出所有数据
  const handleExportAllData = async () => {
    try {
      setLoading(true);
      
      // 获取所有数据
      const [categoriesData, articlesData, photosData, bookmarksData, homeData, eventsData] = await Promise.all([
        categoryAPI.getAll(),
        articleAPI.getAll(),
        photoAPI.getAll(),
        bookmarkAPI.getAll(),
        homeAPI.get(),
        eventAPI.getAll(),
      ]);

      // 构建导出数据对象（包含元数据）
      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        description: '网站完整数据导出',
        data: {
          categories: categoriesData || [],
          articles: articlesData || [],
          photos: photosData || [],
          bookmarks: bookmarksData || {},
          home: homeData || {},
          events: eventsData || [],
        },
      };

      // 创建 JSON 文件并下载
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `website_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success('数据导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败：' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 导入所有数据
  const handleImportAllData = async (file) => {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // 验证数据格式
      if (!importData.data || typeof importData.data !== 'object') {
        message.error('导入文件格式错误：缺少 data 字段');
        return false;
      }

      const { categories, articles, photos, bookmarks, home, events } = importData.data;

      // 统计数据量
      const stats = {
        categories: Array.isArray(categories) ? categories.length : 0,
        articles: Array.isArray(articles) ? articles.length : 0,
        photos: Array.isArray(photos) ? photos.length : 0,
        bookmarks: bookmarks ? Object.keys(bookmarks).reduce((sum, key) => sum + (bookmarks[key]?.length || 0), 0) : 0,
        home: home ? 1 : 0,
        events: Array.isArray(events) ? events.length : 0,
      };

      const totalItems = stats.categories + stats.articles + stats.photos + stats.bookmarks + stats.home + stats.events;

      if (totalItems === 0) {
        message.error('导入文件为空');
        return false;
      }

      Modal.confirm({
        title: '确认导入数据',
        content: (
          <div className="py-2">
            <p className="mb-2">确定要导入以下数据吗？</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              {stats.categories > 0 && <li>分类：{stats.categories} 个</li>}
              {stats.articles > 0 && <li>文章：{stats.articles} 篇</li>}
              {stats.photos > 0 && <li>相册：{stats.photos} 张</li>}
              {stats.bookmarks > 0 && <li>书签：{stats.bookmarks} 个</li>}
              {stats.events > 0 && <li>时间事件：{stats.events} 个</li>}
              {stats.home > 0 && <li>首页配置：1 个</li>}
            </ul>
            <p className="mt-3 text-red-600 text-sm font-semibold">
              警告：导入会覆盖现有数据，请确保已备份！
            </p>
          </div>
        ),
        okText: '确认导入',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            setLoading(true);
            const results = {
              categories: { success: 0, failed: 0 },
              articles: { success: 0, failed: 0 },
              photos: { success: 0, failed: 0 },
              bookmarks: { success: 0, failed: 0 },
              events: { success: 0, failed: 0 },
              home: { success: 0, failed: 0 },
            };

            // 导入分类
            if (Array.isArray(categories) && categories.length > 0) {
              for (const category of categories) {
                try {
                  await categoryAPI.create(category);
                  results.categories.success++;
                } catch (error) {
                  results.categories.failed++;
                  console.error('导入分类失败:', category, error);
                }
              }
            }

            // 导入文章
            if (Array.isArray(articles) && articles.length > 0) {
              try {
                const result = await articleAPI.batchImport(articles);
                results.articles.success = result.importedCount || 0;
                results.articles.failed = result.errorCount || 0;
              } catch (error) {
                results.articles.failed = articles.length;
                console.error('导入文章失败:', error);
              }
            }

            // 导入相册（注意：相册需要上传图片文件，这里只导入元数据）
            if (Array.isArray(photos) && photos.length > 0) {
              message.warning('相册数据导入功能需要图片文件，当前仅支持元数据导入');
              // 暂时跳过相册导入，因为需要图片文件
              results.photos.failed = photos.length;
            }

            // 导入书签
            if (bookmarks && typeof bookmarks === 'object') {
              for (const [, items] of Object.entries(bookmarks)) {
                if (Array.isArray(items)) {
                  for (const bookmark of items) {
                    try {
                      await bookmarkAPI.create(bookmark);
                      results.bookmarks.success++;
                    } catch (error) {
                      results.bookmarks.failed++;
                      console.error('导入书签失败:', bookmark, error);
                    }
                  }
                }
              }
            }

            // 导入时间事件
            if (Array.isArray(events) && events.length > 0) {
              for (const event of events) {
                try {
                  await eventAPI.create(event);
                  results.events.success++;
                } catch (error) {
                  results.events.failed++;
                  console.error('导入时间事件失败:', event, error);
                }
              }
            }

            // 导入首页配置
            if (home) {
              try {
                const formData = new FormData();
                formData.append('name', home.name || '');
                formData.append('subtitle', home.subtitle || '');
                formData.append('introduction', home.introduction || '');
                formData.append('socialLinks', JSON.stringify(home.socialLinks || []));
                formData.append('education', JSON.stringify(home.education || []));
                formData.append('work', JSON.stringify(home.work || []));
                formData.append('stats', JSON.stringify(home.stats || {}));
                formData.append('siteInfo', JSON.stringify(home.siteInfo || {}));
                await homeAPI.update(formData);
                results.home.success = 1;
              } catch (error) {
                results.home.failed = 1;
                console.error('导入首页配置失败:', error);
              }
            }

            // 显示导入结果
            const successTotal = Object.values(results).reduce((sum, r) => sum + r.success, 0);
            const failedTotal = Object.values(results).reduce((sum, r) => sum + r.failed, 0);
            
            message.success(
              `导入完成：成功 ${successTotal} 项，失败 ${failedTotal} 项`
            );

            // 重新加载数据
            loadData();
          } catch (error) {
            message.error('导入失败：' + (error.response?.data?.message || error.message));
          } finally {
            setLoading(false);
          }
        },
      });

      return false; // 阻止默认上传行为
    } catch (error) {
      message.error('读取文件失败：' + error.message);
      return false;
    }
  };

  const handlePhotoUpload = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('title', file.name);
      
      await photoAPI.upload(formData);
      message.success('照片上传成功');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '上传失败');
    } finally {
      setUploading(false);
    }
    return false; // 阻止默认上传行为
  };

  const handlePhotoEdit = (record) => {
    setEditingPhoto(record);
    photoForm.setFieldsValue({
      title: record.title,
      description: record.description,
      tags: record.tags?.join(',') || '',
    });
    setPhotoModalOpen(true);
  };

  const handlePhotoSubmit = async (values) => {
    try {
      const { tags, ...rest } = values;
      const photoData = {
        ...rest,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
      };
      
      await photoAPI.update(editingPhoto._id, photoData);
      message.success('照片信息更新成功');
      setPhotoModalOpen(false);
      setEditingPhoto(null);
      photoForm.resetFields();
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '更新失败');
    }
  };

  const handlePhotoDelete = async (id) => {
    try {
      await photoAPI.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleBatchPhotoDelete = async () => {
    if (selectedPhotoIds.length === 0) {
      message.warning('请先选择要删除的照片');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedPhotoIds.length} 张照片吗？此操作不可恢复。`,
      onOk: async () => {
        try {
          await photoAPI.batchDelete(selectedPhotoIds);
          message.success(`成功删除 ${selectedPhotoIds.length} 张照片`);
          setSelectedPhotoIds([]);
          loadData();
        } catch (error) {
          message.error(error.response?.data?.message || '批量删除失败');
        }
      },
    });
  };

  // 书签相关函数
  const handleBookmarkSubmit = async (values) => {
    try {
      if (editingBookmark) {
        await bookmarkAPI.update(editingBookmark._id, values);
        message.success('书签更新成功');
      } else {
        await bookmarkAPI.create(values);
        message.success('书签创建成功');
      }
      setBookmarkModalOpen(false);
      setEditingBookmark(null);
      bookmarkForm.resetFields();
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleBookmarkEdit = (record) => {
    setEditingBookmark(record);
    bookmarkForm.setFieldsValue(record);
    setBookmarkModalOpen(true);
  };

  const handleBookmarkDelete = async (id) => {
    try {
      await bookmarkAPI.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  // 时间事件相关函数
  const handleEventSubmit = async (values) => {
    try {
      if (editingEvent) {
        await eventAPI.update(editingEvent._id, values);
        message.success('时间事件更新成功');
      } else {
        await eventAPI.create(values);
        message.success('时间事件创建成功');
      }
      setEventModalOpen(false);
      setEditingEvent(null);
      eventForm.resetFields();
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleEventEdit = (record) => {
    setEditingEvent(record);
    eventForm.setFieldsValue({
      title: record.title,
      description: record.description,
      location: record.location || '',
      mood: record.mood || '',
      date: record.date ? new Date(record.date).toISOString().split('T')[0] : '',
    });
    setEventModalOpen(true);
  };

  const handleEventDelete = async (id) => {
    try {
      await eventAPI.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleBatchEventDelete = async () => {
    if (selectedEventIds.length === 0) {
      message.warning('请先选择要删除的时间事件');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedEventIds.length} 个时间事件吗？此操作不可恢复。`,
      onOk: async () => {
        try {
          await eventAPI.batchDelete(selectedEventIds);
          message.success(`成功删除 ${selectedEventIds.length} 个时间事件`);
          setSelectedEventIds([]);
          loadData();
        } catch (error) {
          message.error(error.response?.data?.message || '批量删除失败');
        }
      },
    });
  };

  // 按年份、月份和日期分组事件（用于时间线展示）
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

  const categoryColumns = [
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      render: (icon) => icon || '-',
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      sorter: (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleCategoryEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个分类吗？"
            onConfirm={() => handleCategoryDelete(record._id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const articleColumns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '分类',
      dataIndex: ['category', 'name'],
      key: 'category',
      render: (name) => name || '-',
    },
    {
      title: '浏览量',
      dataIndex: 'views',
      key: 'views',
      sorter: (a, b) => (a.views || 0) - (b.views || 0),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/article/${record._id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这篇文章吗？"
            onConfirm={() => handleArticleDelete(record._id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'categories',
      label: '分类管理',
      children: (
        <Card>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-black">分类列表</h2>
            <Space>
              {selectedCategoryIds.length > 0 && (
                <Button 
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleBatchCategoryDelete}
                >
                  批量删除 ({selectedCategoryIds.length})
                </Button>
              )}
              <Button 
                className="bg-gray-800 text-white hover:bg-gray-700 border-none"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingCategory(null);
                  categoryForm.resetFields();
                  setCategoryModalOpen(true);
                }}
              >
                新增分类
              </Button>
            </Space>
          </div>
          <Table
            columns={categoryColumns}
            dataSource={categories}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            rowSelection={{
              selectedRowKeys: selectedCategoryIds,
              onChange: (selectedRowKeys) => {
                setSelectedCategoryIds(selectedRowKeys);
              },
            }}
          />
        </Card>
      ),
    },
    {
      key: 'articles',
      label: '文章管理',
      children: (
        <Card>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-black">文章列表</h2>
            <Space>
              {selectedArticleIds.length > 0 && (
                <Button 
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleBatchDelete}
                >
                  批量删除 ({selectedArticleIds.length})
                </Button>
              )}
              <Button 
                icon={<ExportOutlined />}
                onClick={handleExport}
              >
                导出
              </Button>
              <Upload
                accept=".json,.md,.markdown"
                beforeUpload={handleImport}
                showUploadList={false}
              >
                <Button 
                  icon={<ImportOutlined />}
                >
                  导入
                </Button>
              </Upload>
              <Button 
                className="bg-gray-800 text-white hover:bg-gray-700 border-none"
                icon={<PlusOutlined />}
                onClick={() => navigate('/admin/article')}
              >
                新增文章
              </Button>
            </Space>
          </div>
          <Table
            columns={articleColumns}
            dataSource={articles}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            rowSelection={{
              selectedRowKeys: selectedArticleIds,
              onChange: (selectedRowKeys) => {
                setSelectedArticleIds(selectedRowKeys);
              },
            }}
          />
        </Card>
      ),
    },
    {
      key: 'photos',
      label: '相册管理',
      children: (
        <Card>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-black">照片列表</h2>
            <Space>
              {selectedPhotoIds.length > 0 && (
                <Button 
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleBatchPhotoDelete}
                >
                  批量删除 ({selectedPhotoIds.length})
                </Button>
              )}
              <Upload
                accept="image/*"
                beforeUpload={handlePhotoUpload}
                showUploadList={false}
                disabled={uploading}
              >
                <Button 
                  className="bg-gray-800 text-white hover:bg-gray-700 border-none"
                  icon={<UploadOutlined />}
                  loading={uploading}
                >
                  上传照片
                </Button>
              </Upload>
            </Space>
          </div>
          <Table
            columns={[
              {
                title: '缩略图',
                dataIndex: 'thumbnailUrl',
                key: 'thumbnail',
                width: 100,
                render: (url, record) => (
                  <img 
                    src={`${url || record.url}`}
                    alt={record.title}
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => {
                      e.target.src = `${record.url}`;
                    }}
                  />
                ),
              },
              {
                title: '标题',
                dataIndex: 'title',
                key: 'title',
              },
              {
                title: '描述',
                dataIndex: 'description',
                key: 'description',
                ellipsis: true,
              },
              {
                title: '标签',
                dataIndex: 'tags',
                key: 'tags',
                render: (tags) => tags?.join(', ') || '-',
              },
              {
                title: '创建时间',
                dataIndex: 'createdAt',
                key: 'createdAt',
                render: (date) => new Date(date).toLocaleString('zh-CN'),
              },
              {
                title: '操作',
                key: 'action',
                render: (_, record) => (
                  <Space>
                    <Button 
                      type="link" 
                      icon={<EditOutlined />}
                      onClick={() => handlePhotoEdit(record)}
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="确定要删除这张照片吗？"
                      onConfirm={() => handlePhotoDelete(record._id)}
                    >
                      <Button type="link" danger icon={<DeleteOutlined />}>
                        删除
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
            dataSource={photos}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            rowSelection={{
              selectedRowKeys: selectedPhotoIds,
              onChange: (selectedRowKeys) => {
                setSelectedPhotoIds(selectedRowKeys);
              },
            }}
          />
        </Card>
      ),
    },
    {
      key: 'bookmarks',
      label: '导航管理',
      children: (
        <Card>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-black">书签列表</h2>
            <Button 
              className="bg-gray-800 text-white hover:bg-gray-700 border-none"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingBookmark(null);
                bookmarkForm.resetFields();
                setBookmarkModalOpen(true);
              }}
            >
              新增书签
            </Button>
          </div>
          <Table
            columns={[
              {
                title: '图标',
                dataIndex: 'icon',
                key: 'icon',
                width: 80,
                render: (icon, record) => (
                  icon ? (
                    <img 
                      src={icon}
                      alt={record.title}
                      className="w-8 h-8 rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-bg-200 flex items-center justify-center">
                      <LinkOutlined className="text-text-200" />
                    </div>
                  )
                ),
              },
              {
                title: '标题',
                dataIndex: 'title',
                key: 'title',
              },
              {
                title: '链接',
                dataIndex: 'url',
                key: 'url',
                ellipsis: true,
                render: (url) => (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                    {url}
                  </a>
                ),
              },
              {
                title: '分类',
                dataIndex: 'category',
                key: 'category',
              },
              {
                title: '描述',
                dataIndex: 'description',
                key: 'description',
                ellipsis: true,
              },
              {
                title: '排序',
                dataIndex: 'order',
                key: 'order',
                width: 80,
              },
              {
                title: '操作',
                key: 'action',
                render: (_, record) => (
                  <Space>
                    <Button 
                      type="link" 
                      icon={<EditOutlined />}
                      onClick={() => handleBookmarkEdit(record)}
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="确定要删除这个书签吗？"
                      onConfirm={() => handleBookmarkDelete(record._id)}
                    >
                      <Button type="link" danger icon={<DeleteOutlined />}>
                        删除
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
            dataSource={bookmarks}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: 'events',
      label: '时间事件管理',
      children: (
        <div className="w-full h-full bg-bg-100 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-4 md:p-8">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-text-100 mb-2">
                    时间笔记
                  </h1>
                  <p className="text-text-200 text-sm">记录了生活中的重要时刻</p>
                </div>
                <Button 
                  className="bg-gray-800 text-white hover:bg-gray-700 border-none"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingEvent(null);
                    eventForm.resetFields();
                    setEventModalOpen(true);
                  }}
                >
                  新增时间事件
                </Button>
              </div>
            </div>
            
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-12 bg-bg-300 rounded-lg"></div>
                <div className="h-12 bg-bg-300 rounded-lg"></div>
                <div className="h-12 bg-bg-300 rounded-lg"></div>
              </div>
            ) : events.length === 0 ? (
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
                                
                                // 根据索引判断左右交替：偶数在右，奇数在左
                                const isLeft = dayIndex % 2 === 1;
                                
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
                                    
                                    {/* 事件列表 - 根据 isLeft 决定左右位置 */}
                                    <div className={`flex-1 space-y-4 ${isLeft ? 'mr-2 order-first' : 'ml-2'}`}>
                                      {dayEvents.map((event, eventIndex) => (
                                        <div
                                          key={event._id}
                                          className="group cursor-pointer transition-all duration-200 hover:bg-white/50 p-3 rounded-lg"
                                          onClick={() => handleEventEdit(event)}
                                        >
                                          <div className="flex items-start justify-between gap-4">
                                            <div className={`flex items-start gap-4 flex-1 min-w-0 ${isLeft ? 'flex-row-reverse' : ''}`}>
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
                                              {(event.location || event.mood) && (
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
                                              )}
                                            </div>
                                            
                                            {/* 删除按钮 - 始终在右侧，不受flex-row-reverse影响 */}
                                            <div className="flex-shrink-0">
                                              <Popconfirm
                                                title="确定要删除这个时间事件吗？"
                                                onConfirm={(e) => {
                                                  e.stopPropagation();
                                                  handleEventDelete(event._id);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                okText="确定"
                                                cancelText="取消"
                                              >
                                                <Button
                                                  type="text"
                                                  size="small"
                                                  danger
                                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  删除
                                                </Button>
                                              </Popconfirm>
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
      ),
    },
    {
      key: 'data',
      label: '数据管理',
      children: (
        <Card>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-black mb-4">数据导入/导出</h2>
            <p className="text-text-200 mb-6">
              您可以导出所有网站数据（分类、文章、相册、书签、首页配置）为 JSON 文件，也可以从 JSON 文件导入数据。
            </p>
            
            <Space direction="vertical" size="large" className="w-full">
              <div className="p-4 border border-bg-300 rounded-lg">
                <h3 className="text-base font-semibold text-text-100 mb-2">导出数据</h3>
                <p className="text-sm text-text-200 mb-4">
                  导出所有数据为 JSON 格式文件，包含：分类、文章、相册、书签、时间事件、首页配置
                </p>
                <Button
                  className="bg-gray-800 text-white hover:bg-gray-700 border-none"
                  icon={<ExportOutlined />}
                  onClick={handleExportAllData}
                  loading={loading}
                >
                  导出所有数据
                </Button>
              </div>

              <div className="p-4 border border-bg-300 rounded-lg">
                <h3 className="text-base font-semibold text-text-100 mb-2">导入数据</h3>
                <p className="text-sm text-text-200 mb-4">
                  从 JSON 文件导入数据。注意：导入会覆盖现有数据，请谨慎操作！
                </p>
                <Upload
                  accept=".json"
                  beforeUpload={handleImportAllData}
                  showUploadList={false}
                >
                  <Button
                    className="bg-gray-800 text-white hover:bg-gray-700 border-none"
                    icon={<ImportOutlined />}
                    loading={loading}
                  >
                    选择文件导入
                  </Button>
                </Upload>
              </div>
            </Space>
          </div>
        </Card>
      ),
    },
  ];

  // 根据当前选中的标签显示对应的内容
  const getCurrentTabContent = () => {
    const currentTab = tabItems.find(tab => tab.key === activeTab);
    return currentTab ? currentTab.children : null;
  };

  return (
    <div className="w-full h-full">
      <div className="p-4 md:p-8 bg-white">
        {getCurrentTabContent()}
        
        {/* 分类编辑弹窗 */}
        <Modal
          title={editingCategory ? '编辑分类' : '新增分类'}
          open={categoryModalOpen}
          onCancel={() => {
            setCategoryModalOpen(false);
            setEditingCategory(null);
            categoryForm.resetFields();
          }}
          footer={null}
        >
          <Form
            form={categoryForm}
            layout="vertical"
            onFinish={handleCategorySubmit}
            className="mt-4"
          >
            <Form.Item
              name="name"
              label="分类名称"
              rules={[{ required: true, message: '请输入分类名称' }]}
            >
              <Input placeholder="请输入分类名称" />
            </Form.Item>
            <Form.Item
              name="icon"
              label="图标"
            >
              <Input placeholder="图标（可选）" />
            </Form.Item>
            <Form.Item
              name="sortOrder"
              label="排序"
              initialValue={0}
            >
              <InputNumber min={0} placeholder="排序值，数字越小越靠前" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button 
                  className="bg-gray-800 text-white hover:bg-gray-700 border-none"
                  htmlType="submit"
                >
                  {editingCategory ? '更新' : '创建'}
                </Button>
                <Button onClick={() => {
                  setCategoryModalOpen(false);
                  categoryForm.resetFields();
                }}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 照片编辑弹窗 */}
        <Modal
          title="编辑照片信息"
          open={photoModalOpen}
          onCancel={() => {
            setPhotoModalOpen(false);
            setEditingPhoto(null);
            photoForm.resetFields();
          }}
          footer={null}
        >
          <Form
            form={photoForm}
            layout="vertical"
            onFinish={handlePhotoSubmit}
            className="mt-4"
          >
            <Form.Item
              name="title"
              label="标题"
              rules={[{ required: true, message: '请输入标题' }]}
            >
              <Input placeholder="请输入照片标题" />
            </Form.Item>
            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea rows={4} placeholder="请输入照片描述（可选）" />
            </Form.Item>
            <Form.Item
              name="tags"
              label="标签"
            >
              <Input placeholder="请输入标签，用逗号分隔（可选）" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button 
                  className="bg-gray-800 text-white hover:bg-gray-700 border-none"
                  htmlType="submit"
                >
                  更新
                </Button>
                <Button onClick={() => {
                  setPhotoModalOpen(false);
                  photoForm.resetFields();
                }}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 书签编辑弹窗 */}
        <Modal
          title={editingBookmark ? '编辑书签' : '新增书签'}
          open={bookmarkModalOpen}
          onCancel={() => {
            setBookmarkModalOpen(false);
            setEditingBookmark(null);
            bookmarkForm.resetFields();
          }}
          footer={null}
        >
          <Form
            form={bookmarkForm}
            layout="vertical"
            onFinish={handleBookmarkSubmit}
            className="mt-4"
          >
            <Form.Item
              name="title"
              label="标题"
              rules={[{ required: true, message: '请输入标题' }]}
            >
              <Input placeholder="请输入书签标题" />
            </Form.Item>
            <Form.Item
              name="url"
              label="链接"
              rules={[
                { required: true, message: '请输入链接' },
                { type: 'url', message: '请输入有效的URL' }
              ]}
            >
              <Input placeholder="https://example.com" />
            </Form.Item>
            <Form.Item
              name="category"
              label="分类"
              rules={[{ required: true, message: '请输入分类' }]}
            >
              <Input placeholder="例如：前端框架、工具、设计等" />
            </Form.Item>
            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea rows={3} placeholder="请输入书签描述（可选）" />
            </Form.Item>
            <Form.Item
              name="icon"
              label="图标URL"
            >
              <Input placeholder="图标URL（可选，留空将自动获取网站图标）" />
            </Form.Item>
            <Form.Item
              name="order"
              label="排序"
            >
              <InputNumber min={0} placeholder="数字越小越靠前" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button 
                  className="bg-gray-800 text-white hover:bg-gray-700 border-none"
                  htmlType="submit"
                >
                  {editingBookmark ? '更新' : '创建'}
                </Button>
                <Button onClick={() => {
                  setBookmarkModalOpen(false);
                  bookmarkForm.resetFields();
                }}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 时间事件编辑弹窗 */}
        <Modal
          title={editingEvent ? '编辑时间事件' : '新增时间事件'}
          open={eventModalOpen}
          onCancel={() => {
            setEventModalOpen(false);
            setEditingEvent(null);
            eventForm.resetFields();
          }}
          footer={null}
        >
          <Form
            form={eventForm}
            layout="vertical"
            onFinish={handleEventSubmit}
            className="mt-4"
          >
            <Form.Item
              name="title"
              label="标题"
              rules={[{ required: true, message: '请输入标题' }]}
            >
              <Input placeholder="请输入时间事件标题" />
            </Form.Item>
            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea rows={4} placeholder="请输入时间事件描述（可选）" />
            </Form.Item>
            <Form.Item
              name="location"
              label="地点"
            >
              <LocationPicker placeholder="请选择或输入地点（可选）" />
            </Form.Item>
            <Form.Item
              name="mood"
              label="心情"
            >
              <Input placeholder="请输入心情（可选）" />
            </Form.Item>
            <Form.Item
              name="date"
              label="日期"
              rules={[{ required: true, message: '请选择日期' }]}
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button 
                  className="bg-gray-800 text-white hover:bg-gray-700 border-none"
                  htmlType="submit"
                >
                  {editingEvent ? '更新' : '创建'}
                </Button>
                <Button onClick={() => {
                  setEventModalOpen(false);
                  eventForm.resetFields();
                }}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default Admin;

