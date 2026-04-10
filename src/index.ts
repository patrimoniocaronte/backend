import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Body Parsers
app.use(express.json({ limit: '25mb' }));
app.use(cookieParser());

// Rate Limiting
const globalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 100, 
	standardHeaders: 'draft-7',
	legacyHeaders: false,
});
app.use(globalLimiter);

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10, // More strict for login
	message: { error: 'Demasiados intentos de acceso. Inténtalo de nuevo en 15 minutos.' }
});

// Import Modules
import authRoutes from './modules/auth/routes';
import cuenticaRoutes from './modules/cuentica/routes';
import uploadsRoutes from './modules/uploads/routes';
import { authenticate } from './middlewares/auth.middleware';

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/modules/cuentica', authenticate, cuenticaRoutes); // Protected!
app.use('/api/modules/uploads', authenticate, uploadsRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Error]', err);
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(err.status || 500).json({
    error: isProduction ? 'Hubo un error interno en el servidor' : err.message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
