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
	StickyNote,
	Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fleetApi } from '../../services/fleetApi';
import { documentApi, type Document } from '../../services/documents/documentApi';
import type { Driver } from '../../services/fleetApi';
import toast from 'react-hot-toast';
import DocumentUploadModal from '../documents/DocumentUploadModal';
import { cn } from '../../utils/cn';
import { CircularStatCard } from '../EnliteUI/Cards/StatCard';
import { DriverBreakManagement } from './DriverBreakManagement';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

type StatusOption = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ON_LEAVE' | 'TERMINATED' | '';
type AvailabilityOption = 'AVAILABLE' | 'UNAVAILABLE' | 'IN_TRANSIT' | '';

interface DriversListProps {
	onAddDriver?: () => void;
	onEditDriver?: (driver: Driver) => void;
	refreshTrigger?: number;
}

export const DriversList: React.FC<DriversListProps> = ({ onAddDriver, onEditDriver, refreshTrigger }) => {
	const { format: fmtCurrency } = useCurrencyFormat();
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
	const [editingDoc, setEditingDoc] = useState<Document | null>(null);
	const [editDocForm, setEditDocForm] = useState<{ title: string; description: string; expiryDate: string; file: File | null }>({ title: '', description: '', expiryDate: '', file: null });
	const [savingDocEdit, setSavingDocEdit] = useState(false);
	const [deleteConfirmDriver, setDeleteConfirmDriver] = useState<Driver | null>(null);
	const [deletingDriver, setDeletingDriver] = useState(false);

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

	const handleDelete = async (driver: Driver) => {
		setDeleteConfirmDriver(driver);
	};

	const confirmDelete = async () => {
		if (!deleteConfirmDriver) return;
		
		setDeletingDriver(true);
		try {
			await fleetApi.deleteDriver(deleteConfirmDriver.id);
			setRefreshKey((k) => k + 1);
			toast.success(`Driver ${deleteConfirmDriver.firstName} ${deleteConfirmDriver.lastName} deleted successfully`);
			setDeleteConfirmDriver(null);
		} catch (e) {
			toast.error('Failed to delete driver');
		} finally {
			setDeletingDriver(false);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status?.toUpperCase()) {
			case 'ACTIVE': return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
			case 'SUSPENDED': return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
			case 'ON_LEAVE': return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
			default: return 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
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

	const openEditDoc = (doc: Document) => {
		setEditingDoc(doc);
		setEditDocForm({
			title: doc.title,
			description: doc.description || '',
			expiryDate: doc.expiryDate ? doc.expiryDate.split('T')[0] : '',
			file: null,
		});
	};

	const handleSaveDocEdit = async () => {
		if (!editingDoc) return;
		setSavingDocEdit(true);
		try {
			await documentApi.updateDocument(
				editingDoc.id,
				{
					title: editDocForm.title,
					description: editDocForm.description,
					expiryDate: editDocForm.expiryDate || undefined,
				},
				editDocForm.file || undefined,
			);
			toast.success('Document updated successfully');
			setEditingDoc(null);
			// Refresh the document list
			if (viewingDocsFor) {
				const docs = await documentApi.getDocumentsByEntity('DRIVER', viewingDocsFor.id);
				setDriverDocuments(docs);
			}
		} catch {
			toast.error('Failed to update document');
		} finally {
			setSavingDocEdit(false);
		}
	};

	return (
		<div className="space-y-8 pb-12">
			{/* Stats Matrix */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12 place-items-center bg-white dark:bg-gray-900 p-10 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
				<CircularStatCard
					title="Total Drivers"
					value={drivers.length}
					icon={Users}
					colorClass="bg-blue-50 dark:bg-blue-950/20 text-[#345E85] dark:text-blue-400"
					secondaryColor="text-[#345E85] dark:text-blue-400"
				/>
				<CircularStatCard
					title="Active Duty"
					value={drivers.filter(d => d.status === 'ACTIVE').length}
					icon={CheckCircle2}
					colorClass="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
					secondaryColor="text-emerald-600 dark:text-emerald-400"
				/>
				<CircularStatCard
					title="Ready / Available"
					value={drivers.filter(d => d.availabilityStatus === 'AVAILABLE').length}
					icon={Clock}
					colorClass="bg-primary-50 dark:bg-primary-950/20 text-primary-500 dark:text-primary-400"
					secondaryColor="text-primary-500 dark:text-primary-400"
				/>
				<CircularStatCard
					title="Compliance Alerts"
					value={drivers.filter(d => d.status === 'SUSPENDED').length}
					icon={AlertTriangle}
					colorClass="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400"
					secondaryColor="text-rose-600 dark:text-rose-400"
				/>
			</div>

			{/* Control Surface */}
			<div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-col md:flex-row gap-4 transition-colors duration-200">
				<div className="flex-1 relative group">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
					<input
						type="text"
						placeholder="Search driver..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
					/>
				</div>
				<div className="flex items-center gap-3">
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value as StatusOption)}
						className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
					>
						<option value="">Status</option>
						<option value="ACTIVE">Active</option>
						<option value="SUSPENDED">Suspended</option>
						<option value="ON_LEAVE">On Leave</option>
					</select>
					<button
						onClick={onAddDriver}
						className="px-6 py-3 bg-blue-600 dark:bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 dark:hover:bg-blue-700 transition-all"
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
							className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-300 dark:hover:border-blue-600 transition-all relative overflow-hidden group"
						>
							<div className="flex items-start justify-between mb-6">
								<div className="size-14 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
									<Users size={28} />
								</div>
								<div className={`px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(driver.status)}`}>
									{driver.status}
								</div>
							</div>
							<div className="mb-6">
								<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{driver.firstName} {driver.lastName}</h3>
								<p className="text-xs font-medium text-gray-500 dark:text-gray-400">{driver.licenseNumber || 'License N/A'}</p>
							</div>
							<div className="space-y-3 mb-8">
								<div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
									<Mail size={14} className="text-blue-500 dark:text-blue-400" />
									<span className="text-sm font-medium truncate">{driver.email}</span>
								</div>
								<div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
									<Phone size={14} className="text-blue-500 dark:text-blue-400" />
									<span className="text-sm font-medium">{driver.phone || 'No Phone Data'}</span>
								</div>
								<div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
									<Truck size={14} className="text-blue-500 dark:text-blue-400" />
									<span className="text-sm font-medium truncate">{driver.currentTruckId ? `Truck ID: ${driver.currentTruckId.slice(0, 8)}` : 'Unassigned'}</span>
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
									className="flex-1 h-10 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
								>
									View
								</button>
								<div className="flex gap-1">
									<button
										onClick={() => setViewingDocsFor(driver)}
										className="size-10 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg flex items-center justify-center transition-all"
										title="View Documents"
									>
										<FileText size={16} />
									</button>
									<button
										onClick={() => onEditDriver?.(driver)}
										className="size-10 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg flex items-center justify-center transition-all"
										title="Edit Driver"
									>
										<Edit3 size={16} />
									</button>
									<button
										onClick={() => handleDelete(driver)}
										className="size-10 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg flex items-center justify-center transition-all"
										title="Delete Driver"
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
				<div className="flex flex-col items-center justify-center py-20 text-slate-300 dark:text-slate-700">
					<Loader2 className="size-8 animate-spin mb-4" />
					<p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Loading Drivers...</p>
				</div>
			)}

			{!loading && drivers.length === 0 && (
				<div className="py-24 text-center flex flex-col items-center bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
					<h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">No Drivers Found</h3>
					<p className="text-sm font-medium text-gray-400 dark:text-gray-500 mt-2 max-w-xs">Add your first driver to get started.</p>
				</div>
			)}

			{/* Details Portal - Comprehensive Driver Information */}
			{selectedDriver && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10001] p-4 animate-in fade-in duration-300">
					<div className="bg-white dark:bg-gray-900 rounded-lg max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800 transition-colors duration-300">
						{/* Header Section */}
						<div className="p-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 relative overflow-hidden shrink-0">
							<div className="absolute top-0 right-0 p-8 opacity-5">
								<Users size={140} className="text-slate-400" />
							</div>
							<div className="flex items-center gap-6 relative z-10">
								<div className="size-20 bg-primary-50 dark:bg-primary-950/30 rounded-[32px] flex items-center justify-center border border-primary-100 dark:border-primary-900/50">
									<Users size={40} className="text-primary-500 dark:text-primary-400" />
								</div>
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-2">
										<h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{selectedDriver.firstName} {selectedDriver.lastName}</h2>
										<div className={`px-3 py-1 rounded-full border border-primary-200 dark:border-primary-900/50 bg-primary-50 dark:bg-primary-950/20 text-[9px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400`}>
											{selectedDriver.status}
										</div>
										<div className={`px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400`}>
											{selectedDriver.availabilityStatus}
										</div>
									</div>
									<p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-4">
										<span className="flex items-center gap-1">
											<Mail size={12} className="text-primary-400" /> {selectedDriver.email}
										</span>
										{selectedDriver.phone && (
											<span className="flex items-center gap-1">
												<Phone size={12} className="text-primary-400" /> {selectedDriver.phone}
											</span>
										)}
										<span className="flex items-center gap-1">
											<CreditCard size={12} className="text-primary-400" /> {selectedDriver.licenseNumber}
										</span>
									</p>
								</div>
								<button 
									onClick={() => setSelectedDriver(null)} 
									className="size-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-all shrink-0"
								>
									<X size={20} />
								</button>
							</div>
						</div>

						{/* Scrollable Body */}
						<div className="flex-1 overflow-y-auto p-8">
							{/* Key Performance Metrics */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
								<div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/10 rounded-[24px] border border-emerald-200 dark:border-emerald-900/50 transition-colors">
									<div className="flex items-center gap-3 mb-2">
										<Star size={16} className="text-emerald-600 dark:text-emerald-400" />
										<span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Rating</span>
									</div>
									<p className="text-2xl font-black text-emerald-800 dark:text-emerald-100">{selectedDriver.rating ? Number(selectedDriver.rating).toFixed(1) : '0.0'}</p>
								</div>
								<div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 rounded-[24px] border border-blue-200 dark:border-blue-900/50 transition-colors">
									<div className="flex items-center gap-3 mb-2">
										<Truck size={16} className="text-blue-600 dark:text-blue-400" />
										<span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Total Trips</span>
									</div>
									<p className="text-2xl font-black text-blue-800 dark:text-blue-100">{selectedDriver.totalTrips || 0}</p>
								</div>
								<div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/10 rounded-[24px] border border-purple-200 dark:border-purple-900/50 transition-colors">
									<div className="flex items-center gap-3 mb-2">
										<Target size={16} className="text-purple-600 dark:text-purple-400" />
										<span className="text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">Safety Score</span>
									</div>
									<p className="text-2xl font-black text-purple-800 dark:text-purple-100">{selectedDriver.safetyScore ? `${Number(selectedDriver.safetyScore).toFixed(0)}%` : '100%'}</p>
								</div>
								<div className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/10 rounded-[24px] border border-amber-200 dark:border-amber-900/50 transition-colors">
									<div className="flex items-center gap-3 mb-2">
										<Clock size={16} className="text-amber-600 dark:text-amber-400" />
										<span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">On-Time Rate</span>
									</div>
									<p className="text-2xl font-black text-amber-800 dark:text-amber-100">{selectedDriver.onTimeDeliveryRate ? `${Number(selectedDriver.onTimeDeliveryRate).toFixed(0)}%` : '0%'}</p>
								</div>
							</div>

							{/* Main Information Grid */}
							<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
								{/* Personal Information */}
								<div className="space-y-6">
									<div className="bg-white dark:bg-slate-900/50 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm transition-colors">
										<h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary-500 dark:text-primary-400 mb-4">
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
									<div className="bg-white dark:bg-slate-900/50 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm transition-colors">
										<h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-rose-500 dark:text-rose-400 mb-4">
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
												<p className="text-sm text-slate-400 dark:text-slate-500 italic">No emergency contact information</p>
											)}
										</div>
									</div>

									{/* Safety & Break Management */}
									<DriverBreakManagement driverId={selectedDriver.id} />
								</div>

								{/* License & Employment */}
								<div className="space-y-6">
									<div className="bg-white dark:bg-slate-900/50 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm transition-colors">
										<h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary-500 dark:text-primary-400 mb-4">
											<CreditCard size={14} /> License Information
										</h4>
										<div className="space-y-4">
											<InfoRow label="License Number" value={selectedDriver.licenseNumber} />
											<InfoRow label="Issue Date" value={selectedDriver.licenseIssueDate ? new Date(selectedDriver.licenseIssueDate).toLocaleDateString() : 'N/A'} />
											<InfoRow label="Expiry Date" value={selectedDriver.licenseExpiry ? new Date(selectedDriver.licenseExpiry).toLocaleDateString() : 'N/A'} />
											<InfoRow label="State" value={selectedDriver.licenseState || 'N/A'} />
											<InfoRow label="Country" value={selectedDriver.licenseCountry || 'N/A'} />
											<div>
												<span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Classes</span>
												<div className="flex flex-wrap gap-1 mt-1">
													{selectedDriver.licenseClasses && selectedDriver.licenseClasses.length > 0 ? 
														selectedDriver.licenseClasses.map((cls, idx) => (
															<span key={idx} className="px-2 py-0.5 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-md text-[8px] font-black uppercase transition-colors">
																{cls}
															</span>
														)) : 
														<span className="text-[11px] text-slate-400 dark:text-slate-500">No classes specified</span>
													}
												</div>
											</div>
										</div>
									</div>

									<div className="bg-white dark:bg-slate-900/50 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm transition-colors">
										<h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary-500 dark:text-primary-400 mb-4">
											<Briefcase size={14} /> Employment Details
										</h4>
										<div className="space-y-4">
											<InfoRow label="Employment Type" value={selectedDriver.employmentType?.replace('_', ' ') || 'N/A'} />
											<InfoRow label="Hire Date" value={selectedDriver.hireDate ? new Date(selectedDriver.hireDate).toLocaleDateString() : 'N/A'} />
											<InfoRow label="Experience" value={`${selectedDriver.experience || 0} years`} />
											<InfoRow label="Hourly Rate" value={selectedDriver.hourlyRate ? fmtCurrency(Number(selectedDriver.hourlyRate)) : 'N/A'} />
											<InfoRow label="Mileage Rate" value={selectedDriver.mileageRate ? `${fmtCurrency(Number(selectedDriver.mileageRate))}/mile` : 'N/A'} />
											<InfoRow label="Total Earnings" value={fmtCurrency(selectedDriver.totalEarnings ? Number(selectedDriver.totalEarnings) : 0)} />
										</div>
									</div>
								</div>

								{/* Performance & Compliance */}
								<div className="space-y-6">
									<div className="bg-white dark:bg-slate-900/50 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm transition-colors">
										<h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-500 dark:text-emerald-400 mb-4">
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

									<div className="bg-white dark:bg-slate-900/50 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm transition-colors">
										<h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-amber-500 dark:text-amber-400 mb-4">
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
									<div className="bg-slate-900 dark:bg-black rounded-[28px] p-6 text-white border border-slate-800 transition-colors">
										<h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-400 mb-4">
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
								<div className="mt-8 bg-amber-50 dark:bg-amber-950/20 rounded-[28px] border border-amber-200 dark:border-amber-900/50 p-6 transition-colors font-inter">
									<h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-4">
										<StickyNote size={14} /> Driver Notes
									</h4>
									<p className="text-sm text-amber-800 dark:text-amber-100/80 leading-relaxed">{selectedDriver.driverNotes}</p>
								</div>
							)}
						</div>

						{/* Footer */}
						<div className="p-8 border-t border-slate-50 dark:border-slate-800 shrink-0 flex gap-4 bg-white dark:bg-slate-900 transition-colors">
							<button
								onClick={() => setUploadingDocFor(selectedDriver)}
								className="flex-1 py-4 bg-primary-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20"
							>
								Add Document
							</button>
							<button
								onClick={() => setViewingDocsFor(selectedDriver)}
								className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-inter"
							>
								View Documents
							</button>
							<button
								onClick={() => setSelectedDriver(null)}
								className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-inter"
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
						className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col relative overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between transition-colors">
							<div>
								<h2 className="text-2xl font-black text-primary-500 dark:text-primary-400 tracking-tight">Driver Documents</h2>
								<p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">
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
								<button onClick={() => setViewingDocsFor(null)} className="size-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
									<X size={20} />
								</button>
							</div>
						</div>

						<div className="flex-1 overflow-y-auto p-8">
							{loadingDocs ? (
								<div className="flex flex-col items-center justify-center py-20">
									<div className="size-12 border-4 border-slate-100 dark:border-slate-800 border-t-primary-500 rounded-full animate-spin mb-4" />
									<p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Loading documents...</p>
								</div>
							) : driverDocuments.length === 0 ? (
								<div className="py-20 text-center flex flex-col items-center">
									<div className="size-16 bg-slate-50 dark:bg-slate-800 rounded-[28px] flex items-center justify-center text-slate-200 dark:text-slate-700 mb-6 transition-colors"><FileText size={32} /></div>
									<h3 className="text-xl font-black text-primary-500 dark:text-primary-400 tracking-tight">No Documents</h3>
									<p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-2">No documents found for this driver.</p>
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{driverDocuments.map(doc => (
										<div key={doc.id} className="p-5 rounded-[24px] bg-slate-50 dark:bg-slate-800/50 border border-slate-50 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-100 dark:hover:border-slate-700 hover:shadow-lg transition-all group">
											<div className="flex items-start justify-between mb-4">
												<div className="size-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-primary-500 dark:text-primary-400 shadow-sm transition-colors cursor-pointer"><FileText size={20} /></div>
												<div className="flex gap-1">
													<button onClick={() => openEditDoc(doc)} className="size-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors shadow-sm" title="Edit document"><Edit3 size={14} /></button>
													<button onClick={() => handleDownloadDocument(doc)} className="size-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors shadow-sm" title="Download"><Download size={14} /></button>
													<button onClick={() => documentApi.openDocumentInNewTab(doc.id)} className="size-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors shadow-sm" title="Open in new tab"><ExternalLink size={14} /></button>
												</div>
											</div>
											<h4 className="font-black text-slate-900 dark:text-white text-sm tracking-tight mb-1 truncate transition-colors">{doc.title}</h4>
											<p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">{doc.originalFileName}</p>
											<div className="mt-4 flex items-center justify-between">
												<span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{documentApi.formatFileSize(doc.fileSize)}</span>
												<span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-colors ${doc.status === 'VERIFIED' ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'}`}>{doc.status}</span>
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

			{/* Edit Document Modal */}
			{editingDoc && createPortal(
				<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4" onClick={() => setEditingDoc(null)}>
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-800 overflow-hidden"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header */}
						<div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 dark:border-slate-800">
							<div>
								<h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Edit Document</h3>
								<p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 truncate max-w-[240px]">{editingDoc.originalFileName}</p>
							</div>
							<button onClick={() => setEditingDoc(null)} className="size-9 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
								<X size={16} />
							</button>
						</div>

						{/* Form */}
						<div className="px-8 py-6 space-y-5">
							<div>
								<label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Title *</label>
								<input
									type="text"
									value={editDocForm.title}
									onChange={(e) => setEditDocForm(f => ({ ...f, title: e.target.value }))}
									className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
								/>
							</div>

							<div>
								<label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Description</label>
								<textarea
									value={editDocForm.description}
									onChange={(e) => setEditDocForm(f => ({ ...f, description: e.target.value }))}
									rows={3}
									className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
								/>
							</div>

							<div>
								<label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Expiry Date</label>
								<input
									type="date"
									value={editDocForm.expiryDate}
									onChange={(e) => setEditDocForm(f => ({ ...f, expiryDate: e.target.value }))}
									className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
								/>
							</div>

							<div>
								<label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Replace File (optional)</label>
								<div className="flex items-center gap-3">
									<label className="flex-1 h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 cursor-pointer hover:border-primary-400 hover:text-primary-500 transition-all">
										<FileText size={14} />
										{editDocForm.file ? editDocForm.file.name : 'Click to select new file'}
										<input
											type="file"
											className="hidden"
											accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
											onChange={(e) => setEditDocForm(f => ({ ...f, file: e.target.files?.[0] || null }))}
										/>
									</label>
									{editDocForm.file && (
										<button onClick={() => setEditDocForm(f => ({ ...f, file: null }))} className="size-9 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-100 transition-colors flex-shrink-0">
											<X size={14} />
										</button>
									)}
								</div>
							</div>
						</div>

						{/* Footer */}
						<div className="flex gap-3 px-8 pb-8">
							<button
								onClick={() => setEditingDoc(null)}
								className="flex-1 h-11 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
							>
								Cancel
							</button>
							<button
								onClick={handleSaveDocEdit}
								disabled={savingDocEdit || !editDocForm.title.trim()}
								className="flex-1 h-11 bg-primary-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
							>
								{savingDocEdit ? (
									<><Loader2 size={14} className="animate-spin" /> Saving...</>
								) : 'Save Changes'}
							</button>
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

			{/* Delete Confirmation Modal */}
			{deleteConfirmDriver && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10002] p-4">
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl max-w-md w-full p-8 border border-slate-100 dark:border-slate-800 transition-colors"
					>
						<div className="text-center">
							<div className="size-16 bg-rose-50 dark:bg-rose-950/20 rounded-full flex items-center justify-center mx-auto mb-6">
								<AlertTriangle size={32} className="text-rose-500 dark:text-rose-400" />
							</div>
							
							<h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
								Delete Driver
							</h3>
							
							<p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
								Are you sure you want to delete{' '}
								<span className="font-bold text-slate-900 dark:text-white">
									{deleteConfirmDriver.firstName} {deleteConfirmDriver.lastName}
								</span>{' '}
								from the fleet registry?
							</p>
							
							<p className="text-xs text-slate-400 dark:text-slate-500 mb-8">
								This action cannot be undone. All driver data, documents, and history will be permanently removed.
							</p>
							
							<div className="flex gap-3">
								<button
									onClick={() => setDeleteConfirmDriver(null)}
									disabled={deletingDriver}
									className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50 font-inter"
								>
									Cancel
								</button>
								<button
									onClick={confirmDelete}
									disabled={deletingDriver}
									className="flex-1 py-3 bg-rose-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center gap-2 font-inter"
								>
									{deletingDriver ? (
										<>
											<Loader2 size={14} className="animate-spin" />
											Deleting...
										</>
									) : (
										'Delete Driver'
									)}
								</button>
							</div>
						</div>
					</motion.div>
				</div>
			)}
		</div>
	);
};

export default DriversList;

// Helper component for displaying information rows
const InfoRow = ({ label, value }: { label: string; value: string }) => (
	<div className="flex justify-between items-start">
		<span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex-shrink-0 w-24">{label}</span>
		<span className="text-[11px] font-black text-slate-900 dark:text-white text-right flex-1">{value}</span>
	</div>
);

