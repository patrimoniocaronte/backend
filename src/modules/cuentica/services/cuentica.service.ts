import { cuenticaApi } from '../api-client/cuentica.client';
import { mapCuenticaExpense, CuenticaExpensesResponse, InternalExpense, calculateTotalIrpf } from '../mappers/cuentica.mapper';

export interface GetExpensesFilters {
  startDate?: string;
  endDate?: string;
  providerId?: string;
  page: number;
  pageSize: number;
}

// Memory Cache TTL: 2 minutes
const memoryCache: Record<string, { data: InternalExpense[], timestamp: number }> = {};
const CACHE_TTL_MS = 2 * 60 * 1000;

export const getExpensesWithIrpf = async (filters: GetExpensesFilters) => {
  const cacheKey = `${filters.startDate || 'all'}_${filters.endDate || 'all'}`;

  let allExpenses: InternalExpense[] = [];

  if (memoryCache[cacheKey] && (Date.now() - memoryCache[cacheKey].timestamp) < CACHE_TTL_MS) {
    allExpenses = memoryCache[cacheKey].data;
  } else {
    // No en caché. Descargar todo y post-filtrar.
    let page = 1;
    let hasMorePages = true;
    const downloadedExpenses: InternalExpense[] = [];

    while (hasMorePages) {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        per_page: '100', // max allow for fetching blocks
      });

      if (filters.startDate) queryParams.append('start_date', filters.startDate);
      if (filters.endDate) queryParams.append('end_date', filters.endDate);
      // Provider id might be supported natively
      if (filters.providerId) queryParams.append('provider_id', filters.providerId);
      
      try {
        const { data } = await cuenticaApi.get<any[]>(`/expense?${queryParams.toString()}`);

        if (!data || !Array.isArray(data) || data.length === 0) {
          hasMorePages = false;
          break;
        }

        // Post-filtro: draft == false AND retention_total > 0 AND Rango Fechas
        const filteredThisPage = data
          .filter((raw: any) => raw.draft === false)
          .filter((raw: any) => {
            let isValid = true;
            if (filters.startDate) isValid = isValid && raw.date >= filters.startDate;
            if (filters.endDate) isValid = isValid && raw.date <= filters.endDate;
            return isValid;
          })
          .filter((raw: any) => calculateTotalIrpf(raw.expense_lines) > 0)
          .map(mapCuenticaExpense);

        downloadedExpenses.push(...filteredThisPage);

        // Si Cuéntica devolvió menos elementos del per_page, no hay más páginas
        if (data.length < 100) {
          hasMorePages = false;
        } else {
          page++;
        }
      } catch (error: any) {
        if (error.response?.status === 429) {
          console.error('[RateLimit Cuéntica] 429 Too Many Requests recibidos en página', page);
          throw new Error('RateLimit superado contra Cuéntica.');
        }
        throw new Error('Fallback al descargar página ' + page + ' de Cuéntica.');
      }
    }
    
    // Almacenar todos los filtrados para este rango en memoria.
    memoryCache[cacheKey] = {
      data: downloadedExpenses,
      timestamp: Date.now()
    };
    allExpenses = downloadedExpenses;
  }

  // Si después del post-filtrado general quieren aplicar provider_id como post-filtro 
  // (por si cuéntica no lo soporta remoto), lo hacemos:
  if (filters.providerId) {
    allExpenses = allExpenses.filter(e => e.providerId === filters.providerId);
  }

  // Ordenar fechas (descendente)
  allExpenses.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Paginación Manual sobre los post-filtrados:
  const offset = (filters.page - 1) * filters.pageSize;
  const sliced = allExpenses.slice(offset, offset + filters.pageSize);

  return {
    items: sliced,
    total: allExpenses.length, // total real tras filtro de negocio
    page: filters.page,
    pageSize: filters.pageSize,
    filtersApplied: filters,
    source: "cuentica",
    cached: true
  };
};
