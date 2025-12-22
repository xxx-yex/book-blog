import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import Admin from './pages/Admin/Admin';
import ArticleEdit from './pages/Admin/ArticleEdit';
import TravelManage from './pages/Admin/TravelManage';
import HomeEdit from './pages/Admin/HomeEdit';
import PasswordChange from './pages/Admin/PasswordChange';
import Articles from './pages/Articles';
import Album from './pages/Album';
import Travel from './pages/Travel';
import Nav from './pages/Nav';
import Notes from './pages/Notes';
import { CategoryProvider } from './context/CategoryContext';
import { SidebarProvider } from './context/SidebarContext';

function App() {
  return (
    <CategoryProvider>
      <SidebarProvider>
        <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/article/:id" element={<ArticleDetail />} />
          <Route path="/album" element={<Album />} />
          <Route path="/travel" element={<Travel />} />
          <Route path="/nav" element={<Nav />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/travels" element={<TravelManage />} />
          <Route path="/admin/article/:id?" element={<ArticleEdit />} />
          <Route path="/admin/home" element={<HomeEdit />} />
          <Route path="/admin/password" element={<PasswordChange />} />
        </Routes>
      </Layout>
      </SidebarProvider>
    </CategoryProvider>
  );
}

export default App;

