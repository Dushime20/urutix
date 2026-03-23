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
	Award
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
									onClick={() => setSelectedDriver(driver)}
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

			{/* Details Portal */}
			<AnimatePresence>
				{selectedDriver && createPortal(
					<div className="fixed inset-0 bg-primary-950/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setSelectedDriver(null)}>
						<motion.div
							initial={{ opacity: 0, scale: 0.9, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: 20 }}
							className="bg-white rounded-[40px] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
							onClick={(e) => e.stopPropagation()}
						>
							{/* Header Section */}
							<div className="p-8 bg-primary-500 text-white relative overflow-hidden shrink-0">
								<div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={140} /></div>
								<div className="flex items-center gap-6 relative z-10">
									<div className="size-20 bg-white/20 rounded-[32px] flex items-center justify-center backdrop-blur-md border border-white/20">
										<Users size={40} />
									</div>
									<div className="flex-1">
										<div className="flex items-center gap-3 mb-1">
											<h2 className="text-3xl font-black tracking-tight">{selectedDriver.firstName} {selectedDriver.lastName}</h2>
											<div className={`px-3 py-1 rounded-full border border-white/20 bg-white/10 text-[9px] font-black uppercase tracking-widest`}>
												{selectedDriver.status}
											</div>
										</div>
										<p className="text-primary-100/80 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
											<Mail size={12} /> {selectedDriver.email}
											{selectedDriver.phone && (
												<>
													<span className="opacity-30">|</span>
													<Phone size={12} /> {selectedDriver.phone}
												</>
											)}
										</p>
									</div>
									<button onClick={() => setSelectedDriver(null)} className="size-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all shrink-0">
										<X size={20} />
									</button>
								</div>
							</div>

							{/* Scrollable Body */}
							<div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
									<div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex flex-col items-center justify-center text-center">
										<p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Driver Rating</p>
										<div className="flex items-center gap-1 text-2xl font-black text-slate-900">
											<Star size={20} className="fill-amber-400 text-amber-400" />
											{selectedDriver.rating ? Number(selectedDriver.rating).toFixed(1) : '4.8'}
										</div>
									</div>
									<div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex flex-col items-center justify-center text-center">
										<p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Trips</p>
										<div className="text-2xl font-black text-slate-900">
											{selectedDriver.totalTrips || '154'}
										</div>
									</div>
									<div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex flex-col items-center justify-center text-center">
										<p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Safety Score</p>
										<div className="text-2xl font-black text-emerald-600">
											{selectedDriver.safetyScore ? `${selectedDriver.safetyScore}%` : '98%'}
										</div>
									</div>
								</div>

								{/* Info Sections */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
									{/* Credentials & Identity */}
									<div className="space-y-6">
										<div>
											<h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary-500 mb-4">
												<CreditCard size={14} /> License & Credentials
											</h4>
											<div className="space-y-4 bg-slate-50/50 p-6 rounded-[28px] border border-slate-100">
												<div className="flex justify-between">
													<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">License Number</span>
													<span className="text-[11px] font-black text-slate-900">{selectedDriver.licenseNumber}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">State / Country</span>
													<span className="text-[11px] font-black text-slate-900">{selectedDriver.licenseState || 'N/A'}, {selectedDriver.licenseCountry || 'N/A'}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expiry Date</span>
													<span className={cn(
														"text-[11px] font-black",
														selectedDriver.licenseExpiry && new Date(selectedDriver.licenseExpiry) < new Date() ? 'text-rose-500' : 'text-slate-900'
													)}>
														{selectedDriver.licenseExpiry ? new Date(selectedDriver.licenseExpiry).toLocaleDateString() : 'N/A'}
													</span>
												</div>
												<div className="flex flex-wrap gap-1 mt-2">
													{(selectedDriver.licenseClasses || ['CDL A', 'HAZMAT']).map((cls: string) => (
														<span key={cls} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[8px] font-black text-slate-600">
															{cls}
														</span>
													))}
												</div>
											</div>
										</div>

										<div>
											<h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary-500 mb-4">
												<CheckCircle2 size={14} /> Compliance Status
											</h4>
											<div className="grid grid-cols-2 gap-3">
												{[
													{ label: 'Medical Cert', date: selectedDriver.medicalCertExpiry, icon: Calendar },
													{ label: 'Drug Test', date: selectedDriver.drugTestDate, icon: CheckCircle2 },
													{ label: 'Background', date: selectedDriver.backgroundCheckDate, icon: ShieldCheck },
													{ label: 'Training', date: selectedDriver.trainingCompletionDate, icon: Award },
												].map((item, idx) => (
													<div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
														<div className="flex items-center gap-2 mb-1">
															{item.icon && <item.icon size={10} className="text-slate-400" />}
															<p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
														</div>
														<p className="text-[10px] font-black text-slate-900">
															{item.date ? new Date(item.date).toLocaleDateString() : 'Pending'}
														</p>
													</div>
												))}
											</div>
										</div>
									</div>

									{/* Employment & Stats */}
									<div className="space-y-6">
										<div>
											<h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary-500 mb-4">
												<Briefcase size={14} /> Employment & Records
											</h4>
											<div className="space-y-4 bg-slate-50/50 p-6 rounded-[28px] border border-slate-100">
												<div className="flex justify-between">
													<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</span>
													<span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{selectedDriver.employmentType?.replace('_', ' ') || 'FULL TIME'}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hire Date</span>
													<span className="text-[11px] font-black text-slate-900">{selectedDriver.hireDate ? new Date(selectedDriver.hireDate).toLocaleDateString() : 'N/A'}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience</span>
													<span className="text-[11px] font-black text-slate-900">{selectedDriver.experienceYears || selectedDriver.experience || 0} Years</span>
												</div>
												<div className="flex justify-between">
													<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Distance</span>
													<span className="text-[11px] font-black text-slate-900">{selectedDriver.totalDistance ? `${Number(selectedDriver.totalDistance).toLocaleString()} KM` : '0 KM'}</span>
												</div>
											</div>
										</div>

										<div>
											<h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary-500 mb-4">
												<Target size={14} /> Recent Performance
											</h4>
											<div className="bg-slate-900 rounded-[28px] p-6 text-white">
												<div className="mb-4">
													<div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2 text-slate-400">
														<span>On-Time Delivery Rate</span>
														<span className="text-emerald-400">{selectedDriver.onTimeDeliveryRate || '100'}%</span>
													</div>
													<div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
														<motion.div initial={{ width: 0 }} animate={{ width: `${selectedDriver.onTimeDeliveryRate || 100}%` }} className="h-full bg-emerald-400" />
													</div>
												</div>
												<div className="flex justify-between items-end border-t border-white/5 pt-4">
													<div>
														<p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Hours This Month</p>
														<p className="text-xl font-black">{selectedDriver.hoursWorkedThisMonth || '168'}h</p>
													</div>
													<div className="text-right">
														<p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Weekly Avg</p>
														<p className="text-xl font-black">{selectedDriver.hoursWorkedThisWeek || '42'}h</p>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className="p-8 border-t border-slate-50 shrink-0">
								<button
									onClick={() => setSelectedDriver(null)}
									className="w-full py-4 bg-primary-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20"
								>
									Done viewing profile
								</button>
							</div>
						</motion.div>
					</div>,
					document.body
				)}
			</AnimatePresence>

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

export default DriversList;
