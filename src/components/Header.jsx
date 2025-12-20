// components/Header.jsx
import { useState, useEffect } from 'react';
import { Input, Button, message, Avatar, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined, MenuOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI, homeAPI } from '../utils/api';
import { getToken, setToken, removeToken } from '../utils/auth';
import { useSidebar } from '../context/SidebarContext';

const Header = () => {
  const [user, setUser] = useState(null);
  const [homeData, setHomeData] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toggle } = useSidebar();

  useEffect(() => {
    // 检查是否已登录
    const token = getToken();
    if (token) {
      authAPI.getCurrentUser()
        .then((res) => {
          setUser(res.user);
        })
        .catch(() => {
          removeToken();
        });
    }
    // 加载首页数据
    homeAPI.get()
      .then((data) => {
        setHomeData(data);
      })
      .catch(() => {
        // 静默失败
      });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(loginForm.username, loginForm.password);
      setToken(res.token);
      setUser(res.user);
      setLoginForm({ username: '', password: '' });
      setDropdownOpen(false);
      message.success('登录成功');
    } catch (error) {
      message.error(error.response?.data?.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    setUser(null);
    setDropdownOpen(false);
    message.success('已退出登录');
    if (location.pathname.startsWith('/admin')) {
      navigate('/');
    }
  };

  // 登录表单下拉菜单内容
  const loginMenuItems = {
    items: [
      {
        key: 'login-form',
        label: (
          <div className="p-4 w-80">
            <div className="mb-3 text-sm font-semibold text-text-100">管理员登录</div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input 
                  placeholder="用户名" 
                  size="large"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  prefix={<UserOutlined />}
                />
              </div>
              <div>
                <Input.Password 
                  placeholder="密码" 
                  size="large"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </div>
              <Button 
                className="bg-primary-300 text-white hover:bg-accent-200 border-none w-full"
                htmlType="submit" 
                size="large"
                loading={loading}
              >
                登录
              </Button>
            </form>
          </div>
        ),
      },
    ],
  };

  // 已登录用户下拉菜单内容
  const userMenuItems = {
    items: [
      {
        key: 'admin',
        label: (
          <div 
            className="px-4 py-2 cursor-pointer hover:bg-bg-200 transition-colors"
            onClick={() => {
              navigate('/admin');
              setDropdownOpen(false);
            }}
          >
            管理后台
          </div>
        ),
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        label: (
          <div 
            className="px-4 py-2 cursor-pointer hover:bg-bg-200 transition-colors text-red-600"
            onClick={handleLogout}
          >
            <LogoutOutlined className="mr-2" />
            退出登录
          </div>
        ),
      },
    ],
  };

  return (
    <>
      {/* 顶部导航栏 */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-bg-300 z-50 flex justify-between items-center px-4 md:px-8 shadow-sm" style={{ height: '64px', backgroundColor: '#f5f5f5' }}>
        {/* 左侧菜单按钮（移动端） */}
        <div className="flex items-center">
          <button
            onClick={toggle}
            className="md:hidden p-2 hover:bg-bg-200 rounded transition-colors"
            aria-label="切换侧边栏"
          >
            <MenuOutlined className="text-xl text-text-100" />
          </button>
        </div>

        {/* 右侧导航链接 */}
        <div className="flex items-center gap-4 md:gap-10">
          {user && (
            <button
              onClick={() => navigate('/admin')}
              className={`text-sm font-medium transition-all duration-200 relative hidden md:block ${
                location.pathname.startsWith('/admin')
                  ? 'text-text-100'
                  : 'text-text-200 hover:text-text-100'
              }`}
            >
              {location.pathname.startsWith('/admin') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary-300"></span>
              )}
              管理后台
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className={`text-sm font-medium transition-all duration-200 relative hidden md:block ${
              location.pathname === '/' || location.pathname.startsWith('/article')
                ? 'text-text-100'
                : 'text-text-200 hover:text-text-100'
            }`}
          >
            {(location.pathname === '/' || location.pathname.startsWith('/article')) && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary-300"></span>
            )}
            首页
          </button>
          <Dropdown
            menu={user ? userMenuItems : loginMenuItems}
            trigger={['click']}
            open={dropdownOpen}
            onOpenChange={setDropdownOpen}
            placement="bottomRight"
            overlayClassName="header-dropdown"
            overlayStyle={{ minWidth: '200px' }}
          >
            <div className="ml-2 cursor-pointer">
              <Avatar 
                src={homeData?.avatarImage ? `http://localhost:3001${homeData.avatarImage}` : undefined} 
                icon={<UserOutlined />}
                className="hover:ring-2 ring-primary-200 transition-all"
              />
            </div>
          </Dropdown>
        </div>
      </header>
    </>
  );
};

export default Header;

