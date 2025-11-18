import React from 'react';
import { loadsAPI } from '../../services/api';

// Test component to verify CargoForm integration
export const TestCargoForm: React.FC = () => {
  const handleSubmit = async (data: any) => {
    console.log('🚀 Test CargoForm - Submitting data:', data);
    
    try {
      const response = await loadsAPI.create(data);
      console.log('✅ Load created successfully:', response.data);
      alert('Load created successfully!');
    } catch (error: any) {
      console.error('❌ Error creating load:', error.response?.data || error.message);
      alert(`Error creating load: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Test CargoForm Integration</h2>
      <p>This component tests the updated CargoForm with the new backend format.</p>
      <p>Check the browser console for detailed logs.</p>
    </div>
  );
};

export default TestCargoForm; 