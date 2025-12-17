/**
 * 图片处理工具函数
 * 包括: 加载、旋转、裁剪、压缩
 */

/**
 * 从 File 对象加载图片
 */
export function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * 从 Base64 字符串加载图片
 */
export function loadImageFromBase64(base64: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = base64;
    });
}

/**
 * 旋转图片
 * @param image 原始图片
 * @param degrees 旋转角度 (0, 90, 180, 270)
 * @returns 旋转后的图片 Base64
 */
export function rotateImage(image: HTMLImageElement, degrees: number): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // 90度或270度时宽高互换
    const isVertical = degrees === 90 || degrees === 270;
    canvas.width = isVertical ? image.height : image.width;
    canvas.height = isVertical ? image.width : image.height;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((degrees * Math.PI) / 180);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * 裁剪图片
 * @param image 原始图片
 * @param cropArea 裁剪区域 {x, y, width, height} 相对于原图的比例 (0-1)
 * @returns 裁剪后的图片 Base64
 */
export function cropImage(
    image: HTMLImageElement,
    cropArea: { x: number; y: number; width: number; height: number }
): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // 计算实际裁剪区域（像素）
    const sx = Math.round(cropArea.x * image.width);
    const sy = Math.round(cropArea.y * image.height);
    const sw = Math.round(cropArea.width * image.width);
    const sh = Math.round(cropArea.height * image.height);

    canvas.width = sw;
    canvas.height = sh;

    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);

    return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * 压缩图片
 * @param image 原始图片
 * @param maxSize 长边最大尺寸 (默认 1024)
 * @param quality JPEG 质量 (默认 0.85)
 * @returns 压缩后的图片 Base64
 */
export function compressImage(
    image: HTMLImageElement,
    maxSize: number = 1024,
    quality: number = 0.85
): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // 计算目标尺寸
    let { width, height } = image;
    const ratio = width / height;

    if (width > height) {
        if (width > maxSize) {
            width = maxSize;
            height = Math.round(width / ratio);
        }
    } else {
        if (height > maxSize) {
            height = maxSize;
            width = Math.round(height * ratio);
        }
    }

    canvas.width = width;
    canvas.height = height;

    // 绘制并压缩
    ctx.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL('image/jpeg', quality);
}

/**
 * 完整的图片处理流程：旋转 → 裁剪 → 压缩
 */
export async function processImage(
    imageBase64: string,
    rotation: number,
    cropArea: { x: number; y: number; width: number; height: number }
): Promise<string> {
    // 1. 加载原图
    let image = await loadImageFromBase64(imageBase64);

    // 2. 如果需要旋转
    if (rotation !== 0) {
        const rotatedBase64 = rotateImage(image, rotation);
        image = await loadImageFromBase64(rotatedBase64);
    }

    // 3. 裁剪
    const croppedBase64 = cropImage(image, cropArea);
    const croppedImage = await loadImageFromBase64(croppedBase64);

    // 4. 压缩
    const compressedBase64 = compressImage(croppedImage, 1024, 0.85);

    return compressedBase64;
}

/**
 * 获取 Base64 图片的大小（字节）
 */
export function getBase64Size(base64: string): number {
    // 移除 data:image/xxx;base64, 前缀
    const base64Data = base64.split(',')[1] || base64;
    // 计算实际字节数
    return Math.round((base64Data.length * 3) / 4);
}
