import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, CheckCircle, XCircle, AlertTriangle, Eye, RefreshCw, TrendingUp, Clock, Shield, Users, Flag } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import {
  getModerationChallenges,
  moderateChallenge,
  bulkModerate,
  getIpRiskAnalysis,
  getAllFlags,
  getModerationStats
} from '../../services/moderationService';

const AdminChallengeModerationCenter = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChallenges, setSelectedChallenges] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    riskLevel: '',
    dateRange: 'all',
    creatorTier: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [ipRiskData, setIpRiskData] = useState([]);
  const [flags, setFlags] = useState([]);
  const [stats, setStats] = useState(null);
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    loadModerationData();
  }, [filters]);

  const loadModerationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load challenges with filters
      const filterParams = {};
      if (filters?.status) filterParams.status = filters?.status;
      if (filters?.riskLevel) filterParams.riskLevel = filters?.riskLevel;
      if (filters?.creatorTier) filterParams.creatorTier = filters?.creatorTier;

      const [challengesData, ipData, flagsData, statsData] = await Promise.all([
        getModerationChallenges(filterParams),
        getIpRiskAnalysis(),
        getAllFlags(false),
        getModerationStats(7)
      ]);

      setChallenges(challengesData);
      setIpRiskData(ipData);
      setFlags(flagsData);
      setStats(statsData?.[0] || null);
    } catch (err) {
      console.error('Error loading moderation data:', err);
      setError(err?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (challengeId, action, notes = '') => {
    try {
      await moderateChallenge(challengeId, action, notes);
      await loadModerationData();
    } catch (err) {
      console.error('Error moderating challenge:', err);
      alert(`Failed to moderate challenge: ${err?.message}`);
    }
  };

  const handleBulkModerate = async () => {
    if (selectedChallenges?.length === 0 || !bulkAction) {
      alert('Please select challenges and an action');
      return;
    }

    try {
      await bulkModerate(selectedChallenges, bulkAction);
      setSelectedChallenges([]);
      setBulkAction('');
      await loadModerationData();
    } catch (err) {
      console.error('Error bulk moderating:', err);
      alert(`Failed to bulk moderate: ${err?.message}`);
    }
  };

  const handleSelectChallenge = (challengeId) => {
    setSelectedChallenges(prev =>
      prev?.includes(challengeId)
        ? prev?.filter(id => id !== challengeId)
        : [...prev, challengeId]
    );
  };

  const filteredChallenges = challenges?.filter(challenge =>
    challenge?.title?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
    challenge?.creator?.username?.toLowerCase()?.includes(searchTerm?.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedChallenges?.length === filteredChallenges?.length) {
      setSelectedChallenges([]);
    } else {
      setSelectedChallenges(filteredChallenges?.map(c => c?.id));
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-green-600 bg-green-50';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'flagged':
        return 'text-orange-600 bg-orange-50';
      case 'under_review':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading moderation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Challenge Moderation Center</h1>
              <p className="text-sm text-gray-600 mt-1">
                Comprehensive oversight and management for community challenges
              </p>
            </div>
            <Button
              onClick={() => loadModerationData()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
      {/* Statistics Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats?.pendingCount || 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Flagged</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {flags?.length}
                </p>
              </div>
              <Flag className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Risk IPs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {ipRiskData?.filter(ip => ip?.riskLevel === 'high' || ip?.riskLevel === 'critical')?.length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today Reviewed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats?.totalReviewed || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by title or creator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e?.target?.value)}
                icon={<Search className="w-5 h-5 text-gray-400" />}
              />
            </div>

            <div className="flex gap-2">
              <Select
                value={filters?.status}
                onChange={(e) => setFilters({ ...filters, status: e?.target?.value })}
                className="min-w-[150px]"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="flagged">Flagged</option>
                <option value="under_review">Under Review</option>
              </Select>

              <Select
                value={filters?.riskLevel}
                onChange={(e) => setFilters({ ...filters, riskLevel: e?.target?.value })}
                className="min-w-[150px]"
              >
                <option value="">All Risk Levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                More Filters
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                value={filters?.creatorTier}
                onChange={(e) => setFilters({ ...filters, creatorTier: e?.target?.value })}
              >
                <option value="">All Creator Tiers</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </Select>

              <Select
                value={filters?.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e?.target?.value })}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </Select>

              <Button
                variant="outline"
                onClick={() => setFilters({
                  status: '',
                  riskLevel: '',
                  dateRange: 'all',
                  creatorTier: ''
                })}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedChallenges?.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-900">
                {selectedChallenges?.length} challenge{selectedChallenges?.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex items-center gap-2">
                <Select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e?.target?.value)}
                  className="min-w-[150px]"
                >
                  <option value="">Select Action</option>
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                  <option value="flagged">Flag</option>
                  <option value="under_review">Under Review</option>
                </Select>
                <Button
                  onClick={handleBulkModerate}
                  disabled={!bulkAction}
                >
                  Apply
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedChallenges([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Challenges Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <Checkbox
                      checked={selectedChallenges?.length === filteredChallenges?.length && filteredChallenges?.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Challenge
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Votes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flags
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredChallenges?.map((challenge) => (
                  <tr key={challenge?.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Checkbox
                        checked={selectedChallenges?.includes(challenge?.id)}
                        onChange={() => handleSelectChallenge(challenge?.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{challenge?.title}</p>
                          {challenge?.autoFlagged && (
                            <span className="inline-flex items-center gap-1 text-xs text-red-600 mt-1">
                              <AlertTriangle className="w-3 h-3" />
                              Auto-flagged
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {challenge?.creator?.displayName || challenge?.creator?.username}
                          </p>
                          <p className="text-xs text-gray-500">{challenge?.creator?.tierLevel}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(challenge.createdAt)?.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(challenge?.moderationStatus)}`}>
                        {challenge?.moderationStatus || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(challenge?.riskLevel)}`}>
                          {challenge?.riskLevel}
                        </span>
                        <span className="text-xs text-gray-500">({challenge?.riskScore})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {challenge?.voteCount}
                    </td>
                    <td className="px-6 py-4">
                      {challenge?.flaggedCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-sm text-orange-600">
                          <Flag className="w-4 h-4" />
                          {challenge?.flaggedCount}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleModerate(challenge?.id, 'approved')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleModerate(challenge?.id, 'rejected')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleModerate(challenge?.id, 'flagged')}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <Flag className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/challenge/${challenge?.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredChallenges?.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No challenges found</h3>
              <p className="text-sm text-gray-600">
                Try adjusting your filters or search criteria
              </p>
            </div>
          )}
        </div>

        {/* IP Risk Analysis Section */}
        {ipRiskData?.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">IP Risk Analysis</h2>
            <div className="space-y-4">
              {ipRiskData?.slice(0, 5)?.map((ip) => (
                <div key={ip?.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Shield className={`w-6 h-6 ${
                      ip?.riskLevel === 'critical' ? 'text-red-600' :
                      ip?.riskLevel === 'high' ? 'text-orange-600' :
                      ip?.riskLevel === 'medium'? 'text-yellow-600' : 'text-green-600'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ip?.ipAddress}</p>
                      <p className="text-xs text-gray-600">
                        {ip?.submissionCount} submissions • Risk Score: {ip?.riskScore}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(ip?.riskLevel)}`}>
                      {ip?.riskLevel}
                    </span>
                    {ip?.blocked && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Blocked
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChallengeModerationCenter;