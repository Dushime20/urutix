import OperationalPageLayout from '../../components/Admin/OperationalPageLayout';
import ParkingReservationsDashboard from '../parking/ParkingReservationsDashboard';

const OperationalParkingReservations = () => {
  return (
    <OperationalPageLayout title="Parking Reservations" description="Review and process truck parking requests">
      <ParkingReservationsDashboard basePath="/admin-operational/parking-reservations" />
    </OperationalPageLayout>
  );
};

export default OperationalParkingReservations;
