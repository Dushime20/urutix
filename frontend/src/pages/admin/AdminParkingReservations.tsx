import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import ParkingManagementWorkspace from '../../components/parking/ParkingManagementWorkspace';

const AdminParkingReservations = () => {
  return (
    <AdminPageLayout
      title="Parking Management"
      description="Review reservation requests and manage facility pricing in one admin workspace."
    >
      <ParkingManagementWorkspace basePath="/admin/parking-reservations" />
    </AdminPageLayout>
  );
};

export default AdminParkingReservations;
