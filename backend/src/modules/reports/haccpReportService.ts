/**
 * HACCP Audit Report Service
 * Haalt data op en genereert PDF/Excel rapporten conform FAVV, Reg. EC 852/2004
 */
import path from 'path';
import { prisma } from '../../config/database';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require('pdfmake');
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const robotoPath = path.join(__dirname, '../../../node_modules/roboto-font/fonts/Roboto');
const fonts = {
  Roboto: {
    normal: path.join(robotoPath, 'roboto-regular-webfont.ttf'),
    bold: path.join(robotoPath, 'roboto-bold-webfont.ttf'),
    italics: path.join(robotoPath, 'roboto-italic-webfont.ttf'),
    bolditalics: path.join(robotoPath, 'roboto-bolditalic-webfont.ttf'),
  },
};

const printer = new PdfPrinter(fonts);

export interface HaccpReportParams {
  customerId: string;
  locationId?: string;
  coldCellIds?: string[];
  startDate: Date;
  endDate: Date;
}

export interface HaccpAuditData {
  bedrijfsnaam: string;
  adres: string;
  rapportperiode: { van: string; tot: string };
  locatie: string;
  verantwoordelijken: { naam: string; functie: string }[];
  temperatuurmetingen: {
    timestamp: string;
    sensor: string;
    locatie: string;
    waarde: number;
    normMin: number;
    normMax: number;
    status: 'OK' | 'NOK';
  }[];
  ccpAfwijkingen: {
    id: string;
    timestamp: string;
    sensor: string;
    waarde: number;
    grenswaarde: number;
    type: string;
    beschrijving: string;
    correctieveActie: string;
    uitgevoerdDoor: string;
    herstelTijdstip: string | null;
  }[];
  alarmgeschiedenis: {
    timestamp: string;
    type: string;
    ernst: string;
    gecontacteerd: string;
    kanaal: string;
    bevestigd: boolean;
    bevestigingTijdstip: string | null;
    opmerking: string | null;
  }[];
  samenvatting: {
    totaalMetingen: number;
    binnenNorm: number;
    percentageBinnenNorm: number;
    aantalAfwijkingen: number;
    aantalAlarmen: number;
    alarmenBevestigd: number;
    beoordeling: string;
    motivatie: string;
  };
}

export async function fetchHaccpAuditData(params: HaccpReportParams): Promise<HaccpAuditData> {
  const { customerId, locationId, coldCellIds, startDate, endDate } = params;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      locations: {
        where: locationId ? { id: locationId } : undefined,
        include: {
          coldCells: {
            where: coldCellIds?.length ? { id: { in: coldCellIds } } : undefined,
            include: {
              devices: true,
              alerts: {
                where: {
                  triggeredAt: { gte: startDate, lte: endDate },
                },
                include: { escalationLogs: true },
                orderBy: { triggeredAt: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  if (!customer) {
    throw new Error('Klant niet gevonden');
  }

  const coldCells = customer.locations.flatMap((loc) => loc.coldCells);
  const loc = customer.locations[0]; // Voor weergave "locatie" in rapport

  if (coldCells.length === 0) {
    throw new Error('Geen koelcellen gevonden voor de geselecteerde locatie(s). Voeg eerst locaties en koelcellen toe.');
  }

  const allDevices = coldCells.flatMap((cc) => cc.devices);

  // Temperatuurmetingen ophalen
  const readings = await prisma.sensorReading.findMany({
    where: {
      deviceId: { in: allDevices.map((d) => d.id) },
      recordedAt: { gte: startDate, lte: endDate },
    },
    include: {
      device: {
        include: {
          coldCell: {
            include: { location: true },
          },
        },
      },
    },
    orderBy: { recordedAt: 'asc' },
  });

  // Verantwoordelijken
  const verantwoordelijken = [
    { naam: customer.contactName, functie: 'Verantwoordelijke' },
  ];

  // Temperatuurmetingen formatteren
  const temperatuurmetingen = readings.map((r) => {
    const cc = r.device.coldCell;
    const normMin = cc.temperatureMinThreshold;
    const normMax = cc.temperatureMaxThreshold;
    const ok = r.temperature >= normMin && r.temperature <= normMax;
    return {
      timestamp: format(r.recordedAt, "dd/MM/yyyy HH:mm", { locale: nl }),
      sensor: r.device.serialNumber,
      locatie: `${cc.location.locationName} – ${cc.name}`,
      waarde: r.temperature,
      normMin,
      normMax,
      status: (ok ? 'OK' : 'NOK') as 'OK' | 'NOK',
    };
  });

  // CCP-afwijkingen (vanuit alerts)
  const ccpAfwijkingen = coldCells.flatMap((cc) =>
    cc.alerts.map((a) => ({
      id: a.id,
      timestamp: format(a.triggeredAt, "dd/MM/yyyy HH:mm", { locale: nl }),
      sensor: cc.devices[0]?.serialNumber || '-',
      waarde: a.value ?? 0,
      grenswaarde: a.threshold ?? 0,
      type: a.type,
      beschrijving: `${a.type}: ${a.value}°C (norm: ${a.threshold}°C)`,
      correctieveActie: a.resolutionNote || '[Niet geregistreerd]',
      uitgevoerdDoor: a.acknowledgedBy || '[Niet geregistreerd]',
      herstelTijdstip: a.resolvedAt ? format(a.resolvedAt, "dd/MM/yyyy HH:mm", { locale: nl }) : null,
    }))
  );

  // Alarmgeschiedenis (alerts + escalation logs)
  const alarmgeschiedenis: HaccpAuditData['alarmgeschiedenis'] = [];
  for (const cc of coldCells) {
    for (const alert of cc.alerts) {
      const logs = alert.escalationLogs || [];
      if (logs.length > 0) {
        for (const log of logs) {
          alarmgeschiedenis.push({
            timestamp: format(log.sentAt, "dd/MM/yyyy HH:mm", { locale: nl }),
            type: alert.type,
            ernst: alert.layer,
            gecontacteerd: log.recipientType,
            kanaal: log.channel,
            bevestigd: !!log.responseAt,
            bevestigingTijdstip: log.responseAt ? format(log.responseAt, "dd/MM/yyyy HH:mm", { locale: nl }) : null,
            opmerking: alert.resolutionNote || null,
          });
        }
      } else {
        alarmgeschiedenis.push({
          timestamp: format(alert.triggeredAt, "dd/MM/yyyy HH:mm", { locale: nl }),
          type: alert.type,
          ernst: alert.layer,
          gecontacteerd: alert.notifiedCustomer ? 'Klant' : alert.notifiedTechnician ? 'Technicus' : '-',
          kanaal: 'PUSH',
          bevestigd: !!alert.acknowledgedAt,
          bevestigingTijdstip: alert.acknowledgedAt ? format(alert.acknowledgedAt, "dd/MM/yyyy HH:mm", { locale: nl }) : null,
          opmerking: alert.resolutionNote || null,
        });
      }
    }
  }

  const totaalMetingen = temperatuurmetingen.length;
  const binnenNorm = temperatuurmetingen.filter((t) => t.status === 'OK').length;
  const percentageBinnenNorm = totaalMetingen > 0 ? Math.round((binnenNorm / totaalMetingen) * 100) : 100;
  const aantalAfwijkingen = ccpAfwijkingen.length;
  const aantalAlarmen = alarmgeschiedenis.length;
  const alarmenBevestigd = alarmgeschiedenis.filter((a) => a.bevestigd).length;

  let beoordeling = 'Voldoet aan HACCP-vereisten';
  let motivatie = 'Alle metingen binnen norm, geen onopgeloste afwijkingen.';
  if (aantalAfwijkingen > 0 || alarmenBevestigd < aantalAlarmen) {
    beoordeling = 'Vereist opvolging';
    motivatie = `${aantalAfwijkingen} CCP-afwijking(en), ${aantalAlarmen - alarmenBevestigd} niet-bevestigde alarm(en).`;
  }

  return {
    bedrijfsnaam: customer.companyName,
    adres: customer.address || '[Niet geregistreerd]',
    rapportperiode: {
      van: format(startDate, "dd/MM/yyyy", { locale: nl }),
      tot: format(endDate, "dd/MM/yyyy", { locale: nl }),
    },
    locatie: locationId && loc ? loc.locationName : customer.locations.map((l) => l.locationName).join(', ') || 'Alle locaties',
    verantwoordelijken,
    temperatuurmetingen,
    ccpAfwijkingen,
    alarmgeschiedenis,
    samenvatting: {
      totaalMetingen,
      binnenNorm,
      percentageBinnenNorm,
      aantalAfwijkingen,
      aantalAlarmen,
      alarmenBevestigd,
      beoordeling,
      motivatie,
    },
  };
}

export async function generateHaccpPdf(data: HaccpAuditData): Promise<Buffer> {
  const docDef = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    footer: (currentPage: number, pageCount: number) => ({
      text: `${data.bedrijfsnaam} | Rapport ${data.rapportperiode.van} t.e.m. ${data.rapportperiode.tot} | Pagina ${currentPage}/${pageCount} | Gegenereerd door IntelliFrost`,
      fontSize: 8,
      color: '#666666',
      alignment: 'center',
    }),
    content: [
      { text: 'HACCP AUDIT RAPPORT', style: 'header', margin: [0, 0, 0, 20] },
      { text: data.bedrijfsnaam, style: 'subheader', margin: [0, 0, 0, 4] },
      { text: data.adres, fontSize: 10, margin: [0, 0, 0, 4] },
      { text: `Rapportperiode: ${data.rapportperiode.van} t.e.m. ${data.rapportperiode.tot}`, fontSize: 10, margin: [0, 0, 0, 4] },
      { text: `Datum aanmaak: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: nl })}`, fontSize: 10, margin: [0, 0, 0, 30] },

      { text: '1. SAMENVATTING', style: 'sectionHeader', margin: [0, 20, 0, 10] },
      {
        text: [
          `Totaal metingen: ${data.samenvatting.totaalMetingen}. `,
          `Binnen norm: ${data.samenvatting.percentageBinnenNorm}%. `,
          `CCP-afwijkingen: ${data.samenvatting.aantalAfwijkingen}. `,
          `Alarmen: ${data.samenvatting.aantalAlarmen} (${data.samenvatting.alarmenBevestigd} bevestigd). `,
          `Beoordeling: ${data.samenvatting.beoordeling}. ${data.samenvatting.motivatie}`,
        ],
        fontSize: 10,
        margin: [0, 0, 0, 15],
      },

      { text: '2. TEMPERATUURMETINGEN', style: 'sectionHeader', margin: [0, 20, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', 50, 50, 40],
          body: [
            ['Datum & Tijd', 'Sensor/Locatie', 'Locatie', 'Waarde °C', 'Norm', 'Status'],
            ...data.temperatuurmetingen.slice(0, 100).map((t) => [
              t.timestamp,
              t.sensor,
              t.locatie,
              t.waarde.toFixed(1),
              `${t.normMin}-${t.normMax}`,
              t.status,
            ]),
          ],
        },
        layout: 'lightGridLines',
        fontSize: 8,
        margin: [0, 0, 0, 10],
      },
      ...(data.temperatuurmetingen.length > 100
        ? [{ text: `... en ${data.temperatuurmetingen.length - 100} metingen meer (zie Excel voor volledige data)`, fontSize: 8, italics: true, margin: [0, 0, 0, 15] }]
        : []),

      { text: '3. CCP-AFWIJKINGEN & CORRECTIEVE ACTIES', style: 'sectionHeader', margin: [0, 20, 0, 10] },
      ...(data.ccpAfwijkingen.length === 0
        ? [{ text: 'Geen CCP-afwijkingen in deze periode.', fontSize: 10, margin: [0, 0, 0, 15] }]
        : data.ccpAfwijkingen.map((a, i) => ({
            stack: [
              { text: `Afwijking ${i + 1} – ${a.timestamp}`, bold: true, fontSize: 10 },
              { text: `Sensor: ${a.sensor}, Waarde: ${a.waarde}°C, Grens: ${a.grenswaarde}°C`, fontSize: 9 },
              { text: `Correctieve actie: ${a.correctieveActie}`, fontSize: 9 },
              { text: `Uitgevoerd door: ${a.uitgevoerdDoor}, Herstel: ${a.herstelTijdstip || '-'}`, fontSize: 9 },
              { text: '', margin: [0, 0, 0, 8] },
            ],
            margin: [0, 0, 0, 5],
          }))),

      { text: '4. ALARMGESCHIEDENIS', style: 'sectionHeader', margin: [0, 20, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 60, 50, '*', 50, 50, '*'],
          body: [
            ['Tijdstip', 'Type', 'Ernst', 'Gecontacteerd', 'Kanaal', 'Bevestigd', 'Opmerking'],
            ...data.alarmgeschiedenis.slice(0, 50).map((a) => [
              a.timestamp,
              a.type,
              a.ernst,
              a.gecontacteerd,
              a.kanaal,
              a.bevestigd ? 'Ja' : 'Nee',
              a.opmerking || '-',
            ]),
          ],
        },
        layout: 'lightGridLines',
        fontSize: 8,
        margin: [0, 0, 0, 10],
      },

      { text: '5. VERANTWOORDELIJKE PERSONEN', style: 'sectionHeader', margin: [0, 20, 0, 10] },
      {
        table: {
          widths: ['*', '*'],
          body: [
            ['Naam', 'Functie'],
            ...data.verantwoordelijken.map((v) => [v.naam, v.functie]),
          ],
        },
        layout: 'lightGridLines',
        fontSize: 10,
        margin: [0, 0, 0, 15],
      },
      {
        text: `Ondergetekende bevestigt dat bovenstaande gegevens correct en volledig zijn geregistreerd conform de HACCP-procedures van ${data.bedrijfsnaam}, geldig voor de periode ${data.rapportperiode.van} t.e.m. ${data.rapportperiode.tot}.`,
        fontSize: 9,
        italics: true,
        margin: [0, 10, 0, 0],
      },
    ],
    styles: {
      header: { fontSize: 18, bold: true },
      subheader: { fontSize: 14, bold: true },
      sectionHeader: { fontSize: 12, bold: true },
    },
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDef);
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    } catch (e) {
      reject(e);
    }
  });
}

export async function generateHaccpExcel(data: HaccpAuditData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'IntelliFrost';
  workbook.created = new Date();

  // Tab 1: Samenvatting
  const ws1 = workbook.addWorksheet('Samenvatting');
  ws1.addRow(['HACCP Audit Rapport – Samenvatting']);
  ws1.addRow([]);
  ws1.addRow(['Bedrijfsnaam', data.bedrijfsnaam]);
  ws1.addRow(['Adres', data.adres]);
  ws1.addRow(['Rapportperiode', `${data.rapportperiode.van} t.e.m. ${data.rapportperiode.tot}`]);
  ws1.addRow(['Locatie', data.locatie]);
  ws1.addRow([]);
  ws1.addRow(['Totaal metingen', data.samenvatting.totaalMetingen]);
  ws1.addRow(['Binnen norm', data.samenvatting.binnenNorm]);
  ws1.addRow(['% binnen norm', data.samenvatting.percentageBinnenNorm]);
  ws1.addRow(['CCP-afwijkingen', data.samenvatting.aantalAfwijkingen]);
  ws1.addRow(['Alarmen', data.samenvatting.aantalAlarmen]);
  ws1.addRow(['Alarmen bevestigd', data.samenvatting.alarmenBevestigd]);
  ws1.addRow(['Beoordeling', data.samenvatting.beoordeling]);
  ws1.addRow(['Motivatie', data.samenvatting.motivatie]);

  // Tab 2: Temperatuurmetingen
  const ws2 = workbook.addWorksheet('Temperatuurmetingen');
  ws2.addRow(['Datum & Tijdstip', 'Sensor', 'Locatie', 'Gemeten °C', 'Norm min', 'Norm max', 'Status']);
  data.temperatuurmetingen.forEach((t) => {
    ws2.addRow([t.timestamp, t.sensor, t.locatie, t.waarde, t.normMin, t.normMax, t.status]);
  });

  // Tab 3: CCP-afwijkingen
  const ws3 = workbook.addWorksheet('CCP-afwijkingen');
  ws3.addRow(['Tijdstip', 'Sensor', 'Waarde', 'Grenswaarde', 'Type', 'Correctieve actie', 'Uitgevoerd door', 'Herstel']);
  data.ccpAfwijkingen.forEach((a) => {
    ws3.addRow([a.timestamp, a.sensor, a.waarde, a.grenswaarde, a.type, a.correctieveActie, a.uitgevoerdDoor, a.herstelTijdstip]);
  });

  // Tab 4: Alarmgeschiedenis
  const ws4 = workbook.addWorksheet('Alarmgeschiedenis');
  ws4.addRow(['Tijdstip', 'Type', 'Ernst', 'Gecontacteerd', 'Kanaal', 'Bevestigd', 'Bevestiging', 'Opmerking']);
  data.alarmgeschiedenis.forEach((a) => {
    ws4.addRow([a.timestamp, a.type, a.ernst, a.gecontacteerd, a.kanaal, a.bevestigd ? 'Ja' : 'Nee', a.bevestigingTijdstip, a.opmerking]);
  });

  // Tab 5: Verantwoordelijken
  const ws5 = workbook.addWorksheet('Verantwoordelijken');
  ws5.addRow(['Naam', 'Functie']);
  data.verantwoordelijken.forEach((v) => {
    ws5.addRow([v.naam, v.functie]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
