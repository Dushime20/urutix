import React, { useState } from 'react';
import SearchSelect from '../SearchSelect';
import type { SearchSelectOption } from '../SearchSelect';

// Example data
const sampleOptions: SearchSelectOption[] = [
  {
    id: '1',
    label: 'John Doe',
    description: 'Software Engineer at Tech Corp',
    status: 'active',
    email: 'john@example.com'
  },
  {
    id: '2',
    label: 'Jane Smith',
    description: 'Product Manager at Startup Inc',
    status: 'active',
    email: 'jane@example.com'
  },
  {
    id: '3',
    label: 'Bob Johnson',
    description: 'Designer at Creative Agency',
    status: 'inactive',
    email: 'bob@example.com'
  },
  {
    id: '4',
    label: 'Alice Brown',
    description: 'Marketing Specialist',
    status: 'suspended',
    email: 'alice@example.com'
  },
  {
    id: '5',
    label: 'Charlie Wilson',
    description: 'Data Analyst at Analytics Co',
    status: 'active',
    email: 'charlie@example.com'
  }
];

const SearchSelectExample: React.FC = () => {
  const [selectedValue1, setSelectedValue1] = useState<string>('');
  const [selectedValue2, setSelectedValue2] = useState<string>('');
  const [selectedValue3, setSelectedValue3] = useState<string>('');
  const [selectedValue4, setSelectedValue4] = useState<string>('');

  // Example 1: Basic search function (synchronous)
  const basicSearchFunction = (searchTerm: string): SearchSelectOption[] => {
    if (!searchTerm.trim()) return sampleOptions;
    
    return sampleOptions.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Example 2: Async search function (simulating API call)
  const asyncSearchFunction = async (searchTerm: string): Promise<SearchSelectOption[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (!searchTerm.trim()) return sampleOptions;
    
    return sampleOptions.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Example 3: Advanced search with different logic
  const advancedSearchFunction = async (searchTerm: string): Promise<SearchSelectOption[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!searchTerm.trim()) return sampleOptions;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Different search logic based on search term
    if (searchLower.startsWith('active')) {
      return sampleOptions.filter(option => option.status === 'active');
    }
    
    if (searchLower.startsWith('email:')) {
      const emailSearch = searchLower.replace('email:', '').trim();
      return sampleOptions.filter(option => 
        option.email.toLowerCase().includes(emailSearch)
      );
    }
    
    // Regular search
    return sampleOptions.filter(option =>
      option.label.toLowerCase().includes(searchLower) ||
      option.description?.toLowerCase().includes(searchLower) ||
      option.email.toLowerCase().includes(searchLower)
    );
  };

  // Example 4: Search with external API simulation
  const apiSearchFunction = async (searchTerm: string): Promise<SearchSelectOption[]> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate API response with different data structure
    const apiResponse = [
      { id: 'api1', name: 'API User 1', role: 'Developer', status: 'active' },
      { id: 'api2', name: 'API User 2', role: 'Manager', status: 'active' },
      { id: 'api3', name: 'API User 3', role: 'Designer', status: 'inactive' },
    ];
    
    if (!searchTerm.trim()) return apiResponse.map(user => ({
      id: user.id,
      label: user.name,
      description: user.role,
      status: user.status
    }));
    
    return apiResponse
      .filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(user => ({
        id: user.id,
        label: user.name,
        description: user.role,
        status: user.status
      }));
  };

  // Custom renderer for option with email
  const renderOptionWithEmail = (option: SearchSelectOption, isSelected: boolean) => (
    <div className="flex items-center justify-between w-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{option.label}</span>
          <span className="text-xs text-gray-400">({option.email})</span>
        </div>
        <p className="text-sm text-gray-500 truncate mt-1">{option.description}</p>
      </div>
      {isSelected && (
        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );

  // Custom renderer for selected value
  const renderSelectedWithEmail = (option: SearchSelectOption) => (
    <div className="flex items-center gap-2">
      <span className="truncate">{option.label}</span>
      <span className="text-xs text-gray-400">({option.email})</span>
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">SearchSelect Component Examples</h1>
      
      {/* Basic Example with Search Function */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">1. Basic SearchSelect with Search Function</h2>
        <p className="text-sm text-gray-600">Synchronous search function with internal loading state</p>
        <div className="w-80">
          <SearchSelect
            options={sampleOptions}
            value={selectedValue1}
            onValueChange={(value, option) => {
              setSelectedValue1(value);
              console.log('Selected:', option);
            }}
            searchFunction={basicSearchFunction}
            placeholder="Search and select..."
            showStatus={true}
            showDescription={true}
            searchDelay={200}
          />
        </div>
      </div>

      {/* Async Search Example */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">2. Async Search Function</h2>
        <p className="text-sm text-gray-600">Asynchronous search with 800ms delay simulation</p>
        <div className="w-80">
          <SearchSelect
            options={sampleOptions}
            value={selectedValue2}
            onValueChange={(value, option) => {
              setSelectedValue2(value);
              console.log('Selected with async search:', option);
            }}
            searchFunction={asyncSearchFunction}
            placeholder="Async search..."
            showStatus={true}
            allowClear={true}
            searchDelay={500}
          />
        </div>
      </div>

      {/* Advanced Search Example */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">3. Advanced Search with Custom Logic</h2>
        <p className="text-sm text-gray-600">Try: "active", "email:john", or regular search terms</p>
        <div className="w-80">
          <SearchSelect
            options={sampleOptions}
            value={selectedValue3}
            onValueChange={(value, option) => {
              setSelectedValue3(value);
              console.log('Selected with advanced search:', option);
            }}
            searchFunction={advancedSearchFunction}
            placeholder="Try: active, email:john, or search..."
            showStatus={true}
            showDescription={true}
            searchDelay={300}
          />
        </div>
      </div>

      {/* API Search Example */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">4. API Search Simulation</h2>
        <p className="text-sm text-gray-600">Simulates external API call with data transformation</p>
        <div className="w-80">
          <SearchSelect
            value={selectedValue4}
            onValueChange={(value, option) => {
              setSelectedValue4(value);
              console.log('Selected from API:', option);
            }}
            searchFunction={apiSearchFunction}
            placeholder="API search simulation..."
            showStatus={true}
            showDescription={true}
            searchDelay={400}
            loadingMessage="Fetching from API..."
            emptyMessage="No API results found"
          />
        </div>
      </div>

      {/* Custom Styling Example */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">5. Custom Styling with Search Function</h2>
        <p className="text-sm text-gray-600">Custom colors and styling with search functionality</p>
        <div className="w-80">
          <SearchSelect
            options={sampleOptions}
            onValueChange={(value, option) => console.log('Custom styled selected:', option)}
            searchFunction={basicSearchFunction}
            placeholder="Choose with custom styling..."
            buttonClassName="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-600 hover:from-purple-600 hover:to-pink-600"
            dropdownClassName="border-purple-300 shadow-purple-100"
            searchInputClassName="border-purple-300 focus:ring-purple-500 focus:border-purple-500"
            optionClassName="hover:bg-purple-50 focus:bg-purple-50"
            renderOption={renderOptionWithEmail}
            renderSelected={renderSelectedWithEmail}
            showStatus={false}
            showCount={false}
            maxHeight="12rem"
            searchDelay={250}
          />
        </div>
      </div>

      {/* Minimal Example */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">6. Minimal SearchSelect</h2>
        <p className="text-sm text-gray-600">No search, no status, no description - just clean selection</p>
        <div className="w-80">
          <SearchSelect
            options={sampleOptions.map(opt => ({ id: opt.id, label: opt.label }))}
            onValueChange={(value, option) => console.log('Minimal selected:', option)}
            placeholder="Simple selection..."
            showSearch={false}
            showStatus={false}
            showDescription={false}
            showCount={false}
            className="w-64"
          />
        </div>
      </div>

      {/* Status Configuration Example */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">7. Custom Status Configuration</h2>
        <p className="text-sm text-gray-600">Custom status colors and icons</p>
        <div className="w-80">
          <SearchSelect
            options={sampleOptions}
            searchFunction={basicSearchFunction}
            onValueChange={(value, option) => console.log('Custom status selected:', option)}
            placeholder="Select with custom status..."
            showStatus={true}
            statusConfig={{
              active: { color: 'bg-emerald-100 text-emerald-800', icon: '🟢' },
              inactive: { color: 'bg-amber-100 text-amber-800', icon: '🟡' },
              suspended: { color: 'bg-rose-100 text-rose-800', icon: '🔴' }
            }}
            searchDelay={200}
          />
        </div>
      </div>

      {/* Selected Values Display */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800">Selected Values:</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Basic Search:</span> {selectedValue1 || 'None'}
          </div>
          <div>
            <span className="font-medium">Async Search:</span> {selectedValue2 || 'None'}
          </div>
          <div>
            <span className="font-medium">Advanced Search:</span> {selectedValue3 || 'None'}
          </div>
          <div>
            <span className="font-medium">API Search:</span> {selectedValue4 || 'None'}
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800">Usage Instructions:</h3>
        <div className="space-y-2 text-sm text-blue-700">
          <div>• <strong>Basic Search:</strong> Type any name, description, or email</div>
          <div>• <strong>Async Search:</strong> Has 800ms delay simulation</div>
          <div>• <strong>Advanced Search:</strong> Try "active", "email:john", or regular terms</div>
          <div>• <strong>API Search:</strong> Simulates external API with 1s delay</div>
          <div>• <strong>All searches</strong> have internal loading states managed by the component</div>
        </div>
      </div>
    </div>
  );
};

export default SearchSelectExample;
