"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpensesWithIrpf = void 0;
const cuentica_client_1 = require("../api-client/cuentica.client");
const cuentica_mapper_1 = require("../mappers/cuentica.mapper");
// Memory Cache TTL: 2 minutes
const memoryCache = {};
const CACHE_TTL_MS = 2 * 60 * 1000;
const getExpensesWithIrpf = async (filters) => {
    const cacheKey = `${filters.startDate || 'all'}_${filters.endDate || 'all'}`;
    let allExpenses = [];
    if (memoryCache[cacheKey] && (Date.now() - memoryCache[cacheKey].timestamp) < CACHE_TTL_MS) {
        allExpenses = memoryCache[cacheKey].data;
    }
    else {
        // No en caché. Descargar todo y post-filtrar.
        let page = 1;
        let hasMorePages = true;
        const downloadedExpenses = [];
        while (hasMorePages) {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                per_page: '100', // max allow for fetching blocks
            });
            if (filters.startDate)
                queryParams.append('start_date', filters.startDate);
            if (filters.endDate)
                queryParams.append('end_date', filters.endDate);
            // Provider id might be supported natively
            if (filters.providerId)
                queryParams.append('provider_id', filters.providerId);
            try {
                const { data } = await cuentica_client_1.cuenticaApi.get(`/expense?${queryParams.toString()}`);
                if (!data || !Array.isArray(data) || data.length === 0) {
                    hasMorePages = false;
                    break;
                }
                // Post-filtro: draft == false AND retention_total > 0 AND Rango Fechas
                const filteredThisPage = data
                    .filter((raw) => raw.draft === false)
                    .filter((raw) => {
                    let isValid = true;
                    if (filters.startDate)
                        isValid = isValid && raw.date >= filters.startDate;
                    if (filters.endDate)
                        isValid = isValid && raw.date <= filters.endDate;
                    return isValid;
                })
                    .filter((raw) => (0, cuentica_mapper_1.calculateTotalIrpf)(raw.expense_lines) > 0)
                    .map(cuentica_mapper_1.mapCuenticaExpense);
                downloadedExpenses.push(...filteredThisPage);
                // Si Cuéntica devolvió menos elementos del per_page, no hay más páginas
                if (data.length < 100) {
                    hasMorePages = false;
                }
                else {
                    page++;
                }
            }
            catch (error) {
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
exports.getExpensesWithIrpf = getExpensesWithIrpf;
