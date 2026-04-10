import { Router } from 'express';
import { getCuenticaExpensesWithIrpf, downloadCuenticaAttachment } from './controllers/cuentica.controller';

const router = Router();

// Endpoint: GET /api/modules/cuentica/expenses/with-irpf
router.get('/expenses/with-irpf', getCuenticaExpensesWithIrpf);

// Endpoint: GET /api/modules/cuentica/expense/:id/attachment?url=URL_COMPLETA
router.get('/expense/:expenseId/attachment', downloadCuenticaAttachment);

export default router;
