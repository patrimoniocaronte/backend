"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cuentica_controller_1 = require("./controllers/cuentica.controller");
const router = (0, express_1.Router)();
// Endpoint: GET /api/modules/cuentica/expenses/with-irpf
router.get('/expenses/with-irpf', cuentica_controller_1.getCuenticaExpensesWithIrpf);
// Endpoint: GET /api/modules/cuentica/expense/:id/attachment?url=URL_COMPLETA
router.get('/expense/:expenseId/attachment', cuentica_controller_1.downloadCuenticaAttachment);
exports.default = router;
