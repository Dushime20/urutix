const fs = require('fs');
const path = require('path');

const srcDir = 'c:\\Users\\user\\Desktop\\project\\urutix\\frontend\\src\\pages';
const destDir = 'c:\\Users\\user\\Desktop\\project\\urutix\\frontend\\src\\pages\\admin-operational';

function portTrips() {
  const src = path.join(srcDir, 'AdminTrips.tsx');
  const dest = path.join(destDir, 'Trips.tsx');
  let content = fs.readFileSync(src, 'utf8');

  // 1. Rename Component
  content = content.replace(/const AdminTrips: React\.FC = \(\) => {/, 'const OperationalAdminTrips: React.FC = () => {');
  content = content.replace(/export default AdminTrips;/, 'export default OperationalAdminTrips;');

  // 2. Fix Relative Imports
  content = content.replace(/from '\.\.\//g, "from '../../");

  // 3. Swap API Imports
  content = content.replace(/import \{ fetchAllTrips, fetchTenants, cancelTrip \} from '\.\.\/\.\.\/services\/adminApi';/, 
    "import { tenantApi } from '../../services/tenantApi';");

  // 4. Update Query Data
  content = content.replace(/queryFn: \(\) => fetchAllTrips\(\)/, "queryFn: async () => { const res = await tenantApi.getTrips(); return res.data; }");
  
  // 5. Remove Tenants Query & Filter Logic
  // Find the tenants query
  content = content.replace(/const \{ data: tenantsData \} = useQuery\(\{\s+queryKey: \['admin-tenants'\],\s+queryFn: fetchTenants\s+\}\);/, '');
  // Remove tenant state
  content = content.replace(/const \[tenantFilter, setTenantFilter\] = useState<string>\('all'\);/, '');
  // Remove tenant map and filtering logic
  content = content.replace(/const tenants: Tenant\[\] = tenantsData\?.tenants \|\| \[\];[\s\S]*?\}, \[allTrips, tenantMap\]\);/, 
    `const mappedTrips: Trip[] = allTrips;`);
  content = content.replace(/const matchesTenant = tenantFilter === 'all' \|\| trip\.tenantId === tenantFilter;/, 'const matchesTenant = true;');
  
  // 6. Remove Tenant Select Dropdown
  content = content.replace(/<select[\s\S]*?value=\{tenantFilter\}[\s\S]*?<\/select>/, '');

  // 7. Remove Tenant details from the Table
  content = content.replace(/<div className="text-\[10px\] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0\.5">\{trip\.tenantName\}<\/div>/g, '');
  content = content.replace(/<span className="text-gray-900 dark:text-slate-200">\{selectedTrip!\.tenantName\}<\/span>/, '<span className="text-gray-900 dark:text-slate-200">Current Tenant</span>');

  fs.writeFileSync(dest, content);
  console.log('Ported Trips.tsx');
}

function portLoads() {
  const src = path.join(srcDir, 'AdminLoads.tsx');
  const dest = path.join(destDir, 'Loads.tsx');
  let content = fs.readFileSync(src, 'utf8');

  content = content.replace(/const AdminLoads: React\.FC = \(\) => {/, 'const OperationalAdminLoads: React.FC = () => {');
  content = content.replace(/export default AdminLoads;/, 'export default OperationalAdminLoads;');
  content = content.replace(/from '\.\.\//g, "from '../../");
  
  // Swap APIs
  content = content.replace(/import \{ adminAPI \} from '\.\.\/\.\.\/services\/adminApi';/, "import { loadsAPI } from '../../services/load';");
  content = content.replace(/adminAPI\.fetchAllLoads/g, "loadsAPI.getAll");

  // Remove tenants filtering if exists
  content = content.replace(/adminAPI\.fetchTenants/g, "(() => Promise.resolve({ data: { tenants: [] } }))"); // dummy to prevent crash

  // Note: For now, keeping the UI intact but loadsAPI.getAll naturally scopes to the tenant.
  fs.writeFileSync(dest, content);
  console.log('Ported Loads.tsx');
}

portTrips();
portLoads();
