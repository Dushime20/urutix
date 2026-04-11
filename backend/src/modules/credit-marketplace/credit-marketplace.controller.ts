import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreditMarketplaceService } from '../../services/credit-marketplace.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Credit Marketplace')
@ApiBearerAuth()
@Controller('credits/marketplace')
@UseGuards(JwtAuthGuard)
export class CreditMarketplaceController {
  constructor(private readonly marketplaceService: CreditMarketplaceService) {}

  @Post('configure')
  @ApiOperation({ summary: 'Configure marketplace settings (Tenant Admin only)' })
  @ApiResponse({ status: 200, description: 'Marketplace configured successfully' })
  @ApiResponse({ status: 400, description: 'Invalid configuration' })
  async configureMarketplace(
    @Request() req,
    @Body()
    body: {
      minPurchaseAmount: number;
      maxPurchaseAmount?: number;
      pricePerCredit: number;
      isEnabled: boolean;
    },
  ) {
    const tenantId = req.user.tenantId;
    const tenantAdminUserId = req.user.id;

    const settings = await this.marketplaceService.configureMarketplace({
      tenantId,
      tenantAdminUserId,
      minPurchaseAmount: body.minPurchaseAmount,
      maxPurchaseAmount: body.maxPurchaseAmount,
      pricePerCredit: body.pricePerCredit,
      isEnabled: body.isEnabled,
    });

    return {
      success: true,
      message: 'Marketplace configured successfully',
      data: settings,
    };
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get marketplace settings' })
  @ApiResponse({ status: 200, description: 'Returns marketplace settings' })
  async getSettings(@Request() req) {
    const tenantId = req.user.tenantId;
    const settings = await this.marketplaceService.getMarketplaceSettings(tenantId);

    return {
      success: true,
      data: settings,
    };
  }

  @Get('availability')
  @ApiOperation({ summary: 'Get marketplace availability (for truck owners)' })
  @ApiResponse({ status: 200, description: 'Returns available credits and pricing' })
  async getAvailability(@Request() req) {
    const tenantId = req.user.tenantId;
    const availability = await this.marketplaceService.getMarketplaceAvailability(tenantId);

    return {
      success: true,
      data: availability,
    };
  }

  @Post('purchase')
  @ApiOperation({ summary: 'Purchase credits from marketplace (Truck Owner)' })
  @ApiResponse({ status: 200, description: 'Credits purchased successfully' })
  @ApiResponse({ status: 400, description: 'Purchase failed' })
  async purchaseCredits(
    @Request() req,
    @Body()
    body: {
      creditAmount: number;
      paymentMethod: 'card' | 'mobile_money';
      paymentDetails: any;
    },
  ) {
    const tenantId = req.user.tenantId;
    const truckOwnerUserId = req.user.id;

    const result = await this.marketplaceService.purchaseCredits({
      tenantId,
      truckOwnerUserId,
      creditAmount: body.creditAmount,
      paymentMethod: body.paymentMethod,
      paymentDetails: body.paymentDetails,
    });

    return result;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get marketplace sales statistics (Tenant Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns marketplace statistics' })
  async getStats(@Request() req) {
    const tenantId = req.user.tenantId;
    const tenantAdminUserId = req.user.id;

    const stats = await this.marketplaceService.getMarketplaceStats(tenantId, tenantAdminUserId);

    return {
      success: true,
      data: stats,
    };
  }

  @Get('purchase-history')
  @ApiOperation({ summary: 'Get purchase history (Truck Owner)' })
  @ApiResponse({ status: 200, description: 'Returns purchase history' })
  async getPurchaseHistory(@Request() req) {
    const tenantId = req.user.tenantId;
    const truckOwnerUserId = req.user.id;

    const history = await this.marketplaceService.getPurchaseHistory(tenantId, truckOwnerUserId);

    return {
      success: true,
      data: history,
    };
  }
}
