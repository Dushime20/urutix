import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import { Request, NextFunction } from 'express';
import * as morgan from 'morgan';
import { v4 } from 'uuid';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;

  // Configure CORS origins.
  // In development you can set ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5713"
  // otherwise we fall back to sensible localhost entries.
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:5173', `http://localhost:${port}`, 'http://localhost:5713'];

  // Enable CORS for HTTP requests
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'X-Tenant-ID', 'Accept', 'Origin', 'Cache-Control', 'X-Requested-With'],
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
