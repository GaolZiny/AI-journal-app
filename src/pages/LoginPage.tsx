import { BookOpen, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../contexts/ToastContext';
import { signInWithEmail, signInWithGoogle } from '../services/firebase';

export function LoginPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email) {
            newErrors.email = '请输入邮箱';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = '邮箱格式不正确';
        }

        if (!password) {
            newErrors.password = '请输入密码';
        } else if (password.length < 6) {
            newErrors.password = '密码至少6位';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        const result = await signInWithEmail(email, password);
        setLoading(false);

        if (result.success) {
            showToast('success', '登录成功');
            navigate('/');
        } else {
            showToast('error', result.error || '登录失败');
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const result = await signInWithGoogle();
        setLoading(false);

        if (result.success) {
            showToast('success', '登录成功');
            navigate('/');
        } else {
            showToast('error', result.error || 'Google登录失败');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Logo */}
                <div className="flex justify-center">
                    <div className="w-14 h-14 bg-sky-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h1 className="mt-6 text-center text-2xl font-bold text-gray-900">
                    AI仕訳
                </h1>
                <p className="mt-2 text-center text-sm text-gray-500">
                    登录您的账户开始使用
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-sm rounded-2xl sm:px-10 border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="邮箱地址"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            icon={<Mail className="w-5 h-5" />}
                            error={errors.email}
                        />

                        <Input
                            label="密码"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            icon={<Lock className="w-5 h-5" />}
                            error={errors.password}
                        />

                        <div className="flex items-center justify-end">
                            <Link
                                to="/forgot-password"
                                className="text-sm text-sky-600 hover:text-sky-700 font-medium"
                            >
                                忘记密码？
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            loading={loading}
                            fullWidth
                            size="lg"
                        >
                            登录
                        </Button>
                    </form>

                    {/* 分割线 */}
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">或者</span>
                            </div>
                        </div>
                    </div>

                    {/* Google 登录 */}
                    <div className="mt-6">
                        <Button
                            variant="secondary"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            fullWidth
                            size="lg"
                            icon={
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            }
                        >
                            使用 Google 账户登录
                        </Button>
                    </div>

                    {/* 注册链接 */}
                    <p className="mt-6 text-center text-sm text-gray-500">
                        还没有账户？{' '}
                        <Link
                            to="/register"
                            className="text-sky-600 hover:text-sky-700 font-medium"
                        >
                            立即注册
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
