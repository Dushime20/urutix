import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import { fuelApi, type CreateFuelLogData } from '../services/fuelApi';
import { fleetApi } from '../services/fleetApi';
import toast from 'react-hot-toast';

interface AddFuelLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Truck {
    id: string;
    plateNumber: string;
    make?: string;
    model?: string;
}

interface Driver {
    id: string;
    firstName: string;
    lastName: string;
}

const AddFuelLogModal: React.FC<AddFuelLogModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [trucks, setTrucks] = useState<Truck[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [formData, setFormData] = useState<CreateFuelLogData>({
        truckId: '',
        driverId: '',
        fuelDate: new Date().toISOString().slice(0, 16),
        gallons: 0,
        pricePerGallon: 0,
        location: '',
        odometer: undefined,
        receiptNumber: '',
        paymentMethod: '',
        notes: '',
    });

    useEffect(() => {
        if (isOpen) {
            loadTrucksAndDrivers();
        }
    }, [isOpen]);

    const loadTrucksAndDrivers = async () => {
        try {
            const [trucksData, driversData] = await Promise.all([
                fleetApi.getTrucks(),
                fleetApi.getDrivers(),
            ]);
            setTrucks(trucksData);
            setDrivers(driversData);
        } catch (error) {
            console.error('Error loading trucks and drivers:', error);
            toast.error('Failed to load trucks and drivers');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.truckId || !formData.gallons || !formData.pricePerGallon || !formData.location) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            await fuelApi.createFuelLog(formData);
            toast.success('Fuel log added successfully!');
            onSuccess();
            onClose();
            resetForm();
        } catch (error) {
            console.error('Error creating fuel log:', error);
            toast.error('Failed to add fuel log');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            truckId: '',
            driverId: '',
            fuelDate: new Date().toISOString().slice(0, 16),
            gallons: 0,
            pricePerGallon: 0,
            location: '',
            odometer: undefined,
            receiptNumber: '',
            paymentMethod: '',
            notes: '',
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'gallons' || name === 'pricePerGallon' || name === 'odometer'
                ? parseFloat(value) || 0
                : value,
        }));
    };

    if (!isOpen) return null;

    const totalCost = formData.gallons * formData.pricePerGallon;

    return createPortal(
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={onClose}
                />

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    {/* Header */}
                    <div className="bg-orange-600 px-6 py-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Add Fuel Log</h3>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <FaTimes className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Truck Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Truck <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="truckId"
                                    value={formData.truckId}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value="">Select a truck</option>
                                    {trucks.map(truck => (
                                        <option key={truck.id} value={truck.id}>
                                            {truck.plateNumber} {truck.make && `- ${truck.make} ${truck.model}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Driver Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Driver
                                </label>
                                <select
                                    name="driverId"
                                    value={formData.driverId}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value="">Select a driver (optional)</option>
                                    {drivers.map(driver => (
                                        <option key={driver.id} value={driver.id}>
                                            {driver.firstName} {driver.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Fuel Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date & Time <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    name="fuelDate"
                                    value={formData.fuelDate}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Location <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g., Shell #402, TX"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {/* Gallons */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Gallons <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="gallons"
                                    value={formData.gallons || ''}
                                    onChange={handleChange}
                                    step="0.1"
                                    min="0"
                                    placeholder="0.0"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {/* Price Per Gallon */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Price per Gallon <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="pricePerGallon"
                                    value={formData.pricePerGallon || ''}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {/* Odometer */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Odometer Reading
                                </label>
                                <input
                                    type="number"
                                    name="odometer"
                                    value={formData.odometer || ''}
                                    onChange={handleChange}
                                    step="0.1"
                                    min="0"
                                    placeholder="Optional"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {/* Receipt Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Receipt Number
                                </label>
                                <input
                                    type="text"
                                    name="receiptNumber"
                                    value={formData.receiptNumber}
                                    onChange={handleChange}
                                    placeholder="Optional"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Method
                                </label>
                                <select
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value="">Select payment method</option>
                                    <option value="Company Card">Company Card</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Fuel Card">Fuel Card</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* Total Cost Display */}
                            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Total Cost:</span>
                                    <span className="text-2xl font-bold text-orange-600">
                                        ${totalCost.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Optional notes..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <FaSpinner className="w-4 h-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    'Add Fuel Log'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AddFuelLogModal;
