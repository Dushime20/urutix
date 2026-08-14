import OperationalPageLayout from '../../components/Admin/OperationalPageLayout';
import ParkingReservationsDashboard from '../parking/ParkingReservationsDashboard';
import ParkingReservationDetails from '../parking/ParkingReservationDetails';
import { useParams } from 'react-router-dom';

const OperationalParkingReservations = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <OperationalPageLayout title="Parking Reservations" description="Review and process truck parking requests">
      {id ? (
        <ParkingReservationDetails listPath="/admin-operational/parking-reservations" />
      ) : (
        <ParkingReservationsDashboard basePath="/admin-operational/parking-reservations" />
      )}
    </OperationalPageLayout>
  );
};

export default OperationalParkingReservations;
