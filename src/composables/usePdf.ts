import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function usePdf() {
  function generateCreditPdf(summary: any, schedule: any[], institution: any) {
    const doc = new jsPDF();
    const primary = institution?.primaryColor || '#1A3C6E';

    doc.setFontSize(16);
    doc.setTextColor(primary);
    doc.text(institution?.name || 'Simulador Financiero', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor('#555');
    doc.text('Tabla de Amortización — Simulación de Crédito', 14, 26);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-EC')}`, 14, 32);

    doc.setFontSize(11);
    doc.setTextColor('#222');
    doc.text('Resumen del crédito', 14, 42);
    autoTable(doc, {
      startY: 46,
      head: [['Concepto', 'Valor']],
      body: [
        ['Monto del crédito', `$${summary.loanAmount?.toFixed(2)}`],
        ['Tasa de interés anual', `${summary.annualRatePct}%`],
        ['Plazo', `${summary.termMonths} meses`],
        ['Sistema de amortización', summary.amortizationSystem === 'french' ? 'Francés (cuota fija)' : 'Alemán (capital fijo)'],
        ['Primera cuota', `$${summary.firstInstallment?.toFixed(2)}`],
        ['Total interés', `$${summary.totalInterest?.toFixed(2)}`],
        ['SOLCA (0.5%)', `$${summary.totalSolca?.toFixed(2)}`],
        ['Total a pagar', `$${summary.totalCreditCost?.toFixed(2)}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: primary },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.text('Tabla de amortización', 14, finalY);

    const hasAdditional = schedule.some((r) => (r.totalAdditionalCharges ?? 0) > 0);
    const head = hasAdditional
      ? [['#', 'Capital', 'Interés', 'Cargos', 'Cuota total', 'Saldo']]
      : [['#', 'Capital', 'Interés', 'Cuota', 'Saldo']];
    const body = schedule.map((r) =>
      hasAdditional
        ? [r.number, `$${r.principal?.toFixed(2)}`, `$${r.interest?.toFixed(2)}`, `$${r.totalAdditionalCharges?.toFixed(2)}`, `$${r.totalPayment?.toFixed(2)}`, `$${r.balance?.toFixed(2)}`]
        : [r.number, `$${r.principal?.toFixed(2)}`, `$${r.interest?.toFixed(2)}`, `$${r.totalPayment?.toFixed(2)}`, `$${r.balance?.toFixed(2)}`],
    );

    autoTable(doc, { startY: finalY + 4, head, body, theme: 'striped', headStyles: { fillColor: primary }, styles: { fontSize: 8 } });

    const legalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(7);
    doc.setTextColor('#888');
    doc.text('Simulación con fines informativos. Sujeta a aprobación crediticia. Tasa regulada por JPRF (Res. 646-2023-F).', 14, legalY);
    doc.text('COSEDE garantiza depósitos hasta el límite vigente. Art. 330 COMF.', 14, legalY + 4);

    doc.save('tabla-amortizacion.pdf');
  }

  function generateInvestmentPdf(simulation: any, institution: any) {
    const doc = new jsPDF();
    const primary = institution?.primaryColor || '#1A3C6E';

    doc.setFontSize(16);
    doc.setTextColor(primary);
    doc.text(institution?.name || 'Simulador Financiero', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor('#555');
    doc.text('Simulación de Inversión — Depósito a Plazo Fijo', 14, 26);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-EC')}`, 14, 32);

    autoTable(doc, {
      startY: 40,
      head: [['Concepto', 'Valor']],
      body: [
        ['Monto invertido', `$${simulation.amount?.toFixed(2)}`],
        ['Tasa anual', `${simulation.annualRate}%`],
        ['Plazo', `${simulation.termDays} días`],
        ['Interés bruto', `$${simulation.grossInterest?.toFixed(2)}`],
        ['Retención IR (2% — LRTI Art. 37)', `$${simulation.irWithholding?.toFixed(2)}`],
        ['Interés neto', `$${simulation.netInterest?.toFixed(2)}`],
        ['Monto al vencimiento', `$${simulation.amountAtMaturity?.toFixed(2)}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: primary },
    });

    const legalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(7);
    doc.setTextColor('#888');
    doc.text('Retención del 2% sobre rendimientos financieros (LRTI Art. 37). Simulación informativa.', 14, legalY);
    doc.text(`COSEDE garantiza su depósito. Art. 330 COMF.`, 14, legalY + 4);

    doc.save('simulacion-inversion.pdf');
  }

  return { generateCreditPdf, generateInvestmentPdf };
}
