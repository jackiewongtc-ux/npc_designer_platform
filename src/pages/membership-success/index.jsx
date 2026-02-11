import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const MembershipSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  
  const sessionId = searchParams?.get('session_id');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('validating'); // validating, creating_account, linking_payment, success

  useEffect(() => {
    const handleMembershipSuccess = async () => {
      if (!sessionId) {
        setError('No checkout session found. Please try signing up again.');
        setLoading(false);
        return;
      }

      try {
        // Step 1: Get pending registration data
        setStep('validating');
        const pendingRegistration = sessionStorage.getItem('pendingRegistration');
        
        if (!pendingRegistration) {
          // User already has account, just redirect to dashboard
          console.log('No pending registration found, redirecting to dashboard');
          navigate('/member-hub-dashboard?session_id=' + sessionId);
          return;
        }

        const registrationData = JSON.parse(pendingRegistration);
        
        // Step 2: Create user account
        setStep('creating_account');
        console.log('🔐 Creating user account after successful payment...');
        
        const authData = await signUp(
          registrationData?.email,
          registrationData?.password,
          registrationData?.username,
          ''
        );

        if (!authData?.user?.id) {
          throw new Error('Failed to create user account');
        }

        console.log('✅ User account created:', authData.user.id);

        // Step 3: Link payment to user
        setStep('linking_payment');
        console.log('🔗 Linking payment to user account...');
        
        const { data: linkData, error: linkError } = await supabase.functions.invoke(
          'link-payment-to-user',
          {
            body: {
              sessionId,
              userId: authData.user.id
            }
          }
        );

        if (linkError) {
          console.error('❌ Error linking payment:', linkError);
          throw new Error('Failed to link payment to account: ' + linkError.message);
        }

        console.log('✅ Payment linked successfully');

        // Step 4: Clean up and redirect
        setStep('success');
        sessionStorage.removeItem('pendingRegistration');
        
        // Wait a bit to show success message
        setTimeout(() => {
          navigate('/member-hub-dashboard');
        }, 2000);

      } catch (err) {
        console.error('❌ Membership setup error:', err);
        setError(err?.message || 'Failed to complete membership setup. Please contact support.');
        setLoading(false);
      }
    };

    handleMembershipSuccess();
  }, [sessionId, signUp, navigate]);

  const getStepMessage = () => {
    switch (step) {
      case 'validating':
        return 'Validating payment...';
      case 'creating_account':
        return 'Creating your account...';
      case 'linking_payment':
        return 'Setting up your membership...';
      case 'success':
        return 'Success! Redirecting to your dashboard...';
      default:
        return 'Processing...';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Icon name="AlertCircle" size={48} className="text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Setup Error</h1>
            <p className="text-muted-foreground mb-8">{error}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate('/register')} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => navigate('/login')}>
                Go to Login
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          {/* Loading Animation */}
          <div className="relative mb-6">
            {step === 'success' ? (
              <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                  <Icon name="Check" size={48} className="text-white" />
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            )}
          </div>

          {/* Status Message */}
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {step === 'success' ? 'Welcome to NPC Designer! 🎉' : 'Setting Up Your Account'}
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            {getStepMessage()}
          </p>

          {/* Progress Steps */}
          <div className="max-w-md mx-auto">
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-lg ${
                ['creating_account', 'linking_payment', 'success'].includes(step) 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-blue-50 border border-blue-200'
              }`}>
                <Icon 
                  name={['creating_account', 'linking_payment', 'success'].includes(step) ? 'Check' : 'Clock'} 
                  size={20} 
                  className={
                    ['creating_account', 'linking_payment', 'success'].includes(step) 
                      ? 'text-green-600' 
                      : 'text-blue-600'
                  } 
                />
                <span className={`text-sm font-medium ${
                  ['creating_account', 'linking_payment', 'success'].includes(step) 
                    ? 'text-green-900' 
                    : 'text-blue-900'
                }`}>
                  Payment Verified
                </span>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-lg ${
                ['linking_payment', 'success'].includes(step) 
                  ? 'bg-green-50 border border-green-200' 
                  : step === 'creating_account'
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <Icon 
                  name={['linking_payment', 'success'].includes(step) ? 'Check' : step === 'creating_account' ? 'Clock' : 'Circle'} 
                  size={20} 
                  className={
                    ['linking_payment', 'success'].includes(step) 
                      ? 'text-green-600' 
                      : step === 'creating_account'
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  } 
                />
                <span className={`text-sm font-medium ${
                  ['linking_payment', 'success'].includes(step) 
                    ? 'text-green-900' 
                    : step === 'creating_account'
                    ? 'text-blue-900'
                    : 'text-gray-500'
                }`}>
                  Account Created
                </span>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-lg ${
                step === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : step === 'linking_payment'
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <Icon 
                  name={step === 'success' ? 'Check' : step === 'linking_payment' ? 'Clock' : 'Circle'} 
                  size={20} 
                  className={
                    step === 'success' 
                      ? 'text-green-600' 
                      : step === 'linking_payment'
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  } 
                />
                <span className={`text-sm font-medium ${
                  step === 'success' 
                    ? 'text-green-900' 
                    : step === 'linking_payment'
                    ? 'text-blue-900'
                    : 'text-gray-500'
                }`}>
                  Membership Activated
                </span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
            <div className="flex items-start space-x-3">
              <Icon name="Info" className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">
                  What's happening?
                </p>
                <p className="text-sm text-blue-800">
                  We're setting up your account and activating your membership. This should only take a few seconds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MembershipSuccess;
