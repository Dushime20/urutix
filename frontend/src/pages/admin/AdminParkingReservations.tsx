import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import ParkingManagementWorkspace from '../../components/parking/ParkingManagementWorkspace';

const AdminParkingReservations = () => {
  return (
    <AdminPageLayout
      title="Parking Management"
      description="Review reservation requests and set platform parking fees. Occupancy rates stay with each parking manager."
    >
      <ParkingManagementWorkspace basePath="/admin/parking-reservations" />
    </AdminPageLayout>
  );
};

export default AdminParkingReservations;
