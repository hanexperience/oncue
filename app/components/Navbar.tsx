"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserCircle } from "lucide-react";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useBooking } from "../context/BookingContext";

export default function Navbar() {
  const pathname = usePathname();
  const { userRole } = useBooking();

  // Highlight logic for active links
  const isActive = (path: string) => 
    pathname === path ? "text-black bg-gray-100" : "text-gray-500 hover:text-black";

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/0 backdrop-blur-md border-b border-gray-200 px-6 py-3 z-50 flex justify-between items-center">
      
      {/* 1. LOGO SECTION */}
      <div className="flex items-center">
        <Link href="/" className="group flex flex-col items-start leading-none">
          <div className="flex items-center gap-2">
            <span className="text-gray-900 font-light text-3xl tracking-tighter leading-none">
              [ · ]
            </span>
            <span className="text-[18px] font-light tracking-[0.2em] text-gray-500 uppercase leading-none self-center pt-1">
              On Cue
            </span>
          </div>
          <span className="text-[9px] font-bold text-gray-400 tracking-[0.4em] uppercase mt-1 ml-1">
            Beta
          </span>
        </Link>
      </div>

      {/* 2. CENTER LINKS */}
      <div className="hidden md:flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-full shadow-sm">
        <SignedIn>
            {userRole === 'brand' ? (
                <>
                    <Link href="/"><button className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive('/')}`}>Marketplace</button></Link>
                    <Link href="/agency"><button className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive('/agency')}`}>Agency</button></Link>
                    <Link href="/analytics"><button className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive('/analytics')}`}>Data</button></Link>
                    <Link href="/pricing"><button className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive('/pricing')}`}>Pricing</button></Link>
                </>
            ) : (
                <>
                    {/* <Link href="/"><button className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive('/')}`}>Marketplace</button></Link>*/}
                    <Link href="/dashboard"><button className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive('/dashboard')}`}>Dashboard</button></Link>
                    <Link href="/studio"><button className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive('/studio')}`}>Studio</button></Link>
                    <Link href="/pricing"><button className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive('/pricing')}`}>Pricing</button></Link>
                </>
            )}
        </SignedIn>

        <SignedOut>
            <Link href="/"><button className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive('/')}`}>Search Talent</button></Link>
            <Link href="/brands"><button className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive('/brands')}`}>For Brands</button></Link>
            <Link href="/pricing"><button className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive('/pricing')}`}>Pricing</button></Link>
        </SignedOut>
      </div>

      {/* 3. RIGHT SIDE ACTIONS */}
      <div className="flex items-center gap-2">
        <SignedIn>
          <UserButton afterSignOutUrl="/">
            <UserButton.MenuItems>
                <UserButton.Action 
                  label="Manage Profile" 
                  labelIcon={<UserCircle size={14} />}
                  onClick={() => window.location.href = '/dashboard/profile'} 
                />
                <UserButton.Action label="manageAccount" />
                <UserButton.Action label="signOut" />
            </UserButton.MenuItems>
          </UserButton>
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-black transition">Log in</button>
          </SignInButton>
          
          <div className="h-4 w-[1px] bg-gray-300 mx-2"></div>

          {/* Harmonized Join Buttons */}
          <Link href="/creators">
            <button className={`px-4 py-2 rounded-full text-sm font-bold transition ${isActive('/creators')}`}>
              Join as Creator
            </button>
          </Link>

          <Link href="/brands">
            <button className={`px-4 py-2 rounded-full text-sm font-bold transition ${isActive('/brands')}`}>
              Join as Brand
            </button>
          </Link>
        </SignedOut>
      </div>
    </nav>
  );
}