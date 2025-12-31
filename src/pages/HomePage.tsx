import { ArrowRight, ChevronRight, Clock, FileText, Plus, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Loading } from '../components/ui/Loading';
import { useAuth } from '../contexts/AuthContext';
import { queryTransactions } from '../services/api';
import type { Transaction } from '../types';

// 共享的缓存配置（与 DashboardPage 一致）
const CACHE_KEY_PREFIX = 'journal_transactions_';
const CACHE_KEY_UNINITIALIZED_PREFIX = 'journal_uninitialized_';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟

interface CachedData {
    transactions: Transaction[];
    timestamp: number;
}

// 状态标签映射
const STATUS_CONFIG = {
    initialized: {
        label: 'AI未処理',
        className: 'bg-gray-100 text-gray-600'
    },
    journaled: {
        label: 'AI已処理',
        className: 'bg-green-100 text-green-600'
    },
    updated: {
        label: '手动修改',
        className: 'bg-amber-100 text-amber-600'
    }
} as const;

/**
 * 验证交易记录是否有效（非空对象）
 */
function isValidTransaction(tx: unknown): tx is Transaction {
    return (
        tx !== null &&
        typeof tx === 'object' &&
        'id' in tx &&
        typeof (tx as Transaction).id === 'string' &&
        (tx as Transaction).id !== ''
    );
}

export function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // 用户专属的缓存键
    const recentCacheKey = user?.uid ? `${CACHE_KEY_PREFIX}${user.uid}` : null;
    const uninitializedCacheKey = user?.uid ? `${CACHE_KEY_UNINITIALIZED_PREFIX}${user.uid}` : null;

    // 数据状态
    const [uninitializedTransactions, setUninitializedTransactions] = useState<Transaction[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    /**
     * 尝试从 localStorage 读取缓存
     */
    const readFromCache = useCallback((key: string | null): Transaction[] | null => {
        if (!key) return null;
        try {
            const cached = localStorage.getItem(key);
            if (cached) {
                const { transactions, timestamp }: CachedData = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_EXPIRY && Array.isArray(transactions)) {
                    return transactions.filter(isValidTransaction);
                }
            }
        } catch {
            // Ignore cache errors
        }
        return null;
    }, []);

    /**
     * 保存数据到 localStorage
     */
    const saveToCache = useCallback((key: string | null, transactions: Transaction[]) => {
        if (!key) return;
        try {
            localStorage.setItem(key, JSON.stringify({
                transactions,
                timestamp: Date.now()
            }));
        } catch {
            // Ignore cache save errors
        }
    }, []);

    /**
     * 获取所有未进行仕訳的账目 (status = initialized)
     */
    const fetchUninitializedTransactions = useCallback(async (): Promise<Transaction[]> => {
        // 先检查缓存
        const cached = readFromCache(uninitializedCacheKey);
        if (cached) {
            return cached;
        }

        // 缓存无效，调用 API
        try {
            const result = await queryTransactions({
                status_list: ['initialized'],
                sort_by: 'transaction_date',
                sort_order: 'desc'
            });
            if (result.status === 'successed' && result.detail) {
                const rawList = Array.isArray(result.detail) ? result.detail : [];
                const validList = rawList.filter(isValidTransaction);
                // 保存到缓存
                saveToCache(uninitializedCacheKey, validList);
                return validList;
            }
        } catch (error) {
            console.error('Failed to fetch uninitialized transactions:', error);
        }
        return [];
    }, [uninitializedCacheKey, readFromCache, saveToCache]);

    /**
     * 获取最近更新的账目（所有状态，按 updated_at 排序，20条）
     */
    const fetchRecentTransactions = useCallback(async (): Promise<Transaction[]> => {
        // 先检查缓存
        const cached = readFromCache(recentCacheKey);
        if (cached) {
            return cached;
        }

        // 缓存无效，调用 API
        try {
            const result = await queryTransactions({
                status_list: ['initialized', 'journaled', 'updated'],
                limit: 20,
                sort_by: 'updated_at',
                sort_order: 'desc'
            });
            if (result.status === 'successed' && result.detail) {
                const rawList = Array.isArray(result.detail) ? result.detail : [];
                const validList = rawList.filter(isValidTransaction);
                // 保存到缓存
                saveToCache(recentCacheKey, validList);
                return validList;
            }
        } catch (error) {
            console.error('Failed to fetch recent transactions:', error);
        }
        return [];
    }, [recentCacheKey, readFromCache, saveToCache]);

    /**
     * 检测是否是浏览器刷新（而非 SPA 内导航）
     * 结合 performance.now() 来判断 - 只有页面刚加载（2秒内）时才认为是刷新
     */
    const isPageReload = useCallback((): boolean => {
        try {
            // 如果页面已经加载超过2秒，说明是 SPA 内导航，不是刷新
            if (performance.now() > 2000) {
                return false;
            }
            const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
            if (entries.length > 0 && entries[0].type === 'reload') {
                return true;
            }
        } catch {
            // Fallback: ignore if API not supported
        }
        return false;
    }, []);

    /**
     * 清除所有首页相关缓存
     */
    const clearAllHomeCache = useCallback(() => {
        if (uninitializedCacheKey) {
            try {
                localStorage.removeItem(uninitializedCacheKey);
            } catch {
                // Ignore
            }
        }
        if (recentCacheKey) {
            try {
                localStorage.removeItem(recentCacheKey);
            } catch {
                // Ignore
            }
        }
    }, [uninitializedCacheKey, recentCacheKey]);

    // 初始加载
    useEffect(() => {
        const loadData = async () => {
            // 如果是浏览器刷新，先清除缓存，强制获取最新数据
            if (isPageReload()) {
                clearAllHomeCache();
            }

            setLoading(true);
            const [uninitialized, recent] = await Promise.all([
                fetchUninitializedTransactions(),
                fetchRecentTransactions()
            ]);
            setUninitializedTransactions(uninitialized);
            setRecentTransactions(recent);
            setLoading(false);
        };
        loadData();
    }, [fetchUninitializedTransactions, fetchRecentTransactions, isPageReload, clearAllHomeCache]);

    // 首页显示的数据
    const displayedUninitializedTransactions = uninitializedTransactions.slice(0, 3);
    const uninitializedCount = uninitializedTransactions.length;
    const displayedRecentTransactions = recentTransactions.slice(0, 3);

    // 格式化金额
    const formatAmount = (amount: number | null | undefined): string => {
        if (amount === null || amount === undefined || amount === 0) return '¥0';
        return `¥${Math.abs(amount).toLocaleString('ja-JP')}`;
    };

    /**
     * 获取交易金额显示
     */
    const getAmountDisplay = (tx: Transaction): { amount: string; isIncome: boolean } => {
        const txType = tx.transaction_type || tx.amount_type;
        const isIncome = txType === 1;

        let amountValue: number | undefined;
        if (isIncome) {
            amountValue = tx.debit_amount;
        } else {
            amountValue = tx.credit_amount;
        }

        if (!amountValue || amountValue === 0) {
            amountValue = tx.amount_total;
        }

        return {
            amount: formatAmount(amountValue),
            isIncome: isIncome
        };
    };

    // 格式化日期
    const formatDate = (dateStr: string | undefined): string => {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('zh-CN');
        } catch {
            return '-';
        }
    };

    // 格式化日期时间
    const formatDateTime = (dateStr: string | undefined): string => {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '-';
        }
    };

    // 获取状态配置
    const getStatusConfig = (status: string | undefined) => {
        return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.initialized;
    };

    // 获取科目显示名称
    const getAccountName = (tx: Transaction): string => {
        return tx.debit_item || tx.credit_item || '未分类';
    };

    /**
     * 查看全部未进行仕訳账目
     */
    const handleViewAllUninitialized = () => {
        navigate('/transactions', {
            state: {
                preloadedTransactions: uninitializedTransactions,
                filterType: 'uninitialized',
                isSearchResult: true
            }
        });
    };

    /**
     * 查看更多最近更新的账目
     */
    const handleViewMoreRecent = () => {
        navigate('/transactions');
    };

    if (loading) {
        return (
            <Layout>
                <Loading text="加载中..." />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* 未进行仕訳账目区域 */}
                <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">未进行仕訳账目</h2>
                                <p className="text-sm text-gray-500">
                                    {uninitializedCount > 0
                                        ? `共 ${uninitializedCount} 笔账目待处理`
                                        : '暂无待处理账目'}
                                </p>
                            </div>
                        </div>
                        {uninitializedCount > 0 && (
                            <button
                                onClick={handleViewAllUninitialized}
                                className="flex items-center gap-1 text-sm text-sky-600 hover:text-sky-700 font-medium"
                            >
                                查看全部
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {displayedUninitializedTransactions.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {displayedUninitializedTransactions.map((tx) => {
                                const { amount, isIncome } = getAmountDisplay(tx);
                                return (
                                    <div
                                        key={tx.id}
                                        onClick={handleViewAllUninitialized}
                                        className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <span className="text-sm text-gray-500 w-24 shrink-0">
                                                {formatDate(tx.transaction_date)}
                                            </span>
                                            <span className={`text-sm font-semibold w-28 shrink-0 ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                                                {isIncome ? '+' : '-'}{amount}
                                            </span>
                                            <span className="text-sm text-gray-700 truncate flex-1">
                                                {tx.description || '无描述'}
                                            </span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-400" />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="px-6 py-4 text-center">
                            <p className="text-sm text-gray-500">当前没有未进行仕訳的账目</p>
                        </div>
                    )}
                </section>

                {/* 最近更新区域 */}
                <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                                <FileText className="w-5 h-5 text-sky-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">最近更新</h2>
                        </div>
                        {recentTransactions.length > 3 && (
                            <button
                                onClick={handleViewMoreRecent}
                                className="flex items-center gap-1 text-sm text-sky-600 hover:text-sky-700 font-medium"
                            >
                                查看更多
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {displayedRecentTransactions.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {displayedRecentTransactions.map((tx) => {
                                const statusConfig = getStatusConfig(tx.status);
                                const { amount, isIncome } = getAmountDisplay(tx);
                                return (
                                    <div
                                        key={tx.id}
                                        onClick={handleViewMoreRecent}
                                        className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <span className="text-sm text-gray-500 w-36 shrink-0">
                                                {formatDateTime(tx.updated_at)}
                                            </span>
                                            <span className="text-sm font-medium text-gray-900 w-20 shrink-0 truncate">
                                                {getAccountName(tx)}
                                            </span>
                                            <span className="text-sm text-gray-600 truncate flex-1">
                                                {tx.description || '无描述'}
                                            </span>
                                            <span className={`text-sm font-semibold shrink-0 ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                                                {isIncome ? '+' : '-'}{amount}
                                            </span>
                                        </div>
                                        <span className={`ml-3 px-2.5 py-1 text-xs font-medium rounded-full shrink-0 ${statusConfig.className}`}>
                                            {statusConfig.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="px-6 py-12 text-center">
                            <p className="text-gray-500">暂无账目记录</p>
                        </div>
                    )}
                </section>

                {/* 快捷操作区域 */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button
                            onClick={() => navigate('/transactions', { state: { openCreate: true } })}
                            className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-500/10 transition-all group"
                        >
                            <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center group-hover:bg-sky-500 transition-colors">
                                <Plus className="w-6 h-6 text-sky-600 group-hover:text-white transition-colors" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-gray-900">新增账目</h3>
                                <p className="text-sm text-gray-500">手动录入或AI识图</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-sky-500 transition-colors" />
                        </button>

                        <Link
                            to="/reports"
                            state={{ reportType: 'trial_balance' }}
                            className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 transition-all group"
                        >
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                                <FileText className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-gray-900">生成試算表</h3>
                                <p className="text-sm text-gray-500">查看财务汇总</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-indigo-500 transition-colors" />
                        </Link>

                        <Link
                            to="/reports"
                            state={{ reportType: 'ledger' }}
                            className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/10 transition-all group"
                        >
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                                <FileText className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-gray-900">生成総勘定元帳</h3>
                                <p className="text-sm text-gray-500">按科目查看明细</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-purple-500 transition-colors" />
                        </Link>

                        <Link
                            to="/reports"
                            state={{ reportType: 'monthly_chart' }}
                            className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10 transition-all group"
                        >
                            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center group-hover:bg-violet-500 transition-colors">
                                <TrendingUp className="w-6 h-6 text-violet-600 group-hover:text-white transition-colors" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-gray-900">月度统计图表</h3>
                                <p className="text-sm text-gray-500">按月查看收支趋势</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-violet-500 transition-colors" />
                        </Link>
                    </div>
                </section>
            </div>
        </Layout>
    );
}
