"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import Loader from '@/components/Loader';

export default function ForgotPasswordPage() {
  const primaryColor = "#002395";

  // State
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    setError("");
    return true;
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsLoading(true);

    try {
      const response = await fetch('YOUR_DJANGO_API_URL/api/password-reset/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || data.message || 'Failed to send reset email');
      }

      // Show success message instead of redirecting immediately
      setIsSubmitted(true);
    } catch (error: any) {
      setError(error.message || "Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Success View
  if (isSubmitted) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-green-100 p-3 rounded-full">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
        <p className="text-gray-600">
          We&apos;ve sent a password reset link to <br />
          <span className="font-semibold text-gray-900">{email}</span>
        </p>
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 font-bold hover:underline" 
          style={{ color: primaryColor }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Forgot Password?</h2>
        <p className="mt-2 text-sm text-gray-600">
          No worries, we&apos;ll send you reset instructions.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleResetRequest}>
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Email Address</label>
          <div className="mt-1 relative">
            <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              className="pl-10 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002395] outline-none" 
              placeholder="you@example.com" 
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{ backgroundColor: primaryColor }}
          className="w-full text-white p-3 rounded-lg font-bold hover:opacity-90 transition shadow-md flex items-center justify-center gap-2 min-h-[50px]"
        >
          {isLoading ? <Loader /> : "Reset Password"}
        </button>
      </form>

      <div className="text-center">
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-sm font-bold hover:underline" 
          style={{ color: primaryColor }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>
      </div>
    </div>
  );
}