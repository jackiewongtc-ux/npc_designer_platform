import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Save, Rocket } from 'lucide-react';
import { TierConfigurationForm } from './components/TierConfigurationForm';
import { ProfitCalculator } from './components/ProfitCalculator';
import { LaunchConfirmationModal } from './components/LaunchConfirmationModal';
import Button from '../../components/ui/Button';
import { designPricingService } from '../../services/designPricingService';

export default function AdminDesignPricingConfiguration() {
  const { id: designId } = useParams();
  const navigate = useNavigate();

  const [design, setDesign] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [supplierSettings, setSupplierSettings] = useState(null);
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Add UUID validation
  const isValidUUID = (id) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return id && uuidRegex?.test(id);
  };

  // Load design and supplier settings
  useEffect(() => {
    // Validate UUID before attempting to load data
    if (!isValidUUID(designId)) {
      setError('Invalid design ID. Please access this page through the admin panel.');
      setLoading(false);
      return;
    }
    
    loadDesignData();
  }, [designId]);

  const loadDesignData = async () => {
    try {
      setLoading(true);
      setError('');

      const [designData, supplierData] = await Promise.all([
        designPricingService?.getDesignById(designId),
        designPricingService?.getSupplierSettings()
      ]);

      setDesign(designData);
      setSupplierSettings(supplierData);

      // If design already has pricing data, load it
      if (designData?.tieredPricingData) {
        setTiers(designData?.tieredPricingData?.tiers || []);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load design data');
      console.error('Error loading design:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTiersChange = (updatedTiers) => {
    setTiers(updatedTiers);
  };

  const handleValidationChange = (valid) => {
    setIsValid(valid);
  };

  const handleSavePricing = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      const pricingData = {
        tiers: tiers,
        updatedAt: new Date()?.toISOString()
      };

      await designPricingService?.updateDesignPricing(designId, pricingData);
      
      setSuccessMessage('Pricing configuration saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to save pricing configuration');
      console.error('Error saving pricing:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLaunchPreOrder = () => {
    if (!isValid) {
      setError('Please fix validation errors before launching pre-order');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmLaunch = async () => {
    try {
      setSaving(true);
      setError('');
      setShowConfirmModal(false);

      const pricingData = {
        tiers: tiers,
        launchedAt: new Date()?.toISOString()
      };

      await designPricingService?.launchPreOrder(designId, pricingData);

      // Navigate to admin panel or show success
      navigate('/admin-challenge-management', { 
        state: { 
          message: 'Pre-order launched successfully! Design is now accepting orders.' 
        } 
      });
    } catch (err) {
      setError(err?.message || 'Failed to launch pre-order');
      console.error('Error launching pre-order:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading design data...</p>
        </div>
      </div>
    );
  }

  // Show error state for invalid UUID or failed data load
  if (error && !design) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium mb-2">Unable to Load Design</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <Button onClick={() => navigate('/admin-challenge-management')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Panel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Design Pricing Configuration - Configure Tiered Pricing</title>
        <meta 
          name="description" 
          content="Configure three-tier pricing structure for approved designs before launching pre-orders with automated calculations and validation controls" 
        />
      </Helmet>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/admin-challenge-management')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Admin Panel
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Configure Tiered Pricing
                </h1>
                <p className="text-gray-600 mt-2">
                  Set up three-tier pricing structure for design: {design?.title}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={handleSavePricing}
                  disabled={saving || !isValid}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Configuration
                </Button>
                <Button
                  variant="primary"
                  onClick={handleLaunchPreOrder}
                  disabled={saving || !isValid}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Rocket className="w-4 h-4" />
                  Launch Pre-order
                </Button>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Design Info Card */}
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {design?.title}
                </h2>
                <p className="text-gray-600 mb-4">{design?.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {design?.submissionStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Current Votes:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {design?.votesCount || 0}
                    </span>
                  </div>
                </div>
              </div>
              {design?.imageUrls?.[0] && (
                <img 
                  src={design?.imageUrls?.[0]} 
                  alt={design?.title}
                  className="w-32 h-32 object-cover rounded-lg"
                />
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Configuration Form */}
            <div>
              <TierConfigurationForm
                initialTiers={tiers}
                preorderGoal={100}
                supplierSettings={supplierSettings}
                onTiersChange={handleTiersChange}
                onValidationChange={handleValidationChange}
              />
            </div>

            {/* Right Column: Profit Calculator */}
            <div>
              <ProfitCalculator tiers={tiers} />
            </div>
          </div>

          {/* Launch Instructions */}
          <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              📋 Before Launching Pre-order
            </h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>✓ Verify all tier prices are correct and follow the hierarchy (Tier 2 &lt; Tier 1, Tier 3 &lt; Tier 2)</li>
              <li>✓ Ensure supplier costs are accurate for each volume bracket</li>
              <li>✓ Review platform profit margins for profitability</li>
              <li>✓ Confirm ranges don't overlap and cover expected order volumes</li>
              <li>✓ Save configuration before launching to preserve changes</li>
            </ul>
          </div>
        </div>
      </div>
      {/* Launch Confirmation Modal */}
      <LaunchConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmLaunch}
        tiers={tiers}
        designTitle={design?.title || ''}
      />
    </>
  );
}