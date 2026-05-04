# Airbnb-Style Skeleton Loading System

## Overview
This document describes the unified, Airbnb-style skeleton loading system used throughout the entire UrutiX application. This system provides a professional, consistent loading experience across all pages and components.

## Architecture

### Core Components

1. **`LoadingSkeletons.tsx`** - Base skeleton components and patterns
2. **`ModernLoader.tsx`** - Unified loading wrapper that uses the skeletons

## Component Structure

```
frontend/src/components/common/
├── LoadingSkeletons.tsx    # Base skeleton components
└── ModernLoader.tsx         # Main loading component (uses LoadingSkeletons)
```

## Usage

### Import
```typescript
import ModernLoader from '../../components/common/ModernLoader';
```

### Basic Usage
```typescript
<ModernLoader isLoading={isLoading} type="page" />
```

## Loading Types

### 1. Page Loading
Full page with header, optional stats, and table.

```typescript
<ModernLoader 
  isLoading={isLoading} 
  type="page" 
  showStats={true} 
/>
```

**Use for:**
- Admin pages with full layout
- List pages with headers
- Pages with stats and tables

---

### 2. Dashboard Loading
Stats grid + charts + table.

```typescript
<ModernLoader 
  isLoading={isLoading} 
  type="dashboard" 
/>
```

**Use for:**
- Dashboard pages
- Analytics pages
- Overview pages with multiple sections

---

### 3. Table Loading
Just a table skeleton.

```typescript
<ModernLoader 
  isLoading={isLoading} 
  type="table" 
  rows={10} 
  columns={7} 
/>
```

**Props:**
- `rows` - Number of skeleton rows (default: 10)
- `columns` - Number of columns (default: 7)

**Use for:**
- Data tables
- List views
- Grid tables

---

### 4. Card Grid Loading
Grid of card skeletons.

```typescript
<ModernLoader 
  isLoading={isLoading} 
  type="cards" 
  items={6} 
  columns={3} 
/>
```

**Props:**
- `items` - Number of cards (default: 6)
- `columns` - Grid columns: 1, 2, 3, or 4 (default: 3)

**Use for:**
- Product grids
- Truck/driver cards
- Trip cards
- Subscription plans

---

### 5. List Loading
Vertical list of items.

```typescript
<ModernLoader 
  isLoading={isLoading} 
  type="list" 
  items={8} 
/>
```

**Props:**
- `items` - Number of list items (default: 8)

**Use for:**
- Notification lists
- Transaction lists
- Activity feeds
- Search results

---

### 6. Form Loading
Form with input fields.

```typescript
<ModernLoader 
  isLoading={isLoading} 
  type="form" 
  fields={5} 
/>
```

**Props:**
- `fields` - Number of form fields (default: 5)

**Use for:**
- Edit forms
- Create forms
- Settings pages
- Profile pages

---

### 7. Stats Cards Loading
Grid of stat cards (4 cards).

```typescript
<ModernLoader 
  isLoading={isLoading} 
  type="stats" 
/>
```

**Use for:**
- KPI sections
- Metrics overview
- Dashboard stats

---

### 8. Section Loading (Default)
Small loading indicator for sections.

```typescript
<ModernLoader 
  isLoading={isLoading} 
  type="section" 
/>
```

**Use for:**
- Small sections
- Modals
- Inline loading
- Default fallback

---

### 9. Container Relative Loading
Loading within a specific container (not full screen).

```typescript
<ModernLoader 
  isLoading={isLoading} 
  type="section" 
  containerRelative={true} 
/>
```

**Use for:**
- Modals
- Cards
- Specific sections
- Nested components

## Real-World Examples

### Example 1: Admin Subscriptions Page
```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ModernLoader from '../../components/common/ModernLoader';

const AdminSubscriptions: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: fetchSubscriptions,
  });

  if (isLoading) {
    return <ModernLoader isLoading={true} type="page" showStats={true} />;
  }

  return (
    <div>
      {/* Your page content */}
    </div>
  );
};
```

### Example 2: Dashboard
```typescript
const Dashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
  });

  if (isLoading) {
    return <ModernLoader isLoading={true} type="dashboard" />;
  }

  return <div>{/* Dashboard content */}</div>;
};
```

### Example 3: Truck Cards Grid
```typescript
const TrucksList: React.FC = () => {
  const { data: trucks, isLoading } = useQuery({
    queryKey: ['trucks'],
    queryFn: fetchTrucks,
  });

  if (isLoading) {
    return <ModernLoader isLoading={true} type="cards" items={9} columns={3} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trucks.map(truck => <TruckCard key={truck.id} truck={truck} />)}
    </div>
  );
};
```

### Example 4: Modal with Loading
```typescript
const EditModal: React.FC = ({ isOpen, itemId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => fetchItem(itemId),
    enabled: isOpen,
  });

  return (
    <Modal isOpen={isOpen}>
      {isLoading ? (
        <ModernLoader 
          isLoading={true} 
          type="form" 
          fields={6}
          containerRelative={true}
        />
      ) : (
        <form>{/* Form fields */}</form>
      )}
    </Modal>
  );
};
```

### Example 5: Notifications List
```typescript
const NotificationsList: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  if (isLoading) {
    return <ModernLoader isLoading={true} type="list" items={10} />;
  }

  return (
    <div className="space-y-3">
      {data.map(notification => (
        <NotificationItem key={notification.id} {...notification} />
      ))}
    </div>
  );
};
```

## Migration Guide

### Replacing Old Spinners

**Before:**
```typescript
{isLoading ? (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
) : (
  <YourContent />
)}
```

**After:**
```typescript
{isLoading ? (
  <ModernLoader isLoading={true} type="section" />
) : (
  <YourContent />
)}
```

### Replacing Table Spinners

**Before:**
```typescript
{isLoading ? (
  <div className="text-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
    <p className="mt-4 text-slate-600">Loading...</p>
  </div>
) : (
  <table>...</table>
)}
```

**After:**
```typescript
{isLoading ? (
  <ModernLoader isLoading={true} type="table" rows={10} columns={7} />
) : (
  <table>...</table>
)}
```

## Best Practices

### 1. Choose the Right Type
Match the loading skeleton to your actual content:
- If showing a table → use `type="table"`
- If showing cards → use `type="cards"`
- If showing a form → use `type="form"`

### 2. Match Dimensions
Set rows/columns/items to match your actual content:
```typescript
// If your table has 15 rows and 8 columns
<ModernLoader isLoading={true} type="table" rows={15} columns={8} />
```

### 3. Use Container Relative for Nested Loading
```typescript
// For modals, cards, or specific sections
<div className="relative">
  <ModernLoader 
    isLoading={isLoading} 
    type="form" 
    containerRelative={true} 
  />
</div>
```

### 4. Consistent Loading States
Always use the same loading type for the same content:
```typescript
// ✅ Good - consistent
const MyPage = () => {
  if (isLoading) return <ModernLoader isLoading={true} type="page" />;
  return <PageContent />;
};

// ❌ Bad - inconsistent
const MyPage = () => {
  if (isLoading) return <div>Loading...</div>; // Different each time
  return <PageContent />;
};
```

## Component Props Reference

```typescript
interface ModernLoaderProps {
  isLoading: boolean;              // Required: Show/hide loading
  type?: 'page' | 'dashboard' | 'table' | 'cards' | 'list' | 'form' | 'section' | 'stats';
  rows?: number;                   // For table type
  columns?: number;                // For table/cards type
  items?: number;                  // For cards/list type
  fields?: number;                 // For form type
  showStats?: boolean;             // For page type
  containerRelative?: boolean;     // Position relative to container
  className?: string;              // Additional CSS classes
  text?: string;                   // Deprecated (for backward compatibility)
}
```

## Dark Mode Support

All skeleton components automatically support dark mode:
- Light mode: `bg-slate-200`
- Dark mode: `bg-slate-700`

No additional configuration needed!

## Animation

All skeletons use a smooth pulsing animation:
- Duration: 1.5 seconds
- Opacity: 0.5 → 1 → 0.5
- Infinite loop
- Easing: easeInOut

## Performance

- Lightweight components
- No heavy dependencies
- Smooth animations using Framer Motion
- Optimized for 60fps

## Browser Support

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Mobile browsers: ✅

## Accessibility

- Semantic HTML structure
- Proper ARIA labels (inherited from parent)
- Keyboard navigation support
- Screen reader friendly

## Future Enhancements

Potential improvements:
- [ ] Add shimmer effect option
- [ ] Add custom color themes
- [ ] Add more specialized patterns (chat, calendar, etc.)
- [ ] Add loading progress indicator

## Support

For questions or issues with the loading system:
1. Check this documentation
2. Review the component source code
3. Check existing usage in the codebase
4. Contact the development team

---

**Last Updated:** 2026-05-04
**Version:** 1.0.0
**Maintained by:** UrutiX Development Team
