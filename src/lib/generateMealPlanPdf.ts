import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { MealPlan } from '../types/database'

// Cores da identidade visual do NutriPlano AI (mesmos tokens do Tailwind)
const COLORS = {
  ink: [22, 35, 28] as [number, number, number],
  inkSoft: [74, 90, 80] as [number, number, number],
  primary: [31, 77, 58] as [number, number, number],
  primarySoft: [228, 237, 231] as [number, number, number],
  coral: [255, 107, 74] as [number, number, number],
  mango: [244, 185, 66] as [number, number, number],
  line: [221, 228, 220] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
}

const PAGE_MARGIN = 44
const PAGE_WIDTH_MM = 210 // A4

function drawFooter(doc: jsPDF, pageNumber: number) {
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setDrawColor(...COLORS.line)
  doc.line(PAGE_MARGIN / 2.83, pageHeight - 18, PAGE_WIDTH_MM - PAGE_MARGIN / 2.83, pageHeight - 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.inkSoft)
  doc.text(
    'Este plano é educativo e gerado por IA — não substitui acompanhamento de um nutricionista.',
    PAGE_MARGIN / 2.83,
    pageHeight - 12
  )
  doc.text(String(pageNumber), PAGE_WIDTH_MM - PAGE_MARGIN / 2.83, pageHeight - 12, { align: 'right' })
}

export function generateMealPlanPdf(plan: MealPlan, userName?: string): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const marginMm = 15
  const contentWidth = PAGE_WIDTH_MM - marginMm * 2
  let y = 20

  // Cabeçalho de marca
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...COLORS.primary)
  doc.text('NutriPlano AI', marginMm, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.inkSoft)
  doc.text(`Versão ${plan.version} · gerado em ${new Date(plan.created_at).toLocaleDateString('pt-BR')}`, PAGE_WIDTH_MM - marginMm, y, {
    align: 'right',
  })

  y += 4
  doc.setDrawColor(...COLORS.line)
  doc.line(marginMm, y, PAGE_WIDTH_MM - marginMm, y)
  y += 10

  if (userName) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...COLORS.ink)
    doc.text(`Plano alimentar de ${userName}`, marginMm, y)
    y += 10
  }

  // Bloco de resumo (calorias + macros)
  const { summary, meals, recommendations } = plan.content
  const summaryBoxHeight = 26
  doc.setFillColor(...COLORS.primarySoft)
  doc.roundedRect(marginMm, y, contentWidth, summaryBoxHeight, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...COLORS.primary)
  doc.text(`${summary.dailyCalories} kcal/dia`, marginMm + 6, y + 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.ink)
  const macrosLine = `Proteína ${summary.macros.protein}g   ·   Carboidratos ${summary.macros.carbs}g   ·   Gordura ${summary.macros.fat}g`
  doc.text(macrosLine, marginMm + 6, y + 19)

  y += summaryBoxHeight + 8

  if (summary.notes) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.inkSoft)
    const noteLines = doc.splitTextToSize(summary.notes, contentWidth)
    doc.text(noteLines, marginMm, y)
    y += noteLines.length * 4.2 + 6
  }

  // Uma tabela por refeição
  for (const meal of meals) {
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...COLORS.ink)
    doc.text(meal.name, marginMm, y)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.coral)
    doc.text(meal.time, PAGE_WIDTH_MM - marginMm, y, { align: 'right' })

    y += 4

    autoTable(doc, {
      startY: y,
      margin: { left: marginMm, right: marginMm },
      head: [['Alimento', 'Quantidade', 'Kcal']],
      body: meal.items.map((item) => [
        item.food,
        item.quantity,
        item.calories ? String(item.calories) : '-',
      ]),
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 9.5,
        textColor: COLORS.ink,
        cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
        lineColor: COLORS.line,
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: { fillColor: [250, 250, 248] },
      columnStyles: {
        2: { halign: 'right', cellWidth: 20 },
        1: { cellWidth: 45 },
      },
    })

    // deno-lint-ignore no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 3

    if (meal.totalCalories) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...COLORS.inkSoft)
      doc.text(`Total: ${meal.totalCalories} kcal`, PAGE_WIDTH_MM - marginMm, y, { align: 'right' })
      y += 4
    }

    y += 6
  }

  // Recomendações
  if (recommendations && recommendations.length > 0) {
    if (y > 240) {
      doc.addPage()
      y = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...COLORS.primary)
    doc.text('Recomendações', marginMm, y)
    y += 7

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...COLORS.ink)

    for (const rec of recommendations) {
      const lines = doc.splitTextToSize(`•  ${rec}`, contentWidth)
      if (y + lines.length * 4.5 > 250) {
        doc.addPage()
        y = 20
      }
      doc.text(lines, marginMm, y)
      y += lines.length * 4.5 + 2
    }
  }

  // Rodapé com aviso legal em todas as páginas
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    drawFooter(doc, i)
  }

  doc.save(`nutriplano-ai-plano-v${plan.version}.pdf`)
}
