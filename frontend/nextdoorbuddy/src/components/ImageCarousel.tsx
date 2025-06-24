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

    // Filtrer les images valides
    const validImages = images.filter(img => img && img.trim() !== '');
    
    if (validImages.length === 0) {
        return null;
    }

    // Si une seule image, afficher sans carousel
    if (validImages.length === 1) {
        return (
            <img
                src={getImageUrl(validImages[0]) || ''}
                alt={alt}
                className={className}
                onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                }}
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

    return (
        <div className="relative">
            {/* Image principale */}
            <div className="relative overflow-hidden rounded-lg">
                <img
                    src={getImageUrl(validImages[currentIndex]) || ''}
                    alt={`${alt} - Image ${currentIndex + 1}`}
                    className={className}
                    onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                    }}
                />
                
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
                    {validImages.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => goToImage(index)}
                            className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                                index === currentIndex 
                                    ? 'border-blue-500' 
                                    : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            <img
                                src={getImageUrl(image) || ''}
                                alt={`${alt} - Miniature ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                }}
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageCarousel;
