import { ChevronDown, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ExportButton } from '../components/transaction/ExportButton';
import { SearchPanel } from '../components/transaction/SearchPanel';
import { TransactionForm } from '../components/transaction/TransactionForm';
import { TransactionTable } from '../components/transaction/TransactionTable';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Loading } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
    createTransaction,
    deleteTransactions,
    getDefaultQueryParams,
    processAIJournal,
    queryTransactions,
    updateTransaction
} from '../services/api';
import type {
    QueryParams,
    Transaction,
    TransactionInput,
    TransactionUpdate
} from '../types';

const CACHE_KEY_PREFIX = 'journal_transactions_';
const CACHE_KEY_UNINITIALIZED_PREFIX = 'journal_uninitialized_';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CachedData {
    transactions: Transaction[];
    timestamp: number;
}

// 页面标题类型
type PageTitleType = 'recent' | 'uninitialized' | 'search';

export function DashboardPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const location = useLocation();

    // 用户专属的缓存键
    const cacheKey = user?.uid ? `${CACHE_KEY_PREFIX}${user.uid}` : null;
    const uninitializedCacheKey = user?.uid ? `${CACHE_KEY_UNINITIALIZED_PREFIX}${user.uid}` : null;

    // Data state
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // 页面标题类型
    const [titleType, setTitleType] = useState<PageTitleType>('recent');

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    // Confirm dialogs
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showAIConfirm, setShowAIConfirm] = useState(false);

    // 分页状态
    const [currentOffset, setCurrentOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const PAGE_SIZE = 20;

    // Load transactions
    const loadTransactions = useCallback(async (params?: QueryParams, useCache = true) => {
        // 验证交易数据是否有效
        const isValidTransaction = (tx: unknown): tx is Transaction => {
            return tx !== null &&
                typeof tx === 'object' &&
                'id' in tx &&
                typeof (tx as Transaction).id === 'string' &&
                (tx as Transaction).id !== '';
        };

        if (useCache && cacheKey) {
            try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    const { transactions: cachedTx, timestamp }: CachedData = JSON.parse(cached);
                    if (Date.now() - timestamp < CACHE_EXPIRY && Array.isArray(cachedTx)) {
                        const validTx = cachedTx.filter(isValidTransaction);
                        setTransactions(validTx);
                        setLoading(false);
                        return;
                    }
                }
            } catch {
                // Ignore cache errors
            }
        }

        setLoading(true);
        const queryParams = params || getDefaultQueryParams();

        try {
            const response = await queryTransactions(queryParams);
            setLoading(false);

            if (response.status === 'successed' && response.detail) {
                // 过滤掉无效的交易记录
                const rawList = Array.isArray(response.detail) ? response.detail : [];
                const txList = rawList.filter(isValidTransaction);

                setTransactions(txList);
                setCurrentOffset(0);
                setHasMore(txList.length >= PAGE_SIZE);

                // Save to localStorage cache
                if (cacheKey && !params) {
                    try {
                        localStorage.setItem(cacheKey, JSON.stringify({
                            transactions: txList,
                            timestamp: Date.now()
                        }));
                    } catch {
                        // Ignore cache save errors
                    }
                }
            } else {
                setTransactions([]);
                setHasMore(false);
            }
        } catch {
            setLoading(false);
            setTransactions([]);
            setHasMore(false);
        }
    }, [cacheKey, PAGE_SIZE]);

    /**
     * 清除未仕訳账目的缓存（当数据修改时调用）
     * 这样首页在下次访问时会重新获取数据
     */
    const clearUninitializedCache = useCallback(() => {
        if (uninitializedCacheKey) {
            try {
                localStorage.removeItem(uninitializedCacheKey);
            } catch {
                // Ignore cache errors
            }
        }
    }, [uninitializedCacheKey]);

    // 页面加载时滚动到顶部
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // 初始加载：检查是否有从首页传递的预加载数据，否则使用 localStorage 缓存
    useEffect(() => {
        const state = location.state as {
            preloadedTransactions?: Transaction[];
            filterType?: 'uninitialized' | 'recent';
            isSearchResult?: boolean;
            openCreate?: boolean;
        } | null;

        if (state?.preloadedTransactions && state.preloadedTransactions.length > 0) {
            // 从首页传递的预加载数据（如未仕訳账目），直接使用
            setTransactions(state.preloadedTransactions);

            if (state.filterType === 'uninitialized') {
                setTitleType('uninitialized');
                setHasMore(false);
            } else {
                setTitleType('recent');
                setHasMore(state.preloadedTransactions.length >= 20);
            }

            setLoading(false);
            window.history.replaceState({}, document.title);
        } else if (state?.openCreate) {
            // 从首页"新增账目"跳转来，加载数据（会使用 localStorage 缓存）并打开创建弹窗
            setTitleType('recent');
            loadTransactions();
            setShowCreateModal(true);
            window.history.replaceState({}, document.title);
        } else {
            // 正常加载（直接从导航栏进入）
            // loadTransactions 会自动检查 localStorage 缓存
            setTitleType('recent');
            loadTransactions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Create transaction
    const handleCreate = async (data: TransactionInput) => {
        setActionLoading(true);
        try {
            const response = await createTransaction(data);
            console.log('Create response:', response); // Debug log

            if (response.status === 'successed') {
                showToast('success', '账目创建成功');
                setShowCreateModal(false);
                clearUninitializedCache();
                setTitleType('recent');
                loadTransactions(undefined, false);
            } else {
                showToast('error', response.message || '创建失败');
                // 失败时也关闭弹窗，让用户可以重试
                setShowCreateModal(false);
            }
        } catch (error) {
            console.error('Create error:', error);
            showToast('error', '创建失败');
            setShowCreateModal(false);
        } finally {
            setActionLoading(false);
        }
    };

    // Update transaction
    const handleUpdate = async (data: TransactionUpdate) => {
        setActionLoading(true);
        try {
            const response = await updateTransaction(data);
            console.log('Update response:', response); // Debug log

            if (response.status === 'successed') {
                showToast('success', '账目更新成功');
                clearUninitializedCache();
                setTitleType('recent');
                loadTransactions(undefined, false);
            } else {
                showToast('error', response.message || '更新失败');
            }
        } catch (error) {
            console.error('Update error:', error);
            showToast('error', '更新失败');
        } finally {
            setActionLoading(false);
            setShowEditModal(false);
            setEditingTransaction(null);
        }
    };

    // Delete transactions
    const handleDelete = async () => {
        if (selectedIds.length === 0) return;

        setActionLoading(true);
        const response = await deleteTransactions(selectedIds);
        setActionLoading(false);
        setShowDeleteConfirm(false);

        if (response.status === 'successed') {
            showToast('success', `成功删除 ${selectedIds.length} 条账目`);
            setSelectedIds([]);
            clearUninitializedCache();
            setTitleType('recent');
            loadTransactions(undefined, false);
        } else {
            showToast('error', response.message || '删除失败');
        }
    };

    // Process AI Journal
    const handleAIJournal = async () => {
        if (selectedIds.length === 0) return;
        if (selectedIds.length > 100) {
            showToast('error', 'AI仕訳一次最多处理100条记录');
            return;
        }

        setActionLoading(true);
        const response = await processAIJournal(selectedIds);
        setActionLoading(false);
        setShowAIConfirm(false);

        if (response.status === 'successed') {
            showToast('success', 'AI仕訳处理完成');
            setSelectedIds([]);
            clearUninitializedCache();
            setTitleType('recent');
            loadTransactions(undefined, false);
        } else {
            showToast('error', response.message || 'AI处理失败');
        }
    };

    // Open edit modal
    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setShowEditModal(true);
    };

    // Search handler
    const handleSearch = (params: QueryParams) => {
        // 检查是否有实际的搜索条件
        const hasSearchParams = !!(
            params.date_from || params.date_to ||
            params.updated_from || params.updated_to ||
            params.transaction_type ||
            (params.status_list && params.status_list.length > 0)
        );
        if (hasSearchParams) {
            setTitleType('search');
        }
        loadTransactions(params, false);
    };

    // Reset and refresh handler
    const handleReset = () => {
        setTitleType('recent');
        loadTransactions(undefined, false);
    };

    // 加载更多
    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        const newOffset = currentOffset + PAGE_SIZE;

        try {
            const params = getDefaultQueryParams();
            params.offset = newOffset;
            params.limit = PAGE_SIZE;

            const response = await queryTransactions(params);

            if (response.status === 'successed' && response.detail) {
                const rawList = Array.isArray(response.detail) ? response.detail : [];
                const newTxList = rawList.filter((tx): tx is Transaction =>
                    tx !== null && typeof tx === 'object' && 'id' in tx && typeof tx.id === 'string' && tx.id !== ''
                );

                if (newTxList.length > 0) {
                    setTransactions(prev => [...prev, ...newTxList]);
                    setCurrentOffset(newOffset);
                    setHasMore(newTxList.length >= PAGE_SIZE);
                } else {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch {
            showToast('error', '加载更多失败');
        } finally {
            setLoadingMore(false);
        }
    };

    // 动态获取页面标题
    const getPageTitle = (): string => {
        switch (titleType) {
            case 'uninitialized':
                return '未进行仕訳账目';
            case 'search':
                return '搜索结果';
            case 'recent':
            default:
                return '最近更新账目';
        }
    };

    // 只有在初始加载时才显示全屏加载状态
    // 搜索时不显示全屏加载，防止 SearchPanel 被卸载导致状态丢失
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // 初始加载完成后设置为 false
    useEffect(() => {
        if (!loading && isInitialLoad) {
            setIsInitialLoad(false);
        }
    }, [loading, isInitialLoad]);

    if (loading && isInitialLoad) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loading size="lg" text="加载中..." />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-4">
                {/* 账目筛选 + 新增按钮 */}
                <SearchPanel
                    onSearch={handleSearch}
                    onReset={handleReset}
                    onCreateNew={() => setShowCreateModal(true)}
                    loading={loading}
                />

                {/* 结果标题 - 精简版 */}
                <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h2>
                    <span className="text-sm text-gray-500">
                        共 {transactions.length} 条
                        {transactions.length > 0 && (
                            <span className="text-gray-400 ml-2">
                                *勾选后可批量进行 仕訳 / 导出 / 删除
                            </span>
                        )}
                    </span>
                </div>

                {/* 数据表格 */}
                <TransactionTable
                    transactions={transactions}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    onEdit={handleEdit}
                    loading={loading}
                    isSearchResult={titleType === 'search'}
                />

                {/* 加载更多按钮 */}
                {titleType === 'recent' && hasMore && transactions.length > 0 && (
                    <div className="mt-4 flex justify-center">
                        <Button
                            variant="secondary"
                            onClick={handleLoadMore}
                            loading={loadingMore}
                            icon={<ChevronDown className="w-4 h-4" />}
                        >
                            加载更多
                        </Button>
                    </div>
                )}

                {/* 显示当前加载数量 */}
                {titleType === 'recent' && transactions.length > 0 && (
                    <p className="mt-2 text-center text-sm text-gray-400">
                        已加载 {transactions.length} 条账目
                        {!hasMore && '（已全部加载）'}
                    </p>
                )}

                {/* 底部占位，防止浮动操作栏遮挡内容 */}
                {selectedIds.length > 0 && <div className="h-20" />}
            </div>

            {/* 底部浮动操作栏 - 选中时显示 */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
                    {/* 移动端底部导航栏安全区域 */}
                    <div className="bg-white border-t border-gray-200 shadow-lg pb-safe">
                        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <span className="text-sm font-medium text-sky-700 bg-sky-100 px-3 py-1 rounded-full whitespace-nowrap">
                                        已选 {selectedIds.length} 条
                                    </span>
                                    <button
                                        onClick={() => setSelectedIds([])}
                                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                        title="取消选择"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-1 sm:gap-2">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setShowAIConfirm(true)}
                                        className="w-24 justify-center"
                                    >
                                        AI仕訳
                                    </Button>

                                    <ExportButton
                                        transactions={transactions}
                                        selectedIds={selectedIds}
                                        dropUp
                                        className="w-24"
                                    />

                                    <Button
                                        variant="danger"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="w-24 justify-center"
                                    >
                                        删除
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 新增弹窗 */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="新增账目"
                size="lg"
            >
                <TransactionForm
                    mode="create"
                    onSubmit={handleCreate}
                    onCancel={() => setShowCreateModal(false)}
                    loading={actionLoading}
                />
            </Modal>

            {/* 编辑弹窗 */}
            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingTransaction(null);
                }}
                title="编辑账目"
                size="lg"
            >
                {editingTransaction && (() => {
                    // 辅助函数：将字符串或数字转换为数字
                    const toNumber = (val: unknown): number => {
                        if (typeof val === 'number') return val;
                        if (typeof val === 'string') return parseFloat(val) || 0;
                        return 0;
                    };

                    // 计算金额: (debit_amount + credit_amount + debit_ct + credit_ct) / 2
                    const calculatedAmount = Math.round(
                        (toNumber(editingTransaction.debit_amount) +
                            toNumber(editingTransaction.credit_amount) +
                            toNumber(editingTransaction.debit_ct) +
                            toNumber(editingTransaction.credit_ct)) / 2
                    );

                    // 类型: 基于 transaction_type 字段 (1=收入, 2=支出)
                    const rawTransactionType = toNumber(editingTransaction.transaction_type);
                    const amountType: 1 | 2 = rawTransactionType === 1 ? 1 : 2;

                    // ct_rate 转换为数字
                    const ctRate = toNumber(editingTransaction.ct_rate);

                    // 税务类型: ct_rate === 0 为非课税(1)，否则为课税(2)
                    const taxType: 1 | 2 = ctRate === 0 ? 1 : 2;

                    // 税率: 直接使用 ct_rate (1=8%, 2=10%, 3=混合, 4=其の他)
                    const taxRate = ctRate > 0 ? ctRate as 1 | 2 | 3 | 4 : undefined;

                    // 课税额: 当 ct_rate === 3 或 4 时，取 debit_ct 或 credit_ct 中大于0的值
                    const taxAmount = (ctRate === 3 || ctRate === 4)
                        ? Math.max(toNumber(editingTransaction.debit_ct), toNumber(editingTransaction.credit_ct))
                        : undefined;

                    return (
                        <TransactionForm
                            mode="edit"
                            initialData={{
                                id: editingTransaction.id,
                                status: editingTransaction.status,  // 传递当前状态给 webhook
                                transaction_date: editingTransaction.transaction_date,
                                description: editingTransaction.description,
                                amount_total: calculatedAmount,
                                amount_type: amountType,
                                fin_type: (editingTransaction.fin_type as 1 | 2 | 3 | 4 | 5) || 1,
                                tax_type: taxType,
                                tax_rate: taxRate,
                                tax_amount: taxAmount,
                                debit_item: editingTransaction.debit_item,
                                credit_item: editingTransaction.credit_item
                            }}
                            onSubmit={(data) => handleUpdate(data as TransactionUpdate)}
                            onCancel={() => {
                                setShowEditModal(false);
                                setEditingTransaction(null);
                            }}
                            loading={actionLoading}
                        />
                    );
                })()}
            </Modal>

            {/* 删除确认 */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="确认删除"
                message={`确定要删除选中的 ${selectedIds.length} 条账目吗？此操作不可恢复。`}
                confirmText="删除"
                variant="danger"
                loading={actionLoading}
            />

            {/* AI仕訳确认 */}
            <ConfirmDialog
                isOpen={showAIConfirm}
                onClose={() => setShowAIConfirm(false)}
                onConfirm={handleAIJournal}
                title="AI 仕訳"
                message={`确定要对选中的 ${selectedIds.length} 条账目执行 AI 仕訳吗？`}
                confirmText="执行"
                variant="primary"
                loading={actionLoading}
            />
        </Layout>
    );
}
