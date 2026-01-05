# ⚡ Quick Start Guide - Get Running in 30 Minutes

## 🎯 **Goal**: Get Urutix up and running locally with all advanced features

---

## 📦 **Prerequisites**

```bash
✅ Node.js 18+ installed
✅ PostgreSQL 14+ installed and running
✅ Redis installed and running
✅ Git installed
✅ Code editor (VS Code recommended)
```

---

## 🚀 **5-Step Setup**

### **Step 1: Clone & Install** (5 minutes)

```bash
# Clone the repository
cd c:\Users\HP\Desktop\urutix\urutix

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install new packages for advanced features
npm install leaflet react-leaflet recharts @types/leaflet
```

---

### **Step 2: Environment Setup** (5 minutes)

**Backend** (.env):
```bash
cd backend
cp .env.example .env

# Edit .env with these values:
DATABASE_URL=postgresql://postgres:password@localhost:5432/urutix_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-dev-jwt-secret-min-32-characters
PORT=3002
NODE_ENV=development
```

**Frontend** (.env):
```bash
cd ../frontend
cp .env.example .env

# Edit .env with these values:
VITE_API_URL=http://localhost:3002
VITE_WS_URL=ws://localhost:3002
VITE_GOOGLE_MAPS_API_KEY=your-api-key-here
```

---

### **Step 3: Database Setup** (5 minutes)

```bash
# Create database
createdb urutix_dev

# Run migrations
cd backend
npm run migration:run

# Seed test data (optional)
npm run seed:dev
```

---

### **Step 4: Start Services** (2 minutes)

**Terminal 1 - Backend**:
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

**Terminal 3 - Redis** (if not running as service):
```bash
redis-server
```

---

### **Step 5: Verify Installation** (3 minutes)

1. Open browser: `http://localhost:5173`
2. You should see the login page
3. Register a new account or use test credentials:
   - Email: `demo@test.com`
   - Password: `password123`
4. After login, you should see the enhanced dashboard

---

## 🎨 **Add Advanced Features** (10 minutes)

### **Quick Integration**

**1. Update index.html** (frontend/index.html):
```html
<head>
  <!-- Existing tags... -->
  
  <!-- Add Leaflet CSS -->
  <link 
    rel="stylesheet" 
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""
  />
</head>
```

**2. Add to Dashboard.tsx** (frontend/src/pages/Dashboard.tsx):

Find the section after "Smart Insights" and add:

```typescript
{/* Advanced Features Section - ADD THIS */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  {/* Custom Reports */}
  <button
    onClick={() => navigate('/dashboard/reports/builder')}
    className="p-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl text-white hover:shadow-2xl transition-all group"
  >
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 w-fit mb-4 group-hover:scale-110 transition-transform">
      <BarChart3 className="w-6 h-6" />
    </div>
    <h3 className="text-lg font-bold mb-1">Custom Reports</h3>
    <p className="text-sm text-violet-100">Build your own reports</p>
  </button>

  {/* Voice Input */}
  <button
    onClick={() => setShowVoiceInput(true)}
    className="p-6 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl text-white hover:shadow-2xl transition-all group"
  >
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 w-fit mb-4 group-hover:scale-110 transition-transform">
      <Mic className="w-6 h-6" />
    </div>
    <h3 className="text-lg font-bold mb-1">Voice Create</h3>
    <p className="text-sm text-rose-100">Speak to create cargo</p>
  </button>

  {/* Document Scanner */}
  <button
    onClick={() => setShowDocumentScanner(true)}
    className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white hover:shadow-2xl transition-all group"
  >
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 w-fit mb-4 group-hover:scale-110 transition-transform">
      <Camera className="w-6 h-6" />
    </div>
    <h3 className="text-lg font-bold mb-1">Scan Documents</h3>
    <p className="text-sm text-emerald-100">Camera document upload</p>
  </button>

  {/* Route Planner */}
  <button
    onClick={() => navigate('/dashboard/route-planner')}
    className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white hover:shadow-2xl transition-all group"
  >
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 w-fit mb-4 group-hover:scale-110 transition-transform">
      <MapPin className="w-6 h-6" />
    </div>
    <h3 className="text-lg font-bold mb-1">Route Planner</h3>
    <p className="text-sm text-blue-100">Optimize your routes</p>
  </button>
</div>
```

**3. Add State & Imports** at the top of Dashboard.tsx:

```typescript
// Add to imports
import { Mic, Camera, BarChart3, MapPin } from 'lucide-react';
import VoiceCargoInput from '../components/VoiceInput/VoiceCargoInput';
import CameraDocumentScanner from '../components/Camera/CameraDocumentScanner';

// Add state variables
const [showVoiceInput, setShowVoiceInput] = useState(false);
const [showDocumentScanner, setShowDocumentScanner] = useState(false);

// Add modals at the end of render (before last closing div)
{showVoiceInput && (
  <VoiceCargoInput
    onDataCaptured={(data) => {
      console.log('Voice data:', data);
      setShowVoiceInput(false);
    }}
    onClose={() => setShowVoiceInput(false)}
  />
)}

{showDocumentScanner && (
  <CameraDocumentScanner
    documentType="general"
    onDocumentCaptured={(docs) => {
      console.log('Documents:', docs);
      setShowDocumentScanner(false);
    }}
    onClose={() => setShowDocumentScanner(false)}
  />
)}
```

**4. Add Routes** (frontend/src/App.tsx):

```typescript
// Add lazy imports at the top
const CustomReportBuilder = lazy(() => import('./pages/dashboard/reports/CustomReportBuilder'));

// Add routes in the cargo owner section
<Route path="dashboard" element={<CargoOwnerLayout />}>
  {/* Existing routes... */}
  <Route path="reports/builder" element={<CustomReportBuilder />} />
</Route>
```

**5. Restart Frontend** and you're done! 🎉

```bash
# Press Ctrl+C in frontend terminal
# Then restart:
npm run dev
```

---

## ✅ **Verification Checklist**

After setup, verify these features work:

### **Core Features**
- [ ] Login/Registration works
- [ ] Dashboard loads without errors
- [ ] Can create new cargo
- [ ] Can view cargo list
- [ ] Real-time notifications work
- [ ] Maps display correctly

### **Advanced Features**
- [ ] Voice input modal opens (requires HTTPS or localhost)
- [ ] Document scanner opens (requires camera permission)
- [ ] Custom report builder loads
- [ ] Route planner displays map
- [ ] All charts render correctly
- [ ] PWA install prompt appears (mobile)

---

## 🐛 **Troubleshooting**

### **Issue: Database connection failed**
**Solution**:
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL if not running
# Windows: services.msc -> PostgreSQL
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### **Issue: Redis connection failed**
**Solution**:
```bash
# Check if Redis is running
redis-cli ping

# Start Redis if not running
# Windows: Download Redis for Windows
# Mac: brew services start redis
# Linux: sudo systemctl start redis
```

### **Issue: Voice input not working**
**Solution**:
- Voice input requires HTTPS or localhost
- Check browser compatibility (Chrome/Edge)
- Allow microphone permissions
- Check console for errors

### **Issue: Camera scanner not working**
**Solution**:
- Allow camera permissions in browser
- Works only on HTTPS or localhost
- Try different browser if issues persist

### **Issue: Map not displaying**
**Solution**:
```html
<!-- Verify Leaflet CSS is loaded in index.html -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
```

### **Issue: Port already in use**
**Solution**:
```bash
# Backend (port 3002)
# Windows:
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3002 | xargs kill -9

# Frontend (port 5173)
# Change in vite.config.ts:
server: {
  port: 5174
}
```

### **Issue: Module not found**
**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

---

## 🎯 **Next Steps**

After successful setup:

1. **Explore Features**
   - Try creating cargo with voice input
   - Scan a document with camera
   - Build a custom report
   - Plan a route with geolocation

2. **Read Documentation**
   - `INTEGRATION_GUIDE.md` - Detailed integration steps
   - `ADVANCED_FEATURES_COMPLETE.md` - Feature documentation
   - `PRODUCTION_DEPLOYMENT_GUIDE.md` - Deployment instructions

3. **Customize**
   - Update color scheme in `Dashboard.tsx`
   - Modify logo and branding
   - Configure email templates
   - Set up payment gateway

4. **Test**
   - Run unit tests: `npm test`
   - Run E2E tests: `npm run test:e2e`
   - Test mobile responsiveness
   - Test browser compatibility

---

## 📚 **Useful Commands**

```bash
# Development
npm run dev              # Start frontend dev server
npm run start:dev        # Start backend dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm test                 # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:e2e         # Run E2E tests
npm run test:coverage    # Generate coverage report

# Database
npm run migration:create # Create new migration
npm run migration:run    # Run migrations
npm run migration:revert # Revert last migration
npm run seed:dev         # Seed development data

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format with Prettier
npm run type-check       # TypeScript type checking
```

---

## 🎓 **Learning Resources**

### **Technologies Used**
- **React**: https://react.dev
- **TypeScript**: https://typescriptlang.org
- **Tailwind CSS**: https://tailwindcss.com
- **NestJS**: https://nestjs.com
- **Leaflet**: https://leafletjs.com
- **Recharts**: https://recharts.org

### **Platform Features**
- Voice Input: Uses Web Speech API
- Document Scanner: Uses MediaDevices API
- Maps: Leaflet + OpenStreetMap
- Charts: Recharts library
- PWA: Service Workers + Web App Manifest

---

## 💡 **Pro Tips**

1. **Use Hot Reload**: Both frontend and backend support hot reload - your changes appear instantly!

2. **Browser DevTools**: 
   - React DevTools for component debugging
   - Redux DevTools for state management
   - Network tab for API inspection

3. **VS Code Extensions**:
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - TypeScript Vue Plugin

4. **Performance**:
   - Use React DevTools Profiler
   - Monitor bundle size with `npm run build`
   - Check Lighthouse scores

5. **Debugging**:
   - Backend logs in terminal
   - Frontend console.log statements
   - Sentry for error tracking (production)

---

## 🎉 **You're All Set!**

You now have a fully functional Urutix platform with all advanced features running locally.

**Happy coding!** 🚀

---

**Questions or Issues?**
- Check `INTEGRATION_GUIDE.md` for detailed instructions
- Check `TROUBLESHOOTING.md` for common issues
- Check GitHub issues for community support

---

*Setup Time: ~30 minutes*  
*Difficulty: Beginner-Friendly*  
*Prerequisites: Basic command line knowledge*

**Let's build something amazing!** ✨

