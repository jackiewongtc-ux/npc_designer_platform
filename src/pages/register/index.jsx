import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { membershipPaymentService } from '../../services/membershipPayment';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import MembershipTierCard from './components/MembershipTierCard';
import PasswordStrengthIndicator from './components/PasswordStrengthIndicator';
import CommunityBenefitsPanel from './components/CommunityBenefitsPanel';
import RegistrationSteps from './components/RegistrationSteps';
import Icon from '../../components/AppIcon';



const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    selectedTier: null,
    interests: [],
    socialMedia: {
      instagram: '',
      twitter: '',
      portfolio: ''
    },
    agreeToTerms: false,
    agreeToPrivacy: false
  });

  const [errors, setErrors] = useState({});

  // CRITICAL FIX: Single membership tier only
  const membershipTiers = [
    {
      name: 'NPC Membership',
      subtitle: 'Auto-renews annually. Cancel anytime.',
      price: 10.00,
      currency: 'SGD',
      billingCycle: 'year',
      popular: true,
      stripePriceId: import.meta.env?.VITE_STRIPE_MEMBERSHIP_PRICE_ID, // Add this to .env
      benefits: [
        'Access to exclusive design challenges',
        'Vote on community designs',
        'Submit your own designs',
        'Connect with fellow designers',
        'Annual membership benefits',
        'Priority support',
        'Community events access'
      ]
    }
  ];

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData?.username?.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData?.username?.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData?.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData?.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData?.password) {
      newErrors.password = 'Password is required';
    } else if (formData?.password?.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData?.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData?.password !== formData?.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const validateStep2 = () => {
    // Auto-select the only tier if not already selected
    if (!formData?.selectedTier) {
      setFormData(prev => ({ ...prev, selectedTier: membershipTiers?.[0] }));
    }
    setErrors({});
    return true;
  };

  const validateStep3 = () => {
    if (!formData?.agreeToTerms) {
      setErrors({ terms: 'You must agree to the Terms of Service' });
      return false;
    }
    if (!formData?.agreeToPrivacy) {
      setErrors({ privacy: 'You must agree to the Privacy Policy' });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    } else if (currentStep === 3) {
      isValid = validateStep3();
    }

    if (isValid) {
      if (currentStep === 3) {
        handleSubmit();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      console.log('🚀 Starting Stripe Checkout session creation');

      // NEW FLOW: Create checkout session FIRST without user account
      const selectedTier = formData?.selectedTier || membershipTiers?.[0];
      
      console.log('💳 Creating Stripe checkout session with temporary data:', {
        priceId: selectedTier?.stripePriceId,
        email: formData?.email,
        username: formData?.username
      });

      // Store registration data in sessionStorage for after payment
      sessionStorage.setItem('pendingRegistration', JSON.stringify({
        email: formData?.email,
        password: formData?.password,
        username: formData?.username,
        socialMedia: formData?.socialMedia
      }));

      // Create checkout session WITHOUT userId (guest checkout)
      const checkoutData = await membershipPaymentService?.createMembershipCheckout({
        priceId: selectedTier?.stripePriceId,
        email: formData?.email,
        metadata: {
          username: formData?.username,
          registrationFlow: 'true'
        }
      });

      console.log('🔍 Checkout session created:', {
        hasUrl: !!checkoutData?.url,
        url: checkoutData?.url
      });

      // Redirect to Stripe Checkout immediately
      if (checkoutData?.url) {
        console.log('✅ Redirecting to Stripe Checkout');
        window.location.href = checkoutData?.url;
      } else {
        throw new Error('Failed to create checkout session - no URL returned');
      }

    } catch (error) {
      console.error('❌ Checkout creation error:', error);
      setErrors({ 
        submit: error?.message || 'Failed to start checkout. Please try again.' 
      });
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleTierSelect = (tier) => {
    setFormData((prev) => ({ ...prev, selectedTier: tier }));
    if (errors?.tier) {
      setErrors((prev) => ({ ...prev, tier: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="main-content pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Join the Creative Community
            </h1>
            <p className="text-muted-foreground">
              Start your journey as a designer or community member today
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-lg p-6 lg:p-8">
                <div className="lg:hidden mb-6">
                  <RegistrationSteps currentStep={currentStep} />
                </div>

                {currentStep === 1 && (
                <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground mb-4">
                        Create Your Account
                      </h2>
                      <p className="text-sm text-muted-foreground mb-6">
                        Enter your details to get started with NPC Designer
                      </p>
                    </div>

                    <Input
                    label="Username"
                    type="text"
                    placeholder="Choose a unique username"
                    value={formData?.username}
                    onChange={(e) => handleInputChange('username', e?.target?.value)}
                    error={errors?.username}
                    required />


                    <Input
                    label="Email Address"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData?.email}
                    onChange={(e) => handleInputChange('email', e?.target?.value)}
                    error={errors?.email}
                    required />


                    <div>
                      <Input
                      label="Password"
                      type="password"
                      placeholder="Create a strong password"
                      value={formData?.password}
                      onChange={(e) => handleInputChange('password', e?.target?.value)}
                      error={errors?.password}
                      required />

                      <PasswordStrengthIndicator password={formData?.password} />
                    </div>

                    <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Re-enter your password"
                    value={formData?.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e?.target?.value)}
                    error={errors?.confirmPassword}
                    required />


                    <div className="pt-4 border-t border-border">
                      <h3 className="text-sm font-semibold text-foreground mb-4">
                        Social Media (Optional)
                      </h3>
                      <div className="space-y-4">
                        <Input
                        label="Instagram"
                        type="text"
                        placeholder="@yourusername"
                        value={formData?.socialMedia?.instagram}
                        onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          socialMedia: { ...prev?.socialMedia, instagram: e?.target?.value }
                        }))
                        } />

                        <Input
                        label="Twitter/X"
                        type="text"
                        placeholder="@yourusername"
                        value={formData?.socialMedia?.twitter}
                        onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          socialMedia: { ...prev?.socialMedia, twitter: e?.target?.value }
                        }))
                        } />

                        <Input
                        label="Portfolio Website"
                        type="url"
                        placeholder="https://yourportfolio.com"
                        value={formData?.socialMedia?.portfolio}
                        onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          socialMedia: { ...prev?.socialMedia, portfolio: e?.target?.value }
                        }))
                        } />

                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground mb-4">
                        Membership Plan
                      </h2>
                      <p className="text-sm text-muted-foreground mb-6">
                        Join our creative community with annual membership
                      </p>
                    </div>

                    {errors?.tier && (
                      <div className="p-4 bg-error/10 border border-error/20 rounded-lg">
                        <p className="text-sm text-error">{errors?.tier}</p>
                      </div>
                    )}

                    {/* Single tier display */}
                    <div className="max-w-2xl mx-auto">
                      {membershipTiers?.map((tier) => (
                        <MembershipTierCard
                          key={tier?.name}
                          tier={tier}
                          isSelected={formData?.selectedTier?.name === tier?.name}
                          onSelect={() => handleTierSelect(tier)}
                        />
                      ))}
                    </div>

                    <div className="bg-muted/30 border border-border rounded-lg p-4 mt-6">
                      <h3 className="text-sm font-semibold text-foreground mb-2">
                        What You Get:
                      </h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• SGD 10 per year (auto-renews annually)</li>
                        <li>• Full access to community features</li>
                        <li>• Cancel anytime from your account settings</li>
                      </ul>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground mb-4">
                        Complete Your Registration
                      </h2>
                      <p className="text-sm text-muted-foreground mb-6">
                        Review your details and proceed to secure payment
                      </p>
                    </div>

                    {/* Registration Summary */}
                    <div className="space-y-4">
                      {/* Account Details */}
                      <div className="p-4 bg-muted/30 border border-border rounded-lg">
                        <h3 className="text-sm font-semibold text-foreground mb-3">
                          Account Details
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Username:</span>
                            <span className="font-medium text-foreground">{formData?.username}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-medium text-foreground">{formData?.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Membership Summary */}
                      {formData?.selectedTier && (
                        <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-foreground">
                              {formData?.selectedTier?.name}
                            </h3>
                            <span className="px-2 py-1 bg-accent/20 text-accent text-xs font-semibold rounded">
                              SELECTED
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Billed annually • Auto-renews • Cancel anytime
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-foreground">
                                SGD {formData?.selectedTier?.price?.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">per year</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Payment Process Info */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <Icon name="Info" className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-blue-900">
                              What happens next?
                            </p>
                            <ul className="text-sm text-blue-800 space-y-1">
                              <li>1. You'll be redirected to Stripe secure checkout</li>
                              <li>2. Complete your payment with card details</li>
                              <li>3. Your account will be created automatically</li>
                              <li>4. You'll be redirected to your dashboard</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Terms Checkboxes */}
                    <div className="space-y-3 pt-4 border-t border-border">
                      <Checkbox
                        label={
                          <span className="text-sm">
                            I agree to the{' '}
                            <Link to="/terms" className="text-accent hover:underline">
                              Terms of Service
                            </Link>
                          </span>
                        }
                        checked={formData?.agreeToTerms}
                        onChange={(e) => {
                          handleInputChange('agreeToTerms', e?.target?.checked);
                        }}
                        error={errors?.terms}
                      />

                      <Checkbox
                        label={
                          <span className="text-sm">
                            I agree to the{' '}
                            <Link to="/privacy" className="text-accent hover:underline">
                              Privacy Policy
                            </Link>
                          </span>
                        }
                        checked={formData?.agreeToPrivacy}
                        onChange={(e) => {
                          handleInputChange('agreeToPrivacy', e?.target?.checked);
                        }}
                        error={errors?.privacy}
                      />
                    </div>

                    {/* Security Badge */}
                    <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground pt-2">
                      <Icon name="Shield" size={16} />
                      <span>Secured by Stripe • Your payment information is encrypted</span>
                    </div>
                  </div>
                )}

                {/* Show submission error if exists */}
                {errors?.submit && (
                  <div className="p-4 bg-error/10 border border-error/20 rounded-lg mb-6">
                    <p className="text-sm text-error">{errors?.submit}</p>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-border">
                  {currentStep > 1 ? (
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={isLoading}
                      iconName="ChevronLeft"
                      iconPosition="left"
                    >
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  <Button
                    variant="default"
                    onClick={handleNext}
                    loading={isLoading}
                    iconName={currentStep === 3 ? 'CreditCard' : 'ChevronRight'}
                    iconPosition="right"
                  >
                    {currentStep === 3 ? 
                      (isLoading ? 'Redirecting to Checkout...' : 'Proceed to Payment') : 
                      'Continue'
                    }
                  </Button>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/login" className="text-accent hover:underline font-medium">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="sticky top-24">
                <CommunityBenefitsPanel />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;