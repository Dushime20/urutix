import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';

@Module({
    imports: [EnhancedAuthModule],
    controllers: [OnboardingController],
})
export class OnboardingModule { }
