import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
	Search,
	Mail,
	Phone,
	CreditCard,
	Truck,
	Trash2,
	Star,
	Target,
	Briefcase,
	Calendar,
	Plus,
	X,
	FileText,
	Download,
	ExternalLink,
	Users,
	AlertTriangle,
	CheckCircle2,
	Clock,
	Loader2,
	Zap,
	ShieldCheck,
	Award,
	User,
	Activity,
	MapPin,
	Heart,
	StickyNote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fleetApi } from '../../services/fleetApi';
import { documentApi, type Document } from '../../services/documents/documentApi';
import type { Driver } from '../../services/fleetApi';
import toast from 'react-hot-toast';
import DocumentUploadModal from '../documents/DocumentUploadModal';
import { cn } from '../../utils/cn';

type StatusOption = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ON_LEAVE' | 'TERMINATED' | '';
type AvailabilityOption = 'AVAILABLE' | 'UNAVAILABLE' | 'IN_TRANSIT' | '';

interface DriversListProps {
	onAddDriver?: () => void;
	refreshTrigger?: number;
}

export const DriversList: React.FC<DriversListProps> = ({ onAddDriver, refreshTrigger }) => {
	const [drivers, setDrivers] = useState<Driver[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<StatusOption>('');
	const [availabilityFilter] = useState<AvailabilityOption>('');
	const [refreshKey, setRefreshKey] = useState(0);
	const [currentPage] = useState(1);
	const [itemsPerPage] = useState(12);
	const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
	const [viewingDocsFor, setViewingDocsFor] = useState<Driver | null>(null);
	const [driverDocuments, setDriverDocuments] = useState<Document[]>([]);
	const [loadingDocs, setLoadingDocs] = useState(false);
	const [uploadingDocFor, setUploadingDocFor] = useState<Driver | null>(null);

	const loadData = useCallback(async () => {
		setLoading(true);
		try {
			const list = await fleetApi.getDrivers({
				search: search || undefined,
				status: statusFilter || undefined,
				availabilityStatus: availabilityFilter || undefined,
			});
			setDrivers(Array.isArray(list) ? list : []);
		} catch {
			setDrivers([]);
		} finally {
			setLoading(false);
		}
	}, [search, statusFilter, availabilityFilter]);

	useEffect(() => {
		loadData();
	}, [loadData, refreshKey, refreshTrigger]);

	useEffect(() => {
		if (!viewingDocsFor) {
			setDriverDocuments([]);
			return;
		}
		const fetchDocuments = async () => {
			setLoadingDocs(true);
			try {
				const docs = await documentApi.getDocumentsByEntity('DRIVER', viewingDocsFor.id);
				setDriverDocuments(docs);
			} catch (error: any) {
				toast.error('Failed to load documents');
			} finally {
				setLoadingDocs(false);
			}
		};
		fetchDocuments();
	}, [viewingDocsFor]);

	const handleDelete = async (driverId: string) => {
		if (!confirm('Delete this driver from the fleet registry?')) return;
		try {
			await fleetApi.deleteDriver(driverId);
			setRefreshKey((k) => k + 1);
			toast.success('Driver deleted');
		} catch (e) {
			toast.error('Failed to delete driver');
		}
	};

	const getStatusColor = (status: string) => {
		switch (status?.toUpperCase()) {
			case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
			case 'SUSPENDED': return 'bg-rose-50 text-rose-600 border-rose-100';
			case 'ON_LEAVE': return 'bg-amber-50 text-amber-600 border-amber-100';
			default: return 'bg-slate-50 text-slate-600 border-slate-100';
		}
	};

	const paginatedDrivers = useMemo(() => {
		const start = (currentPage - 1) * itemsPerPage;
		return drivers.slice(start, start + itemsPerPage);
	}, [drivers, currentPage, itemsPerPage]);

	const handleDownloadDocument = async (doc: Document) => {
		try {
			const blob = await documentApi.downloadDocument(doc.id);
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = doc.originalFileName;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch {
			toast.error('Download failed');
		}
	};

	const CircularStatsCard = ({ title, value, icon: Icon, colorClass, secondaryColor }: any) => {
		return (
			<div className="flex flex-col items-center group">
				<div className="relative w-40 h-40 rounded-full bg-white border-[8px] border-slate-50 flex flex-col items-center justify-center transition-all duration-500 hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50">
					<svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.05]">
						<circle
							cx="80"
							cy="80"
							r="72"
							fill="none"
							stroke="currentColor"
							strokeWidth="3"
							strokeDasharray="452"
							strokeDashoffset="350"
							className={cn("opacity-10 transition-all duration-1000 group-hover:stroke-dashoffset-[200]", secondaryColor)}
						/>
					</svg>

					<div className={cn("p-2 rounded-2xl mb-2 bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-inherit transition-all duration-500 shadow-sm", colorClass)}>
						<Icon size={18} />
					</div>

					<div className="flex flex-col items-center px-4 w-full overflow-hidden">
						<span className="text-xl font-black text-[#0f172a] tracking-tight group-hover:scale-110 transition-transform duration-500 truncate w-full text-center">
							{value}
						</span>
					</div>

					<div className="absolute inset-4 rounded-full border border-dashed border-slate-100 opacity-50 group-hover:rotate-90 transition-transform duration-1000" />
				</div>

				<div className="mt-4 text-center px-2">
					<p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-[#345E85] transition-colors duration-300 line-clamp-1">
						{title}
					</p>
				</div>
			</div>
		);
	};

	return (
		<div className="space-y-8 pb-12">
			{/* Debug Info */}
			{selectedDriver && (
				<div className="fixed top-4 right-4 bg-red-500 text-white p-2 rounded z-[10000]">
					Selected: {selectedDriver.firstName} {selectedDriver.lastName}
				</div>
			)}
			{/* Stats Matrix */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12 place-items-center bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
				<CircularStatsCard
					title="Total Drivers"
					value={drivers.length}
					icon={Users}
					colorClass="bg-blue-50 text-[#345E85]"
					secondaryColor="text-[#345E85]"
				/>
				<CircularStatsCard
					title="Active Duty"
					value={drivers.filter(d => d.status === 'ACTIVE').length}
					icon={CheckCircle2}
					colorClass="bg-emerald-50 text-emerald-600"
					secondaryColor="text-emerald-600"
				/>
				<CircularStatsCard
					title="Ready / Available"
					value={drivers.filter(d => d.availabilityStatus === 'AVAILABLE').length}
					icon={Clock}
					colorClass="bg-primary-50 text-primary-500"
					secondaryColor="text-primary-500"
				/>
				<CircularStatsCard
					title="Compliance Alerts"
					value={drivers.filter(d => d.status === 'SUSPENDED').length}
					icon={AlertTriangle}
					colorClass="bg-rose-50 text-rose-600"
					secondaryColor="text-rose-600"
				/>
			</div>

			{/* Control Surface */}
			<div className="bg-white rounded-[32px] border border-slate-100 p-4 flex flex-col md:flex-row gap-4">
				<div className="flex-1 relative group">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
					<input
						type="text"
						placeholder="Search driver..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-50 rounded-[24px] text-[11px] font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary-50 focus:border-primary-500 outline-none transition-all"
					/>
				</div>
				<div className="flex items-center gap-3">
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value as StatusOption)}
						className="px-4 py-3 bg-slate-50 border border-slate-50 rounded-[20px] text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none focus:bg-white focus:border-primary-500 transition-all"
					>
						<option value="">Status</option>
						<option value="ACTIVE">Active</option>
						<option value="SUSPENDED">Suspended</option>
						<option value="ON_LEAVE">On Leave</option>
					</select>
					<button
						onClick={onAddDriver}
						className="px-6 py-3 bg-primary-500 text-white rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20"
					>
						<Plus size={14} /> Add Driver
					</button>
				</div>
			</div>

			{/* Personnel Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				<AnimatePresence mode='popLayout'>
					{paginatedDrivers.map(driver => (
						<motion.div
							layout
							key={driver.id}
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.9 }}
							whileHover={{ y: -5 }}
							className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
						>
							<div className="flex items-start justify-between mb-6">
								<div className="size-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
									<Users size={28} />
								</div>
								<div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(driver.status)}`}>
									{driver.status}
								</div>
							</div>
							<div className="mb-6">
								<h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">{driver.firstName} {driver.lastName}</h3>
								<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{driver.licenseNumber || 'License N/A'}</p>
							</div>
							<div className="space-y-3 mb-8">
								<div className="flex items-center gap-3 text-slate-500">
									<Mail size={14} className="text-primary-400" />
									<span className="text-xs font-medium truncate">{driver.email}</span>
								</div>
								<div className="flex items-center gap-3 text-slate-500">
									<Phone size={14} className="text-primary-400" />
									<span className="text-xs font-medium">{driver.phone || 'No Phone Data'}</span>
								</div>
								<div className="flex items-center gap-3 text-slate-500">
									<Truck size={14} className="text-primary-400" />
									<span className="text-xs font-medium truncate">{driver.currentTruckId ? `Truck ID: ${driver.currentTruckId.slice(0, 8)}` : 'Unassigned'}</span>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<button
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										console.log('View button clicked for driver:', driver.id, driver.firstName, driver.lastName);
										setSelectedDriver(driver);
									}}
									className="flex-1 h-10 bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all"
								>
									View
								</button>
								<div className="flex gap-1">
									<button
										onClick={() => setViewingDocsFor(driver)}
										className="size-10 bg-slate-50 text-slate-400 hover:text-primary-500 rounded-xl flex items-center justify-center transition-all"
									>
										<FileText size={16} />
									</button>
									<button
										onClick={() => handleDelete(driver.id)}
										className="size-10 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-xl flex items-center justify-center transition-all"
									>
										<Trash2 size={16} />
									</button>
								</div>
							</div>
						</motion.div>
					))}
				</AnimatePresence>
			</div>

			{loading && (
				<div className="flex flex-col items-center justify-center py-20 text-slate-300">
					<Loader2 className="size-8 animate-spin mb-4" />
					<p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Drivers...</p>
				</div>
			)}

			{!loading && drivers.length === 0 && (
				<div className="py-24 text-center flex flex-col items-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200">
					<h3 className="text-xl font-black text-slate-900 tracking-tight">No Drivers Found</h3>
					<p className="text-sm font-medium text-slate-400 mt-2 max-w-xs">Add your first driver to get started.</p>
				</div>
			)}

			{/* Details Portal - Comprehensive Driver Information */}
			{selectedDriver && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10001] p-4">
					<div className="bg-white rounded-[40px] shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
						{/* Header Section */}
						<div className="p-8 bg-white border-b border-slate-100 relative overflow-hidden shrink-0">
							<div className="absolute top-0 right-0 p-8 opacity-5">
								<Users size={140} className="text-slate-400" />
							</div>
							<div className="flex items-center gap-6 relative z-10">
								<div className="size-20 bg-primary-50 rounded-[32px] flex items-center justify-center border border-primary-100">
									<Users size={40} className="text-primary-500" />
								</div>
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-2">
										<h2 className="text-3xl font-black tracking-tight text-slate-900">{selectedDriver.firstName} {selectedDriver.lastName}</h2>
										<div className={`px-3 py-1 rounded-full border border-primary-200 bg-primary-50 text-[9px] font-black uppercase tracking-widest text-primary-600`}>
											{selectedDriver.status}
										</div>
										<div className={`px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-[9px] font-black uppercase tracking-widest text-emerald-600`}>
											{selectedDriver.availabilityStatus}
										</div>
									</div>
									<p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-4">
										<span className="flex items-center gap-1">
											<Mail size={12} /> {selectedDriver.email}
										</span>
										{selectedDriver.phone && (
											<span className="flex items-center gap-1">
												<Phone size={12} /> {selectedDriver.phone}
											</span>
										)}
										<span className="flex items-center gap-1">
											<CreditCard size={12} /> {selectedDriver.licenseNumber}
										</span>
									</p>
								</div>
								<button 
									onClick={() => setSelectedDriver(null)} 
									className="size-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all shrink-0"
								>
									<X size={20} />
								</button>
							</div>
						</div>

						{/* Scrollable Body */}
						<div className="flex-1 overflow-y-auto p-8">
							{/* Key Performance Metrics */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
								<div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-[24px] border border-emerald-200">
									<div className="flex items-center gap-3 mb-2">
										<Star size={16} className="text-emerald-600" />
										<span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Rating</span>
									</div>
									<p className="text-2xl font-black text-emerald-800">{selectedDriver.rating ? Number(selectedDriver.rating).toFixed(1) : '0.0'}</p>
								</div>
								<div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-[24px] border border-blue-200">
									<div className="flex items-center gap-3 mb-2">
										<Truck size={16} className="text-blue-600" />
										<span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Total Trips</span>
									</div>
									<p className="text-2xl font-black text-blue-800">{selectedDriver.totalTrips || 0}</p>
								</div>
								<div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-[24px] border border-purple-200">
									<div className="flex items-center gap-3 mb-2">
										<Target size={16} className="text-purple-600" />
										<span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Safety Score</span>
									</div>
									<p className="text-2xl font-black text-purple-800">{selectedDriver.safetyScore ? `${Number(selectedDriver.safetyScore).toFixed(0)}%` : '100%'}</p>
								</div>
								<div className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-[24px] border border-amber-200">
									<div className="flex items-center gap-3 mb-2">
										<Clock size={16} className="text-amber-600" />
										<span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">On-Time Rate</span>
									</div>
									<p className="text-2xl font-black text-amber-800">{selectedDriver.onTimeDeliveryRate ? `${Number(selectedDriver.onTimeDeliveryRate).toFixed(0)}%` : '0%'}</p>
								</div>
							</div>

							{/* Main Information Grid */}
							<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
								{/* Personal Information */}
								<div className="space-y-6">
									<div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
										<h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary-500 mb-4">
											<User size={14} /> Personal Information
										</h4>
										<div className="space-y-4">
											<InfoRow label="Full Name" value={`${selectedDriver.firstName} ${selectedDriver.lastName}`} />
											<InfoRow label="Date of Birth" value={selectedDriver.dateOfBirth ? new Date(selectedDriver.dateOfBirth).toLocaleDateString() : 'N/A'} />
											<InfoRow label="Address" value={selectedDriver.address || 'N/A'} />
											<InfoRow label="Phone" value={selectedDriver.phone || 'N/A'} />
											<InfoRow label="Email" value={selectedDriver.email} />
										</div>
									</div>

									{/* Emergency Contact */}
									<div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
										<h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-rose-500 mb-4">
											<Heart size={14} /> Emergency Contact
										</h4>
										<div className="space-y-4">
											{selectedDriver.emergencyContact && Object.keys(selectedDriver.emergencyContact).length > 0 ? (
												<>
													<InfoRow label="Name" value={selectedDriver.emergencyContact.name || 'N/A'} />
													<InfoRow label="Phone" value={selectedDriver.emergencyContact.phone || 'N/A'} />
													<InfoRow label="Relationship" value={selectedDriver.emergencyContact.relationship || 'N/A'} />
												</>
											) : (
												<p className="text-sm text-slate-400 italic">No emergency contact information</p>
											)}
										</div>
									</div>
								</div>

								{/* License & Employment */}
								<div className="space-y-6">
									<div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
										<h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary-500 mb-4">
											<CreditCard size={14} /> License Information
										</h4>
										<div className="space-y-4">
											<InfoRow label="License Number" value={selectedDriver.licenseNumber} />
											<InfoRow label="Issue Date" value={selectedDriver.licenseIssueDate ? new Date(selectedDriver.licenseIssueDate).toLocaleDateString() : 'N/A'} />
											<InfoRow label="Expiry Date" value={selectedDriver.licenseExpiry ? new Date(selectedDriver.licenseExpiry).toLocaleDateString() : 'N/A'} />
											<InfoRow label="State" value={selectedDriver.licenseState || 'N/A'} />
											<InfoRow label="Country" value={selectedDriver.licenseCountry || 'N/A'} />
											<div>
												<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classes</span>
												<div className="flex flex-wrap gap-1 mt-1">
													{selectedDriver.licenseClasses && selectedDriver.licenseClasses.length > 0 ? 
														selectedDriver.licenseClasses.map((cls, idx) => (
															<span key={idx} className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded-md text-[8px] font-black uppercase">
																{cls}
															</span>
														)) : 
														<span className="text-[11px] text-slate-400">No classes specified</span>
													}
												</div>
											</div>
										</div>
									</div>

									<div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
										<h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary-500 mb-4">
											<Briefcase size={14} /> Employment Details
										</h4>
										<div className="space-y-4">
											<InfoRow label="Employment Type" value={selectedDriver.employmentType?.replace('_', ' ') || 'N/A'} />
											<InfoRow label="Hire Date" value={selectedDriver.hireDate ? new Date(selectedDriver.hireDate).toLocaleDateString() : 'N/A'} />
											<InfoRow label="Experience" value={`${selectedDriver.experience || 0} years`} />
											<InfoRow label="Hourly Rate" value={selectedDriver.hourlyRate ? `$${Number(selectedDriver.hourlyRate).toFixed(2)}` : 'N/A'} />
											<InfoRow label="Mileage Rate" value={selectedDriver.mileageRate ? `$${Number(selectedDriver.mileageRate).toFixed(2)}/mile` : 'N/A'} />
											<InfoRow label="Total Earnings" value={selectedDriver.totalEarnings ? `$${Number(selectedDriver.totalEarnings).toLocaleString()}` : '$0'} />
										</div>
									</div>
								</div>

								{/* Performance & Compliance */}
								<div className="space-y-6">
									<div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
										<h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-500 mb-4">
											<Activity size={14} /> Performance Metrics
										</h4>
										<div className="space-y-4">
											<InfoRow label="Total Distance" value={selectedDriver.totalDistance ? `${Number(selectedDriver.totalDistance).toLocaleString()} km` : '0 km'} />
											<InfoRow label="Hours This Week" value={`${selectedDriver.hoursWorkedThisWeek || 0} hours`} />
											<InfoRow label="Hours This Month" value={`${selectedDriver.hoursWorkedThisMonth || 0} hours`} />
											<InfoRow label="Consecutive Driving" value={`${selectedDriver.consecutiveDrivingHours || 0} hours`} />
											<InfoRow label="Last Break" value={selectedDriver.lastBreakTime ? new Date(selectedDriver.lastBreakTime).toLocaleString() : 'N/A'} />
										</div>
									</div>

									<div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
										<h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-amber-500 mb-4">
											<ShieldCheck size={14} /> Compliance Status
										</h4>
										<div className="space-y-4">
											<InfoRow label="Medical Cert Expiry" value={selectedDriver.medicalCertExpiry ? new Date(selectedDriver.medicalCertExpiry).toLocaleDateString() : 'N/A'} />
											<InfoRow label="Drug Test Date" value={selectedDriver.drugTestDate ? new Date(selectedDriver.drugTestDate).toLocaleDateString() : 'N/A'} />
											<InfoRow label="Background Check" value={selectedDriver.backgroundCheckDate ? new Date(selectedDriver.backgroundCheckDate).toLocaleDateString() : 'N/A'} />
											<InfoRow label="Training Completion" value={selectedDriver.trainingCompletionDate ? new Date(selectedDriver.trainingCompletionDate).toLocaleDateString() : 'N/A'} />
										</div>
									</div>

									{/* Current Status */}
									<div className="bg-slate-900 rounded-[28px] p-6 text-white">
										<h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-300 mb-4">
											<MapPin size={14} /> Current Status
										</h4>
										<div className="space-y-3">
											<div className="flex justify-between items-center">
												<span className="text-[10px] font-bold text-slate-400 uppercase">Current Truck</span>
												<span className="text-sm font-bold text-white">{selectedDriver.currentTruckId ? `Truck ${selectedDriver.currentTruckId.slice(0, 8)}...` : 'Unassigned'}</span>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-[10px] font-bold text-slate-400 uppercase">Current Trip</span>
												<span className="text-sm font-bold text-white">{selectedDriver.currentTripId ? `Trip ${selectedDriver.currentTripId.slice(0, 8)}...` : 'No active trip'}</span>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-[10px] font-bold text-slate-400 uppercase">Location Updated</span>
												<span className="text-sm font-bold text-white">{selectedDriver.locationUpdatedAt ? new Date(selectedDriver.locationUpdatedAt).toLocaleString() : 'Never'}</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Driver Notes */}
							{selectedDriver.driverNotes && (
								<div className="mt-8 bg-amber-50 rounded-[28px] border border-amber-200 p-6">
									<h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-amber-600 mb-4">
										<StickyNote size={14} /> Driver Notes
									</h4>
									<p className="text-sm text-amber-800 leading-relaxed">{selectedDriver.driverNotes}</p>
								</div>
							)}
						</div>

						{/* Footer */}
						<div className="p-8 border-t border-slate-50 shrink-0 flex gap-4">
							<button
								onClick={() => setViewingDocsFor(selectedDriver)}
								className="flex-1 py-4 bg-slate-100 text-slate-700 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-200 transition-all"
							>
								View Documents
							</button>
							<button
								onClick={() => setSelectedDriver(null)}
								className="flex-1 py-4 bg-primary-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20"
							>
								Close Profile
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Documents Portal */}
			{viewingDocsFor && createPortal(
				<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setViewingDocsFor(null)}>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="bg-white rounded-[40px] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col relative overflow-hidden"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="p-8 border-b border-slate-50 flex items-center justify-between">
							<div>
								<h2 className="text-2xl font-black text-primary-500 tracking-tight">Driver Documents</h2>
								<p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
									Documents for {viewingDocsFor.firstName} {viewingDocsFor.lastName}
								</p>
							</div>
							<div className="flex gap-2">
								<button
									onClick={() => setUploadingDocFor(viewingDocsFor)}
									className="px-4 py-2 bg-primary-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20"
								>
									<Plus size={14} /> Add Document
								</button>
								<button onClick={() => setViewingDocsFor(null)} className="size-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
									<X size={20} />
								</button>
							</div>
						</div>

						<div className="flex-1 overflow-y-auto p-8">
							{loadingDocs ? (
								<div className="flex flex-col items-center justify-center py-20">
									<div className="size-12 border-4 border-slate-100 border-t-primary-500 rounded-full animate-spin mb-4" />
									<p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading documents...</p>
								</div>
							) : driverDocuments.length === 0 ? (
								<div className="py-20 text-center flex flex-col items-center">
									<div className="size-16 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-200 mb-6"><FileText size={32} /></div>
									<h3 className="text-xl font-black text-primary-500 tracking-tight">No Documents</h3>
									<p className="text-sm font-medium text-slate-400 mt-2">No documents found for this driver.</p>
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{driverDocuments.map(doc => (
										<div key={doc.id} className="p-5 rounded-[24px] bg-slate-50 border border-slate-50 hover:bg-white hover:border-slate-100 hover:shadow-lg transition-all group">
											<div className="flex items-start justify-between mb-4">
												<div className="size-10 bg-white rounded-xl flex items-center justify-center text-primary-500 shadow-sm"><FileText size={20} /></div>
												<div className="flex gap-1">
													<button onClick={() => handleDownloadDocument(doc)} className="size-8 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors shadow-sm"><Download size={14} /></button>
													<button onClick={() => window.open(documentApi.getDocumentViewUrl(doc.id), '_blank')} className="size-8 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-primary-500 transition-colors shadow-sm"><ExternalLink size={14} /></button>
												</div>
											</div>
											<h4 className="font-black text-slate-900 text-sm tracking-tight mb-1 truncate">{doc.title}</h4>
											<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{doc.originalFileName}</p>
											<div className="mt-4 flex items-center justify-between">
												<span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{documentApi.formatFileSize(doc.fileSize)}</span>
												<span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-white border border-slate-100 ${doc.status === 'VERIFIED' ? 'text-emerald-500' : 'text-amber-500'}`}>{doc.status}</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</motion.div>
				</div>,
				document.body
			)}

			{/* Upload Portal Integration */}
			{uploadingDocFor && (
				<DocumentUploadModal
					isOpen={true}
					onClose={() => setUploadingDocFor(null)}
					onSuccess={() => {
						if (viewingDocsFor?.id === uploadingDocFor.id) {
							documentApi.getDocumentsByEntity('DRIVER', viewingDocsFor.id).then(setDriverDocuments);
						}
						setUploadingDocFor(null);
					}}
					initialEntityType="DRIVER"
					initialEntityId={uploadingDocFor.id}
					lockEntity={true}
				/>
			)}
		</div>
	);
};

// Helper component for displaying information rows
const InfoRow = ({ label, value }: { label: string; value: string }) => (
	<div className="flex justify-between items-start">
		<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex-shrink-0 w-24">{label}</span>
		<span className="text-[11px] font-black text-slate-900 text-right flex-1">{value}</span>
	</div>
);

export default DriversList;
