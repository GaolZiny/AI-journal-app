import { BarChart3, FileText } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { LedgerResult } from '../components/report/LedgerResult';
import { TrialBalanceResult } from '../components/report/TrialBalanceResult';
import { Button } from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';
import { generateSummary } from '../services/api';
import type { LedgerResponse, SummaryRequest, TrialBalanceResponse } from '../types';

type ReportType = 'trial_balance' | 'ledger';

export function ReportsPage() {
    const location = useLocation();
    const initialReportType = (location.state as { reportType?: ReportType })?.reportType || 'trial_balance';

    const [reportType, setReportType] = useState<ReportType>(initialReportType);
    const [dateFrom, setDateFrom] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-01-01`;
    });
    const [dateTo, setDateTo] = useState(() => {
        const now = new Date();
        return now.toISOString().split('T')[0];
    });
    const [loading, setLoading] = useState(false);
    const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceResponse | null>(null);
    const [ledgerData, setLedgerData] = useState<LedgerResponse | null>(null);
    const { showToast } = useToast();

    // 生成报表
    const handleGenerateReport = async () => {
        if (!dateFrom || !dateTo) {
            showToast('error', '请选择日期范围');
            return;
        }

        setLoading(true);
        setTrialBalanceData(null);
        setLedgerData(null);

        try {
            // summary_type: 1=総勘定元帳, 2=試算表
            const summaryType: 1 | 2 = reportType === 'trial_balance' ? 2 : 1;
            const params: SummaryRequest = {
                summary_type: summaryType,
                date_from: dateFrom,
                date_to: dateTo
            };

            const result = await generateSummary(params);

            if (result.status === 'successed' && result.detail) {
                if (reportType === 'trial_balance') {
                    setTrialBalanceData(result.detail as TrialBalanceResponse);
                    showToast('success', '試算表 生成成功');
                } else {
                    setLedgerData(result.detail as LedgerResponse);
                    showToast('success', '総勘定元帳 生成成功');
                }
            } else {
                throw new Error(result.message || '生成失败');
            }
        } catch (error) {
            console.error('Report generation error:', error);
            showToast('error', '报表生成失败');
        } finally {
            setLoading(false);
        }
    };

    const reportTypes = [
        {
            value: 'trial_balance' as const,
            label: '試算表',
            description: '显示各科目的借贷合计和余额'
        },
        {
            value: 'ledger' as const,
            label: '総勘定元帳',
            description: '按科目显示所有交易明细'
        }
    ];

    return (
        <Layout>
            <div className="space-y-6">
                {/* 标题 */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">报表中心</h1>
                </div>

                {/* 报表设置区域 */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 报表类型选择 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                报表类型
                            </label>
                            <div className="space-y-3">
                                {reportTypes.map((type) => (
                                    <label
                                        key={type.value}
                                        className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${reportType === type.value
                                            ? 'border-sky-500 bg-sky-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="reportType"
                                            value={type.value}
                                            checked={reportType === type.value}
                                            onChange={(e) => setReportType(e.target.value as ReportType)}
                                            className="mt-1 w-4 h-4 text-sky-600 focus:ring-sky-500"
                                        />
                                        <div>
                                            <span className="font-medium text-gray-900">{type.label}</span>
                                            <p className="text-sm text-gray-500 mt-0.5">{type.description}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 日期范围选择 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                日期范围
                            </label>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">开始日期</label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">结束日期</label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 生成按钮 */}
                    <div className="mt-6 flex justify-end">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleGenerateReport}
                            loading={loading}
                            icon={<FileText className="w-5 h-5" />}
                        >
                            生成报表
                        </Button>
                    </div>
                </div>

                {/* 报表结果区域 */}
                {trialBalanceData && (
                    <TrialBalanceResult
                        isOpen={true}
                        data={trialBalanceData}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        onClose={() => setTrialBalanceData(null)}
                    />
                )}

                {ledgerData && (
                    <LedgerResult
                        isOpen={true}
                        data={ledgerData}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        onClose={() => setLedgerData(null)}
                    />
                )}
            </div>
        </Layout>
    );
}
