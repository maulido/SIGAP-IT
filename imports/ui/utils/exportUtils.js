import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Export report data to PDF
 */
export const exportToPDF = (stats, performance, filters, dateRange) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.setTextColor(99, 102, 241); // Primary color
    doc.text('SIGAP-IT - Laporan Tiket', 14, 20);

    // Date range and filters
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Periode: ${dateRange.start} - ${dateRange.end}`, 14, 30);

    let yPos = 35;
    if (filters.status && filters.status !== 'All') {
        doc.text(`Status: ${filters.status}`, 14, yPos);
        yPos += 5;
    }
    if (filters.category && filters.category !== 'All') {
        doc.text(`Kategori: ${filters.category}`, 14, yPos);
        yPos += 5;
    }
    if (filters.priority && filters.priority !== 'All') {
        doc.text(`Prioritas: ${filters.priority}`, 14, yPos);
        yPos += 5;
    }

    yPos += 5;

    // Statistics Summary
    doc.setFontSize(14);
    doc.setTextColor(99, 102, 241);
    doc.text('Ringkasan Statistik', 14, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const statsData = [
        ['Total Tiket', stats.totalTickets.toString()],
        ['Tiket Selesai', `${stats.resolvedCount} (${stats.resolvedPercentage}%)`],
        ['SLA Terpenuhi', `${stats.slaMetCount} (${stats.slaPercentage}%)`],
        ['Rata-rata Waktu Penyelesaian', `${stats.avgResolutionTime} jam`],
    ];

    doc.autoTable({
        startY: yPos,
        head: [['Metrik', 'Nilai']],
        body: statsData,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] },
        margin: { left: 14 },
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Status Breakdown
    if (stats.statusBreakdown && Object.keys(stats.statusBreakdown).length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(99, 102, 241);
        doc.text('Distribusi Status', 14, yPos);
        yPos += 7;

        const statusData = Object.entries(stats.statusBreakdown).map(([status, count]) => [
            status,
            count.toString(),
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Status', 'Jumlah']],
            body: statusData,
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241] },
            margin: { left: 14 },
        });

        yPos = doc.lastAutoTable.finalY + 10;
    }

    // Add new page for performance data
    if (performance && performance.length > 0) {
        doc.addPage();
        yPos = 20;

        doc.setFontSize(14);
        doc.setTextColor(99, 102, 241);
        doc.text('Kinerja IT Support', 14, yPos);
        yPos += 7;

        const performanceData = performance.map(p => [
            p.name,
            p.assigned.toString(),
            p.resolved.toString(),
            p.active.toString(),
            `${p.avgResolutionTime} jam`,
            `${p.slaPercentage}%`,
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Nama', 'Ditugaskan', 'Selesai', 'Aktif', 'Rata-rata Waktu', 'SLA %']],
            body: performanceData,
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241] },
            margin: { left: 14 },
            styles: { fontSize: 8 },
        });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
            `Halaman ${i} dari ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
        doc.text(
            `Dibuat: ${new Date().toLocaleString('id-ID')}`,
            14,
            doc.internal.pageSize.height - 10
        );
    }

    // Save PDF
    const filename = `SIGAP-IT_Laporan_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
};

/**
 * Export report data to Excel
 */
export const exportToExcel = (stats, performance, tickets, dateRange) => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Statistics Summary
    const statsData = [
        ['SIGAP-IT - Laporan Tiket'],
        [`Periode: ${dateRange.start} - ${dateRange.end}`],
        [],
        ['Ringkasan Statistik'],
        ['Metrik', 'Nilai'],
        ['Total Tiket', stats.totalTickets],
        ['Tiket Selesai', `${stats.resolvedCount} (${stats.resolvedPercentage}%)`],
        ['SLA Terpenuhi', `${stats.slaMetCount} (${stats.slaPercentage}%)`],
        ['Rata-rata Waktu Penyelesaian', `${stats.avgResolutionTime} jam`],
        [],
        ['Distribusi Status'],
        ['Status', 'Jumlah'],
    ];

    if (stats.statusBreakdown) {
        Object.entries(stats.statusBreakdown).forEach(([status, count]) => {
            statsData.push([status, count]);
        });
    }

    statsData.push([]);
    statsData.push(['Distribusi Kategori']);
    statsData.push(['Kategori', 'Jumlah']);

    if (stats.categoryBreakdown) {
        Object.entries(stats.categoryBreakdown).forEach(([category, count]) => {
            statsData.push([category, count]);
        });
    }

    statsData.push([]);
    statsData.push(['Distribusi Prioritas']);
    statsData.push(['Prioritas', 'Jumlah']);

    if (stats.priorityBreakdown) {
        Object.entries(stats.priorityBreakdown).forEach(([priority, count]) => {
            statsData.push([priority, count]);
        });
    }

    const ws1 = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan');

    // Sheet 2: IT Support Performance
    if (performance && performance.length > 0) {
        const perfData = [
            ['Kinerja IT Support'],
            [`Periode: ${dateRange.start} - ${dateRange.end}`],
            [],
            ['Nama', 'Email', 'Ditugaskan', 'Selesai', 'Aktif', 'Rata-rata Waktu (jam)', 'SLA %'],
        ];

        performance.forEach(p => {
            perfData.push([
                p.name,
                p.email,
                p.assigned,
                p.resolved,
                p.active,
                p.avgResolutionTime,
                p.slaPercentage,
            ]);
        });

        const ws2 = XLSX.utils.aoa_to_sheet(perfData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Kinerja IT Support');
    }

    // Sheet 3: Detailed Tickets (if provided)
    if (tickets && tickets.length > 0) {
        const ticketData = [
            ['Daftar Tiket Detail'],
            [`Periode: ${dateRange.start} - ${dateRange.end}`],
            [],
            ['No Tiket', 'Judul', 'Status', 'Prioritas', 'Kategori', 'Pelapor', 'Ditugaskan', 'Dibuat', 'Selesai'],
        ];

        tickets.forEach(t => {
            ticketData.push([
                t.ticketNumber,
                t.title,
                t.status,
                t.priority,
                t.category,
                t.reporterName,
                t.assignedToName || 'Belum ditugaskan',
                new Date(t.createdAt).toLocaleString('id-ID'),
                t.resolvedAt ? new Date(t.resolvedAt).toLocaleString('id-ID') : '-',
            ]);
        });

        const ws3 = XLSX.utils.aoa_to_sheet(ticketData);
        XLSX.utils.book_append_sheet(wb, ws3, 'Daftar Tiket');
    }

    // Save Excel file
    const filename = `SIGAP-IT_Laporan_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
};
