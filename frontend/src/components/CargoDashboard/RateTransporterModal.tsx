import React, { useState } from 'react';
import { X, Star, Truck, Clock, Shield, ThumbsUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { ratingService } from '@/services/ratingService';

interface Cargo {
    id: string;
    title: string;
    transporter?: {
        id: string;
        profile?: {
            companyName?: string;
            firstName?: string;
        };
    };
}

interface RateTransporterModalProps {
    cargo: Cargo;
    onClose: () => void;
    onSuccess: () => void;
}

export const RateTransporterModal: React.FC<RateTransporterModalProps> = ({
    cargo,
    onClose,
    onSuccess,
}) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [review, setReview] = useState('');
    const [categories, setCategories] = useState({
        punctuality: 0,
        communication: 0,
        cargoCondition: 0,
        professionalism: 0,
    });
    const [submitting, setSubmitting] = useState(false);

    const transporterName = cargo.transporter?.profile?.companyName ||
        cargo.transporter?.profile?.firstName ||
        'Transporter';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setSubmitting(true);
        try {
            // TODO: Replace with actual API call
            // await ratingService.rateTransporter(cargo.id, {
            //   rating,
            //   review,
            //   categories,
            // });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast.success('Rating submitted successfully!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to submit rating:', error);
            toast.error('Failed to submit rating. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const StarRating = ({ value, onChange }: { value: number; onChange: (val: number) => void }) => (
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                >
                    <Star
                        className={`w-8 h-8 ${star <= (hoverRating || value)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                            }`}
                    />
                </button>
            ))}
        </div>
    );

    const CategoryRating = ({
        label,
        icon,
        value,
        onChange
    }: {
        label: string;
        icon: React.ReactNode;
        value: number;
        onChange: (val: number) => void;
    }) => (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className="transition-transform hover:scale-110"
                    >
                        <Star
                            className={`w-5 h-5 ${star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                }`}
                        />
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Rate Transporter</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            How was your experience with {transporterName}?
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Cargo Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Truck className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Cargo: {cargo.title}</span>
                        </div>
                        <p className="text-xs text-blue-700">Transporter: {transporterName}</p>
                    </div>

                    {/* Overall Rating */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Overall Rating *
                        </label>
                        <div className="flex items-center gap-4">
                            <StarRating value={rating} onChange={setRating} />
                            <span className="text-2xl font-bold text-gray-900">
                                {rating > 0 ? `${rating}.0` : '-'}
                            </span>
                        </div>
                    </div>

                    {/* Category Ratings */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Rate Specific Aspects
                        </label>
                        <div className="space-y-2">
                            <CategoryRating
                                label="Punctuality"
                                icon={<Clock className="w-4 h-4 text-blue-600" />}
                                value={categories.punctuality}
                                onChange={(val) => setCategories({ ...categories, punctuality: val })}
                            />
                            <CategoryRating
                                label="Communication"
                                icon={<ThumbsUp className="w-4 h-4 text-green-600" />}
                                value={categories.communication}
                                onChange={(val) => setCategories({ ...categories, communication: val })}
                            />
                            <CategoryRating
                                label="Cargo Condition"
                                icon={<Shield className="w-4 h-4 text-purple-600" />}
                                value={categories.cargoCondition}
                                onChange={(val) => setCategories({ ...categories, cargoCondition: val })}
                            />
                            <CategoryRating
                                label="Professionalism"
                                icon={<Star className="w-4 h-4 text-orange-600" />}
                                value={categories.professionalism}
                                onChange={(val) => setCategories({ ...categories, professionalism: val })}
                            />
                        </div>
                    </div>

                    {/* Review Text */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Write a Review (Optional)
                        </label>
                        <textarea
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Share your experience with this transporter..."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">{review.length}/500 characters</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || rating === 0}
                            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {submitting ? 'Submitting...' : 'Submit Rating'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
