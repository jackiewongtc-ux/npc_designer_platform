import { designService } from '../../../services/designService';

export default function SubmissionPipeline({ status }) {
  const statusInfo = designService?.getStatusInfo(status);

  const stages = [
    { key: 'draft', label: 'Draft', icon: '✏️' },
    { key: 'pending_review', label: 'Review', icon: '👀' },
    { key: 'community_voting', label: 'Voting', icon: '🗳️' },
    { key: 'in_production', label: 'Production', icon: '⚙️' },
    { key: 'completed', label: 'Completed', icon: '✅' }
  ];

  const statusOrder = ['draft', 'pending_review', 'community_voting', 'in_production', 'completed'];
  const currentIndex = statusOrder?.indexOf(status);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Submission Pipeline</h3>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
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
      {/* Pipeline Stages */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-0 right-0 top-6 h-0.5 bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{
              width: `${currentIndex >= 0 ? (currentIndex / (stages?.length - 1)) * 100 : 0}%`
            }}
          />
        </div>

        {/* Stage Markers */}
        <div className="relative flex justify-between">
          {stages?.map((stage, index) => {
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;
            const isFuture = index > currentIndex;

            return (
              <div key={stage?.key} className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-2 transition-colors ${
                    isCompleted
                      ? 'bg-blue-600 text-white'
                      : isActive
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100' :'bg-gray-200 text-gray-400'
                  }`}
                >
                  {stage?.icon}
                </div>
                <div className="text-center">
                  <p
                    className={`text-sm font-medium ${
                      isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {stage?.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Status Description */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">{statusInfo?.description}</p>
      </div>
      {/* Timeline Estimates */}
      {status === 'pending_review' && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Estimated review time:</strong> 2-3 business days
          </p>
        </div>
      )}
      {status === 'community_voting' && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Voting period:</strong> 7 days remaining
          </p>
        </div>
      )}
      {status === 'in_production' && (
        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-800">
            <strong>Production time:</strong> 4-6 weeks
          </p>
        </div>
      )}
    </div>
  );
}