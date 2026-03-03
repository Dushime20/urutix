# Enlite UI - Quick Reference Card

## Import
```typescript
import { 
  StatCard, 
  DataCard, 
  EnhancedTable,
  Button,
  Modal,
  Input,
  Select,
  Textarea
} from '../../components/EnliteUI';
import type { Column, SelectOption } from '../../components/EnliteUI';
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

## Button

```typescript
<Button
  variant="primary"  // 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'ghost'
  size="md"          // 'sm' | 'md' | 'lg'
  icon={<FaSave />}
  iconPosition="left"  // 'left' | 'right'
  loading={false}
  disabled={false}
  fullWidth={false}
  onClick={handleClick}
>
  Save
</Button>
```

## Modal

```typescript
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="My Modal"
  size="md"  // 'sm' | 'md' | 'lg' | 'xl' | 'full'
  headerColor="primary"
  showCloseButton={true}
  closeOnOverlayClick={true}
  footer={
    <div className="flex gap-3">
      <Button variant="outline">Cancel</Button>
      <Button variant="primary">Confirm</Button>
    </div>
  }
>
  <p>Modal content</p>
</Modal>
```

## Input

```typescript
<Input
  label="Email"
  type="email"
  placeholder="your@email.com"
  icon={<FaEnvelope />}
  iconPosition="left"  // 'left' | 'right'
  error="Invalid email"
  helperText="Enter your email address"
  required
  fullWidth={true}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

## Select

```typescript
const options: SelectOption[] = [
  { value: 'admin', label: 'Administrator' },
  { value: 'user', label: 'User' },
];

<Select
  label="Role"
  options={options}
  placeholder="Select role"
  error="Please select a role"
  helperText="Choose user role"
  required
  fullWidth={true}
  value={role}
  onChange={(e) => setRole(e.target.value)}
/>
```

## Textarea

```typescript
<Textarea
  label="Message"
  placeholder="Enter message"
  rows={4}
  showCharCount={true}
  maxLength={500}
  error="Message is required"
  helperText="Describe your request"
  required
  fullWidth={true}
  value={message}
  onChange={(e) => setMessage(e.target.value)}
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

### Form Layout
```typescript
<div className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Input label="First Name" />
    <Input label="Last Name" />
  </div>
  
  <Select label="Role" options={roleOptions} />
  
  <Textarea label="Message" rows={4} />
  
  <div className="flex gap-3">
    <Button variant="primary">Submit</Button>
    <Button variant="outline">Cancel</Button>
  </div>
</div>
```

### Modal with Form
```typescript
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Edit User"
  footer={
    <div className="flex gap-3 justify-end">
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" loading={isSubmitting}>
        Save
      </Button>
    </div>
  }
>
  <div className="space-y-4">
    <Input label="Name" icon={<FaUser />} />
    <Input label="Email" icon={<FaEnvelope />} />
    <Select label="Role" options={roleOptions} />
  </div>
</Modal>
```

## Quick Links

- **Showcase**: `/admin/component-showcase`
- **Example**: `/admin/advanced-settings`
- **Full Guide**: `ENLITE_NEW_COMPONENTS_GUIDE.md`
- **Usage Guide**: `ENLITE_COMPONENTS_USAGE_GUIDE.md`

## Files

- **Theme**: `src/theme/enlite/`
- **Components**: `src/components/EnliteUI/`
- **Examples**: 
  - `src/pages/admin/AdminDashboard.enlite.tsx`
  - `src/pages/admin/ComponentShowcase.tsx`
  - `src/pages/admin/AdvancedSettings.tsx`
- **Docs**: 
  - `ENLITE_COMPONENTS_USAGE_GUIDE.md`
  - `ENLITE_NEW_COMPONENTS_GUIDE.md`
  - `ENLITE_QUICK_REFERENCE.md`

