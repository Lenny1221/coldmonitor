/**
 * Inbedrijfstellingsattest PDF – EU 517/2014, F-gassen
 * Genereert attest met: datum installatie, koelmiddel, druktest, lekkagetest, installateur + F-gas cert
 */
import path from 'path';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinterModule = require('pdfmake/js/Printer');
const PdfPrinter = PdfPrinterModule.default ?? PdfPrinterModule;

function getRobotoFontPath(): string {
  try {
    return path.join(path.dirname(require.resolve('roboto-font/package.json')), 'fonts/Roboto');
  } catch {
    return path.join(__dirname, '../../../node_modules/roboto-font/fonts/Roboto');
  }
}

const robotoPath = getRobotoFontPath();
const fonts = {
  Roboto: {
    normal: path.join(robotoPath, 'roboto-regular-webfont.ttf'),
    bold: path.join(robotoPath, 'roboto-bold-webfont.ttf'),
    italics: path.join(robotoPath, 'roboto-italic-webfont.ttf'),
    bolditalics: path.join(robotoPath, 'roboto-bolditalic-webfont.ttf'),
  },
};

const printer = new PdfPrinter(fonts);

export interface InbedrijfstellingAttestData {
  installationName: string;
  customerName: string;
  customerAddress?: string;
  performedAt: Date;
  technicianName: string;
  technicianCertNr?: string;
  refrigerantType: string;
  refrigerantKg: number;
  pressureTestResult: string;
  leakTestResult: string;
  notes?: string;
}

export async function generateInbedrijfstellingAttestPdf(data: InbedrijfstellingAttestData): Promise<Buffer> {
  const docDef = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    footer: () => ({
      text: `Inbedrijfstellingsattest | ${data.installationName} | Gegenereerd door IntelliFrost | ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: nl })}`,
      fontSize: 8,
      color: '#666666',
      alignment: 'center',
    }),
    content: [
      { text: 'INBEDRIJFSTELLINGSATTEST', style: 'header', margin: [0, 0, 0, 20] },
      { text: 'Koelinstallatie – conform EU 517/2014 (F-gassen), NBN EN 378', fontSize: 10, margin: [0, 0, 0, 20] },

      { text: '1. Installatiegegevens', style: 'sectionHeader', margin: [0, 15, 0, 10] },
      {
        table: {
          widths: [120, '*'],
          body: [
            ['Installatie', data.installationName],
            ['Klant', data.customerName],
            ['Adres', data.customerAddress || '—'],
          ],
        },
        layout: 'lightGridLines',
        fontSize: 10,
        margin: [0, 0, 0, 15],
      },

      { text: '2. Datum van installatie', style: 'sectionHeader', margin: [0, 15, 0, 10] },
      { text: format(data.performedAt, "dd MMMM yyyy 'om' HH:mm", { locale: nl }), fontSize: 10, margin: [0, 0, 0, 15] },

      { text: '3. Type koelmiddel en hoeveelheid', style: 'sectionHeader', margin: [0, 15, 0, 10] },
      {
        table: {
          widths: [120, '*'],
          body: [
            ['Type koelmiddel', data.refrigerantType],
            ['Hoeveelheid (kg)', data.refrigerantKg.toString()],
          ],
        },
        layout: 'lightGridLines',
        fontSize: 10,
        margin: [0, 0, 0, 15],
      },

      { text: '4. Druktest resultaten', style: 'sectionHeader', margin: [0, 15, 0, 10] },
      { text: data.pressureTestResult || '—', fontSize: 10, margin: [0, 0, 0, 15] },

      { text: '5. Lekkagetest bij installatie', style: 'sectionHeader', margin: [0, 15, 0, 10] },
      { text: data.leakTestResult || '—', fontSize: 10, margin: [0, 0, 0, 15] },

      { text: '6. Gegevens installateur', style: 'sectionHeader', margin: [0, 15, 0, 10] },
      {
        table: {
          widths: [120, '*'],
          body: [
            ['Naam', data.technicianName],
            ['F-gassencertificaat (BRL200/STEK)', data.technicianCertNr || '—'],
          ],
        },
        layout: 'lightGridLines',
        fontSize: 10,
        margin: [0, 0, 0, 15],
      },

      ...(data.notes
        ? [
            { text: '7. Opmerkingen', style: 'sectionHeader', margin: [0, 15, 0, 10] },
            { text: data.notes, fontSize: 10, margin: [0, 0, 0, 15] },
          ]
        : []),

      { text: 'Dit attest bevestigt dat de installatie correct geplaatst en getest is.', fontSize: 9, italics: true, margin: [0, 30, 0, 0] },
    ],
    styles: {
      header: { fontSize: 18, bold: true },
      sectionHeader: { fontSize: 12, bold: true },
    },
  };

  const pdfDoc = await printer.createPdfKitDocument(docDef);
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}
