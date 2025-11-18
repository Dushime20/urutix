# React Project Rules & Guidelines

## 📂 Folder Structure

### 1. General Layout

```
src/
  assets/          # Images, fonts, icons, sounds
  components/      # General reusable components
    ui/            # Pure UI elements (buttons, inputs, modals, etc.)
    shared/        # Higher-level shared components (headers, sidebars, etc.)
  features/        # Feature-specific logic (optional, if needed)
  hooks/           # Reusable custom hooks
  layouts/         # Page layouts
  pages/           # Application pages, mirroring the routing structure
  services/        # API services, sockets, external integrations
  store/           # State management
  styles/          # Global theme, variables, resets
  utils/           # Helper functions, formatters, constants
  types/           # Global TypeScript types & interfaces
```

---

### 2. Pages & Components Rules

- **Every page must have its own folder** inside `/pages`.
- The page folder must contain:
  - A main component file (`index.tsx` or `[pageName].tsx`)
  - Any subcomponents specific to that page
  - Styles and tests for that page
- **Nested routes = nested folders**  
  Example:
  ```
  pages/
    dashboard/
      index.tsx              # /dashboard
      components/            # Components specific to dashboard
      settings/
        index.tsx            # /dashboard/settings
        components/          # Settings page components
  ```
- **General reusable components** (used in multiple pages) go inside `/components`.
  - **`/components/ui`** → Low-level reusable elements (Button, Input, Modal, etc.)
  - **`/components/shared`** → Higher-level, reusable app-wide components (Navbar, Sidebar, Footer, etc.)

---

### 3. File Naming Rules

- **PascalCase** for components and folders: `UserProfile`, `DashboardPage`
- **camelCase** for utility files: `formatDate.ts`
- Page component files can be `index.tsx` inside their folder.
- Match file name to component name if it’s not an `index.tsx`.

---

### 4. Example

```
src/
  pages/
    home/
      index.tsx
      components/
        HeroSection.tsx
        FeatureList.tsx
    dashboard/
      index.tsx
      components/
        StatsCard.tsx
      settings/
        index.tsx
        components/
          PreferencesForm.tsx
  components/
    ui/
      Button.tsx
      Input.tsx
    shared/
      Navbar.tsx
      Sidebar.tsx
```

---

## 📜 API & Services Rules

### **1. Single API Client**

- All API calls must go through a **single shared Axios instance** (`api`) configured in `/services/api.ts`.
- The API instance must:

  - Use the base URL from environment variables (`getApiBaseUrl()` or `process.env`)
  - Have default JSON headers
  - Include a **request interceptor** for attaching the `Authorization` Bearer token
  - Optionally include **response interceptors** for error handling (handled by AuthContext if applicable)

- Example:

  ```ts
  import axios from "axios";
  import { getApiBaseUrl } from "../config/environment";

  const api = axios.create({
    baseURL: getApiBaseUrl() ?? "http://localhost:3000/api",
    headers: { "Content-Type": "application/json" },
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  export default api;
  ```

---

### **2. Grouped API Namespaces**

- Group related endpoints into **namespaces** in the same file or split into `/services/modules/*.ts` if too large.
- Namespace names should be **plural & camelCase**:

  - `authAPI`
  - `tripsAPI`
  - `fleetAPI`
  - `tenantAPI`
  - etc.

- Each namespace contains only **endpoint call methods**:

  - GET → `getAll`, `getById`, or domain-specific verbs (`getActive`, `getAnalytics`)
  - POST → `create`
  - PATCH → `update` / `updateStatus`
  - DELETE → `delete`

- Example:

  ```ts
  export const tripsAPI = {
    getAll: (params?: any) => api.get("/trips", { params }),
    getById: (id: string) => api.get(`/trips/${id}`),
    create: (data: any) => api.post("/trips", data),
    updateStatus: (id: string, data: any) =>
      api.patch(`/trips/${id}/status`, data),
  };
  ```

---

### **3. Naming & Structure Rules**

- **Function names**:

  - Always use descriptive verbs (`get`, `create`, `update`, `delete`, `search`, `analyze`).
  - Use suffixes for special cases: `getAnalytics`, `getStats`, `markAsRead`, `approveLoanRequest`.

- **Parameter handling**:

  - `params` for query strings → pass via `{ params }`.
  - `data` for POST/PATCH body payload.
  - IDs always passed explicitly as a function argument.

---

### **4. File Structure**

- If the services file becomes **too large** (300+ lines), split into:

  ```
  services/
    api.ts          # Axios instance
    auth.ts         # authAPI
    trips.ts        # tripsAPI
    fleet.ts        # fleetAPI
    ...
  ```

  Then re-export in `/services/index.ts`:

  ```ts
  export * from "./auth";
  export * from "./trips";
  ```

---

### **5. TypeScript Rules**

- Always type API responses with `Promise<AxiosResponse<T>>` or generic API types.
- Use shared interfaces from `/types` for request and response shapes:

  ```ts
  import type { IPaginatedRes } from "../types/apiResponse";
  import type { Tenant, TenantSearchParams } from "../types/tenant";

  export const tenantAPI = {
    searchTenants: (params?: TenantSearchParams) =>
      api.get<IPaginatedRes<Tenant>>("/tenants/search", { params }),
  };
  ```

---

## 🗃 State Management Rules

- Local state → `useState`, `useReducer` for component scope.
- Global state → React Context (with `useReducer` or custom hooks when needed).
- Keep derived data in selectors/memoized computations, not in the store.
- Avoid unnecessary re-renders with `React.memo`, `useMemo`, and `useCallback`.

---

## 🎨 Styling Rules

- Use **CSS Modules** or styled-components and tailwind.
- Class naming:
  ```css
  .button-primary {
    ...;
  }
  .user-card-header {
    ...;
  }
  ```
- Keep styles next to components.
- in Inline styling, use tailwind\
  To merge classes use `cn()` function
  ```js
  <button className={cn('text-center', 'text-clip')} />
  ```

---

## ✅ Testing Rules

- Every component with logic should have **unit tests**.
- Use `jest` + `@testing-library/react`.
- Test file next to component: `Button.test.tsx`.

---

## 🔍 General Best Practices

- No `any` in TypeScript unless absolutely unavoidable.
- No `console.log` in production (use a logger).
- Avoid magic numbers/strings — store in constants.
- Commit messages follow **Conventional Commits**:
  ```
  feat(auth): add login form
  fix(api): handle timeout error
  ```
