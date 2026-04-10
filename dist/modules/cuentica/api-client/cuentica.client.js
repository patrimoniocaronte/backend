"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cuenticaApi = void 0;
const axios_1 = __importDefault(require("axios"));
// La URL base y la API KEY provienen de las variables de entorno
const CUENTICA_API_URL = process.env.CUENTICA_API_URL || 'https://api.cuentica.com';
const API_KEY = process.env.CUENTICA_API_KEY;
exports.cuenticaApi = axios_1.default.create({
    baseURL: CUENTICA_API_URL,
    headers: {
        'X-AUTH-TOKEN': API_KEY,
        'Accept': 'application/json'
    }
});
// Interceptor opcional para manejo global de fallos con el proveedor
exports.cuenticaApi.interceptors.response.use((response) => response, (error) => {
    console.error('[Cuéntica API Error]', error.response?.data || error.message);
    throw new Error('No se pudo establecer conexión con Cuéntica');
});
