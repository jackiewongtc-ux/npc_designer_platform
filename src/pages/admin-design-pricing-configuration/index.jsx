import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase'
; // Corrected path for folder structure
import { ArrowLeft, Save, DollarSign, Percent, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function AdminPricingConfiguration() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });
  
  const [config, setConfig] = useState({
    base_price: 29.99,
    designer_commission: 70
  });

  useEffect(() => {
    fetchGlobalConfig();
  }, []);

  const fetchGlobalConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase?.from('site_settings')?.select('value')?.eq('key', 'pricing_config')?.single();

      if (data && data?.value) {
        setConfig(data?.value);
      }
    } catch (err) {
      console.log("No existing config found, using defaults.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setStatus({ type: '', msg: '' });

    try {
      const { error } = await supabase?.from('site_settings')?.upsert({ 
          key: 'pricing_config', 
          value: config,
          updated_at: new Date()?.toISOString()
        });

      if (error) throw error;
      setStatus({ type: 'success', msg: 'Platform pricing updated!' });
      setTimeout(() => setStatus({ type: '', msg: '' }), 3000);
    } catch (err) {
      setStatus({ type: 'error', msg: err?.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0F1A]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        
        <button
          onClick={() => navigate('/admin-challenge-management')}
          className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Admin
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">Platform Pricing</h1>
        <p className="text-gray-400 mb-10">Configure global rates for the entire platform.</p>

        {status?.msg && (
          <div className={`p-4 rounded-xl mb-8 flex items-center gap-3 border ${
            status?.type === 'success' ?'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :'bg-red-500/10 text-red-500 border-red-500/20'
          }`}>
            {status?.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-semibold">{status?.msg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-[#161B26] border border-gray-800 p-8 rounded-3xl shadow-xl">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-300">Base Sale Price ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="number"
                    step="0.01"
                    value={config?.base_price}
                    onChange={(e) => setConfig({...config, base_price: parseFloat(e?.target?.value)})}
                    className="w-full p-4 pl-12 bg-[#0B0F1A] border border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-gray-300">Designer Commission (%)</label>
                <div className="relative">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="number"
                    value={config?.designer_commission}
                    onChange={(e) => setConfig({...config, designer_commission: parseInt(e?.target?.value)})}
                    className="w-full p-4 pl-12 bg-[#0B0F1A] border border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-gray-500">
              Note: Changing these values affects all new transactions platform-wide.
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={saving} 
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold flex items-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}