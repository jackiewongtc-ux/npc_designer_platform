import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import PaymentForm from './PaymentForm';
import { membershipPaymentService } from '../../../services/membershipPayment';
import { supabase } from '../../../lib/supabase';

const RegistrationSteps = ({ initialStep = 1 }) => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [clientSecret, setClientSecret] = useState(null);
  const [membershipFee, setMembershipFee] = useState(10);
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  const [currentStep, setCurrentStep] = useState(initialStep);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    bio: '',
    rewardSelection: null
  });

  // Fetch membership fee on mount
  useEffect(() => {
    const fetchMembershipFee = async () => {
      try {
        const fee = await membershipPaymentService?.getMembershipFee();
        setMembershipFee(fee);
      } catch (error) {
        console.error('Error fetching membership fee:', error);
      }
    };
    fetchMembershipFee();
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData?.email || !formData?.password || !formData?.confirmPassword) {
      setError('All fields are required');
      return false;
    }
    if (formData?.password !== formData?.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData?.password?.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData?.username) {
      setError('Username is required');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleAccountSetupComplete = async () => {
    try {
      await signUp(
        formData?.email,
        formData?.password,
        formData?.username,
        formData?.bio
      );
      
      // Show success message
      alert('Registration successful! Please check your email for verification link.');
      navigate('/login');
    } catch (err) {
      setError(err?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleRewardSelection = async (selection) => {
    setFormData(prev => ({ ...prev, rewardSelection: selection }));
    setIsCreatingPaymentIntent(true);

    try {
      // Create payment intent for membership
      const { user } = await supabase?.auth?.getUser();
      
      const membershipData = {
        rewardSelection: selection,
        amount: membershipFee,
        currency: 'SGD'
      };

      const userInfo = {
        userId: user?.user?.id,
        email: formData?.email,
        username: formData?.username
      };

      const paymentData = await membershipPaymentService?.createMembershipPaymentIntent(
        membershipData,
        userInfo
      );

      setClientSecret(paymentData?.clientSecret);
      setCurrentStep(3); // Move to payment step
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setErrors({ submit: error?.message || 'Failed to initialize payment. Please try again.' });
    } finally {
      setIsCreatingPaymentIntent(false);
    }
  };

  const handlePaymentSuccess = async (paymentResult) => {
    try {
      // Update user profile to mark as member
      const { user } = await supabase?.auth?.getUser();
      
      if (user?.user?.id) {
        const { error: updateError } = await supabase?.from('user_profiles')?.update({
            is_member: true,
            membership_signup_date: new Date()?.toISOString(),
            membership_auto_renew: true
          })?.eq('id', user?.user?.id);

        if (updateError) {
          console.error('Error updating member status:', updateError);
        }
      }

      setSuccess(true);
      setSuccessMessage('Welcome to NPC! Your membership is now active.');
      
      // Redirect to member hub after 2 seconds
      setTimeout(() => {
        navigate('/member-hub-dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error completing registration:', error);
      setErrors({ submit: 'Payment successful but account setup incomplete. Please contact support.' });
    }
  };

  const handlePaymentError = (error) => {
    setErrors({ submit: error?.message || 'Payment failed. Please try again.' });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateStep2()) return;
    
    setError('');
    setLoading(true);

    try {
      await handleAccountSetupComplete();
    } catch (err) {
      setError(err?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const renderAccountSetup = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <Input
          type="email"
          placeholder="your.email@example.com"
          value={formData?.email}
          onChange={(e) => handleChange('email', e?.target?.value)}
          required
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <Input
          type="password"
          placeholder="Minimum 6 characters"
          value={formData?.password}
          onChange={(e) => handleChange('password', e?.target?.value)}
          required
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirm Password
        </label>
        <Input
          type="password"
          placeholder="Re-enter your password"
          value={formData?.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e?.target?.value)}
          required
          className="w-full"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button
        type="button"
        onClick={handleNextStep}
        className="w-full"
      >
        Next
      </Button>
    </div>
  );

  const renderRewardSelection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Choose Your Welcome Gift</h2>
        <p className="text-gray-600 mt-2">
          Select your preferred membership reward
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Digital Bundle Option */}
        <button
          type="button"
          onClick={() => handleRewardSelection('digital_bundle')}
          disabled={isCreatingPaymentIntent}
          className={`
            relative p-6 border-2 rounded-lg text-left transition-all
            ${formData?.rewardSelection === 'digital_bundle' ?'border-blue-600 bg-blue-50' :'border-gray-200 hover:border-gray-300'}
            ${isCreatingPaymentIntent ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <Icon name="Gift" className="text-blue-600" size={24} />
                <h3 className="text-lg font-semibold text-gray-900">
                  2x $6 Vouchers
                </h3>
              </div>
              <p className="text-gray-600 mt-3 text-sm">
                Get two $6 discount vouchers to use on any design pre-orders. Perfect for backing multiple projects!
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <Icon name="Check" className="text-green-600 mr-2" size={16} />
                  <span>Instant digital delivery</span>
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Icon name="Check" className="text-green-600 mr-2" size={16} />
                  <span>Valid for 1 year</span>
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Icon name="Check" className="text-green-600 mr-2" size={16} />
                  <span>Use on any design</span>
                </li>
              </ul>
            </div>
            {formData?.rewardSelection === 'digital_bundle' && (
              <Icon name="CheckCircle" className="text-blue-600 flex-shrink-0" size={24} />
            )}
          </div>
        </button>

        {/* Merchandise Option */}
        <button
          type="button"
          onClick={() => handleRewardSelection('merchandise')}
          disabled={isCreatingPaymentIntent}
          className={`
            relative p-6 border-2 rounded-lg text-left transition-all
            ${formData?.rewardSelection === 'merchandise' ?'border-blue-600 bg-blue-50' :'border-gray-200 hover:border-gray-300'}
            ${isCreatingPaymentIntent ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <Icon name="Package" className="text-blue-600" size={24} />
                <h3 className="text-lg font-semibold text-gray-900">
                  Exclusive Merchandise
                </h3>
              </div>
              <p className="text-gray-600 mt-3 text-sm">
                Receive a limited-edition NPC branded item. Show your community pride with style!
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <Icon name="Check" className="text-green-600 mr-2" size={16} />
                  <span>Limited edition item</span>
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Icon name="Check" className="text-green-600 mr-2" size={16} />
                  <span>Free shipping included</span>
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Icon name="Check" className="text-green-600 mr-2" size={16} />
                  <span>Exclusive member design</span>
                </li>
              </ul>
            </div>
            {formData?.rewardSelection === 'merchandise' && (
              <Icon name="CheckCircle" className="text-blue-600 flex-shrink-0" size={24} />
            )}
          </div>
        </button>
      </div>

      {isCreatingPaymentIntent && (
        <div className="text-center py-4">
          <Icon name="Loader2" className="animate-spin mx-auto text-blue-600" size={24} />
          <p className="text-gray-600 mt-2">Preparing payment...</p>
        </div>
      )}

      {errors?.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors?.submit}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}
    </div>
  );

  const renderPayment = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Complete Your Payment</h2>
        <p className="text-gray-600 mt-2">
          Annual membership fee: <span className="font-semibold">{membershipPaymentService?.formatAmount(membershipFee * 100, 'SGD')}</span>
        </p>
      </div>

      {/* Selected Reward Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Icon 
            name={formData?.rewardSelection === 'digital_bundle' ? 'Gift' : 'Package'} 
            className="text-blue-600" 
            size={24} 
          />
          <div>
            <p className="text-sm font-medium text-gray-900">Selected Reward:</p>
            <p className="text-sm text-gray-600">
              {formData?.rewardSelection === 'digital_bundle' ? '2x $6 Vouchers' : 'Exclusive Merchandise'}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <PaymentForm
        clientSecret={clientSecret}
        amount={membershipFee * 100} // Convert to cents
        currency="SGD"
        membershipData={{
          rewardSelection: formData?.rewardSelection,
          amount: membershipFee
        }}
        userInfo={{
          email: formData?.email,
          username: formData?.username
        }}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />

      {errors?.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors?.submit}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm ${step >= 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
            Account Info
          </span>
          <span className={`text-sm ${step >= 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
            Profile Details
          </span>
        </div>
        <div className="relative h-2 bg-gray-200 rounded-full">
          <div 
            className="absolute h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-lg p-8">
        {currentStep === 1 && renderAccountSetup()}
        {currentStep === 2 && renderRewardSelection()}
        {currentStep === 3 && renderPayment()}
      </div>
    </div>
  );
};

export default RegistrationSteps;