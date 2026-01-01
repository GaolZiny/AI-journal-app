import { BookOpen, LogOut, Menu, User, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from '../../services/firebase';

export function Header() {
    const { user } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-semibold text-gray-900">
                            财会助手 Rigel
                        </span>
                    </div>

                    {/* 桌面端用户信息 */}
                    <div className="hidden sm:flex items-center gap-4">
                        <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                {user?.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt=""
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <User className="w-4 h-4 text-gray-500" />
                                )}
                            </div>
                            <span className="text-sm text-gray-700 font-medium max-w-[150px] truncate">
                                {user?.displayName || user?.email?.split('@')[0] || '用户'}
                            </span>
                        </div>

                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>退出</span>
                        </button>
                    </div>

                    {/* 移动端菜单按钮 */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="sm:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        {mobileMenuOpen ? (
                            <X className="w-5 h-5" />
                        ) : (
                            <Menu className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* 移动端菜单 */}
            {mobileMenuOpen && (
                <div className="sm:hidden border-t border-gray-100 bg-white animate-fade-in">
                    <div className="px-4 py-4 space-y-3">
                        <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                {user?.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt=""
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <User className="w-5 h-5 text-gray-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {user?.displayName || '用户'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {user?.email}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>退出登录</span>
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}
