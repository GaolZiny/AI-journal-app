import { BookOpen, CheckCircle, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../contexts/ToastContext';
import { sendPasswordReset } from '../services/firebase';

export function ForgotPasswordPage() {
    const { showToast } = useToast();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError('请输入邮箱');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('邮箱格式不正确');
            return;
        }

        setError('');
        setLoading(true);
        const result = await sendPasswordReset(email);
        setLoading(false);

        if (result.success) {
            setSent(true);
            showToast('success', '重置邮件已发送');
        } else {
            showToast('error', result.error || '发送失败');
        }
    };

    if (sent) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-10 px-6 shadow-sm rounded-2xl sm:px-10 border border-gray-100 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">
                            邮件已发送
                        </h2>
                        <p className="text-gray-500 mb-6">
                            我们已向 <span className="font-medium text-gray-900">{email}</span> 发送了密码重置链接，请查收邮件。
                        </p>
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
                        >
                            返回登录
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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
                    重置密码
                </h1>
                <p className="mt-2 text-center text-sm text-gray-500">
                    输入您的邮箱，我们将发送重置链接
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
                            error={error}
                        />

                        <Button
                            type="submit"
                            loading={loading}
                            fullWidth
                            size="lg"
                        >
                            发送重置链接
                        </Button>
                    </form>

                    {/* 返回登录 */}
                    <p className="mt-6 text-center text-sm text-gray-500">
                        记起密码了？{' '}
                        <Link
                            to="/login"
                            className="text-sky-600 hover:text-sky-700 font-medium"
                        >
                            返回登录
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
