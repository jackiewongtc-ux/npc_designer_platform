import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { membershipPaymentService } from '../../services/membershipPayment';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import MembershipTierCard from './components/MembershipTierCard';
import PasswordStrengthIndicator from './components/PasswordStrengthIndicator';
import CommunityBenefitsPanel from './components/CommunityBenefitsPanel';
import RegistrationSteps from './components/RegistrationSteps';
import PaymentForm from './components/PaymentForm';


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
      // Step 1: Create user account
      const { data: authData, error: signUpError } = await signUp(
        formData?.email,
        formData?.password,
        formData?.username,
        '' // bio
      );

      if (signUpError) {
        throw new Error(signUpError?.message || 'Failed to create account');
      }

      // Step 2: Create Stripe checkout session for membership
      const selectedTier = formData?.selectedTier || membershipTiers?.[0];
      
      const checkoutData = await membershipPaymentService?.createMembershipCheckout({
        userId: authData?.user?.id,
        priceId: selectedTier?.stripePriceId,
        email: formData?.email
      });

      // Step 3: Redirect to Stripe checkout
      if (checkoutData?.url) {
        window.location.href = checkoutData?.url;
      } else {
        throw new Error('Failed to create checkout session');
      }

    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ 
        submit: error?.message || 'Registration failed. Please try again.' 
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

  const handlePaymentDataChange = (data) => {
    setFormData((prev) => ({
      ...prev,
      paymentData: { ...prev?.paymentData, ...data }
    }));
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

                {currentStep === 1 &&
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
                }

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
                        Payment Information
                      </h2>
                      <p className="text-sm text-muted-foreground mb-6">
                        Complete your registration with secure payment
                      </p>
                    </div>

                    {formData?.selectedTier && (
                      <div className="p-4 bg-muted/50 border border-border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">
                              {formData?.selectedTier?.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Billed annually • Auto-renews • Cancel anytime
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">
                              SGD {formData?.selectedTier?.price?.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">per year</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <PaymentForm onPaymentDataChange={handlePaymentDataChange} />

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
                      error={errors?.terms} />

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
                      error={errors?.privacy} />

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
                    iconName={currentStep === 3 ? 'Check' : 'ChevronRight'}
                    iconPosition="right"
                  >
                    {currentStep === 3 ? 
                      (isLoading ? 'Creating Account...' : 'Complete Registration') : 
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