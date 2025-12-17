import { ChevronDown, ChevronUp, Edit3, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Transaction } from '../../types';
import { CT_RATE_LABELS, FIN_TYPE_LABELS, STATUS_COLORS, STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '../../types';

interface TransactionTableProps {
    transactions: Transaction[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    onEdit: (transaction: Transaction) => void;
    loading?: boolean;
    isSearchResult?: boolean;  // 是否是搜索结果（用于显示不同的空状态消息）
}

type SortField = 'transaction_date' | 'debit_amount' | 'credit_amount';
type SortOrder = 'asc' | 'desc';

export function TransactionTable({
    transactions,
    selectedIds,
    onSelectionChange,
    onEdit,
    loading = false,
    isSearchResult = false
}: TransactionTableProps) {
    const [sortField, setSortField] = useState<SortField>('transaction_date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const sortedTransactions = useMemo(() => {
        if (!transactions || !Array.isArray(transactions)) return [];

        return [...transactions].sort((a, b) => {
            let aVal: number;
            let bVal: number;

            switch (sortField) {
                case 'transaction_date':
                    aVal = new Date(a.transaction_date || '').getTime() || 0;
                    bVal = new Date(b.transaction_date || '').getTime() || 0;
                    break;
                case 'debit_amount':
                    aVal = a.debit_amount || 0;
                    bVal = b.debit_amount || 0;
                    break;
                case 'credit_amount':
                    aVal = a.credit_amount || 0;
                    bVal = b.credit_amount || 0;
                    break;
                default:
                    aVal = 0;
                    bVal = 0;
            }

            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }, [transactions, sortField, sortOrder]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const handleSelectAll = () => {
        const txList = transactions || [];
        if (selectedIds.length === txList.length && txList.length > 0) {
            onSelectionChange([]);
        } else {
            onSelectionChange(txList.map(t => t.id));
        }
    };

    const handleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter(i => i !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    const formatDate = (dateStr: string | undefined | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('zh-CN');
    };

    const formatAmount = (amount: number | undefined | null) => {
        if (amount === undefined || amount === null) return '-';
        return `¥${Math.round(amount).toLocaleString()}`;
    };

    const getCtRateLabel = (rate: number | undefined | null) => {
        if (rate === undefined || rate === null) return '-';
        return CT_RATE_LABELS[rate] || '-';
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-14 bg-gray-100 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    // Empty state
    if (!transactions || transactions.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 py-16 px-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                </div>
                {isSearchResult ? (
                    <>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">没有搜索到符合条件的账目</h3>
                        <p className="text-gray-500 text-sm">请改变搜索条件再次尝试</p>
                    </>
                ) : (
                    <>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">60天内没有进行账目的操作</h3>
                        <p className="text-gray-500 text-sm">点击上方"新增"按钮可添加账目，也可定义搜索条件进行搜索</p>
                    </>
                )}
            </div>
        );
    }

    const allSelected = selectedIds.length === transactions.length && transactions.length > 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* ===== 桌面端表格 ===== */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="w-12 px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4"
                                />
                            </th>
                            <TableHeader
                                key="date"
                                label="发生日期"
                                sortable
                                active={sortField === 'transaction_date'}
                                order={sortOrder}
                                onClick={() => handleSort('transaction_date')}
                            />
                            <TableHeader key="transaction_type" label="类型" align="center" />
                            <TableHeader key="desc" label="概述" className="min-w-[180px]" />
                            <TableHeader key="fin_type" label="支付方式" align="center" />
                            <TableHeader key="debit_item" label="借方科目" />
                            <TableHeader
                                key="debit_amount"
                                label="借方金額"
                                align="right"
                                sortable
                                active={sortField === 'debit_amount'}
                                order={sortOrder}
                                onClick={() => handleSort('debit_amount')}
                            />
                            <TableHeader key="debit_ct" label="借方税額" align="right" />
                            <TableHeader key="credit_item" label="貸方科目" separator />
                            <TableHeader
                                key="credit_amount"
                                label="貸方金額"
                                align="right"
                                sortable
                                active={sortField === 'credit_amount'}
                                order={sortOrder}
                                onClick={() => handleSort('credit_amount')}
                            />
                            <TableHeader key="credit_ct" label="貸方税額" align="right" />
                            <TableHeader key="ct_rate" label="税率" align="center" />
                            <TableHeader key="created_at" label="创建日" align="center" />
                            <TableHeader key="updated_at" label="更新日" align="center" />
                            <TableHeader key="status" label="状态" align="center" />
                            <th key="actions" className="w-16 px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                                操作
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedTransactions.map((tx, index) => (
                            <tr
                                key={tx.id || `tx-${index}`}
                                className={`
                                    transition-colors hover:bg-gray-50
                                    ${selectedIds.includes(tx.id) ? 'bg-sky-50 hover:bg-sky-100' : ''}
                                `}
                            >
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(tx.id)}
                                        onChange={() => handleSelectOne(tx.id)}
                                        className="w-4 h-4"
                                    />
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                    {formatDate(tx.transaction_date)}
                                </td>
                                <td className="px-4 py-3 text-sm text-center whitespace-nowrap">
                                    {tx.transaction_type ? (
                                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${tx.transaction_type === 1
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-rose-100 text-rose-700'
                                            }`}>
                                            {TRANSACTION_TYPE_LABELS[tx.transaction_type]}
                                        </span>
                                    ) : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 max-w-[200px]">
                                    <span className="line-clamp-2" title={tx.description || ''}>
                                        {tx.description || '-'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 text-center whitespace-nowrap">
                                    {tx.fin_type ? FIN_TYPE_LABELS[tx.fin_type as 1 | 2 | 3 | 4 | 5] : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                    {tx.debit_item || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap font-mono">
                                    {formatAmount(tx.debit_amount)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 text-right whitespace-nowrap font-mono">
                                    {formatAmount(tx.debit_ct)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap border-l border-gray-200">
                                    {tx.credit_item || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap font-mono">
                                    {formatAmount(tx.credit_amount)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 text-right whitespace-nowrap font-mono">
                                    {formatAmount(tx.credit_ct)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 text-center whitespace-nowrap">
                                    {getCtRateLabel(tx.ct_rate)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 text-center whitespace-nowrap">
                                    {formatDate(tx.created_at)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 text-center whitespace-nowrap">
                                    {formatDate(tx.updated_at)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`
                                        inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full
                                        ${STATUS_COLORS[tx.status] || 'bg-gray-100 text-gray-600'}
                                    `}>
                                        {STATUS_LABELS[tx.status] || '未知'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => onEdit(tx)}
                                        className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                                        title="编辑"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ===== 移动端/平板卡片视图 ===== */}
            <div className="lg:hidden">
                {/* 全选栏 */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-600">
                        {selectedIds.length > 0 ? `已选择 ${selectedIds.length} 项` : '全选'}
                    </span>
                </div>

                {/* 卡片列表 */}
                <div className="divide-y divide-gray-100">
                    {sortedTransactions.map((tx, index) => (
                        <div
                            key={tx.id || `card-${index}`}
                            className={`p-4 transition-colors ${selectedIds.includes(tx.id) ? 'bg-sky-50' : ''
                                }`}
                        >
                            <div className="flex gap-3">
                                {/* 勾选框 */}
                                <div className="pt-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(tx.id)}
                                        onChange={() => handleSelectOne(tx.id)}
                                        className="w-4 h-4"
                                    />
                                </div>

                                {/* 内容区 */}
                                <div className="flex-1 min-w-0">
                                    {/* 头部：日期 + 类型 + 状态 */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">
                                                {formatDate(tx.transaction_date)}
                                            </span>
                                            {tx.transaction_type && (
                                                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${tx.transaction_type === 1
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                    {TRANSACTION_TYPE_LABELS[tx.transaction_type]}
                                                </span>
                                            )}
                                        </div>
                                        <span className={`
                                            inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full
                                            ${STATUS_COLORS[tx.status] || 'bg-gray-100 text-gray-600'}
                                        `}>
                                            {STATUS_LABELS[tx.status] || '未知'}
                                        </span>
                                    </div>

                                    {/* 概述 */}
                                    <p className="text-sm font-medium text-gray-900 mb-3 line-clamp-2">
                                        {tx.description || '-'}
                                    </p>

                                    {/* 借方/貸方信息 */}
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500 mb-1">借方</p>
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {tx.debit_item || '-'}
                                            </p>
                                            <p className="text-sm font-semibold text-sky-600 mt-1">
                                                {formatAmount(tx.debit_amount)}
                                            </p>
                                            {tx.debit_ct ? (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    税額: {formatAmount(tx.debit_ct)}
                                                </p>
                                            ) : null}
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500 mb-1">貸方</p>
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {tx.credit_item || '-'}
                                            </p>
                                            <p className="text-sm font-semibold text-emerald-600 mt-1">
                                                {formatAmount(tx.credit_amount)}
                                            </p>
                                            {tx.credit_ct ? (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    税額: {formatAmount(tx.credit_ct)}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* 底部：支付方式 + 税率 + 日期 + 编辑按钮 */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs text-gray-500">
                                                支付: {tx.fin_type ? FIN_TYPE_LABELS[tx.fin_type as 1 | 2 | 3 | 4 | 5] : '-'} | 税率: {getCtRateLabel(tx.ct_rate)}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                创建: {formatDate(tx.created_at)} | 更新: {formatDate(tx.updated_at)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => onEdit(tx)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            编辑
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// 表头组件
interface TableHeaderProps {
    label: string;
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;
    active?: boolean;
    order?: 'asc' | 'desc';
    onClick?: () => void;
    separator?: boolean;
    className?: string;
}

function TableHeader({
    label,
    align = 'left',
    sortable = false,
    active = false,
    order = 'desc',
    onClick,
    separator = false,
    className = ''
}: TableHeaderProps) {
    const alignClass = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right'
    };

    return (
        <th
            className={`
                px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap
                ${alignClass[align]}
                ${sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}
                ${separator ? 'border-l border-gray-200' : ''}
                ${className}
            `}
            onClick={sortable ? onClick : undefined}
        >
            <div className={`inline-flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
                {label}
                {sortable && active && (
                    order === 'asc'
                        ? <ChevronUp className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />
                )}
            </div>
        </th>
    );
}
