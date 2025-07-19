import React, { useState } from 'react';
import { getImageUrl } from '../utils/imageUtils';

interface ImageCarouselProps {
    images: string[];
    alt: string;
    className?: string;
    showThumbnails?: boolean;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
    images,
    alt,
    className = "w-full h-48 object-cover rounded-lg",
    showThumbnails = true
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

    // Safely filter valid images
    const validImages = React.useMemo(() => {
        try {
            if (!images || !Array.isArray(images)) {
                console.warn('ImageCarousel: Invalid images prop:', images);
                return [];
            }
            return images.filter(img => img && typeof img === 'string' && img.trim() !== '');
        } catch (error) {
            console.error('Error filtering images:', error);
            return [];
        }
    }, [images]);

    if (validImages.length === 0) {
        return null;
    }

    const handleImageError = (index: number) => {
        const imageUrl = validImages[index];
        const processedUrl = getImageUrl(imageUrl);
        console.error(`Image failed to load at index ${index}:`, {
            originalUrl: imageUrl,
            processedUrl: processedUrl,
            allImages: validImages
        });
        setImageErrors(prev => new Set(prev).add(index));
    };

    // Si une seule image, afficher sans carousel
    if (validImages.length === 1) {
        const imageUrl = getImageUrl(validImages[0]);
        if (!imageUrl || imageErrors.has(0)) {
            return (
                <div className={`${className} bg-gray-200 flex items-center justify-center`}>
                    <span className="text-gray-500 text-sm">Image non disponible</span>
                </div>
            );
        }

        return (
            <img
                src={imageUrl}
                alt={alt}
                className={className}
                onError={() => handleImageError(0)}
            />
        );
    }

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % validImages.length);
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
    };

    const goToImage = (index: number) => {
        setCurrentIndex(index);
    };

    const currentImageUrl = getImageUrl(validImages[currentIndex]);
    const hasCurrentImageError = imageErrors.has(currentIndex);

    return (
        <div className="relative">
            {/* Image principale */}
            <div className="relative overflow-hidden rounded-lg">
                {!currentImageUrl || hasCurrentImageError ? (
                    <div className={`${className} bg-gray-200 flex items-center justify-center`}>
                        <span className="text-gray-500 text-sm">Image non disponible</span>
                    </div>
                ) : (
                    <img
                        src={currentImageUrl}
                        alt={`${alt} - Image ${currentIndex + 1}`}
                        className={className}
                        onError={() => handleImageError(currentIndex)}
                    />
                )}
                
                {/* Boutons de navigation */}
                {validImages.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75 transition-opacity"
                            aria-label="Image précédente"
                        >
                            ‹
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75 transition-opacity"
                            aria-label="Image suivante"
                        >
                            ›
                        </button>
                    </>
                )}

                {/* Indicateur de position */}
                {validImages.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        {currentIndex + 1} / {validImages.length}
                    </div>
                )}
            </div>

            {/* Miniatures */}
            {showThumbnails && validImages.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto">
                    {validImages.map((image, index) => {
                        const thumbnailUrl = getImageUrl(image);
                        const hasThumbnailError = imageErrors.has(index);

                        return (
                            <button
                                key={index}
                                onClick={() => goToImage(index)}
                                className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                                    index === currentIndex
                                        ? 'border-blue-500'
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                {!thumbnailUrl || hasThumbnailError ? (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-400 text-xs">N/A</span>
                                    </div>
                                ) : (
                                    <img
                                        src={thumbnailUrl}
                                        alt={`${alt} - Miniature ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={() => handleImageError(index)}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ImageCarousel;
