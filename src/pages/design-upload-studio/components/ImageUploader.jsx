import { useState, useRef } from 'react';
import { designService } from '../../../services/designService';

export default function ImageUploader({ onImagesUpdate, currentImages = [], userId }) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (e?.type === 'dragenter' || e?.type === 'dragover') {
      setDragActive(true);
    } else if (e?.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setDragActive(false);

    const files = Array.from(e?.dataTransfer?.files);
    await handleFiles(files);
  };

  const handleFileInput = async (e) => {
    const files = Array.from(e?.target?.files);
    await handleFiles(files);
  };

  const handleFiles = async (files) => {
    if (!files?.length) return;

    setError('');
    setUploading(true);

    try {
      const uploadPromises = files?.map(file => 
        designService?.uploadImage(file, userId)
      );

      const results = await Promise.all(uploadPromises);
      const newImageUrls = results?.map(r => r?.url);
      
      onImagesUpdate([...currentImages, ...newImageUrls]);
    } catch (err) {
      setError(err?.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (imageUrl, index) => {
    try {
      // Extract path from URL for deletion
      const urlParts = imageUrl?.split('/');
      const path = urlParts?.slice(-2)?.join('/');
      
      await designService?.deleteImage(path);
      
      const newImages = currentImages?.filter((_, i) => i !== index);
      onImagesUpdate(newImages);
    } catch (err) {
      setError('Failed to remove image');
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50' :'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInput}
          className="hidden"
        />

        {uploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Uploading images...</p>
          </div>
        ) : (
          <>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => fileInputRef?.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Click to upload
              </button>
              <span className="text-gray-600"> or drag and drop</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              PNG, JPG, WEBP up to 10MB per image
            </p>
          </>
        )}
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {/* Image Preview Grid */}
      {currentImages?.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentImages?.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <img
                src={imageUrl}
                alt={`Design preview ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(imageUrl, index)}
                className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}