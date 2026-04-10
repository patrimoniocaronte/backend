"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const cuentica_mapper_1 = require("../mappers/cuentica.mapper");
// Runner básico sin frameworks externos requeridos (vitest/jest)
const runTests = () => {
    console.log('[TEST] Evaluando Lógica de Retenciones IRPF...');
    try {
        const defaultLines = [
            { id: '1', concept: 'Línea base', amount: 100, retention: 0 },
            { id: '2', concept: 'Punto con retención', amount: 200, retention: 15 },
            { id: '3', concept: 'Complemento', amount: 50, retention: 5 },
        ];
        const result = (0, cuentica_mapper_1.calculateTotalIrpf)(defaultLines);
        assert_1.default.strictEqual(result, 20, 'La suma de retenciones debería ser 20 (15 + 5)');
        const emptyLines = [];
        const resultEmpty = (0, cuentica_mapper_1.calculateTotalIrpf)(emptyLines);
        assert_1.default.strictEqual(resultEmpty, 0, 'La suma de array vacío debe ser 0');
        console.log('[TEST] ✅ Tests de Cálculo IRPF superados exitosamente.');
    }
    catch (error) {
        console.error('[TEST] ❌ Test Fallido:', error.message);
        process.exit(1);
    }
};
runTests();
