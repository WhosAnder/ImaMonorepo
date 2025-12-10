import { pdf } from '@react-pdf/renderer';
import { WorkReportPDF, WorkReportPDFProps } from '../components/WorkReportPDF';

export const generateWorkReportPDF = async (data: WorkReportPDFProps['values']) => {
    try {
        const blob = await pdf(<WorkReportPDF values={data} />).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const folio = data.folio || new Date().toISOString().split('T')[0];
        link.download = `reporte-trabajo-${folio}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error al generar el PDF');
    }
};
