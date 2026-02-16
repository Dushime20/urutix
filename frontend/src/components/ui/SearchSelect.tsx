import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { FaSearch, FaChevronDown, FaCheck } from 'react-icons/fa';

export interface SearchSelectOption {
  id: string;
  label: string;
  description?: string;
  status?: string;
  [key: string]: any; // Allow additional properties
}

export interface SearchSelectProps {
  // Core props
  options?: SearchSelectOption[];
  value?: string;
  onValueChange?: (value: string, option: SearchSelectOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
  
  // Search functionality
  searchFunction?: (searchTerm: string) => Promise<SearchSelectOption[]> | SearchSelectOption[];
  searchPlaceholder?: string;
  showSearch?: boolean;
  searchDelay?: number; // Debounce delay in milliseconds
  
  // Customization
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  searchInputClassName?: string;
  optionClassName?: string;
  
  // Display options
  showStatus?: boolean;
  showDescription?: boolean;
  maxHeight?: string;
  
  // Custom renderers
  renderOption?: (option: SearchSelectOption, isSelected: boolean) => React.ReactNode;
  renderSelected?: (option: SearchSelectOption) => React.ReactNode;
  
  // Status configuration
  statusConfig?: {
    [key: string]: {
      color: string;
      icon?: string;
    };
  };
  
  // Additional features
  allowClear?: boolean;
  showCount?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  noOptionsMessage?: string;
}

const SearchSelect: React.FC<SearchSelectProps> = ({
  options = [],
  value,
  onValueChange,
  placeholder = 'Select an option',
  disabled = false,
  
  searchFunction,
  searchPlaceholder = 'Search...',
  showSearch = true,
  searchDelay = 300,
  
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  searchInputClassName = '',
  optionClassName = '',
  
  showStatus = false,
  showDescription = true,
  maxHeight = '15rem',
  
  renderOption,
  renderSelected,
  
  statusConfig = {
    active: { color: 'bg-green-100 text-green-800' },
    inactive: { color: 'bg-gray-100 text-gray-800' },
    suspended: { color: 'bg-red-100 text-red-800' },
  },
  
  allowClear = false,
  showCount = true,
  emptyMessage = 'No options found.',
  loadingMessage = 'Loading...',
  noOptionsMessage = 'No options available.',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [internalValue, setInternalValue] = useState(value || '');
  const [displayOptions, setDisplayOptions] = useState<SearchSelectOption[]>(options);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Update internal value when prop changes
  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  // Update display options when options prop changes
  useEffect(() => {
    if (!hasSearched) {
      setDisplayOptions(options);
    }
  }, [options, hasSearched]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHasSearched(false);
        setDisplayOptions(options);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, options]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, showSearch]);

  // Handle search with debouncing
  const handleSearch = useCallback(async (searchTerm: string) => {
    if (!searchFunction) return;

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debouncing
    searchTimeoutRef.current = setTimeout(async () => {
      if (searchTerm.trim() === '') {
        setDisplayOptions(options);
        setHasSearched(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasSearched(true);

      try {
        const results = await searchFunction(searchTerm);
        setDisplayOptions(Array.isArray(results) ? results : []);
      } catch (error) {
        console.error('Search error:', error);
        setDisplayOptions([]);
      } finally {
        setIsLoading(false);
      }
    }, searchDelay);
  }, [searchFunction, searchDelay, options]);

  // Call search function when search term changes
  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, handleSearch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const selectedOption = useMemo(() => {
    return displayOptions.find(option => option.id === internalValue) || null;
  }, [displayOptions, internalValue]);

  const handleOptionSelect = useCallback((optionId: string) => {
    const option = displayOptions.find(opt => opt.id === optionId) || null;
    setInternalValue(optionId);
    setIsOpen(false);
    setSearchTerm('');
    setHasSearched(false);
    setDisplayOptions(options);
    onValueChange?.(optionId, option);
  }, [displayOptions, onValueChange, options]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalValue('');
    onValueChange?.('', null);
  }, [onValueChange]);

  const getStatusColor = (status: string) => {
    return statusConfig[status]?.color || statusConfig.inactive?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    return statusConfig[status]?.icon || '●';
  };

  const defaultRenderOption = (option: SearchSelectOption, isSelected: boolean) => (
    <div className="flex items-center justify-between w-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{option.label}</span>
          {showStatus && option.status && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(option.status)}`}>
              <span className="mr-1">{getStatusIcon(option.status)}</span>
              {option.status}
            </span>
          )}
        </div>
        {showDescription && option.description && (
          <p className="text-sm text-gray-500 truncate mt-1">{option.description}</p>
        )}
      </div>
      {isSelected && (
        <FaCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
      )}
    </div>
  );

  const defaultRenderSelected = (option: SearchSelectOption) => (
    <div className="flex items-center gap-2">
      <span className="truncate">{option.label}</span>
      {showStatus && option.status && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(option.status)}`}>
          <span className="mr-1">{getStatusIcon(option.status)}</span>
          {option.status}
        </span>
      )}
    </div>
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          relative w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:border-gray-400 transition-colors
          ${selectedOption ? 'text-gray-900' : 'text-gray-500'}
          ${buttonClassName}
        `}
      >
        {selectedOption ? (
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {renderSelected ? renderSelected(selectedOption) : defaultRenderSelected(selectedOption)}
            </div>
            <div className="flex items-center gap-1">
              {allowClear && (
                <button
                  onClick={handleClear}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Clear selection"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <FaChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span>{placeholder}</span>
            <FaChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute z-[13000] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg ${dropdownClassName}`}>
          {/* Search Input */}
          {showSearch && (
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`
                    w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${searchInputClassName}
                  `}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className={`overflow-y-auto`} style={{ maxHeight }}>
            {isLoading ? (
              <div className="px-3 py-4 text-center text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>{loadingMessage}</span>
                </div>
              </div>
            ) : displayOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500">
                {hasSearched ? emptyMessage : noOptionsMessage}
              </div>
            ) : (
              displayOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleOptionSelect(option.id)}
                  className={`
                    w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                    ${internalValue === option.id ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}
                    ${optionClassName}
                  `}
                >
                  {renderOption ? renderOption(option, internalValue === option.id) : defaultRenderOption(option, internalValue === option.id)}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {showCount && !isLoading && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-500">
                {displayOptions.length} option{displayOptions.length !== 1 ? 's' : ''}
                {hasSearched && displayOptions.length !== options.length && (
                  <span> of {options.length}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSelect;
