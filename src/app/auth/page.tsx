'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/src/app/components/button';
import { signIn } from '@/src/app/auth/actions';

type MessageType = 'success' | 'error' | 'info';

interface Message {
    text: string;
    type: MessageType;
}

export default function AuthPage() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [fullName, setFullName] = useState<string>('');
    const [message, setMessage] = useState<Message | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    // Helper function to set different types of messages
    const setTypedMessage = (text: string, type: MessageType) => {
        setMessage({ text, type });
    };

    // Clear message
    const clearMessage = () => {
        setMessage(null);
    };

    // Validation function
    const validateForm = (): boolean => {
        if (!email || !password) {
            setTypedMessage('Please fill in all required fields.', 'error');
            return false;
        }

        if (isSignUp && !fullName.trim()) {
            setTypedMessage('Please enter your full name.', 'error');
            return false;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setTypedMessage('Please enter a valid email address.', 'error');
            return false;
        }

        // Password validation
        if (password.length < 6) {
            setTypedMessage('Password must be at least 6 characters long.', 'error');
            return false;
        }

        return true;
    };

    // Enhanced error handling function
    const handleAuthError = (error: any): void => {
        const errorMessage = error?.message || 'An unexpected error occurred';

        // Handle specific Supabase auth errors
        if (errorMessage.includes('Invalid login credentials')) {
            setTypedMessage('Invalid email or password. Please check your credentials and try again.', 'error');
        } else if (errorMessage.includes('User already registered')) {
            setTypedMessage('An account with this email already exists. Please sign in instead.', 'error');
            setIsSignUp(false); // Automatically switch to sign in mode
        } else if (errorMessage.includes('Email not confirmed')) {
            setTypedMessage('Please check your email and confirm your account before signing in.', 'error');
        } else if (errorMessage.includes('Password should be at least')) {
            setTypedMessage('Password must be at least 6 characters long.', 'error');
        } else if (errorMessage.includes('Invalid email')) {
            setTypedMessage('Please enter a valid email address.', 'error');
        } else if (errorMessage.includes('weak_password')) {
            setTypedMessage('Password is too weak. Please choose a stronger password.', 'error');
        } else if (errorMessage.includes('signup_disabled')) {
            setTypedMessage('Account registration is currently disabled. Please contact support.', 'error');
        } else if (errorMessage.includes('email_address_invalid')) {
            setTypedMessage('The email address format is invalid.', 'error');
        } else if (errorMessage.includes('over_email_send_rate_limit')) {
            setTypedMessage('Too many emails sent. Please wait a few minutes before trying again.', 'error');
        } else {
            // Generic error fallback
            setTypedMessage(errorMessage, 'error');
        }
    };

    // --- The Main Authentication Logic ---
    const handleAuthAction = async () => {
        setIsSubmitting(true);
        clearMessage();

        if (isSignUp) {
            // --- Sign-Up Logic (Client-side) ---
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName },
                    emailRedirectTo: `${location.origin}/auth/callback`,
                },
            });

            if (error) {
                if (error.message.includes('User already registered')) {
                    setTypedMessage('An account with this email already exists. Please sign in instead.', 'error');
                    setIsSignUp(false);
                } else {
                    setTypedMessage(error.message, 'error');
                }
            } else {
                setTypedMessage('Account created! Please check your email for the confirmation link.', 'success');
            }
        } else {
            // --- Sign-In Logic (Server-side for role check) ---
            const result = await signIn(email, password);
            if (result.success && result.redirectPath) {
                setTypedMessage('Signed in successfully! Redirecting...', 'success');
                router.push(result.redirectPath);
                router.refresh();
            } else {
                setTypedMessage(result.message, 'error');
                if (result.isUserNotFound) {
                    setIsSignUp(true);
                }
            }
        }
        setIsSubmitting(false);
    };


    // Handle form submission on Enter key
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isSubmitting) {
            handleAuthAction();
        }
    };

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Toggle between sign up and sign in
    const toggleAuthMode = () => {
        setIsSignUp(!isSignUp);
        clearMessage();
        // Optionally clear form fields when switching modes
        setEmail('');
        setPassword('');
        setFullName('');
    };

    // Get message styling based on type
    const getMessageStyle = (type: MessageType): string => {
        switch (type) {
            case 'success':
                return 'text-green-400 bg-green-400/10 border border-green-400/20';
            case 'error':
                return 'text-red-400 bg-red-400/10 border border-red-400/20';
            case 'info':
                return 'text-blue-400 bg-blue-400/10 border border-blue-400/20';
            default:
                return 'text-yellow-300 bg-yellow-300/10 border border-yellow-300/20';
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="text-3xl font-bold tracking-wider text-white hover:text-amber-200 transition-colors" style={{ textShadow: '0 0 5px white' }}>
                        ASCEND
                    </Link>
                    <h1 className="text-2xl font-bold text-white mt-6">
                        {isSignUp ? 'Create an Account' : 'Welcome Back'}
                    </h1>
                    <p className="text-amber-400 text-sm uppercase font-semibold">
                        {isSignUp ? 'JOIN THE ELITE' : 'SIGN IN TO CONTINUE'}
                    </p>
                </div>

                <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-700 space-y-6 backdrop-blur-sm">
                    {isSignUp && (
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-semibold leading-6 text-white">
                                Full Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="e.g., John Doe"
                                required={isSignUp}
                                disabled={isSubmitting}
                                className="mt-2 block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold leading-6 text-white">
                            Email Address <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="you@example.com"
                            required
                            disabled={isSubmitting}
                            className="mt-2 block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold leading-6 text-white">
                            Password <span className="text-red-400">*</span>
                        </label>
                        <div className="relative mt-2">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="••••••••"
                                required
                                disabled={isSubmitting}
                                minLength={6}
                                className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 pr-10 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                disabled={isSubmitting}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {isSignUp && (
                            <p className="mt-1 text-xs text-gray-400">Password must be at least 6 characters long</p>
                        )}
                    </div>

                    {message && (
                        <div className={`text-sm text-center p-3 rounded-lg ${getMessageStyle(message.type)}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="pt-2">
                        <Button
                            onClick={handleAuthAction}
                            disabled={isSubmitting}
                            className="w-full"
                        >
                            {isSubmitting ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                        </Button>
                    </div>

                    <p className="text-center text-sm text-gray-400">
                        {isSignUp ? "Already have an account?" : "Don't have an account?"}
                        <button
                            onClick={toggleAuthMode}
                            disabled={isSubmitting}
                            className="ml-2 font-semibold text-amber-400 hover:text-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up Now'}
                        </button>
                    </p>
                </div>

                <p className="mt-8 text-center text-sm text-gray-400">
                    <Link href="/" className="font-semibold leading-6 text-amber-400 hover:text-amber-300 transition-colors">
                        &larr; Back to Home
                    </Link>
                </p>
            </div>
        </div>
    );
}