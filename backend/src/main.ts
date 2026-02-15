import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import { Request, NextFunction } from 'express';
import * as morgan from 'morgan';
import { v4 } from 'uuid';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const port = process.env.PORT || 3002;

  // Serve static files from uploads directory (must be before global prefix)
  const uploadsPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });
  console.log(`📁 Serving static files from: ${uploadsPath}`);

  // Configure CORS origins.
  // In development you can set ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5713"
  // For production with subdomains: ALLOWED_ORIGINS="https://*.urutix.com,https://urutix.com"
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [
        'http://localhost:5173',
        'http://127.0.0.1:5173', // Allow 127.0.0.1 (Vite default)
        `http://localhost:${port}`,
        `http://127.0.0.1:${port}`,
        'http://localhost:5713',
        'http://127.0.0.1:5713',
      ];

  // Enable CORS for HTTP requests with subdomain support
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }
      
      if (allowedOrigins.length === 0) {
        console.warn(`⚠️  CORS: Blocked request from ${origin} - No ALLOWED_ORIGINS configured`);
        return callback(new Error('CORS not configured'), false);
      }
      
      // Check exact match first
      if (allowedOrigins.includes(origin)) {
        console.log(`✅ CORS: Allowed request from ${origin} (exact match)`);
        return callback(null, true);
      }
      
      // Check wildcard subdomain patterns (e.g., *.urutix.com)
      const isWildcardMatch = allowedOrigins.some(allowed => {
        if (allowed.includes('*')) {
          // Convert wildcard pattern to regex
          // *.urutix.com -> ^https?:\/\/[^.]+\.urutix\.com$
          const pattern = allowed
            .replace(/\./g, '\\.')
            .replace(/\*/g, '[^.]+')
            .replace(/^http/, 'https?');
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(origin);
        }
        return false;
      });
      
      if (isWildcardMatch) {
        console.log(`✅ CORS: Allowed request from ${origin} (wildcard match)`);
        return callback(null, true);
      }
      
      // For development: allow .localhost subdomains
      if (origin.includes('.localhost') || origin.includes('localhost')) {
        console.log(`✅ CORS: Allowed request from ${origin} (localhost subdomain)`);
        return callback(null, true);
      }
      
      console.warn(`⚠️  CORS: Blocked request from ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-tenant-id',
      'X-Tenant-ID',
      'X-Tenant-Subdomain', // Add subdomain header
      'Accept',
      'Origin',
      'Cache-Control',
      'X-Requested-With',
    ],
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Setup Swagger documentation
  setupSwagger(app);

  app.use((req: Request, _: any, next: NextFunction) => {
    req.id = v4();
    next();
  });
  morgan.token('id', (req: Request) => req?.id);
  const customFormat = `:method :url :status :res[content-length] - :response-time ms - :id`;
  app.use(morgan(customFormat));

  await app.listen(port);

  console.log(`🚀 UrutiX API is running on: http://localhost:${port}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 WebSocket server is available on: ws://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
