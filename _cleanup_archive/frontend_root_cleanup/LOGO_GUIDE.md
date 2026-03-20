# UrutiX Smart Logistic - Logo Guide

## 🎨 Logo Overview

The UrutiX Smart Logistic logo features a modern truck icon combined with bold typography, representing intelligent logistics and fleet management.

## 📐 Logo Specifications

### Full Logo (`urutix-logo.svg`)
- **Dimensions**: 400x120px
- **Format**: SVG (Scalable Vector Graphics)
- **Usage**: Headers, landing pages, marketing materials
- **Elements**:
  - Truck icon (left side)
  - "UrutiX" text (bold, blue gradient)
  - "Smart Logistic" subtitle (gray)

### Favicon (`favicon.svg`)
- **Dimensions**: 100x100px (scalable)
- **Format**: SVG
- **Usage**: Browser tabs, bookmarks, PWA icons
- **Elements**:
  - Circular background with blue gradient
  - Simplified truck icon
  - "U" letter

## 🎨 Color Palette

### Primary Colors
- **Blue Gradient Start**: `#2563eb` (rgb(37, 99, 235))
- **Blue Gradient End**: `#1e40af` (rgb(30, 64, 175))
- **Light Blue**: `#3b82f6` (rgb(59, 130, 246))
- **Dark Blue**: `#1e3a8a` (rgb(30, 58, 138))

### Secondary Colors
- **White**: `#ffffff` (for truck body and text)
- **Text Gray**: `#64748b` (for subtitle)

## 📦 Logo Files

```
frontend/public/
├── favicon.svg          # Browser favicon (100x100)
├── urutix-logo.svg      # Full logo (400x120)
└── manifest.json        # PWA manifest with logo references
```

## 🔍 Logo Elements Breakdown

### Truck Icon
- **Body**: Blue gradient rectangle with rounded corners
- **Cabin**: White rectangle representing driver cabin
- **Wheels**: Dark blue circles with white highlights
- **Cargo Box**: White rectangle on top representing cargo
- **Window**: Semi-transparent blue rectangle

### Typography
- **"UrutiX"**: 
  - Font: Arial, sans-serif
  - Size: 42px (full logo) / 24px (favicon)
  - Weight: Bold
  - Color: Blue gradient
  
- **"Smart Logistic"**:
  - Font: Arial, sans-serif
  - Size: 18px
  - Weight: 600 (Semi-bold)
  - Color: Gray (#64748b)

## 💻 Usage in Code

### HTML
```html
<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" href="/urutix-logo.svg" />
```

### React/TypeScript
```tsx
import UrutiXLogo from '/public/urutix-logo.svg';

<img src={UrutiXLogo} alt="UrutiX Smart Logistic" />
```

### CSS
```css
.logo {
  background-image: url('/urutix-logo.svg');
  background-size: contain;
  background-repeat: no-repeat;
}
```

## 📱 PWA Support

The logo is configured in `manifest.json` for Progressive Web App installation:
- App name: "UrutiX Smart Logistic"
- Short name: "UrutiX"
- Icons: favicon.svg and urutix-logo.svg
- Theme color: #2563eb

## ✅ Branding Checklist

- [x] Favicon updated
- [x] Page title updated
- [x] Meta description added
- [x] Theme color configured
- [x] PWA manifest created
- [x] Package.json updated
- [x] README.md updated
- [x] Logo files created

## 🚀 Next Steps (Optional Enhancements)

1. **Create PNG versions** for better browser compatibility:
   - favicon-16x16.png
   - favicon-32x32.png
   - apple-touch-icon-180x180.png

2. **Add logo variants**:
   - Dark mode version
   - Monochrome version
   - Horizontal and vertical layouts

3. **Optimize SVG**:
   - Minify SVG code
   - Remove unnecessary elements
   - Compress file size

4. **Add to components**:
   - Update login page with logo
   - Add to navigation header
   - Include in email templates

---

**Created**: 2025-11-30
**Status**: ✅ Production Ready

