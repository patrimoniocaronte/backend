"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Security Headers
app.use((0, helmet_1.default)());
// CORS configuration
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173',
    credentials: true
}));
// Body Parsers
app.use(express_1.default.json({ limit: '25mb' }));
app.use((0, cookie_parser_1.default)());
// Rate Limiting
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});
app.use(globalLimiter);
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 10, // More strict for login
    message: { error: 'Demasiados intentos de acceso. Inténtalo de nuevo en 15 minutos.' }
});
// Import Modules
const routes_1 = __importDefault(require("./modules/auth/routes"));
const routes_2 = __importDefault(require("./modules/cuentica/routes"));
const routes_3 = __importDefault(require("./modules/uploads/routes"));
const auth_middleware_1 = require("./middlewares/auth.middleware");
// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: process.env.NODE_ENV });
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', routes_1.default);
app.use('/api/modules/cuentica', auth_middleware_1.authenticate, routes_2.default); // Protected!
app.use('/api/modules/uploads', auth_middleware_1.authenticate, routes_3.default);
// Global Error Handler
app.use((err, req, res, next) => {
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
