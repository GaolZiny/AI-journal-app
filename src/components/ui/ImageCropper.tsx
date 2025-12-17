import { Check, RotateCw, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { loadImage, processImage } from '../../utils/imageUtils';
import { Button } from './Button';

interface ImageCropperProps {
    file: File;
    onConfirm: (croppedImageBase64: string) => void;
    onCancel: () => void;
}

interface Position {
    x: number;
    y: number;
}

interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function ImageCropper({ file, onConfirm, onCancel }: ImageCropperProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [imageBase64, setImageBase64] = useState<string>('');
    const [rotation, setRotation] = useState(0);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
    const [processing, setProcessing] = useState(false);

    // 双指缩放相关
    const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
    const [initialScale, setInitialScale] = useState(1);

    // 裁剪框比例 3:4 (竖向)
    const CROP_RATIO = 3 / 4;

    // 加载图片
    useEffect(() => {
        const load = async () => {
            const img = await loadImage(file);
            setImage(img);

            // 保存原始 Base64
            const reader = new FileReader();
            reader.onload = (e) => {
                setImageBase64(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        };
        load();
    }, [file]);

    // 计算裁剪框尺寸
    const getCropBoxSize = useCallback(() => {
        if (!containerRef.current) return { width: 0, height: 0 };

        const containerWidth = containerRef.current.clientWidth - 40; // padding
        const containerHeight = containerRef.current.clientHeight - 40; // padding

        let cropWidth = containerWidth * 0.85;
        let cropHeight = cropWidth / CROP_RATIO;

        if (cropHeight > containerHeight * 0.7) {
            cropHeight = containerHeight * 0.7;
            cropWidth = cropHeight * CROP_RATIO;
        }

        return { width: cropWidth, height: cropHeight };
    }, []);

    // 绘制预览 - 支持高清屏
    useEffect(() => {
        if (!image || !canvasRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d')!;
        const container = containerRef.current;

        // 获取设备像素比
        const dpr = window.devicePixelRatio || 1;

        // 设置 canvas 实际尺寸（考虑 DPR）
        const displayWidth = container.clientWidth;
        const displayHeight = container.clientHeight - 20;

        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;

        // 设置 CSS 尺寸
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        // 缩放上下文以匹配 DPR
        ctx.scale(dpr, dpr);

        // 清空
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        // 计算图片显示尺寸 - 旋转后的逻辑尺寸
        const isVertical = rotation === 90 || rotation === 270;
        // 旋转后显示的逻辑尺寸（用于计算缩放比例）
        const logicalWidth = isVertical ? image.height : image.width;
        const logicalHeight = isVertical ? image.width : image.height;

        // 初始缩放使图片适应画布
        const scaleX = (displayWidth * 0.9) / logicalWidth;
        const scaleY = ((displayHeight - 40) * 0.9) / logicalHeight;
        const baseScale = Math.min(scaleX, scaleY);

        // 实际绘制尺寸（使用原始图片尺寸，旋转由 ctx.rotate 处理）
        const drawWidth = image.width * baseScale * scale;
        const drawHeight = image.height * baseScale * scale;

        // 计算绘制位置
        const centerX = displayWidth / 2 + position.x;
        const centerY = displayHeight / 2 + position.y;

        // 绘制图片（带旋转）- 始终使用原始图片尺寸绘制
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore();

        // 绘制半透明遮罩
        const cropBox = getCropBoxSize();
        const cropX = (displayWidth - cropBox.width) / 2;
        const cropY = (displayHeight - cropBox.height) / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, displayWidth, cropY); // 上
        ctx.fillRect(0, cropY + cropBox.height, displayWidth, displayHeight - cropY - cropBox.height); // 下
        ctx.fillRect(0, cropY, cropX, cropBox.height); // 左
        ctx.fillRect(cropX + cropBox.width, cropY, displayWidth - cropX - cropBox.width, cropBox.height); // 右

        // 绘制裁剪框边框
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(cropX, cropY, cropBox.width, cropBox.height);

        // 绘制角标
        const cornerSize = 20;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;

        // 左上
        ctx.beginPath();
        ctx.moveTo(cropX, cropY + cornerSize);
        ctx.lineTo(cropX, cropY);
        ctx.lineTo(cropX + cornerSize, cropY);
        ctx.stroke();

        // 右上
        ctx.beginPath();
        ctx.moveTo(cropX + cropBox.width - cornerSize, cropY);
        ctx.lineTo(cropX + cropBox.width, cropY);
        ctx.lineTo(cropX + cropBox.width, cropY + cornerSize);
        ctx.stroke();

        // 左下
        ctx.beginPath();
        ctx.moveTo(cropX, cropY + cropBox.height - cornerSize);
        ctx.lineTo(cropX, cropY + cropBox.height);
        ctx.lineTo(cropX + cornerSize, cropY + cropBox.height);
        ctx.stroke();

        // 右下
        ctx.beginPath();
        ctx.moveTo(cropX + cropBox.width - cornerSize, cropY + cropBox.height);
        ctx.lineTo(cropX + cropBox.width, cropY + cropBox.height);
        ctx.lineTo(cropX + cropBox.width, cropY + cropBox.height - cornerSize);
        ctx.stroke();

    }, [image, rotation, scale, position, getCropBoxSize]);

    // 旋转
    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
        setPosition({ x: 0, y: 0 }); // 重置位置
        setScale(1); // 重置缩放
    };

    // 计算两点之间的距离
    const getDistance = (touch1: React.Touch, touch2: React.Touch): number => {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // 鼠标/触摸事件 - 开始拖动
    const handleDragStart = (clientX: number, clientY: number) => {
        setIsDragging(true);
        setDragStart({ x: clientX - position.x, y: clientY - position.y });
    };

    // 鼠标/触摸事件 - 拖动中
    const handleDragMove = (clientX: number, clientY: number) => {
        if (!isDragging) return;
        setPosition({
            x: clientX - dragStart.x,
            y: clientY - dragStart.y
        });
    };

    // 鼠标/触摸事件 - 结束拖动
    const handleDragEnd = () => {
        setIsDragging(false);
        setInitialPinchDistance(null);
    };

    // 鼠标事件
    const handleMouseDown = (e: React.MouseEvent) => {
        handleDragStart(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        handleDragMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
        handleDragEnd();
    };

    // 触摸事件 - 支持双指缩放
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            // 单指拖动
            handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
        } else if (e.touches.length === 2) {
            // 双指缩放开始
            e.preventDefault();
            const distance = getDistance(e.touches[0], e.touches[1]);
            setInitialPinchDistance(distance);
            setInitialScale(scale);
            setIsDragging(false);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 1 && isDragging) {
            // 单指拖动
            handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
        } else if (e.touches.length === 2 && initialPinchDistance !== null) {
            // 双指缩放
            e.preventDefault();
            const currentDistance = getDistance(e.touches[0], e.touches[1]);
            const scaleChange = currentDistance / initialPinchDistance;
            const newScale = Math.max(0.5, Math.min(3, initialScale * scaleChange));
            setScale(newScale);
        }
    };

    const handleTouchEnd = () => {
        handleDragEnd();
    };

    // 滚轮缩放
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale((prev) => Math.max(0.5, Math.min(3, prev + delta)));
    };

    // 确认裁剪
    const handleConfirm = async () => {
        if (!image || !canvasRef.current || !containerRef.current) return;

        setProcessing(true);

        try {
            const container = containerRef.current;
            const displayWidth = container.clientWidth;
            const displayHeight = container.clientHeight - 20;
            const cropBox = getCropBoxSize();

            // 计算裁剪区域相对于原图的位置
            const isVertical = rotation === 90 || rotation === 270;
            // 旋转后显示的逻辑尺寸
            const logicalWidth = isVertical ? image.height : image.width;
            const logicalHeight = isVertical ? image.width : image.height;

            const scaleX = (displayWidth * 0.9) / logicalWidth;
            const scaleY = ((displayHeight - 40) * 0.9) / logicalHeight;
            const baseScale = Math.min(scaleX, scaleY);

            // 绘制尺寸（使用原始图片尺寸）
            const drawWidth = image.width * baseScale * scale;
            const drawHeight = image.height * baseScale * scale;

            const centerX = displayWidth / 2 + position.x;
            const centerY = displayHeight / 2 + position.y;

            const cropX = (displayWidth - cropBox.width) / 2;
            const cropY = (displayHeight - cropBox.height) / 2;

            // 将裁剪框位置转换为相对于原图的比例
            const imgLeft = centerX - drawWidth / 2;
            const imgTop = centerY - drawHeight / 2;

            const cropArea: CropArea = {
                x: Math.max(0, (cropX - imgLeft) / drawWidth),
                y: Math.max(0, (cropY - imgTop) / drawHeight),
                width: Math.min(1, cropBox.width / drawWidth),
                height: Math.min(1, cropBox.height / drawHeight)
            };

            // 确保裁剪区域有效
            cropArea.x = Math.min(cropArea.x, 1 - cropArea.width);
            cropArea.y = Math.min(cropArea.y, 1 - cropArea.height);

            // 处理图片
            const result = await processImage(imageBase64, rotation, cropArea);
            onConfirm(result);
        } catch (error) {
            console.error('Image processing error:', error);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
            {/* 头部 */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
                <h3 className="text-white font-medium">调整识别区域</h3>
                <button
                    onClick={handleRotate}
                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                    title="旋转 90°"
                >
                    <RotateCw className="w-5 h-5 text-white" />
                </button>
            </div>

            {/* 画布区域 */}
            <div
                ref={containerRef}
                className="flex-1 overflow-hidden touch-none"
            >
                <canvas
                    ref={canvasRef}
                    className="cursor-move"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onWheel={handleWheel}
                />
            </div>

            {/* 提示文字 */}
            <p className="text-center text-gray-400 text-sm py-2">
                拖动图片调整位置，滚轮/捏合缩放
            </p>

            {/* 底部按钮 */}
            <div className="flex gap-4 px-4 py-4 bg-gray-800">
                <Button
                    variant="secondary"
                    onClick={onCancel}
                    disabled={processing}
                    className="flex-1"
                    icon={<X className="w-4 h-4" />}
                >
                    取消
                </Button>
                <Button
                    onClick={handleConfirm}
                    loading={processing}
                    className="flex-1"
                    icon={<Check className="w-4 h-4" />}
                >
                    确认识别
                </Button>
            </div>
        </div>
    );
}
