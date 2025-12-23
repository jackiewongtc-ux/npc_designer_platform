import React, { useState } from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';

const ImageGallery = ({ images = [] }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!images || images?.length === 0) {
    return (
      <div className="w-full h-[600px] bg-muted rounded-lg flex items-center justify-center">
        <Icon name="ImageOff" size={48} color="var(--color-muted-foreground)" />
      </div>
    );
  }

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images?.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images?.length - 1 ? 0 : prev + 1));
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-card rounded-lg overflow-hidden border border-border">
        <div className="relative h-[600px] overflow-hidden">
          <Image
            src={images?.[selectedIndex]?.url}
            alt={images?.[selectedIndex]?.alt}
            className={`w-full h-full object-contain transition-transform duration-300 ${
              isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={toggleZoom}
          />
          
          {images?.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors duration-200 border border-border"
                aria-label="Previous image"
              >
                <Icon name="ChevronLeft" size={20} />
              </button>
              
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors duration-200 border border-border"
                aria-label="Next image"
              >
                <Icon name="ChevronRight" size={20} />
              </button>
            </>
          )}

          <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-full text-sm font-medium border border-border">
            {selectedIndex + 1} / {images?.length}
          </div>
        </div>
      </div>
      {images?.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images?.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                selectedIndex === index
                  ? 'border-accent' :'border-border hover:border-muted-foreground'
              }`}
            >
              <Image
                src={image?.url}
                alt={image?.alt}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;