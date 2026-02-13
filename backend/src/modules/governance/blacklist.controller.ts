import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BlacklistService } from './blacklist.service';

/**
 * BlacklistController
 * 
 * Manages the user blacklist for preventing registration and access.
 * Blocks users by email, phone, company, tax ID, or device fingerprint.
 * Supports temporary and permanent blacklisting.
 * 
 * Base Path: /governance/blacklist
 */
@ApiTags('Blacklist')
@ApiBearerAuth()
@Controller('governance/blacklist')
export class BlacklistController {
  constructor(private blacklistService: BlacklistService) {}

  /**
   * Add to blacklist
   * 
   * POST /governance/blacklist
   * 
   * Adds an identifier to the blacklist.
   * Prevents registration and access for matching identifiers.
   * 
   * @param identifier - Email, phone, company name, tax ID, etc.
   * @param identifierType - Type of identifier
   * @param reason - Reason for blacklisting
   * @param expiresAt - Optional expiration date
   * @param req - Request object containing admin info
   * @returns Created blacklist entry
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add to blacklist' })
  @ApiResponse({ status: 201, description: 'Added to blacklist successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async addToBlacklist(
    @Body('identifier') identifier: string,
    @Body('identifierType') identifierType: string,
    @Body('reason') reason: string,
    @Body('expiresAt') expiresAt: Date,
    @Body('relatedUserId') relatedUserId: string,
    @Request() req: any,
  ) {
    const adminId = req.user.id;
    const entry = await this.blacklistService.addToBlacklist(
      identifier,
      identifierType,
      reason,
      adminId,
      expiresAt,
      relatedUserId,
    );

    return {
      success: true,
      message: 'Added to blacklist successfully',
      data: entry,
    };
  }

  /**
   * Get blacklist entries
   * 
   * GET /governance/blacklist
   * 
   * Returns paginated list of blacklist entries.
   * Supports filtering by type and status.
   * 
   * @param page - Page number
   * @param limit - Items per page
   * @param identifierType - Filter by identifier type
   * @param isActive - Filter by active status
   * @returns Paginated blacklist entries
   */
  @Get()
  @ApiOperation({ summary: 'Get blacklist entries' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'identifierType', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Blacklist entries retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async getBlacklistEntries(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('identifierType') identifierType?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    const result = await this.blacklistService.getBlacklistEntries(
      Number(page),
      Number(limit),
      identifierType,
      isActive,
    );

    return {
      success: true,
      data: result.entries,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Check if identifier is blacklisted
   * 
   * GET /governance/blacklist/check
   * 
   * Checks if an identifier is on the blacklist.
   * Used during registration and login.
   * 
   * @param identifier - Identifier to check
   * @param identifierType - Type of identifier
   * @returns Blacklist status
   */
  @Get('check')
  @ApiOperation({ summary: 'Check if identifier is blacklisted' })
  @ApiQuery({ name: 'identifier', required: true, type: String })
  @ApiQuery({ name: 'identifierType', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Check completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  async checkBlacklist(
    @Query('identifier') identifier: string,
    @Query('identifierType') identifierType: string,
  ) {
    const isBlacklisted = await this.blacklistService.checkBlacklist(identifier, identifierType);

    return {
      success: true,
      data: {
        identifier,
        identifierType,
        isBlacklisted,
      },
    };
  }

  /**
   * Get blacklist entry by ID
   * 
   * GET /governance/blacklist/:id
   * 
   * Returns detailed information about a blacklist entry.
   * 
   * @param id - Blacklist entry ID
   * @returns Blacklist entry details
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get blacklist entry by ID' })
  @ApiResponse({ status: 200, description: 'Blacklist entry retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 404, description: 'Blacklist entry not found' })
  async getBlacklistEntry(@Param('id') id: string) {
    const entry = await this.blacklistService.getBlacklistEntryById(id);

    return {
      success: true,
      data: entry,
    };
  }

  /**
   * Remove from blacklist
   * 
   * DELETE /governance/blacklist/:id
   * 
   * Removes an entry from the blacklist.
   * Deactivates the entry rather than deleting for audit trail.
   * 
   * @param id - Blacklist entry ID
   * @param req - Request object containing admin info
   * @returns Success message
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Remove from blacklist' })
  @ApiResponse({ status: 200, description: 'Removed from blacklist successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 404, description: 'Blacklist entry not found' })
  async removeFromBlacklist(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const adminId = req.user.id;
    await this.blacklistService.removeFromBlacklist(id, adminId);

    return {
      success: true,
      message: 'Removed from blacklist successfully',
    };
  }

  /**
   * Get blacklist statistics
   * 
   * GET /governance/blacklist/stats
   * 
   * Returns statistics about blacklist entries.
   * Includes counts by type and status.
   * 
   * @returns Blacklist statistics
   */
  @Get('stats/summary')
  @ApiOperation({ summary: 'Get blacklist statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async getBlacklistStatistics() {
    const stats = await this.blacklistService.getStatistics();

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Search blacklist
   * 
   * GET /governance/blacklist/search
   * 
   * Searches blacklist entries by identifier pattern.
   * Supports partial matching.
   * 
   * @param query - Search query
   * @param identifierType - Filter by identifier type
   * @returns Matching blacklist entries
   */
  @Get('search/query')
  @ApiOperation({ summary: 'Search blacklist entries' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'identifierType', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Search completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async searchBlacklist(
    @Query('query') query: string,
    @Query('identifierType') identifierType?: string,
  ) {
    const results = await this.blacklistService.searchBlacklist(query, identifierType);

    return {
      success: true,
      data: results,
    };
  }
}
