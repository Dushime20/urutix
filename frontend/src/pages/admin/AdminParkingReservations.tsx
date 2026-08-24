import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import ParkingReservationsDashboard from '../parking/ParkingReservationsDashboard';

const AdminParkingReservations = () => {
  return (
    <AdminPageLayout title="Parking Management" description="Nova Parking 365 reservation queue">
      <ParkingReservationsDashboard basePath="/admin/parking-reservations" />
    </AdminPageLayout>
  );
};

export default AdminParkingReservations;
