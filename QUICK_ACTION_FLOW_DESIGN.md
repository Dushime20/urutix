# Quick Action Flow - Visual Design Specifications

## Color Palette

### Primary Colors
- **Blue Primary**: `#2563EB` (bg-blue-600)
- **Indigo Primary**: `#4F46E5` (bg-indigo-600)
- **Gradient Main**: `from-blue-600 to-indigo-700`

### Secondary Colors
- **Amber**: `#F59E0B` (bg-amber-600) - Bidding theme
- **Green**: `#10B981` (bg-green-600) - Success states
- **Red**: `#EF4444` (bg-red-600) - Alerts/errors

### Neutral Colors
- **Gray 50**: `#F9FAFB` - Backgrounds
- **Gray 900**: `#111827` - Primary text
- **Gray 600**: `#4B5563` - Secondary text

---

## Component Specifications

### 1. Quick Action Card (Dashboard)

**Location**: Dashboard > Action Required Section (First card)

```
┌─────────────────────────────────────────┐
│ ╔═══════════════════════════════════╗   │ 
│ ║  🌟 Decorative circles (bg blur)  ║   │
│ ║                                   ║   │
│ ║  ⚡ [Lightning Icon]              ║   │
│ ║  Quick Action                     ║   │ 
│ ║  (Bold white text, 18px)         ║   │
│ ║                                   ║   │
│ ║  Create cargo & choose your      ║   │
│ ║  journey in one flow             ║   │
│ ║  (Light blue text, 14px)         ║   │
│ ║                                   ║   │
│ ║  Get Started ↗                   ║   │
│ ║  (White text, bold)              ║   │
│ ╚═══════════════════════════════════╝   │
└─────────────────────────────────────────┘

Background: Gradient from blue-600 to indigo-700
Border: 2px solid blue-400
Hover: Scale 1.02, shadow-xl
Size: Responsive (fills grid column)
```

### 2. Floating Action Button (FAB)

**Location**: Fixed bottom-right corner

```
     ┌──────────┐
     │  (1)     │  ← Badge (green circle, "1")
     │    ┌─────┤
     │    │  ⚡ │  ← Main button (blue gradient)
     │    │     │
     │    └─────┘
     └──────────┘

Position: fixed bottom-6 right-6
Size: 56px × 56px (14 rem)
Icon: Zap (24px, white)
Badge: Green-500, 20px circle, white text
Shadow: lg (default), xl (hover)
Z-index: 50
Animation: Icon scales 1.1x on hover
```

### 3. Journey Selection Cards

**Layout**: Two cards side-by-side (stack on mobile)

#### Smart Matching Card
```
┌──────────────────────────────────────┐
│  Smart Matching        🔼 [Icon]     │
│  ────────────────                    │
│                                      │
│  AI-powered algorithm finds the      │
│  best trucks instantly               │
│                                      │
│  ✓ Instant matches in seconds        │
│  ✓ AI-scored compatibility           │
│  ✓ Book immediately                  │
│                                      │
│  ─────────────────────────────────   │
│  Best for              [→]           │
│  Urgent shipments      Circle        │
└──────────────────────────────────────┘

Background: Gradient from blue-50 to indigo-50
Border: 2px solid blue-200 (blue-400 on hover)
Title: 20px, bold, gray-900
Description: 14px, gray-600
Features: 14px with green checkmarks
Footer: 12px label + action button
Padding: 24px (p-6)
```

#### Bidding Card
```
┌──────────────────────────────────────┐
│  Publish for Bidding   🔨 [Icon]     │
│  ────────────────                    │
│                                      │
│  Let carriers compete for your       │
│  shipment                            │
│                                      │
│  ✓ Get competitive pricing           │
│  ✓ Multiple carrier options          │
│  ✓ Review & choose best bid          │
│                                      │
│  ─────────────────────────────────   │
│  Best for              [→]           │
│  Cost optimization     Circle        │
└──────────────────────────────────────┘

Background: Gradient from amber-50 to orange-50
Border: 2px solid amber-200 (amber-400 on hover)
Same typography as Smart Matching
```

### 4. Processing State

```
┌──────────────────────────────────────┐
│                                      │
│         ┌────────┐                   │
│         │   ⚡   │  ← Pulsing icon   │
│         └────────┘                   │
│                                      │
│    Finding Best Matches...           │
│    ──────────────────────             │
│                                      │
│    Our AI is analyzing available     │
│    trucks and calculating match      │
│    scores                            │
│                                      │
│           ⟳ [Spinner]                │
│                                      │
└──────────────────────────────────────┘

Icon Container: 64px, blue-100, rounded-full
Title: 20px, bold, gray-900
Description: 16px, gray-600
Spinner: 32px, blue-600
Animation: Pulse on icon container
Modal: Max-width 28rem (448px)
```

### 5. Results Preview

#### Smart Matching Preview
```
┌──────────────────────────────────────┐
│         ┌────────┐                   │
│         │   ✓    │  ← Success icon   │
│         └────────┘                   │
│                                      │
│         Matches Found!               │
│    We found several great matches    │
│                                      │
│  ┌─────────────────────────────┐    │
│  │  Quick Preview              │    │
│  ├─────────────────────────────┤    │
│  │  ┌──┐  Carrier #1    $1200 │    │
│  │  │95│  5.0 ★ • 250+  2-3d  │    │
│  │  └──┘                       │    │
│  ├─────────────────────────────┤    │
│  │  ┌──┐  Carrier #2    $1250 │    │
│  │  │90│  4.9 ★ • 180+  2-3d  │    │
│  │  └──┘                       │    │
│  ├─────────────────────────────┤    │
│  │  ┌──┐  Carrier #3    $1300 │    │
│  │  │85│  4.8 ★ • 120+  3-4d  │    │
│  │  └──┘                       │    │
│  └─────────────────────────────┘    │
│                                      │
│  ┌─────────────────────────────┐    │
│  │   View All Matches →        │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │   Stay on Dashboard         │    │
│  └─────────────────────────────┘    │
│                                      │
│  You'll receive notifications as     │
│  new matches arrive                  │
└──────────────────────────────────────┘

Success Icon: 64px, green-100 bg, green-600 icon
Preview Box: Blue-50 bg, blue-200 border
Match Score Badge: Blue gradient, white bold text
Action Buttons: Primary (blue-600), Secondary (border)
```

#### Bidding Preview
```
┌──────────────────────────────────────┐
│         ┌────────┐                   │
│         │   ✓    │                   │
│         └────────┘                   │
│                                      │
│    Published Successfully!           │
│    Your shipment is now live         │
│                                      │
│  ┌─────────────────────────────┐    │
│  │  Bidding Status             │    │
│  ├─────────────────────────────┤    │
│  │  ┌───┐  ┌───┐  ┌───┐       │    │
│  │  │🕒 │  │👥 │  │🔨 │       │    │
│  │  │24h│  │127│  │ 3 │       │    │
│  │  └───┘  └───┘  └───┘       │    │
│  │  Time   Viewing Bids        │    │
│  └─────────────────────────────┘    │
│                                      │
│  [View All Bids →]                   │
│  [Stay on Dashboard]                 │
└──────────────────────────────────────┘

Stats Cards: White bg, icon-colored icons
Grid: 3 columns on desktop, stack on mobile
```

---

## Typography Scale

### Headings
- **H1**: 24px (1.5rem), font-bold, gray-900
- **H2**: 20px (1.25rem), font-bold, gray-900
- **H3**: 18px (1.125rem), font-semibold, gray-900

### Body
- **Large**: 16px (1rem), font-normal, gray-600
- **Regular**: 14px (0.875rem), font-normal, gray-600
- **Small**: 12px (0.75rem), font-normal, gray-500
- **Tiny**: 10px (0.625rem), font-normal, gray-500

### Interactive
- **Button**: 14px (0.875rem), font-semibold
- **Link**: 14px (0.875rem), font-medium, underline

---

## Spacing System

### Padding
- **Tight**: 12px (p-3)
- **Regular**: 16px (p-4)
- **Comfortable**: 24px (p-6)
- **Spacious**: 32px (p-8)

### Margin
- **Small**: 8px (mb-2)
- **Regular**: 16px (mb-4)
- **Large**: 24px (mb-6)

### Gap (Flex/Grid)
- **Compact**: 8px (gap-2)
- **Regular**: 16px (gap-4)
- **Wide**: 24px (gap-6)

---

## Shadows

### Elevation Levels
- **Card**: shadow-sm (0 1px 2px rgba(0,0,0,0.05))
- **Raised**: shadow-md (0 4px 6px rgba(0,0,0,0.07))
- **Floating**: shadow-lg (0 10px 15px rgba(0,0,0,0.1))
- **Modal**: shadow-xl (0 20px 25px rgba(0,0,0,0.15))

---

## Animations

### Transitions
- **Quick**: 150ms ease-in-out
- **Standard**: 200ms ease-in-out
- **Smooth**: 300ms ease-in-out

### Transforms
- **Hover Scale**: scale(1.02)
- **Icon Hover**: scale(1.1)
- **Button Active**: scale(0.98)

### Keyframes
- **Pulse**: opacity 0.5 to 1 (2s infinite)
- **Spin**: rotate 360deg (1s linear infinite)
- **Fade In**: opacity 0 to 1 (300ms ease-out)

---

## Responsive Breakpoints

### Mobile First
- **xs**: 0-639px (default)
- **sm**: 640px-767px (sm:)
- **md**: 768px-1023px (md:)
- **lg**: 1024px-1279px (lg:)
- **xl**: 1280px+ (xl:)

### Layout Adaptations
- **Cards**: Stack vertically on xs/sm, side-by-side on md+
- **Modal**: Full-screen on xs, centered with max-width on sm+
- **FAB**: Bottom-right on all, but larger tap target on xs/sm
- **Typography**: Slightly smaller on xs (scale 0.9x)

---

## Accessibility

### Focus States
- **Outline**: 2px solid blue-600
- **Offset**: 2px
- **Border Radius**: Same as element

### Color Contrast
- **Normal Text**: Minimum 4.5:1
- **Large Text**: Minimum 3:1
- **Interactive**: Minimum 3:1

### Touch Targets
- **Minimum Size**: 44px × 44px
- **Spacing**: 8px between targets

---

## Icons

### Sizes
- **Small**: 16px (w-4 h-4)
- **Regular**: 20px (w-5 h-5)
- **Large**: 24px (w-6 h-6)
- **XL**: 32px (w-8 h-8)

### Usage
- Zap (⚡): Quick actions, speed
- TrendingUp (📈): Smart matching, growth
- Gavel (🔨): Bidding, auctions
- CheckCircle (✓): Success, completion
- Clock (🕒): Time, waiting
- Users (👥): People, carriers
- ArrowRight (→): Navigation, proceed
- X (×): Close, cancel

---

## Loading States

### Skeleton Screens
- Use gray-200 bg with pulse animation
- Match layout of final content
- Minimum display time: 500ms

### Spinners
- Blue-600 border-b-2
- 32px size for modals
- 24px size for buttons
- Centered in container

### Progress Indicators
- Show when operation > 2 seconds
- Indeterminate for unknown duration
- Percentage when trackable

---

## Error States

### Inline Errors
- Red-600 text
- 14px size
- Appear below field
- Include error icon

### Modal Errors
- Red-50 background
- Red-200 border
- Red-600 icon
- Clear error message
- Action button to retry

---

**Last Updated**: January 2026
**Design System**: Tailwind CSS v3
**Icon Library**: Lucide React

