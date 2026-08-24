import { useNavigate, useParams } from 'react-router-dom';
import { ParkingReservationDetailsModal } from '../../components/parking/ParkingReservationDetailsModal';

const ParkingReservationDetails = ({ listPath = '/dashboard/parking/reservations' }: { listPath?: string }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <ParkingReservationDetailsModal
      open={!!id}
      reservationId={id}
      onClose={() => navigate(listPath)}
    />
  );
};

export default ParkingReservationDetails;
