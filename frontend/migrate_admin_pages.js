const fs = require('fs');
const path = require('path');

const srcDir = 'c:\\Users\\user\\Desktop\\project\\urutix\\frontend\\src\\pages';
const destDir = 'c:\\Users\\user\\Desktop\\project\\urutix\\frontend\\src\\pages\\admin-operational';

const filesToMigrate = [
  {
    src: path.join(srcDir, 'AdminTrips.tsx'),
    dest: path.join(destDir, 'Trips.tsx'),
    replace: [
      { from: /const AdminTrips /g, to: 'const OperationalAdminTrips ' },
      { from: /export default AdminTrips/g, to: 'export default OperationalAdminTrips' },
      { from: /from '\.\.\//g, to: "from '../../" }
    ]
  },
  {
    src: path.join(srcDir, 'AdminLoads.tsx'),
    dest: path.join(destDir, 'Loads.tsx'),
    replace: [
      { from: /const AdminLoads /g, to: 'const OperationalAdminLoads ' },
      { from: /export default AdminLoads/g, to: 'export default OperationalAdminLoads' },
      { from: /from '\.\.\//g, to: "from '../../" }
    ]
  },
  {
    src: path.join(srcDir, 'admin', 'BiddingManagement.tsx'),
    dest: path.join(destDir, 'Bidding.tsx'),
    replace: [
      { from: /const BiddingManagement /g, to: 'const OperationalAdminBidding ' },
      { from: /export default BiddingManagement/g, to: 'export default OperationalAdminBidding' }
    ]
  },
  {
    src: path.join(srcDir, 'admin', 'MonitoringDashboard.tsx'),
    dest: path.join(destDir, 'Monitoring.tsx'),
    replace: [
      { from: /const MonitoringDashboard /g, to: 'const OperationalAdminMonitoring ' },
      { from: /export default MonitoringDashboard/g, to: 'export default OperationalAdminMonitoring' }
    ]
  },
  {
    src: path.join(srcDir, 'admin', 'AnalyticsManagement.tsx'),
    dest: path.join(destDir, 'Analytics.tsx'),
    replace: [
      { from: /const AnalyticsManagement /g, to: 'const OperationalAdminAnalytics ' },
      { from: /export default AnalyticsManagement/g, to: 'export default OperationalAdminAnalytics' }
    ]
  },
  {
    src: path.join(srcDir, 'admin', 'FinancialAdminDashboard.tsx'),
    dest: path.join(destDir, 'Financial.tsx'),
    replace: [
      { from: /const FinancialAdminDashboard /g, to: 'const OperationalAdminFinancial ' },
      { from: /export default FinancialAdminDashboard/g, to: 'export default OperationalAdminFinancial' }
    ]
  },
  {
    src: path.join(srcDir, 'admin', 'AnalyticsManagement.tsx'),
    dest: path.join(destDir, 'Reports.tsx'),
    replace: [
      { from: /const AnalyticsManagement /g, to: 'const OperationalAdminReports ' },
      { from: /export default AnalyticsManagement/g, to: 'export default OperationalAdminReports' }
    ]
  },
  {
    src: path.join(srcDir, 'admin', 'ActivityLogs.tsx'),
    dest: path.join(destDir, 'ActivityLogs.tsx'),
    replace: [
      { from: /const ActivityLogs /g, to: 'const OperationalAdminActivityLogs ' },
      { from: /export default ActivityLogs/g, to: 'export default OperationalAdminActivityLogs' }
    ]
  },
  {
    src: path.join(srcDir, 'Profile.tsx'),
    dest: path.join(destDir, 'Profile.tsx'),
    replace: [
      { from: /const Profile /g, to: 'const OperationalAdminProfile ' },
      { from: /export default Profile/g, to: 'export default OperationalAdminProfile' },
      { from: /from '\.\.\//g, to: "from '../../" }
    ]
  },
  {
    src: path.join(srcDir, 'Settings.tsx'),
    dest: path.join(destDir, 'Settings.tsx'),
    replace: [
      { from: /const Settings /g, to: 'const OperationalAdminSettings ' },
      { from: /export default Settings/g, to: 'export default OperationalAdminSettings' },
      { from: /from '\.\.\//g, to: "from '../../" }
    ]
  }
];

filesToMigrate.forEach(file => {
  if (fs.existsSync(file.src)) {
    let content = fs.readFileSync(file.src, 'utf8');
    file.replace.forEach(replacer => {
      content = content.replace(replacer.from, replacer.to);
    });
    fs.writeFileSync(file.dest, content);
    console.log(`Successfully migrated ${path.basename(file.src)} to ${path.basename(file.dest)}`);
  } else {
    console.error(`Source file not found: ${file.src}`);
  }
});
