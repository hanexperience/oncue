"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, HelpCircle, Users, LayoutTemplate, BarChart3, Zap } from "lucide-react";
import { UserButton, SignedIn, SignedOut, SignUpButton, SignInButton } from "@clerk/nextjs";
import { useBooking } from "../context/BookingContext";

export default function Navbar() {
  const pathname = usePathname();
  const { userRole } = useBooking();

  const isActive = (path: string) => pathname === path ? "text-black bg-gray-100" : "text-gray-500 hover:text-black";

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 z-50 flex justify-between items-center">
      
      {/* 1. LOGO */}
      <div>
        <Link href="/" className="font-bold text-xl tracking-tighter">
          ON CUE
        </Link>
        <p className="text-xs text-gray-800">In Development</p>
      </div>

      {/* 2. CENTER LINKS (Context Aware) */}
      <div className="hidden md:flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-full shadow-sm">
        <SignedIn>
            {/* If Logged In: Show Tools */}
            {userRole === 'brand' ? (
                <>
                    <Link href="/"><button className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive('/')}`}>Marketplace</button></Link>
                    <Link href="/agency"><button className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive('/agency')}`}>Agency</button></Link>
                    <Link href="/analytics"><button className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive('/analytics')}`}>Data</button></Link>
                </>
            ) : (
                <>
                    <Link href="/"><button className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive('/')}`}>Marketplace</button></Link>
                    <Link href="/dashboard"><button className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive('/dashboard')}`}>Dashboard</button></Link>
                    <Link href="/studio"><button className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive('/studio')}`}>Studio</button></Link>
                </>
            )}
        </SignedIn>

        <SignedOut>
            {/* If Logged Out: Show Marketing Links */}
            <Link href="/"><button className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive('/')}`}>Search Talent</button></Link>
            <Link href="/how-it-works"><button className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive('/how-it-works')}`}>How it Works</button></Link>
            <Link href="/pricing"><button className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive('/pricing')}`}>Pricing</button></Link>
        </SignedOut>
      </div>

      {/* 3. RIGHT SIDE ACTIONS */}
      <div className="flex items-center gap-4">
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <button className="text-sm font-bold text-gray-600 hover:text-black">Log in</button>
          </SignInButton>
          
          <div className="h-4 w-[1px] bg-gray-300"></div>

          {/* JOIN AS CREATOR (Redirects to Onboarding with Role=Creator) */}
          <SignUpButton mode="modal" forceRedirectUrl="/onboarding?role=creator">
            <button className="text-sm font-bold text-gray-600 hover:text-black">Join as Creator</button>
          </SignUpButton>

          {/* JOIN AS BRAND (Redirects to Onboarding with Role=Brand) */}
          <SignUpButton mode="modal" forceRedirectUrl="/onboarding?role=brand">
            <button className="bg-black text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition shadow-lg">
              Join as Brand
            </button>
          </SignUpButton>
        </SignedOut>
      </div>
    </nav>
  );
}