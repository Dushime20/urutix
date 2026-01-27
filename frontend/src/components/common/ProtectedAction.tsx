import { ReactNode } from 'react';
import { usePermission } from '../contexts/PermissionContext';

/**
 * ProtectedAction Component
 * Conditionally renders children based on permission checks
 */
interface ProtectedActionProps {
    // Single permission check
    permission?: string;

    // Check if user has ANY of these permissions
    anyPermission?: string[];

    // Check if user has ALL of these permissions
    allPermissions?: string[];

    // Fallback content to render if permission check fails
    fallback?: ReactNode;

    // Content to render if permission check succeeds
    children: ReactNode;

    // If true, shows fallback as disabled instead of hiding
    showDisabled?: boolean;
}

export const ProtectedAction = ({
    permission,
    anyPermission,
    allPermissions,
    fallback = null,
    children,
    showDisabled = false,
}: ProtectedActionProps) => {
    const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermission();

    // Don't render anything while loading permissions
    if (isLoading) {
        return null;
    }

    let allowed = false;

    // Check permissions based on props
    if (permission) {
        allowed = hasPermission(permission);
    } else if (anyPermission) {
        allowed = hasAnyPermission(anyPermission);
    } else if (allPermissions) {
        allowed = hasAllPermissions(allPermissions);
    } else {
        // No permission specified, allow by default
        allowed = true;
    }

    if (allowed) {
        return <>{children}</>;
    }

    // Not allowed - show fallback or nothing
    if (showDisabled && !fallback) {
        // Clone children and add disabled prop if it's a button or input
        if (typeof children === 'object' && children && 'type' in children) {
            const childElement = children as React.ReactElement;
            return (
                <childElement.type
                    {...childElement.props}
                    disabled={true}
                    className={`${childElement.props.className || ''} opacity-50 cursor-not-allowed`}
                />
            );
        }
    }

    return <>{fallback}</>;
};

/**
 * ProtectedRoute Component
 * Wrapper for protecting entire sections/pages
 */
interface ProtectedRouteProps {
    permission?: string;
    anyPermission?: string[];
    allPermissions?: string[];
    fallback?: ReactNode;
    children: ReactNode;
}

export const ProtectedRoute = ({
    permission,
    anyPermission,
    allPermissions,
    fallback = (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
                <p className="text-gray-600">You don't have permission to access this page.</p>
            </div>
        </div>
    ),
    children,
}: ProtectedRouteProps) => {
    return (
        <ProtectedAction
            permission={permission}
            anyPermission={anyPermission}
            allPermissions={allPermissions}
            fallback={fallback}
        >
            {children}
        </ProtectedAction>
    );
};
