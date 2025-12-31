import { saveAs } from 'file-saver';
import { ChevronDown, Download, FileText } from 'lucide-react';
import { useRef, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import type { JournalRecord } from '../../types';
import { generateJournalRecordsPDF } from '../../utils/pdfGenerator';
import { Button } from '../ui/Button';
import { PDFExportModal } from '../ui/PDFExportModal';

interface JournalExportButtonProps {
    records: JournalRecord[];
    dateFrom: string;
    dateTo: string;
    disabled?: boolean;
}

export function JournalExportButton({ records, dateFrom, dateTo, disabled = false }: JournalExportButtonProps) {
    const { showToast } = useToast();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showPDFModal, setShowPDFModal] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 导出 CSV
    const handleExportCSV = () => {
        if (records.length === 0) return;

        // Define CSV headers - 使用日文表示（不包含記帳日時和更新日時）
        const headers = [
            '日付',
            '備考',
            '借方科目',
            '借方金額',
            '借方税額',
            '貸方科目',
            '貸方金額',
            '貸方税額'
        ];

        // Convert records to CSV rows
        const rows = records.map(r => [
            r.transaction_date?.split('T')[0] || '',
            `"${(r.description || '').replace(/"/g, '""')}"`,
            r.debit_item || '',
            r.debit_amount || '',
            r.debit_ct || '',
            r.credit_item || '',
            r.credit_amount || '',
            r.credit_ct || ''
        ]);

        // Create CSV content with BOM for Excel compatibility
        const BOM = '\uFEFF';
        const csvContent = BOM + [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `仕訳帳_${dateFrom}_${dateTo}.csv`);

        setShowDropdown(false);
        showToast('success', 'CSV 导出成功');
    };

    // 导出 PDF
    const handleExportPDF = async (companyName: string) => {
        if (records.length === 0) return;

        setPdfLoading(true);
        try {
            const blob = await generateJournalRecordsPDF(records, companyName, dateFrom, dateTo);
            saveAs(blob, `仕訳帳_${dateFrom}_${dateTo}.pdf`);
            setShowPDFModal(false);
            showToast('success', 'PDF 导出成功');
        } catch (error) {
            console.error('PDF export error:', error);
            showToast('error', 'PDF 导出失败');
        } finally {
            setPdfLoading(false);
        }
    };

    // 点击外部关闭下拉菜单
    const handleClickOutside = (e: React.MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
            setShowDropdown(false);
        }
    };

    return (
        <>
            <div className="relative" ref={dropdownRef}>
                <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setShowDropdown(!showDropdown)}
                    disabled={disabled || records.length === 0}
                    icon={<Download className="w-5 h-5" />}
                >
                    导出仕訳帳
                    <ChevronDown className="w-4 h-4 ml-1" />
                </Button>

                {showDropdown && (
                    <div
                        className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                        onClick={handleClickOutside}
                    >
                        <button
                            onClick={handleExportCSV}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <Download className="w-4 h-4" />
                            导出 CSV
                        </button>
                        <button
                            onClick={() => {
                                setShowDropdown(false);
                                setShowPDFModal(true);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <FileText className="w-4 h-4" />
                            导出 PDF
                        </button>
                    </div>
                )}
            </div>

            <PDFExportModal
                isOpen={showPDFModal}
                onClose={() => setShowPDFModal(false)}
                onExport={handleExportPDF}
                title="导出仕訳帳 PDF"
                loading={pdfLoading}
            />
        </>
    );
}
