/**
 * PDF de simulación de crédito (amortización). La parte de inversiones está en useInvestmentPdf.ts.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function formatMoney(val: number | undefined) {
  return `$${(val ?? 0).toFixed(2)}`;
}

function formatTermMonths(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} ${m === 1 ? 'mes' : 'meses'}`;
  if (m === 0) return `${y} ${y === 1 ? 'año' : 'años'}`;
  return `${y} ${y === 1 ? 'año' : 'años'} y ${m} ${m === 1 ? 'mes' : 'meses'}`;
}

export function usePdf() {
  function generateCreditPdf(summary: any, schedule: any[], institution: any, disbursementCharges?: any[]) {
    const doc = new jsPDF({ orientation: 'landscape' });
    const primary = institution?.primaryColor || '#1A3C6E';

    doc.setFontSize(18);
    doc.setTextColor(primary);
    doc.text(institution?.name || 'Simulador Financiero', 14, 16);

    doc.setFontSize(10);
    doc.setTextColor('#555');
    doc.text('Simulación de Crédito — Tabla de Amortización', 14, 23);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-EC')}`, 14, 29);

    if (institution?.slogan) {
      doc.setFontSize(9);
      doc.setTextColor('#888');
      doc.text(institution.slogan, 14, 35);
    }

    doc.setFontSize(12);
    doc.setTextColor('#222');
    doc.text('Resumen del crédito', 14, 44);

    const summaryBody: string[][] = [
      ['Monto del crédito', formatMoney(summary.loanAmount)],
      ['Tasa de interés anual', `${summary.annualRatePct}%`],
      ['Plazo', `${summary.termMonths} meses (${formatTermMonths(summary.termMonths)})`],
      ['Sistema de amortización', summary.amortizationSystem === 'french' ? 'Francés (cuota fija)' : 'Alemán (capital fijo)'],
      [summary.amortizationSystem === 'french' ? 'Cuota mensual' : 'Primera cuota', formatMoney(summary.firstInstallment)],
      ['Última cuota', formatMoney(summary.lastInstallment)],
      ['Total interés', formatMoney(summary.totalInterest)],
      ['SOLCA (0.5% — COMF Disp. Gral. 14ª)', formatMoney(summary.totalSolca)],
    ];

    if (summary.totalDesgravamen > 0) {
      summaryBody.push(['Total Seguro de Desgravamen', formatMoney(summary.totalDesgravamen)]);
    }
    if (summary.totalFire > 0) {
      summaryBody.push(['Total Seguro Incendio y Terremoto', formatMoney(summary.totalFire)]);
    }
    if (summary.totalOtherCharges > 0) {
      summaryBody.push(['Otros cargos', formatMoney(summary.totalOtherCharges)]);
    }
    summaryBody.push(['COSTO TOTAL DEL CRÉDITO', formatMoney(summary.totalCreditCost)]);

    if (summary.maxRecommendedPayment) {
      summaryBody.push(['Capacidad de pago recomendada (40% ingresos)', formatMoney(summary.maxRecommendedPayment)]);
      summaryBody.push(['¿Supera capacidad de pago?', summary.exceedsPaymentCapacity ? 'Sí' : 'No']);
    }

    autoTable(doc, {
      startY: 48,
      head: [['Concepto', 'Valor']],
      body: summaryBody,
      theme: 'grid',
      headStyles: { fillColor: primary },
      columnStyles: { 1: { halign: 'right' } },
    });

    if (disbursementCharges && disbursementCharges.length > 0) {
      const disbY = (doc as any).lastAutoTable.finalY + 6;
      doc.setFontSize(10);
      doc.setTextColor('#222');
      doc.text('Cobros al desembolso', 14, disbY);
      autoTable(doc, {
        startY: disbY + 4,
        head: [['Nombre', 'Monto', 'Nota legal']],
        body: disbursementCharges.map((c: any) => [c.name, formatMoney(c.amount), c.legalNote || '']),
        theme: 'grid',
        headStyles: { fillColor: primary },
        styles: { fontSize: 8 },
        columnStyles: { 1: { halign: 'right' } },
      });
    }

    const chargeNames = [...new Set(
      schedule.flatMap((r) => (r.additionalCharges ?? []).map((c: any) => c.name))
    )] as string[];

    const tableY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(12);
    doc.setTextColor('#222');
    doc.text('Tabla de amortización', 14, tableY);

    const initialBalance = schedule.length > 0
      ? schedule[0].balance + schedule[0].principal
      : summary.loanAmount;

    const row0: string[] = ['0', '—', '—', '—', ...chargeNames.map(() => '—'), formatMoney(initialBalance)];
    const head = [['#', 'Capital', 'Interés', 'Cuota total', ...chargeNames, 'Saldo']];
    const body = [row0, ...schedule.map((r) => [
      String(r.number),
      formatMoney(r.principal),
      formatMoney(r.interest),
      formatMoney(r.totalPayment),
      ...chargeNames.map((name) => {
        const c = (r.additionalCharges ?? []).find((ch: any) => ch.name === name);
        return formatMoney(c?.amount ?? 0);
      }),
      formatMoney(r.balance),
    ])];

    autoTable(doc, {
      startY: tableY + 4,
      head,
      body,
      theme: 'striped',
      headStyles: { fillColor: primary },
      styles: { fontSize: 7 },
      columnStyles: Object.fromEntries(
        Array.from({ length: head[0].length }, (_, i) => [i, { halign: i === 0 ? 'center' : 'right' }])
      ),
    });

    const legalY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(7);
    doc.setTextColor('#888');
    doc.text('Simulación con fines informativos. Sujeta a aprobación crediticia. Tasas reguladas por JPRF (Res. 646-2023-F).', 14, legalY);
    doc.text('SOLCA: COMF Disposición General 14ª. Desgravamen: Art. 210 COMF. Incendio: Art. 308 COMF, Art. 68 LGS.', 14, legalY + 4);

    doc.save(`simulacion-credito-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  return { generateCreditPdf };
}
