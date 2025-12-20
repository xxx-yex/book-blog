import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Card } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { authAPI } from '../../utils/api';
import { isAuthenticated } from '../../utils/auth';

const PasswordChange = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    if (!isAuthenticated()) {
      message.warning('请先登录');
      navigate('/');
      return;
    }

    const { oldPassword, newPassword, confirmPassword } = values;

    if (newPassword !== confirmPassword) {
      message.error('两次输入的新密码不一致');
      return;
    }

    if (newPassword.length < 6) {
      message.error('新密码长度至少为6位');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword(oldPassword, newPassword);
      message.success('密码修改成功');
      form.resetFields();
    } catch (error) {
      message.error(error.response?.data?.message || '密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full">
      <div className="p-4 md:p-8 bg-white">
        <Card>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-text-100 mb-6 flex items-center gap-2">
              <LockOutlined />
              修改密码
            </h2>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              className="mt-4"
            >
              <Form.Item
                name="oldPassword"
                label="当前密码"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password
                  placeholder="请输入当前密码"
                  size="large"
                  prefix={<LockOutlined />}
                />
              </Form.Item>
              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码长度至少为6位' }
                ]}
              >
                <Input.Password
                  placeholder="请输入新密码（至少6位）"
                  size="large"
                  prefix={<LockOutlined />}
                />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的新密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  placeholder="请再次输入新密码"
                  size="large"
                  prefix={<LockOutlined />}
                />
              </Form.Item>
              <Form.Item>
                <Button
                  className="bg-gray-800 text-white hover:bg-gray-700 border-none"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  block
                >
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PasswordChange;

