'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { t, getLanguage } from '@/lib/i18n'

type Language = 'en' | 'es';

export default function LoginPage() {
    const router = useRouter()
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [lang] = useState<Language>(getLanguage())
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong')
            }

            router.refresh()
            router.push('/dashboard')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const toggleMode = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsLogin(!isLogin)
        setError('')
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center font-display antialiased"
            style={{ background: 'var(--color-bg-base)' }}
        >
            <div className="w-full max-w-md p-6">
                {/* Logo and Title */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-white">
                            <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill="currentColor" fillOpacity="0.3"/>
                            <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                            <path d="M12 6L8 9V15L12 18L16 15V9L12 6Z" fill="currentColor"/>
                        </svg>
                    </div>
                    <h1
                        className="text-3xl font-bold"
                        style={{ color: 'var(--color-text-primary)' }}
                    >Aure</h1>
                    <p
                        className="mt-2"
                        style={{ color: 'var(--color-text-secondary)' }}
                    >
                        {isLogin ? t('login.welcomeBack') : t('login.createAccount')}
                    </p>
                </div>

                {/* Main Card */}
                <div
                    className="border rounded-xl p-8"
                    style={{
                        background: 'var(--color-bg-surface)',
                        borderColor: 'var(--color-border)',
                        boxShadow: 'var(--shadow-lg)',
                    }}
                >
                    {error && (
                        <div
                            className="mb-4 p-3 border rounded text-sm text-center"
                            style={{
                                background: 'color-mix(in srgb, var(--color-danger) 12%, transparent)',
                                borderColor: 'var(--color-danger)',
                                color: 'var(--color-danger)',
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                className="block text-sm font-medium mb-1.5"
                                style={{ color: 'var(--color-text-secondary)' }}
                                htmlFor="email"
                            >{t('login.emailLabel')}</label>
                            <div className="relative">
                                <span
                                    className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-lg"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >mail_outline</span>
                                <input
                                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                    style={{
                                        background: 'var(--color-bg-input)',
                                        borderColor: 'var(--color-border)',
                                        color: 'var(--color-text-primary)',
                                    }}
                                    id="email"
                                    type="email"
                                    placeholder={t('login.emailPlaceholder')}
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        {!isLogin && (
                            <div>
                                <label
                                    className="block text-sm font-medium mb-1.5"
                                    style={{ color: 'var(--color-text-secondary)' }}
                                    htmlFor="name"
                                >{t('login.nameLabel')}</label>
                                <div className="relative">
                                    <span
                                        className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-lg"
                                        style={{ color: 'var(--color-text-muted)' }}
                                    >person_outline</span>
                                    <input
                                        className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                        style={{
                                            background: 'var(--color-bg-input)',
                                            borderColor: 'var(--color-border)',
                                            color: 'var(--color-text-primary)',
                                        }}
                                        id="name"
                                        type="text"
                                        placeholder={t('login.namePlaceholder')}
                                        required={!isLogin}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label
                                className="block text-sm font-medium mb-1.5"
                                style={{ color: 'var(--color-text-secondary)' }}
                                htmlFor="password"
                            >{t('login.passwordLabel')}</label>
                            <div className="relative">
                                <span
                                    className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-lg"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >lock_open</span>
                                <input
                                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                    style={{
                                        background: 'var(--color-bg-input)',
                                        borderColor: 'var(--color-border)',
                                        color: 'var(--color-text-primary)',
                                    }}
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    className="h-4 w-4 text-primary focus:ring-primary rounded"
                                    style={{ borderColor: 'var(--color-border)' }}
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                />
                                <label
                                    className="ml-2 block text-sm"
                                    style={{ color: 'var(--color-text-secondary)' }}
                                    htmlFor="remember-me"
                                >{t('login.rememberMe')}</label>
                            </div>
                            <div className="text-sm">
                                <a className="font-medium text-primary hover:text-primary/80 transition-colors" href="#">{t('login.forgotPassword')}</a>
                            </div>
                        </div>

                        <button
                            className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? t('login.processing') : (isLogin ? t('login.logIn') : t('login.signUp'))}
                        </button>
                    </form>

                    <p
                        className="mt-10 text-center text-sm"
                        style={{ color: 'var(--color-text-secondary)' }}
                    >
                        {isLogin ? t('login.noAccount') : t('login.hasAccount')}
                        <button onClick={toggleMode} className="font-semibold text-primary hover:text-primary/80 transition-colors">
                            {isLogin ? t('login.signUpFree') : t('login.logInLink')}
                        </button>
                    </p>

                    <div className="mt-12 flex justify-center space-x-6">
                        <a className="text-xs login-footer-link" style={{ color: 'var(--color-text-muted)' }} href="#">{t('login.privacyPolicy')}</a>
                        <a className="text-xs login-footer-link" style={{ color: 'var(--color-text-muted)' }} href="#">{t('login.termsOfService')}</a>
                        <a className="text-xs login-footer-link" style={{ color: 'var(--color-text-muted)' }} href="#">{t('login.support')}</a>
                    </div>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="hidden lg:block fixed top-0 right-0 p-12 opacity-20 pointer-events-none">
                <div className="grid grid-cols-4 gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/30"></div>
                    <div className="w-12 h-12 rounded-lg bg-primary/10"></div>
                    <div className="w-12 h-12 rounded-lg bg-primary/20"></div>
                    <div className="w-12 h-12 rounded-lg bg-primary/40"></div>
                    <div className="w-12 h-12 rounded-lg bg-primary/10"></div>
                    <div className="w-12 h-12 rounded-lg bg-primary/30"></div>
                    <div className="w-12 h-12 rounded-lg bg-primary/10"></div>
                    <div className="w-12 h-12 rounded-lg bg-primary/20"></div>
                </div>
            </div>
        </div>
    )
}
