import { SetMetadata } from '@nestjs/common';

export const LOG_ACTIVITY_KEY = 'log_activity';

export interface LogActivityMetadata {
    action: string;
    resource?: string;
    description?: string;
}

/**
 * Decorator to mark endpoints for activity logging
 * @param action - The action being performed (e.g., 'LOGIN', 'CREATE_USER')
 * @param resource - Optional resource type (e.g., 'users', 'loads')
 * @param description - Optional description for the activity
 */
export const LogActivity = (
    action: string,
    resource?: string,
    description?: string,
) => SetMetadata(LOG_ACTIVITY_KEY, { action, resource, description });
