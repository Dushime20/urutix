import { useState, useEffect } from 'react';
import axios from 'axios';

interface ContactSettings {
  phone: string;
  email: string;
  address: string;
}

const DEFAULT_CONTACT: ContactSettings = {
  phone: '+250788309463',
  email: 'hello@urutix.com',
  address: 'Kigali, Rwanda · Nairobi, Kenya',
};

export function useContactSettings() {
  const [contact, setContact] = useState<ContactSettings>(DEFAULT_CONTACT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContactSettings = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3005'}/api/settings/public/contact`);
        setContact(response.data);
      } catch (error) {
        console.warn('Failed to fetch contact settings, using defaults', error);
        setContact(DEFAULT_CONTACT);
      } finally {
        setLoading(false);
      }
    };

    fetchContactSettings();
  }, []);

  return { contact, loading };
}
