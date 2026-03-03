import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface Cargo {
    id: string;
    title: string;
    cargoType: string;
    pickupLocation?: { name: string };
    deliveryLocation?: { name: string };
}

interface AdvancedSearchProps {
    cargos: Cargo[];
    onSearch: (searchTerm: string) => void;
    placeholder?: string;
}

interface SearchSuggestion {
    type: 'id' | 'title' | 'route' | 'cargoType';
    value: string;
    label: string;
    cargo?: Cargo;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
    cargos,
    onSearch,
    placeholder = "Search by ID, title, route, or cargo type..."
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Generate suggestions based on search term
    const suggestions: SearchSuggestion[] = React.useMemo(() => {
        if (!searchTerm || searchTerm.length < 2) return [];

        const term = searchTerm.toLowerCase();
        const results: SearchSuggestion[] = [];
        const seen = new Set<string>();

        cargos.forEach(cargo => {
            // Search by ID
            if (cargo.id.toLowerCase().includes(term)) {
                const key = `id-${cargo.id}`;
                if (!seen.has(key)) {
                    results.push({
                        type: 'id',
                        value: cargo.id,
                        label: `ID: ${cargo.id.slice(0, 12)}...`,
                        cargo
                    });
                    seen.add(key);
                }
            }

            // Search by title
            if (cargo.title?.toLowerCase().includes(term)) {
                const key = `title-${cargo.title}`;
                if (!seen.has(key)) {
                    results.push({
                        type: 'title',
                        value: cargo.title,
                        label: cargo.title,
                        cargo
                    });
                    seen.add(key);
                }
            }

            // Search by route
            const route = `${cargo.pickupLocation?.name || ''} → ${cargo.deliveryLocation?.name || ''}`;
            if (route.toLowerCase().includes(term)) {
                const key = `route-${route}`;
                if (!seen.has(key) && cargo.pickupLocation && cargo.deliveryLocation) {
                    results.push({
                        type: 'route',
                        value: route,
                        label: route,
                        cargo
                    });
                    seen.add(key);
                }
            }

            // Search by cargo type
            if (cargo.cargoType?.toLowerCase().includes(term)) {
                const key = `type-${cargo.cargoType}`;
                if (!seen.has(key)) {
                    results.push({
                        type: 'cargoType',
                        value: cargo.cargoType,
                        label: `Type: ${cargo.cargoType}`,
                        cargo
                    });
                    seen.add(key);
                }
            }
        });

        return results.slice(0, 8); // Limit to 8 suggestions
    }, [searchTerm, cargos]);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setShowSuggestions(true);
        setSelectedIndex(-1);
        onSearch(value);
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion: SearchSuggestion) => {
        setSearchTerm(suggestion.value);
        setShowSuggestions(false);
        onSearch(suggestion.value);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    handleSuggestionClick(suggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedIndex(-1);
                break;
        }
    };

    // Handle clear
    const handleClear = () => {
        setSearchTerm('');
        setShowSuggestions(false);
        setSelectedIndex(-1);
        onSearch('');
        inputRef.current?.focus();
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get icon for suggestion type
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'id': return '🔖';
            case 'title': return '📦';
            case 'route': return '🗺️';
            case 'cargoType': return '📋';
            default: return '🔍';
        }
    };

    // Highlight matching text
    const highlightMatch = (text: string, term: string) => {
        if (!term) return text;

        const index = text.toLowerCase().indexOf(term.toLowerCase());
        if (index === -1) return text;

        const before = text.slice(0, index);
        const match = text.slice(index, index + term.length);
        const after = text.slice(index + term.length);

        return (
            <>
                {before}
                <span className="bg-yellow-200 font-semibold">{match}</span>
                {after}
            </>
        );
    };

    return (
        <div className="relative w-full">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                {searchTerm && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
                >
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={`${suggestion.type}-${suggestion.value}-${index}`}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${index === selectedIndex ? 'bg-primary-50' : ''
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl flex-shrink-0">{getTypeIcon(suggestion.type)}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                        {highlightMatch(suggestion.label, searchTerm)}
                                    </div>
                                    {suggestion.cargo && (
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {suggestion.cargo.pickupLocation?.name} → {suggestion.cargo.deliveryLocation?.name}
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs text-gray-400 uppercase font-medium flex-shrink-0">
                                    {suggestion.type}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No results message */}
            {showSuggestions && searchTerm.length >= 2 && suggestions.length === 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm"
                >
                    No results found for "{searchTerm}"
                </div>
            )}
        </div>
    );
};
