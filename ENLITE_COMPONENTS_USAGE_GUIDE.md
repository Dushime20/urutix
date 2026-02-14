# Enlite UI Components - Usage Guide

## Overview

I've created a modern, professional UI component library inspired by premium admin templates. These components are ready to use in your Urutix project right now!

## What's Been Created

### 1. Theme System (`src/theme/enlite/`)
- **colors.ts** - Complete color palette with gradients
- **typography.ts** - Typography scale and styles
- **shadows.ts** - Shadow system for depth
- **index.ts** - Main theme configuration

### 2. UI Components (`src/components/EnliteUI/`)

#### StatCard Component
Beautiful statistics cards with:
- Animated entrance
- Trend indicators (up/down/neutral)
- Color variants (primary, secondary, success, warning, error, info)
- Icons
- Loading states
- Hover effects
- Click handlers

#### DataCard Component
Container cards for data with:
- Gradient headers
- Action buttons
- Icons
- Subtitles
- Loading states

#### EnhancedTable Component
Professional data tables with:
- Sortable columns
- Animated rows
- Striped rows option
- Hover effects
- Empty states
- Loading states
- Custom cell rendering
- Row click handlers

### 3. Example Page
- **AdminDashboard.enlite.tsx** - Complete example showing all components

## Installation Complete ✅

Dependencies installed:
- ✅ framer-motion (for animations)

## How to Use

### 1. Import Components

```typescript
import { StatCard, DataCard, EnhancedTable } from '../../components/EnliteUI';
import type { Column } from '../../components/EnliteUI';
```

### 2. Use StatCard

```typescript
<StatCard
  title="Total Tenants"
  value={125}
  icon={<FaBuilding />}
  trend="+12%"
  trendDirection="up"
  color="primary"
  subtitle="Last 30 days"
  loading={false}
  onClick={() => console.log('Clicked!')}
/>
```

**Props:**
- `title` (string) - Card title
- `value` (number | string) - Main value to display
- `icon` (ReactNode) - Icon component
- `trend` (string, optional) - Trend text (e.g., "+12%")
- `trendDirection` ('up' | 'down' | 'neutral', optional) - Trend direction
- `color` ('primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info') - Color theme
- `subtitle` (string, optional) - Additional text below value
- `loading` (boolean, optional) - Show loading state
- `onClick` (function, optional) - Click handler

### 3. Use DataCard

```typescript
<DataCard
  title="Recent Activities"
  subtitle="Latest system events"
  icon={<FaChartLine />}
  headerColor="primary"
  actions={
    <button className="px-4 py-2 bg-white text-indigo-600 rounded-lg">
      View All
    </button>
  }
>
  {/* Your content here */}
  <p>Card content goes here</p>
</DataCard>
```

**Props:**
- `title` (string) - Card title
- `children` (ReactNode) - Card content
- `actions` (ReactNode, optional) - Action buttons in header
- `subtitle` (string, optional) - Subtitle text
- `icon` (ReactNode, optional) - Header icon
- `loading` (boolean, optional) - Show loading state
- `className` (string, optional) - Additional CSS classes
- `headerColor` ('primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default') - Header color

### 4. Use EnhancedTable

```typescript
const columns: Column[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    align: 'center',
    render: (value) => (
      <span className={`px-3 py-1 rounded-full ${
        value === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {value}
      </span>
    ),
  },
];

<EnhancedTable
  columns={columns}
  data={users}
  onSort={handleSort}
  sortKey={sortKey}
  sortDirection={sortDirection}
  loading={false}
  emptyMessage="No users found"
  hoverable
  striped
  onRowClick={(row) => console.log('Clicked:', row)}
/>
```

**Props:**
- `columns` (Column[]) - Column definitions
- `data` (any[]) - Table data
- `onSort` (function, optional) - Sort handler
- `sortKey` (string, optional) - Current sort column
- `sortDirection` ('asc' | 'desc', optional) - Sort direction
- `loading` (boolean, optional) - Show loading state
- `emptyMessage` (string, optional) - Message when no data
- `onRowClick` (function, optional) - Row click handler
- `rowClassName` (function, optional) - Custom row classes
- `stickyHeader` (boolean, optional) - Sticky table header
- `striped` (boolean, optional) - Striped rows
- `hoverable` (boolean, optional) - Hover effect on rows

## Color Variants

All components support these color variants:
- **primary** - Indigo/Purple (default)
- **secondary** - Purple/Pink
- **success** - Green
- **warning** - Amber/Orange
- **error** - Red
- **info** - Cyan/Blue

## Quick Migration Guide

### Migrate AdminDashboard

1. **Backup current file:**
```bash
cp src/pages/AdminDashboard.tsx src/pages/AdminDashboard.backup.tsx
```

2. **Option A: Side-by-side testing**
   - Keep both files
   - Add route for new version: `/admin/dashboard-new`
   - Test new design
   - Switch when ready

3. **Option B: Direct replacement**
   - Copy content from `AdminDashboard.enlite.tsx`
   - Replace current `AdminDashboard.tsx`
   - Test thoroughly

### Migrate Other Pages

Follow this pattern for any page:

```typescript
import { StatCard, DataCard, EnhancedTable } from '../../components/EnliteUI';

// Replace old stat cards
<div className="grid grid-cols-4 gap-6">
  <StatCard
    title="Metric Name"
    value={value}
    icon={<Icon />}
    color="primary"
  />
</div>

// Replace old tables
<EnhancedTable
  columns={columns}
  data={data}
  hoverable
  striped
/>
```

## Examples

### Example 1: Stats Grid

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <StatCard
    title="Total Revenue"
    value="$45,231"
    icon={<FaDollarSign />}
    trend="+23%"
    trendDirection="up"
    color="success"
    subtitle="This month"
  />
  
  <StatCard
    title="New Users"
    value={1,234}
    icon={<FaUsers />}
    trend="+12%"
    trendDirection="up"
    color="primary"
    subtitle="Last 30 days"
  />
  
  <StatCard
    title="Active Sessions"
    value={892}
    icon={<FaChartLine />}
    trend="-5%"
    trendDirection="down"
    color="warning"
    subtitle="Currently online"
  />
  
  <StatCard
    title="System Health"
    value="99.9%"
    icon={<FaCheckCircle />}
    color="info"
    subtitle="Uptime"
  />
</div>
```

### Example 2: Data Table with Custom Rendering

```typescript
const columns: Column[] = [
  {
    key: 'tenant',
    label: 'Tenant',
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <FaBuilding className="text-indigo-600" />
        </div>
        <div>
          <p className="font-semibold">{value.name}</p>
          <p className="text-xs text-gray-500">{value.id}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'subscription',
    label: 'Plan',
    sortable: true,
    render: (value) => (
      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
        {value}
      </span>
    ),
  },
  {
    key: 'credits',
    label: 'Credits',
    sortable: true,
    align: 'right',
    render: (value) => (
      <span className="font-bold text-indigo-600">
        {value.toLocaleString()}
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    align: 'center',
    render: (value) => (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
        value === 'active' 
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}>
        {value.toUpperCase()}
      </span>
    ),
  },
];
```

### Example 3: Complete Page Layout

```typescript
import React from 'react';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { StatCard, DataCard, EnhancedTable } from '../../components/EnliteUI';

const MyPage: React.FC = () => {
  return (
    <AdminPageLayout
      title="My Page"
      description="Page description"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-6">
          <StatCard {...} />
        </div>

        {/* Data Table */}
        <DataCard
          title="Data Table"
          headerColor="primary"
        >
          <EnhancedTable {...} />
        </DataCard>
      </div>
    </AdminPageLayout>
  );
};
```

## Customization

### Custom Colors

Edit `src/theme/enlite/colors.ts` to change colors:

```typescript
export const enliteColors = {
  primary: {
    500: '#YOUR_COLOR',  // Change main color
  },
};
```

### Custom Animations

Components use framer-motion. Customize animations:

```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}  // Adjust duration
>
  {/* Content */}
</motion.div>
```

### Custom Styles

Add Tailwind classes:

```typescript
<StatCard
  className="custom-class"
  {...props}
/>
```

## Testing

### Test New Components

1. Start dev server:
```bash
cd frontend
npm run dev
```

2. Navigate to test page:
```
http://localhost:5174/admin/dashboard-new
```

3. Check:
   - ✅ Components render correctly
   - ✅ Animations work smoothly
   - ✅ Colors are correct
   - ✅ Responsive on mobile
   - ✅ No console errors

## Next Steps

### Phase 1: Test (This Week)
1. View the example page: `AdminDashboard.enlite.tsx`
2. Test all components
3. Verify animations and colors
4. Check mobile responsiveness

### Phase 2: Migrate Admin Pages (Next Week)
1. AdminDashboard
2. AdminTenants
3. AdminTrucks
4. TenantSubscriptions
5. CreditUsageHistory

### Phase 3: Migrate Other Sections (Week 3-4)
1. Cargo Owner pages
2. Fleet Owner pages
3. Broker pages

## Troubleshooting

### Issue: Animations not working
**Solution**: Ensure framer-motion is installed:
```bash
npm install framer-motion
```

### Issue: Colors not showing
**Solution**: Check Tailwind config includes all color classes

### Issue: TypeScript errors
**Solution**: Ensure all types are imported:
```typescript
import type { Column } from '../../components/EnliteUI';
```

## Support

If you need help:
1. Check this guide
2. Review example page: `AdminDashboard.enlite.tsx`
3. Check component source code in `src/components/EnliteUI/`

## Summary

✅ **Created:**
- Complete theme system
- 3 reusable components (StatCard, DataCard, EnhancedTable)
- Example page with all components
- This usage guide

✅ **Ready to use:**
- Import and use immediately
- No additional setup needed
- Fully typed with TypeScript
- Responsive and animated

✅ **Next:**
- Test the example page
- Start migrating your pages
- Customize colors if needed

The components are production-ready and can be used right away! 🚀
