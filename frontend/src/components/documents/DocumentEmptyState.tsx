import React from 'react';
import { FileText, Box, Truck, CreditCard, Plus, Filter } from 'lucide-react';

interface DocumentEmptyStateProps {
  entityType?: string;
  hasFilters?: boolean;
  onUpload?: () => void;
  onClearFilters?: () => void;
}

export const DocumentEmptyState: React.FC<DocumentEmptyStateProps> = ({
  entityType,
  hasFilters = false,
  onUpload,
  onClearFilters,
}) => {
  const getEntityIcon = () => {
    switch (entityType) {
      case 'CARGO':
        return <Box className="w-16 h-16 text-gray-300" />;
      case 'TRIP':
        return <Truck className="w-16 h-16 text-gray-300" />;
      case 'FINANCIAL':
        return <CreditCard className="w-16 h-16 text-gray-300" />;
      default:
        return <FileText className="w-16 h-16 text-gray-300" />;
    }
  };

  const getEntityName = () => {
    switch (entityType) {
      case 'CARGO':
        return 'cargo';
      case 'TRIP':
        return 'trip';
      case 'FINANCIAL':
        return 'financial';
      default:
        return '';
    }
  };

  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="p-4 rounded-full bg-gray-100 mb-4">
          <Filter className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No documents match your filters
        </h3>
        <p className="text-gray-600 text-center max-w-md mb-6">
          Try adjusting your search or filter criteria to see more results.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
          >
            Clear All Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="p-4 rounded-full bg-gray-100 mb-4">
        {getEntityIcon()}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {entityType
          ? `No ${getEntityName()} documents yet`
          : 'No documents yet'}
      </h3>
      <p className="text-gray-600 text-center max-w-md mb-6">
        {entityType
          ? `Get started by uploading your first ${getEntityName()} document. Keep all your important files organized in one place.`
          : 'Get started by uploading your first document. Keep all your important files organized in one place.'}
      </p>
      {onUpload && (
        <button
          onClick={onUpload}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Upload {entityType ? `${getEntityName().charAt(0).toUpperCase() + getEntityName().slice(1)} ` : ''}Document
        </button>
      )}
    </div>
  );
};

