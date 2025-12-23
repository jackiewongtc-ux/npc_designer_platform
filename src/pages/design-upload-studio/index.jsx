import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import { designService } from '../../services/designService';
import SubmissionForm from './components/SubmissionForm';
import SubmissionPipeline from './components/SubmissionPipeline';

export default function DesignUploadStudio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGuidelines, setShowGuidelines] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadSubmissions();
  }, [user, navigate]);

  const loadSubmissions = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await designService?.getUserSubmissions();
      setSubmissions(data);
    } catch (err) {
      setError(err?.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmissionComplete = () => {
    loadSubmissions();
    setSelectedSubmission(null);
  };

  const handleNewSubmission = () => {
    setSelectedSubmission(null);
  };

  const handleEditSubmission = (submission) => {
    setSelectedSubmission(submission);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Design Upload Studio | Submit Your Creations</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Design Upload Studio</h1>
                <p className="mt-1 text-gray-600">
                  Submit your designs to the community platform
                </p>
              </div>
              <button
                onClick={() => navigate('/member-hub-dashboard')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                ← Back to Hub
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Guidelines Panel */}
              {showGuidelines && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        Submission Guidelines
                      </h3>
                      <ul className="space-y-2 text-sm text-blue-800">
                        <li className="flex items-start">
                          <span className="mr-2">✓</span>
                          Upload high-quality images (minimum 1200x1200px)
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✓</span>
                          Provide clear title and detailed description
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✓</span>
                          Select appropriate category for your design
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✓</span>
                          Include material and sizing information for production
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">✓</span>
                          Save as draft anytime or submit for review when ready
                        </li>
                      </ul>
                    </div>
                    <button
                      onClick={() => setShowGuidelines(false)}
                      className="text-blue-600 hover:text-blue-700 ml-4"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Submission Form */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedSubmission ? 'Edit Design' : 'New Design Submission'}
                  </h2>
                  {selectedSubmission && (
                    <button
                      onClick={handleNewSubmission}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      + New Submission
                    </button>
                  )}
                </div>

                <SubmissionForm
                  existingSubmission={selectedSubmission}
                  onSubmissionComplete={handleSubmissionComplete}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pipeline Status */}
              {selectedSubmission && (
                <SubmissionPipeline status={selectedSubmission?.submissionStatus} />
              )}

              {/* Recent Submissions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Submissions
                </h3>

                {submissions?.length === 0 ? (
                  <p className="text-gray-500 text-sm">No submissions yet</p>
                ) : (
                  <div className="space-y-3">
                    {submissions?.map((submission) => {
                      const statusInfo = designService?.getStatusInfo(submission?.submissionStatus);

                      return (
                        <button
                          key={submission?.id}
                          onClick={() => handleEditSubmission(submission)}
                          className={`w-full text-left p-4 rounded-lg border transition-colors ${
                            selectedSubmission?.id === submission?.id
                              ? 'border-blue-500 bg-blue-50' :'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {submission?.imageUrls?.[0] && (
                              <img
                                src={submission?.imageUrls?.[0]}
                                alt={submission?.title}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {submission?.title}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(submission.createdAt)?.toLocaleDateString()}
                              </p>
                              <span
                                className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                                  statusInfo?.color === 'gray' ?'bg-gray-100 text-gray-800'
                                    : statusInfo?.color === 'yellow' ?'bg-yellow-100 text-yellow-800'
                                    : statusInfo?.color === 'blue' ?'bg-blue-100 text-blue-800'
                                    : statusInfo?.color === 'purple' ?'bg-purple-100 text-purple-800'
                                    : statusInfo?.color === 'green' ?'bg-green-100 text-green-800' :'bg-red-100 text-red-800'
                                }`}
                              >
                                {statusInfo?.label}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tips Panel */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pro Tips</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">💡</span>
                    <span>Use multiple angles to showcase your design details</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">💡</span>
                    <span>Write compelling descriptions that tell your design story</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">💡</span>
                    <span>Check community voting feedback to improve future designs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">💡</span>
                    <span>Save drafts frequently to avoid losing your work</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}