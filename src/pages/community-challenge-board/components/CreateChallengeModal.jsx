import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const CreateChallengeModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    deadline: '',
    moodboard: null
  });

  const [errors, setErrors] = useState({});

  const categoryOptions = [
    { value: 'streetwear', label: 'Streetwear' },
    { value: 'formal', label: 'Formal Wear' },
    { value: 'activewear', label: 'Activewear' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'footwear', label: 'Footwear' }
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e?.target?.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, moodboard: file }));
      if (errors?.moodboard) {
        setErrors(prev => ({ ...prev, moodboard: '' }));
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData?.title?.trim()) newErrors.title = 'Title is required';
    if (!formData?.description?.trim()) newErrors.description = 'Description is required';
    if (!formData?.category) newErrors.category = 'Category is required';
    if (!formData?.deadline) newErrors.deadline = 'Deadline is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (validate()) {
      onSubmit(formData);
      setFormData({
        title: '',
        description: '',
        category: '',
        deadline: '',
        moodboard: null
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Icon name="Plus" size={20} color="var(--color-accent)" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Create New Challenge</h2>
              <p className="text-sm text-muted-foreground">Share your design idea with the community</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-muted transition-colors flex items-center justify-center"
            aria-label="Close modal"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Challenge Title"
            type="text"
            placeholder="e.g., Sustainable Summer Collection"
            value={formData?.title}
            onChange={(e) => handleChange('title', e?.target?.value)}
            error={errors?.title}
            required
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description <span className="text-error">*</span>
            </label>
            <textarea
              value={formData?.description}
              onChange={(e) => handleChange('description', e?.target?.value)}
              placeholder="Describe your challenge idea in detail..."
              rows={4}
              className={`w-full px-3 py-2 rounded-md border ${
                errors?.description ? 'border-error' : 'border-input'
              } bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none`}
            />
            {errors?.description && (
              <p className="text-sm text-error mt-1">{errors?.description}</p>
            )}
          </div>

          <Select
            label="Category"
            options={categoryOptions}
            value={formData?.category}
            onChange={(value) => handleChange('category', value)}
            error={errors?.category}
            required
            placeholder="Select a category"
          />

          <Input
            label="Submission Deadline"
            type="date"
            value={formData?.deadline}
            onChange={(e) => handleChange('deadline', e?.target?.value)}
            error={errors?.deadline}
            required
            min={new Date()?.toISOString()?.split('T')?.[0]}
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Moodboard (Optional)
            </label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="moodboard-upload"
              />
              <label htmlFor="moodboard-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <Icon name="Upload" size={24} color="var(--color-muted-foreground)" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formData?.moodboard ? formData?.moodboard?.name : 'Click to upload'}
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              iconName="Send"
              iconPosition="left"
              fullWidth
            >
              Submit Challenge
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChallengeModal;