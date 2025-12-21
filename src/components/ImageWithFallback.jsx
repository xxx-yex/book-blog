import { useState, useEffect, useRef } from 'react';

// 带超时和错误处理的图片组件
const ImageWithFallback = ({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E图片加载失败%3C/text%3E%3C/svg%3E',
  loading = 'lazy',
  timeout = 5000, // 5秒超时
  onError: onErrorProp,
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadStartTime, setLoadStartTime] = useState(null);
  const timeoutRef = useRef(null);
  const imgRef = useRef(null);
  const originalSrcRef = useRef(src);

  useEffect(() => {
    // 重置状态
    originalSrcRef.current = src;
    setImgSrc(src);
    setHasError(false);
    setIsLoading(true);
    setLoadStartTime(Date.now());

    // 清除之前的超时
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 如果图片还未加载完成，设置超时
    if (src && src !== fallbackSrc) {
      timeoutRef.current = setTimeout(() => {
        // 检查图片是否仍在加载且未完成
        if (imgRef.current && !imgRef.current.complete && Date.now() - loadStartTime >= timeout) {
          console.warn(`图片加载超时 (${timeout}ms): ${src}`);
          setIsLoading(false);
          setHasError(true);
          if (imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc);
          }
          // 调用自定义错误处理
          if (onErrorProp) {
            const event = { target: imgRef.current };
            onErrorProp(event);
          }
        }
      }, timeout);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [src, timeout, fallbackSrc]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleError = (e) => {
    // 如果已经显示占位符，不再处理
    if (imgSrc === fallbackSrc) {
      return;
    }

    console.warn(`图片加载失败: ${originalSrcRef.current}`);
    setIsLoading(false);
    setHasError(true);
    
    // 先调用自定义错误处理（可能尝试加载备用图片）
    if (onErrorProp) {
      onErrorProp(e);
      // 如果自定义处理没有改变 src，再使用默认占位符
      setTimeout(() => {
        if (e.target.src === originalSrcRef.current || e.target.src === imgSrc) {
          setImgSrc(fallbackSrc);
        }
      }, 100);
    } else {
      setImgSrc(fallbackSrc);
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return (
    <img
      ref={imgRef}
      src={imgSrc}
      alt={alt}
      className={className}
      loading={loading}
      onLoad={handleLoad}
      onError={handleError}
      style={{
        ...props.style,
        opacity: 1
      }}
      {...props}
    />
  );
};

export default ImageWithFallback;

