// User types
export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

// Transaction types - 按照n8n工作流返回的字段
export interface Transaction {
    id: string;
    transaction_date: string;  // 发生日期
    description: string;       // 概述
    transaction_type?: 1 | 2;  // 收入(1) / 支出(2)
    debit_item?: string;       // 借方科目
    debit_amount?: number;     // 借方金額
    debit_ct?: number;         // 借方税額
    credit_item?: string;      // 貸方科目
    credit_amount?: number;    // 貸方金額
    credit_ct?: number;        // 貸方税額
    ct_rate?: number;          // 税率 (0=非课税, 1=8%, 2=10%, 3=混合)
    status: TransactionStatus;
    created_at: string;
    updated_at: string;
    // 旧字段保留兼容
    amount_total?: number;
    amount_type?: 1 | 2;
    tax_type?: 1 | 2;
    tax_rate?: 1 | 2 | 3;
    tax_amount?: number;
}

export type TransactionStatus = 'initialized' | 'journaled' | 'updated';

// Status labels in Chinese
export const STATUS_LABELS: Record<TransactionStatus, string> = {
    initialized: 'AI未处理',
    journaled: 'AI已处理',
    updated: '手动修改'
};

// Status colors for badges
export const STATUS_COLORS: Record<TransactionStatus, string> = {
    initialized: 'status-initialized',
    journaled: 'status-journaled',
    updated: 'status-updated'
};

// 税率标签 ct_rate: 0=非课税, 1=8%, 2=10%, 3=混合, 4=其の他
export const CT_RATE_LABELS: Record<number, string> = {
    0: '非课税',
    1: '8%',
    2: '10%',
    3: '混合',
    4: '其の他'
};

// Amount type labels (旧字段兼容)
export const AMOUNT_TYPE_LABELS: Record<1 | 2, string> = {
    1: '收入',
    2: '支出'
};

// Tax type labels (旧字段兼容)
export const TAX_TYPE_LABELS: Record<1 | 2, string> = {
    1: '非课税',
    2: '课税'
};

// Tax rate labels (旧字段兼容)
export const TAX_RATE_LABELS: Record<1 | 2 | 3 | 4, string> = {
    1: '8%',
    2: '10%',
    3: '8%10%混合',
    4: '其の他'
};

// Form input types
export interface TransactionInput {
    transaction_date: string;
    description: string;
    amount_total: number;
    amount_type: 1 | 2;
    tax_type: 1 | 2;
    tax_rate?: 1 | 2 | 3 | 4;
    tax_amount?: number;
}

export interface TransactionUpdate extends TransactionInput {
    id: string;
    debit_item?: string;
    credit_item?: string;
}

// Query parameters
export interface QueryParams {
    date_from?: string | null;
    date_to?: string | null;
    created_from?: string | null;
    created_to?: string | null;
    updated_from?: string | null;
    updated_to?: string | null;
    status_list?: TransactionStatus[];
}

// API Response types
export interface APIResponse<T> {
    status: 'successed' | 'failed';
    message: string;
    detail?: T;
}

export interface DeleteResult {
    requested_id: string;
    record_found: boolean;
    deleted_data: Transaction[] | null;
}

export interface AIJournalResult {
    processed_count: number;
    success_list: string[];
    failed_list: string[];
}

// Toast notification types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}
