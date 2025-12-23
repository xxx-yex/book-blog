import { useEffect, useState, useRef } from 'react';
import { Button, Input, DatePicker, Rate, Upload, message, Modal, Spin, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, EditOutlined, CheckOutlined, CloseOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { travelAPI } from '../../utils/api';
import ImageWithFallback from '../../components/ImageWithFallback';
import dayjs from 'dayjs';

const DEFAULT_TRAVEL = {
  title: '',
  location: '',
  date: dayjs().format('YYYY-MM-DD'),
  rating: 5,
  weather: '',
  transport: '',
  description: '',
  images: [],
};

// 可编辑文本域（支持 location 自动定位）
function EditableField({ value, onChange, onBlur, inputType = 'text', className = '', field, ...rest }) {
  const [editing, setEditing] = useState(false);
  const [innerValue, setInnerValue] = useState(value);
  const ref = useRef(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => setInnerValue(value), [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  const handleSave = () => {
    setEditing(false);
    if (innerValue !== value) onChange(innerValue);
    if (onBlur) onBlur();
  };

  // 自动定位 —— 只有location时显示
  const handleAutoLocation = async () => {
    setLocating(true);
    if (!navigator.geolocation) {
      message.error('浏览器不支持地理定位');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude, lon = pos.coords.longitude;
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh-CN`);
        const data = await response.json();
        // 推荐显示行政区划
        const addr = data.address || {};
        const locName = [addr.state, addr.city, addr.county, addr.town, addr.village, addr.suburb, addr.neighbourhood, addr.road, addr.house_number, addr.country]
          .filter(Boolean).join(' ');
        setInnerValue(locName || data.display_name || `${lat},${lon}`);
        // 自动保存
        setEditing(false);
        if (onChange) onChange(locName || data.display_name || `${lat},${lon}`);
        if (onBlur) onBlur();
      } catch {
        message.error('逆地理编码失败');
      }
      setLocating(false);
    }, err => {
      message.error('获取定位失败：' + err.message);
      setLocating(false);
    }, { enableHighAccuracy: true, timeout: 10000 })
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        {field === 'location' && (
          <Tooltip title="获取当前位置">
            <Button
              size="small"
              icon={<EnvironmentOutlined />}
              loading={locating}
              onClick={handleAutoLocation}
              type="text"
              style={{ color: '#1890ff' }}
              aria-label="自动填写当前位置"
            />
          </Tooltip>
        )}
        {inputType === 'textarea' ? (
          <Input.TextArea 
            ref={ref} 
            value={innerValue}
            onChange={e => setInnerValue(e.target.value)}
            onBlur={handleSave} 
            autoSize 
            className={className} 
            {...rest} 
          />
        ) : inputType === 'number' ? (
          <Input 
            ref={ref} 
            type="number" 
            value={innerValue}
            onChange={e => setInnerValue(e.target.value)}
            onBlur={handleSave} 
            className={className} 
            {...rest} 
          />
        ) : (
          <Input 
            ref={ref} 
            value={innerValue}
            onChange={e => setInnerValue(e.target.value)}
            onBlur={handleSave} 
            className={className} 
            {...rest} 
          />
        )}
      </div>
    );
  }
  return (
    <span className={className + ' group cursor-pointer inline-block align-middle'} onClick={() => setEditing(true)}>
      <span>{value || <span className="text-gray-400">点击填写</span>}</span>
      <EditOutlined className="opacity-30 group-hover:opacity-80 ml-2 text-xs" />
    </span>
  );
}

const TravelManage = () => {
  const [travels, setTravels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newLoading, setNewLoading] = useState(false);
  const [imgLoadingId, setImgLoadingId] = useState(null);

  // 加载所有旅行日记
  const loadTravels = async () => {
    setLoading(true);
    try {
      const all = await travelAPI.getAll();
      setTravels(all);
    } catch {
      message.error('加载旅行日记失败');
    }
    setLoading(false);
  };
  useEffect(() => { loadTravels(); }, []);

  // 新增日记
  const handleAddTravel = async () => {
    setNewLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', '未命名日记');
      formData.append('date', dayjs().format('YYYY-MM-DD'));
      formData.append('rating', 5);
      const res = await travelAPI.create(formData);
      message.success('新增日记成功');
      loadTravels();
    } catch {
      message.error('新增失败');
    }
    setNewLoading(false);
  };

  const updateField = async (id, patch) => {
    const t = travels.find(t => t._id === id);
    const formData = new FormData();
    for (const k of Object.keys(DEFAULT_TRAVEL)) {
      if (k === 'images') continue;
      formData.append(k, patch[k] !== undefined ? patch[k] : t[k] || '');
    }
    formData.append('existingImages', JSON.stringify(t.images));
    try {
      await travelAPI.update(id, formData);
      message.success('已保存');
      loadTravels();
    } catch {
      message.error('保存失败');
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除?',
      onOk: async () => {
        await travelAPI.delete(id);
        message.success('已删除');
        loadTravels();
      }
    });
  };

  // 删除图片
  const handleRemoveImg = async (travel, imgUrl) => {
    setImgLoadingId(travel._id + '-' + imgUrl);
    const keepImages = travel.images.filter(img => img !== imgUrl);
    const formData = new FormData();
    for (const k of Object.keys(DEFAULT_TRAVEL)) {
      if (k === 'images') continue;
      formData.append(k, travel[k] || '');
    }
    formData.append('existingImages', JSON.stringify(keepImages));
    try {
      await travelAPI.update(travel._id, formData);
      message.success('图片已删除');
      loadTravels();
    } catch {
      message.error('图片删除失败');
    }
    setImgLoadingId(null);
  };

  // 上传图片（多选）
  const handleUpload = async (travel, { file }) => {
    setImgLoadingId(travel._id);
    const formData = new FormData();
    // 基础字段都补全
    for (const k of Object.keys(DEFAULT_TRAVEL)) {
      if (k === 'images') continue;
      formData.append(k, travel[k] || '');
    }
    formData.append('existingImages', JSON.stringify(travel.images));
    formData.append('images', file);
    try {
      await travelAPI.update(travel._id, formData);
      message.success('图片上传成功');
      loadTravels();
    } catch {
      message.error('上传失败');
    }
    setImgLoadingId(null);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">旅行日记管理</h1>
        <Button type="primary" icon={<PlusOutlined />} loading={newLoading} onClick={handleAddTravel}>
          新增旅行日记
        </Button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12"><Spin /></div>
      ) : travels.length === 0 ? (
        <div className="text-center text-text-200 py-16 bg-white rounded-lg font-bold">暂无旅行记录</div>
      ) : (
        <div className="space-y-8 pb-16">
          {travels.map(travel => (
            <div key={travel._id} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow relative group">
              <Button danger size="small" style={{position:'absolute',right:16,top:16,zIndex:2}} icon={<DeleteOutlined />} onClick={() => handleDelete(travel._id)} />
              {/* -- 日期圆圈、可编辑标题 -- */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-medium text-text-100">{dayjs(travel.date).format('DD')}</span>
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <EditableField className="text-lg font-semibold mr-2" value={travel.title} onChange={v => updateField(travel._id, { title: v })} />
                    <span className="border-l px-2 text-text-200">{travel._id}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-text-200">
                    <EditableField value={travel.location} className="min-w-[80px]" onChange={v => updateField(travel._id, { location: v })} field="location" />
                    <DatePicker bordered={false} className="max-w-[110px]" value={dayjs(travel.date)} format="YYYY-MM-DD"
                      onChange={(_, dstr) => updateField(travel._id, { date: dstr })} />
                    <Rate value={travel.rating} onChange={v => updateField(travel._id, { rating: v })} />
                  </div>
                </div>
              </div>
              {/* -- 描述 -- */}
              <EditableField value={travel.description} inputType="textarea" className="w-full mb-4 text-text-200" onChange={v => updateField(travel._id, { description: v })} />

              {/* -- 图片区域 -- */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                {travel.images.map((img, idx) => (
                  <div className="relative group" key={img + idx}>
                    <ImageWithFallback src={img} alt="travel" className="w-full h-28 object-cover rounded" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-white text-gray-700 hover:bg-red-500 hover:text-white rounded-full w-7 h-7 flex items-center justify-center shadow-md transition-all duration-200 scale-100 hover:scale-110 ring-1 ring-gray-200 hover:ring-red-400 z-10"
                      style={{ cursor: 'pointer', fontSize: 16, boxShadow: '0 2px 8px -2px rgba(0,0,0,0.08)' }}
                      disabled={imgLoadingId === travel._id + '-' + img}
                      onClick={() => handleRemoveImg(travel, img)}
                    >
                      {imgLoadingId === travel._id + '-' + img ? <Spin size="small" /> : <CloseOutlined />}
                    </button>
                  </div>
                ))}
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  customRequest={opt => handleUpload(travel, opt)}
                  disabled={imgLoadingId === travel._id}
                >
                  <div className="aspect-square rounded-lg bg-bg-200 flex flex-col items-center justify-center border cursor-pointer min-h-[7rem]">
                    {imgLoadingId === travel._id ? <Spin /> : <PlusOutlined className="text-xl opacity-60" />}
                    <span className="text-xs text-text-300 mt-1">添加图片</span>
                  </div>
                </Upload>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TravelManage;
