/**
 * Example usage of RBAC components and hooks
 */

import { usePermission } from '../contexts/PermissionContext';
import { ProtectedAction, ProtectedRoute } from '../components/common/ProtectedAction';
import { Permissions } from '../utils/permissions';

// ==================== EXAMPLE 1: Using usePermission hook ====================
const CargoManagementExample = () => {
    const { hasPermission, hasAnyPermission } = usePermission();

    const handleCreateCargo = () => {
        if (!hasPermission(Permissions.CARGO_CREATE)) {
            alert('You do not have permission to create cargo');
            return;
        }
        // Create cargo logic...
    };

    const canEditOrDelete = hasAnyPermission([
        Permissions.CARGO_UPDATE_OWN,
        Permissions.CARGO_DELETE_OWN,
    ]);

    return (
        <div>
            <h2>Cargo Management</h2>
            {hasPermission(Permissions.CARGO_CREATE) && (
                <button onClick={handleCreateCargo}>Create New Cargo</button>
            )}
            {canEditOrDelete && (
                <div>
                    <button>Edit</button>
                    <button>Delete</button>
                </div>
            )}
        </div>
    );
};

// ==================== EXAMPLE 2: Using ProtectedAction component ====================
const TruckManagementExample = () => {
    return (
        <div>
            <h2>Truck Management</h2>

            {/* Hide button if no permission */}
            <ProtectedAction permission={Permissions.TRUCK_CREATE}>
                <button className="btn btn-primary">Add New Truck</button>
            </ProtectedAction>

            {/* Show disabled button if no permission */}
            <ProtectedAction permission={Permissions.TRUCK_DELETE_OWN} showDisabled={true}>
                <button className="btn btn-danger">Delete Truck</button>
            </ProtectedAction>

            {/* Show custom fallback if no permission */}
            <ProtectedAction
                permission={Permissions.TRUCK_ASSIGN_DRIVER}
                fallback={
                    <div className="alert alert-warning">
                        You need driver assignment permission to perform this action
                    </div>
                }
            >
                <button className="btn btn-secondary">Assign Driver</button>
            </ProtectedAction>

            {/* Require ANY of multiple permissions */}
            <ProtectedAction
                anyPermission={[Permissions.TRUCK_UPDATE_OWN, Permissions.TRUCK_UPDATE_ALL]}
            >
                <button className="btn btn-info">Edit Truck</button>
            </ProtectedAction>

            {/* Require ALL of multiple permissions */}
            <ProtectedAction
                allPermissions={[Permissions.TRUCK_VIEW_OWN, Permissions.TRUCK_MAINTENANCE]}
            >
                <button className="btn btn-warning">Schedule Maintenance</button>
            </ProtectedAction>
        </div>
    );
};

// ==================== EXAMPLE 3: Protecting entire routes/pages ====================
const AdminDashboardExample = () => {
    return (
        <ProtectedRoute
            anyPermission={[Permissions.ADMIN_VIEW_ALL_TENANTS, Permissions.ADMIN_MANAGE_TENANTS]}
            fallback={
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
                        <p className="text-gray-600 mt-2">
                            You need admin permissions to access this dashboard
                        </p>
                    </div>
                </div>
            }
        >
            <div>
                <h1>Admin Dashboard</h1>
                {/* Admin dashboard content */}
            </div>
        </ProtectedRoute>
    );
};

// ==================== EXAMPLE 4: Conditional sections ====================
const UserProfileExample = () => {
    const { hasPermission } = usePermission();

    return (
        <div className="user-profile">
            <h2>User Profile</h2>

            {/* Everyone can see their own profile */}
            <section>
                <h3>Basic Information</h3>
                {/* Profile fields */}
            </section>

            {/* Only users with permission can manage other users */}
            <ProtectedAction permission={Permissions.USER_UPDATE}>
                <section>
                    <h3>User Management</h3>
                    {/* User management options */}
                </section>
            </ProtectedAction>

            {/* Admin-only section */}
            <ProtectedAction allPermissions={[
                Permissions.USER_ASSIGN_ROLE,
                Permissions.USER_MANAGE_PERMISSIONS
            ]}>
                <section>
                    <h3>Advanced Permissions</h3>
                    <button>Assign Roles</button>
                    <button>Manage Permissions</button>
                </section>
            </ProtectedAction>
        </div>
    );
};

// ==================== EXAMPLE 5: Table row actions ====================
const CargoListExample = () => {
    const { hasPermission } = usePermission();

    const cargos = [
        { id: '1', name: 'Cargo 1', ownerId: 'user1' },
        { id: '2', name: 'Cargo 2', ownerId: 'user2' },
    ];

    return (
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {cargos.map(cargo => (
                    <tr key={cargo.id}>
                        <td>{cargo.name}</td>
                        <td>
                            <ProtectedAction permission={Permissions.CARGO_VIEW_OWN}>
                                <button className="btn-sm">View</button>
                            </ProtectedAction>

                            <ProtectedAction
                                anyPermission={[
                                    Permissions.CARGO_UPDATE_OWN,
                                    Permissions.CARGO_UPDATE_ALL,
                                ]}
                            >
                                <button className="btn-sm">Edit</button>
                            </ProtectedAction>

                            <ProtectedAction
                                anyPermission={[
                                    Permissions.CARGO_DELETE_OWN,
                                    Permissions.CARGO_DELETE_ALL,
                                ]}
                            >
                                <button className="btn-sm btn-danger">Delete</button>
                            </ProtectedAction>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export {
    CargoManagementExample,
    TruckManagementExample,
    AdminDashboardExample,
    UserProfileExample,
    CargoListExample,
};
