import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/Header';
import AuthenticationGuard from '../../components/AuthenticationGuard';
import AdminAccessToggle from '../../components/ui/AdminAccessToggle';
import ChallengeStatsCard from './components/ChallengeStatsCard';
import FilterControls from './components/FilterControls';
import ChallengeTable from './components/ChallengeTable';
import BulkActionsBar from './components/BulkActionsBar';
import ChallengeDetailModal from './components/ChallengeDetailModal';
import SystemAlertsPanel from './components/SystemAlertsPanel';

const AdminChallengeManagement = () => {
  const mockUser = {
    id: 1,
    name: 'Admin User',
    username: 'admin',
    email: 'admin@npcdesigner.com',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1d90a96ad-1763299909299.png",
    avatarAlt: 'Professional headshot of admin user with short brown hair wearing navy blue suit',
    isAdmin: true,
    tier: 'Platinum',
    exp: 8500,
    memberSince: '2023-01-15'
  };

  const mockChallenges = [
  {
    id: 1,
    title: 'Sustainable Streetwear Collection for Urban Youth',
    description: 'Design a sustainable streetwear collection that appeals to environmentally conscious urban youth aged 18-25. Focus on recycled materials and bold graphics.',
    category: 'Streetwear',
    budget: 5000,
    thumbnail: "https://img.rocket.new/generatedImages/rocket_gen_img_1d93de744-1765313383076.png",
    thumbnailAlt: 'Modern streetwear clothing display with sustainable fabrics and urban aesthetic on white background',
    creator: {
      name: 'Sarah Chen',
      username: 'sarahchen',
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1abb74cb5-1763293919129.png",
      avatarAlt: 'Professional headshot of Asian woman with long black hair wearing casual denim jacket',
      tier: 'Gold',
      memberSince: '2023-06-20'
    },
    status: 'pending',
    submissionDate: '2025-12-08',
    submissionTime: '14:32',
    upvotes: 156,
    downvotes: 12,
    comments: 34,
    flags: [
    { reason: 'IP Risk', description: 'Similar design found in existing brand catalog' }],

    ipRiskLevel: 'medium',
    ipScanResults: [
    { detected: true, message: 'Potential trademark similarity detected with "Urban Eco Wear"' },
    { detected: false, message: 'No copyright infringement detected in design elements' },
    { detected: false, message: 'No plagiarism detected in description text' }],

    adminNotes: ''
  },
  {
    id: 2,
    title: 'Minimalist Formal Wear for Remote Professionals',
    description: 'Create a minimalist formal wear line designed for remote professionals who need camera-ready tops with comfortable bottoms.',
    category: 'Formal Wear',
    budget: 3500,
    thumbnail: "https://img.rocket.new/generatedImages/rocket_gen_img_17c341542-1764673920139.png",
    thumbnailAlt: 'Professional business attire with minimalist design featuring neutral colors and clean lines on mannequin',
    creator: {
      name: 'Michael Rodriguez',
      username: 'mrodriguez',
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_103972665-1763296698542.png",
      avatarAlt: 'Professional headshot of Hispanic man with short black hair wearing formal white shirt',
      tier: 'Silver',
      memberSince: '2024-02-10'
    },
    status: 'approved',
    submissionDate: '2025-12-07',
    submissionTime: '09:15',
    upvotes: 203,
    downvotes: 8,
    comments: 56,
    flags: [],
    ipRiskLevel: 'low',
    ipScanResults: [
    { detected: false, message: 'No trademark conflicts detected' },
    { detected: false, message: 'No copyright infringement detected' },
    { detected: false, message: 'Original content verified' }],

    adminNotes: 'Approved for voting phase. Excellent concept with clear market demand.'
  },
  {
    id: 3,
    title: 'Retro Gaming Inspired Casual Wear Collection',
    description: 'Design a casual wear collection inspired by classic 8-bit and 16-bit video games with pixel art graphics and nostalgic color palettes.',
    category: 'Casual',
    budget: 4200,
    thumbnail: "https://img.rocket.new/generatedImages/rocket_gen_img_1233d3705-1765477912637.png",
    thumbnailAlt: 'Casual clothing with retro gaming graphics featuring pixel art designs and vibrant colors on display',
    creator: {
      name: 'Emily Watson',
      username: 'emilyw',
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1276b92d5-1763301496010.png",
      avatarAlt: 'Professional headshot of Caucasian woman with blonde hair wearing casual gray sweater',
      tier: 'Bronze',
      memberSince: '2024-08-05'
    },
    status: 'flagged',
    submissionDate: '2025-12-06',
    submissionTime: '16:45',
    upvotes: 89,
    downvotes: 34,
    comments: 23,
    flags: [
    { reason: 'Community Report', description: 'Multiple users reported potential copyright issues with game characters' },
    { reason: 'IP Risk', description: 'Design elements may infringe on Nintendo trademarks' }],

    ipRiskLevel: 'high',
    ipScanResults: [
    { detected: true, message: 'High similarity detected with copyrighted game characters' },
    { detected: true, message: 'Trademark conflict detected with "Super Mario" brand elements' },
    { detected: false, message: 'Description text is original' }],

    adminNotes: ''
  },
  {
    id: 4,
    title: 'Athletic Performance Wear with Smart Fabric Technology',
    description: 'Develop athletic wear incorporating smart fabric technology that monitors body temperature and adjusts breathability for optimal performance.',
    category: 'Sportswear',
    budget: 7500,
    thumbnail: "https://img.rocket.new/generatedImages/rocket_gen_img_14fe00efb-1765744545155.png",
    thumbnailAlt: 'Modern athletic sportswear with technical fabric showing moisture-wicking properties on athletic model',
    creator: {
      name: 'David Kim',
      username: 'davidkim',
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1b5367198-1763299747583.png",
      avatarAlt: 'Professional headshot of Asian man with short black hair wearing athletic performance wear',
      tier: 'Platinum',
      memberSince: '2023-03-12'
    },
    status: 'active',
    submissionDate: '2025-12-05',
    submissionTime: '11:20',
    upvotes: 312,
    downvotes: 15,
    comments: 78,
    flags: [],
    ipRiskLevel: 'low',
    ipScanResults: [
    { detected: false, message: 'No trademark conflicts detected' },
    { detected: false, message: 'Technology description is original' },
    { detected: false, message: 'No patent infringement detected' }],

    adminNotes: 'Currently in active voting phase. Strong community engagement.'
  },
  {
    id: 5,
    title: 'Bohemian Festival Accessories Line',
    description: 'Create a bohemian-inspired accessories line perfect for music festivals, featuring handcrafted elements and sustainable materials.',
    category: 'Accessories',
    budget: 2800,
    thumbnail: "https://images.unsplash.com/photo-1695281567318-76d294b4fb49",
    thumbnailAlt: 'Bohemian style accessories including handmade jewelry and fabric items with natural materials on rustic background',
    creator: {
      name: 'Jessica Martinez',
      username: 'jessicam',
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1de57631c-1763294258585.png",
      avatarAlt: 'Professional headshot of Hispanic woman with long brown hair wearing bohemian style clothing',
      tier: 'Gold',
      memberSince: '2023-11-08'
    },
    status: 'rejected',
    submissionDate: '2025-12-04',
    submissionTime: '13:50',
    upvotes: 67,
    downvotes: 89,
    comments: 45,
    flags: [],
    ipRiskLevel: 'low',
    ipScanResults: [
    { detected: false, message: 'No IP conflicts detected' },
    { detected: false, message: 'Original design concepts verified' },
    { detected: false, message: 'No plagiarism in description' }],

    adminNotes: 'Rejected due to insufficient community interest and unclear market positioning.'
  },
  {
    id: 6,
    title: 'Tech-Integrated Winter Outerwear Collection',
    description: 'Design winter outerwear with integrated heating elements and USB charging capabilities for urban commuters in cold climates.',
    category: 'Streetwear',
    budget: 6200,
    thumbnail: "https://images.unsplash.com/photo-1704286188716-ee9fe352b977",
    thumbnailAlt: 'Modern winter jacket with technical features and sleek design on mannequin against urban background',
    creator: {
      name: 'Alex Thompson',
      username: 'alexthompson',
      avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1aef10a9f-1763294632369.png",
      avatarAlt: 'Professional headshot of Caucasian man with short brown hair wearing winter outerwear',
      tier: 'Silver',
      memberSince: '2024-01-22'
    },
    status: 'pending',
    submissionDate: '2025-12-03',
    submissionTime: '10:05',
    upvotes: 124,
    downvotes: 18,
    comments: 41,
    flags: [],
    ipRiskLevel: 'low',
    ipScanResults: [
    { detected: false, message: 'No trademark conflicts detected' },
    { detected: false, message: 'Technology integration is original' },
    { detected: false, message: 'No patent conflicts found' }],

    adminNotes: ''
  }];


  const mockAlerts = [
  {
    id: 1,
    type: 'urgent',
    title: 'High-Risk Challenge Flagged',
    message: 'Challenge #3 has been flagged for potential IP infringement by 5 community members',
    time: '5 minutes ago',
    actionLabel: 'Review Now',
    onAction: (id) => console.log('Review alert:', id)
  },
  {
    id: 2,
    type: 'warning',
    title: 'Pending Reviews Accumulating',
    message: '12 challenges are awaiting moderation review for more than 24 hours',
    time: '2 hours ago',
    actionLabel: 'View Queue',
    onAction: (id) => console.log('View queue:', id)
  },
  {
    id: 3,
    type: 'info',
    title: 'System Maintenance Scheduled',
    message: 'Scheduled maintenance window on December 15th from 2:00 AM to 4:00 AM UTC',
    time: '1 day ago',
    actionLabel: null,
    onAction: null
  }];


  const [challenges, setChallenges] = useState(mockChallenges);
  const [filteredChallenges, setFilteredChallenges] = useState(mockChallenges);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    category: 'all',
    flag: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const stats = {
    total: challenges?.length,
    pending: challenges?.filter((c) => c?.status === 'pending')?.length,
    flagged: challenges?.filter((c) => c?.flags?.length > 0)?.length,
    approved: challenges?.filter((c) => c?.status === 'approved')?.length
  };

  useEffect(() => {
    let filtered = [...challenges];

    if (filters?.search) {
      filtered = filtered?.filter((c) =>
      c?.title?.toLowerCase()?.includes(filters?.search?.toLowerCase()) ||
      c?.creator?.name?.toLowerCase()?.includes(filters?.search?.toLowerCase())
      );
    }

    if (filters?.status !== 'all') {
      filtered = filtered?.filter((c) => c?.status === filters?.status);
    }

    if (filters?.category !== 'all') {
      filtered = filtered?.filter((c) => c?.category === filters?.category);
    }

    if (filters?.flag !== 'all') {
      if (filters?.flag === 'ip_risk') {
        filtered = filtered?.filter((c) => c?.ipRiskLevel === 'high' || c?.ipRiskLevel === 'medium');
      } else {
        filtered = filtered?.filter((c) => c?.flags?.some((f) => f?.reason?.toLowerCase()?.includes(filters?.flag?.replace('_', ' '))));
      }
    }

    if (filters?.dateFrom) {
      filtered = filtered?.filter((c) => c?.submissionDate >= filters?.dateFrom);
    }

    if (filters?.dateTo) {
      filtered = filtered?.filter((c) => c?.submissionDate <= filters?.dateTo);
    }

    if (sortConfig?.key) {
      filtered?.sort((a, b) => {
        let aValue, bValue;

        switch (sortConfig?.key) {
          case 'title':
            aValue = a?.title;
            bValue = b?.title;
            break;
          case 'creator':
            aValue = a?.creator?.name;
            bValue = b?.creator?.name;
            break;
          case 'status':
            aValue = a?.status;
            bValue = b?.status;
            break;
          case 'date':
            aValue = new Date(a.submissionDate + ' ' + a.submissionTime);
            bValue = new Date(b.submissionDate + ' ' + b.submissionTime);
            break;
          case 'votes':
            aValue = a?.upvotes - a?.downvotes;
            bValue = b?.upvotes - b?.downvotes;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortConfig?.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig?.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredChallenges(filtered);
  }, [filters, sortConfig, challenges]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = (value) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      category: 'all',
      flag: 'all',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleExport = () => {
    console.log('Exporting challenges:', filteredChallenges);
    alert('Export functionality would download CSV/Excel file with filtered results');
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(filteredChallenges?.map((c) => c?.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev?.filter((selectedId) => selectedId !== id));
    }
  };

  const handleQuickAction = (id, action) => {
    console.log('Quick action:', action, 'for challenge:', id);

    if (action === 'approve') {
      setChallenges((prev) => prev?.map((c) =>
      c?.id === id ? { ...c, status: 'approved' } : c
      ));
      alert('Challenge approved successfully');
    } else if (action === 'reject') {
      setChallenges((prev) => prev?.map((c) =>
      c?.id === id ? { ...c, status: 'rejected' } : c
      ));
      alert('Challenge rejected successfully');
    }
  };

  const handleBulkAction = (action) => {
    console.log('Bulk action:', action, 'for challenges:', selectedIds);

    if (action === 'approve') {
      setChallenges((prev) => prev?.map((c) =>
      selectedIds?.includes(c?.id) ? { ...c, status: 'approved' } : c
      ));
      alert(`${selectedIds?.length} challenges approved successfully`);
    } else if (action === 'reject') {
      setChallenges((prev) => prev?.map((c) =>
      selectedIds?.includes(c?.id) ? { ...c, status: 'rejected' } : c
      ));
      alert(`${selectedIds?.length} challenges rejected successfully`);
    } else if (action === 'flag') {
      alert(`${selectedIds?.length} challenges flagged for review`);
    } else if (action === 'delete') {
      if (confirm(`Are you sure you want to delete ${selectedIds?.length} challenges? This action cannot be undone.`)) {
        setChallenges((prev) => prev?.filter((c) => !selectedIds?.includes(c?.id)));
        alert(`${selectedIds?.length} challenges deleted successfully`);
      }
    }

    setSelectedIds([]);
  };

  const handleViewDetails = (challenge) => {
    setSelectedChallenge(challenge);
  };

  const handleCloseModal = () => {
    setSelectedChallenge(null);
  };

  const handleApproveChallenge = (id, notes) => {
    setChallenges((prev) => prev?.map((c) =>
    c?.id === id ? { ...c, status: 'approved', adminNotes: notes } : c
    ));
    setSelectedChallenge(null);
    alert('Challenge approved and creator notified');
  };

  const handleRejectChallenge = (id, notes) => {
    setChallenges((prev) => prev?.map((c) =>
    c?.id === id ? { ...c, status: 'rejected', adminNotes: notes } : c
    ));
    setSelectedChallenge(null);
    alert('Challenge rejected and creator notified');
  };

  const handleSaveNotes = (id, notes) => {
    setChallenges((prev) => prev?.map((c) =>
    c?.id === id ? { ...c, adminNotes: notes } : c
    ));
    alert('Admin notes saved successfully');
  };

  const handleDismissAlert = (id) => {
    setAlerts((prev) => prev?.filter((alert) => alert?.id !== id));
  };

  const handleViewAllAlerts = () => {
    console.log('View all alerts');
    alert('Navigate to full alerts management page');
  };

  return (
    <AuthenticationGuard user={mockUser} requireAuth={true} requireAdmin={true}>
      <Helmet>
        <title>Admin Challenge Management - NPC Designer Platform</title>
        <meta name="description" content="Moderate and manage community challenges with comprehensive administrative tools and workflow management" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header
          user={mockUser}
          notifications={3}
          expProgress={85}
          currentTier={mockUser?.tier} />


        <main className="main-content pb-12">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Challenge Management</h1>
                <p className="text-muted-foreground">Review, moderate, and manage community challenge submissions</p>
              </div>
              <AdminAccessToggle user={mockUser} />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ChallengeStatsCard
                icon="Layers"
                label="Total Challenges"
                value={stats?.total}
                trend="up"
                trendValue="+12%"
                variant="default" />

              <ChallengeStatsCard
                icon="Clock"
                label="Pending Review"
                value={stats?.pending}
                trend="up"
                trendValue="+3"
                variant="warning" />

              <ChallengeStatsCard
                icon="Flag"
                label="Flagged Content"
                value={stats?.flagged}
                trend="down"
                trendValue="-2"
                variant="error" />

              <ChallengeStatsCard
                icon="CheckCircle"
                label="Approved Today"
                value={stats?.approved}
                trend="up"
                trendValue="+8"
                variant="success" />

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Filters */}
                <FilterControls
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onSearch={handleSearch}
                  onExport={handleExport}
                  onReset={handleResetFilters}
                  resultCount={filteredChallenges?.length} />


                {/* Table */}
                <ChallengeTable
                  challenges={filteredChallenges}
                  selectedIds={selectedIds}
                  onSelectAll={handleSelectAll}
                  onSelectOne={handleSelectOne}
                  onSort={handleSort}
                  sortConfig={sortConfig}
                  onQuickAction={handleQuickAction}
                  onViewDetails={handleViewDetails} />

              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <SystemAlertsPanel
                  alerts={alerts}
                  onDismiss={handleDismissAlert}
                  onViewAll={handleViewAllAlerts} />

              </div>
            </div>
          </div>
        </main>

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedCount={selectedIds?.length}
          onBulkAction={handleBulkAction}
          onClearSelection={() => setSelectedIds([])} />


        {/* Detail Modal */}
        {selectedChallenge &&
        <ChallengeDetailModal
          challenge={selectedChallenge}
          onClose={handleCloseModal}
          onApprove={handleApproveChallenge}
          onReject={handleRejectChallenge}
          onSaveNotes={handleSaveNotes} />

        }
      </div>
    </AuthenticationGuard>);

};

export default AdminChallengeManagement;