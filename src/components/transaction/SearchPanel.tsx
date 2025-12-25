import { ChevronDown, ChevronUp, Plus, RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';
import type { QueryParams, TransactionStatus } from '../../types';
import { STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '../../types';
import { Button } from '../ui/Button';

interface SearchPanelProps {
    onSearch: (params: QueryParams) => void;
    onReset: () => void;
    onCreateNew: () => void;
    loading?: boolean;
}

const STATUS_OPTIONS: TransactionStatus[] = ['initialized', 'journaled', 'updated'];
const TRANSACTION_TYPE_OPTIONS: (1 | 2)[] = [1, 2];

export function SearchPanel({
    onSearch,
    onReset,
    onCreateNew,
    loading = false
}: SearchPanelProps) {
    const [expanded, setExpanded] = useState(false);

    // 搜索相关状态
    const [enableTransactionDate, setEnableTransactionDate] = useState(false);
    const [enableTransactionType, setEnableTransactionType] = useState(false);
    const [enableUpdatedDate, setEnableUpdatedDate] = useState(false);
    const [enableStatus, setEnableStatus] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [updatedFrom, setUpdatedFrom] = useState('');
    const [updatedTo, setUpdatedTo] = useState('');
    const [transactionType, setTransactionType] = useState<1 | 2 | null>(null);
    const [statusList, setStatusList] = useState<TransactionStatus[]>([]);

    // 计算已启用的筛选条件数量
    const enabledCount = [enableTransactionDate, enableTransactionType, enableUpdatedDate, enableStatus].filter(Boolean).length;

    const handleStatusToggle = (status: TransactionStatus) => {
        if (statusList.includes(status)) {
            setStatusList(statusList.filter(s => s !== status));
        } else {
            setStatusList([...statusList, status]);
        }
    };

    const handleTransactionTypeToggle = (type: 1 | 2) => {
        if (transactionType === type) {
            setTransactionType(null);
        } else {
            setTransactionType(type);
        }
    };

    const handleSearch = () => {
        onSearch({
            date_from: enableTransactionDate ? (dateFrom || null) : null,
            date_to: enableTransactionDate ? (dateTo || null) : null,
            updated_from: enableUpdatedDate ? (updatedFrom || null) : null,
            updated_to: enableUpdatedDate ? (updatedTo || null) : null,
            transaction_type: enableTransactionType && transactionType ? transactionType : undefined,
            status_list: enableStatus && statusList.length > 0 ? statusList : undefined
        });
    };

    const handleReset = () => {
        setEnableTransactionDate(false);
        setEnableTransactionType(false);
        setEnableUpdatedDate(false);
        setEnableStatus(false);
        setDateFrom('');
        setDateTo('');
        setUpdatedFrom('');
        setUpdatedTo('');
        setTransactionType(null);
        setStatusList([]);
        onReset();
    };

    // Checkbox 组件
    const FilterCheckbox = ({
        checked,
        onChange,
        label
    }: {
        checked: boolean;
        onChange: (checked: boolean) => void;
        label: string;
    }) => (
        <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500 cursor-pointer"
            />
            <span className="text-sm text-gray-700">{label}</span>
        </label>
    );

    // 日期范围输入组件
    const DateRangeInput = ({
        fromValue,
        toValue,
        onFromChange,
        onToChange
    }: {
        fromValue: string;
        toValue: string;
        onFromChange: (value: string) => void;
        onToChange: (value: string) => void;
    }) => (
        <div className="flex items-center gap-2 mt-2 ml-6 animate-fade-in">
            <input
                type="date"
                value={fromValue}
                onChange={(e) => onFromChange(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
            <span className="text-gray-400 text-sm">至</span>
            <input
                type="date"
                value={toValue}
                onChange={(e) => onToChange(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
        </div>
    );

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* 操作栏：筛选 + 新增 */}
            <div className="flex items-center justify-between px-4 py-3">
                {/* 左侧：筛选按钮 */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 -ml-2 rounded-lg transition-colors"
                >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">账目筛选</span>
                    {enabledCount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-sky-100 text-sky-700 rounded-full">
                            {enabledCount} 个条件
                        </span>
                    )}
                    {expanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                </button>

                {/* 右侧：新增按钮 */}
                <Button
                    onClick={onCreateNew}
                    icon={<Plus className="w-4 h-4" />}
                >
                    新增账目
                </Button>
            </div>

            {/* 展开内容 */}
            {expanded && (
                <div className="border-t border-gray-100 animate-fade-in px-4 pb-4">
                    <div className="pt-4 space-y-3">
                        {/* 发生日期 */}
                        <div>
                            <FilterCheckbox
                                checked={enableTransactionDate}
                                onChange={setEnableTransactionDate}
                                label="发生日期"
                            />
                            {enableTransactionDate && (
                                <DateRangeInput
                                    fromValue={dateFrom}
                                    toValue={dateTo}
                                    onFromChange={setDateFrom}
                                    onToChange={setDateTo}
                                />
                            )}
                        </div>

                        {/* 类型（收入/支出）*/}
                        <div>
                            <FilterCheckbox
                                checked={enableTransactionType}
                                onChange={setEnableTransactionType}
                                label="类型"
                            />
                            {enableTransactionType && (
                                <div className="flex flex-wrap gap-2 mt-2 ml-6 animate-fade-in">
                                    {TRANSACTION_TYPE_OPTIONS.map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => handleTransactionTypeToggle(type)}
                                            className={`
                                                px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors
                                                ${transactionType === type
                                                    ? 'bg-sky-50 border-sky-300 text-sky-700'
                                                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            {TRANSACTION_TYPE_LABELS[type]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 更新日期 */}
                        <div>
                            <FilterCheckbox
                                checked={enableUpdatedDate}
                                onChange={setEnableUpdatedDate}
                                label="更新日期"
                            />
                            {enableUpdatedDate && (
                                <DateRangeInput
                                    fromValue={updatedFrom}
                                    toValue={updatedTo}
                                    onFromChange={setUpdatedFrom}
                                    onToChange={setUpdatedTo}
                                />
                            )}
                        </div>

                        {/* 状态筛选 */}
                        <div>
                            <FilterCheckbox
                                checked={enableStatus}
                                onChange={setEnableStatus}
                                label="状态"
                            />
                            {enableStatus && (
                                <div className="flex flex-wrap gap-2 mt-2 ml-6 animate-fade-in">
                                    {STATUS_OPTIONS.map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusToggle(status)}
                                            className={`
                                                px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors
                                                ${statusList.includes(status)
                                                    ? 'bg-sky-50 border-sky-300 text-sky-700'
                                                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            {STATUS_LABELS[status]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 按钮 */}
                        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 mt-4">
                            <Button
                                variant="ghost"
                                onClick={handleReset}
                                icon={<RefreshCw className="w-4 h-4" />}
                            >
                                重置并刷新
                            </Button>
                            <Button
                                onClick={handleSearch}
                                disabled={loading || enabledCount === 0}
                                icon={<Search className="w-4 h-4" />}
                            >
                                应用筛选
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
