import { BarChart3, FileText } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { JournalResult } from '../components/report/JournalResult';
import { LedgerResult } from '../components/report/LedgerResult';
import { MonthlyChartPanel } from '../components/report/MonthlyChartPanel';
import { TrialBalanceResult } from '../components/report/TrialBalanceResult';
import { Button } from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';
import { generateSummary } from '../services/api';
import type { JournalResponse, LedgerResponse, SummaryRequest, Transaction, TrialBalanceResponse } from '../types';

type ReportType = 'trial_balance' | 'ledger' | 'journal' | 'monthly_chart';

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
    const [journalData, setJournalData] = useState<JournalResponse | null>(null);
    const [monthlyChartData, setMonthlyChartData] = useState<JournalResponse | null>(null);
    const { showToast } = useToast();
    const navigate = useNavigate();

    // 生成报表
    const handleGenerateReport = async () => {
        if (!dateFrom || !dateTo) {
            showToast('error', '请选择日期范围');
            return;
        }

        setLoading(true);
        setTrialBalanceData(null);
        setLedgerData(null);
        setJournalData(null);
        setMonthlyChartData(null);

        try {
            // summary_type: 1=総勘定元帳, 2=試算表, 3=仕訳帳
            // 月度统计图表使用仕訳帳的数据
            let summaryType: 1 | 2 | 3;
            if (reportType === 'trial_balance') {
                summaryType = 2;
            } else if (reportType === 'journal' || reportType === 'monthly_chart') {
                summaryType = 3;
            } else {
                summaryType = 1;
            }
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
                } else if (reportType === 'ledger') {
                    setLedgerData(result.detail as LedgerResponse);
                    showToast('success', '総勘定元帳 生成成功');
                } else if (reportType === 'journal') {
                    setJournalData(result.detail as JournalResponse);
                    showToast('success', '仕訳帳 生成成功');
                } else if (reportType === 'monthly_chart') {
                    setMonthlyChartData(result.detail as JournalResponse);
                    showToast('success', '月度统计图表 生成成功');
                }
            } else {
                // 检查是否是 "Has initialized records" 错误
                if (result.message?.includes('initialized records') && Array.isArray(result.detail)) {
                    const uninitializedTransactions = result.detail as Transaction[];
                    showToast('warning', `日期范围内有 ${uninitializedTransactions.length} 条账目未进行 AI 仕訳，正在跳转...`);

                    // 延迟后跳转到 DashboardPage，带上这些账目数据
                    setTimeout(() => {
                        navigate('/transactions', {
                            state: {
                                preloadedTransactions: uninitializedTransactions,
                                filterType: 'uninitialized',
                                isSearchResult: true
                            }
                        });
                    }, 1000);
                } else {
                    throw new Error(result.message || '生成失败');
                }
            }
        } catch (error) {
            console.error('Report generation error:', error);
            showToast('error', '报表生成失败');
        } finally {
            setLoading(false);
        }
    };

    // 快速设置日期范围
    const setQuickDateRange = (months: number) => {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
        setDateFrom(from.toISOString().split('T')[0]);
        setDateTo(now.toISOString().split('T')[0]);
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
        },
        {
            value: 'journal' as const,
            label: '仕訳帳',
            description: '一般记账本，显示所有交易记录'
        },
        {
            value: 'monthly_chart' as const,
            label: '月度统计图表',
            description: '按月汇总收支情况，可视化展示'
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
                                {/* 快速选择按钮 */}
                                {reportType === 'monthly_chart' && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <button
                                            type="button"
                                            onClick={() => setQuickDateRange(3)}
                                            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                        >
                                            近3个月
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuickDateRange(6)}
                                            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                        >
                                            近6个月
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuickDateRange(12)}
                                            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                        >
                                            近12个月
                                        </button>
                                    </div>
                                )}
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

                {monthlyChartData && (
                    <MonthlyChartPanel
                        data={monthlyChartData}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                    />
                )}

                {/* 仕訳帳结果 - 使用弹窗 */}
                {journalData && (
                    <JournalResult
                        isOpen={true}
                        data={journalData}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        onClose={() => setJournalData(null)}
                    />
                )}
            </div>
        </Layout>
    );
}
