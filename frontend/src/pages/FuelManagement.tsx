import React, { useState, useEffect } from 'react';
import {
    FaGasPump,
    FaTruck,
    FaDollarSign,
    FaSpinner,
    FaChartLine,
    FaPlus,
    FaExclamationTriangle,
} from 'react-icons/fa';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../components/ui';
import { fuelApi, type FuelLog, type FuelStatistics, type CreateFuelLogData } from '../services/fuelApi';
import { fleetApi } from '../services/fleetApi';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';

type TabType = 'all' | 'flagged';

const FuelManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<FuelLog[]>([]);
    const [statistics, setStatistics] = useState<FuelStatistics | null>(null);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [trucks, setTrucks] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<CreateFuelLogData>({
        truckId: '',
        driverId: '',
        fuelDate: new Date().toISOString().split('T')[0],
        gallons: 0,
        pricePerGallon: 0,
        location: '',
        odometer: undefined,
        receiptNumber: '',
        paymentMethod: 'CREDIT_CARD',
        notes: '',
    });

    useEffect(() => {
        loadData();
        loadTrucksAndDrivers();
    }, []);

    useEffect(() => {
        filterLogs();
    }, [activeTab, fuelLogs]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [logs, stats] = await Promise.all([
                fuelApi.getFuelLogs(),
                fuelApi.getFuelStatistics(),
            ]);
            setFuelLogs(logs);
            setStatistics(stats);
        } catch (error) {
            console.error('Error loading fuel data:', error);
            toast.error('Failed to load fuel data');
        } finally {
            setLoading(false);
        }
    };

    const loadTrucksAndDrivers = async () => {
        try {
            const [trucksData, driversData] = await Promise.all([
                fleetApi.getTrucks({}),
                fleetApi.getDrivers({}),
            ]);
            setTrucks(trucksData || []);
            setDrivers(driversData || []);
        } catch (error) {
            console.error('Error loading trucks and drivers:', error);
        }
    };

    const filterLogs = () => {
        if (activeTab === 'flagged') {
            setFilteredLogs(fuelLogs.filter(log => log.isFlagged));
        } else {
            setFilteredLogs(fuelLogs);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.truckId) {
            toast.error('Please select a truck');
            return;
        }

        setSubmitting(true);
        try {
            await fuelApi.createFuelLog(formData);
            toast.success('Fuel log added successfully');
            setShowAddForm(false);
            resetForm();
            loadData(); // Reload data
        } catch (error: any) {
            console.error('Error creating fuel log:', error);
            toast.error(error?.response?.data?.message || 'Failed to add fuel log');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            truckId: '',
            driverId: '',
            fuelDate: new Date().toISOString().split('T')[0],
            gallons: 0,
            pricePerGallon: 0,
            location: '',
            odometer: undefined,
            receiptNumber: '',
            paymentMethod: 'CREDIT_CARD',
            notes: '',
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['gallons', 'pricePerGallon', 'odometer'].includes(name)
                ? (value === '' ? undefined : Number(value))
                : value
        }));
    };

    const totalCost = formData.gallons && formData.pricePerGallon
        ? (formData.gallons * formData.pricePerGallon).toFixed(2)
        : '0.00';

    return (
        <div className="min-h-screen bg-gray-50 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                            Fuel Management
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            Monitor consumption, costs, and detect anomalies
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-white rounded-lg transition-colors font-medium shadow-sm text-sm sm:text-base"
                        style={{ backgroundColor: '#345e85' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a4d6d'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#345e85'}
                    >
                        <FaPlus className="w-4 h-4" />
                        Add Fuel Log
                    </button>
                </div>

                {/* Statistics Cards */}
                {statistics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Fuel Spend (MO)</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                                        ${statistics.totalSpend.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-emerald-600 font-medium mt-1">
                                        ↗ +4.2% vs last month
                                    </p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-3">
                                    <FaDollarSign className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Volume</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                                        {statistics.totalVolume.toLocaleString()}
                                        <span className="text-sm font-normal text-gray-600"> gal</span>
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Avg ${statistics.avgPricePerGallon.toFixed(2)} / gal
                                    </p>
                                </div>
                                <div className="bg-emerald-50 rounded-lg p-3">
                                    <FaGasPump className="w-6 h-6 text-emerald-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Fleet Efficiency</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                                        {statistics.fleetEfficiency.toFixed(1)}
                                        <span className="text-sm font-normal text-gray-600"> MPG</span>
                                    </p>
                                    <p className="text-xs text-emerald-600 font-medium mt-1">
                                        Above industry avg
                                    </p>
                                </div>
                                <div className="bg-violet-50 rounded-lg p-3">
                                    <FaChartLine className="w-6 h-6 text-violet-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Fraud Alerts</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                                        {statistics.fraudAlerts}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Suspicious transactions
                                    </p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-3">
                                    <FaExclamationTriangle className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 sm:space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={cn(
                                'whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors',
                                activeTab === 'all'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            )}
                        >
                            All Logs
                        </button>
                        <button
                            onClick={() => setActiveTab('flagged')}
                            className={cn(
                                'whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors flex items-center gap-2',
                                activeTab === 'flagged'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            )}
                        >
                            <FaExclamationTriangle className="w-3 h-3" />
                            Flagged Alerts
                        </button>
                    </nav>
                </div>

                {/* Fuel Logs Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <FaSpinner className="w-8 h-8 text-primary-600 animate-spin" />
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                        <FaGasPump className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Fuel Logs</h3>
                        <p className="text-gray-600">
                            {activeTab === 'flagged' ? 'No flagged logs found' : 'No fuel logs recorded yet'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">Date</th>
                                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">Vehicle</th>
                                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">Driver</th>
                                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">Location</th>
                                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">Gallons</th>
                                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-gray-700">Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="text-sm text-gray-900">
                                                    {new Date(log.fuelDate).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(log.fuelDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-gray-100 rounded p-1.5">
                                                        <FaTruck className="w-3 h-3 text-gray-600" />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {log.truck?.plateNumber || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-sm text-gray-900">
                                                    {log.driver ? `${log.driver.firstName} ${log.driver.lastName}` : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                                    {log.location}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {Number(log.gallons).toFixed(1)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    ${Number(log.totalCost).toFixed(2)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    ${Number(log.pricePerGallon).toFixed(2)} / gal
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Fuel Log Modal */}
            <Dialog open={showAddForm} onOpenChange={(open) => {
                if (!open) resetForm();
                setShowAddForm(open);
            }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Fuel Log</DialogTitle>
                        <DialogDescription>Record a new fuel purchase</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Truck Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Truck <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="truckId"
                                    value={formData.truckId}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="">Select a truck</option>
                                    {trucks.map(truck => (
                                        <option key={truck.id} value={truck.id}>
                                            {truck.plateNumber} - {truck.make} {truck.model}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Driver Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Driver (Optional)
                                </label>
                                <select
                                    name="driverId"
                                    value={formData.driverId}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="">Select a driver</option>
                                    {drivers.map(driver => (
                                        <option key={driver.id} value={driver.id}>
                                            {driver.firstName} {driver.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Fuel Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="fuelDate"
                                    value={formData.fuelDate}
                                    onChange={handleInputChange}
                                    required
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            {/* Gallons */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Gallons <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="gallons"
                                    value={formData.gallons || ''}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            {/* Price Per Gallon */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price per Gallon <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="pricePerGallon"
                                    value={formData.pricePerGallon || ''}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            {/* Total Cost (Calculated) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Total Cost
                                </label>
                                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 font-semibold">
                                    ${totalCost}
                                </div>
                            </div>

                            {/* Location */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Location <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., Shell Station, Main St, Nairobi"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            {/* Odometer */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Odometer Reading (Optional)
                                </label>
                                <input
                                    type="number"
                                    name="odometer"
                                    value={formData.odometer || ''}
                                    onChange={handleInputChange}
                                    min="0"
                                    placeholder="e.g., 45000"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            {/* Receipt Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Receipt Number (Optional)
                                </label>
                                <input
                                    type="text"
                                    name="receiptNumber"
                                    value={formData.receiptNumber}
                                    onChange={handleInputChange}
                                    placeholder="e.g., RCP-12345"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Method
                                </label>
                                <select
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="CREDIT_CARD">Credit Card</option>
                                    <option value="DEBIT_CARD">Debit Card</option>
                                    <option value="CASH">Cash</option>
                                    <option value="FUEL_CARD">Fuel Card</option>
                                    <option value="COMPANY_ACCOUNT">Company Account</option>
                                    <option value="MTN_MOBILE_MONEY">MTN Mobile Money</option>
                                </select>
                            </div>

                            {/* Notes */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder="Add any additional notes..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddForm(false);
                                    resetForm();
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2"
                                style={{ backgroundColor: '#345e85' }}
                                onMouseEnter={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#2a4d6d')}
                                onMouseLeave={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#345e85')}
                            >
                                {submitting ? (
                                    <>
                                        <FaSpinner className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FaPlus className="w-4 h-4" />
                                        Add Fuel Log
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FuelManagement;
