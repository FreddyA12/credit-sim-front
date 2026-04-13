// @ts-nocheck
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toNumber, formatNumber } from '../utils/number-utils';

function formatMoney(val: number | undefined | string | null) {
  return `$${formatNumber(toNumber(val))}`;
}

function formatTermMonths(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} ${m === 1 ? 'mes' : 'meses'}`;
  if (m === 0) return `${y} ${y === 1 ? 'año' : 'años'}`;
  return `${y} ${y === 1 ? 'año' : 'años'} y ${m} ${m === 1 ? 'mes' : 'meses'}`;
}

export function usePdf() {
  function generateCreditPdf(summary: any, schedule: any[], institution: any, disbursementCharges?: any[], client?: any) {
    const doc = new jsPDF({ orientation: 'landscape' });
    const primary = institution?.primaryColor || '#1A3C6E';
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 10;

    // ===== HEADER CON LOGO Y DATOS =====
    // Agregar logo
    if (institution?.logoUrl) {
      try {
        doc.addImage(institution.logoUrl, 'PNG', 14, currentY, 12, 12);
      } catch (e) {
        // Continuar sin logo
      }
    }

    // Nombre institución
    doc.setFontSize(14);
    doc.setTextColor(primary);
    doc.setFont(undefined, 'bold');
    const instNameText = typeof institution?.name === 'string' ? institution.name : 'Simulador Financiero';
    // @ts-ignore
    doc.text(instNameText, 30, currentY + 4);

    // Información institución
    doc.setFontSize(8);
    doc.setTextColor('#555');
    doc.setFont(undefined, 'normal');
    let infoY = currentY + 8;

    if (typeof institution?.ruc === 'string') {
      // @ts-ignore
      doc.text('RUC: ' + institution.ruc, 30, infoY);
      infoY += 3;
    }
    if (typeof institution?.address === 'string') {
      // @ts-ignore
      doc.text('Dirección: ' + institution.address, 30, infoY);
      infoY += 3;
    }
    if (typeof institution?.phone === 'string') {
      // @ts-ignore
      doc.text('Teléfono: ' + institution.phone, 30, infoY);
      infoY += 3;
    }
    if (typeof institution?.slogan === 'string') {
      doc.setTextColor('#888');
      doc.setFont(undefined, 'italic');
      // @ts-ignore
      doc.text(institution.slogan, 30, infoY);
    }

    // Línea separadora
    doc.setDrawColor(primary);
    doc.setLineWidth(1);
    doc.line(14, currentY + 26, pageWidth - 14, currentY + 26);

    currentY = currentY + 32;

    // Datos del cliente
    if (client && (client.name || client.cedula)) {
      doc.setFontSize(10);
      doc.setTextColor('#222');
      doc.setFont(undefined, 'bold');
      doc.text('Datos del solicitante', 14, currentY);

      currentY += 5;

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor('#444');

      if (typeof client.name === 'string') {
        // @ts-ignore
        doc.text('Nombre: ' + client.name, 14, currentY);
        currentY += 4;
      }
      if (typeof client.cedula === 'string') {
        // @ts-ignore
        doc.text('Cédula: ' + client.cedula, 14, currentY);
        currentY += 4;
      }

      doc.setDrawColor('#ddd');
      doc.setLineWidth(0.5);
      doc.line(14, currentY - 6, pageWidth - 14, currentY - 6);
      currentY += 4;
    }

    // ===== MARCA DE AGUA =====
    if (institution?.watermarkUrl) {
      try {
        doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
        doc.addImage(
          institution.watermarkUrl,
          'PNG',
          pageWidth / 2 - 30,
          pageWidth / 2 - 30,
          60,
          60
        );
        doc.setGState(new (doc as any).GState({ opacity: 1 }));
      } catch (e) {
        // Continuar sin marca de agua
      }
    }

    // ===== CONTENIDO PRINCIPAL =====
    doc.setFontSize(12);
    doc.setTextColor('#222');
    doc.text('Resumen del crédito', 14, currentY);
    currentY += 6;

    const summaryBody: string[][] = [
      ['Monto del crédito', formatMoney(summary.loanAmount)],
      ['Tasa de interés anual', `${summary.annualRatePct}%`],
      ['Plazo', `${summary.termMonths} meses (${formatTermMonths(summary.termMonths)})`],
      ['Sistema de amortización', summary.amortizationSystem === 'french' ? 'Francés (cuota fija)' : 'Alemán (capital fijo)'],
      [summary.amortizationSystem === 'french' ? 'Cuota mensual' : 'Primera cuota', formatMoney(summary.firstInstallment)],
      ['Última cuota', formatMoney(summary.lastInstallment)],
      ['Total interés', formatMoney(summary.totalInterest)],
      ['SOLCA (0.5% — COMF Disp. Gral. 14ª)', formatMoney(summary.totalSolca)],
      ...(summary.netDisbursement != null ? [['Usted recibe (neto al desembolso)', formatMoney(summary.netDisbursement)]] : []),
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
      startY: currentY,
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

    const totalDisbursementCharges = disbursementCharges
      ? disbursementCharges.reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0)
      : 0;
    const initialBalance = schedule.length > 0
      ? schedule[0].balance + schedule[0].principal
      : summary.loanAmount - totalDisbursementCharges;

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

  function generateInvestmentPdf(simulation: any, institution: any) {
    const doc = new jsPDF();
    const primary = institution?.primaryColor || '#1A3C6E';

    doc.setFontSize(18);
    doc.setTextColor(primary);
    doc.text(institution?.name || 'Simulador Financiero', 14, 16);

    doc.setFontSize(10);
    doc.setTextColor('#555');
    doc.text('Simulación de Inversión — Depósito a Plazo Fijo', 14, 23);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-EC')}`, 14, 29);

    if (institution?.slogan) {
      doc.setFontSize(9);
      doc.setTextColor('#888');
      doc.text(institution.slogan, 14, 35);
    }

    doc.setFontSize(12);
    doc.setTextColor('#222');
    doc.text('Detalle de la inversión', 14, 44);

    autoTable(doc, {
      startY: 48,
      head: [['Concepto', 'Valor']],
      body: [
        ['Monto invertido', formatMoney(simulation.amount)],
        ['Tasa de interés anual', `${simulation.annualRate}%`],
        ['Plazo', `${simulation.termDays} días`],
        ['Interés bruto', formatMoney(simulation.grossInterest)],
        ['Retención IR (2% — LRTI Art. 37)', formatMoney(simulation.irWithholding)],
        ['Interés neto', formatMoney(simulation.netInterest)],
        ['Monto al vencimiento', formatMoney(simulation.amountAtMaturity)],
      ],
      theme: 'grid',
      headStyles: { fillColor: primary },
      columnStyles: { 1: { halign: 'right' } },
    });

    const legalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(7);
    doc.setTextColor('#888');
    doc.text('Retención del 2% sobre rendimientos financieros (LRTI Art. 37, Regl. Art. 131). Simulación informativa.', 14, legalY);
    doc.text('COSEDE garantiza depósitos hasta el límite vigente (Art. 330 COMF).', 14, legalY + 4);

    doc.save(`simulacion-inversion-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // Generar PDF de tabla como Blob para subir al servidor
  function generateCreditPdfBlob(summary: any, schedule: any[], institution: any, disbursementCharges?: any[], client?: any): Promise<Blob> {
    return new Promise((resolve) => {
      const doc = new jsPDF({ orientation: 'landscape' });
      const primary = institution?.primaryColor || '#1A3C6E';
      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = 10;

      // ===== HEADER CON LOGO Y DATOS =====
      // Agregar logo
      if (institution?.logoUrl) {
        try {
          doc.addImage(institution.logoUrl, 'PNG', 14, currentY, 12, 12);
        } catch (e) {
          // Continuar sin logo
        }
      }

      // Nombre institución
      doc.setFontSize(14);
      doc.setTextColor(primary);
      doc.setFont(undefined, 'bold');
      const instNameText2 = typeof institution?.name === 'string' ? institution.name : 'Simulador Financiero';
      // @ts-ignore
      doc.text(instNameText2, 30, currentY + 4);

      // Información institución
      doc.setFontSize(8);
      doc.setTextColor('#555');
      doc.setFont(undefined, 'normal');
      let infoY2 = currentY + 8;

      if (typeof institution?.ruc === 'string') {
        // @ts-ignore
        doc.text('RUC: ' + institution.ruc, 30, infoY2);
        infoY2 += 3;
      }
      if (typeof institution?.address === 'string') {
        // @ts-ignore
        doc.text('Dirección: ' + institution.address, 30, infoY2);
        infoY2 += 3;
      }
      if (typeof institution?.phone === 'string') {
        // @ts-ignore
        doc.text('Teléfono: ' + institution.phone, 30, infoY2);
        infoY2 += 3;
      }
      if (typeof institution?.slogan === 'string') {
        doc.setTextColor('#888');
        doc.setFont(undefined, 'italic');
        // @ts-ignore
        doc.text(institution.slogan, 30, infoY2);
      }

      // Línea separadora
      doc.setDrawColor(primary);
      doc.setLineWidth(1);
      doc.line(14, currentY + 26, pageWidth - 14, currentY + 26);

      currentY = currentY + 32;

      // Datos del cliente
      if (client && (client.name || client.cedula)) {
        doc.setFontSize(10);
        doc.setTextColor('#222');
        doc.setFont(undefined, 'bold');
        doc.text('Datos del solicitante', 14, currentY);

        currentY += 5;

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor('#444');

        if (typeof client.name === 'string') {
          // @ts-ignore
          doc.text('Nombre: ' + client.name, 14, currentY);
          currentY += 4;
        }
        if (typeof client.cedula === 'string') {
          // @ts-ignore
          doc.text('Cédula: ' + client.cedula, 14, currentY);
          currentY += 4;
        }

        doc.setDrawColor('#ddd');
        doc.setLineWidth(0.5);
        doc.line(14, currentY - 6, pageWidth - 14, currentY - 6);
        currentY += 4;
      }

      // ===== MARCA DE AGUA =====
      if (institution?.watermarkUrl) {
        try {
          doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
          doc.addImage(
            institution.watermarkUrl,
            'PNG',
            pageWidth / 2 - 30,
            pageWidth / 2 - 30,
            60,
            60
          );
          doc.setGState(new (doc as any).GState({ opacity: 1 }));
        } catch (e) {
          // Continuar sin marca de agua
        }
      }

      // ===== CONTENIDO PRINCIPAL =====
      doc.setFontSize(12);
      doc.setTextColor('#222');
      doc.text('Resumen del crédito', 14, currentY);
      currentY += 6;

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
        startY: currentY,
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

      const totalDisbursementCharges = disbursementCharges
        ? disbursementCharges.reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0)
        : 0;
      const initialBalance = schedule.length > 0
        ? schedule[0].balance + schedule[0].principal
        : summary.loanAmount - totalDisbursementCharges;

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

      const blob = doc.output('blob') as Blob;
      resolve(blob);
    });
  }

  return { generateCreditPdf, generateCreditPdfBlob, generateInvestmentPdf };
}
