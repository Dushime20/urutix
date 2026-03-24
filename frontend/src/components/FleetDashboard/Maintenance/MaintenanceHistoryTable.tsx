import React from 'react';
import { FaEye, FaEdit, FaTrash, FaCheck, FaClock, FaTools } from 'react-icons/fa';

interface MaintenanceRecord {
    id: string;
    truckId: string;
    plateNumber?: string; // If joined
    type: string;
    title: string;
    description: string;
    date: string;
    cost: number;
    status: string;
    vendor?: string;
}

interface MaintenanceHistoryTableProps {
    records: MaintenanceRecord[];
    loading?: boolean;
    onView: (record: MaintenanceRecord) => void;
    onEdit: (record: MaintenanceRecord) => void;
    onDelete: (id: string) => void;
}

const MaintenanceHistoryTable: React.FC<MaintenanceHistoryTableProps> = ({ records, loading, onView, onEdit, onDelete }) => {

    const getStatusBadge = (status: string) => {
        const s = status?.toUpperCase();
        if (s === 'COMPLETED' || s === 'DONE') return <span className="px-2 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center w-fit uppercase tracking-widest"><FaCheck className="mr-1.5" /> Completed</span>;
        if (s === 'SCHEDULED' || s === 'PENDING') return <span className="px-2 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100 flex items-center w-fit uppercase tracking-widest"><FaClock className="mr-1.5" /> Scheduled</span>;
        if (s === 'IN_PROGRESS' || s === 'REPAIRING') return <span className="px-2 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-100 flex items-center w-fit uppercase tracking-widest"><FaTools className="mr-1.5" /> In Progress</span>;
        if (s === 'FAULT_REPORT' || s === 'FAULT') return <span className="px-2 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-100 flex items-center w-fit uppercase tracking-widest"><FaTools className="mr-1.5" /> Fault Report</span>;
        return <span className="px-2 py-1 rounded-full text-[10px] font-black bg-slate-50 text-slate-600 border border-slate-100 uppercase tracking-widest">{status}</span>;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                </div>
                <div className="p-4 space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (records.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                    <FaTools className="h-full w-full" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No maintenance records found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by scheduling a new service.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {records.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(record.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{record.plateNumber || 'N/A'}</div>
                                    <div className="text-xs text-gray-500">ID: {record.truckId?.substring(0, 8)}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{record.title}</div>
                                    <div className="text-xs text-gray-500">{record.type}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {record.vendor || record.description?.match(/Vendor: (.*)\)/)?.[1] || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    ${record.cost?.toLocaleString() ?? '0.00'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(record.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => onView(record)} className="text-indigo-600 hover:text-indigo-900 mx-2" title="View Details">
                                        <FaEye />
                                    </button>
                                    <button onClick={() => onEdit(record)} className="text-blue-600 hover:text-blue-900 mx-2" title="Edit">
                                        <FaEdit />
                                    </button>
                                    <button onClick={() => onDelete(record.id)} className="text-red-600 hover:text-red-900 mx-2" title="Delete">
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MaintenanceHistoryTable;
