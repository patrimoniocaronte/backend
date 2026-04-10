import { Request, Response } from 'express';
import { getExpensesWithIrpf } from '../services/cuentica.service';
import { cuenticaApi } from '../api-client/cuentica.client';

export const getCuenticaExpensesWithIrpf = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, providerId, page = '1', pageSize = '50' } = req.query;

    const filters = {
      startDate: startDate as string,
      endDate: endDate as string,
      providerId: providerId as string,
      page: parseInt(page as string, 10),
      pageSize: parseInt(pageSize as string, 10),
    };

    const result = await getExpensesWithIrpf(filters);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Error interno o de proveedor externo.' });
  }
};

export const downloadCuenticaAttachment = async (req: Request, res: Response) => {
  try {
    const { expenseId } = req.params;
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL de adjunto no proporcionada' });
    }

    // Cuéntica no devuelve el binario directo, sino un JSON con un campo base64
    const response = await cuenticaApi.get(url, {
      responseType: 'json',
      validateStatus: (status) => status >= 200 && status < 300, 
    });

    if (!response.data || !response.data.data) {
      return res.status(404).json({ error: 'Fichero no encontrado o base64 ausente en Cuéntica' });
    }

    const pdfBuffer = Buffer.from(response.data.data, 'base64');
    const mimeType = response.data.mimetype || 'application/pdf';
    const finalFilename = response.data.filename || `factura-${expenseId}.pdf`;

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.status(200).send(pdfBuffer);
  } catch (error: any) {
    console.error(`Error bajando PDF ${req.params.expenseId}:`, error.message);
    res.status(500).json({ error: 'Fallo al recuperar el archivo PDF proxy' });
  }
};
