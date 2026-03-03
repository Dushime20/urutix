import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService } from './permissionService';
import { DataSource } from 'typeorm';
// UserRole is a type, not an enum/value in permission.types.ts
// import { UserRole } from '../types/permission.types'; 

// Mock Data
const mockDataSource = {
    query: jest.fn(),
    manager: {
        transaction: jest.fn(),
    },
};

describe('PermissionService', () => {
    let service: PermissionService;
    let dataSource: DataSource;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PermissionService,
                {
                    provide: DataSource,
                    useValue: mockDataSource,
                },
            ],
        }).compile();

        service = module.get<PermissionService>(PermissionService);
        dataSource = module.get<DataSource>(DataSource);

        // Reset mocks
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getUserPermissions', () => {
        it('should return role-based permissions when no overrides exist', async () => {
            const userId = 'user-123';

            // Mock user role fetch
            mockDataSource.query
                .mockResolvedValueOnce([{ role: 'ADMIN' }]) // Query 1: Get user role
                .mockResolvedValueOnce([{ name: 'cargo:create' }, { name: 'cargo:view' }]) // Query 2: Get role permissions
                .mockResolvedValueOnce([]); // Query 3: Get overrides

            const permissions = await service.getUserPermissions(userId);

            expect(permissions).toEqual(['cargo:create', 'cargo:view']);
            expect(mockDataSource.query).toHaveBeenCalledTimes(3);
        });

        it('should include positive overrides', async () => {
            const userId = 'user-123';

            mockDataSource.query
                .mockResolvedValueOnce([{ role: 'DRIVER' }]) // Query 1: User role
                .mockResolvedValueOnce([{ name: 'trip:view' }]) // Query 2: Role perms
                .mockResolvedValueOnce([
                    { name: 'cargo:view', is_granted: true, expires_at: null }
                ]); // Query 3: Overrides

            const permissions = await service.getUserPermissions(userId);

            expect(permissions).toContain('trip:view');
            expect(permissions).toContain('cargo:view');
            expect(permissions).toHaveLength(2);
        });

        it('should exclude negative overrides', async () => {
            const userId = 'user-123';

            mockDataSource.query
                .mockResolvedValueOnce([{ role: 'ADMIN' }]) // Query 1: User role
                .mockResolvedValueOnce([{ name: 'user:delete' }, { name: 'user:view' }]) // Query 2: Role perms
                .mockResolvedValueOnce([
                    { name: 'user:delete', is_granted: false, expires_at: null }
                ]); // Query 3: Overrides

            const permissions = await service.getUserPermissions(userId);

            expect(permissions).toContain('user:view');
            expect(permissions).not.toContain('user:delete');
            expect(permissions).toHaveLength(1);
        });

        it('should handle expired overrides by ignoring them', async () => {
            const userId = 'user-123';
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);

            mockDataSource.query
                .mockResolvedValueOnce([{ role: 'DRIVER' }])
                .mockResolvedValueOnce([{ name: 'trip:view' }])
                .mockResolvedValueOnce([
                    { name: 'cargo:view', is_granted: true, expires_at: pastDate }
                ]);

            const permissions = await service.getUserPermissions(userId);

            expect(permissions).toContain('trip:view');
            expect(permissions).not.toContain('cargo:view');
        });
    });

    describe('checkPermission', () => {
        it('should return true if super admin', async () => {
            // Assuming checkPermission calls getUserPermissions internally
            mockDataSource.query.mockResolvedValueOnce([{ role: 'SUPER_ADMIN' }]);
            mockDataSource.query.mockResolvedValueOnce([{ name: 'any:permission' }, { name: 'other:permission' }]); // Super admin gets all perms

            const hasPerm = await service.checkPermission('user-123', 'any:permission');
            expect(hasPerm).toBe(true);
        });
    });
});
