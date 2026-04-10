import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

const loginValidation = [
  body('username').isString().trim().notEmpty().withMessage('El usuario es requerido'),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
];

router.post('/login', loginValidation, authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
