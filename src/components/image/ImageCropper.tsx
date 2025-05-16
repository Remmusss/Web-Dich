import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { FiUpload, FiDownload, FiRotateCw, FiRefreshCw, FiMaximize, FiCrop, FiImage, FiEye } from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';

const ImageCropper = () => {
    const { t } = useLanguage();
    const [imgSrc, setImgSrc] = useState<string>('');
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [crop, setCrop] = useState<Crop>({
        unit: '%',
        width: 50,
        height: 50,
        x: 25,
        y: 25,
    });
    const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
    const [rotation, setRotation] = useState(0);
    const [scale, setScale] = useState(1);
    const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [cropWidth, setCropWidth] = useState<number>(0);
    const [cropHeight, setCropHeight] = useState<number>(0);
    const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string>('');
    const [showLivePreview, setShowLivePreview] = useState(true);
    const livePreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);

    // Handle file upload
    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImgSrc(reader.result?.toString() || '');
                setCroppedImageUrl(null);
                setFileName(file.name);
            });
            reader.readAsDataURL(file);
        }
    };

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.match('image.*')) {
                const reader = new FileReader();
                reader.addEventListener('load', () => {
                    setImgSrc(reader.result?.toString() || '');
                    setCroppedImageUrl(null);
                    setFileName(file.name);
                });
                reader.readAsDataURL(file);
            }
        }
    };

    // Toggle live preview
    const toggleLivePreview = () => {
        setShowLivePreview(!showLivePreview);
    };

    // Update canvas preview for final crop
    const updateCanvasPreview = useCallback(() => {
        if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
            return;
        }

        const image = imgRef.current;
        const canvas = previewCanvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return;
        }

        // Calculate scaled dimensions
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        const pixelRatio = window.devicePixelRatio;

        canvas.width = completedCrop.width * scaleX * pixelRatio;
        canvas.height = completedCrop.height * scaleY * pixelRatio;

        // Set display dimensions
        canvas.style.width = `${completedCrop.width}px`;
        canvas.style.height = `${completedCrop.height}px`;

        ctx.scale(pixelRatio, pixelRatio);
        ctx.imageSmoothingQuality = 'high';

        // Apply rotation and scaling transformations
        const cropX = completedCrop.x * scaleX;
        const cropY = completedCrop.y * scaleY;
        const cropWidth = completedCrop.width * scaleX;
        const cropHeight = completedCrop.height * scaleY;

        ctx.save();

        // Move to center for rotation
        const centerX = canvas.width / (2 * pixelRatio);
        const centerY = canvas.height / (2 * pixelRatio);

        ctx.translate(centerX, centerY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);

        // Draw the cropped image
        ctx.drawImage(
            image,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            completedCrop.width,
            completedCrop.height
        );

        ctx.restore();

    }, [completedCrop, rotation, scale]);

    // Update live preview canvas
    const updateLivePreview = useCallback(() => {
        if (!crop || !livePreviewCanvasRef.current || !imgRef.current || !showLivePreview) {
            return;
        }

        const image = imgRef.current;
        const canvas = livePreviewCanvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return;
        }

        // Calculate scaled dimensions
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        const pixelRatio = window.devicePixelRatio;
        
        // Set canvas dimensions
        const previewSize = 150 * pixelRatio;
        canvas.width = previewSize;
        canvas.height = previewSize;
        
        // Set display size
        canvas.style.width = '150px';
        canvas.style.height = '150px';

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Fill with checkerboard pattern for transparency
        const squareSize = 8;
        for (let x = 0; x < canvas.width; x += squareSize) {
            for (let y = 0; y < canvas.height; y += squareSize) {
                ctx.fillStyle = (x + y) % (squareSize * 2) === 0 ? '#f0f0f0' : '#e0e0e0';
                ctx.fillRect(x, y, squareSize, squareSize);
            }
        }

        ctx.save();
        
        // Scale to fit preview
        const cropAspect = crop.width / crop.height;
        let drawWidth, drawHeight;
        
        if (cropAspect >= 1) {
            // Landscape or square
            drawWidth = previewSize;
            drawHeight = previewSize / cropAspect;
        } else {
            // Portrait
            drawHeight = previewSize;
            drawWidth = previewSize * cropAspect;
        }
        
        // Center the preview
        const drawX = (previewSize - drawWidth) / 2;
        const drawY = (previewSize - drawHeight) / 2;
        
        // Apply scaling and rotation
        ctx.translate(previewSize / 2, previewSize / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);
        ctx.translate(-previewSize / 2, -previewSize / 2);
        
        // Draw the cropped image
        const cropX = crop.x * scaleX;
        const cropY = crop.y * scaleY;
        const cropWidth = crop.width * scaleX;
        const cropHeight = crop.height * scaleY;
        
        ctx.drawImage(
            image,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            drawX, 
            drawY,
            drawWidth,
            drawHeight
        );
        
        ctx.restore();

    }, [crop, rotation, scale, showLivePreview]);

    useEffect(() => {
        updateCanvasPreview();
    }, [updateCanvasPreview]);

    useEffect(() => {
        updateLivePreview();
    }, [updateLivePreview]);

    // Update crop dimensions when crop changes
    useEffect(() => {
        if (completedCrop && imgRef.current) {
            const image = imgRef.current;
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;
            
            setCropWidth(Math.round(completedCrop.width * scaleX));
            setCropHeight(Math.round(completedCrop.height * scaleY));
        }
    }, [completedCrop]);

    // Handle aspect ratio change
    const handleAspectRatioChange = (ratio: number | undefined) => {
        setAspectRatio(ratio);
        
        if (ratio && imgRef.current) {
            // Calculate new crop with the same center but with new aspect ratio
            const currentCenterX = crop.x + crop.width / 2;
            const currentCenterY = crop.y + crop.height / 2;
            
            let newWidth = crop.width;
            let newHeight = newWidth / (ratio || 1);
            
            // Make sure the new crop fits within the image
            if (newHeight > 100) {
                newHeight = 100;
                newWidth = newHeight * (ratio || 1);
            }
            
            setCrop({
                unit: '%',
                width: newWidth,
                height: newHeight,
                x: Math.max(0, currentCenterX - newWidth / 2),
                y: Math.max(0, currentCenterY - newHeight / 2)
            });
        }
    };

    // Generate cropped image
    const generateCroppedImage = () => {
        if (!previewCanvasRef.current) {
            return;
        }

        const canvas = previewCanvasRef.current;
        canvas.toBlob((blob) => {
            if (!blob) {
                return;
            }
            const croppedImageUrl = URL.createObjectURL(blob);
            setCroppedImageUrl(croppedImageUrl);

            // Clean up previous URL if it exists
            return () => {
                if (croppedImageUrl) {
                    URL.revokeObjectURL(croppedImageUrl);
                }
            };
        });
    };

    // Download cropped image
    const downloadCroppedImage = () => {
        if (!croppedImageUrl) {
            return;
        }

        // Extract file extension from original filename or default to png
        const fileExtension = fileName.split('.').pop() || 'png';
        const fileNameWithoutExt = fileName.split('.').slice(0, -1).join('.') || 'cropped-image';
        
        const link = document.createElement('a');
        link.download = `${fileNameWithoutExt}-cropped.${fileExtension}`;
        link.href = croppedImageUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Reset all changes
    const resetChanges = () => {
        setRotation(0);
        setScale(1);
        setCrop({
            unit: '%',
            width: 50,
            height: 50,
            x: 25,
            y: 25,
        });
        setCroppedImageUrl(null);
        setAspectRatio(undefined);
    };

    // Common aspect ratios
    const aspectRatios = [
        { label: "1:1", value: 1 },
        { label: "4:3", value: 4 / 3 },
        { label: "16:9", value: 16 / 9 },
        { label: "3:2", value: 3 / 2 },
        { label: "2:3", value: 2 / 3 },
        { label: "Free", value: undefined }
    ];

    return (
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-5xl mx-auto mb-8">
            <h1 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center">
                <FiCrop className="mr-2" />
                {t('imageCropper.title') || 'Image Cropper'}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Column - Upload and Options */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Upload Section */}
                    <div 
                        className={`flex flex-col items-center px-4 py-8 rounded-xl cursor-pointer transition-colors ${isDragging
                                ? 'bg-gray-50 border-2 border-dashed border-gray-400' 
                                : 'bg-gray-50 border-2 border-dashed border-gray-300 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                            <FiUpload className="text-gray-500 w-6 h-6" />
                        </div>
                        <span className="text-gray-700 font-medium mb-2">
                            {t('imageCropper.uploadInstruction') || 'Click or drag to upload image'}
                        </span>
                        <span className="text-gray-500 text-sm mb-4">
                            JPG, PNG, WEBP (max 10MB)
                        </span>
                        <label className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors cursor-pointer">
                            {t('common.browse') || 'Browse Files'}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={onSelectFile}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {imgSrc && (
                        <>
                            {/* Image Info and Controls */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-base font-medium mb-3 text-gray-700 flex items-center">
                                    <FiImage className="mr-2" /> 
                                    {t('common.imageInfo') || 'Image Info'}
                                </h3>
                                {fileName && (
                                    <div className="text-sm text-gray-600 mb-2">
                                        <span className="font-medium">File: </span>{fileName}
                                    </div>
                                )}
                                <div className="text-sm text-gray-600 mb-2">
                                    <span className="font-medium">Crop: </span>
                                    {cropWidth} × {cropHeight} px
                                </div>
                            </div>

                            {/* Aspect Ratio Controls */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-base font-medium mb-3 text-gray-700 flex items-center">
                                    <FiMaximize className="mr-2" />
                                    {t('imageCropper.aspectRatio') || 'Aspect Ratio'}
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {aspectRatios.map((ratio) => (
                                        <button
                                            key={ratio.label}
                                            onClick={() => handleAspectRatioChange(ratio.value)}
                                            className={`px-3 py-2 text-sm rounded-lg transition-colors ${(ratio.value === aspectRatio || (ratio.value === undefined && aspectRatio === undefined))
                                                ? 'bg-gray-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            {ratio.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Transform Controls */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-base font-medium mb-3 text-gray-700">
                                    {t('common.adjustments') || 'Adjustments'}
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                                            <span>{t('imageCropper.rotation') || 'Rotation'}</span>
                                            <span className="text-gray-500">{rotation}°</span>
                                        </label>
                                        <div className="flex items-center">
                                            <FiRotateCw className="text-gray-500 mr-2" />
                                            <input
                                                type="range"
                                                min="0"
                                                max="360"
                                                value={rotation}
                                                onChange={(e) => setRotation(Number(e.target.value))}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                                            <span>{t('imageCropper.scale') || 'Scale'}</span>
                                            <span className="text-gray-500">{scale.toFixed(1)}x</span>
                                        </label>
                                        <div className="flex items-center">
                                            <FiRefreshCw className="text-gray-500 mr-2" />
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="2"
                                                step="0.1"
                                                value={scale}
                                                onChange={(e) => setScale(Number(e.target.value))}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={generateCroppedImage}
                                    className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors w-full font-medium"
                                >
                                    <FiCrop className="mr-2" />
                                    {t('imageCropper.crop') || 'Crop Image'}
                                </button>
                                
                                {croppedImageUrl && (
                                    <button
                                        onClick={downloadCroppedImage}
                                        className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full font-medium"
                                    >
                                        <FiDownload className="mr-2" />
                                        {t('imageCropper.download') || 'Download'}
                                    </button>
                                )}
                                
                                <button
                                    onClick={resetChanges}
                                    className="flex items-center justify-center px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors w-full font-medium"
                                >
                                    <FiRefreshCw className="mr-2" />
                                    {t('imageCropper.reset') || 'Reset'}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Right Column - Image Preview */}
                <div className="lg:col-span-3">
                    {imgSrc ? (
                        <div className="space-y-6">
                            {/* Main Cropping Area */}
                            <div className="bg-[#f8f9fb] rounded-xl overflow-hidden p-4 border border-gray-200">
                                <h3 className="text-base font-medium mb-3 text-gray-700">
                                    {t('imageCropper.cropImage') || 'Crop Image'}
                                </h3>
                                <div className="flex items-center justify-center bg-[#ecedf1] rounded-lg overflow-hidden">
                                    <ReactCrop
                                        crop={crop}
                                        onChange={(c) => setCrop(c)}
                                        onComplete={(c) => setCompletedCrop(c)}
                                        aspect={aspectRatio}
                                        className="max-h-[500px]"
                                    >
                                        <img
                                            ref={imgRef}
                                            src={imgSrc}
                                            alt="Upload"
                                            style={{
                                                transform: `scale(${scale}) rotate(${rotation}deg)`,
                                                maxWidth: '100%',
                                                maxHeight: '500px',
                                            }}
                                            className="transition-transform duration-150"
                                        />
                                    </ReactCrop>
                                </div>
                            </div>
                            
                            {/* Live Preview under main crop area */}
                            <div className="bg-[#f8f9fb] rounded-xl overflow-hidden p-4 border border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-base font-medium text-gray-700 flex items-center">
                                        <FiEye className="mr-2" />
                                        {t('imageCropper.livePreview') || 'Live Preview'}
                                    </h3>
                                    <button
                                        onClick={toggleLivePreview}
                                        className={`text-xs px-2 py-1 rounded ${showLivePreview ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                                    >
                                        {showLivePreview ? (t('common.hide') || 'Hide') : (t('common.show') || 'Show')}
                                    </button>
                                </div>
                                
                                <div className="flex justify-center">
                                    {showLivePreview ? (
                                        <div className="w-[150px] h-[150px] overflow-hidden rounded-lg shadow-sm border border-gray-200 bg-[#ecedf1]">
                                            <canvas
                                                ref={livePreviewCanvasRef}
                                                className="w-full h-full"
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 py-4">
                                            {t('common.previewHidden') || 'Preview is hidden'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Final Preview Area (only show after cropping) */}
                            {croppedImageUrl && (
                                <div className="bg-[#f8f9fb] rounded-xl overflow-hidden p-4 border border-gray-200">
                                    <h3 className="text-base font-medium mb-3 text-gray-700">
                                        {t('imageCropper.preview') || 'Preview'}
                                    </h3>
                                    <div className="flex items-center justify-center bg-[#ecedf1] rounded-lg overflow-hidden p-4">
                                        <img 
                                            src={croppedImageUrl} 
                                            alt="Cropped Preview" 
                                            className="max-h-[300px] shadow-md"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                            <div className="space-y-4">
                                <FiImage className="w-16 h-16 text-gray-400 mx-auto" />
                                <h3 className="text-xl font-medium text-gray-700">
                                    {t('common.noImageSelected') || 'No Image Selected'}
                                </h3>
                                <p className="text-gray-500">
                                    {t('common.uploadPrompt') || 'Upload an image to start cropping'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Hidden canvas for processing the cropped image */}
            <canvas
                ref={previewCanvasRef}
                style={{ display: 'none' }}
            />
        </div>
    );
};

export default ImageCropper; 