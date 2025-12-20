// pages/Admin/ArticleEdit.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Input, Button, Select, Form, message, Card, Space, Row, Col } from 'antd';
import { articleAPI, categoryAPI } from '../../utils/api';
import { isAuthenticated } from '../../utils/auth';

const ArticleEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/');
      message.warning('请先登录');
      return;
    }
    loadCategories();
    if (isEdit) {
      loadArticle();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const data = await categoryAPI.getAll();
      setCategories(data);
    } catch (error) {
      message.error('加载分类失败');
    }
  };

  const loadArticle = async () => {
    setLoading(true);
    try {
      const data = await articleAPI.getById(id);
      form.setFieldsValue({
        title: data.title,
        category: data.category?._id,
        tags: data.tags?.join(','),
      });
      setContent(data.content || '');
    } catch (error) {
      message.error('加载文章失败');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };


  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image', 'code-block'],
      ['clean']
    ],
  };

  const handleSave = async (values) => {
    if (!content.trim()) {
      message.warning('请输入文章内容');
      return;
    }

    setSaving(true);
    try {
      const articleData = {
        title: values.title,
        content: content,
        category: values.category,
        tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };

      if (isEdit) {
        await articleAPI.update(id, articleData);
        message.success('文章更新成功');
      } else {
        await articleAPI.create(articleData);
        message.success('文章创建成功');
      }
      navigate('/admin');
    } catch (error) {
      message.error(error.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full h-full">
      <div className="p-4 md:p-8 bg-white h-full overflow-y-auto">
        <Card>
          <h2 className="text-xl font-semibold mb-6 text-black">
            {isEdit ? '编辑文章' : '新建文章'}
          </h2>
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            loading={loading}
          >
            <Form.Item
              name="title"
              label="文章标题"
              rules={[{ required: true, message: '请输入文章标题' }]}
            >
              <Input placeholder="输入文章标题" size="large" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="category"
                  label="选择分类"
                  rules={[{ required: true, message: '请选择分类' }]}
                >
                  <Select
                    placeholder="选择分类"
                    size="large"
                    options={categories.map(cat => ({
                      value: cat._id,
                      label: cat.name,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="tags"
                  label="标签（用逗号分隔）"
                >
                  <Input placeholder="例如：JavaScript, React, 前端" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="文章内容"
              required
            >
              <div className="h-96 mb-4">
                <ReactQuill 
                  theme="snow" 
                  value={content} 
                  onChange={setContent} 
                  modules={modules}
                  style={{ height: '300px' }}
                />
              </div>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button 
                  className="bg-gray-800 text-white hover:bg-gray-700 border-none"
                  htmlType="submit" 
                  size="large" 
                  loading={saving}
                >
                  {isEdit ? '更新文章' : '发布文章'}
                </Button>
                <Button size="large" onClick={() => navigate('/admin')}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default ArticleEdit;

