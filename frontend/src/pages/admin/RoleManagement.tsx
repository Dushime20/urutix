import React from 'react';
import { FaLayerGroup } from 'react-icons/fa';
import { RolePermissionsMatrix } from '../../components/Admin/Permissions/RolePermissionsMatrix';
import { TranslatedText } from '../../components/translated-text';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';

const RoleManagement = () => {
    return (
        <AdminPageLayout
            title={<TranslatedText text="Role Definitions" />}
            description={<TranslatedText text="Global default permissions for each role" />}
        >
            <RolePermissionsMatrix />
        </AdminPageLayout>
    );
};
export default RoleManagement;
