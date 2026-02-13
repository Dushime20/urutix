/**
 * Example Service with Permission Checks
 * 
 * This file demonstrates how to use PermissionHelper in services
 * for business logic permission checks.
 */

import { Injectable, ForbiddenException } from '@nestjs/common';
import { PermissionHelper } from '../utils/permission-helper';

interface User {
  id: string;
  role: string;
  email: string;
}

/**
 * Example User Service with Permission Checks
 */
@Injectable()
export class UserServiceExample {
  constructor(private permissionHelper: PermissionHelper) {}

  // Example 1: Check permission before performing action
  async updateUser(currentUser: User, userId: string, updateData: any) {
    // Check if user has permission to update users
    const canUpdate = await this.permissionHelper.roleHasPermission(
      currentUser.role,
      'user:update',
    );

    if (!canUpdate) {
      throw new ForbiddenException('You do not have permission to update users');
    }

    // Perform update
    return { message: 'User updated', userId };
  }

  // Example 2: Check multiple permissions (OR logic)
  async viewUserDetails(currentUser: User, userId: string) {
    // User needs 'user:view' OR 'user:manage' permission
    const canView = await this.permissionHelper.roleHasAnyPermission(
      currentUser.role,
      ['user:view', 'user:manage'],
    );

    if (!canView) {
      throw new ForbiddenException('You do not have permission to view user details');
    }

    // Return user details
    return { message: 'User details', userId };
  }

  // Example 3: Check all permissions (AND logic)
  async deleteUser(currentUser: User, userId: string) {
    // User needs BOTH 'user:delete' AND 'user:manage' permissions
    const canDelete = await this.permissionHelper.roleHasAllPermissions(
      currentUser.role,
      ['user:delete', 'user:manage'],
    );

    if (!canDelete) {
      throw new ForbiddenException(
        'You need both user:delete and user:manage permissions to delete users',
      );
    }

    // Perform deletion
    return { message: 'User deleted', userId };
  }

  // Example 4: Get all permissions for a role
  async getUserPermissions(role: string) {
    const permissions = await this.permissionHelper.getRolePermissions(role);
    return { role, permissions };
  }

  // Example 5: Conditional logic based on permissions
  async getUserList(currentUser: User) {
    const canViewAll = await this.permissionHelper.roleHasPermission(
      currentUser.role,
      'user:manage',
    );

    if (canViewAll) {
      // Return all users
      return { message: 'All users', users: [] };
    }

    const canViewOwn = await this.permissionHelper.roleHasPermission(
      currentUser.role,
      'user:view',
    );

    if (canViewOwn) {
      // Return only current user
      return { message: 'Own user only', users: [currentUser] };
    }

    throw new ForbiddenException('You do not have permission to view users');
  }

  // Example 6: Permission check with custom error message
  async bulkUpdateUsers(currentUser: User, userIds: string[], updateData: any) {
    const canBulkUpdate = await this.permissionHelper.roleHasPermission(
      currentUser.role,
      'user:manage',
    );

    if (!canBulkUpdate) {
      throw new ForbiddenException(
        'Bulk user updates require user:manage permission. Please contact your administrator.',
      );
    }

    // Perform bulk update
    return { message: 'Bulk update completed', count: userIds.length };
  }
}

/**
 * Example Route Service with Permission Checks
 */
@Injectable()
export class RouteServiceExample {
  constructor(private permissionHelper: PermissionHelper) {}

  async createRoute(currentUser: User, routeData: any) {
    const canCreate = await this.permissionHelper.roleHasPermission(
      currentUser.role,
      'route:create',
    );

    if (!canCreate) {
      throw new ForbiddenException('You do not have permission to create routes');
    }

    return { message: 'Route created', routeData };
  }

  async assignRouteToTruck(currentUser: User, routeId: string, truckId: string) {
    const canAssign = await this.permissionHelper.roleHasPermission(
      currentUser.role,
      'route:assign',
    );

    if (!canAssign) {
      throw new ForbiddenException('You do not have permission to assign routes');
    }

    return { message: 'Route assigned', routeId, truckId };
  }

  async deleteRoute(currentUser: User, routeId: string) {
    // Check if user has delete OR manage permission
    const canDelete = await this.permissionHelper.roleHasAnyPermission(
      currentUser.role,
      ['route:delete', 'route:manage'],
    );

    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete routes');
    }

    return { message: 'Route deleted', routeId };
  }
}

/**
 * Example Cargo Service with Permission Checks
 */
@Injectable()
export class CargoServiceExample {
  constructor(private permissionHelper: PermissionHelper) {}

  async createCargo(currentUser: User, cargoData: any) {
    const canCreate = await this.permissionHelper.roleHasPermission(
      currentUser.role,
      'cargo:create',
    );

    if (!canCreate) {
      throw new ForbiddenException('You do not have permission to create cargo');
    }

    return { message: 'Cargo created', cargoData };
  }

  async viewCargo(currentUser: User, cargoId: string) {
    const canView = await this.permissionHelper.roleHasAnyPermission(
      currentUser.role,
      ['cargo:view', 'cargo:manage'],
    );

    if (!canView) {
      throw new ForbiddenException('You do not have permission to view cargo');
    }

    return { message: 'Cargo details', cargoId };
  }

  async updateCargoStatus(currentUser: User, cargoId: string, status: string) {
    const canUpdate = await this.permissionHelper.roleHasAnyPermission(
      currentUser.role,
      ['cargo:update', 'cargo:manage'],
    );

    if (!canUpdate) {
      throw new ForbiddenException('You do not have permission to update cargo');
    }

    return { message: 'Cargo status updated', cargoId, status };
  }
}

/**
 * Example Admin Service with Permission Checks
 */
@Injectable()
export class AdminServiceExample {
  constructor(private permissionHelper: PermissionHelper) {}

  async accessAdminPanel(currentUser: User) {
    const canAccess = await this.permissionHelper.roleHasPermission(
      currentUser.role,
      'admin:access',
    );

    if (!canAccess) {
      throw new ForbiddenException('You do not have permission to access admin panel');
    }

    return { message: 'Admin panel access granted' };
  }

  async manageTenants(currentUser: User) {
    // First check admin access
    const canAccessAdmin = await this.permissionHelper.roleHasPermission(
      currentUser.role,
      'admin:access',
    );

    if (!canAccessAdmin) {
      throw new ForbiddenException('You do not have admin access');
    }

    // Then check tenant management permission
    const canManageTenants = await this.permissionHelper.roleHasPermission(
      currentUser.role,
      'tenant:manage',
    );

    if (!canManageTenants) {
      throw new ForbiddenException('You do not have permission to manage tenants');
    }

    return { message: 'Tenant management access granted' };
  }

  async managePermissions(currentUser: User) {
    // Check multiple permissions
    const hasPermissions = await this.permissionHelper.roleHasAllPermissions(
      currentUser.role,
      ['admin:access', 'permission:manage'],
    );

    if (!hasPermissions) {
      throw new ForbiddenException(
        'You need both admin:access and permission:manage permissions',
      );
    }

    return { message: 'Permission management access granted' };
  }
}

/**
 * Example: Permission check in complex business logic
 */
@Injectable()
export class ComplexBusinessLogicExample {
  constructor(private permissionHelper: PermissionHelper) {}

  async processOrder(currentUser: User, orderId: string) {
    // Get all permissions for the user's role
    const permissions = await this.permissionHelper.getRolePermissions(currentUser.role);

    // Check various permissions for different actions
    const canViewOrder = permissions.includes('order:view');
    const canUpdateOrder = permissions.includes('order:update');
    const canApproveOrder = permissions.includes('order:approve');

    if (!canViewOrder) {
      throw new ForbiddenException('Cannot view order');
    }

    // Build response based on permissions
    const response: any = {
      orderId,
      details: 'Order details',
      canUpdate: canUpdateOrder,
      canApprove: canApproveOrder,
    };

    return response;
  }

  async performAction(currentUser: User, action: string) {
    // Dynamic permission check based on action
    const permissionName = `action:${action}`;
    
    const hasPermission = await this.permissionHelper.roleHasPermission(
      currentUser.role,
      permissionName,
    );

    if (!hasPermission) {
      throw new ForbiddenException(`You do not have permission to perform: ${action}`);
    }

    return { message: `Action ${action} performed` };
  }
}
