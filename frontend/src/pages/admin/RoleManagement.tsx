import React from 'react';
import { FaLayerGroup } from 'react-icons/fa';
import { RolePermissionsMatrix } from '../../components/Admin/Permissions/RolePermissionsMatrix';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';

const RoleManagement = () => {
    return (
        <AdminPageLayout
            title="Role Definitions"
            description="Global default permissions for each role"
        >
            <RolePermissionsMatrix />
        </AdminPageLayout>
    );
};
export default RoleManagement;
