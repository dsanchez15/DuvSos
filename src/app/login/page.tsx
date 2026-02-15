'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong')
            }

            // Refresh router to update middleware/server components
            router.refresh()
            router.push('/')
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
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center font-display antialiased">
            {/* Login Container */}
            <div className="w-full max-w-md p-6">
                {/* Logo and Title Area */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-xl mb-4">
                        <span className="material-icons text-primary text-4xl">check_circle</span>
                    </div>
                    <h1 className="text-3xl font-bold text-background-dark dark:text-background-light">HabitFlow</h1>
                    <p className="mt-2 text-background-dark/60 dark:text-background-light/60">
                        {isLogin ? "Welcome back! Let's track your progress." : "Create an account to start tracking."}
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-background-dark/40 border border-background-dark/5 dark:border-background-light/10 rounded-xl shadow-xl shadow-background-dark/5 p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium text-background-dark/80 dark:text-background-light/80 mb-1.5" htmlFor="email">Email Address</label>
                            <div className="relative">
                                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-background-dark/40 dark:text-background-light/40 text-lg">mail_outline</span>
                                <input
                                    className="w-full pl-10 pr-4 py-2.5 bg-background-light/50 dark:bg-background-dark/50 border border-background-dark/10 dark:border-background-light/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-background-dark dark:text-background-light placeholder:text-background-dark/30"
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Name Field (Register only) */}
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-background-dark/80 dark:text-background-light/80 mb-1.5" htmlFor="name">Full Name</label>
                                <div className="relative">
                                    <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-background-dark/40 dark:text-background-light/40 text-lg">person_outline</span>
                                    <input
                                        className="w-full pl-10 pr-4 py-2.5 bg-background-light/50 dark:bg-background-dark/50 border border-background-dark/10 dark:border-background-light/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-background-dark dark:text-background-light placeholder:text-background-dark/30"
                                        id="name"
                                        type="text"
                                        placeholder="John Doe"
                                        required={!isLogin}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-background-dark/80 dark:text-background-light/80 mb-1.5" htmlFor="password">Password</label>
                            <div className="relative">
                                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-background-dark/40 dark:text-background-light/40 text-lg">lock_open</span>
                                <input
                                    className="w-full pl-10 pr-4 py-2.5 bg-background-light/50 dark:bg-background-dark/50 border border-background-dark/10 dark:border-background-light/10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-background-dark dark:text-background-light placeholder:text-background-dark/30"
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Remember & Forgot */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input className="h-4 w-4 text-primary focus:ring-primary border-background-dark/20 rounded" id="remember-me" name="remember-me" type="checkbox" />
                                <label className="ml-2 block text-sm text-background-dark/70 dark:text-background-light/70" htmlFor="remember-me">
                                    Remember me
                                </label>
                            </div>
                            <div className="text-sm">
                                <a className="font-medium text-primary hover:text-primary/80 transition-colors" href="#">Forgot password?</a>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
                        </button>
                    </form>

                    {/* Create Account Link */}
                    <p className="mt-10 text-center text-sm text-background-dark/60 dark:text-background-light/60">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button onClick={toggleMode} className="font-semibold text-primary hover:text-primary/80 transition-colors">
                            {isLogin ? 'Sign up for free' : 'Log in'}
                        </button>
                    </p>

                    {/* Footer */}
                    <div className="mt-12 flex justify-center space-x-6">
                        <a className="text-xs text-background-dark/40 dark:text-background-light/40 hover:text-primary" href="#">Privacy Policy</a>
                        <a className="text-xs text-background-dark/40 dark:text-background-light/40 hover:text-primary" href="#">Terms of Service</a>
                        <a className="text-xs text-background-dark/40 dark:text-background-light/40 hover:text-primary" href="#">Support</a>
                    </div>
                </div>
            </div>

            {/* Decorative Elements (Hidden on mobile) */}
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
