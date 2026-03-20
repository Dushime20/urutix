# Enlite UI - New Components Guide

## 🎉 What's New

I've added three essential component categories to the Enlite UI library:

1. **Buttons** - Interactive action buttons with multiple variants
2. **Modals** - Dialog boxes and overlays
3. **Forms** - Input fields, selects, and textareas

All components are production-ready, fully typed with TypeScript, and include animations!

---

## 📦 Components Overview

### 1. Button Component

Professional buttons with gradients, animations, and multiple variants.

#### Import

```typescript
import { Button } from '../../components/EnliteUI';
```

#### Basic Usage

```typescript
<Button variant="primary">Click Me</Button>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'error' \| 'info' \| 'outline' \| 'ghost'` | `'primary'` | Button color variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `loading` | `boolean` | `false` | Show loading spinner |
| `icon` | `ReactNode` | - | Icon to display |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Icon position |
| `fullWidth` | `boolean` | `false` | Make button full width |
| `disabled` | `boolean` | `false` | Disable button |

#### Examples

**Color Variants:**
```typescript
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="success">Success</Button>
<Button variant="warning">Warning</Button>
<Button variant="error">Error</Button>
<Button variant="info">Info</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
```

**With Icons:**
```typescript
import { FaSave, FaUser } from 'react-icons/fa';

<Button variant="success" icon={<FaSave />}>
  Save
</Button>

<Button variant="primary" icon={<FaUser />} iconPosition="right">
  Profile
</Button>
```

**Sizes:**
```typescript
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

**States:**
```typescript
<Button loading>Loading...</Button>
<Button disabled>Disabled</Button>
<Button fullWidth>Full Width</Button>
```

---

### 2. Modal Component

Beautiful dialog boxes with animations and customizable headers.

#### Import

```typescript
import { Modal } from '../../components/EnliteUI';
```

#### Basic Usage

```typescript
const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="My Modal"
>
  <p>Modal content goes here</p>
</Modal>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | Control modal visibility |
| `onClose` | `() => void` | - | Close handler |
| `title` | `string` | - | Modal title |
| `children` | `ReactNode` | - | Modal content |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Modal size |
| `showCloseButton` | `boolean` | `true` | Show close button |
| `closeOnOverlayClick` | `boolean` | `true` | Close on backdrop click |
| `footer` | `ReactNode` | - | Footer content |
| `headerColor` | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'error' \| 'info' \| 'default'` | `'default'` | Header color |

#### Examples

**Basic Modal:**
```typescript
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure you want to proceed?</p>
</Modal>
```

**With Footer:**
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
      <Button variant="primary">
        Save
      </Button>
    </div>
  }
>
  <Input label="Name" placeholder="Enter name" />
</Modal>
```

**Colored Header:**
```typescript
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Success!"
  headerColor="success"
  size="sm"
>
  <div className="text-center">
    <p>Operation completed successfully!</p>
  </div>
</Modal>
```

**Different Sizes:**
```typescript
<Modal size="sm">Small Modal</Modal>
<Modal size="md">Medium Modal</Modal>
<Modal size="lg">Large Modal</Modal>
<Modal size="xl">Extra Large Modal</Modal>
<Modal size="full">Full Width Modal</Modal>
```

---

### 3. Form Components

#### 3.1 Input Component

Styled text input with icons, labels, and validation.

##### Import

```typescript
import { Input } from '../../components/EnliteUI';
```

##### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Input label |
| `error` | `string` | - | Error message |
| `helperText` | `string` | - | Helper text |
| `icon` | `ReactNode` | - | Icon to display |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Icon position |
| `fullWidth` | `boolean` | `true` | Full width input |

##### Examples

```typescript
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

// Basic Input
<Input
  label="Full Name"
  placeholder="Enter your name"
/>

// With Icon
<Input
  label="Email"
  type="email"
  placeholder="your@email.com"
  icon={<FaEnvelope />}
/>

// With Helper Text
<Input
  label="Password"
  type="password"
  icon={<FaLock />}
  helperText="At least 8 characters"
/>

// With Error
<Input
  label="Username"
  error="This username is already taken"
/>

// Required Field
<Input
  label="Company Name"
  required
  placeholder="Enter company name"
/>
```

#### 3.2 Select Component

Styled dropdown select with custom options.

##### Import

```typescript
import { Select } from '../../components/EnliteUI';
import type { SelectOption } from '../../components/EnliteUI';
```

##### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Select label |
| `error` | `string` | - | Error message |
| `helperText` | `string` | - | Helper text |
| `options` | `SelectOption[]` | - | Select options |
| `placeholder` | `string` | - | Placeholder text |
| `fullWidth` | `boolean` | `true` | Full width select |

##### Examples

```typescript
const roleOptions: SelectOption[] = [
  { value: 'admin', label: 'Administrator' },
  { value: 'user', label: 'User' },
  { value: 'manager', label: 'Manager' },
];

// Basic Select
<Select
  label="User Role"
  options={roleOptions}
  placeholder="Select a role"
/>

// With Helper Text
<Select
  label="Country"
  options={countryOptions}
  helperText="Select your country"
/>

// With Error
<Select
  label="Department"
  options={departmentOptions}
  error="Please select a department"
/>

// Required
<Select
  label="Status"
  options={statusOptions}
  required
/>
```

#### 3.3 Textarea Component

Multi-line text input with character counter.

##### Import

```typescript
import { Textarea } from '../../components/EnliteUI';
```

##### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Textarea label |
| `error` | `string` | - | Error message |
| `helperText` | `string` | - | Helper text |
| `fullWidth` | `boolean` | `true` | Full width textarea |
| `showCharCount` | `boolean` | `false` | Show character count |
| `maxLength` | `number` | - | Maximum characters |

##### Examples

```typescript
// Basic Textarea
<Textarea
  label="Description"
  placeholder="Enter description"
  rows={4}
/>

// With Character Count
<Textarea
  label="Message"
  placeholder="Enter your message"
  rows={5}
  showCharCount
  maxLength={500}
/>

// With Helper Text
<Textarea
  label="Comments"
  helperText="Provide additional details"
  rows={3}
/>

// With Error
<Textarea
  label="Feedback"
  error="Feedback is required"
  rows={4}
/>
```

---

## 🎨 Complete Form Example

Here's a complete form using all components:

```typescript
import React, { useState } from 'react';
import { Button, Input, Select, Textarea, Modal } from '../../components/EnliteUI';
import { FaUser, FaEnvelope, FaSave } from 'react-icons/fa';

const MyForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    message: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const roleOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'User' },
  ];

  const handleSubmit = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Input
        label="Full Name"
        placeholder="Enter your name"
        icon={<FaUser />}
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <Input
        label="Email"
        type="email"
        placeholder="your@email.com"
        icon={<FaEnvelope />}
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />

      <Select
        label="Role"
        options={roleOptions}
        placeholder="Select role"
        value={formData.role}
        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        required
      />

      <Textarea
        label="Message"
        placeholder="Enter your message"
        rows={4}
        showCharCount
        maxLength={500}
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
      />

      <div className="flex gap-3">
        <Button variant="primary" icon={<FaSave />} onClick={handleSubmit}>
          Submit
        </Button>
        <Button variant="outline">
          Cancel
        </Button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Success"
        headerColor="success"
        size="sm"
      >
        <p>Form submitted successfully!</p>
      </Modal>
    </div>
  );
};
```

---

## 🚀 Quick Start

### 1. View the Showcase

Navigate to the component showcase page to see all components in action:

```
http://localhost:5174/admin/component-showcase
```

### 2. Import Components

```typescript
import { 
  Button, 
  Modal, 
  Input, 
  Select, 
  Textarea 
} from '../../components/EnliteUI';
```

### 3. Use in Your Pages

All components are ready to use immediately. Just import and start building!

---

## 📁 File Structure

```
frontend/src/components/EnliteUI/
├── Buttons/
│   ├── Button.tsx
│   └── index.ts
├── Modals/
│   ├── Modal.tsx
│   └── index.ts
├── Forms/
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Textarea.tsx
│   └── index.ts
├── Cards/
│   ├── StatCard.tsx
│   ├── DataCard.tsx
│   └── index.ts
├── Tables/
│   ├── EnhancedTable.tsx
│   └── index.ts
└── index.ts (exports all components)
```

---

## ✅ What's Been Done

1. ✅ Created Button component with 8 variants
2. ✅ Created Modal component with animations
3. ✅ Created Input component with icons and validation
4. ✅ Created Select component with custom options
5. ✅ Created Textarea component with character counter
6. ✅ Added route for AdvancedSettings page
7. ✅ Created ComponentShowcase page with examples
8. ✅ Updated EnliteUI exports
9. ✅ Created comprehensive documentation

---

## 🎯 Next Steps

### Immediate Actions

1. **Test the Components:**
   ```bash
   cd frontend
   npm run dev
   ```
   
2. **Visit Showcase Page:**
   ```
   http://localhost:5174/admin/component-showcase
   ```

3. **Visit Advanced Settings:**
   ```
   http://localhost:5174/admin/advanced-settings
   ```

### Migration Strategy

#### Phase 1: Update Forms (This Week)
- UserManagement page
- TenantSubscriptions page
- RoleManagement page

#### Phase 2: Add Modals (Next Week)
- Replace confirm dialogs with Modal component
- Add edit modals for tables
- Create delete confirmation modals

#### Phase 3: Standardize Buttons (Week 3)
- Replace all button styles with Button component
- Ensure consistent styling across app

---

## 💡 Tips & Best Practices

### 1. Form Validation

```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

<Input
  label="Email"
  error={errors.email}
  value={email}
  onChange={(e) => {
    setEmail(e.target.value);
    // Clear error on change
    setErrors({ ...errors, email: '' });
  }}
/>
```

### 2. Modal Management

```typescript
// Use separate state for each modal
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
```

### 3. Button Loading States

```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  setIsSubmitting(true);
  try {
    await submitForm();
  } finally {
    setIsSubmitting(false);
  }
};

<Button loading={isSubmitting}>Submit</Button>
```

### 4. Responsive Forms

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Input label="First Name" />
  <Input label="Last Name" />
</div>
```

---

## 🐛 Troubleshooting

### Issue: Components not found
**Solution:** Ensure you're importing from the correct path:
```typescript
import { Button } from '../../components/EnliteUI';
```

### Issue: Animations not working
**Solution:** Verify framer-motion is installed:
```bash
npm install framer-motion
```

### Issue: Modal not closing
**Solution:** Ensure you're updating the state:
```typescript
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}  // Must update state
>
```

---

## 📚 Additional Resources

- **Component Showcase:** `/admin/component-showcase`
- **Advanced Settings Example:** `/admin/advanced-settings`
- **Usage Guide:** `ENLITE_COMPONENTS_USAGE_GUIDE.md`
- **Quick Reference:** `ENLITE_QUICK_REFERENCE.md`

---

## 🎉 Summary

You now have a complete UI component library with:

- ✅ 8 button variants
- ✅ Animated modals
- ✅ Form components (Input, Select, Textarea)
- ✅ Stat cards
- ✅ Data cards
- ✅ Enhanced tables
- ✅ Complete theme system
- ✅ TypeScript support
- ✅ Responsive design
- ✅ Smooth animations

All components are production-ready and can be used immediately! 🚀
