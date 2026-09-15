import OperationalPageLayout from '../../components/Admin/OperationalPageLayout';
import ParkingManagementWorkspace from '../../components/parking/ParkingManagementWorkspace';

const OperationalParkingReservations = () => {
  return (
    <OperationalPageLayout
      title="Parking Management"
      description="Review reservation requests and manage facility pricing without leaving this workspace."
    >
      <ParkingManagementWorkspace basePath="/admin-operational/parking-reservations" />
    </OperationalPageLayout>
  );
};

export default OperationalParkingReservations;
