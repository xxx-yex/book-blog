// components/Layout.jsx
import { useSidebar } from '../context/SidebarContext';
import Sidebar from './Sidebar';
import { MenuOutlined } from '@ant-design/icons';

const MainLayout = ({ children }) => {
  const { isOpen, close, open } = useSidebar();

  return (
    <div className="h-screen bg-bg-100 overflow-hidden">
      {/* 移动端菜单按钮 */}
      {!isOpen && (
        <button
          onClick={open}
          className="fixed top-4 left-4 z-50 md:hidden p-2 bg-white rounded shadow-lg hover:bg-bg-200 transition-colors"
          aria-label="打开侧边栏"
        >
          <MenuOutlined className="text-xl text-text-100" />
        </button>
      )}
      {/* 主要内容区域：侧边栏 + 主内容 */}
      <div className="flex overflow-hidden h-full">
        {/* 移动端遮罩层 */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={close}
          />
        )}
        <Sidebar />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;