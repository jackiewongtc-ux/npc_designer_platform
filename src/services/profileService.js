import { supabase } from '../lib/supabase';

const profileService = {
  completeProfileSetup: async ({ igHandle, bodyMeasurements }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No user found");

    const { error } = await supabase
      .from('user_profiles')
      .update({
        ig_handle: igHandle,
        body_measurements: bodyMeasurements,
        onboarding_completed: true
      })
      .eq('id', user.id);

    if (error) throw error;
    return true;
  }
};

// This must be a DEFAULT export to match the change above
export default profileService;