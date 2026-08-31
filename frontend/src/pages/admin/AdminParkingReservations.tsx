import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import ParkingReservationsDashboard from '../parking/ParkingReservationsDashboard';

const AdminParkingReservations = () => {
  return (
    <AdminPageLayout title="Parking Management" description="UrutiX Parking reservation queue">
      <ParkingReservationsDashboard basePath="/admin/parking-reservations" />
    </AdminPageLayout>
  );
};

export default AdminParkingReservations;
