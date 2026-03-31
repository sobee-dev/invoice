"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'; 
import { FcGoogle } from "react-icons/fc";
import Loader from '@/components/Loader';
import  api  from '@/lib/axios';
import { performInitialSync } from '@/lib/sync';
import { useRouter } from "next/navigation";


export default function LoginPage() {
  
  const router = useRouter();
  // State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Validation Logic
  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!password) {
      setError("Password is required.");
      return false;
    }
    setError("");
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError("");
 
    try {
      const response = await api.post("/api/users/login/",{ email, password });
      console.log("Full Response:", response);
      const data = response.data;
      const token = data.access;
      const refreshToken = data.refresh;
      
      if (token && refreshToken) {
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
    }
      console.log("Starting sync...");
      await performInitialSync(data); 
      console.log("Sync finished.");
    
      window.location.replace("/dashboard");

    } catch (error: any) {
      console.error("Caught error:", error);
      const serverMessage = error.response?.data?.detail || error.response?.data?.message;
      setError(serverMessage || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    
     window.location.href = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/`;
  };



  if (isLoading) {return <Loader />}

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Welcome Back</h2>
        <p className="mt-2 text-sm text-gray-600">Please enter your details to sign in</p>
      </div>

      <form className="space-y-4" onSubmit={handleLogin}>
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
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

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <Link href="/forgot-password"  className="text-xs font-semibold hover:underline text-blue-500" >
              Forgot password?
            </Link>
          </div>
          <div className="mt-1 relative">
            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002395] outline-none"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white p-3 rounded-lg font-bold hover:opacity-90 transition shadow-md flex items-center justify-center gap-2 min-h-[50px]"
        >
           Log In
        </button>

        

      </form>

      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
        <span className="relative px-2 bg-white text-sm text-gray-500">Or continue with Google</span>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
      >
        <FcGoogle className="h-5 w-5" /> Google
      </button>

      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-bold hover:underline " >
          Register
        </Link>
      </p>
    </div>
  );
}