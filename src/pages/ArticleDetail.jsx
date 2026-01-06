import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LikeOutlined, EyeOutlined, ArrowLeftOutlined, CommentOutlined, CloseOutlined, EditOutlined, DeleteOutlined, RobotOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Button, message, Image, Modal, Input, Popover, Tooltip, Card, List, Popconfirm, Space, Anchor, FloatButton } from 'antd';
import { articleAPI, annotationAPI } from '../utils/api';
import { isAuthenticated } from '../utils/auth';
import './ArticleDetail.css';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [annotations, setAnnotations] = useState([]);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [hoveredAnnotation, setHoveredAnnotation] = useState(null);
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [annotationPositions, setAnnotationPositions] = useState([]);
  const [visibleAnnotationId, setVisibleAnnotationId] = useState(null); // 当前显示的注释ID
  const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 }); // 添加注释按钮位置
  const [tocItems, setTocItems] = useState([]); // 目录数据
  const [showToc, setShowToc] = useState(true); // 是否显示目录
  const contentRef = useRef(null);
  const scrollContainerRef = useRef(null); // 滚动容器
  const isAdmin = isAuthenticated();

  // 生成目录
  useEffect(() => {
    if (!article || !contentRef.current) return;

    const headers = contentRef.current.querySelectorAll('h1, h2, h3');
    const items = [];
    const stack = []; // { level, children }

    headers.forEach((header, index) => {
      const id = header.id || `heading-${index}`;
      header.id = id;
      const level = parseInt(header.tagName.replace('H', ''), 10);
      
      const item = {
        key: id,
        href: `#${id}`,
        title: header.innerText,
        children: [],
      };

      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        items.push(item);
      } else {
        stack[stack.length - 1].children.push(item);
      }

      stack.push({ level, children: item.children });
    });

    setTocItems(items);
  }, [article]);

  useEffect(() => {
    loadArticle();
    loadAnnotations();
  }, [id]);

  // 处理图片点击预览
  useEffect(() => {
    if (!contentRef.current) return;

    const handleImageClick = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
        e.stopPropagation();
        const src = e.target.src;
        setPreviewImage(src);
        setPreviewVisible(true);
      }
    };

    const contentElement = contentRef.current;
    contentElement.addEventListener('click', handleImageClick);

    return () => {
      contentElement.removeEventListener('click', handleImageClick);
    };
  }, [article]);

  // 处理文本选择（仅管理员）
  useEffect(() => {
    if (!isAdmin || !contentRef.current) return;

    const handleMouseUp = (e) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();

      if (selectedText && range.intersectsNode(contentRef.current)) {
        // 计算在HTML内容中的偏移量
        const container = contentRef.current;
        const preRange = document.createRange();
        preRange.selectNodeContents(container);
        preRange.setEnd(range.startContainer, range.startOffset);
        const startOffset = preRange.toString().length;

        preRange.setEnd(range.endContainer, range.endOffset);
        const endOffset = preRange.toString().length;

        // 计算按钮位置
        const rect = range.getBoundingClientRect();
        const containerRect = contentRef.current.parentElement.getBoundingClientRect();
        
        // 按钮显示在选区右上角
        // rect.right 是选区右边界相对于视口的x坐标
        // rect.top 是选区上边界相对于视口的y坐标
        // containerRect.left/top 是容器相对于视口的坐标
        // 我们需要相对于容器的坐标
        const relativeLeft = rect.right - containerRect.left;
        const relativeTop = rect.top - containerRect.top;

        setButtonPosition({
          left: relativeLeft - 20, // 向左偏移一半宽度，使其居中于右上角
          top: relativeTop - 45    // 向上偏移，显示在文字上方
        });

        setSelectedText(selectedText);
        setSelectionRange({ startOffset, endOffset, range });
      } else {
        setSelectedText('');
        setSelectionRange(null);
      }
    };

    const contentElement = contentRef.current;
    contentElement.addEventListener('mouseup', handleMouseUp);

    return () => {
      contentElement.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isAdmin, article]);

  const loadArticle = async () => {
    try {
      const data = await articleAPI.getById(id);
      setArticle(data);
      articleAPI.incrementViews(id).catch(() => {});
    } catch (error) {
      message.error('加载文章失败');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadAnnotations = async () => {
    try {
      const data = await annotationAPI.getByArticle(id);
      setAnnotations(data);
    } catch (error) {
      // 静默失败
    }
  };

  const handleAddComment = () => {
    if (!selectedText || !selectionRange) {
      message.warning('请先选择文本');
      return;
    }
    setCommentModalVisible(true);
  };

  const handleSaveComment = async () => {
    if (!commentText.trim()) {
      message.warning('请输入注释内容');
      return;
    }

    try {
      await annotationAPI.create({
        article: id,
        selectedText: selectedText,
        startOffset: selectionRange.startOffset,
        endOffset: selectionRange.endOffset,
        comment: commentText,
      });
      message.success('注释添加成功');
      setCommentModalVisible(false);
      setCommentText('');
      setSelectedText('');
      setSelectionRange(null);
      loadAnnotations();
    } catch (error) {
      message.error('添加注释失败');
    }
  };

  const handleEditAnnotation = (annotation) => {
    setEditingAnnotation(annotation);
    setEditCommentText(annotation.comment);
    setEditModalVisible(true);
  };

  const handleUpdateComment = async () => {
    if (!editCommentText.trim()) {
      message.warning('请输入注释内容');
      return;
    }

    try {
      await annotationAPI.update(editingAnnotation._id, { comment: editCommentText });
      message.success('注释更新成功');
      setEditModalVisible(false);
      setEditingAnnotation(null);
      setEditCommentText('');
      loadAnnotations();
    } catch (error) {
      message.error('更新注释失败');
    }
  };

  const handleDeleteAnnotation = async (annotationId) => {
    try {
      await annotationAPI.delete(annotationId);
      message.success('注释删除成功');
      loadAnnotations();
    } catch (error) {
      message.error('删除注释失败');
    }
  };

  // 渲染带注释的内容 - 修改为直接返回原始内容，高亮通过DOM操作实现
  const renderContentWithAnnotations = () => {
    return article?.content;
  };

  // 在DOM渲染后应用高亮
  useEffect(() => {
    if (!article || !contentRef.current || annotations.length === 0) return;

    // 清除现有的高亮（重置内容）
    contentRef.current.innerHTML = article.content;

    const container = contentRef.current;
    
    // 按位置排序，从后往前处理可以避免前面的DOM变化影响后面的偏移量？
    // 不，我们使用基于纯文本的查找，每次都重新遍历，所以顺序不重要，
    // 但是如果从前往后，插入节点不会影响后面文本节点的纯文本内容，但会打断文本节点。
    // 只要我们的遍历算法能处理被打断的文本节点即可。
    // 实际上，从后往前处理更安全，因为前面的文本节点结构完全没变。
    const sortedAnnotations = [...annotations].sort((a, b) => b.startOffset - a.startOffset);

    sortedAnnotations.forEach(ann => {
      try {
        highlightAnnotation(container, ann);
      } catch (e) {
        console.error('Highlight error:', e);
      }
    });

    // 重新计算注释卡片位置
    // setAnnotationPositions 需要由另一个 useEffect 触发，或者在这里触发
    // 由于我们修改了DOM，可能需要手动触发一次位置更新
    // 这里不做处理，依赖原有的 annotationPositions useEffect 监听 annotations 变化
    // 但 DOM 变化不会触发该 effect。我们需要强制更新。
    // 实际上原有的 useEffect 监听的是 annotations 数组，这里只是修改 DOM。
    // 我们可以在这里触发一个自定义事件或者状态更新。
    // 不过，原有的 useEffect 依赖于 annotations，当 annotations 加载时会触发。
    // 但高亮是在这之后加上的。
    
  }, [article, annotations]);

  const highlightAnnotation = (container, annotation) => {
    const range = createRangeFromTextOffset(container, annotation.startOffset, annotation.endOffset);
    if (!range) return;

    const mark = document.createElement('mark');
    mark.className = 'annotation-highlight';
    mark.setAttribute('data-annotation-id', annotation._id);
    mark.style.backgroundColor = '#fff3cd';
    mark.style.cursor = 'pointer';
    mark.style.borderBottom = '2px solid #ffc107';
    mark.style.position = 'relative';

    try {
      range.surroundContents(mark);
    } catch (e) {
      // 如果跨越了标签边界，surroundContents 会失败
      // 此时使用 extractContents + insertNode
      const fragment = range.extractContents();
      mark.appendChild(fragment);
      range.insertNode(mark);
    }
  };

  const createRangeFromTextOffset = (container, start, end) => {
    let charCount = 0;
    const range = document.createRange();
    let startFound = false;
    let endFound = false;

    const walker = document.createTreeWalker(
      container, 
      NodeFilter.SHOW_TEXT, 
      null, 
      false
    );
    
    let node;
    while ((node = walker.nextNode())) {
      const textLength = node.textContent.length;
      const nextCharCount = charCount + textLength;

      if (!startFound && start >= charCount && start < nextCharCount) {
        range.setStart(node, start - charCount);
        startFound = true;
      }

      if (!endFound && end > charCount && end <= nextCharCount) {
        range.setEnd(node, end - charCount);
        endFound = true;
        break;
      }

      charCount = nextCharCount;
    }

    return (startFound && endFound) ? range : null;
  };

  // 计算注释位置
  useEffect(() => {
    if (!contentRef.current || annotations.length === 0) {
      setAnnotationPositions([]);
      return;
    }

    const updatePositions = () => {
      const container = contentRef.current;
      if (!container) return;

      // 找到包含注释卡片的相对定位容器（文章内容的外层div）
      const relativeContainer = container.parentElement;
      if (!relativeContainer) return;

      const containerRect = relativeContainer.getBoundingClientRect();
      const positions = annotations.map((annotation) => {
        const mark = container.querySelector(`[data-annotation-id="${annotation._id}"]`);
        if (!mark) return null;

        const markRect = mark.getBoundingClientRect();
        // 计算相对于相对定位容器的位置
        return {
          annotation,
          left: markRect.right - containerRect.left + 10,
          top: markRect.top - containerRect.top,
          visible: markRect.top < window.innerHeight && markRect.bottom > 0,
        };
      }).filter(Boolean);

      setAnnotationPositions(positions);
    };

    // 初始计算 - 等待DOM渲染完成
    const timer = setTimeout(updatePositions, 200);

    // 监听滚动和窗口大小变化
    const scrollContainer = document.querySelector('.bg-bg-200.overflow-y-auto') || window;
    scrollContainer.addEventListener('scroll', updatePositions, true);
    window.addEventListener('resize', updatePositions);

    return () => {
      clearTimeout(timer);
      scrollContainer.removeEventListener('scroll', updatePositions, true);
      window.removeEventListener('resize', updatePositions);
    };
  }, [annotations, article]);

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };

  // 处理注释高亮点击 - 显示/隐藏注释卡片
  useEffect(() => {
    if (!contentRef.current) return;

    const handleAnnotationClick = (e) => {
      const mark = e.target.closest('.annotation-highlight');
      if (mark) {
        e.stopPropagation();
        const annId = mark.getAttribute('data-annotation-id');
        // 如果点击的是当前显示的注释，则隐藏；否则显示新的注释
        setVisibleAnnotationId(visibleAnnotationId === annId ? null : annId);
      } else {
        // 点击其他地方时隐藏注释卡片
        setVisibleAnnotationId(null);
      }
    };

    const handleDocumentClick = (e) => {
      // 如果点击的不是注释卡片内部，则隐藏
      if (!e.target.closest('.annotation-card-container') && !e.target.closest('.annotation-highlight')) {
        setVisibleAnnotationId(null);
      }
    };

    const contentElement = contentRef.current;
    contentElement.addEventListener('click', handleAnnotationClick);
    document.addEventListener('click', handleDocumentClick);

    return () => {
      contentElement.removeEventListener('click', handleAnnotationClick);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [annotations, visibleAnnotationId]);

  if (loading) {
    return (
      <div className="w-full h-full bg-bg-200 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="bg-bg-100 rounded-xl shadow-sm border border-bg-300 p-6 md:p-10">
            <div className="h-10 w-3/4 bg-bg-300 rounded-lg mb-6 animate-pulse"></div>
            <div className="h-6 w-1/2 bg-bg-300 rounded mb-8 animate-pulse"></div>
            <div className="space-y-4">
              <div className="h-4 bg-bg-300 rounded animate-pulse"></div>
              <div className="h-4 bg-bg-300 rounded animate-pulse"></div>
              <div className="h-4 w-5/6 bg-bg-300 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="w-full h-full bg-bg-200 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="bg-bg-100 rounded-xl shadow-sm border border-bg-300 p-6 md:p-12 text-center">
            <div className="text-text-200 text-lg mb-2">文章不存在</div>
            <div className="text-text-200 text-sm">请返回列表查看其他文章</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollContainerRef} className="w-full h-full bg-bg-200 overflow-y-auto" id="scroll-container">
      {/* 主容器：文章内容 + 注释侧边栏 + 目录侧边栏 */}
      <div className="flex gap-4 p-4 md:p-8 max-w-[1600px] mx-auto relative">
        {/* 文章内容区 */}
        <div className="flex-1 min-w-0">
          {/* 返回按钮 */}
          <button
            onClick={() => navigate('/')}
            className="mb-8 flex items-center gap-2 text-text-200 hover:text-text-100 transition-colors group"
          >
            <ArrowLeftOutlined className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">返回列表</span>
          </button>

          {/* 文章卡片 */}
          <div className="bg-bg-100 rounded-xl shadow-sm border border-bg-300 p-10">
          {/* 文章标题 */}
          <h1 className="text-4xl font-bold mb-6 text-text-100 leading-tight">{article.title}</h1>
          
          {/* 文章元信息 */}
          <div className="flex items-center gap-6 text-sm text-text-200 mb-10 pb-6 border-b border-bg-300">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(article.createdAt)}
            </span>
            {article.category && (
              <span className="px-3 py-1 bg-bg-200 text-text-100 rounded-full text-xs font-medium">
                {article.category.name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <LikeOutlined />
              <span>{article.likes || 0}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <EyeOutlined />
              <span>{article.views || 0}</span>
            </span>
          </div>

          {/* 文章内容容器 - 相对定位，用于放置注释卡片 */}
          <div className="relative">
            {/* 文章内容 */}
            <div 
              ref={contentRef}
              className="prose max-w-none article-content prose-headings:text-text-100 prose-p:text-text-200 prose-a:text-text-100 prose-strong:text-text-100"
              dangerouslySetInnerHTML={{ __html: renderContentWithAnnotations() }}
              style={{
                lineHeight: '1.8',
              }}
            />
            
            {/* 添加注释浮动按钮 */}
            {selectedText && selectionRange && (
              <div
                className="absolute z-50"
                style={{
                  left: `${buttonPosition.left}px`,
                  top: `${buttonPosition.top}px`,
                }}
              >
                <Tooltip title="添加注释">
                  <Button
                    shape="circle"
                    icon={<RobotOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
                    onClick={handleAddComment}
                    className="shadow-lg flex items-center justify-center bg-white border-0 hover:bg-gray-50"
                    style={{ width: '40px', height: '40px' }}
                  />
                </Tooltip>
              </div>
            )}

            {/* 注释卡片 - 定位在对应位置，只有点击高亮文字时才显示 */}
            {annotationPositions.map(({ annotation, left, top, visible }) => {
              if (!visible || visibleAnnotationId !== annotation._id) return null;
              
              return (
                <div
                  key={annotation._id}
                  className="absolute z-50 pointer-events-auto annotation-card-container"
                  style={{
                    left: `${left}px`,
                    top: `${top}px`,
                    width: '280px',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Card
                    className="shadow-lg hover:shadow-xl transition-shadow relative"
                    size="small"
                  >
                    {/* 删除按钮 - 右上角圆形❌ */}
                    {isAdmin && (
                      <Popconfirm
                        title="确定要删除这个注释吗？"
                        onConfirm={() => {
                          handleDeleteAnnotation(annotation._id);
                          setVisibleAnnotationId(null);
                        }}
                        okText="确定"
                        cancelText="取消"
                      >
                        <button
                          type="button"
                          className="absolute -top-2 -right-2 bg-white text-gray-700 hover:bg-red-500 hover:text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md transition-all duration-200 scale-100 hover:scale-110 ring-1 ring-gray-200 hover:ring-red-400 z-10"
                          style={{ cursor: 'pointer', fontSize: 16, boxShadow: '0 2px 8px -2px rgba(0,0,0,0.08)' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <CloseOutlined />
                        </button>
                      </Popconfirm>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-text-100 bg-yellow-100 px-2 py-1 rounded">
                          "{annotation.selectedText}"
                        </span>
                        <span className="text-xs text-text-200">
                          {formatDate(annotation.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-text-200 whitespace-pre-wrap leading-relaxed">
                        {annotation.comment}
                      </p>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
          
          {/* 图片预览 */}
          <div style={{ display: 'none' }}>
            <Image
              preview={{
                visible: previewVisible,
                src: previewImage,
                onVisibleChange: (visible) => {
                  setPreviewVisible(visible);
                  if (!visible) {
                    setPreviewImage('');
                  }
                },
              }}
            />
          </div>
        </div>
        </div>

        {/* 目录侧边栏 - 在大屏幕显示 */}
        {showToc && (
          <div className="hidden xl:block w-64 shrink-0 transition-all duration-300">
            <div className="sticky top-8">
              <div className="bg-bg-100 rounded-xl shadow-sm border border-bg-300 p-4">
                <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="font-bold text-lg text-text-100">目录</h3>
                  <Button 
                    type="text" 
                    icon={<MenuFoldOutlined />} 
                    onClick={() => setShowToc(false)}
                    className="text-text-200 hover:text-text-100"
                    title="收起目录"
                  />
                </div>
                {tocItems.length > 0 ? (
                  <Anchor
                    items={tocItems}
                    targetOffset={20}
                    affix={false}
                    showInkInFixed={true}
                    getContainer={() => scrollContainerRef.current}
                    onClick={(e, link) => {
                      e.preventDefault();
                      const target = document.getElementById(link.href.replace('#', ''));
                      if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="article-toc"
                  />
                ) : (
                  <div className="text-text-200 text-sm px-2">暂无目录</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 悬浮按钮 - 用于展开目录 */}
        {!showToc && (
          <FloatButton
            icon={<MenuUnfoldOutlined />}
            type="primary"
            style={{ right: 24, bottom: 24 }}
            onClick={() => setShowToc(true)}
            tooltip="显示目录"
          />
        )}
      </div>

      {/* 添加注释弹窗 */}
      <Modal
        title="添加注释"
        open={commentModalVisible}
        onOk={handleSaveComment}
        onCancel={() => {
          setCommentModalVisible(false);
          setCommentText('');
          setSelectedText('');
          setSelectionRange(null);
        }}
        okText="保存"
        cancelText="取消"
      >
        <div className="py-4">
          <p className="mb-2 text-text-200">选中的文本：</p>
          <p className="mb-4 p-2 bg-bg-200 rounded font-semibold text-text-100">{selectedText}</p>
          <p className="mb-2 text-text-200">注释说明：</p>
          <Input.TextArea
            rows={4}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="请输入对这段文本的解释或说明..."
            autoFocus
          />
        </div>
      </Modal>

      {/* 编辑注释弹窗 */}
      <Modal
        title="编辑注释"
        open={editModalVisible}
        onOk={handleUpdateComment}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingAnnotation(null);
          setEditCommentText('');
        }}
        okText="保存"
        cancelText="取消"
      >
        <div className="py-4">
          <p className="mb-2 text-text-200">选中的文本：</p>
          <p className="mb-4 p-2 bg-bg-200 rounded font-semibold text-text-100">
            {editingAnnotation?.selectedText}
          </p>
          <p className="mb-2 text-text-200">注释说明：</p>
          <Input.TextArea
            rows={4}
            value={editCommentText}
            onChange={(e) => setEditCommentText(e.target.value)}
            placeholder="请输入对这段文本的解释或说明..."
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
};

export default ArticleDetail;
