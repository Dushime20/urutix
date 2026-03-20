# Self-Guided User Experience System

## Overview
UrutiX features a comprehensive self-guided user experience system that helps users learn and navigate the platform intuitively, from first login to advanced features.

---

## System Components

### 1. 🎓 **Onboarding Tour**
**Purpose**: Welcome new users and teach core functionality

**Features**:
- **Multi-step wizard** (8 steps for cargo owners)
- **Progress bar** showing current step
- **Quick tips** for each feature
- **Skip anytime** option
- **Contextual icons** for visual appeal
- **Role-specific content** (Cargo Owner, Carrier, Admin)

**Triggers**:
- First 3 logins automatically
- Can be manually restarted from Help menu
- Skipped users can resume later

**Steps Covered**:
1. Welcome & introduction
2. Dashboard overview
3. Quick Action Flow
4. Smart Matching explained
5. Bidding system guide
6. Live tracking features
7. Help resources
8. Completion with call-to-action

---

### 2. 💡 **Contextual Help Center**
**Purpose**: Provide on-demand help without leaving the platform

**Features**:
- **Search functionality** - Find articles instantly
- **Category organization** - Grouped by topic
- **Related articles** - Discover connected content
- **Video tutorials** - Visual learning option
- **Live chat access** - 24/7 support button
- **Article feedback** - Rate helpfulness

**Content Categories**:
- Getting Started
- Features
- Tracking
- Payments
- Troubleshooting

**Access Points**:
- Help button in header (always visible)
- Keyboard shortcut: `Ctrl/Cmd + /`
- Deep links from errors/warnings

---

### 3. 🎯 **Smart Tooltips**
**Purpose**: Provide instant, bite-sized help on hover

**Types**:
1. **Info Badge** (ℹ️)
   - Small circular icon
   - Shows on hover
   - For field-level help

2. **Hover Tooltips**
   - Attached to any element
   - Dark background, white text
   - Supports multi-line content
   - Auto-positioned (top/bottom/left/right)

3. **Click Tooltips**
   - Persistent until dismissed
   - For complex explanations
   - Includes "Learn More" links

**Usage Example**:
```tsx
<Tooltip content="Match score shows AI compatibility (0-100)">
  <InfoBadge type="info" />
</Tooltip>
```

---

### 4. ⭐ **Feature Highlights**
**Purpose**: Draw attention to new or important features

**Visual Design**:
- **Spotlight effect** - Darkens background
- **Glowing border** - Blue highlight around element
- **Info card** - Positioned near feature
- **Action buttons** - "Got it" or "Learn More"

**Use Cases**:
- New feature launches
- Seasonal promotions
- Important updates
- Underutilized features

**Trigger Conditions**:
- First time seeing feature
- After platform update
- Based on user behavior
- Manual admin trigger

---

### 5. 📊 **Progress Tracking**
**Purpose**: Track user learning and feature adoption

**Tracked Metrics**:
```typescript
{
  hasCompletedOnboarding: boolean;
  hasCreatedFirstCargo: boolean;
  hasUsedSmartMatching: boolean;
  hasUsedBidding: boolean;
  hasTrackedShipment: boolean;
  hasMadePayment: boolean;
  tourStepsCompleted: string[];
  featuresDiscovered: string[];
  loginCount: number;
}
```

**Storage**: 
- LocalStorage (persists across sessions)
- Zustand state management
- Synced with backend analytics

**Benefits**:
- Personalized help suggestions
- Skip redundant onboarding
- Identify struggling users
- Measure feature adoption

---

## User Journey Flow

### First-Time User
```
Login
  ↓
Increment login count (triggers: onboarding if < 3 logins)
  ↓
Welcome Modal (if first time)
  ↓
Onboarding Tour (8 steps)
  ↓
Dashboard with highlighted Quick Action
  ↓
Feature discovery as they explore
  ↓
Contextual help available at all times
```

### Returning User
```
Login
  ↓
Dashboard (familiar layout)
  ↓
New feature highlights (if any)
  ↓
Smart insights based on history
  ↓
Help always accessible
```

---

## Implementation Details

### File Structure
```
src/
├── components/
│   ├── Onboarding/
│   │   └── OnboardingTour.tsx          # Main tour component
│   ├── Help/
│   │   └── ContextualHelp.tsx          # Help center modal
│   ├── Common/
│   │   └── Tooltip.tsx                 # Tooltip & badges
│   └── Layout/
│       └── DashboardHeader.tsx         # Integrated help button
├── stores/
│   └── onboardingStore.ts              # Progress tracking
└── pages/
    └── Dashboard.tsx                   # Onboarding integration
```

### State Management
Using **Zustand** for lightweight, persistent state:

```typescript
// Get current progress
const progress = useUserProgress();

// Check if should show onboarding
const shouldShow = useShouldShowOnboarding();

// Mark feature as discovered
markFeatureDiscovered('quick-action-flow');

// Complete onboarding
completeOnboarding();
```

---

## Configuration

### Customize Onboarding Steps
Edit `OnboardingTour.tsx`:

```typescript
const cargoOwnerSteps: OnboardingStep[] = [
  {
    id: 'custom-step',
    title: 'Your Feature',
    description: 'Explain the feature',
    tips: ['Tip 1', 'Tip 2'],
    position: 'center',
    action: 'Try It Now'
  }
];
```

### Add Help Articles
Edit `ContextualHelp.tsx`:

```typescript
{
  id: 'new-article',
  title: 'Article Title',
  description: 'Short description',
  category: 'Features',
  content: `# Markdown content here`,
  videoUrl: 'https://youtube.com/...',
  relatedArticles: ['related-id-1', 'related-id-2']
}
```

### Add Tooltips
```tsx
import Tooltip, { InfoBadge } from '@/components/Common/Tooltip';

// Simple tooltip
<Tooltip content="Helpful text">
  <button>Hover me</button>
</Tooltip>

// Info badge
<InfoBadge tooltip="Explanation" type="tip" />
```

---

## Best Practices

### ✅ Do's
1. **Keep it concise** - Max 2-3 sentences per tip
2. **Use visuals** - Icons, screenshots, videos
3. **Progressive disclosure** - Show advanced tips later
4. **Allow skipping** - Never force completion
5. **Track engagement** - Monitor what users find helpful
6. **Update regularly** - Keep content fresh
7. **Test on mobile** - Ensure touch-friendly

### ❌ Don'ts
1. **Don't overwhelm** - Too many tips at once
2. **Don't interrupt** - Let users explore
3. **Don't repeat** - Track what they've seen
4. **Don't use jargon** - Keep language simple
5. **Don't hide skip** - Always visible
6. **Don't autoplay videos** - User-initiated only
7. **Don't block UI** - Modals should be dismissible

---

## Accessibility

### Keyboard Navigation
- `Tab` - Navigate between elements
- `Enter` - Activate buttons
- `Esc` - Close modals
- `Arrow Keys` - Navigate steps
- `Ctrl/Cmd + /` - Open help

### Screen Readers
- All modals have ARIA labels
- Progress announced automatically
- Tooltips readable by screen readers
- Skip links for navigation

### Visual
- High contrast tooltips (WCAG AAA)
- Large click targets (44px minimum)
- Clear focus indicators
- No color-only indicators

---

## Analytics & Metrics

### Key Performance Indicators

1. **Onboarding Completion Rate**
   - Target: >80%
   - Formula: (Completed / Started) × 100

2. **Feature Discovery Rate**
   - Target: >60% within 7 days
   - Tracked per feature

3. **Help Center Usage**
   - Page views per session
   - Search success rate
   - Article ratings

4. **Time to First Action**
   - How long until first cargo created
   - Target: <10 minutes

5. **Support Ticket Reduction**
   - Measure decrease in basic questions
   - Target: 30% reduction

### Event Tracking
```typescript
// Track onboarding events
analytics.track('onboarding_started');
analytics.track('onboarding_completed');
analytics.track('onboarding_skipped', { step: 3 });

// Track help usage
analytics.track('help_article_viewed', { article: 'smart-matching' });
analytics.track('help_search', { query: 'how to bid' });

// Track feature discovery
analytics.track('feature_discovered', { feature: 'quick-action' });
```

---

## Maintenance

### Monthly Tasks
- [ ] Review help article analytics
- [ ] Update outdated screenshots
- [ ] Add new feature articles
- [ ] Check broken video links
- [ ] Review user feedback

### Quarterly Tasks
- [ ] Analyze onboarding completion rates
- [ ] Survey users on helpfulness
- [ ] A/B test onboarding variations
- [ ] Update tooltip content
- [ ] Review and prune old content

### Yearly Tasks
- [ ] Complete UX audit
- [ ] Redesign onboarding if needed
- [ ] Conduct user testing sessions
- [ ] Benchmark against competitors

---

## Future Enhancements

### Phase 2 (Q2 2026)
- [ ] **AI-powered help** - Chatbot assistant
- [ ] **Interactive tutorials** - Sandbox mode
- [ ] **Video tooltips** - Short GIFs on hover
- [ ] **Progress gamification** - Badges & achievements
- [ ] **Personalized onboarding** - Based on user role/industry

### Phase 3 (Q3 2026)
- [ ] **Voice guidance** - Audio instructions
- [ ] **AR guides** - Mobile AR overlays
- [ ] **Collaborative tours** - Multi-user onboarding
- [ ] **Smart suggestions** - Context-aware help
- [ ] **Offline help** - Downloadable guides

---

## Support & Resources

### For Users
- **Help Center**: Click help icon in header
- **Video Library**: `/help/videos`
- **Live Chat**: Available 24/7
- **Email**: support@urutix.com
- **Phone**: 1-800-URUTIX

### For Developers
- **Component Docs**: `/docs/components`
- **API Reference**: `/docs/api`
- **Style Guide**: `/docs/style-guide`
- **Examples**: `/docs/examples`

### For Content Managers
- **CMS Access**: `/admin/help-center`
- **Analytics Dashboard**: `/admin/analytics`
- **User Feedback**: `/admin/feedback`

---

## Testing Checklist

### Before Launch
- [ ] All tour steps display correctly
- [ ] Help articles load quickly
- [ ] Search returns relevant results
- [ ] Tooltips don't overlap
- [ ] Feature highlights work
- [ ] Progress persists after logout
- [ ] Mobile responsiveness
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)

### User Acceptance Testing
- [ ] New users complete onboarding
- [ ] Returning users don't see redundant tips
- [ ] Help articles are easy to find
- [ ] Videos play smoothly
- [ ] Live chat connects properly

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Maintained By**: UX Team  
**Review Schedule**: Monthly

