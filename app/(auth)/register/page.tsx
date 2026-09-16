"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Loader from '@/components/Loader';
import api from '@/lib/axios';
import { performInitialSync } from '@/lib/sync';
import { useRouter } from 'next/navigation';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }
    setError("");
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post("/api/users/register/", { email, password });
      const data = response.data;

      if (response.status === 201) {
        localStorage.setItem('token', data.tokens.access);
        localStorage.setItem('refreshToken', data.tokens.refresh);

        await performInitialSync(data);
        window.location.replace("/dashboard");
      } else {
        throw new Error("No tokens received from server");
      }
    } catch (error: any) {
      const serverMessage =
        error.response?.data?.email?.[0] ||
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "An error occurred during registration.";
      setError(serverMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#1b1b1f] tracking-tight">Get Started</h2>
        <p className="mt-1.5 text-sm text-[#45464f]">Create your free account today</p>
      </div>

      <form className="space-y-4" onSubmit={handleRegister}>
        {/* Error */}
        {error && (
          <div className="p-3 text-sm text-[#ba1a1a] bg-[#ffdad6] rounded-lg border border-[#f9b4ae]">
            {error}
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-[#45464f] uppercase tracking-wider mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757680]" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 w-full h-12 px-4 border border-[#dee2e6] text-[#1b1b1f] rounded-lg focus:border-[#1b2e5e] focus:outline-none transition-colors"
              placeholder="you@example.com"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-[#45464f] uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757680]" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 w-full h-12 px-4 border border-[#dee2e6] text-[#1b1b1f] rounded-lg focus:border-[#1b2e5e] focus:outline-none transition-colors"
              placeholder="Min. 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757680] hover:text-[#45464f]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-[#1b2e5e] hover:bg-[#011848] text-white rounded-lg font-semibold transition-colors shadow-[0px_2px_4px_rgba(27,46,94,0.15)] flex items-center justify-center gap-2"
        >
          Create Account
        </button>
      </form>

      {/* Divider */}
      <div className="relative text-center">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#c5c6d0]"></span>
        </div>
        <span className="relative px-3 bg-white text-xs text-[#757680]">Or sign up with Google</span>
      </div>

      <GoogleAuthButton label="Continue with Google" />

      <p className="text-center text-sm text-[#45464f]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#1b2e5e] hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
