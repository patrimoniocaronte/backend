"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapCuenticaExpense = exports.calculateTotalIrpf = void 0;
const calculateTotalIrpf = (lines) => {
    if (!lines || !Array.isArray(lines) || lines.length === 0)
        return 0;
    return lines.reduce((acc, line) => {
        // Extraemos la cantidad cruda (retention_amount suele ser valor real)
        const rawAmount = line.retention_amount;
        const rawPercent = line.retention;
        const value = typeof rawAmount === 'number' && rawAmount > 0
            ? rawAmount
            : (typeof rawPercent === 'number' ? rawPercent : 0);
        return acc + value;
    }, 0);
};
exports.calculateTotalIrpf = calculateTotalIrpf;
const mapCuenticaExpense = (raw) => {
    const totalIrpf = (0, exports.calculateTotalIrpf)(raw.expense_lines);
    return {
        id: raw.id,
        date: raw.date,
        documentNumber: raw.invoice_number ?? null, // Interface tolerante a keys ocultas
        totalVisible: raw.total_amount || 0,
        totalIrpfCalculated: totalIrpf,
        providerId: raw.provider?.id ?? null,
        providerName: raw.provider?.name ?? null,
        hasAttachment: raw.has_attachment === true,
        attachmentRemoteUrl: raw.has_attachment && raw.attachment ? raw.attachment.url : null,
    };
};
exports.mapCuenticaExpense = mapCuenticaExpense;
