import React, { useEffect, useMemo, useState } from 'react';
import { FaSearch, FaUser, FaEnvelope, FaPhone, FaIdCard, FaTruck, FaTrash, FaEye, FaPlus } from 'react-icons/fa';
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
												<button className="px-2 py-1 text-sm text-gray-700 hover:text-gray-900 inline-flex items-center gap-1"><FaEye /> View</button>
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
		</div>
	);
};

export default DriversList;


