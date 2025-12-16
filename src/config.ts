// 运行时配置
// 优先使用 Docker 运行时注入的配置，否则使用 Vite 构建时的环境变量

interface RuntimeConfig {
    FIREBASE_API_KEY: string;
    FIREBASE_AUTH_DOMAIN: string;
    FIREBASE_PROJECT_ID: string;
    FIREBASE_STORAGE_BUCKET: string;
    FIREBASE_MESSAGING_SENDER_ID: string;
    FIREBASE_APP_ID: string;
    N8N_BASE_URL: string;
}

// 声明全局运行时配置类型
declare global {
    interface Window {
        __RUNTIME_CONFIG__?: Partial<RuntimeConfig>;
    }
}

// 获取配置值：优先运行时配置，否则使用构建时环境变量
const getConfig = (): RuntimeConfig => {
    const runtime = window.__RUNTIME_CONFIG__ || {};

    return {
        FIREBASE_API_KEY: runtime.FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY || '',
        FIREBASE_AUTH_DOMAIN: runtime.FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
        FIREBASE_PROJECT_ID: runtime.FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
        FIREBASE_STORAGE_BUCKET: runtime.FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
        FIREBASE_MESSAGING_SENDER_ID: runtime.FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        FIREBASE_APP_ID: runtime.FIREBASE_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID || '',
        N8N_BASE_URL: runtime.N8N_BASE_URL || import.meta.env.VITE_N8N_BASE_URL || ''
    };
};

export const config = getConfig();
