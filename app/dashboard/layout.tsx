"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart3, UserCircle, ExternalLink } from "lucide-react";
import Navbar from "../components/Navbar";
import { useUser } from "@clerk/nextjs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();

  const isActive = (path: string) => pathname === path ? "bg-black text-white" : "text-gray-500 hover:bg-gray-100";

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-black">
      <Navbar />
      
      <main className="pt-24 pb-20 max-w-6xl mx-auto px-6">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Creator Dashboard</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
               <span>{user?.fullName}</span>
               <span className="text-gray-300">•</span>
               <Link href={`/marketplace/${user?.id}`} target="_blank" className="flex items-center gap-1 text-blue-600 hover:underline">
                 View Public Profile <ExternalLink size={12} />
               </Link>
            </div>
          </div>
          
          {/* Sub Navigation */}
          <div className="flex gap-2 mt-4 md:mt-0">
             <Link href="/dashboard">
               <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/dashboard')}`}>
                 <LayoutDashboard size={16} /> Orders
               </button>
             </Link>
             <Link href="/dashboard/insights">
               <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/dashboard/insights')}`}>
                 <BarChart3 size={16} /> Insights
               </button>
             </Link>
             <Link href="/dashboard/profile">
               <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/dashboard/profile')}`}>
                 <UserCircle size={16} /> Edit Profile
               </button>
             </Link>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}