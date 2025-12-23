import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, message } from 'antd';
import { GithubOutlined } from '@ant-design/icons';
import { isAuthenticated } from '../../utils/auth';
import { homeAPI } from '../../utils/api';

const HomeEdit = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [avatarImageUrl, setAvatarImageUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  
  // 编辑状态
  const [editingName, setEditingName] = useState(false);
  const [editingIntroduction, setEditingIntroduction] = useState(false);
  const [editingSubtitle, setEditingSubtitle] = useState(false);
  
  // 临时值
  const [tempName, setTempName] = useState('');
  const [tempIntroduction, setTempIntroduction] = useState('');
  const [tempSubtitle, setTempSubtitle] = useState('');
  
  const nameInputRef = useRef(null);
  const introductionInputRef = useRef(null);
  const subtitleInputRef = useRef(null);
  const avatarBlobUrlRef = useRef(null);
  const bannerBlobUrlRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/');
      message.warning('请先登录');
      return;
    }
    loadHomeContent();
  }, []);

  // 清理 blob URLs 当组件卸载时
  useEffect(() => {
    return () => {
      if (avatarBlobUrlRef.current) {
        URL.revokeObjectURL(avatarBlobUrlRef.current);
      }
      if (bannerBlobUrlRef.current) {
        URL.revokeObjectURL(bannerBlobUrlRef.current);
      }
    };
  }, []);

  // 当进入编辑状态时，聚焦输入框
  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  useEffect(() => {
    if (editingIntroduction && introductionInputRef.current) {
      introductionInputRef.current.focus();
    }
  }, [editingIntroduction]);

  useEffect(() => {
    if (editingSubtitle && subtitleInputRef.current) {
      subtitleInputRef.current.focus();
      subtitleInputRef.current.select();
    }
  }, [editingSubtitle]);

  const loadHomeContent = async () => {
    try {
      setLoading(true);
      const data = await homeAPI.get();
      setFormValues(data);
      // 添加时间戳防止浏览器缓存旧图片
      const timestamp = Date.now();
      setAvatarImageUrl(data.avatarImage ? `${data.avatarImage}?t=${timestamp}` : '');
      setBannerImageUrl(data.bannerImage ? `${data.bannerImage}?t=${timestamp}` : '');
    } catch (error) {
      message.error('加载首页内容失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (file) => {
    // 清理旧的 blob URL
    if (avatarBlobUrlRef.current) {
      URL.revokeObjectURL(avatarBlobUrlRef.current);
      avatarBlobUrlRef.current = null;
    }
    setAvatarFile(file);
    const blobUrl = URL.createObjectURL(file);
    avatarBlobUrlRef.current = blobUrl;
    setAvatarImageUrl(blobUrl);
    // 自动保存，直接传递文件
    setTimeout(() => {
      handleSave(null, file, null);
    }, 100);
    return false;
  };

  const handleBannerUpload = (file) => {
    // 清理旧的 blob URL
    if (bannerBlobUrlRef.current) {
      URL.revokeObjectURL(bannerBlobUrlRef.current);
      bannerBlobUrlRef.current = null;
    }
    setBannerFile(file);
    const blobUrl = URL.createObjectURL(file);
    bannerBlobUrlRef.current = blobUrl;
    setBannerImageUrl(blobUrl);
    // 自动保存，直接传递文件
    setTimeout(() => {
      handleSave(null, null, file);
    }, 100);
    return false;
  };

  const handleSave = async (updatedValues = null, avatarFileToUpload = null, bannerFileToUpload = null) => {
    setSaving(true);
    try {
      const valuesToSave = updatedValues || formValues;
      const formData = new FormData();
      formData.append('name', valuesToSave.name || '');
      formData.append('subtitle', valuesToSave.subtitle || '');
      formData.append('introduction', valuesToSave.introduction || '');
      formData.append('socialLinks', JSON.stringify(valuesToSave.socialLinks || []));
      formData.append('education', JSON.stringify(valuesToSave.education || []));
      formData.append('work', JSON.stringify(valuesToSave.work || []));
      formData.append('stats', JSON.stringify(valuesToSave.stats || {}));
      formData.append('siteInfo', JSON.stringify(valuesToSave.siteInfo || {}));

      // 优先使用直接传递的文件，否则使用 state 中的文件
      const fileToUploadAvatar = avatarFileToUpload || avatarFile;
      const fileToUploadBanner = bannerFileToUpload || bannerFile;

      if (fileToUploadAvatar) {
        formData.append('avatarImage', fileToUploadAvatar);
      }

      if (fileToUploadBanner) {
        formData.append('bannerImage', fileToUploadBanner);
      }

      await homeAPI.update(formData);
      message.success('保存成功');
      
      // 清理 blob URLs
      if (avatarBlobUrlRef.current) {
        URL.revokeObjectURL(avatarBlobUrlRef.current);
        avatarBlobUrlRef.current = null;
      }
      if (bannerBlobUrlRef.current) {
        URL.revokeObjectURL(bannerBlobUrlRef.current);
        bannerBlobUrlRef.current = null;
      }
      
      // 清除文件引用
      setAvatarFile(null);
      setBannerFile(null);
      
      // 重新加载完整内容以获取最新的图片URL
      await loadHomeContent();
    } catch (error) {
      message.error(error.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleNameClick = () => {
    setTempName(formValues.name || '');
    setEditingName(true);
  };

  const handleNameBlur = () => {
    setEditingName(false);
    if (tempName !== formValues.name) {
      const updatedValues = { ...formValues, name: tempName };
      setFormValues(updatedValues);
      // 直接使用更新后的值保存
      handleSave(updatedValues);
    }
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nameInputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setTempName(formValues.name || '');
      setEditingName(false);
    }
  };

  const handleIntroductionClick = () => {
    setTempIntroduction(formValues.introduction || '');
    setEditingIntroduction(true);
  };

  const handleIntroductionBlur = () => {
    setEditingIntroduction(false);
    if (tempIntroduction !== formValues.introduction) {
      const updatedValues = { ...formValues, introduction: tempIntroduction };
      setFormValues(updatedValues);
      // 直接使用更新后的值保存
      handleSave(updatedValues);
    }
  };

  const handleIntroductionKeyDown = (e) => {
    if (e.key === 'Escape') {
      setTempIntroduction(formValues.introduction || '');
      setEditingIntroduction(false);
    }
  };

  const handleSubtitleClick = () => {
    setTempSubtitle(formValues.subtitle || '');
    setEditingSubtitle(true);
  };

  const handleSubtitleBlur = () => {
    setEditingSubtitle(false);
    if (tempSubtitle !== formValues.subtitle) {
      const updatedValues = { ...formValues, subtitle: tempSubtitle };
      setFormValues(updatedValues);
      // 直接使用更新后的值保存
      handleSave(updatedValues);
    }
  };

  const handleSubtitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      subtitleInputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setTempSubtitle(formValues.subtitle || '');
      setEditingSubtitle(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-bg-100 overflow-y-auto flex items-center justify-center">
        <div className="text-text-200">加载中...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-bg-100 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Banner 区域 */}
        <div 
          className="relative w-full h-64 rounded-lg overflow-hidden mb-8"
        >
          {/* 背景层 - 可点击上传 */}
          <Upload
            accept="image/*"
            beforeUpload={handleBannerUpload}
            showUploadList={false}
          >
            <div 
              className="absolute inset-0 banner-bg-animated cursor-pointer hover:opacity-90 transition-opacity z-0"
              style={bannerImageUrl || formValues.bannerImage ? {
                backgroundImage: `url(${bannerImageUrl || formValues.bannerImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : {
                background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
              }}
            >
              {/* 提示文字 */}
              <div className="absolute bottom-2 right-2 bg-black/30 text-white text-xs px-2 py-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                点击更换背景
              </div>
            </div>
          </Upload>
          {/* 内容层 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
            <div className="w-24 h-24 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center mb-4 overflow-hidden pointer-events-auto">
              <Upload
                accept="image/*"
                beforeUpload={handleAvatarUpload}
                showUploadList={false}
              >
                <div className="cursor-pointer w-full h-full flex items-center justify-center">
                  {avatarImageUrl || formValues.avatarImage ? (
                    <img 
                      src={avatarImageUrl || formValues.avatarImage} 
                      alt="头像" 
                      className="w-20 h-20 rounded-full object-cover hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white"></div>
                  )}
                </div>
              </Upload>
            </div>
            <div className="pointer-events-auto">
              {editingName ? (
                <input
                  ref={nameInputRef}
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleNameBlur}
                  onKeyDown={handleNameKeyDown}
                  className="text-2xl font-bold text-white bg-transparent border-b-2 border-white/50 focus:border-white outline-none text-center px-2"
                  style={{ background: 'rgba(0,0,0,0.1)' }}
                />
              ) : (
                <div 
                  className="text-2xl font-bold text-white cursor-pointer hover:underline px-2 py-1 rounded"
                  onClick={handleNameClick}
                >
                  {formValues.name || 'OBJECTX'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 自我介绍 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-100 mb-4">
            你好 👋, 我是 {formValues.name || 'ObjectX'}
          </h1>
          {editingIntroduction ? (
            <textarea
              ref={introductionInputRef}
              value={tempIntroduction}
              onChange={(e) => setTempIntroduction(e.target.value)}
              onBlur={handleIntroductionBlur}
              onKeyDown={handleIntroductionKeyDown}
              className="w-full text-text-200 leading-relaxed mb-4 whitespace-pre-line bg-transparent border-2 border-bg-300 rounded p-3 focus:border-primary-300 outline-none resize-none"
              rows={6}
            />
          ) : (
            <p 
              className="text-text-200 leading-relaxed mb-4 whitespace-pre-line cursor-pointer hover:bg-bg-200 rounded p-2 -m-2"
              onClick={handleIntroductionClick}
            >
              {formValues.introduction || '一个热爱生活和分享技术的前端工程师。我希望能够通过我的博客，与大家分享我的生活态度、经历和技术的学习，希望带给大家一些启发和帮助！'}
            </p>
          )}
          {editingSubtitle ? (
            <input
              ref={subtitleInputRef}
              type="text"
              value={tempSubtitle}
              onChange={(e) => setTempSubtitle(e.target.value)}
              onBlur={handleSubtitleBlur}
              onKeyDown={handleSubtitleKeyDown}
              className="w-full text-text-200 leading-relaxed mb-2 bg-transparent border-2 border-bg-300 rounded p-2 focus:border-primary-300 outline-none"
            />
          ) : formValues.subtitle ? (
            <p 
              className="text-text-200 leading-relaxed mb-2 cursor-pointer hover:bg-bg-200 rounded p-2 -m-2"
              onClick={handleSubtitleClick}
            >
              {formValues.subtitle}
            </p>
          ) : (
            <p 
              className="text-text-200 leading-relaxed mb-2 cursor-pointer hover:bg-bg-200 rounded p-2 -m-2 text-bg-300 italic"
              onClick={handleSubtitleClick}
            >
              点击添加副标题
            </p>
          )}
        </div>

        {/* 社交账号 */}
        {formValues.socialLinks && formValues.socialLinks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-text-100 mb-4">社交账号</h2>
            <div className="flex flex-wrap gap-3">
              {formValues.socialLinks.map((link, index) => (
                link && link.url && (
                  <a 
                    key={index}
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-bg-200 transition-colors"
                  >
                    {link.name === 'Github' && <GithubOutlined className="text-text-100" />}
                    <span className="text-sm text-text-100">{link.name || '链接'}</span>
                  </a>
                )
              ))}
            </div>
          </div>
        )}



        {/* 教育经历 */}
        {formValues.education && formValues.education.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-text-100 mb-4">教育经历</h2>
            {formValues.education.map((edu, index) => (
              edu && edu.title && (
                <div key={index} className="bg-white rounded-lg p-4 mb-3">
                  <div className="text-text-100 font-medium mb-1">{edu.title}</div>
                  {edu.period && (
                    <div className="text-text-200 text-sm">{edu.period}</div>
                  )}
                </div>
              )
            ))}
          </div>
        )}

        {/* 工作经历 */}
        {formValues.work && formValues.work.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-text-100 mb-4">工作经历</h2>
            {formValues.work.map((w, index) => (
              w && w.title && (
                <div key={index} className="bg-white rounded-lg p-4 mb-3">
                  <div className="text-text-100 font-medium mb-1">{w.title}</div>
                  {w.period && (
                    <div className="text-text-200 text-sm">{w.period}</div>
                  )}
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeEdit;
