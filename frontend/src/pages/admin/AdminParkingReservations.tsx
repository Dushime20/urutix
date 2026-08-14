import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import ParkingReservationsDashboard from '../parking/ParkingReservationsDashboard';
import ParkingReservationDetails from '../parking/ParkingReservationDetails';
import { useParams } from 'react-router-dom';

const AdminParkingReservations = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <AdminPageLayout title="Parking Management" description="Nova Parking 365 reservation queue">
      {id ? (
        <ParkingReservationDetails listPath="/admin/parking-reservations" />
      ) : (
        <ParkingReservationsDashboard basePath="/admin/parking-reservations" />
      )}
    </AdminPageLayout>
  );
};

export default AdminParkingReservations;
