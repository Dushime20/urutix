import 'express';

declare module 'express' {
  interface Request {
    id?: string;
    user?: {
      userId: string;
      email: string;
      role: string;
      tenantId: string;
      clientIp: string;
      userAgent: string;
      tokenIssuedAt: Date;
      tokenExpiresAt: Date;
    };
  }
}
