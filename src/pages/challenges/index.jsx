import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader, Award, X, CheckCircle, AlertCircle } from 'lucide-react';
import runMemberFunctionsTest from '../../utils/memberFunctionsTest';
import runAutomationTests from '../../utils/automationTests';
import runAdminFunctionsTest from '../../utils/adminFunctionsTest';
import { supabase } from '../../lib/supabase';
import { designerFunctionsTest, formatDesignerTestResults } from '../../utils/designerFunctionsTest';

export default function Challenges() {
  const [activeTab, setActiveTab] = useState('active');
  const [showTestResults, setShowTestResults] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [runningTests, setRunningTests] = useState(false);
  const [automationTestRunning, setAutomationTestRunning] = useState(false);
  const [automationResults, setAutomationResults] = useState(null);
  const [showAutomationResults, setShowAutomationResults] = useState(false);
  const [testRunning, setTestRunning] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [isAdminTesting, setIsAdminTesting] = useState(false);
  const [adminTestResults, setAdminTestResults] = useState(null);
  const [showAdminTestModal, setShowAdminTestModal] = useState(false);

  const tabs = [
    { id: 'active', label: 'Active Challenges' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' }
  ];

  // Add test runner function
  const handleRunTests = async () => {
    setRunningTests(true);
    setShowTestResults(true);
    
    // Get first design ID if available
    const { data: designs } = await supabase?.from('design_submissions')?.select('id')?.limit(1)?.single();
    
    const results = await runMemberFunctionsTest(designs?.id);
    setTestResults(results);
    setRunningTests(false);
  };

  const handleRunAutomationTests = async () => {
    setAutomationTestRunning(true);
    setShowAutomationResults(false);
    
    try {
      const results = await runAutomationTests();
      setAutomationResults(results);
      setShowAutomationResults(true);
    } catch (error) {
      console.error('Automation tests failed:', error);
      alert('Test execution failed: ' + error?.message);
    } finally {
      setAutomationTestRunning(false);
    }
  };

  const handleRunDesignerTests = async () => {
    setTestRunning(true);
    setShowTestModal(true);
    setTestResults(null);

    try {
      const { results, testResults } = await designerFunctionsTest();
      const formattedResults = formatDesignerTestResults(testResults);
      setTestResults({ ...results, formatted: formattedResults });
    } catch (error) {
      console.error('Test execution error:', error);
      setTestResults({
        broken: [{ test: 'Test Execution', error: error?.message, fix: 'Check console for details' }],
        working: [],
        fixes: [],
        formatted: { summary: { total: 0, passed: 0, failed: 1, pending: 0 }, tests: [] }
      });
    } finally {
      setTestRunning(false);
    }
  };

  const runAdminTests = async () => {
    setIsAdminTesting(true);
    setAdminTestResults(null);
    setShowAdminTestModal(true);
    
    try {
      const results = await runAdminFunctionsTest();
      setAdminTestResults(results);
    } catch (error) {
      console.error('Admin test error:', error);
      setAdminTestResults({
        accessible: [],
        broken: [{ test: 'Test Runner', details: error?.message }],
        needs_auth: []
      });
    } finally {
      setIsAdminTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Design Challenges
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Participate in community challenges, showcase your creativity, and win amazing prizes
          </p>
        </motion.div>

        {/* Create Challenge Button */}
        <div className="text-center mb-8">
          <button className="bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700 transition">
            + Create New Challenge
          </button>
        </div>

        {/* Add Test Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleRunTests}
            disabled={runningTests}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {runningTests ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Running Tests...
              </>
            ) : (
              <>
                <span>🧪</span>
                Run Member Tests
              </>
            )}
          </button>
        </div>

        {/* Designer Functions Test Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleRunDesignerTests}
            disabled={testRunning}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {testRunning ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Running Designer Tests...
              </>
            ) : (
              <>
                <Award className="w-5 h-5" />
                Test Designer Functions
              </>
            )}
          </button>
        </div>

        {/* Admin Test Runner Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  🔴 Admin Functions Test Suite
                </h3>
                <p className="text-sm text-red-700 mb-2">
                  ⚠️ CAUTION: This will test admin operations with production data
                </p>
                <p className="text-xs text-red-600">
                  Tests: Challenge management, Design review, Pricing, Transactions, Overrides, User management, System settings
                </p>
              </div>
              <button
                onClick={runAdminTests}
                disabled={isAdminTesting}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  isAdminTesting
                    ? 'bg-gray-400 cursor-not-allowed' :'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isAdminTesting ? (
                  <>
                    <span className="animate-spin inline-block mr-2">⏳</span>
                    Running Tests...
                  </>
                ) : (
                  <>🔴 Run Admin Tests</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Automation Test Section */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Automation Tests</h2>
              <p className="text-sm text-gray-600 mt-1">
                Test 5 critical automations with isolated mock data
              </p>
            </div>
            <button
              onClick={handleRunAutomationTests}
              disabled={automationTestRunning}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                automationTestRunning
                  ? 'bg-gray-400 cursor-not-allowed' :'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {automationTestRunning ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Running Tests...
                </span>
              ) : (
                '🧪 Run Automation Tests'
              )}
            </button>
          </div>

          {/* Test Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">🔍 Automation 0: IP Risk Scan</h3>
              <p className="text-sm text-blue-700">Tests banned keyword detection and auto-flagging</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">📅 Automation 1: Voting Period End</h3>
              <p className="text-sm text-green-700">Tests 31-day voting period status changes</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">💰 Automation 4: Pre-order Refunds</h3>
              <p className="text-sm text-purple-700">Tests refund credits and email notifications</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">💵 Automation 4b: Designer Payouts</h3>
              <p className="text-sm text-yellow-700">Tests royalty calculation and quarterly caps</p>
            </div>
            <div className="p-4 bg-pink-50 rounded-lg">
              <h3 className="font-semibold text-pink-900 mb-2">📧 Automation 5: Email System</h3>
              <p className="text-sm text-pink-700">Tests email queue and 4 template types</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-full p-1 shadow-md">
            {tabs?.map((tab) => (
              <button
                key={tab?.id}
                onClick={() => setActiveTab(tab?.id)}
                className={`px-6 py-2 rounded-full font-medium transition ${
                  activeTab === tab?.id
                    ? 'bg-purple-600 text-white' :'text-gray-600 hover:text-purple-600'
                }`}
              >
                {tab?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6]?.map((item) => (
            <motion.div
              key={item}
              whileHover={{ scale: 1.03 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer"
            >
              {/* Challenge Image */}
              <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-500 relative">
                <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-purple-600">
                  5 days left
                </div>
              </div>

              {/* Challenge Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Summer Fashion Challenge {item}
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your best summer-inspired fashion design
                </p>

                {/* Challenge Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>👥 234 participants</span>
                  <span>🏆 $500 prize</span>
                </div>

                {/* Action Button */}
                <button className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition">
                  Join Challenge
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="text-purple-600 font-semibold hover:text-purple-700 transition">
            Load More Challenges →
          </button>
        </div>
      </div>
      {/* Admin Test Results Modal */}
      {showAdminTestModal && adminTestResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-4">
              <h2 className="text-2xl font-bold">Admin Functions Test Results</h2>
              <p className="text-sm opacity-90 mt-1">Production data test summary</p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Accessible Functions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                  <span className="mr-2">✅</span>
                  Accessible Functions ({adminTestResults?.accessible?.length})
                </h3>
                <div className="space-y-2">
                  {adminTestResults?.accessible?.length === 0 ? (
                    <p className="text-gray-500 text-sm">No accessible functions found</p>
                  ) : (
                    adminTestResults?.accessible?.map((result, index) => (
                      <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="font-medium text-green-900">{result?.test}</p>
                        {result?.details && (
                          <p className="text-sm text-green-700 mt-1">{result?.details}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Broken Functions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
                  <span className="mr-2">❌</span>
                  Broken Functions ({adminTestResults?.broken?.length})
                </h3>
                <div className="space-y-2">
                  {adminTestResults?.broken?.length === 0 ? (
                    <p className="text-gray-500 text-sm">No broken functions detected</p>
                  ) : (
                    adminTestResults?.broken?.map((result, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="font-medium text-red-900">{result?.test}</p>
                        {result?.details && (
                          <p className="text-sm text-red-700 mt-1 font-mono">{result?.details}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Needs Auth Functions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-yellow-700 mb-3 flex items-center">
                  <span className="mr-2">⚠️</span>
                  Needs Authentication ({adminTestResults?.needs_auth?.length})
                </h3>
                <div className="space-y-2">
                  {adminTestResults?.needs_auth?.length === 0 ? (
                    <p className="text-gray-500 text-sm">All functions authenticated</p>
                  ) : (
                    adminTestResults?.needs_auth?.map((result, index) => (
                      <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="font-medium text-yellow-900">{result?.test}</p>
                        {result?.details && (
                          <p className="text-sm text-yellow-700 mt-1">{result?.details}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-100 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowAdminTestModal(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Designer Test Results Modal */}
      {showTestModal && testResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Designer Functions Test Results
                </h2>
                <button
                  onClick={() => setShowTestModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Test Summary */}
              {testResults?.formatted && (
                <div className="mb-6 grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Total Tests</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {testResults?.formatted?.summary?.total}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Passed</p>
                    <p className="text-2xl font-bold text-green-900">
                      {testResults?.formatted?.summary?.passed}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">Failed</p>
                    <p className="text-2xl font-bold text-red-900">
                      {testResults?.formatted?.summary?.failed}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-600 font-medium">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {testResults?.formatted?.summary?.pending}
                    </p>
                  </div>
                </div>
              )}

              {/* Working Functions */}
              {testResults?.working?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Working Functions ({testResults?.working?.length})
                  </h3>
                  <div className="space-y-2">
                    {testResults?.working?.map((item, index) => (
                      <div key={index} className="bg-green-50 border border-green-200 rounded p-3">
                        <p className="text-green-800">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Broken Functions */}
              {testResults?.broken?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Broken Functions ({testResults?.broken?.length})
                  </h3>
                  <div className="space-y-3">
                    {testResults?.broken?.map((item, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded p-4">
                        <p className="font-medium text-red-900">{item?.test}</p>
                        <p className="text-sm text-red-700 mt-1">Error: {item?.error}</p>
                        <p className="text-sm text-red-600 mt-2">
                          <strong>Fix:</strong> {item?.fix}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Test Results */}
              {testResults?.formatted?.tests?.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    Detailed Test Results
                  </h3>
                  <div className="space-y-3">
                    {testResults?.formatted?.tests?.map((test, index) => (
                      <div
                        key={index}
                        className={`border rounded p-4 ${
                          test?.status === 'pass' ?'bg-green-50 border-green-200'
                            : test?.status === 'fail' ?'bg-red-50 border-red-200' :'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{test?.name}</p>
                            <p className="text-sm text-gray-700 mt-1">{test?.message}</p>
                            {test?.details && (
                              <pre className="mt-2 text-xs bg-white p-2 rounded overflow-x-auto">
                                {JSON.stringify(test?.details, null, 2)}
                              </pre>
                            )}
                          </div>
                          <span
                            className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
                              test?.status === 'pass' ?'bg-green-100 text-green-800'
                                : test?.status === 'fail' ?'bg-red-100 text-red-800' :'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {test?.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowTestModal(false)}
                className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Automation Results Modal */}
      {showAutomationResults && automationResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Automation Test Results</h2>
                <button
                  onClick={() => setShowAutomationResults(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Results Summary */}
              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-3xl font-bold text-green-600">
                    {automationResults?.filter(r => r?.status === 'pass')?.length}
                  </div>
                  <div className="text-gray-600">Passed</div>
                  <div className="text-3xl font-bold text-red-600">
                    {automationResults?.filter(r => r?.status === 'fail')?.length}
                  </div>
                  <div className="text-gray-600">Failed</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all"
                    style={{
                      width: `${(automationResults?.filter(r => r?.status === 'pass')?.length / automationResults?.length) * 100}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Individual Test Results */}
              <div className="space-y-4">
                {automationResults?.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      result?.status === 'pass' ?'bg-green-50 border-green-200' :'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-2xl">
                            {result?.status === 'pass' ? '✅' : '❌'}
                          </span>
                          <h3 className="font-semibold text-lg">
                            Automation {result?.automation}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              result?.status === 'pass' ?'bg-green-200 text-green-800' :'bg-red-200 text-red-800'
                            }`}
                          >
                            {result?.status?.toUpperCase()}
                          </span>
                        </div>
                        {result?.issue && (
                          <p className="text-sm text-gray-700 mt-2">
                            <span className="font-semibold">Issue:</span> {result?.issue}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleRunAutomationTests}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Re-run Tests
                </button>
                <button
                  onClick={() => setShowAutomationResults(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Test Results Modal */}
      {showTestResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  🧪 Member Functions Test Results
                </h2>
                <button
                  onClick={() => setShowTestResults(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {runningTests ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-600">Running tests... Check console for detailed logs</p>
                  </div>
                </div>
              ) : testResults ? (
                <div className="space-y-6">
                  {/* Passed Tests */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                      ✅ Passed Tests ({testResults?.passed?.length || 0})
                    </h3>
                    <ul className="space-y-1">
                      {testResults?.passed?.map((test, idx) => (
                        <li key={idx} className="text-green-700 text-sm">
                          • {test}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Failed Tests */}
                  {testResults?.failed?.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
                        ❌ Failed Tests ({testResults?.failed?.length})
                      </h3>
                      <ul className="space-y-2">
                        {testResults?.failed?.map((item, idx) => (
                          <li key={idx} className="text-red-700 text-sm">
                            <strong>• {item?.test}</strong>
                            <p className="ml-4 text-red-600 text-xs mt-1">{item?.error}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Fixes Needed */}
                  {testResults?.fixes_needed?.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                        🔧 Fixes Needed ({testResults?.fixes_needed?.length})
                      </h3>
                      <ul className="space-y-3">
                        {testResults?.fixes_needed?.map((item, idx) => (
                          <li key={idx} className="text-yellow-700 text-sm">
                            <strong>• {item?.issue}</strong>
                            <p className="ml-4 text-yellow-600 text-xs mt-1">{item?.suggestion}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Summary Stats */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      📊 Summary
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {testResults?.passed?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Passed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {testResults?.failed?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Failed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {testResults?.fixes_needed?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Fixes Needed</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 italic">
                    💡 Open browser console for detailed test logs
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}