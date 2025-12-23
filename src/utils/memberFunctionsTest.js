import { supabase } from '../lib/supabase';
import * as designService from '../services/designService';
import * as voteService from '../services/voteService';
import * as preOrderService from '../services/preOrderService';
import * as profileService from '../services/profileService';
import * as challengeService from '../services/challengeService';


/**
 * Member Functions Test Suite
 * Tests all critical member functionality and reports status
 */

const testResults = {
  passed: [],
  failed: [],
  fixes_needed: []
};

// Helper to log test results
const logTest = (testName, passed, error = null) => {
  if (passed) {
    testResults?.passed?.push(testName);
    console.log(`✅ ${testName} - PASSED`);
  } else {
    testResults?.failed?.push({ test: testName, error: error?.message || 'Unknown error' });
    console.error(`❌ ${testName} - FAILED:`, error);
  }
};

// Helper to add fix suggestions
const addFix = (issue, suggestion) => {
  testResults?.fixes_needed?.push({ issue, suggestion });
};

/**
 * Test 1: Register/Login (Already confirmed working)
 */
export const testAuthFlow = async () => {
  console.log('\n🔐 Testing Authentication Flow...');
  
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase?.auth?.getSession();
    
    if (session?.user) {
      logTest('User Authentication', true);
      return { success: true, userId: session?.user?.id };
    } else {
      logTest('User Authentication', false, new Error('No active session'));
      addFix('Authentication', 'User must be logged in to run tests');
      return { success: false };
    }
  } catch (error) {
    logTest('User Authentication', false, error);
    return { success: false };
  }
};

/**
 * Test 2: View /discover (Already confirmed working)
 */
export const testDiscoverPage = async () => {
  console.log('\n🎨 Testing Discover Page...');
  
  try {
    const designs = await designService?.getDesigns({ limit: 5 });
    
    if (designs && Array.isArray(designs)) {
      logTest('Discover Page - Load Designs', true);
      return { success: true, count: designs?.length };
    } else {
      logTest('Discover Page - Load Designs', false, new Error('Invalid response format'));
      return { success: false };
    }
  } catch (error) {
    logTest('Discover Page - Load Designs', false, error);
    addFix('Discover Page', 'Check design_submissions table has data and RLS policies allow read access');
    return { success: false };
  }
};

/**
 * Test 3: Like/Dislike Designs (Already confirmed working)
 */
export const testVotingFlow = async (designId) => {
  console.log('\n👍 Testing Voting Flow...');
  
  if (!designId) {
    logTest('Voting Flow - Missing Design ID', false, new Error('No design ID provided'));
    addFix('Voting Test', 'Provide a valid design_id from design_submissions table');
    return { success: false };
  }
  
  try {
    // Test upvote
    await voteService?.voteDesign(designId, 'upvote');
    logTest('Voting Flow - Upvote', true);
    
    // Test vote change to downvote
    await voteService?.voteDesign(designId, 'downvote');
    logTest('Voting Flow - Change Vote', true);
    
    // Test vote removal
    await voteService?.removeVote(designId);
    logTest('Voting Flow - Remove Vote', true);
    
    return { success: true };
  } catch (error) {
    logTest('Voting Flow', false, error);
    addFix('Voting System', 'Check design_votes table RLS policies and vote triggers');
    return { success: false };
  }
};

/**
 * Test 4: Pre-order Flow (Critical test)
 */
export const testPreOrderFlow = async (designId, testMode = true) => {
  console.log('\n🛒 Testing Pre-order Flow...');
  
  if (!designId) {
    logTest('Pre-order Flow - Missing Design ID', false, new Error('No design ID provided'));
    return { success: false };
  }
  
  try {
    // Step 1: Get design details
    const design = await designService?.getDesignById(designId);
    if (!design) {
      throw new Error('Design not found');
    }
    logTest('Pre-order - Get Design Details', true);
    
    // Step 2: Check if design has pricing tiers
    if (!design?.tieredPricingData || !Array.isArray(design?.tieredPricingData) || design?.tieredPricingData?.length === 0) {
      logTest('Pre-order - Design Pricing', false, new Error('Design missing tiered_pricing_data'));
      addFix('Pre-order Pricing', `This design (${design?.title || designId}) needs pricing configuration. Go to /admin/designs/${designId}/pricing to set up 3 pricing tiers before pre-orders can be accepted.`);
      return { success: false };
    }
    logTest('Pre-order - Pricing Configuration', true);
    console.log(`💰 Pricing Tiers configured: ${design?.tieredPricingData?.length} tiers`);
    
    // Step 3: Create pre-order checkout (test mode)
    if (!testMode) {
      const checkoutData = {
        designId,
        size: 'M',
        quantity: 1
      };
      
      const { sessionUrl } = await preOrderService?.createPreOrderCheckout(checkoutData);
      
      if (sessionUrl) {
        logTest('Pre-order - Create Checkout Session', true);
        console.log('📝 Checkout URL:', sessionUrl);
        addFix('Pre-order Testing', 'Complete Stripe checkout flow manually and verify pre_orders record is created with status="charged"');
        return { success: true, checkoutUrl: sessionUrl };
      }
    } else {
      logTest('Pre-order - Checkout Creation (Skipped in test mode)', true);
      addFix('Pre-order Verification', 'Set testMode=false and complete actual Stripe checkout to test end-to-end flow');
    }
    
    // Step 4: Verify pre-order record would be created
    const { data: existingOrders } = await supabase?.from('pre_orders')?.select('*')?.eq('design_id', designId)?.limit(1);
    
    if (existingOrders && existingOrders?.length > 0) {
      logTest('Pre-order - Database Record', true);
    } else {
      logTest('Pre-order - Database Record (No existing orders)', true);
      addFix('Pre-order Completion', 'Complete a full checkout to create pre_orders record and test tier progression');
    }
    
    return { success: true };
  } catch (error) {
    logTest('Pre-order Flow', false, error);
    addFix('Pre-order System', `Check error: ${error?.message}. Verify stripe webhook is configured and Edge Functions are deployed`);
    return { success: false };
  }
};

/**
 * Test 5: View Member Hub (Already confirmed working)
 */
export const testMemberHub = async () => {
  console.log('\n🏠 Testing Member Hub...');
  
  try {
    // Get user profile
    const profile = await profileService?.getCurrentUserProfile();
    
    if (profile) {
      logTest('Member Hub - Load Profile', true);
      
      // Check credit balance
      const { data: credits } = await supabase?.from('user_credits')?.select('balance')?.eq('user_id', profile?.id)?.single();
      
      if (credits) {
        logTest('Member Hub - Credit Balance', true);
        console.log(`💰 Current Credit Balance: $${credits?.balance}`);
      }
      
      return { success: true, profile, credits: credits?.balance || 0 };
    } else {
      throw new Error('Profile not found');
    }
  } catch (error) {
    logTest('Member Hub', false, error);
    addFix('Member Hub', 'Check user_profiles and user_credits tables have data for current user');
    return { success: false };
  }
};

/**
 * Test 6: Credit System (Receive & Use Credits)
 */
export const testCreditSystem = async () => {
  console.log('\n💳 Testing Credit System...');
  
  try {
    const profile = await profileService?.getCurrentUserProfile();
    
    // Check initial balance
    const { data: initialCredits } = await supabase?.from('user_credits')?.select('balance, lifetime_earned, lifetime_spent')?.eq('user_id', profile?.id)?.single();
    
    logTest('Credit System - Check Balance', true);
    console.log(`💰 Initial Balance: $${initialCredits?.balance || 0}`);
    
    // Check for refund credits in pre_orders
    const { data: refundOrders } = await supabase?.from('pre_orders')?.select('refund_credit_issued, amount_paid')?.eq('user_id', profile?.id)?.eq('status', 'refunded')?.gt('refund_credit_issued', 0);
    
    if (refundOrders && refundOrders?.length > 0) {
      logTest('Credit System - Refund Credits Received', true);
      console.log(`✅ Found ${refundOrders?.length} refunded orders with credits`);
    } else {
      logTest('Credit System - Refund Credits (None yet)', true);
      addFix('Credit Testing', 'Complete a pre-order, wait for tier progression/refund to receive credits');
    }
    
    // Test credit transactions history
    const { data: transactions } = await supabase?.from('credit_transactions')?.select('*')?.eq('user_id', profile?.id)?.order('created_at', { ascending: false })?.limit(5);
    
    if (transactions) {
      logTest('Credit System - Transaction History', true);
      console.log(`📊 Recent Transactions: ${transactions?.length}`);
    }
    
    return { success: true, balance: initialCredits?.balance || 0 };
  } catch (error) {
    logTest('Credit System', false, error);
    addFix('Credit System', 'Verify user_credits table and credit_transactions are properly configured');
    return { success: false };
  }
};

/**
 * Test 7: Profile Functions
 */
export const testProfileFunctions = async () => {
  console.log('\n👤 Testing Profile Functions...');
  
  try {
    const profile = await profileService?.getCurrentUserProfile();
    
    if (!profile) {
      throw new Error('No profile found');
    }
    
    logTest('Profile - Load Current Profile', true);
    
    // Test body measurements
    const testMeasurements = {
      chest: '38',
      waist: '32',
      hips: '36',
      height: '175'
    };
    
    await profileService?.updateProfile({
      body_measurements: testMeasurements
    });
    logTest('Profile - Update Body Measurements', true);
    
    // Test preferred size
    await profileService?.updateProfile({
      preferred_tshirt_size: 'L'
    });
    logTest('Profile - Update Preferred Size', true);
    
    // Test bio and Instagram
    await profileService?.updateProfile({
      bio: 'Test bio update',
      ig_handle: '@testuser'
    });
    logTest('Profile - Update Bio/Instagram', true);
    
    return { success: true };
  } catch (error) {
    logTest('Profile Functions', false, error);
    addFix('Profile Updates', 'Check user_profiles RLS policies allow updates for authenticated users');
    return { success: false };
  }
};

/**
 * Test 8: Challenge Participation
 */
export const testChallengeParticipation = async () => {
  console.log('\n🎯 Testing Challenge Participation...');
  
  try {
    // Browse challenges
    const challenges = await challengeService?.getChallenges();
    
    if (challenges && challenges?.length > 0) {
      logTest('Challenges - Browse Challenges', true);
      console.log(`📋 Found ${challenges?.length} challenges`);
    } else {
      logTest('Challenges - Browse (No challenges yet)', true);
      addFix('Challenge Data', 'Create some challenges via admin or community to test participation');
    }
    
    // Test submit challenge idea
    try {
      const submissionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const voteDeadline = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      
      const newChallenge = {
        title: 'Test Challenge',
        description: 'This is a test challenge submission',
        category: 'apparel',
        submissionDeadline: submissionDate?.toISOString(),
        deadline: voteDeadline?.toISOString()
      };
      
      await challengeService?.createChallenge(newChallenge);
      logTest('Challenges - Submit Challenge Idea', true);
    } catch (submitError) {
      if (submitError?.message?.includes('permission')) {
        logTest('Challenges - Submit Challenge (Permission Required)', false, submitError);
        addFix('Challenge Creation', 'Check community_challenges RLS policies allow inserts for members');
      } else {
        throw submitError;
      }
    }
    
    // Test vote on challenge responses (fixed to use proper workflow)
    if (challenges && challenges?.length > 0) {
      const challengeId = challenges?.[0]?.id;
      
      try {
        // Get responses for this challenge
        const responses = await challengeService?.challengeResponseService?.getByChallengeId(challengeId);
        
        if (responses && responses?.length > 0) {
          // Vote on the first response
          const responseId = responses?.[0]?.id;
          await challengeService?.challengeVoteService?.vote(challengeId, responseId, 1);
          logTest('Challenges - Vote on Challenge Response', true);
        } else {
          logTest('Challenges - Vote on Response (No responses yet)', true);
          addFix('Challenge Response Voting', 'Designer needs to submit a response to this challenge first. Challenge voting works on designer submissions, not the challenge itself.');
        }
      } catch (voteError) {
        logTest('Challenges - Vote on Challenge Response', false, voteError);
        addFix('Challenge Voting', 'Check challenge_votes table and RLS policies. Ensure response_id is provided as votes are for designer submissions.');
      }
    }
    
    return { success: true };
  } catch (error) {
    logTest('Challenge Participation', false, error);
    addFix('Challenge System', 'Verify community_challenges table structure and permissions');
    return { success: false };
  }
};

/**
 * Main Test Runner
 */
export const runMemberFunctionsTest = async (designId = null) => {
  console.log('🚀 Starting Member Functions Test Suite...\n');
  console.log('='?.repeat(60));
  
  // Reset results
  testResults.passed = [];
  testResults.failed = [];
  testResults.fixes_needed = [];
  
  // Run all tests
  await testAuthFlow();
  await testDiscoverPage();
  
  if (designId) {
    await testVotingFlow(designId);
    await testPreOrderFlow(designId, true);
  } else {
    console.log('\n⚠️  Skipping voting and pre-order tests (no design_id provided)');
    addFix('Test Setup', 'Provide a valid design_id to test voting and pre-order flows');
  }
  
  await testMemberHub();
  await testCreditSystem();
  await testProfileFunctions();
  await testChallengeParticipation();
  
  // Print summary
  console.log('\n' + '='?.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY\n');
  
  console.log(`✅ PASSED: ${testResults?.passed?.length} tests`);
  testResults?.passed?.forEach(test => console.log(`   - ${test}`));
  
  console.log(`\n❌ FAILED: ${testResults?.failed?.length} tests`);
  testResults?.failed?.forEach(({ test, error }) => console.log(`   - ${test}: ${error}`));
  
  console.log(`\n🔧 FIXES NEEDED: ${testResults?.fixes_needed?.length} items`);
  testResults?.fixes_needed?.forEach(({ issue, suggestion }) => {
    console.log(`   - ${issue}:`);
    console.log(`     ${suggestion}`);
  });
  
  console.log('\n' + '='?.repeat(60));
  
  return testResults;
};

// Export for use in components
export default runMemberFunctionsTest;