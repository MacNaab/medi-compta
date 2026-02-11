/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { getProfile, updateProfile } from '@/lib/storage';

interface CloudProfile {
  fullName: string;
  adresse: string | null;
  siren: string | null;
  dateCreationEntreprise: string | null;
}

export function useCloudProfile() {
  const { user } = useAuth();
  const [cloudProfile, setCloudProfile] = useState<CloudProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCloudProfile = useCallback(async () => {
    if (!user) {
      setCloudProfile(null);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await (supabase.from('profilesv2' as any) as any)
        .select('full_name, adresse, siren, date_creation_entreprise')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching cloud profile:', error);
        // Fall back to local profile
        const localProfile = getProfile();
        setCloudProfile({
          fullName: localProfile.fullName,
          adresse: localProfile.adresse || null,
          siren: localProfile.siren || null,
          dateCreationEntreprise: localProfile.dateCreationEntreprise || null,
        });
      } else if (data) {
        const profile: CloudProfile = {
          fullName: data.full_name || '',
          adresse: data.adresse,
          siren: data.siren,
          dateCreationEntreprise: data.date_creation_entreprise,
        };
        setCloudProfile(profile);
        
        // Sync to local storage
        updateProfile({
          fullName: profile.fullName,
          adresse: profile.adresse || undefined,
          siren: profile.siren || undefined,
          dateCreationEntreprise: profile.dateCreationEntreprise || undefined,
        });
      }
    } catch (err) {
      console.error('Error in fetchCloudProfile:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCloudProfile();
  }, [fetchCloudProfile]);

  // Get the display name (cloud profile takes precedence when connected)
  const displayName = user && cloudProfile?.fullName 
    ? cloudProfile.fullName 
    : getProfile().fullName || 'Utilisateur';

  return {
    cloudProfile,
    loading,
    displayName,
    isConnected: !!user,
    refetch: fetchCloudProfile,
  };
}
