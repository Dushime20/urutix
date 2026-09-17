import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiBaseUrl } from '../config/environment';

export interface ContactSettings {
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  chatPhone: string;
}

const EMPTY_CONTACT: ContactSettings = {
  phone: '',
  email: '',
  address: '',
  workingHours: '',
  chatPhone: '',
};

function normalizeContact(data: Partial<ContactSettings> | null | undefined): ContactSettings {
  return {
    phone: data?.phone?.trim() || '',
    email: data?.email?.trim() || '',
    address: data?.address?.trim() || '',
    workingHours: data?.workingHours?.trim() || '',
    chatPhone: data?.chatPhone?.trim() || data?.phone?.trim() || '',
  };
}

export function useContactSettings() {
  const [contact, setContact] = useState<ContactSettings>(EMPTY_CONTACT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContactSettings = async () => {
      try {
        const response = await axios.get(`${getApiBaseUrl()}/settings/public/contact`);
        setContact(normalizeContact(response.data));
      } catch (error) {
        console.warn('Failed to fetch public contact settings', error);
        setContact(EMPTY_CONTACT);
      } finally {
        setLoading(false);
      }
    };

    fetchContactSettings();
  }, []);

  return { contact, loading };
}
