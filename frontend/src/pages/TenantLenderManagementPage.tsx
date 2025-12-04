import React, { useState, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import toast from 'react-hot-toast';
import { 
  FaTrash, 
  FaPlus, 
  FaEnvelope, 
  FaPhone, 
  FaBuilding, 
  FaSearch,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimes
} from 'react-icons/fa';

interface Lender {
  id: string;
  name: string;
  contact_email: string;
  status?: 'active' | 'paused' | 'suspended';
  created_at?: string;
}

const TenantLenderManagementPage: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLenders();
  }, []);

  const fetchLenders = async () => {
    try {
      setFetching(true);
      const data = await lendingApi.getTenantLenders();
      setLenders(data);
    } catch (err: any) {
      console.error('Error fetching lenders:', err);
      toast.error('Failed to load lenders');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      await lendingApi.createTenantLender({
        name: form.name,
        contact_email: form.email,
        callback_url: undefined
      });
      
      setSuccess(true);
      setForm({ name: '', email: '', phone: '' });
      setShowModal(false);
      setLoading(false);
      toast.success('Lender registered successfully');
      fetchLenders();
    } catch (err: any) {
      console.error('Error creating lender:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error registering lender';
      
      // Simplify error message for email conflicts
      let displayError = errorMessage;
      if (errorMessage.includes('already exists') || errorMessage.includes('email') || errorMessage.toLowerCase().includes('user with')) {
        displayError = 'Email already exists';
      }
      
      setError(displayError);
      setLoading(false);
      
      // Show simple error toast for email conflicts
      if (errorMessage.includes('already exists') || errorMessage.includes('email') || errorMessage.toLowerCase().includes('user with')) {
        toast.error('Email already exists', {
          duration: 5000,
        });
      } else {
        toast.error(displayError, {
          duration: 5000,
        });
      }
    }
  };

  const filteredLenders = lenders.filter(lender =>
    lender.name.toLowerCase().includes(search.toLowerCase()) ||
    lender.contact_email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lender Management</h1>
          <p className="text-gray-600">Manage lenders for your tenant</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search lenders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="ml-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <FaPlus /> New Lender
          </button>
        </div>

        {/* Lenders List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {fetching ? (
            <div className="p-8 text-center text-gray-500">Loading lenders...</div>
          ) : filteredLenders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {search ? 'No lenders found matching your search' : 'No lenders yet. Create your first lender to get started.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLenders.map((lender) => (
                    <tr key={lender.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaBuilding className="text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{lender.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <FaEnvelope className="mr-2" />
                          {lender.contact_email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          lender.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : lender.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {lender.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lender.created_at ? new Date(lender.created_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Lender Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg relative">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <FaPlus className="text-gray-600 text-xs" /> Register New Lender
                </h2>
                <button
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => {
                    setShowModal(false);
                    setForm({ name: '', email: '', phone: '' });
                    setError('');
                    setSuccess(false);
                  }}
                  title="Close"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <FaBuilding className="text-gray-500 text-xs" /> Lender Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <FaEnvelope className="text-gray-500 text-xs" /> Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="Contact Email"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <FaPhone className="text-gray-500 text-xs" /> Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="Contact Phone"
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <FaExclamationTriangle className="text-red-600 flex-shrink-0 w-3 h-3" />
                      <p className="text-red-700">{error}</p>
                    </div>
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <FaCheckCircle className="text-green-600" />
                      <p className="text-green-800 font-semibold">Lender registered successfully!</p>
                    </div>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-1.5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors text-xs"
                >
                  {loading ? 'Registering...' : 'Register Lender'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantLenderManagementPage;

