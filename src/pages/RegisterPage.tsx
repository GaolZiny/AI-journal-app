import { BookOpen, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../contexts/ToastContext';
import { signUpWithEmail } from '../services/firebase';

export function RegisterPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

    const validate = () => {
        const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};

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

        if (password !== confirmPassword) {
            newErrors.confirmPassword = '两次密码不一致';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        const result = await signUpWithEmail(email, password);
        setLoading(false);

        if (result.success) {
            showToast('success', '注册成功');
            navigate('/');
        } else {
            showToast('error', result.error || '注册失败');
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
                    创建新账户
                </h1>
                <p className="mt-2 text-center text-sm text-gray-500">
                    注册账户开始使用 AI仕訳
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
                            helperText="密码至少6位"
                        />

                        <Input
                            label="确认密码"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            icon={<Lock className="w-5 h-5" />}
                            error={errors.confirmPassword}
                        />

                        <Button
                            type="submit"
                            loading={loading}
                            fullWidth
                            size="lg"
                        >
                            注册
                        </Button>
                    </form>

                    {/* 登录链接 */}
                    <p className="mt-6 text-center text-sm text-gray-500">
                        已有账户？{' '}
                        <Link
                            to="/login"
                            className="text-sky-600 hover:text-sky-700 font-medium"
                        >
                            立即登录
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
