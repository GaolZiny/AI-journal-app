import { useEffect, useState } from 'react';
import type { TransactionInput, TransactionUpdate } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface TransactionFormProps {
    mode: 'create' | 'edit';
    initialData?: TransactionUpdate;
    onSubmit: (data: TransactionInput | TransactionUpdate) => void;
    onCancel: () => void;
    loading?: boolean;
}

const AMOUNT_TYPE_OPTIONS = [
    { value: 1, label: '收入' },
    { value: 2, label: '支出' }
];

const TAX_TYPE_OPTIONS = [
    { value: 1, label: '非课税' },
    { value: 2, label: '课税' }
];

const TAX_RATE_OPTIONS = [
    { value: 1, label: '8%' },
    { value: 2, label: '10%' },
    { value: 3, label: '8%10%混合' },
    { value: 4, label: '其の他' }
];

export function TransactionForm({
    mode,
    initialData,
    onSubmit,
    onCancel,
    loading = false
}: TransactionFormProps) {
    const [formData, setFormData] = useState({
        transaction_date: '',
        description: '',
        amount_total: 0,
        amount_type: 2 as 1 | 2,
        tax_type: 1 as 1 | 2,
        tax_rate: undefined as 1 | 2 | 3 | 4 | undefined,
        tax_amount: undefined as number | undefined,
        debit_item: '',
        credit_item: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // 标记是否是首次加载编辑模式数据
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize form with existing data
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData({
                transaction_date: initialData.transaction_date?.split('T')[0] || '',
                description: initialData.description || '',
                amount_total: initialData.amount_total || 0,
                amount_type: initialData.amount_type || 2,
                tax_type: initialData.tax_type || 1,
                tax_rate: initialData.tax_rate,
                tax_amount: initialData.tax_amount,
                debit_item: initialData.debit_item || '',
                credit_item: initialData.credit_item || ''
            });
            // 标记已初始化，防止自动计算覆盖初始税额
            setIsInitialized(true);
        }
    }, [mode, initialData]);

    // Auto-calculate tax amount when tax_rate is 8% or 10%
    // 注意：混合税率(3)不自动计算，保留用户输入或初始值
    useEffect(() => {
        // 编辑模式下，首次加载时不自动计算，保留传入的值
        if (mode === 'edit' && !isInitialized) {
            return;
        }

        // 只有当税率是 8% 或 10% 时自动计算，混合税率(3)和其の他(4)需要手动输入
        if (formData.tax_type === 2 && formData.tax_rate && formData.tax_rate !== 3 && formData.tax_rate !== 4 && formData.amount_total > 0) {
            const rate = formData.tax_rate === 1 ? 0.08 : 0.1;
            const taxAmount = Math.round(formData.amount_total * rate / (1 + rate));
            setFormData(prev => ({ ...prev, tax_amount: taxAmount }));
        } else if (formData.tax_type === 1) {
            // 只有非课税时才清空税额
            setFormData(prev => ({ ...prev, tax_amount: undefined }));
        }
        // 混合税率(tax_rate === 3)或其の他(tax_rate === 4)时不做任何处理，保留现有值
    }, [formData.amount_total, formData.tax_type, formData.tax_rate, mode, isInitialized]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.transaction_date) {
            newErrors.transaction_date = '请选择发生日期';
        }

        if (!formData.description.trim()) {
            newErrors.description = '请输入概述';
        }

        if (formData.amount_total <= 0) {
            newErrors.amount_total = '金额必须大于0';
        }

        if (formData.tax_type === 2 && !formData.tax_rate) {
            newErrors.tax_rate = '请选择税率';
        }

        // 混合税率或其の他时必须输入税额
        if (formData.tax_type === 2 && (formData.tax_rate === 3 || formData.tax_rate === 4)) {
            if (!formData.tax_amount || formData.tax_amount <= 0) {
                newErrors.tax_amount = '该税率时必须输入税额';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const submitData: TransactionInput | TransactionUpdate = {
            transaction_date: formData.transaction_date,
            description: formData.description,
            amount_total: formData.amount_total,
            amount_type: formData.amount_type,
            tax_type: formData.tax_type,
            tax_rate: formData.tax_type === 2 ? formData.tax_rate : undefined,
            tax_amount: formData.tax_type === 2 ? formData.tax_amount : undefined
        };

        if (mode === 'edit' && initialData) {
            (submitData as TransactionUpdate).id = initialData.id;
            (submitData as TransactionUpdate).debit_item = formData.debit_item || undefined;
            (submitData as TransactionUpdate).credit_item = formData.credit_item || undefined;
        }

        onSubmit(submitData);
    };

    const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // 是否需要手动输入税额（混合税率 或 其の他）
    const needsManualTaxAmount = formData.tax_type === 2 && (formData.tax_rate === 3 || formData.tax_rate === 4);

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* 发生日期 */}
            <div className="w-full overflow-hidden">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    发生日期
                </label>
                <input
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => updateField('transaction_date', e.target.value)}
                    style={{ boxSizing: 'border-box', minWidth: 0 }}
                    className={`
                        w-full max-w-full px-4 py-3 bg-white text-gray-900 border rounded-lg
                        transition-all duration-200
                        focus:outline-none focus:ring-2
                        ${errors.transaction_date
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-gray-300 focus:border-sky-500 focus:ring-sky-500/20'
                        }
                    `}
                />
                {errors.transaction_date && (
                    <p className="mt-2 text-sm text-red-500">{errors.transaction_date}</p>
                )}
            </div>

            {/* 概述 */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    概述（付款方式默认现金，其他方式请注明。超10万日元支出请注明。可直接指定仕訳項目。）
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={3}
                    className={`
                        w-full px-4 py-3 bg-white text-gray-900 border rounded-lg resize-none
                        placeholder:text-gray-400 transition-all duration-200
                        focus:outline-none focus:ring-2
                        ${errors.description
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-gray-300 focus:border-sky-500 focus:ring-sky-500/20'
                        }
                    `}
                    placeholder="请输入账目概述"
                />
                {errors.description && (
                    <p className="mt-2 text-sm text-red-500">{errors.description}</p>
                )}
            </div>

            {/* 金额和类型 */}
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="金额"
                    type="number"
                    min={0}
                    step={1}
                    value={formData.amount_total || ''}
                    onChange={(e) => updateField('amount_total', Number(e.target.value))}
                    error={errors.amount_total}
                />

                <Select
                    label="类型"
                    value={formData.amount_type}
                    onChange={(e) => updateField('amount_type', Number(e.target.value) as 1 | 2)}
                    options={AMOUNT_TYPE_OPTIONS}
                />
            </div>

            {/* 税务类型和税率 */}
            <div className="grid grid-cols-2 gap-4">
                <Select
                    label="税务类型"
                    value={formData.tax_type}
                    onChange={(e) => updateField('tax_type', Number(e.target.value) as 1 | 2)}
                    options={TAX_TYPE_OPTIONS}
                />

                {formData.tax_type === 2 && (
                    <Select
                        label="税率"
                        value={formData.tax_rate || ''}
                        onChange={(e) => updateField('tax_rate', Number(e.target.value) as 1 | 2 | 3)}
                        options={TAX_RATE_OPTIONS}
                        placeholder="请选择税率"
                        error={errors.tax_rate}
                    />
                )}
            </div>

            {/* 混合税率时手动输入税额 */}
            {needsManualTaxAmount && (
                <Input
                    label="总课税额"
                    type="number"
                    min={0}
                    step={1}
                    value={formData.tax_amount || ''}
                    onChange={(e) => updateField('tax_amount', Number(e.target.value) || undefined)}
                    error={errors.tax_amount}
                />
            )}

            {/* 自动计算的税额显示（非混合税率时） */}
            {formData.tax_type === 2 && formData.tax_rate && formData.tax_rate !== 3 && formData.tax_amount !== undefined && (
                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                        预估税额: <span className="font-semibold text-gray-900">¥{formData.tax_amount.toLocaleString()}</span>
                    </p>
                </div>
            )}

            {/* 编辑模式下显示科目 */}
            {mode === 'edit' && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                    <Input
                        label="借方科目"
                        value={formData.debit_item}
                        onChange={(e) => updateField('debit_item', e.target.value)}
                        placeholder="借方科目"
                    />

                    <Input
                        label="貸方科目"
                        value={formData.credit_item}
                        onChange={(e) => updateField('credit_item', e.target.value)}
                        placeholder="貸方科目"
                    />
                </div>
            )}

            {/* 按钮 */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={loading}
                >
                    取消
                </Button>
                <Button
                    type="submit"
                    loading={loading}
                >
                    {mode === 'create' ? '创建' : '保存'}
                </Button>
            </div>
        </form>
    );
}
