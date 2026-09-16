import OperationalPageLayout from '../../components/Admin/OperationalPageLayout';
import ParkingManagementWorkspace from '../../components/parking/ParkingManagementWorkspace';

const OperationalParkingReservations = () => {
  return (
    <OperationalPageLayout
      title="Parking Management"
      description="Review reservation requests and set platform parking fees. Occupancy rates stay with each parking manager."
    >
      <ParkingManagementWorkspace basePath="/admin-operational/parking-reservations" />
    </OperationalPageLayout>
  );
};

export default OperationalParkingReservations;
