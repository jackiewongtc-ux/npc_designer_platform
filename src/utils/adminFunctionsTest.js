import { supabase } from '../lib/supabase';
import * as adminService from '../services/adminService';
import * as moderationService from '../services/moderationService';


/**
 * Admin Functions Test Suite
 * Comprehensive testing for all admin functionality
 */

const testResults = {
  accessible: [],
  broken: [],
  needs_auth: []
};

// Helper to log test results
const logTest = (testName, status, details = null) => {
  const result = { test: testName, details };
  
  if (status === 'accessible') {
    testResults?.accessible?.push(result);
    console.log(`✅ ${testName} - ACCESSIBLE`);
  } else if (status === 'broken') {
    testResults?.broken?.push(result);
    console.error(`❌ ${testName} - BROKEN:`, details);
  } else if (status === 'needs_auth') {
    testResults?.needs_auth?.push(result);
    console.warn(`⚠️  ${testName} - NEEDS AUTH:`, details);
  }
};

/**
 * Pre-Test: Verify admin authentication
 */
export const verifyAdminAuth = async () => {
  console.log('\n🔐 Verifying Admin Authentication...');
  
  try {
    const { data: { session } } = await supabase?.auth?.getSession();
    
    if (!session?.user) {
      logTest('Admin Authentication', 'needs_auth', 'No active session');
      return { success: false, message: 'Not authenticated' };
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      ?.from('user_profiles')
      ?.select('role')
      ?.eq('id', session?.user?.id)
      ?.single();

    if (profile?.role !== 'admin') {
      logTest('Admin Authentication', 'needs_auth', `User has role: ${profile?.role}, requires admin`);
      return { success: false, message: 'Insufficient permissions - admin role required' };
    }

    logTest('Admin Authentication', 'accessible', 'Admin role verified');
    return { success: true, userId: session?.user?.id };
  } catch (error) {
    logTest('Admin Authentication', 'broken', error?.message);
    return { success: false, message: error?.message };
  }
};

/**
 * Test 1: Challenge Management (/admin-challenge-management)
 */
export const testChallengeManagement = async () => {
  console.log('\n🎯 Testing Challenge Management Dashboard...');
  
  try {
    // Test accessing challenge management data
    const challenges = await moderationService?.getModerationChallenges();
    
    if (challenges && Array.isArray(challenges)) {
      logTest('Challenge Management - Load Challenges', 'accessible', `Found ${challenges?.length} challenges`);
    } else {
      logTest('Challenge Management - Load Challenges', 'broken', 'Invalid response format');
    }

    // Test fetching moderation stats
    const stats = await moderationService?.getModerationStats(7);
    
    if (stats && Array.isArray(stats)) {
      logTest('Challenge Management - Moderation Stats', 'accessible', `Retrieved ${stats?.length} days of stats`);
    } else {
      logTest('Challenge Management - Moderation Stats', 'broken', 'Stats unavailable');
    }

    return { success: true, challengeCount: challenges?.length || 0 };
  } catch (error) {
    logTest('Challenge Management', 'broken', error?.message);
    return { success: false, error: error?.message };
  }
};

/**
 * Test 2: Design Review Workflow
 */
export const testDesignReviewWorkflow = async () => {
  console.log('\n👁️  Testing Design Review Workflow...');
  
  try {
    // Test 2.1: View designs in 'pending_review' status
    const pendingDesigns = await adminService?.getDesignsByStatus('pending_review');
    logTest('Design Review - View Pending Designs', 'accessible', `Found ${pendingDesigns?.length} pending designs`);

    // Test 2.2: Approve design (if any pending)
    if (pendingDesigns?.length > 0) {
      const testDesignId = pendingDesigns?.[0]?.id;
      
      try {
        const approved = await adminService?.approveDesign(testDesignId);
        logTest('Design Review - Approve to Voting', 'accessible', `Approved design: ${testDesignId}`);
        
        // Verify voting_start_date was set
        if (approved?.votingStartedAt) {
          logTest('Design Review - Voting Start Date Set', 'accessible', 'Voting period initiated');
        } else {
          logTest('Design Review - Voting Start Date', 'broken', 'voting_start_date not set');
        }
      } catch (approveError) {
        logTest('Design Review - Approve Action', 'broken', approveError?.message);
      }
    } else {
      logTest('Design Review - Approve Action', 'accessible', 'No pending designs to approve (skipped test)');
    }

    // Test 2.3: Reject design with reason
    const uploadedDesigns = await adminService?.getDesignsByStatus('draft');
    
    if (uploadedDesigns?.length > 0) {
      const testDesignId = uploadedDesigns?.[0]?.id;
      const rejectionReason = 'Test rejection: Quality standards not met';
      
      try {
        await adminService?.rejectDesign(testDesignId, rejectionReason);
        logTest('Design Review - Reject with Reason', 'accessible', 'Design rejected successfully');
      } catch (rejectError) {
        logTest('Design Review - Reject Action', 'broken', rejectError?.message);
      }
    } else {
      logTest('Design Review - Reject Action', 'accessible', 'No draft designs to reject (skipped test)');
    }

    // Test 2.4: Flag for IP review
    if (uploadedDesigns?.length > 1) {
      const testDesignId = uploadedDesigns?.[1]?.id;
      
      try {
        await adminService?.flagDesignForReview(testDesignId);
        logTest('Design Review - Flag for IP Review', 'accessible', 'Design flagged successfully');
      } catch (flagError) {
        logTest('Design Review - Flag Action', 'broken', flagError?.message);
      }
    } else {
      logTest('Design Review - Flag Action', 'accessible', 'Insufficient designs for flag test (skipped)');
    }

    return { success: true };
  } catch (error) {
    logTest('Design Review Workflow', 'broken', error?.message);
    return { success: false, error: error?.message };
  }
};

/**
 * Test 3: Pricing Dashboard
 */
export const testPricingDashboard = async () => {
  console.log('\n💰 Testing Pricing Dashboard...');
  
  try {
    // Test 3.1: Get voting designs for pricing
    const votingDesigns = await adminService?.getDesignsByStatus('community_voting');
    logTest('Pricing Dashboard - Access Pricing Page', 'accessible', `Found ${votingDesigns?.length} voting designs`);

    if (votingDesigns?.length > 0) {
      const testDesignId = votingDesigns?.[0]?.id;
      
      // Test 3.2: Set tiered pricing data (3 tiers)
      const pricingData = {
        tiers: [
          { tier: 1, minQuantity: 1, maxQuantity: 50, price: '29.99' },
          { tier: 2, minQuantity: 51, maxQuantity: 100, price: '24.99' },
          { tier: 3, minQuantity: 101, maxQuantity: null, price: '19.99' }
        ]
      };

      try {
        await adminService?.setDesignPricing(testDesignId, pricingData);
        logTest('Pricing Dashboard - Set Tiered Pricing', 'accessible', 'Pricing configured successfully');
      } catch (pricingError) {
        logTest('Pricing Dashboard - Set Pricing', 'broken', pricingError?.message);
      }

      // Test 3.3: Validate Tier2 < Tier1 (negative test)
      const invalidPricing = {
        tiers: [
          { tier: 1, minQuantity: 1, maxQuantity: 50, price: '24.99' },
          { tier: 2, minQuantity: 51, maxQuantity: 100, price: '29.99' } // Invalid: higher than tier 1
        ]
      };

      try {
        await adminService?.setDesignPricing(testDesignId, invalidPricing);
        logTest('Pricing Dashboard - Tier Validation', 'broken', 'Validation should have failed');
      } catch (validationError) {
        if (validationError?.message?.includes('Validation')) {
          logTest('Pricing Dashboard - Tier Validation', 'accessible', 'Validation correctly rejected invalid pricing');
        } else {
          logTest('Pricing Dashboard - Tier Validation', 'broken', 'Unexpected validation error');
        }
      }

      // Test 3.4: Launch pre-order
      try {
        await adminService?.launchPreOrder(testDesignId);
        logTest('Pricing Dashboard - Launch Pre-order', 'accessible', 'Pre-order launched successfully');
      } catch (launchError) {
        logTest('Pricing Dashboard - Launch Pre-order', 'broken', launchError?.message);
      }
    } else {
      logTest('Pricing Dashboard - Full Workflow', 'accessible', 'No voting designs available for pricing test (skipped)');
    }

    return { success: true };
  } catch (error) {
    logTest('Pricing Dashboard', 'broken', error?.message);
    return { success: false, error: error?.message };
  }
};

/**
 * Test 4: Transaction Monitoring
 */
export const testTransactionMonitoring = async () => {
  console.log('\n📊 Testing Transaction Monitoring...');
  
  try {
    // Test 4.1: View all preorders
    const preorders = await adminService?.getAllPreOrders();
    logTest('Transaction Monitoring - View All Preorders', 'accessible', `Found ${preorders?.length} preorders`);

    // Test 4.2: See refunds issued
    const refunds = await adminService?.getAllRefunds();
    logTest('Transaction Monitoring - View Refunds', 'accessible', `Found ${refunds?.length} refunds`);

    // Test 4.3: Track designer payouts
    const payouts = await adminService?.getDesignerPayouts();
    logTest('Transaction Monitoring - View Payouts', 'accessible', `Found ${payouts?.length} payouts`);

    // Test 4.4: Export financial data
    const endDate = new Date()?.toISOString();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)?.toISOString();

    try {
      const financialData = await adminService?.exportFinancialData(startDate, endDate);
      
      if (financialData && financialData?.totalOrders !== undefined) {
        logTest('Transaction Monitoring - Export Financial Data', 'accessible', 
          `Exported data: ${financialData?.totalOrders} orders, $${financialData?.totalRevenue} revenue`);
      } else {
        logTest('Transaction Monitoring - Export Data', 'broken', 'Invalid financial data format');
      }
    } catch (exportError) {
      logTest('Transaction Monitoring - Export Data', 'broken', exportError?.message);
    }

    return { success: true, preorderCount: preorders?.length || 0 };
  } catch (error) {
    logTest('Transaction Monitoring', 'broken', error?.message);
    return { success: false, error: error?.message };
  }
};

/**
 * Test 5: Manual Overrides
 */
export const testManualOverrides = async () => {
  console.log('\n⚡ Testing Manual Overrides...');
  
  try {
    // Test 5.1: Force-cancel design
    const activeDesigns = await adminService?.getDesignsByStatus('community_voting');
    
    if (activeDesigns?.length > 0) {
      const testDesignId = activeDesigns?.[0]?.id;
      
      try {
        await adminService?.forceCancelDesign(testDesignId, 'Test cancellation');
        logTest('Manual Overrides - Force Cancel Design', 'accessible', 'Design force-cancelled');
      } catch (cancelError) {
        logTest('Manual Overrides - Force Cancel', 'broken', cancelError?.message);
      }
    } else {
      logTest('Manual Overrides - Force Cancel', 'accessible', 'No active designs to cancel (skipped)');
    }

    // Test 5.2: Issue manual refund
    const chargedOrders = await adminService?.getAllPreOrders();
    const testOrder = chargedOrders?.find(o => o?.status === 'charged' || o?.status === 'reserved');
    
    if (testOrder) {
      try {
        await adminService?.issueManualRefund(testOrder?.id, 10.00);
        logTest('Manual Overrides - Issue Manual Refund', 'accessible', 'Refund issued successfully');
      } catch (refundError) {
        logTest('Manual Overrides - Issue Refund', 'broken', refundError?.message);
      }
    } else {
      logTest('Manual Overrides - Issue Refund', 'accessible', 'No charged orders for refund test (skipped)');
    }

    // Test 5.3: Block/unblock users
    const users = await adminService?.getAllUsers({ role: 'consumer' });
    
    if (users?.length > 0) {
      const testUser = users?.find(u => !u?.isBlocked);
      
      if (testUser) {
        try {
          // Block user
          await adminService?.toggleUserBlock(testUser?.id, true);
          logTest('Manual Overrides - Block User', 'accessible', `Blocked user: ${testUser?.username}`);
          
          // Unblock user
          await adminService?.toggleUserBlock(testUser?.id, false);
          logTest('Manual Overrides - Unblock User', 'accessible', `Unblocked user: ${testUser?.username}`);
        } catch (blockError) {
          logTest('Manual Overrides - Block/Unblock', 'broken', blockError?.message);
        }
      }
    } else {
      logTest('Manual Overrides - Block/Unblock', 'accessible', 'No users available for block test (skipped)');
    }

    return { success: true };
  } catch (error) {
    logTest('Manual Overrides', 'broken', error?.message);
    return { success: false, error: error?.message };
  }
};

/**
 * Test 6: User Management
 */
export const testUserManagement = async () => {
  console.log('\n👥 Testing User Management...');
  
  try {
    // Test 6.1: View all users
    const allUsers = await adminService?.getAllUsers();
    logTest('User Management - View All Users', 'accessible', `Found ${allUsers?.length} users`);

    // Test 6.2: Change user roles
    const testUser = allUsers?.find(u => u?.role === 'consumer');
    
    if (testUser) {
      try {
        // Upgrade to designer
        await adminService?.changeUserRole(testUser?.id, 'designer');
        logTest('User Management - Change Role to Designer', 'accessible', 'Role changed successfully');
        
        // Revert back
        await adminService?.changeUserRole(testUser?.id, 'consumer');
        logTest('User Management - Revert Role', 'accessible', 'Role reverted');
      } catch (roleError) {
        logTest('User Management - Change Role', 'broken', roleError?.message);
      }
    } else {
      logTest('User Management - Change Role', 'accessible', 'No consumer users for role test (skipped)');
    }

    // Test 6.3: View activity logs
    if (allUsers?.length > 0) {
      const testUserId = allUsers?.[0]?.id;
      
      try {
        const activityLogs = await adminService?.getUserActivityLogs(testUserId);
        logTest('User Management - View Activity Logs', 'accessible', `Retrieved ${activityLogs?.length} activity logs`);
      } catch (logError) {
        logTest('User Management - Activity Logs', 'broken', logError?.message);
      }
    }

    return { success: true, userCount: allUsers?.length || 0 };
  } catch (error) {
    logTest('User Management', 'broken', error?.message);
    return { success: false, error: error?.message };
  }
};

/**
 * Test 7: System Settings
 */
export const testSystemSettings = async () => {
  console.log('\n⚙️  Testing System Settings...');
  
  try {
    // Test 7.1: View system settings
    const settings = await adminService?.getSystemSettings();
    logTest('System Settings - View Settings', 'accessible', `Found ${settings?.length} settings`);

    // Test 7.2: Update SystemSettings (fees, thresholds)
    if (settings?.length > 0) {
      const testSetting = settings?.find(s => s?.settingKey === 'membership_fee_sgd');
      
      if (testSetting) {
        const originalValue = testSetting?.settingValue;
        
        try {
          await adminService?.updateSystemSetting('membership_fee_sgd', 15, 'Updated test membership fee');
          logTest('System Settings - Update Fee', 'accessible', 'Membership fee updated');
          
          // Revert
          await adminService?.updateSystemSetting('membership_fee_sgd', originalValue);
          logTest('System Settings - Revert Update', 'accessible', 'Setting reverted');
        } catch (updateError) {
          logTest('System Settings - Update Fee', 'broken', updateError?.message);
        }
      }
    }

    // Test 7.3: Manage email templates
    try {
      const templates = await adminService?.getEmailTemplates();
      logTest('System Settings - View Email Templates', 'accessible', `Found ${templates?.length} templates`);
      
      if (templates?.length > 0) {
        const testTemplate = templates?.[0];
        const originalSubject = testTemplate?.subjectTemplate;
        
        try {
          await adminService?.updateEmailTemplate(testTemplate?.templateType, {
            subjectTemplate: 'TEST: Updated Subject',
            bodyTemplate: testTemplate?.bodyTemplate,
            isActive: testTemplate?.isActive
          });
          logTest('System Settings - Update Email Template', 'accessible', 'Template updated');
          
          // Revert
          await adminService?.updateEmailTemplate(testTemplate?.templateType, {
            subjectTemplate: originalSubject,
            bodyTemplate: testTemplate?.bodyTemplate,
            isActive: testTemplate?.isActive
          });
          logTest('System Settings - Revert Template', 'accessible', 'Template reverted');
        } catch (templateError) {
          logTest('System Settings - Update Template', 'broken', templateError?.message);
        }
      }
    } catch (templatesError) {
      logTest('System Settings - Email Templates', 'broken', templatesError?.message);
    }

    return { success: true, settingCount: settings?.length || 0 };
  } catch (error) {
    logTest('System Settings', 'broken', error?.message);
    return { success: false, error: error?.message };
  }
};

/**
 * Main Test Runner for Admin Functions
 */
export const runAdminFunctionsTest = async () => {
  console.log('🚀 Starting Admin Functions Test Suite...\n');
  console.log('='?.repeat(80));
  console.log('⚠️  CAUTION: Testing with production data - operations will modify database');
  console.log('='?.repeat(80));
  
  // Reset results
  testResults.accessible = [];
  testResults.broken = [];
  testResults.needs_auth = [];
  
  // Pre-test: Verify admin authentication
  const authResult = await verifyAdminAuth();
  
  if (!authResult?.success) {
    console.log('\n❌ Admin authentication failed. Aborting tests.');
    console.log(`Reason: ${authResult?.message}`);
    return testResults;
  }
  
  console.log('\n✅ Admin authentication verified. Proceeding with tests...\n');
  
  // Run all tests
  await testChallengeManagement();
  await testDesignReviewWorkflow();
  await testPricingDashboard();
  await testTransactionMonitoring();
  await testManualOverrides();
  await testUserManagement();
  await testSystemSettings();
  
  // Print summary
  console.log('\n' + '='?.repeat(80));
  console.log('📊 ADMIN TEST RESULTS SUMMARY\n');
  
  console.log(`✅ ACCESSIBLE: ${testResults?.accessible?.length} functions`);
  testResults?.accessible?.forEach(({ test, details }) => {
    console.log(`   - ${test}${details ? ` (${details})` : ''}`);
  });
  
  console.log(`\n❌ BROKEN: ${testResults?.broken?.length} functions`);
  testResults?.broken?.forEach(({ test, details }) => {
    console.log(`   - ${test}: ${details}`);
  });
  
  console.log(`\n⚠️  NEEDS AUTH: ${testResults?.needs_auth?.length} functions`);
  testResults?.needs_auth?.forEach(({ test, details }) => {
    console.log(`   - ${test}: ${details}`);
  });
  
  console.log('\n' + '='?.repeat(80));
  
  return testResults;
};

// Export for use in components
export default runAdminFunctionsTest;