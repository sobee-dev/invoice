"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'; 
import { FcGoogle } from 'react-icons/fc';
import Loader from '@/components/Loader';
import api from '@/lib/axios';
import { performInitialSync } from '@/lib/sync';
import { useRouter } from 'next/navigation';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function RegisterPage() {
  
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
  
    
    const response = await api.post("/api/users/register/",{ email, password });
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
        console.error("Registration detail:", error.response?.data);

        const serverMessage = 
          error.response?.data?.email?.[0] || // Common Django/DRF error format
          error.response?.data?.detail || 
          error.response?.data?.message || 
          "An error occurred during registration.";
        
        setError(serverMessage);
      } finally {
        setIsLoading(false);
      }
    };


  

  if (isLoading) {return <Loader />}
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Get Started</h2>
        <p className="mt-2 text-sm text-gray-600">Create your free account today</p>
      </div>

      <form className="space-y-4" onSubmit={handleRegister}>
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
          <label className="block text-sm font-medium text-gray-700">Password</label>
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
          
          className="w-full text-white bg-primary p-3 rounded-lg font-bold hover:opacity-90 transition shadow-md flex items-center justify-center gap-2"
        >
           Register
        </button>        

      </form>

      <div className="relative my-6 text-center">
        <span className="text-sm text-gray-500">Sign up with Google for faster access</span>
      </div>

     <GoogleAuthButton label="Continue with Google" />

      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="font-bold hover:underline " >
          Log in
        </Link>
      </p>
      
    </div>
  );
}