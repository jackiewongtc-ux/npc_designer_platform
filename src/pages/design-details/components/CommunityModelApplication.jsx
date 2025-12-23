import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const CommunityModelApplication = ({ designId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    instagram: "",
    portfolio: "",
    message: ""
  });

  const handleSubmit = (e) => {
    e?.preventDefault();
    console.log("Model application submitted:", formData);
    alert("Your application has been submitted successfully!");
    setIsExpanded(false);
    setFormData({
      name: "",
      email: "",
      instagram: "",
      portfolio: "",
      message: ""
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e?.target?.name]: e?.target?.value
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Icon name="Camera" size={20} />
          Community Model Program
        </h3>
        <Button
          variant="outline"
          size="sm"
          iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
          iconPosition="right"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Hide" : "Apply"}
        </Button>
      </div>
      {!isExpanded && (
        <p className="text-sm text-muted-foreground">
          Showcase this design in your lookbook and earn rewards. Apply to become a community model for this design.
        </p>
      )}
      {isExpanded && (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Input
            label="Full Name"
            type="text"
            name="name"
            placeholder="Enter your name"
            value={formData?.name}
            onChange={handleChange}
            required
          />

          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="your.email@example.com"
            value={formData?.email}
            onChange={handleChange}
            required
          />

          <Input
            label="Instagram Handle"
            type="text"
            name="instagram"
            placeholder="@yourusername"
            value={formData?.instagram}
            onChange={handleChange}
          />

          <Input
            label="Portfolio URL"
            type="url"
            name="portfolio"
            placeholder="https://your-portfolio.com"
            value={formData?.portfolio}
            onChange={handleChange}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Why do you want to model this design?
            </label>
            <textarea
              name="message"
              rows={4}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Tell us about your interest in this design..."
              value={formData?.message}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => setIsExpanded(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              fullWidth
              iconName="Send"
              iconPosition="left"
            >
              Submit Application
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CommunityModelApplication;