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
  // otherwise we fall back to sensible localhost entries.
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

  // Enable CORS for HTTP requests
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
      
      if (allowedOrigins.includes(origin)) {
        console.log(`✅ CORS: Allowed request from ${origin}`);
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
