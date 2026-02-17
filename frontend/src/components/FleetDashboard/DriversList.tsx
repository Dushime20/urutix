import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
	Search,
	User,
	Mail,
	Phone,
	CreditCard,
	Truck,
	Trash2,
	Plus,
	X,
	FileText,
	Download,
	ExternalLink,
	Users,
	AlertTriangle,
	CheckCircle2,
	Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fleetApi } from '../../services/fleetApi';
import { documentApi, type Document } from '../../services/documents/documentApi';
import type { Driver } from '../../services/fleetApi';
import toast from 'react-hot-toast';
import DocumentUploadModal from '../documents/DocumentUploadModal';
import StatCard from '../EnliteUI/Cards/StatCard';

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
	const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityOption>('');
	const [refreshKey, setRefreshKey] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
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
			toast.success('Driver records purged');
		} catch (e) {
			toast.error('Operation failed');
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

	return (
		<div className="space-y-8 pb-12">
			{/* Stats Matrix */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<StatCard
					title="Fleet Personnel"
					value={drivers.length}
					icon={<Users />}
					color="info" // bg-indigo-50 text-indigo-600 map
					subtitle="Total Drivers"
				/>
				<StatCard
					title="Active Duty"
					value={drivers.filter(d => d.status === 'ACTIVE').length}
					icon={<CheckCircle2 />}
					color="success" // bg-emerald-50 text-emerald-600 map
					subtitle="Operational"
				/>
				<StatCard
					title="Available"
					value={drivers.filter(d => d.availabilityStatus === 'AVAILABLE').length}
					icon={<Clock />}
					color="primary" // bg-blue-50 text-blue-600 map roughly
					subtitle="Ready to Dispatch"
				/>
				<StatCard
					title="Compliance Risk"
					value={drivers.filter(d => d.status === 'SUSPENDED').length}
					icon={<AlertTriangle />}
					color="error" // bg-rose-50 text-rose-600 map
					subtitle="Suspended"
					trend="Attention"
					trendDirection={drivers.filter(d => d.status === 'SUSPENDED').length > 0 ? 'down' : 'neutral'}
				/>
			</div>

			{/* Control Surface */}
			<div className="bg-white rounded-[32px] border border-slate-100 p-4 flex flex-col md:flex-row gap-4">
				<div className="flex-1 relative group">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
					<input
						type="text"
						placeholder="Search driver..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-50 rounded-[20px] text-[11px] font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all"
					/>
				</div>
				<div className="flex items-center gap-3">
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value as StatusOption)}
						className="px-4 py-3 bg-slate-50 border border-slate-50 rounded-[20px] text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none focus:bg-white focus:border-indigo-600 transition-all"
					>
						<option value="">Status</option>
						<option value="ACTIVE">Active</option>
						<option value="SUSPENDED">Suspended</option>
						<option value="ON_LEAVE">On Leave</option>
					</select>
					<button
						onClick={onAddDriver}
						className="px-6 py-3 bg-slate-900 text-white rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10"
					>
						<Plus size={14} /> Add New Driver
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
								<div className="size-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
									<User size={28} />
								</div>
								<div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(driver.status)}`}>
									{driver.status}
								</div>
							</div>
							<div className="mb-6">
								<h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">{driver.firstName} {driver.lastName}</h3>
								<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{driver.licenseNumber}</p>
							</div>
							<div className="space-y-3 mb-8">
								<div className="flex items-center gap-3 text-slate-500">
									<Mail size={14} className="text-indigo-400" />
									<span className="text-xs font-medium truncate">{driver.email}</span>
								</div>
								<div className="flex items-center gap-3 text-slate-500">
									<Phone size={14} className="text-indigo-400" />
									<span className="text-xs font-medium">{driver.phone || 'No Phone Data'}</span>
								</div>
								<div className="flex items-center gap-3 text-slate-500">
									<Truck size={14} className="text-indigo-400" />
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
										className="size-10 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl flex items-center justify-center transition-all"
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
				<div className="flex flex-col items-center justify-center py-20 animate-pulse">
					<div className="size-12 bg-slate-100 rounded-full mb-4" />
					<p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Personnel Grid...</p>
				</div>
			)}

			{!loading && drivers.length === 0 && (
				<div className="py-20 text-center flex flex-col items-center">
					<div className="size-16 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-200 mb-6"><Users size={32} /></div>
					<h3 className="text-lg font-black text-slate-900 tracking-tight">Zero Personnel Pulse</h3>
					<p className="text-sm font-medium text-slate-400 mt-2">The registry is currently empty of matching personnel data.</p>
				</div>
			)}

			{/* Details Portal */}
			{selectedDriver && createPortal(
				<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setSelectedDriver(null)}>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full p-8 relative overflow-hidden"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between mb-8">
							<div className="flex items-center gap-4">
								<div className="size-16 bg-indigo-50 rounded-[24px] flex items-center justify-center text-indigo-600 shadow-inner">
									<User size={32} />
								</div>
								<div>
									<h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedDriver.firstName} {selectedDriver.lastName}</h2>
									<p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Driver Profile Matrix</p>
								</div>
							</div>
							<button onClick={() => setSelectedDriver(null)} className="size-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
								<X size={20} />
							</button>
						</div>

						<div className="grid grid-cols-2 gap-8 mb-8">
							<div className="space-y-1">
								<p className="text-[9px] font-black uppercase tracking-widest text-slate-400">License Vector</p>
								<div className="flex items-center gap-2 font-bold text-slate-900"><CreditCard size={14} className="text-indigo-400" /> {selectedDriver.licenseNumber}</div>
							</div>
							<div className="space-y-1">
								<p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status Vector</p>
								<div className={`inline-block px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(selectedDriver.status)}`}>{selectedDriver.status}</div>
							</div>
							<div className="col-span-2 p-6 bg-slate-50 rounded-[24px] grid grid-cols-2 gap-6">
								<div>
									<p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Primary Email</p>
									<p className="text-sm font-bold text-slate-900 flex items-center gap-2"><Mail size={14} /> {selectedDriver.email}</p>
								</div>
								<div>
									<p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Mobile Terminal</p>
									<p className="text-sm font-bold text-slate-900 flex items-center gap-2"><Phone size={14} /> {selectedDriver.phone || 'N/A'}</p>
								</div>
							</div>
						</div>

						<button onClick={() => setSelectedDriver(null)} className="w-full h-12 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10">Close Profile</button>
					</motion.div>
				</div>,
				document.body
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
								<h2 className="text-2xl font-black text-slate-900 tracking-tight">Personnel Assets</h2>
								<p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
									Documentary Verification Index for {viewingDocsFor.firstName}
								</p>
							</div>
							<div className="flex gap-2">
								<button
									onClick={() => setUploadingDocFor(viewingDocsFor)}
									className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
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
									<div className="size-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
									<p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Asset Index...</p>
								</div>
							) : driverDocuments.length === 0 ? (
								<div className="py-20 text-center flex flex-col items-center">
									<div className="size-16 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-200 mb-6"><FileText size={32} /></div>
									<h3 className="text-lg font-black text-slate-900 tracking-tight">Zero Registry Pulse</h3>
									<p className="text-sm font-medium text-slate-400 mt-2">No verification assets have been indexed for this personal.</p>
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{driverDocuments.map(doc => (
										<div key={doc.id} className="p-5 rounded-[24px] bg-slate-50 border border-slate-50 hover:bg-white hover:border-slate-100 hover:shadow-lg transition-all group">
											<div className="flex items-start justify-between mb-4">
												<div className="size-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm"><FileText size={20} /></div>
												<div className="flex gap-1">
													<button onClick={() => handleDownloadDocument(doc)} className="size-8 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors shadow-sm"><Download size={14} /></button>
													<button onClick={() => window.open(documentApi.getDocumentViewUrl(doc.id), '_blank')} className="size-8 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors shadow-sm"><ExternalLink size={14} /></button>
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
