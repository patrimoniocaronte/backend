import assert from 'assert';
import { calculateTotalIrpf, CuenticaExpenseLine } from '../mappers/cuentica.mapper';

// Runner básico sin frameworks externos requeridos (vitest/jest)
const runTests = () => {
  console.log('[TEST] Evaluando Lógica de Retenciones IRPF...');

  try {
    const defaultLines: CuenticaExpenseLine[] = [
      { id: '1', concept: 'Línea base', amount: 100, retention: 0 },
      { id: '2', concept: 'Punto con retención', amount: 200, retention: 15 },
      { id: '3', concept: 'Complemento', amount: 50, retention: 5 },
    ];

    const result = calculateTotalIrpf(defaultLines);
    assert.strictEqual(result, 20, 'La suma de retenciones debería ser 20 (15 + 5)');

    const emptyLines: CuenticaExpenseLine[] = [];
    const resultEmpty = calculateTotalIrpf(emptyLines);
    assert.strictEqual(resultEmpty, 0, 'La suma de array vacío debe ser 0');

    console.log('[TEST] ✅ Tests de Cálculo IRPF superados exitosamente.');
  } catch (error: any) {
    console.error('[TEST] ❌ Test Fallido:', error.message);
    process.exit(1);
  }
};

runTests();
