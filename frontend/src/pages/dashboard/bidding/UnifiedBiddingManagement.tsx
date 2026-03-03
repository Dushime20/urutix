import BiddingDashboard from "@/components/Bidding/BiddingDashboard";
import { useAuth } from "@/contexts/AuthContext";

const UnifiedBiddingManagement = () => {
    const { user } = useAuth();

    const userRole =
        user?.role === "TRUCK_OWNER" ? "TRUCK_OWNER" : "CARGO_OWNER";

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <BiddingDashboard userRole={userRole} />
        </div>
    );
};

export default UnifiedBiddingManagement;
