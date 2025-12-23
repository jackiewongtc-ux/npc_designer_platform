import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ChevronRight, ChevronLeft, Check, Loader2, Instagram } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/profileService';
import { UsernameInput } from './components/UsernameInput';
import { BodyMeasurementsInput } from './components/BodyMeasurementsInput';
import { ProfileBenefitsPanel } from './components/ProfileBenefitsPanel';

export default function ProfileCompletion() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [usernameError, setUsernameError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    bodyMeasurements: '',
    igHandle: ''
  });

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const profile = await profileService?.getCurrentProfile();
      
      // Check if profile is already complete
      if (profile?.username && profile?.bio && profile?.bodyMeasurements && profile?.igHandle) {
        navigate('/member-hub-dashboard');
        return;
      }

      // Pre-fill existing data
      setFormData({
        username: profile?.username || '',
        bio: profile?.bio || '',
        bodyMeasurements: profile?.bodyMeasurements || '',
        igHandle: profile?.igHandle || ''
      });
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletionPercentage = () => {
    let completed = 0;
    if (formData?.username) completed += 25;
    if (formData?.bio) completed += 25;
    if (formData?.bodyMeasurements) completed += 25;
    if (formData?.igHandle) completed += 25;
    return completed;
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData?.username) {
      setError('Username is required');
      return;
    }
    if (currentStep === 1 && usernameError) {
      setError('Please fix username errors');
      return;
    }
    setError('');
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handleSkip = () => {
    navigate('/member-hub-dashboard');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!formData?.username) {
      setError('Username is required');
      setCurrentStep(1);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await profileService?.completeProfileSetup({
        username: formData?.username,
        bio: formData?.bio,
        bodyMeasurements: formData?.bodyMeasurements,
        igHandle: formData?.igHandle
      });

      navigate('/member-hub-dashboard', { 
        state: { message: 'Profile completed successfully! Welcome to the community.' } 
      });
    } catch (err) {
      console.error('Profile completion error:', err);
      setError(err?.message || 'Failed to complete profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Username', required: true },
    { number: 2, title: 'About You', required: false },
    { number: 3, title: 'Measurements', required: false },
    { number: 4, title: 'Instagram', required: false }
  ];

  return (
    <>
      <Helmet>
        <title>Complete Your Profile - NPC Designer</title>
        <meta name="description" content="Complete your profile to unlock personalized features and community benefits" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-600">
              Set up your profile to unlock community features and personalized recommendations
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              {steps?.map((step, index) => (
                <React.Fragment key={step?.number}>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep === step?.number
                        ? 'bg-purple-600 text-white scale-110'
                        : currentStep > step?.number
                        ? 'bg-green-500 text-white' :'bg-gray-200 text-gray-600'
                    }`}>
                      {currentStep > step?.number ? <Check className="w-5 h-5" /> : step?.number}
                    </div>
                    <span className={`text-xs mt-2 hidden sm:block ${
                      currentStep === step?.number ? 'text-purple-600 font-semibold' : 'text-gray-600'
                    }`}>
                      {step?.title}
                      {step?.required && <span className="text-red-500">*</span>}
                    </span>
                  </div>
                  {index < steps?.length - 1 && (
                    <div className={`h-0.5 w-12 sm:w-24 ${
                      currentStep > step?.number ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Step 1: Username */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Username</h2>
                        <p className="text-gray-600 text-sm">
                          This will be your unique identity in the NPC Designer community
                        </p>
                      </div>

                      <UsernameInput
                        value={formData?.username}
                        onChange={(value) => setFormData({ ...formData, username: value })}
                        error={usernameError}
                        setError={setUsernameError}
                      />

                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 text-sm">Why username matters:</h3>
                        <ul className="space-y-1 text-xs text-gray-700">
                          <li>• Appears on all your designs and votes</li>
                          <li>• How other members will find and tag you</li>
                          <li>• Cannot be changed once set</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Bio */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell Us About Yourself</h2>
                        <p className="text-gray-600 text-sm">
                          Share your design interests and what brings you to the community
                        </p>
                      </div>

                      <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                          Bio
                        </label>
                        <textarea
                          id="bio"
                          value={formData?.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e?.target?.value })}
                          rows={5}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          placeholder="Tell the community about your style, favorite designs, or what you're looking for..."
                          maxLength={500}
                        />
                        <div className="flex justify-between mt-1">
                          <p className="text-xs text-gray-500">Optional but recommended for community engagement</p>
                          <p className="text-xs text-gray-500">{formData?.bio?.length}/500</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Body Measurements */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Body Measurements</h2>
                        <p className="text-gray-600 text-sm">
                          Help us provide accurate Size Advisor recommendations
                        </p>
                      </div>

                      <BodyMeasurementsInput
                        value={formData?.bodyMeasurements}
                        onChange={(value) => setFormData({ ...formData, bodyMeasurements: value })}
                      />
                    </div>
                  )}

                  {/* Step 4: Instagram */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Instagram</h2>
                        <p className="text-gray-600 text-sm">
                          Link your Instagram for community discovery and verification
                        </p>
                      </div>

                      <div>
                        <label htmlFor="igHandle" className="block text-sm font-medium text-gray-700 mb-2">
                          Instagram Handle
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Instagram className="w-5 h-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            id="igHandle"
                            value={formData?.igHandle}
                            onChange={(e) => setFormData({ ...formData, igHandle: e?.target?.value })}
                            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="your_instagram_handle"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Without the @ symbol
                        </p>
                      </div>

                      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 text-sm">Benefits of connecting:</h3>
                        <ul className="space-y-1 text-xs text-gray-700">
                          <li>• Get discovered by designers and brands</li>
                          <li>• Qualify for community model opportunities</li>
                          <li>• Build your fashion portfolio</li>
                          <li>• Connect with like-minded fashion enthusiasts</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Skip for now
                    </button>

                    <div className="flex gap-3">
                      {currentStep > 1 && (
                        <button
                          type="button"
                          onClick={handleBack}
                          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Back
                        </button>
                      )}

                      {currentStep < 4 ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          disabled={currentStep === 1 && (!formData?.username || usernameError)}
                          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={submitting || !formData?.username || usernameError}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Completing...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Complete Profile
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Benefits Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <ProfileBenefitsPanel completionPercentage={calculateCompletionPercentage()} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}