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
import { categoryAPI, articleAPI, photoAPI, bookmarkAPI, homeAPI, eventAPI, travelAPI, annotationAPI } from '../../utils/api';
import { isAuthenticated } from '../../utils/auth';
import LocationPicker from '../../components/LocationPicker';
import { marked } from 'marked';
import JSZip from 'jszip';

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
  const [travels, setTravels] = useState([]);
  const [travelModalOpen, setTravelModalOpen] = useState(false);
  const [editingTravel, setEditingTravel] = useState(null);
  const [travelForm] = Form.useForm();
  const [selectedTravelIds, setSelectedTravelIds] = useState([]);
  const [travelImages, setTravelImages] = useState([]);
  const [travelImageFileList, setTravelImageFileList] = useState([]);
  
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
      const [categoriesData, articlesData, photosData, bookmarksData, eventsData, travelsData] = await Promise.all([
        categoryAPI.getAll(),
        articleAPI.getAll(),
        photoAPI.getAll(),
        bookmarkAPI.getAll(),
        eventAPI.getAll(),
        travelAPI.getAll(),
      ]);
      setCategories(categoriesData);
      setArticles(articlesData);
      setPhotos(photosData);
      // 将书签对象转换为数组
      const bookmarksArray = Object.values(bookmarksData).flat();
      setBookmarks(bookmarksArray);
      setEvents(eventsData);
      setTravels(travelsData);
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

  // 导出所有数据（包含图片文件）
  const handleExportAllData = async () => {
    try {
      setLoading(true);
      message.info('开始导出数据，正在收集图片文件...');
      
      // 获取所有数据
      const [categoriesData, articlesData, photosData, bookmarksData, homeData, eventsData, travelsData, annotationsData] = await Promise.all([
        categoryAPI.getAll(),
        articleAPI.getAll(),
        photoAPI.getAll(),
        bookmarkAPI.getAll(),
        homeAPI.get(),
        eventAPI.getAll(),
        travelAPI.getAll(),
        annotationAPI.getAll().catch(() => []), // 如果失败返回空数组
      ]);

      // 创建zip实例
      const zip = new JSZip();
      const imagesFolder = zip.folder('images');
      const photosFolder = imagesFolder.folder('photos');
      const homeFolder = imagesFolder.folder('home');
      const travelsFolder = imagesFolder.folder('travels');

      // 收集所有需要导出的图片路径
      const imageUrls = new Map(); // 用于去重和映射
      
      // 收集相册图片
      if (Array.isArray(photosData)) {
        photosData.forEach((photo, index) => {
          if (photo.url && photo.url.startsWith('/')) {
            const originalUrl = photo.url;
            const filename = originalUrl.split('/').pop();
            const exportPath = `images/photos/${filename}`;
            imageUrls.set(originalUrl, { exportPath, folder: photosFolder });
          }
          if (photo.thumbnailUrl && photo.thumbnailUrl.startsWith('/') && photo.thumbnailUrl !== photo.url) {
            const originalUrl = photo.thumbnailUrl;
            const filename = originalUrl.split('/').pop();
            const exportPath = `images/photos/${filename}`;
            imageUrls.set(originalUrl, { exportPath, folder: photosFolder });
          }
        });
      }

      // 收集首页图片
      if (homeData) {
        if (homeData.avatarImage && homeData.avatarImage.startsWith('/')) {
          const originalUrl = homeData.avatarImage;
          const filename = originalUrl.split('/').pop();
          const exportPath = `images/home/${filename}`;
          imageUrls.set(originalUrl, { exportPath, folder: homeFolder });
        }
        if (homeData.bannerImage && homeData.bannerImage.startsWith('/')) {
          const originalUrl = homeData.bannerImage;
          const filename = originalUrl.split('/').pop();
          const exportPath = `images/home/${filename}`;
          imageUrls.set(originalUrl, { exportPath, folder: homeFolder });
        }
      }

      // 收集旅行日记图片
      if (Array.isArray(travelsData)) {
        travelsData.forEach((travel) => {
          if (travel.images && Array.isArray(travel.images)) {
            travel.images.forEach((imageUrl) => {
              if (imageUrl && imageUrl.startsWith('/')) {
                const originalUrl = imageUrl;
                const filename = originalUrl.split('/').pop();
                const exportPath = `images/travels/${filename}`;
                imageUrls.set(originalUrl, { exportPath, folder: travelsFolder });
              }
            });
          }
        });
      }

      // 下载所有图片文件
      message.info(`正在下载 ${imageUrls.size} 个图片文件...`);
      let downloadedCount = 0;
      for (const [originalUrl, { exportPath, folder }] of imageUrls) {
        try {
          const response = await fetch(originalUrl);
          if (response.ok) {
            const blob = await response.blob();
            const filename = exportPath.split('/').pop();
            folder.file(filename, blob);
            downloadedCount++;
          } else {
            console.warn(`无法下载图片: ${originalUrl}`);
          }
        } catch (error) {
          console.error(`下载图片失败: ${originalUrl}`, error);
        }
      }

      // 构建导出数据对象，替换图片路径为相对路径
      const exportData = {
        version: '2.0.0', // 新版本号，支持图片导出
        exportDate: new Date().toISOString(),
        description: '网站完整数据导出（包含图片文件）',
        data: {
          categories: categoriesData || [],
          articles: articlesData || [],
          photos: Array.isArray(photosData) ? photosData.map(photo => {
            const result = { ...photo };
            if (photo.url && photo.url.startsWith('/')) {
              const filename = photo.url.split('/').pop();
              result.url = `images/photos/${filename}`;
            }
            if (photo.thumbnailUrl && photo.thumbnailUrl.startsWith('/')) {
              const filename = photo.thumbnailUrl.split('/').pop();
              result.thumbnailUrl = `images/photos/${filename}`;
            }
            return result;
          }) : [],
          bookmarks: bookmarksData || {},
          home: homeData ? {
            ...homeData,
            avatarImage: homeData.avatarImage && homeData.avatarImage.startsWith('/')
              ? `images/home/${homeData.avatarImage.split('/').pop()}`
              : homeData.avatarImage,
            bannerImage: homeData.bannerImage && homeData.bannerImage.startsWith('/')
              ? `images/home/${homeData.bannerImage.split('/').pop()}`
              : homeData.bannerImage,
          } : {},
          events: eventsData || [],
          travels: Array.isArray(travelsData) ? travelsData.map(travel => {
            const result = { ...travel };
            if (travel.images && Array.isArray(travel.images)) {
              result.images = travel.images.map(imageUrl => {
                if (imageUrl && imageUrl.startsWith('/')) {
                  const filename = imageUrl.split('/').pop();
                  return `images/travels/${filename}`;
                }
                return imageUrl;
              });
            }
            return result;
          }) : [],
          annotations: Array.isArray(annotationsData) ? annotationsData.map(ann => {
            const result = { ...ann };
            // 保存原始文章ID和标题，用于导入时匹配
            if (ann.article && typeof ann.article === 'object') {
              result.articleTitle = ann.article.title;
              result.articleId = ann.article._id || ann.article;
            } else {
              result.articleId = ann.article;
            }
            return result;
          }) : [],
        },
      };

      // 将JSON数据添加到zip
      const dataStr = JSON.stringify(exportData, null, 2);
      zip.file('data.json', dataStr);

      // 生成zip文件并下载
      message.info('正在打包文件...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `website_backup_${dateStr}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success(`数据导出成功！已下载 ${downloadedCount} 个图片文件`);
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败：' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 导入所有数据（支持zip文件和json文件）
  const handleImportAllData = async (file) => {
    try {
      let importData;
      const imageFileMap = new Map(); // 存储图片文件映射：相对路径 -> File对象

      // 判断文件类型
      if (file.name.endsWith('.zip')) {
        // 处理zip文件
        message.info('正在解析zip文件...');
        const zip = new JSZip();
        const zipData = await zip.loadAsync(file);
        
        // 查找并读取data.json
        let dataJsonFile = null;
        for (const [filename, zipEntry] of Object.entries(zipData.files)) {
          if (filename === 'data.json' || filename.endsWith('/data.json')) {
            dataJsonFile = zipEntry;
            break;
          }
        }
        
        if (!dataJsonFile) {
          message.error('zip文件中未找到data.json文件');
          return false;
        }

        // 读取JSON数据
        const jsonText = await dataJsonFile.async('string');
        importData = JSON.parse(jsonText);

        // 提取所有图片文件
        message.info('正在提取图片文件...');
        // 根据文件扩展名获取MIME类型的辅助函数
        const getMimeTypeFromFilename = (filename) => {
          const ext = filename.toLowerCase().split('.').pop();
          const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
          };
          return mimeTypes[ext] || 'image/jpeg'; // 默认为jpeg
        };
        
        for (const [filename, zipEntry] of Object.entries(zipData.files)) {
          if (!zipEntry.dir && filename.startsWith('images/')) {
            const blob = await zipEntry.async('blob');
            const relativePath = filename; // 例如: images/photos/xxx.jpg 或 images/travels/xxx.jpg
            const fileName = filename.split('/').pop();
            // 如果blob.type为空，根据文件扩展名设置MIME类型
            const mimeType = blob.type || getMimeTypeFromFilename(fileName);
            const file = new File([blob], fileName, { type: mimeType });
            imageFileMap.set(relativePath, file);
          }
        }
      } else {
        // 处理JSON文件（兼容旧版本）
        const text = await file.text();
        importData = JSON.parse(text);
      }

      // 验证数据格式
      if (!importData.data || typeof importData.data !== 'object') {
        message.error('导入文件格式错误：缺少 data 字段');
        return false;
      }

      const { categories, articles, photos, bookmarks, home, events, travels, annotations } = importData.data;

      // 统计数据量
      const stats = {
        categories: Array.isArray(categories) ? categories.length : 0,
        articles: Array.isArray(articles) ? articles.length : 0,
        photos: Array.isArray(photos) ? photos.length : 0,
        bookmarks: bookmarks ? Object.keys(bookmarks).reduce((sum, key) => sum + (bookmarks[key]?.length || 0), 0) : 0,
        home: home ? 1 : 0,
        events: Array.isArray(events) ? events.length : 0,
        travels: Array.isArray(travels) ? travels.length : 0,
        annotations: Array.isArray(annotations) ? annotations.length : 0,
      };

      const totalItems = stats.categories + stats.articles + stats.photos + stats.bookmarks + stats.home + stats.events + stats.travels;

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
              {stats.travels > 0 && <li>旅行日记：{stats.travels} 条</li>}
              {stats.annotations > 0 && <li>文章注释：{stats.annotations} 个</li>}
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
              categories: { success: 0, failed: 0, errors: [] },
              articles: { success: 0, failed: 0, errors: [] },
              photos: { success: 0, failed: 0, errors: [] },
              bookmarks: { success: 0, failed: 0, errors: [] },
              events: { success: 0, failed: 0, errors: [] },
              travels: { success: 0, failed: 0, errors: [] },
              annotations: { success: 0, failed: 0, errors: [] },
              home: { success: 0, failed: 0, errors: [] },
            };

            // 导入分类（移除_id，让系统自动生成新的）
            if (Array.isArray(categories) && categories.length > 0) {
              for (const category of categories) {
                try {
                  // 移除_id和相关字段，让系统自动生成
                  const { _id, __v, createdAt, updatedAt, ...categoryData } = category;
                  await categoryAPI.create(categoryData);
                  results.categories.success++;
                } catch (error) {
                  const errorMsg = error.response?.data?.message || error.message || '未知错误';
                  results.categories.errors.push({ 
                    name: category.name || '未知分类', 
                    error: errorMsg 
                  });
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
                // 收集文章导入的错误
                if (result.errors && Array.isArray(result.errors)) {
                  result.errors.forEach(err => {
                    results.articles.errors.push({
                      name: err.article || '未知文章',
                      error: err.error || '未知错误'
                    });
                  });
                }
              } catch (error) {
                const errorMsg = error.response?.data?.message || error.message || '未知错误';
                results.articles.failed = articles.length;
                results.articles.errors.push({
                  name: '批量导入',
                  error: errorMsg
                });
                console.error('导入文章失败:', error);
              }
            }

            // 导入相册（上传图片并创建记录）
            if (Array.isArray(photos) && photos.length > 0) {
              message.info(`正在导入 ${photos.length} 张照片...`);
              for (const photo of photos) {
                let photoTitle = photo?.title || photo?.url || '未知照片';
                try {
                  const { _id, __v, createdAt, updatedAt, ...photoData } = photo;
                  photoTitle = photoData.title || photo.url || '未知照片';
                  
                  // 检查是否有对应的图片文件
                  if (photo.url && imageFileMap.has(photo.url)) {
                    // 有图片文件，上传并创建记录
                    const imageFile = imageFileMap.get(photo.url);
                    
                    // 验证文件类型
                    if (!imageFile.type || !imageFile.type.startsWith('image/')) {
                      const errorMsg = `文件类型无效: ${imageFile.name || '未知文件'}`;
                      results.photos.errors.push({ name: photoTitle, error: errorMsg });
                      results.photos.failed++;
                      console.error('相册图片文件类型无效:', imageFile);
                      continue;
                    }
                    
                    const formData = new FormData();
                    formData.append('photo', imageFile);
                    formData.append('title', photoData.title || '');
                    formData.append('description', photoData.description || '');
                    if (photoData.tags && Array.isArray(photoData.tags)) {
                      formData.append('tags', photoData.tags.join(','));
                    }
                    
                    try {
                      await photoAPI.upload(formData);
                      results.photos.success++;
                    } catch (uploadError) {
                      // 上传失败，获取详细错误信息
                      const errorMsg = uploadError.response?.data?.message || 
                                       uploadError.response?.statusText || 
                                       uploadError.message || 
                                       '图片上传失败';
                      results.photos.errors.push({ 
                        name: photoTitle, 
                        error: `${errorMsg} (状态码: ${uploadError.response?.status || '未知'})` 
                      });
                      results.photos.failed++;
                      console.error('相册图片上传失败:', photoTitle, uploadError);
                    }
                  } else if (photo.url && !photo.url.startsWith('images/')) {
                    // 旧版本数据，可能是服务器路径，尝试直接创建（可能需要手动处理）
                    // 这种情况下跳过，因为无法获取图片文件
                    const errorMsg = `图片路径不是相对路径，无法找到文件: ${photo.url}`;
                    results.photos.errors.push({ name: photoTitle, error: errorMsg });
                    results.photos.failed++;
                    console.warn('相册图片路径不是相对路径，跳过:', photo.url);
                  } else {
                    const errorMsg = photo.url ? `缺少图片文件: ${photo.url}` : '缺少图片URL';
                    results.photos.errors.push({ name: photoTitle, error: errorMsg });
                    results.photos.failed++;
                    console.error('相册缺少图片文件:', photo);
                  }
                } catch (error) {
                  const errorMsg = error.response?.data?.message || error.message || '未知错误';
                  results.photos.errors.push({ 
                    name: photoTitle, 
                    error: errorMsg 
                  });
                  results.photos.failed++;
                  console.error('导入相册失败:', photo, error);
                }
              }
            }

            // 导入书签（移除_id，让系统自动生成新的）
            if (bookmarks && typeof bookmarks === 'object') {
              for (const [, items] of Object.entries(bookmarks)) {
                if (Array.isArray(items)) {
                  for (const bookmark of items) {
                    try {
                      // 移除_id和相关字段，让系统自动生成
                      const { _id, __v, createdAt, updatedAt, ...bookmarkData } = bookmark;
                      await bookmarkAPI.create(bookmarkData);
                      results.bookmarks.success++;
                    } catch (error) {
                      const errorMsg = error.response?.data?.message || error.message || '未知错误';
                      results.bookmarks.errors.push({
                        name: bookmark.title || bookmark.url || '未知书签',
                        error: errorMsg
                      });
                      results.bookmarks.failed++;
                      console.error('导入书签失败:', bookmark, error);
                    }
                  }
                }
              }
            }

            // 导入时间事件（移除_id，让系统自动生成新的）
            if (Array.isArray(events) && events.length > 0) {
              for (const event of events) {
                try {
                  // 移除_id和相关字段，让系统自动生成
                  const { _id, __v, createdAt, updatedAt, ...eventData } = event;
                  await eventAPI.create(eventData);
                  results.events.success++;
                } catch (error) {
                  const errorMsg = error.response?.data?.message || error.message || '未知错误';
                  results.events.errors.push({
                    name: event.title || event.date || '未知事件',
                    error: errorMsg
                  });
                  results.events.failed++;
                  console.error('导入时间事件失败:', event, error);
                }
              }
            }

            // 导入旅行日记（上传图片并创建记录）
            if (Array.isArray(travels) && travels.length > 0) {
              message.info(`正在导入 ${travels.length} 条旅行日记...`);
              for (const travel of travels) {
                let travelTitle = travel?.title || '未知旅行日记';
                try {
                  const { _id, __v, createdAt, updatedAt, ...travelData } = travel;
                  travelTitle = travelData.title || '未知旅行日记';
                  
                  // 准备表单数据
                  const formData = new FormData();
                  formData.append('title', travelData.title || '');
                  formData.append('location', travelData.location || '');
                  formData.append('rating', travelData.rating || 5);
                  formData.append('date', travelData.date ? new Date(travelData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                  formData.append('weather', travelData.weather || '');
                  formData.append('transport', travelData.transport || '');
                  formData.append('description', travelData.description || '');

                  // 检查是否有对应的图片文件
                  if (travelData.images && Array.isArray(travelData.images)) {
                    let imageCount = 0;
                    for (const imagePath of travelData.images) {
                      if (imagePath && imageFileMap.has(imagePath)) {
                        const imageFile = imageFileMap.get(imagePath);
                        
                        // 验证文件类型
                        if (!imageFile.type || !imageFile.type.startsWith('image/')) {
                          continue;
                        }
                        
                        formData.append('images', imageFile);
                        imageCount++;
                      }
                    }
                    
                    if (imageCount === 0 && travelData.images.length > 0) {
                      const errorMsg = `缺少图片文件`;
                      results.travels.errors.push({ name: travelTitle, error: errorMsg });
                      results.travels.failed++;
                      console.warn('旅行日记缺少图片文件:', travelTitle);
                      continue;
                    }
                  }
                  
                  try {
                    await travelAPI.create(formData);
                    results.travels.success++;
                  } catch (uploadError) {
                    const errorMsg = uploadError.response?.data?.message || 
                                     uploadError.response?.statusText || 
                                     uploadError.message || 
                                     '旅行日记创建失败';
                    results.travels.errors.push({ 
                      name: travelTitle, 
                      error: `${errorMsg} (状态码: ${uploadError.response?.status || '未知'})` 
                    });
                    results.travels.failed++;
                    console.error('旅行日记创建失败:', travelTitle, uploadError);
                  }
                } catch (error) {
                  const errorMsg = error.response?.data?.message || error.message || '未知错误';
                  results.travels.errors.push({ 
                    name: travelTitle, 
                    error: errorMsg 
                  });
                  results.travels.failed++;
                  console.error('导入旅行日记失败:', travel, error);
                }
              }
            }

            // 导入注释（需要在文章导入之后，因为注释需要关联文章）
            if (Array.isArray(annotations) && annotations.length > 0) {
              message.info(`正在导入 ${annotations.length} 个注释...`);
              // 获取所有已导入的文章，用于匹配
              const allArticles = await articleAPI.getAll();
              const articleTitleMap = new Map(); // 文章标题 -> 新文章ID
              allArticles.forEach(article => {
                articleTitleMap.set(article.title, article._id);
              });

              for (const annotation of annotations) {
                let annotationTitle = annotation?.selectedText || '未知注释';
                try {
                  const { _id, __v, createdAt, updatedAt, articleTitle, articleId, ...annotationData } = annotation;
                  annotationTitle = annotationData.selectedText || '未知注释';
                  
                  // 根据文章标题找到新导入的文章ID
                  let newArticleId = null;
                  if (articleTitle && articleTitleMap.has(articleTitle)) {
                    newArticleId = articleTitleMap.get(articleTitle);
                  } else if (articleId) {
                    // 如果标题匹配失败，尝试通过旧ID查找（如果文章导入时保留了映射关系）
                    // 这里简化处理，如果找不到就跳过
                    const foundArticle = allArticles.find(a => a.title === (annotation.articleTitle || ''));
                    if (foundArticle) {
                      newArticleId = foundArticle._id;
                    }
                  }

                  if (!newArticleId) {
                    const errorMsg = `找不到对应的文章: ${articleTitle || articleId || '未知'}`;
                    results.annotations.errors.push({ name: annotationTitle, error: errorMsg });
                    results.annotations.failed++;
                    console.warn('注释找不到对应文章:', annotation);
                    continue;
                  }

                  // 创建注释
                  await annotationAPI.create({
                    ...annotationData,
                    article: newArticleId,
                  });
                  results.annotations.success++;
                } catch (error) {
                  const errorMsg = error.response?.data?.message || error.message || '未知错误';
                  results.annotations.errors.push({ 
                    name: annotationTitle, 
                    error: errorMsg 
                  });
                  results.annotations.failed++;
                  console.error('导入注释失败:', annotation, error);
                }
              }
            }

            // 导入首页配置（一次性上传所有数据：图片+文字数据）
            if (home) {
              try {
                const formData = new FormData();
                
                // 添加所有文字数据字段
                formData.append('name', home.name !== undefined && home.name !== null ? home.name : '');
                formData.append('subtitle', home.subtitle !== undefined && home.subtitle !== null ? home.subtitle : '');
                formData.append('introduction', home.introduction !== undefined && home.introduction !== null ? home.introduction : '');
                formData.append('socialLinks', JSON.stringify(home.socialLinks !== undefined && home.socialLinks !== null ? home.socialLinks : []));
                formData.append('education', JSON.stringify(home.education !== undefined && home.education !== null ? home.education : []));
                formData.append('work', JSON.stringify(home.work !== undefined && home.work !== null ? home.work : []));
                formData.append('stats', JSON.stringify(home.stats !== undefined && home.stats !== null ? home.stats : {}));
                formData.append('siteInfo', JSON.stringify(home.siteInfo !== undefined && home.siteInfo !== null ? home.siteInfo : {}));
                
                // 检查并添加图片文件（如果存在）
                if (home.avatarImage && imageFileMap.has(home.avatarImage)) {
                  const avatarFile = imageFileMap.get(home.avatarImage);
                  formData.append('avatarImage', avatarFile);
                }
                
                if (home.bannerImage && imageFileMap.has(home.bannerImage)) {
                  const bannerFile = imageFileMap.get(home.bannerImage);
                  formData.append('bannerImage', bannerFile);
                }
                
                // 一次性上传所有数据（图片+文字数据）
                await homeAPI.update(formData);
                results.home.success = 1;
              } catch (error) {
                const errorMsg = error.response?.data?.message || error.message || '未知错误';
                results.home.errors.push({ name: '首页配置', error: errorMsg });
                results.home.failed = 1;
                console.error('导入首页配置失败:', error);
              }
            }

            // 显示导入结果
            const successTotal = Object.values(results).reduce((sum, r) => sum + r.success, 0);
            const failedTotal = Object.values(results).reduce((sum, r) => sum + r.failed, 0);
            
            // 收集所有错误信息
            const allErrors = [];
            Object.entries(results).forEach(([key, value]) => {
              if (value.errors && value.errors.length > 0) {
                const typeNames = {
                  categories: '分类',
                  articles: '文章',
                  photos: '相册',
                  bookmarks: '书签',
                  events: '时间事件',
                  travels: '旅行日记',
                  annotations: '文章注释',
                  home: '首页配置'
                };
                value.errors.forEach(err => {
                  allErrors.push({ type: typeNames[key] || key, ...err });
                });
              }
            });

            if (failedTotal > 0) {
              // 显示详细错误信息
              Modal.error({
                title: `导入完成：成功 ${successTotal} 项，失败 ${failedTotal} 项`,
                width: 700,
                content: (
                  <div className="max-h-96 overflow-y-auto">
                    <div className="text-sm text-text-200 mb-4">
                      <p className="mb-2">以下项目导入失败：</p>
                      <div className="space-y-2">
                        {allErrors.map((err, index) => (
                          <div key={index} className="p-2 bg-red-50 border border-red-200 rounded">
                            <div className="font-semibold text-red-800">{err.type} - {err.name}</div>
                            <div className="text-red-600 text-xs mt-1">{err.error}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ),
                okText: '我知道了',
              });
            } else {
              message.success(`导入完成：成功 ${successTotal} 项`);
            }

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

  // 旅行日记相关函数
  const handleTravelSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('location', values.location || '');
      formData.append('rating', values.rating || 5);
      formData.append('date', values.date);
      formData.append('weather', values.weather || '');
      formData.append('transport', values.transport || '');
      formData.append('description', values.description || '');

      // 处理图片
      if (editingTravel) {
        // 编辑模式：保留现有图片
        formData.append('existingImages', JSON.stringify(travelImages));
      }

      // 添加新上传的图片
      travelImageFileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append('images', file.originFileObj);
        }
      });

      if (editingTravel) {
        await travelAPI.update(editingTravel._id, formData);
        message.success('旅行日记更新成功');
      } else {
        await travelAPI.create(formData);
        message.success('旅行日记创建成功');
      }
      setTravelModalOpen(false);
      setEditingTravel(null);
      setTravelImages([]);
      setTravelImageFileList([]);
      travelForm.resetFields();
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleTravelEdit = (record) => {
    setEditingTravel(record);
    setTravelImages(record.images || []);
    setTravelImageFileList([]);
    travelForm.setFieldsValue({
      title: record.title,
      location: record.location || '',
      rating: record.rating || 5,
      date: record.date ? new Date(record.date).toISOString().split('T')[0] : '',
      weather: record.weather || '',
      transport: record.transport || '',
      description: record.description || '',
    });
    setTravelModalOpen(true);
  };

  const handleTravelDelete = async (id) => {
    try {
      await travelAPI.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleBatchTravelDelete = async () => {
    if (selectedTravelIds.length === 0) {
      message.warning('请先选择要删除的旅行日记');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedTravelIds.length} 条旅行日记吗？此操作不可恢复。`,
      onOk: async () => {
        try {
          await travelAPI.batchDelete(selectedTravelIds);
          message.success(`成功删除 ${selectedTravelIds.length} 条旅行日记`);
          setSelectedTravelIds([]);
          loadData();
        } catch (error) {
          message.error(error.response?.data?.message || '批量删除失败');
        }
      },
    });
  };

  const handleTravelImageRemove = (file) => {
    if (file.url) {
      // 移除现有图片
      setTravelImages(travelImages.filter(img => img !== file.url));
    }
    return true;
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
      key: 'travels',
      label: '旅行日记管理',
      children: (
        <Card>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-black">旅行日记列表</h2>
            <Space>
              {selectedTravelIds.length > 0 && (
                <Button 
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleBatchTravelDelete}
                >
                  批量删除 ({selectedTravelIds.length})
                </Button>
              )}
              <Button 
                className="bg-gray-800 text-white hover:bg-gray-700 border-none"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingTravel(null);
                  setTravelImages([]);
                  setTravelImageFileList([]);
                  travelForm.resetFields();
                  setTravelModalOpen(true);
                }}
              >
                新增旅行日记
              </Button>
            </Space>
          </div>
          <Table
            columns={[
              {
                title: '标题',
                dataIndex: 'title',
                key: 'title',
              },
              {
                title: '位置',
                dataIndex: 'location',
                key: 'location',
                render: (location) => location || '-',
              },
              {
                title: '日期',
                dataIndex: 'date',
                key: 'date',
                render: (date) => date ? new Date(date).toLocaleDateString('zh-CN') : '-',
                sorter: (a, b) => new Date(a.date) - new Date(b.date),
              },
              {
                title: '评分',
                dataIndex: 'rating',
                key: 'rating',
                render: (rating) => '★'.repeat(rating || 0),
              },
              {
                title: '图片数',
                dataIndex: 'images',
                key: 'images',
                render: (images) => images?.length || 0,
              },
              {
                title: '操作',
                key: 'action',
                render: (_, record) => (
                  <Space>
                    <Button 
                      type="link" 
                      icon={<EditOutlined />}
                      onClick={() => handleTravelEdit(record)}
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="确定要删除这条旅行日记吗？"
                      onConfirm={() => handleTravelDelete(record._id)}
                    >
                      <Button type="link" danger icon={<DeleteOutlined />}>
                        删除
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
            dataSource={travels}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            rowSelection={{
              selectedRowKeys: selectedTravelIds,
              onChange: (selectedRowKeys) => {
                setSelectedTravelIds(selectedRowKeys);
              },
            }}
          />
        </Card>
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
              您可以导出所有网站数据（包含图片文件）为 ZIP 压缩包，也可以从 ZIP 或 JSON 文件导入数据。新版本导出包含图片文件，旧版本 JSON 文件仍可兼容导入。
            </p>
            
            <Space direction="vertical" size="large" className="w-full">
              <div className="p-4 border border-bg-300 rounded-lg">
                <h3 className="text-base font-semibold text-text-100 mb-2">导出数据</h3>
                <p className="text-sm text-text-200 mb-4">
                  导出所有数据为 ZIP 压缩包，包含：分类、文章、文章注释、相册（含图片）、书签、时间事件、旅行日记（含图片）、首页配置（含头像和Banner图片）。压缩包内包含 data.json 数据文件和 images 图片文件夹。
                </p>
                <Button
                  className="bg-gray-800 text-white hover:bg-gray-700 border-none"
                  icon={<ExportOutlined />}
                  onClick={handleExportAllData}
                  loading={loading}
                >
                  导出所有数据（ZIP）
                </Button>
              </div>

              <div className="p-4 border border-bg-300 rounded-lg">
                <h3 className="text-base font-semibold text-text-100 mb-2">导入数据</h3>
                <p className="text-sm text-text-200 mb-4">
                  支持导入 ZIP 压缩包（新版本，包含图片）或 JSON 文件（旧版本，仅数据）。注意：导入会覆盖现有数据，请谨慎操作！
                </p>
                <Upload
                  accept=".zip,.json"
                  beforeUpload={handleImportAllData}
                  showUploadList={false}
                >
                  <Button
                    className="bg-gray-800 text-white hover:bg-gray-700 border-none"
                    icon={<ImportOutlined />}
                    loading={loading}
                  >
                    选择文件导入（ZIP/JSON）
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

        {/* 旅行日记编辑弹窗 */}
        <Modal
          title={editingTravel ? '编辑旅行日记' : '新增旅行日记'}
          open={travelModalOpen}
          onCancel={() => {
            setTravelModalOpen(false);
            setEditingTravel(null);
            setTravelImages([]);
            setTravelImageFileList([]);
            travelForm.resetFields();
          }}
          footer={null}
          width={800}
        >
          <Form
            form={travelForm}
            layout="vertical"
            onFinish={handleTravelSubmit}
            className="mt-4"
          >
            <Form.Item
              name="title"
              label="标题"
              rules={[{ required: true, message: '请输入标题' }]}
            >
              <Input placeholder="请输入旅行日记标题" />
            </Form.Item>
            <Form.Item
              name="location"
              label="位置"
            >
              <LocationPicker placeholder="请选择或输入位置（可选）" />
            </Form.Item>
            <Form.Item
              name="rating"
              label="评分"
              initialValue={5}
            >
              <InputNumber min={1} max={5} placeholder="1-5星" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="date"
              label="日期"
              rules={[{ required: true, message: '请选择日期' }]}
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item
              name="weather"
              label="天气"
            >
              <Input placeholder="例如：晴天、多云等（可选）" />
            </Form.Item>
            <Form.Item
              name="transport"
              label="交通工具"
            >
              <Input placeholder="例如：飞机、火车、自驾等（可选）" />
            </Form.Item>
            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea rows={6} placeholder="请输入旅行日记描述（可选）" />
            </Form.Item>
            <Form.Item
              label="图片"
            >
              {/* 显示现有图片 */}
              {travelImages.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-text-200 mb-2">现有图片：</div>
                  <div className="grid grid-cols-4 gap-2">
                    {travelImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`现有图片 ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setTravelImages(travelImages.filter((_, i) => i !== index));
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Upload
                listType="picture-card"
                fileList={travelImageFileList}
                beforeUpload={() => false}
                onChange={({ fileList }) => {
                  setTravelImageFileList(fileList);
                }}
                onRemove={handleTravelImageRemove}
                multiple
              >
                {travelImageFileList.length < 20 && <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>}
              </Upload>
              <div className="text-xs text-text-200 mt-2">
                最多可上传20张图片，支持 jpeg, jpg, png, gif, webp 格式
              </div>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button 
                  className="bg-gray-800 text-white hover:bg-gray-700 border-none"
                  htmlType="submit"
                >
                  {editingTravel ? '更新' : '创建'}
                </Button>
                <Button onClick={() => {
                  setTravelModalOpen(false);
                  setEditingTravel(null);
                  setTravelImages([]);
                  setTravelImageFileList([]);
                  travelForm.resetFields();
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

