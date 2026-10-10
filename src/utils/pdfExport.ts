import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

/**
 * Utility per esportare un elemento DOM in formato PDF (A4)
 * con supporto a layout verticale (portrait) o orizzontale (landscape)
 */
export async function esportaElementoInPDF(
  element: HTMLElement,
  nomeFile: string,
  orientamento: 'portrait' | 'landscape' = 'portrait'
): Promise<boolean> {
  try {
    // Renderizza con html2canvas-pro con pieno supporto nativo a colori moderni oklch()
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: orientamento,
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Prima pagina
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Eventuali pagine successive (se il contenuto supera A4)
    while (heightLeft > 5) {
      position = -(pageHeight * (pdf.getNumberOfPages()));
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    const fileFinal = nomeFile.toLowerCase().endsWith('.pdf') ? nomeFile : `${nomeFile}.pdf`;
    pdf.save(fileFinal);
    return true;
  } catch (error) {
    console.error('Errore durante la generazione diretta del PDF:', error);
    // Fallback sicuro alla stampa di sistema del browser
    window.print();
    return false;
  }
}
