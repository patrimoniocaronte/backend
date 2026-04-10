export interface CuenticaExpenseLine {
  id: string;
  concept: string;
  amount: number;
  retention?: number; // Porcentaje o cantidad. Asignado opcional si falla.
  // Podría haber taxes, pero solo buscamos retention
}

export interface CuenticaRawExpense {
  id: string;
  status?: string; 
  date: string; 
  total_amount: number;
  provider?: {
    id: string;
    name: string;
  };
  expense_lines?: CuenticaExpenseLine[];
}

export interface CuenticaExpensesResponse {
  data: CuenticaRawExpense[];
  meta: {
    page: number;
    per_page: number;
    total: number;
  };
}

export interface InternalExpense {
  id: string;
  date: string;
  documentNumber: string | null; // Simulado, a menudo Cuéntica aporta 'invoice_number'
  totalVisible: number;
  totalIrpfCalculated: number; // Suma de retenciones de líneas
  providerId: string | null;
  providerName: string | null;
  hasAttachment: boolean;
  attachmentRemoteUrl: string | null;
}

export const calculateTotalIrpf = (lines?: any[]): number => {
  if (!lines || !Array.isArray(lines) || lines.length === 0) return 0;
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

export const mapCuenticaExpense = (raw: any): InternalExpense => {
  const totalIrpf = calculateTotalIrpf(raw.expense_lines);
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
