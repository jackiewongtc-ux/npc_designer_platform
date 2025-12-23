import { useState, useEffect } from 'react';
import { designService } from '../../../services/designService';
import ImageUploader from './ImageUploader';
import { supabase } from '../../../lib/supabase';

export default function SubmissionForm({ onSubmissionComplete, existingSubmission = null }) {
  const [formData, setFormData] = useState({
    title: existingSubmission?.title || '',
    description: existingSubmission?.description || '',
    category: existingSubmission?.category || '',
    materials: existingSubmission?.materials || '',
    sizingInfo: existingSubmission?.sizingInfo || '',
    productionNotes: existingSubmission?.productionNotes || '',
    imageUrls: existingSubmission?.imageUrls || []
  });

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (user) setUserId(user?.id);
    };
    getUser();
  }, []);

  const categories = designService?.getCategories();

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData?.title?.trim()) return 'Title is required';
    if (formData?.title?.length < 3) return 'Title must be at least 3 characters';
    if (!formData?.description?.trim()) return 'Description is required';
    if (!formData?.category) return 'Category is required';
    if (formData?.imageUrls?.length === 0) return 'At least one image is required';
    return null;
  };

  const handleSaveDraft = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (existingSubmission) {
        await designService?.updateSubmission(existingSubmission?.id, formData);
      } else {
        await designService?.createSubmission(formData);
      }
      
      if (onSubmissionComplete) {
        onSubmissionComplete();
      }
    } catch (err) {
      setError(err?.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let submissionId = existingSubmission?.id;

      // Create or update first
      if (existingSubmission) {
        await designService?.updateSubmission(existingSubmission?.id, formData);
      } else {
        const created = await designService?.createSubmission(formData);
        submissionId = created?.id;
      }

      // Then submit for review
      await designService?.submitForReview(submissionId);

      if (onSubmissionComplete) {
        onSubmissionComplete();
      }
    } catch (err) {
      setError(err?.message || 'Failed to submit design');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Design Title *
        </label>
        <input
          type="text"
          value={formData?.title}
          onChange={(e) => handleChange('title', e?.target?.value)}
          maxLength={100}
          placeholder="Enter a catchy title for your design"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData?.title?.length}/100 characters
        </p>
      </div>
      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={formData?.description}
          onChange={(e) => handleChange('description', e?.target?.value)}
          rows={4}
          placeholder="Describe your design concept, inspiration, and unique features"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories?.map((cat) => (
            <button
              key={cat?.value}
              type="button"
              onClick={() => handleChange('category', cat?.value)}
              className={`p-4 border-2 rounded-lg text-center transition-colors ${
                formData?.category === cat?.value
                  ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">{cat?.icon}</div>
              <div className="text-sm font-medium">{cat?.label}</div>
            </button>
          ))}
        </div>
      </div>
      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Design Images *
        </label>
        <ImageUploader
          currentImages={formData?.imageUrls}
          onImagesUpdate={(urls) => handleChange('imageUrls', urls)}
          userId={userId}
        />
      </div>
      {/* Materials */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Materials
        </label>
        <input
          type="text"
          value={formData?.materials}
          onChange={(e) => handleChange('materials', e?.target?.value)}
          placeholder="e.g., Organic cotton, recycled polyester"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      {/* Sizing Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sizing Information
        </label>
        <input
          type="text"
          value={formData?.sizingInfo}
          onChange={(e) => handleChange('sizingInfo', e?.target?.value)}
          placeholder="e.g., Available in XS-XXL, true to size"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      {/* Production Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Production Notes
        </label>
        <textarea
          value={formData?.productionNotes}
          onChange={(e) => handleChange('productionNotes', e?.target?.value)}
          rows={3}
          placeholder="Any special requirements or notes for production"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      {/* Action Buttons */}
      <div className="flex gap-4 pt-4 border-t">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={saving || submitting}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || submitting}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit for Review'}
        </button>
      </div>
    </div>
  );
}