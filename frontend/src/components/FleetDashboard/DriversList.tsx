import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaSearch, FaUser, FaEnvelope, FaPhone, FaIdCard, FaTruck, FaTrash, FaEye, FaPlus, FaTimes } from 'react-icons/fa';
import { fleetApi } from '../../services/fleetApi';
import type { Driver } from '../../services/fleetApi';

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
	const [itemsPerPage] = useState(10);
	const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			setLoading(true);
			try {
				const list = await fleetApi.getDrivers({
					search: search || undefined,
					status: statusFilter || undefined,
					availabilityStatus: availabilityFilter || undefined,
				});
				if (!cancelled) setDrivers(Array.isArray(list) ? list : []);
			} catch {
				if (!cancelled) setDrivers([]);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		load();
		return () => {
			cancelled = true;
		};
	}, [search, statusFilter, availabilityFilter, refreshKey, refreshTrigger]);

	const filteredDrivers = useMemo(() => {
		return drivers;
	}, [drivers]);

	const totalItems = filteredDrivers.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
	const paginatedDrivers = useMemo(() => {
		const start = (currentPage - 1) * itemsPerPage;
		return filteredDrivers.slice(start, start + itemsPerPage);
	}, [filteredDrivers, currentPage, itemsPerPage]);

	const handleDelete = async (driverId: string) => {
		if (!confirm('Delete this driver?')) return;
		await fleetApi.deleteDriver(driverId);
		setRefreshKey((k) => k + 1);
	};

	const handleView = (driver: Driver) => {
		setSelectedDriver(driver);
	};

	return (
		<div>
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
					<div className="relative">
						<FaSearch className="absolute left-3 top-3 text-gray-400" />
						<input
							type="text"
							value={search}
							onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
							placeholder="Search name, license, email..."
							className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<select
						value={statusFilter}
						onChange={(e) => { setStatusFilter(e.target.value as StatusOption); setCurrentPage(1); }}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg"
					>
						<option value="">All Status</option>
						<option value="ACTIVE">Active</option>
						<option value="INACTIVE">Inactive</option>
						<option value="SUSPENDED">Suspended</option>
						<option value="ON_LEAVE">On leave</option>
						<option value="TERMINATED">Terminated</option>
					</select>
					<select
						value={availabilityFilter}
						onChange={(e) => { setAvailabilityFilter(e.target.value as AvailabilityOption); setCurrentPage(1); }}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg"
					>
						<option value="">All Availability</option>
						<option value="AVAILABLE">Available</option>
						<option value="UNAVAILABLE">Unavailable</option>
						<option value="IN_TRANSIT">In transit</option>
					</select>
					<div className="flex items-center text-sm text-gray-600">Total: {totalItems}</div>
				</div>
			</div>

			<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Truck</th>
								<th className="px-4 py-3" />
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{loading ? (
								<tr>
									<td className="px-4 py-6 text-center text-gray-500" colSpan={9}>Loading...</td>
								</tr>
							) : paginatedDrivers.length === 0 ? (
								<tr>
									<td className="px-4 py-6 text-center text-gray-500" colSpan={9}>No drivers found</td>
								</tr>
							) : (
								paginatedDrivers.map((d) => (
									<tr key={d.id} className="hover:bg-gray-50">
										<td className="px-4 py-3">
											<div className="font-medium text-gray-900">{d.firstName} {d.lastName}</div>
											<div className="text-xs text-gray-500 flex items-center gap-1"><FaIdCard /> {d.id.slice(0, 8)}...</div>
										</td>
										<td className="px-4 py-3 text-gray-700">{d.licenseNumber}</td>
										<td className="px-4 py-3 text-gray-700"><span className="inline-flex items-center gap-2"><FaEnvelope className="text-gray-400" />{d.email}</span></td>
										<td className="px-4 py-3 text-gray-700"><span className="inline-flex items-center gap-2"><FaPhone className="text-gray-400" />{d.phone || '-'}</span></td>
										<td className="px-4 py-3">
											<span className={`px-2 py-1 rounded-full text-xs font-medium ${d.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : d.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{d.status}</span>
										</td>
										<td className="px-4 py-3">
											<span className={`px-2 py-1 rounded-full text-xs font-medium ${d.availabilityStatus === 'AVAILABLE' ? 'bg-blue-100 text-blue-700' : d.availabilityStatus === 'IN_TRANSIT' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{d.availabilityStatus}</span>
										</td>
										<td className="px-4 py-3 text-gray-700">{typeof d.experience === 'number' ? `${d.experience} yrs` : '-'}</td>
										<td className="px-4 py-3 text-gray-700"><span className="inline-flex items-center gap-2"><FaTruck className="text-gray-400" />{d.currentTruckId ? `${d.currentTruckId.slice(0, 8)}...` : '-'}</span></td>
										<td className="px-4 py-3 text-right">
											<div className="inline-flex items-center gap-2">
												<button onClick={() => handleView(d)} className="px-2 py-1 text-sm text-gray-700 hover:text-gray-900 inline-flex items-center gap-1"><FaEye /> View</button>
												<button onClick={() => handleDelete(d.id)} className="px-2 py-1 text-sm text-red-600 hover:text-red-700 inline-flex items-center gap-1"><FaTrash /> Delete</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				<div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
					<div className="text-sm text-gray-600">Page {currentPage} of {totalPages}</div>
					<div className="flex items-center gap-2">
						<button
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage === 1}
							className={`px-3 py-1 rounded border text-sm ${currentPage === 1 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-white'}`}
						>
							Prev
						</button>
						<button
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={currentPage === totalPages}
							className={`px-3 py-1 rounded border text-sm ${currentPage === totalPages ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-white'}`}
						>
							Next
						</button>
					</div>
				</div>
			</div>

			{/* Driver Details Dialog */}
			{selectedDriver && createPortal(
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={() => setSelectedDriver(null)}>
					<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
						<div className="flex items-center justify-between p-6 border-b border-gray-200">
							<h2 className="text-2xl font-bold text-gray-900">Driver Details</h2>
							<button onClick={() => setSelectedDriver(null)} className="text-gray-400 hover:text-gray-600">
								<FaTimes className="w-6 h-6" />
							</button>
						</div>
						<div className="p-6 space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<h3 className="text-sm font-medium text-gray-500 mb-1">Full Name</h3>
									<p className="text-lg font-semibold text-gray-900">{selectedDriver.firstName} {selectedDriver.lastName}</p>
								</div>
								<div>
									<h3 className="text-sm font-medium text-gray-500 mb-1">Driver ID</h3>
									<p className="text-lg text-gray-900">{selectedDriver.id}</p>
								</div>
								<div>
									<h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
									<p className="text-lg text-gray-900 flex items-center gap-2"><FaEnvelope className="text-gray-400" />{selectedDriver.email}</p>
								</div>
								<div>
									<h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
									<p className="text-lg text-gray-900 flex items-center gap-2"><FaPhone className="text-gray-400" />{selectedDriver.phone || 'N/A'}</p>
								</div>
								<div>
									<h3 className="text-sm font-medium text-gray-500 mb-1">License Number</h3>
									<p className="text-lg text-gray-900 flex items-center gap-2"><FaIdCard className="text-gray-400" />{selectedDriver.licenseNumber}</p>
								</div>
								<div>
									<h3 className="text-sm font-medium text-gray-500 mb-1">Experience</h3>
									<p className="text-lg text-gray-900">{typeof selectedDriver.experience === 'number' ? `${selectedDriver.experience} years` : 'N/A'}</p>
								</div>
								<div>
									<h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
									<span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${selectedDriver.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : selectedDriver.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{selectedDriver.status}</span>
								</div>
								<div>
									<h3 className="text-sm font-medium text-gray-500 mb-1">Availability</h3>
									<span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${selectedDriver.availabilityStatus === 'AVAILABLE' ? 'bg-blue-100 text-blue-700' : selectedDriver.availabilityStatus === 'IN_TRANSIT' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{selectedDriver.availabilityStatus}</span>
								</div>
								<div>
									<h3 className="text-sm font-medium text-gray-500 mb-1">Assigned Truck</h3>
									<p className="text-lg text-gray-900 flex items-center gap-2"><FaTruck className="text-gray-400" />{selectedDriver.currentTruckId || 'Not assigned'}</p>
								</div>
								<div>
									<h3 className="text-sm font-medium text-gray-500 mb-1">Date of Birth</h3>
									<p className="text-lg text-gray-900">{selectedDriver.dateOfBirth ? new Date(selectedDriver.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
								</div>
								<div>
									<h3 className="text-sm font-medium text-gray-500 mb-1">License Expiry</h3>
									<p className="text-lg text-gray-900">{selectedDriver.licenseExpiry ? new Date(selectedDriver.licenseExpiry).toLocaleDateString() : 'N/A'}</p>
								</div>
								<div>
									<h3 className="text-sm font-medium text-gray-500 mb-1">Medical Certificate Expiry</h3>
									<p className="text-lg text-gray-900">{selectedDriver.medicalCertificateExpiry ? new Date(selectedDriver.medicalCertificateExpiry).toLocaleDateString() : 'N/A'}</p>
								</div>
							</div>
							{selectedDriver.address && (
								<div>
									<h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
									<p className="text-lg text-gray-900">{selectedDriver.address}</p>
								</div>
							)}
						</div>
						<div className="flex justify-end gap-3 p-6 border-t border-gray-200">
							<button onClick={() => setSelectedDriver(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
								Close
							</button>
						</div>
					</div>
				</div>,
				document.body
			)}
		</div>
	);
};

export default DriversList;


