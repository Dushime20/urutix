# Enlite UI - Quick Reference Card

## Import
```typescript
import { StatCard, DataCard, EnhancedTable } from '../../components/EnliteUI';
import type { Column } from '../../components/EnliteUI';
```

## StatCard

```typescript
<StatCard
  title="Total Users"
  value={1284}
  icon={<FaUsers />}
  trend="+12%"
  trendDirection="up"  // 'up' | 'down' | 'neutral'
  color="primary"      // 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  subtitle="Active users"
  loading={false}
  onClick={() => navigate('/users')}
/>
```

## DataCard

```typescript
<DataCard
  title="My Data"
  subtitle="Description"
  icon={<FaChart />}
  headerColor="primary"  // 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default'
  actions={<button>Action</button>}
  loading={false}
>
  <p>Your content here</p>
</DataCard>
```

## EnhancedTable

```typescript
const columns: Column[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    align: 'left',  // 'left' | 'center' | 'right'
    render: (value, row) => <span>{value}</span>
  },
];

<EnhancedTable
  columns={columns}
  data={data}
  onSort={handleSort}
  sortKey="name"
  sortDirection="asc"  // 'asc' | 'desc'
  loading={false}
  emptyMessage="No data"
  onRowClick={(row) => console.log(row)}
  hoverable
  striped
  stickyHeader
/>
```

## Colors

- **primary** - Indigo/Purple
- **secondary** - Purple/Pink
- **success** - Green
- **warning** - Amber/Orange
- **error** - Red
- **info** - Cyan/Blue

## Common Patterns

### Stats Grid
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <StatCard {...} />
  <StatCard {...} />
  <StatCard {...} />
  <StatCard {...} />
</div>
```

### Data with Table
```typescript
<DataCard title="Users" headerColor="primary">
  <EnhancedTable columns={columns} data={users} />
</DataCard>
```

### Nested Cards
```typescript
<DataCard title="Statistics" headerColor="primary">
  <div className="grid grid-cols-3 gap-4">
    <StatCard {...} />
    <StatCard {...} />
    <StatCard {...} />
  </div>
</DataCard>
```

## Files

- **Theme**: `src/theme/enlite/`
- **Components**: `src/components/EnliteUI/`
- **Example**: `src/pages/admin/AdminDashboard.enlite.tsx`
- **Docs**: `ENLITE_COMPONENTS_USAGE_GUIDE.md`
