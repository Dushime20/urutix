# SearchSelect Component

A highly customizable live search select component built with React and TypeScript. This component provides a searchable dropdown with extensive customization options.

## Features

- ✅ **Live search** with real-time filtering
- ✅ **Internal search function** support for API calls with automatic loading states
- ✅ **Fully customizable** styling with Tailwind CSS
- ✅ **Custom renderers** for options and selected values
- ✅ **Status indicators** with configurable colors and icons
- ✅ **Automatic loading states** and error handling
- ✅ **Keyboard navigation** and accessibility
- ✅ **Click outside to close** functionality
- ✅ **Clear selection** option
- ✅ **Option count** display
- ✅ **Responsive design**
- ✅ **Debounced search** to prevent excessive API calls

## Basic Usage

```tsx
import SearchSelect, { SearchSelectOption } from './SearchSelect';

const options: SearchSelectOption[] = [
  {
    id: '1',
    label: 'John Doe',
    description: 'Software Engineer',
    status: 'active'
  },
  {
    id: '2',
    label: 'Jane Smith',
    description: 'Product Manager',
    status: 'inactive'
  }
];

function MyComponent() {
  const [selectedValue, setSelectedValue] = useState('');

  return (
    <SearchSelect
      options={options}
      value={selectedValue}
      onValueChange={(value, option) => setSelectedValue(value)}
      placeholder="Select a person..."
      showStatus={true}
      showDescription={true}
    />
  );
}
```

## Props

### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `SearchSelectOption[]` | `[]` | Array of options to display |
| `value` | `string` | `undefined` | Currently selected value |
| `onValueChange` | `(value: string, option: SearchSelectOption \| null) => void` | `undefined` | Callback when selection changes |
| `placeholder` | `string` | `'Select an option'` | Placeholder text |
| `disabled` | `boolean` | `false` | Whether the component is disabled |

### Search Functionality

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `searchFunction` | `(searchTerm: string) => Promise<SearchSelectOption[]> \| SearchSelectOption[]` | `undefined` | Search function that returns array of options |
| `searchPlaceholder` | `string` | `'Search...'` | Search input placeholder |
| `showSearch` | `boolean` | `true` | Whether to show search input |
| `searchDelay` | `number` | `300` | Debounce delay in milliseconds |

### Customization

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Container CSS classes |
| `buttonClassName` | `string` | `''` | Button CSS classes |
| `dropdownClassName` | `string` | `''` | Dropdown CSS classes |
| `searchInputClassName` | `string` | `''` | Search input CSS classes |
| `optionClassName` | `string` | `''` | Option CSS classes |

### Display Options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showStatus` | `boolean` | `false` | Show status indicators |
| `showDescription` | `boolean` | `true` | Show option descriptions |
| `maxHeight` | `string` | `'15rem'` | Maximum dropdown height |

### Custom Renderers

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `renderOption` | `(option, isSelected) => ReactNode` | `undefined` | Custom option renderer |
| `renderSelected` | `(option) => ReactNode` | `undefined` | Custom selected value renderer |

### Status Configuration

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `statusConfig` | `object` | See below | Status color and icon configuration |

### Additional Features

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `allowClear` | `boolean` | `false` | Show clear selection button |
| `showCount` | `boolean` | `true` | Show option count in footer |
| `emptyMessage` | `string` | `'No options found.'` | Message when no options match |
| `loadingMessage` | `string` | `'Loading...'` | Loading state message |
| `noOptionsMessage` | `string` | `'No options available.'` | Message when no options are available |

## SearchSelectOption Interface

```typescript
interface SearchSelectOption {
  id: string;
  label: string;
  description?: string;
  status?: string;
  [key: string]: any; // Allow additional properties
}
```

## Examples

### Basic Usage

```tsx
<SearchSelect
  options={users}
  value={selectedUser}
  onValueChange={setSelectedUser}
  placeholder="Select a user..."
  showStatus={true}
  showDescription={true}
/>
```

### Search Function with API Call

```tsx
const searchUsers = async (searchTerm: string): Promise<SearchSelectOption[]> => {
  const response = await api.searchUsers(searchTerm);
  return response.data.map(user => ({
    id: user.id,
    label: user.name,
    description: user.email,
    status: user.status
  }));
};

<SearchSelect
  searchFunction={searchUsers}
  placeholder="Search users..."
  searchDelay={500}
/>
```

### Custom Styling

```tsx
<SearchSelect
  options={options}
  buttonClassName="bg-blue-500 text-white border-blue-600"
  dropdownClassName="border-blue-300 shadow-blue-100"
  searchInputClassName="border-blue-300 focus:ring-blue-500"
  optionClassName="hover:bg-blue-50"
  placeholder="Custom styled select..."
/>
```

### Custom Renderers

```tsx
const renderOption = (option, isSelected) => (
  <div className="flex items-center gap-3">
    <img src={option.avatar} className="w-8 h-8 rounded-full" />
    <div>
      <div className="font-medium">{option.label}</div>
      <div className="text-sm text-gray-500">{option.email}</div>
    </div>
    {isSelected && <FaCheck className="text-blue-600" />}
  </div>
);

<SearchSelect
  options={users}
  renderOption={renderOption}
  placeholder="Select with custom renderer..."
/>
```

### Custom Status Configuration

```tsx
<SearchSelect
  options={options}
  showStatus={true}
  statusConfig={{
    active: { color: 'bg-green-100 text-green-800', icon: '🟢' },
    inactive: { color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
    suspended: { color: 'bg-red-100 text-red-800', icon: '🔴' }
  }}
  placeholder="Select with custom status..."
/>
```

### Minimal Configuration

```tsx
<SearchSelect
  options={simpleOptions}
  showSearch={false}
  showStatus={false}
  showDescription={false}
  showCount={false}
  placeholder="Simple selection..."
/>
```

## Styling with Tailwind CSS

The component is built with Tailwind CSS and provides extensive customization options:

- **Default styling**: Clean, modern appearance
- **Custom classes**: Override any element's styling
- **Responsive**: Works on all screen sizes
- **Dark mode**: Compatible with Tailwind's dark mode
- **Focus states**: Proper keyboard navigation styling

## Accessibility

- ✅ **Keyboard navigation** (Arrow keys, Enter, Escape)
- ✅ **Screen reader** support
- ✅ **Focus management** 
- ✅ **ARIA attributes** for proper labeling
- ✅ **Click outside** to close functionality

## Performance

- **Memoized filtering** for efficient search
- **Debounced search** with configurable delay to prevent excessive API calls
- **Automatic loading states** managed internally
- **Error handling** for failed search requests
- **Virtual scrolling** ready (can be added)
- **Tree-shakable** - only imports what you use

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Dependencies

- React 18+
- TypeScript 4.5+
- Tailwind CSS 3.0+
- React Icons (for default icons)
