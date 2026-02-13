import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { 
  FaShoppingCart, 
  FaCheck, 
  FaStar, 
  FaBolt, 
  FaArrowLeft,
  FaGift,
  FaCalculator,
  FaInfoCircle,
  FaCreditCard,
  FaClock
} from 'react-icons/fa';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  discountPercentage: number;
}

const PurchaseCredits: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [estimatedUsage, setEstimatedUsage] = useState(100);

  // Fetch credit packages
  const { data: packagesData, isLoading } = useQuery({
    queryKey: ['credit-packages'],
    queryFn: async () => {
      const response = await api.get('/credits/packages');
      return response.data;
    },
  });

  // Fetch current balance
  const { data: balanceData } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: async () => {
      const response = await api.get('/credits/balance');
      return response.data;
    },
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const response = await api.post('/credits/purchase', {
        packageId,
        paymentMethodId: 'pm_default', // TODO: Integrate with actual payment method
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Successfully purchased ${data.data.package.credits} credits!`);
      queryClient.invalidateQueries({ queryKey: ['credit-balance'] });
      queryClient.invalidateQueries({ queryKey: ['credit-transactions'] });
      navigate('/billing');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to purchase credits');
    },
  });

  const handlePurchase = (packageId: string) => {
    setSelectedPackage(packageId);
    purchaseMutation.mutate(packageId);
  };

  const packages: CreditPackage[] = packagesData?.data || [];
  const currentBalance = balanceData?.data?.currentBalance || 0;

  const getPricePerCredit = (pkg: CreditPackage) => {
    return (pkg.price / pkg.credits).toFixed(4);
  };

  const getSavings = (pkg: CreditPackage) => {
    const baseRate = 0.15; // $0.15 per credit
    const basePrice = pkg.credits * baseRate;
    const savings = basePrice - pkg.price;
    return savings > 0 ? savings.toFixed(2) : '0.00';
  };

  const getRecommendedPackage = () => {
    if (estimatedUsage <= 100) return packages.find(p => p.credits === 100);
    if (estimatedUsage <= 500) return packages.find(p => p.credits === 500);
    if (estimatedUsage <= 1000) return packages.find(p => p.credits === 1000);
    return packages.find(p => p.credits === 5000);
  };

  if (isLoading) {
    return (
      <AdminPageLayout title="Purchase Credits" description="Top up your credit balance">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading credit packages...</p>
          </div>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Purchase Credits"
      description="Top up your credit balance to continue using platform features"
      actions={
        <button
          onClick={() => navigate('/admin/billing')}
          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium"
        >
          <FaArrowLeft />
          Back to Billing
        </button>
      }
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex flex-col items-center gap-4">
          <div className="inline-block">
            <span className="bg-gradient-to-r from-green-100 to-green-200 text-green-700 px-4 py-2 rounded-full text-sm font-bold border-2 border-green-300">
              🎁 Volume Discounts Available • Save Up to 47%
            </span>
          </div>
          
          {/* Current Balance Card */}
          <div className="inline-block bg-white rounded-xl shadow-lg px-8 py-4 border-2 border-indigo-200">
            <div className="flex items-center gap-4">
              <FaCreditCard className="text-3xl text-indigo-600" />
              <div className="text-left">
                <span className="text-sm text-slate-600 block">Current Balance</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {currentBalance.toLocaleString()} credits
                </span>
              </div>
            </div>
          </div>

          {/* Calculator Toggle */}
          <div>
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all font-bold shadow-md"
            >
              <FaCalculator />
              {showCalculator ? 'Hide' : 'Show'} Credit Calculator
            </button>
          </div>

          {/* Calculator */}
          {showCalculator && (
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FaCalculator className="text-indigo-600" />
                Estimate Your Credit Needs
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    How many credits do you need per month?
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="5000"
                    step="50"
                    value={estimatedUsage}
                    onChange={(e) => setEstimatedUsage(Number(e.target.value))}
                    className="w-full h-3 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-slate-600 mt-2">
                    <span>50</span>
                    <span className="font-bold text-indigo-600 text-xl">{estimatedUsage} credits</span>
                    <span>5,000</span>
                  </div>
                </div>
                {getRecommendedPackage() && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border-2 border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-700 font-medium">Recommended Package:</span>
                        <div className="text-2xl font-bold text-indigo-600 mt-1">
                          {getRecommendedPackage()?.credits.toLocaleString()} Credits
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-600">
                          ${getRecommendedPackage()?.price.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-600">
                          ${getPricePerCredit(getRecommendedPackage()!)} per credit
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Packages Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg, index) => {
            const isPopular = pkg.credits === 500 || pkg.credits === 1000;
            const isBestValue = pkg.credits === 5000;
            const isRecommended = getRecommendedPackage()?.id === pkg.id && showCalculator;
            const pricePerCredit = getPricePerCredit(pkg);
            const savings = getSavings(pkg);

            return (
              <div
                key={pkg.id}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all hover:scale-105 hover:shadow-2xl ${
                  isPopular ? 'ring-2 ring-indigo-400' : ''
                } ${isBestValue ? 'ring-4 ring-green-500 transform scale-105' : ''}
                ${isRecommended ? 'ring-4 ring-purple-500' : ''}`}
              >
                {/* Badge */}
                {isBestValue && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 text-sm font-bold rounded-bl-xl shadow-lg flex items-center gap-1">
                    <FaBolt /> BEST VALUE
                  </div>
                )}
                {isPopular && !isBestValue && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 text-sm font-bold rounded-bl-xl shadow-lg flex items-center gap-1">
                    <FaStar /> POPULAR
                  </div>
                )}
                {isRecommended && !isBestValue && !isPopular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 text-sm font-bold rounded-bl-xl shadow-lg flex items-center gap-1">
                    💡 FOR YOU
                  </div>
                )}

                {/* Package Content */}
                <div className={`p-6 ${
                  isBestValue ? 'bg-gradient-to-br from-green-50 to-green-100' :
                  isPopular ? 'bg-gradient-to-br from-indigo-50 to-purple-50' :
                  isRecommended ? 'bg-gradient-to-br from-purple-50 to-purple-100' :
                  'bg-gradient-to-br from-slate-50 to-white'
                }`}>
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {pkg.credits.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-600 font-medium">Credits</div>
                  </div>

                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-slate-900 mb-1">
                      ${pkg.price.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-600 font-medium">
                      ${pricePerCredit} per credit
                    </div>
                  </div>

                  {pkg.discountPercentage > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-3 mb-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-green-700 font-bold text-lg mb-1">
                        <FaGift />
                        {pkg.discountPercentage}% OFF
                      </div>
                      <div className="text-green-600 text-sm font-medium">
                        Save ${savings}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={purchaseMutation.isPending && selectedPackage === pkg.id}
                    className={`w-full py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg ${
                      isBestValue
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                        : isPopular
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                        : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:from-slate-900 hover:to-black'
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2`}
                  >
                    {purchaseMutation.isPending && selectedPackage === pkg.id ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaShoppingCart />
                        Purchase Now
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-slate-500 mt-2">
                    Valid for 12 months
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto border-2 border-indigo-100">
          <div className="flex items-center justify-center gap-3 mb-8">
            <FaInfoCircle className="text-3xl text-indigo-600" />
            <h2 className="text-3xl font-bold text-slate-900">
              Why Purchase Credits?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 bg-slate-50 rounded-lg p-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <FaCheck className="text-white text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Never Run Out</h3>
                <p className="text-slate-600 text-sm">
                  Keep your operations running smoothly without interruption
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-slate-50 rounded-lg p-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <FaClock className="text-white text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">12-Month Validity</h3>
                <p className="text-slate-600 text-sm">
                  Purchased credits are valid for 12 months from purchase date
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-slate-50 rounded-lg p-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <FaGift className="text-white text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Volume Discounts</h3>
                <p className="text-slate-600 text-sm">
                  Save up to 47% when you buy in bulk
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-slate-50 rounded-lg p-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <FaBolt className="text-white text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Instant Activation</h3>
                <p className="text-slate-600 text-sm">
                  Credits are added to your account immediately after purchase
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
            <div className="flex items-start gap-4">
              <div className="text-4xl">💡</div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-2 text-lg">Pro Tip</h3>
                <p className="text-slate-700 text-sm mb-3">
                  Consider upgrading your subscription plan if you consistently need more credits. 
                  Subscription plans offer better value and include additional features like AI matching, advanced analytics, and priority support!
                </p>
                <button
                  onClick={() => navigate('/admin/subscription/plans')}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-bold shadow-md"
                >
                  View Subscription Plans →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default PurchaseCredits;
