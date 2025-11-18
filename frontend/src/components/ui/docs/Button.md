# Button Component

A reusable button component built with Radix UI and class-variance-authority for consistent styling and excellent accessibility.

## Features

- **Accessibility**: Built on Radix UI's Slot component for proper ARIA attributes and keyboard navigation
- **Variants**: Multiple visual styles (default, destructive, outline, secondary, ghost, link)
- **Sizes**: Different size options (sm, default, lg, icon)
- **TypeScript**: Fully typed with proper interfaces
- **Customizable**: Accepts additional className for custom styling
- **Icon Support**: Perfect for buttons with icons
- **Disabled State**: Proper disabled styling and behavior

## Installation

The component uses the following dependencies:
- `@radix-ui/react-slot`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`

## Usage

### Basic Usage

```tsx
import { Button } from '../common/Button';

// Default button
<Button>Click me</Button>

// With variant
<Button variant="destructive">Delete</Button>

// With size
<Button size="lg">Large Button</Button>
```

### With Icons

```tsx
import { FaPlus } from 'react-icons/fa';

<Button className="flex items-center gap-2">
  <FaPlus className="w-4 h-4" />
  Create New
</Button>
```

### Icon Only Button

```tsx
<Button size="icon" aria-label="Add item">
  <FaPlus className="w-4 h-4" />
</Button>
```

### Event Handlers

```tsx
<Button onClick={() => console.log('Clicked!')}>
  Click me
</Button>
```

## Variants

- `default`: Primary button with solid background
- `destructive`: Red button for destructive actions
- `outline`: Button with border and transparent background
- `secondary`: Secondary button with different background
- `ghost`: Transparent button that shows background on hover
- `link`: Button that looks like a link

## Sizes

- `sm`: Small button (h-9, px-3)
- `default`: Default size (h-10, px-4 py-2)
- `lg`: Large button (h-11, px-8)
- `icon`: Square button for icons only (h-10 w-10)

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | `'default'` | Visual style variant |
| `size` | `'sm' \| 'default' \| 'lg' \| 'icon'` | `'default'` | Size of the button |
| `asChild` | `boolean` | `false` | Whether to render as a child component |
| `className` | `string` | - | Additional CSS classes |
| `disabled` | `boolean` | `false` | Whether the button is disabled |
| `onClick` | `(event: React.MouseEvent<HTMLButtonElement>) => void` | - | Click handler |

## Examples

See `ButtonExample.tsx` for comprehensive usage examples.

## Migration from Regular Buttons

Replace your existing buttons:

```tsx
// Before
<button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
  Create New
</button>

// After
<Button>Create New</Button>
```

For buttons with icons:

```tsx
// Before
<button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
  <FaPlus className="w-4 h-4" />
  Create New
</button>

// After
<Button className="flex items-center gap-2">
  <FaPlus className="w-4 h-4" />
  Create New
</Button>
```
