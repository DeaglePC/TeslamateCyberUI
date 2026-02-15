import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { getThemeColors } from '@/utils/theme';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  imageSrc: string;
  onCrop: (croppedImage: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
  language: 'zh' | 'en';
  theme: string;
}

interface ResizeHandleProps {
  position: string;
  colors: { primary: string };
  onHandleStart: (e: React.MouseEvent | React.TouchEvent, handle: string) => void;
}

// 将 ResizeHandle 移到组件外部并使用 memo，避免每次渲染重新创建
const ResizeHandle = memo(({ position, colors, onHandleStart }: ResizeHandleProps) => {
  const getCursorStyle = (pos: string) => {
    if ((pos.includes('n') && pos.includes('w')) || (pos.includes('s') && pos.includes('e'))) {
      return 'nwse-resize';
    }
    if ((pos.includes('n') && pos.includes('e')) || (pos.includes('s') && pos.includes('w'))) {
      return 'nesw-resize';
    }
    if (pos.includes('n') || pos.includes('s')) {
      return 'ns-resize';
    }
    return 'ew-resize';
  };

  return (
    <div
      style={{
        position: 'absolute',
        width: 44,
        height: 44,
        cursor: getCursorStyle(position),
        touchAction: 'none',
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onHandleStart(e, position);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        onHandleStart(e, position);
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 16,
          height: 16,
          top: 14,
          left: 14,
          backgroundColor: 'white',
          border: `2px solid ${colors.primary}`,
          borderRadius: 2,
        }}
      />
    </div>
  );
});

ResizeHandle.displayName = 'ResizeHandle';

export function ImageCropper({ imageSrc, onCrop, onCancel, aspectRatio, language, theme }: Props) {
  const colors = getThemeColors(theme);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 });
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 });

  // 所有状态都用 ref 存储，避免闭包问题
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const resizeHandleRef = useRef<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialCropRef = useRef<CropArea | null>(null);
  const cropAreaRef = useRef(cropArea);
  const displayDimensionsRef = useRef(displayDimensions);
  const aspectRatioRef = useRef(aspectRatio);

  // 同步 state 到 ref
  useEffect(() => {
    cropAreaRef.current = cropArea;
  }, [cropArea]);

  useEffect(() => {
    displayDimensionsRef.current = displayDimensions;
  }, [displayDimensions]);

  useEffect(() => {
    aspectRatioRef.current = aspectRatio;
  }, [aspectRatio]);

  const t = (key: string) => {
    const translations: Record<string, { zh: string; en: string }> = {
      title: { zh: '调整图片区域', en: 'Adjust Image Area' },
      preview: { zh: '预览', en: 'Preview' },
      confirm: { zh: '确认', en: 'Confirm' },
      cancel: { zh: '取消', en: 'Cancel' },
      reset: { zh: '重置', en: 'Reset' },
      dragHint: { zh: '拖动选择区域', en: 'Drag to select area' },
      resizeHint: { zh: '拖动边角调整大小', en: 'Drag corners to resize' },
    };
    return translations[key]?.[language] || key;
  };

  // 阻止背景滚动并滚动到顶部
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    // 滚动到页面顶部，确保弹窗居中可见
    window.scrollTo(0, 0);
    
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // 计算图片显示尺寸和初始裁剪区域
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const imgWidth = img.width;
      const imgHeight = img.height;
      setImageDimensions({ width: imgWidth, height: imgHeight });
      setImageLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // 更新显示尺寸和裁剪区域
  useEffect(() => {
    if (!imageLoaded || !containerRef.current) return;

    const updateDimensions = () => {
      const container = containerRef.current!;
      const containerRect = container.getBoundingClientRect();
      const maxWidth = containerRect.width - 32;
      const maxHeight = Math.min(400, window.innerHeight * 0.5);

      // 计算缩放比例
      const scaleX = maxWidth / imageDimensions.width;
      const scaleY = maxHeight / imageDimensions.height;
      const scale = Math.min(scaleX, scaleY, 1);

      const displayWidth = imageDimensions.width * scale;
      const displayHeight = imageDimensions.height * scale;
      
      setDisplayDimensions({ width: displayWidth, height: displayHeight });

      // 初始化裁剪区域（居中，覆盖80%）
      const cropWidth = displayWidth * 0.8;
      const cropHeight = aspectRatio 
        ? cropWidth / aspectRatio 
        : displayHeight * 0.8;
      
      setCropArea({
        x: (displayWidth - cropWidth) / 2,
        y: (displayHeight - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [imageLoaded, imageDimensions, aspectRatio]);

  // 事件处理函数 - 不依赖任何 state，全部使用 ref
  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent, handle?: string) => {
    // 只对鼠标事件调用 preventDefault（触摸事件在被动监听器中无法调用）
    if (!('touches' in e)) {
      e.preventDefault();
    }
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = { x: clientX, y: clientY };
    initialCropRef.current = { ...cropAreaRef.current };

    if (handle) {
      isResizingRef.current = true;
      resizeHandleRef.current = handle;
    } else {
      isDraggingRef.current = true;
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current && !isResizingRef.current) return;
    if (!initialCropRef.current) return;

    if ('touches' in e && (!e.touches || e.touches.length === 0)) {
      return;
    }

    // 只对鼠标事件调用 preventDefault，触摸事件在 wrapper 中处理
    if (!('touches' in e)) {
      e.preventDefault();
    }

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    const initialCrop = initialCropRef.current;
    const display = displayDimensionsRef.current;
    const ratio = aspectRatioRef.current;

    if (isDraggingRef.current) {
      let newX = initialCrop.x + deltaX;
      let newY = initialCrop.y + deltaY;
      newX = Math.max(0, Math.min(newX, display.width - initialCrop.width));
      newY = Math.max(0, Math.min(newY, display.height - initialCrop.height));
      setCropArea(prev => ({ ...prev, x: newX, y: newY }));
    } else if (isResizingRef.current && resizeHandleRef.current) {
      let newX = initialCrop.x;
      let newY = initialCrop.y;
      let newWidth = initialCrop.width;
      let newHeight = initialCrop.height;
      const minSize = 50;
      const handle = resizeHandleRef.current;

      if (handle.includes('e')) {
        newWidth = Math.max(minSize, initialCrop.width + deltaX);
      }
      if (handle.includes('w')) {
        newWidth = Math.max(minSize, initialCrop.width - deltaX);
        newX = initialCrop.x + initialCrop.width - newWidth;
      }
      if (handle.includes('s')) {
        newHeight = Math.max(minSize, initialCrop.height + deltaY);
      }
      if (handle.includes('n')) {
        newHeight = Math.max(minSize, initialCrop.height - deltaY);
        newY = initialCrop.y + initialCrop.height - newHeight;
      }

      if (ratio) {
        if (handle.includes('e') || handle.includes('w')) {
          newHeight = newWidth / ratio;
        } else {
          newWidth = newHeight * ratio;
        }
      }

      newX = Math.max(0, newX);
      newY = Math.max(0, newY);
      if (newX + newWidth > display.width) {
        newWidth = display.width - newX;
        if (ratio) newHeight = newWidth / ratio;
      }
      if (newY + newHeight > display.height) {
        newHeight = display.height - newY;
        if (ratio) newWidth = newHeight * ratio;
      }

      setCropArea({ x: newX, y: newY, width: newWidth, height: newHeight });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    isResizingRef.current = false;
    resizeHandleRef.current = null;
    initialCropRef.current = null;
  }, []);

  // 使用 ref 存储事件处理函数，避免重新绑定事件监听器
  const handleMouseMoveRef = useRef(handleMouseMove);
  const handleMouseUpRef = useRef(handleMouseUp);

  useEffect(() => {
    handleMouseMoveRef.current = handleMouseMove;
    handleMouseUpRef.current = handleMouseUp;
  });

  // 事件监听器 - 只绑定一次，通过 ref 调用最新函数
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMouseMoveRef.current(e);
    const onMouseUp = () => handleMouseUpRef.current();
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMouseMoveRef.current(e);
    };
    const onTouchEnd = () => handleMouseUpRef.current();
    const onTouchCancel = () => handleMouseUpRef.current();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchCancel);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
    };
  }, []); // 空依赖 - 只绑定一次

  // 执行裁剪
  const handleCrop = () => {
    if (!imageRef.current) return;

    const scaleX = imageDimensions.width / displayDimensions.width;
    const scaleY = imageDimensions.height / displayDimensions.height;

    const cropX = cropArea.x * scaleX;
    const cropY = cropArea.y * scaleY;
    const cropWidth = cropArea.width * scaleX;
    const cropHeight = cropArea.height * scaleY;

    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d')!;

    const img = imageRef.current;
    ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
    onCrop(croppedImage);
  };

  // 重置裁剪区域
  const handleReset = () => {
    const cropWidth = displayDimensions.width * 0.8;
    const cropHeight = aspectRatio 
      ? cropWidth / aspectRatio 
      : displayDimensions.height * 0.8;
    
    setCropArea({
      x: (displayDimensions.width - cropWidth) / 2,
      y: (displayDimensions.height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    });
  };



  // 阻止滚轮事件（非 passive）
  useEffect(() => {
    const preventWheel = (e: WheelEvent) => {
      e.preventDefault();
    };
    
    // 添加非 passive 的 wheel 事件监听器
    document.addEventListener('wheel', preventWheel, { passive: false });
    
    return () => {
      document.removeEventListener('wheel', preventWheel);
    };
  }, []);

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      data-no-swipe
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        touchAction: 'none',
      }}
    >
      <div
        className="w-full max-w-2xl rounded-xl overflow-hidden mx-4"
        style={{
          backgroundColor: colors.bg,
          boxShadow: `0 0 30px ${colors.primary}30`,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.border }}>
          <h3 className="font-semibold" style={{ color: colors.primary }}>{t('title')}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-sm rounded-lg transition-colors"
              style={{ color: colors.muted }}
            >
              {t('reset')}
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm rounded-lg transition-colors"
              style={{ color: colors.muted }}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleCrop}
              className="px-4 py-1.5 text-sm font-medium rounded-lg transition-colors"
              style={{ 
                backgroundColor: colors.primary,
                color: '#000',
              }}
            >
              {t('confirm')}
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div 
          ref={containerRef}
          className="relative p-4 flex items-center justify-center"
          style={{ minHeight: 300, maxHeight: '50vh' }}
        >
          {!imageLoaded ? (
            <div className="flex items-center justify-center">
              <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
            </div>
          ) : (
            <div
              className="relative"
              style={{ width: displayDimensions.width, height: displayDimensions.height, touchAction: 'none' }}
            >
              {/* 原图 - 作为背景 */}
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                className="absolute inset-0"
                style={{
                  width: displayDimensions.width,
                  height: displayDimensions.height,
                }}
                draggable={false}
              />

              {/* 半透明遮罩层覆盖整个图片 */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
              />

              {/* 遮罩层 - 显示选中区域 */}
              <div className="absolute inset-0 pointer-events-none">
                {/* 上 */}
                <div 
                  className="absolute bg-black/60"
                  style={{ 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    height: cropArea.y,
                  }}
                />
                {/* 下 */}
                <div 
                  className="absolute bg-black/60"
                  style={{ 
                    top: cropArea.y + cropArea.height, 
                    left: 0, 
                    right: 0, 
                    bottom: 0,
                  }}
                />
                {/* 左 */}
                <div 
                  className="absolute bg-black/60"
                  style={{ 
                    top: cropArea.y, 
                    left: 0, 
                    width: cropArea.x, 
                    height: cropArea.height,
                  }}
                />
                {/* 右 */}
                <div 
                  className="absolute bg-black/60"
                  style={{ 
                    top: cropArea.y, 
                    left: cropArea.x + cropArea.width, 
                    right: 0, 
                    height: cropArea.height,
                  }}
                />
              </div>

              {/* 清晰原图层 - 使用 clip-path 显示选中区域 */}
              <img
                src={imageSrc}
                alt="Selected area"
                className="absolute inset-0 z-5 pointer-events-none"
                style={{
                  width: displayDimensions.width,
                  height: displayDimensions.height,
                  clipPath: `polygon(
                    ${cropArea.x}px ${cropArea.y}px,
                    ${cropArea.x + cropArea.width}px ${cropArea.y}px,
                    ${cropArea.x + cropArea.width}px ${cropArea.y + cropArea.height}px,
                    ${cropArea.x}px ${cropArea.y + cropArea.height}px
                  )`,
                }}
                draggable={false}
              />

              {/* 裁剪区域边框 */}
              <div
                className="absolute border-2 cursor-move z-10"
                style={{
                  left: cropArea.x,
                  top: cropArea.y,
                  width: cropArea.width,
                  height: cropArea.height,
                  borderColor: colors.primary,
                  touchAction: 'none',
                }}
                onMouseDown={(e) => handleMouseDown(e)}
                onTouchStart={(e) => handleMouseDown(e)}
              >
                {/* 网格线 */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/3 left-0 right-0 border-t border-white/30" />
                  <div className="absolute top-2/3 left-0 right-0 border-t border-white/30" />
                  <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/30" />
                  <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/30" />
                </div>
              </div>

              {/* 调整手柄 - 最高层级，确保触摸事件优先处理 */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none', touchAction: 'none' }}>
                <div style={{ position: 'absolute', top: cropArea.y - 22, left: cropArea.x - 22, pointerEvents: 'auto', touchAction: 'none' }}>
                  <ResizeHandle position="nw" colors={colors} onHandleStart={handleMouseDown} />
                </div>
                <div style={{ position: 'absolute', top: cropArea.y - 22, left: cropArea.x + cropArea.width - 22, pointerEvents: 'auto', touchAction: 'none' }}>
                  <ResizeHandle position="ne" colors={colors} onHandleStart={handleMouseDown} />
                </div>
                <div style={{ position: 'absolute', top: cropArea.y + cropArea.height - 22, left: cropArea.x - 22, pointerEvents: 'auto', touchAction: 'none' }}>
                  <ResizeHandle position="sw" colors={colors} onHandleStart={handleMouseDown} />
                </div>
                <div style={{ position: 'absolute', top: cropArea.y + cropArea.height - 22, left: cropArea.x + cropArea.width - 22, pointerEvents: 'auto', touchAction: 'none' }}>
                  <ResizeHandle position="se" colors={colors} onHandleStart={handleMouseDown} />
                </div>
                <div style={{ position: 'absolute', top: cropArea.y - 22, left: cropArea.x + cropArea.width / 2 - 22, pointerEvents: 'auto', touchAction: 'none' }}>
                  <ResizeHandle position="n" colors={colors} onHandleStart={handleMouseDown} />
                </div>
                <div style={{ position: 'absolute', top: cropArea.y + cropArea.height - 22, left: cropArea.x + cropArea.width / 2 - 22, pointerEvents: 'auto', touchAction: 'none' }}>
                  <ResizeHandle position="s" colors={colors} onHandleStart={handleMouseDown} />
                </div>
                <div style={{ position: 'absolute', top: cropArea.y + cropArea.height / 2 - 22, left: cropArea.x - 22, pointerEvents: 'auto', touchAction: 'none' }}>
                  <ResizeHandle position="w" colors={colors} onHandleStart={handleMouseDown} />
                </div>
                <div style={{ position: 'absolute', top: cropArea.y + cropArea.height / 2 - 22, left: cropArea.x + cropArea.width - 22, pointerEvents: 'auto', touchAction: 'none' }}>
                  <ResizeHandle position="e" colors={colors} onHandleStart={handleMouseDown} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hints */}
        <div className="px-4 pb-4 text-xs text-center" style={{ color: colors.muted }}>
          {t('dragHint')} · {t('resizeHint')}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
