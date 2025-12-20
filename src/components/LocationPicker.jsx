import { useState, useEffect, useRef } from 'react';
import { Input, Button, Modal, message } from 'antd';
import { EnvironmentOutlined, ReloadOutlined } from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 修复 Leaflet 默认图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// 地图点击事件处理组件
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

// 地图中心位置更新组件
function MapCenterUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

const LocationPicker = ({ value, onChange, placeholder = "请选择地点" }) => {
  const [location, setLocation] = useState(value || '');
  const [loading, setLoading] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapPosition, setMapPosition] = useState([39.9042, 116.4074]); // 默认北京
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);

  useEffect(() => {
    setLocation(value || '');
  }, [value]);

  // 获取当前位置
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      message.error('您的浏览器不支持地理定位功能');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMapPosition([latitude, longitude]);
        setSelectedPosition([latitude, longitude]);
        
        try {
          const address = await reverseGeocode(latitude, longitude);
          const locationText = address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setLocation(locationText);
          onChange?.(locationText);
          message.success('已获取当前位置');
        } catch (error) {
          console.error('获取地址失败:', error);
          const locationText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setLocation(locationText);
          onChange?.(locationText);
          message.success('已获取当前位置坐标');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        console.error('获取位置失败:', error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message.error('用户拒绝了地理定位请求');
            break;
          case error.POSITION_UNAVAILABLE:
            message.error('位置信息不可用');
            break;
          case error.TIMEOUT:
            message.error('获取位置超时');
            break;
          default:
            message.error('获取位置时发生未知错误');
            break;
        }
      }
    );
  };

  // 逆地理编码：将坐标转换为地址
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'BookBlog/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        let locationParts = [];
        if (address.road) locationParts.push(address.road);
        if (address.neighbourhood || address.suburb) locationParts.push(address.neighbourhood || address.suburb);
        if (address.city || address.town || address.village) locationParts.push(address.city || address.town || address.village);
        if (address.state) locationParts.push(address.state);
        if (address.country) locationParts.push(address.country);
        
        return locationParts.join(' ') || data.display_name;
      }
      return data.display_name || null;
    } catch (error) {
      console.error('逆地理编码失败:', error);
      return null;
    }
  };

  // 打开地图选择器
  const openMapPicker = () => {
    setMapVisible(true);
    setMapLoading(true);
    
    // 如果已经有位置，尝试解析并设置地图中心
    if (location && !selectedPosition) {
      const coordMatch = location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        setMapPosition([lat, lng]);
        setSelectedPosition([lat, lng]);
        setMapLoading(false);
        return;
      }
    }
    
    // 如果没有已有位置，自动获取当前位置
    if (!location && !selectedPosition) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setMapPosition([latitude, longitude]);
            setSelectedPosition([latitude, longitude]);
            setMapLoading(false);
          },
          (error) => {
            console.error('获取位置失败:', error);
            // 如果获取失败，使用默认位置（北京）
            setMapLoading(false);
          }
        );
      } else {
        setMapLoading(false);
      }
    } else {
      setTimeout(() => setMapLoading(false), 100);
    }
  };

  // 确认选择地图上的位置
  const confirmMapSelection = async () => {
    if (!selectedPosition) {
      message.warning('请先在地图上选择一个位置');
      return;
    }

    setMapLoading(true);
    try {
      const [lat, lng] = selectedPosition;
      const address = await reverseGeocode(lat, lng);
      const locationText = address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setLocation(locationText);
      onChange?.(locationText);
      setMapVisible(false);
      message.success('位置选择成功');
    } catch (error) {
      console.error('获取地址失败:', error);
      const [lat, lng] = selectedPosition;
      const locationText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setLocation(locationText);
      onChange?.(locationText);
      setMapVisible(false);
      message.success('位置选择成功');
    } finally {
      setMapLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setLocation(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="location-picker">
      <Input
        value={location}
        onChange={handleInputChange}
        placeholder={placeholder}
        suffix={
          <Button
            type="text"
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={getCurrentLocation}
            title="获取当前位置"
            className="p-0 h-auto"
          />
        }
      />
      <div className="mt-2">
        <Button
          type="link"
          icon={<EnvironmentOutlined />}
          onClick={openMapPicker}
          size="small"
        >
          在地图上选择
        </Button>
      </div>

      {/* 地图选择弹窗 */}
      <Modal
        title="在地图上选择位置"
        open={mapVisible}
        onCancel={() => {
          setMapVisible(false);
          setSelectedPosition(null);
        }}
        onOk={confirmMapSelection}
        okText="确认选择"
        cancelText="取消"
        width={800}
        confirmLoading={mapLoading}
      >
        <div style={{ height: '500px', width: '100%', position: 'relative' }}>
          {!mapLoading && (
            <MapContainer
              center={mapPosition}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapCenterUpdater center={mapPosition} />
              <LocationMarker 
                position={selectedPosition} 
                setPosition={(pos) => setSelectedPosition([pos.lat, pos.lng])}
              />
            </MapContainer>
          )}
          <div style={{ 
            position: 'absolute', 
            top: '10px', 
            left: '10px', 
            background: 'white', 
            padding: '8px 12px', 
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000
          }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
              点击地图选择位置
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LocationPicker;
