// "use client";

// import { useState } from 'react';
// import { useSearchParams } from 'next/navigation';
// import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
// import Loader from '@/components/Loader';
// import Link from 'next/link';

// export default function ResetPasswordPage() {
//   const primaryColor = "#002395";
//   const searchParams = useSearchParams();
  
//   // Django typically needs the UID and Token from the URL
//   const uid = searchParams.get('uid');
//   const token = searchParams.get('token');

//   // State
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSuccess, setIsSuccess] = useState(false);
//   const [error, setError] = useState("");

//   const handlePasswordReset = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     // Validation
//     if (password.length < 8) {
//       setError("Password must be at least 8 characters.");
//       return;
//     }
//     if (password !== confirmPassword) {
//       setError("Passwords do not match.");
//       return;
//     }

//     setIsLoading(true);
//     setError("");

//     try {
//       const response = await fetch('YOUR_DJANGO_API_URL/api/password-reset-confirm/', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ 
//           uid, 
//           token, 
//           new_password: password 
//         }),
//       });

//       if (!response.ok) throw new Error("Link expired or invalid.");

//       setIsSuccess(true);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (isSuccess) {
//     return (
//       <div className="text-center space-y-6">
//         <div className="flex justify-center">
//           <CheckCircle2 className="h-12 w-12 text-green-500" />
//         </div>
//         <h2 className="text-2xl font-bold text-gray-900">Password Updated</h2>
//         <p className="text-gray-600">Your password has been reset successfully. You can now log in with your new credentials.</p>
//         <Link 
//           href="/login" 
//           className="block w-full text-white p-3 rounded-lg font-bold transition shadow-md"
//           style={{ backgroundColor: primaryColor }}
//         >
//           Sign In
//         </Link>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="text-center">
//         <h2 className="text-3xl font-extrabold text-gray-900">Set New Password</h2>
//         <p className="mt-2 text-sm text-gray-600">Enter a strong password to secure your account.</p>
//       </div>

//       <form className="space-y-4" onSubmit={handlePasswordReset}>
//         {error && (
//           <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
//             {error}
//           </div>
//         )}

//         {/* New Password Field */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700">New Password</label>
//           <div className="mt-1 relative">
//             <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
//             <input
//               type={showPassword ? "text" : "password"}
//               required
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="pl-10 pr-10 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002395] outline-none"
//               placeholder="••••••••"
//             />
//             <button
//               type="button"
//               onClick={() => setShowPassword(!showPassword)}
//               className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
//             >
//               {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
//             </button>
//           </div>
//         </div>

//         {/* Confirm Password Field */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
//           <div className="mt-1 relative">
//             <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
//             <input
//               type="password"
//               required
//               value={confirmPassword}
//               onChange={(e) => setConfirmPassword(e.target.value)}
//               className="pl-10 w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002395] outline-none"
//               placeholder="••••••••"
//             />
//           </div>
//         </div>

//         <button
//           type="submit"
//           disabled={isLoading}
//           style={{ backgroundColor: primaryColor }}
//           className="w-full text-white p-3 rounded-lg font-bold hover:opacity-90 transition shadow-md flex items-center justify-center gap-2 min-h-[50px]"
//         >
//           {isLoading ? <Loader /> : "Update Password"}
//         </button>
//       </form>
//     </div>
//   );
// }