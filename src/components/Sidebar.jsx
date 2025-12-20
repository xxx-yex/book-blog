// components/Sidebar.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Input, Button, message, Avatar, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined, CloseOutlined } from '@ant-design/icons';
import { 
  BookOutlined, 
  CameraOutlined, 
  SendOutlined, 
  FolderOutlined, 
  ClockCircleOutlined, 
  FolderOpenOutlined,
  PictureOutlined
} from '@ant-design/icons';
import { authAPI, homeAPI, articleAPI, photoAPI, bookmarkAPI, eventAPI } from '../utils/api';
import { getToken, setToken, removeToken } from '../utils/auth';
import { useSidebar } from '../context/SidebarContext';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [homeData, setHomeData] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [counts, setCounts] = useState({
    articles: 0,
    photos: 0,
    bookmarks: 0,
    events: 0,
  });
  const { isOpen, close } = useSidebar();

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
    
    // 加载各模块的数量
    Promise.all([
      articleAPI.getAll().then(data => data.length).catch(() => 0),
      photoAPI.getAll().then(data => data.length).catch(() => 0),
      bookmarkAPI.getAll().then(data => {
        const bookmarksArray = Object.values(data).flat();
        return bookmarksArray.length;
      }).catch(() => 0),
      eventAPI.getAll().then(data => data.length).catch(() => 0),
    ]).then(([articlesCount, photosCount, bookmarksCount, eventsCount]) => {
      setCounts({
        articles: articlesCount,
        photos: photosCount,
        bookmarks: bookmarksCount,
        events: eventsCount,
      });
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
          <div 
            className="p-4 w-80"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-3 text-sm font-semibold text-text-100">管理员登录</div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input 
                  placeholder="用户名" 
                  size="large"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  prefix={<UserOutlined />}
                />
              </div>
              <div>
                <Input.Password 
                  placeholder="密码" 
                  size="large"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              </div>
              <Button 
                className="bg-primary-300 text-white hover:bg-accent-200 border-none w-full"
                htmlType="submit" 
                size="large"
                loading={loading}
                onClick={(e) => e.stopPropagation()}
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
        key: 'home',
        label: (
          <div 
            className="px-4 py-2 cursor-pointer hover:bg-bg-200 transition-colors"
            onClick={() => {
              navigate('/');
              setDropdownOpen(false);
            }}
          >
            首页
          </div>
        ),
      },
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

  // 导航菜单配置
  const menuItems = [
    { id: 'articles', path: '/articles', label: '技术文章', icon: BookOutlined, count: counts.articles },
    { id: 'album', path: '/album', label: '生活相册', icon: CameraOutlined, count: counts.photos },
    { id: 'travel', path: '/travel', label: '旅行日记', icon: SendOutlined, count: 0 },
    { id: 'nav', path: '/nav', label: '导航栏', icon: FolderOutlined, count: counts.bookmarks },
    { id: 'notes', path: '/notes', label: '时间事件', icon: ClockCircleOutlined, count: counts.events },
  ];

  // 判断当前路径是否匹配菜单项
  const isActive = (item) => {
    if (item.path === '/articles') {
      return location.pathname === '/articles' || location.pathname.startsWith('/article/');
    }
    return location.pathname.startsWith(item.path);
  };

  const handleMenuClick = (item) => {
    navigate(item.path);
    // 移动端点击菜单后关闭侧边栏
    if (window.innerWidth < 768) {
      close();
    }
  };

  // 如果是在后台管理页面，显示标签页导航
  if (location.pathname.startsWith('/admin')) {
    const adminTabs = [
      { key: 'categories', label: '分类管理' },
      { key: 'articles', label: '文章管理' },
      { key: 'photos', label: '相册管理' },
      { key: 'images', label: '图像管理', icon: PictureOutlined },
      { key: 'bookmarks', label: '导航管理' },
      { key: 'events', label: '时间事件管理' },
      { key: 'data', label: '数据管理' },
      { key: 'password', label: '修改密码' },
    ];

    // 从 URL 参数或 localStorage 获取当前选中的标签（排除首页编辑页面和修改密码页面）
    const activeTab = location.pathname === '/admin/home' || location.pathname === '/admin/password'
      ? null 
      : (searchParams.get('tab') || localStorage.getItem('adminActiveTab') || 'categories');

    const handleTabClick = (tabKey) => {
      if (tabKey === 'password') {
        navigate('/admin/password');
      } else {
        localStorage.setItem('adminActiveTab', tabKey);
        navigate(`/admin?tab=${tabKey}`);
      }
    };

    return (
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 border-r border-bg-300 bg-bg-100 h-full flex flex-col overflow-hidden
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header 部分 */}
        <div className="border-b border-bg-300 px-4 md:px-6 py-4 flex-shrink-0" style={{ backgroundColor: '#f5f5f5' }}>
          <div className="flex items-center gap-4">
            {/* 移动端关闭按钮 */}
            <button
              onClick={close}
              className="md:hidden p-1 hover:bg-bg-200 rounded transition-colors"
              aria-label="关闭侧边栏"
            >
              <CloseOutlined className="text-lg text-text-100" />
            </button>
            <Dropdown
              menu={user ? userMenuItems : loginMenuItems}
              trigger={['click']}
              open={dropdownOpen}
              onOpenChange={setDropdownOpen}
              placement="bottomLeft"
              overlayClassName="header-dropdown"
              overlayStyle={{ minWidth: '200px' }}
            >
              <div className="cursor-pointer">
                <Avatar 
                  src={homeData?.avatarImage ? `http://localhost:3001${homeData.avatarImage}` : undefined} 
                  icon={<UserOutlined />}
                  className="hover:ring-2 ring-primary-200 transition-all"
                />
              </div>
            </Dropdown>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-text-100 truncate">{homeData?.name}</div>
              <div className="text-xs text-text-200 truncate">{homeData?.subtitle}</div>
            </div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            <button
              onClick={() => navigate('/admin/home')}
              className={`w-full px-3 py-2 rounded cursor-pointer transition-colors text-left ${
                location.pathname === '/admin/home'
                  ? 'text-text-100'
                  : 'bg-white text-text-100 hover:bg-bg-200'
              }`}
              style={location.pathname === '/admin/home' ? { backgroundColor: '#cccccc' } : {}}
            >
              <span className="text-sm font-medium">首页编辑</span>
            </button>
            {adminTabs.map((tab) => {
              const isActive = (tab.key === 'password' && location.pathname === '/admin/password') ||
                               (activeTab === tab.key && location.pathname !== '/admin/home' && location.pathname !== '/admin/password');
              const Icon = tab.icon;
              return (
                <div
                  key={tab.key}
                  className={`px-3 py-2 rounded cursor-pointer transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'text-text-100'
                      : 'bg-white text-text-100 hover:bg-bg-200'
                  }`}
                  style={isActive ? { backgroundColor: '#cccccc' } : {}}
                  onClick={() => handleTabClick(tab.key)}
                >
                  {Icon && <Icon className="text-sm" />}
                  <span className="text-sm font-medium">{tab.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    );
  }

    return (
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 border-r border-bg-300 bg-bg-100 h-full flex flex-col overflow-hidden
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header 部分 */}
        <div className="border-b border-bg-300 px-4 md:px-6 py-4 flex-shrink-0" style={{ backgroundColor: '#f5f5f5' }}>
          <div className="flex items-center gap-4">
            {/* 移动端关闭按钮 */}
            <button
              onClick={close}
              className="md:hidden p-1 hover:bg-bg-200 rounded transition-colors"
              aria-label="关闭侧边栏"
            >
              <CloseOutlined className="text-lg text-text-100" />
            </button>
            <Dropdown
              menu={user ? userMenuItems : loginMenuItems}
              trigger={['click']}
              open={dropdownOpen}
              onOpenChange={setDropdownOpen}
              placement="bottomLeft"
              overlayClassName="header-dropdown"
              overlayStyle={{ minWidth: '200px' }}
            >
              <div className="cursor-pointer">
                <Avatar 
                  src={homeData?.avatarImage ? `http://localhost:3001${homeData.avatarImage}` : undefined} 
                  icon={<UserOutlined />}
                  className="hover:ring-2 ring-primary-200 transition-all"
                />
              </div>
            </Dropdown>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-text-100 truncate">{homeData?.name}</div>
              <div className="text-xs text-text-200 truncate">{homeData?.subtitle}</div>
            </div>
          </div>
        </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto p-4 md:p-6 space-y-1">
        <div
          className={`group cursor-pointer rounded-lg px-4 py-3 transition-all duration-200 flex items-center justify-between ${
            location.pathname === '/'
              ? 'text-text-100'
              : 'bg-white text-text-100 hover:bg-bg-200'
          }`}
          style={location.pathname === '/' ? { backgroundColor: '#cccccc' } : {}}
          onClick={() => navigate('/')}
        >
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${location.pathname === '/' ? 'text-text-100' : 'text-text-100'}`}>
              首页
            </span>
          </div>
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <div
              key={item.id}
              className={`group cursor-pointer rounded-lg px-4 py-3 transition-all duration-200 flex items-center justify-between ${
                active 
                  ? 'text-text-100' 
                  : 'bg-white text-text-100 hover:bg-bg-200'
              }`}
              style={active ? { backgroundColor: '#cccccc' } : {}}
              onClick={() => handleMenuClick(item)}
            >
              <div className="flex items-center gap-3">
                <Icon className={`text-lg ${active ? 'text-text-100' : 'text-text-100'}`} />
                <span className={`text-sm font-medium ${active ? 'text-text-100' : 'text-text-100'}`}>
                  {item.label}
                </span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${
                active 
                  ? 'bg-white/20 text-text-100' 
                  : 'bg-bg-200 text-text-200'
              }`}>
                {item.count || 0}
              </span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;

