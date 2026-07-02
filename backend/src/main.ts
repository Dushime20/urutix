import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import { Request, NextFunction } from 'express';
import * as morgan from 'morgan';
import { v4 } from 'uuid';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const port = process.env.PORT || 3005;

  // Static files (uploads) are served directly by nginx from the Docker volume.
  // NestJS does not serve uploads — see nginx/urutix.com.conf.

  // Configure CORS origins from environment variable ONLY
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [];

  if (allowedOrigins.length === 0) {
    console.warn('⚠️  WARNING: No ALLOWED_ORIGINS defined in .env. CORS will block all requests.');
  } else {
    console.log('✅ CORS Allowed Origins:', allowedOrigins);
  }

  // Enhanced CORS with wildcard subdomain support
  app.enableCors({
    origin: (origin, callback) => {

      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Check static allowed origins first
      if (allowedOrigins.includes(origin)) {
        console.log(`✅ CORS: Allowed request from ${origin} (static origin)`);
        return callback(null, true);
      }

      // Wildcard pattern matching for subdomains
      const allowedPatterns = [
        /^http:\/\/localhost:\d+$/,                    // localhost:port
        /^http:\/\/127\.0\.0\.1:\d+$/,                // 127.0.0.1:port
        /^http:\/\/[^.]+\.localhost:\d+$/,            // *.localhost:port
        /^https:\/\/[^.]+\.urutix\.com$/,             // *.urutix.com
        /^https:\/\/urutix\.com$/,                    // main domain
        /^http:\/\/[^.]+\.urutix\.com:\d+$/,          // *.urutix.com:port (dev)
      ];

      const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
      
      if (isAllowed) {
        console.log(`✅ CORS: Allowed request from ${origin} (pattern match)`);
        callback(null, true);
      } else {
        console.log(`❌ CORS: Blocked request from ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }

    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Tenant-Subdomain',  // Add subdomain header
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

  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Deployed automatically: ${new Date().toISOString()}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 WebSocket server is available on: ws://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
