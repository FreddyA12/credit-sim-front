import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface InvestmentPdfPayload {
  summary: {
    amount?: number;
    annualRate?: number;
    termDays?: number;
    grossInterest?: number;
    irWithholding?: number;
    netInterest?: number;
    amountAtMaturity?: number;
  };
  projectionTable?: Array<{
    period?: number;
    accumulatedDays?: number;
    grossInterest?: number;
    irWithholding?: number;
    netInterest?: number;
    totalAtMaturity?: number | null;
  }>;
  productName?: string | null;
  paymentLabel?: string | null;
}

function formatMoney(val: number | undefined) {
  return `$${(val ?? 0).toFixed(2)}`;
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '').trim();
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return [26, 60, 110];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixWithWhite(hex: string, amount: number): [number, number, number] {
  const [r, g, b] = parseHex(hex);
  const t = Math.min(1, Math.max(0, amount));
  return [
    Math.round(r * t + 255 * (1 - t)),
    Math.round(g * t + 255 * (1 - t)),
    Math.round(b * t + 255 * (1 - t)),
  ];
}

function resolveAssetUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  return url;
}

async function loadImageDataUrl(url: string): Promise<{ dataUrl: string; format: 'JPEG' | 'PNG' | 'WEBP' } | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const t = blob.type || '';
    let format: 'JPEG' | 'PNG' | 'WEBP' = 'PNG';
    if (t.includes('jpeg') || t.includes('jpg')) format = 'JPEG';
    else if (t.includes('webp')) format = 'WEBP';
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return { dataUrl, format };
  } catch {
    return null;
  }
}

export function useInvestmentPdf() {
  async function generateInvestmentPdf(payload: InvestmentPdfPayload, institution: any) {
    const simulation = payload.summary;
    const projectionTable = payload.projectionTable ?? [];
    const productName = payload.productName?.trim() || '—';
    const paymentLabel = payload.paymentLabel?.trim() || '—';

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 18;
    const primary = institution?.primaryColor || '#1A3C6E';
    const [pr, pg, pb] = parseHex(primary);
    const headFill = mixWithWhite(primary, 0.1);
    const textMuted: [number, number, number] = [107, 114, 128];
    const textBody: [number, number, number] = [55, 65, 81];
    const lineSoft: [number, number, number] = [229, 231, 235];

    const tableBase = {
      theme: 'striped' as const,
      styles: {
        font: 'helvetica' as const,
        fontSize: 8.5,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
        textColor: textBody,
        lineColor: lineSoft,
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: headFill,
        textColor: [pr, pg, pb] as [number, number, number],
        fontStyle: 'bold' as const,
        fontSize: 8,
        cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
      },
      alternateRowStyles: {
        fillColor: [252, 252, 253] as [number, number, number],
      },
    };

    const displayName =
      institution?.legalName ||
      institution?.commercialName ||
      institution?.name ||
      'Institución financiera';

    let cursorY = margin;

    const logoUrl = resolveAssetUrl(institution?.logoUrl);
    let logoRight = margin;
    if (logoUrl) {
      const loaded = await loadImageDataUrl(logoUrl);
      if (loaded) {
        try {
          const props = doc.getImageProperties(loaded.dataUrl);
          const maxW = 42;
          const maxH = 14;
          let w = maxW;
          let h = (props.height * w) / props.width;
          if (h > maxH) {
            h = maxH;
            w = (props.width * h) / props.height;
          }
          doc.addImage(loaded.dataUrl, loaded.format, margin, cursorY - 2, w, h);
          logoRight = margin + w + 6;
        } catch {
          logoRight = margin;
        }
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(textBody[0], textBody[1], textBody[2]);
    doc.text(displayName, logoRight, cursorY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Simulación de inversión · Depósito a plazo fijo', logoRight, cursorY + 9);

    const dateStr = new Date().toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    doc.setFontSize(8);
    doc.text(`Emisión: ${dateStr}`, logoRight, cursorY + 14);

    cursorY = Math.max(cursorY + 18, margin + 14);

    doc.setDrawColor(pr, pg, pb);
    doc.setLineWidth(0.35);
    doc.line(margin, cursorY, pageW - margin, cursorY);
    cursorY += 7;

    function sectionTitle(title: string) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(textBody[0], textBody[1], textBody[2]);
      doc.text(title, margin, cursorY);
      cursorY += 5;
    }

    sectionTitle('Contexto de la simulación');
    autoTable(doc, {
      ...tableBase,
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [['Concepto', 'Valor']],
      body: [
        ['Producto', productName],
        ['Monto invertido (USD)', formatMoney(simulation.amount)],
        ['Plazo', `${simulation.termDays ?? '—'} días`],
        ['Tasa de interés anual', simulation.annualRate != null ? `${simulation.annualRate}%` : '—'],
        ['Pago de intereses', paymentLabel],
      ],
      columnStyles: {
        0: { cellWidth: 72 },
        1: { halign: 'right' as const },
      },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 8;

    sectionTitle('Indicadores principales');
    autoTable(doc, {
      ...tableBase,
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [['Interés bruto', 'Retención IR', 'Interés neto', 'Monto al vencimiento']],
      body: [
        [
          formatMoney(simulation.grossInterest),
          formatMoney(simulation.irWithholding),
          formatMoney(simulation.netInterest),
          formatMoney(simulation.amountAtMaturity),
        ],
      ],
      styles: { ...tableBase.styles, fontSize: 8.5, halign: 'right' as const },
      headStyles: { ...tableBase.headStyles, halign: 'center' as const },
      columnStyles: {
        0: { halign: 'right' as const },
        1: { halign: 'right' as const },
        2: { halign: 'right' as const },
        3: { halign: 'right' as const },
      },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 8;

    sectionTitle('Resumen de la inversión');
    autoTable(doc, {
      ...tableBase,
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [['Concepto', 'Valor']],
      body: [
        ['Monto invertido', formatMoney(simulation.amount)],
        ['Tasa de interés anual', simulation.annualRate != null ? `${simulation.annualRate}%` : '—'],
        ['Plazo', `${simulation.termDays ?? '—'} días`],
        ['Pago de intereses', paymentLabel],
        ['Interés bruto', formatMoney(simulation.grossInterest)],
        ['Retención IR (2% — LRTI Art. 37)', formatMoney(simulation.irWithholding)],
        ['Interés neto', formatMoney(simulation.netInterest)],
        ['Monto al vencimiento', formatMoney(simulation.amountAtMaturity)],
      ],
      columnStyles: {
        0: { fontStyle: 'normal' as const },
        1: { halign: 'right' as const, cellWidth: 46 },
      },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    const notePeriodicidad = doc.splitTextToSize(
      'Los intereses se acreditan según la periodicidad del producto (mensual, trimestral, al vencimiento, etc.). La retención del 2% se aplica sobre los rendimientos según la normativa vigente.',
      pageW - margin * 2,
    );
    doc.text(notePeriodicidad, margin, cursorY);
    cursorY += notePeriodicidad.length * 3.1 + 6;

    if (projectionTable.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(textBody[0], textBody[1], textBody[2]);
      doc.text('Proyección período a período', margin, cursorY);
      cursorY += 5;

      const projBody = projectionTable.map((row) => [
        String(row.period ?? ''),
        String(row.accumulatedDays ?? ''),
        formatMoney(row.grossInterest),
        formatMoney(row.irWithholding),
        formatMoney(row.netInterest),
        row.totalAtMaturity != null && Number(row.totalAtMaturity)
          ? formatMoney(Number(row.totalAtMaturity))
          : '—',
      ]);

      autoTable(doc, {
        ...tableBase,
        startY: cursorY,
        margin: { left: margin, right: margin },
        head: [['Período', 'Días acum.', 'Int. bruto', 'Ret. IR', 'Int. neto', 'Total venc.']],
        body: projBody,
        styles: {
          ...tableBase.styles,
          fontSize: 7,
          cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
        },
        headStyles: {
          ...tableBase.headStyles,
          fontSize: 6.5,
          cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
        },
        columnStyles: {
          0: { halign: 'center' as const, cellWidth: 14 },
          1: { halign: 'center' as const, cellWidth: 18 },
          2: { halign: 'right' as const },
          3: { halign: 'right' as const },
          4: { halign: 'right' as const },
          5: { halign: 'right' as const },
        },
      });
      cursorY = (doc as any).lastAutoTable.finalY + 6;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    const legalLines = [
      'Retención del 2% sobre rendimientos financieros (LRTI Art. 37, Regl. Art. 131). Documento informativo, no constituye oferta vinculante.',
      'COSEDE garantiza depósitos hasta el límite vigente (Art. 330 COMF).',
    ];
    const legalBlockH = 14;
    if (cursorY + legalBlockH > pageH - 28) {
      doc.addPage();
      cursorY = margin;
    }
    let ly = cursorY;
    for (const line of legalLines) {
      const split = doc.splitTextToSize(line, pageW - margin * 2);
      doc.text(split, margin, ly);
      ly += split.length * 3.2;
    }

    const lastPageH = doc.internal.pageSize.getHeight();
    const footerTop = lastPageH - 24;
    doc.setDrawColor(lineSoft[0], lineSoft[1], lineSoft[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, footerTop, pageW - margin, footerTop);

    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.setFont('helvetica', 'normal');

    const bankLines: string[] = [];
    bankLines.push(displayName);
    if (institution?.ruc) bankLines.push(`RUC: ${institution.ruc}`);
    const contact: string[] = [];
    if (institution?.address) contact.push(institution.address);
    if (institution?.phone) contact.push(`Tel. ${institution.phone}`);
    if (institution?.email) contact.push(institution.email);
    if (contact.length) bankLines.push(contact.join(' · '));
    if (institution?.website) bankLines.push(String(institution.website).replace(/^https?:\/\//i, ''));

    let fy = footerTop + 4;
    for (const raw of bankLines) {
      const parts = doc.splitTextToSize(raw, pageW - margin * 2);
      doc.text(parts, margin, fy);
      fy += parts.length * 3.4;
    }
    if (institution?.slogan) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      const sg = doc.splitTextToSize(String(institution.slogan), pageW - margin * 2);
      doc.text(sg, margin, fy + 1);
    }

    doc.save(`simulacion-inversion-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  return { generateInvestmentPdf };
}
