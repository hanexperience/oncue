"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "@clerk/nextjs";
import { Clock, AlertCircle, ChevronRight, Copy, Globe, CheckCircle, Share2, Calendar } from "lucide-react";
import { formatLocalTime } from "../lib/dateUtils";

export default function DashboardPage() {
  const { user } = useUser();
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      // 1. Fetch Profile (to get the handle for sharing)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('handle, name')
        .eq('id', user.id)
        .single();
      
      if (profileData) setProfile(profileData);

      // 2. Fetch Bookings
      const { data: bookingData } = await supabase
        .from('bookings')
        .select(`*, brand:brand_id (name, avatar_url)`)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      
      if (bookingData) setOrders(bookingData);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleStatus = async (id: number, newStatus: string) => {
     // Optimistic UI Update
     setOrders(prev => prev.map(o => o.id === id ? {...o, status: newStatus} : o));
     await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
  };

const copyLink = () => {
     // Safety check: Ensure profile exists
     if (!profile?.handle) {
         alert("Error: No handle found. Please edit your profile to set a handle.");
         return;
     }

     // Construct URL: Use window.location.origin to get "https://your-site.com" dynamically
     const origin = typeof window !== 'undefined' ? window.location.origin : '';
     const url = `${origin}/marketplace/${profile.handle}`;
     
     navigator.clipboard.writeText(url).then(() => {
         setCopied(true);
         setTimeout(() => setCopied(false), 2000);
     }).catch(err => {
         console.error('Failed to copy:', err);
         alert("Failed to copy link.");
     });
  };

  if (loading) return (
    <div className="space-y-4 p-4">
       <div className="h-48 bg-gray-100 rounded-3xl animate-pulse" />
       <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  );

  const hasActiveOrders = orders.some(o => o.status === 'APPROVED');
  const pendingOrders = orders.filter(o => o.status === 'PENDING');

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      
      {/* 1. HERO SECTION */}
      {hasActiveOrders ? (
        // --- CASE A: HAS ORDERS (Existing Logic) ---
        orders.filter(o => o.status === 'APPROVED').map(order => (
            <div key={order.id} className="bg-black text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-widest text-xs mb-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Upcoming Stream
                  </div>
                  <h2 className="text-3xl font-serif font-bold mb-2">{order.project_name}</h2>
                  <div className="flex items-center gap-4 text-gray-400 text-sm">
                    <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-white">
                        <Clock size={14}/> {formatLocalTime(order.scheduled_at)}
                    </span>
                  </div>
               </div>

               <div className="relative z-10 w-full md:w-auto">
                  <Link href={`/studio/${order.id}`}>
                    <button className="w-full bg-white text-black px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-lg">
                         Enter Studio <ChevronRight size={18} />
                    </button>
                  </Link>
               </div>
               
               {/* Background Glow */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-gray-800 rounded-full blur-3xl opacity-30 translate-x-1/3 -translate-y-1/3 group-hover:bg-gray-700 transition duration-1000"></div>
            </div>
        ))
      ) : (
        // --- CASE B: NEW USER (Empty State) ---
        <div className="bg-gradient-to-br from-gray-900 to-black text-white p-10 rounded-3xl shadow-2xl relative overflow-hidden text-center md:text-left">
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-md">
                 <h2 className="text-3xl font-serif font-bold mb-4">Welcome to On Cue.</h2>
                 <p className="text-gray-400 mb-8 leading-relaxed">
                    You're all set up! Once we've launched, Share your profile link with brands or on your socials to start accepting paid booking requests.
                 </p>
                 
                 {/* COPY LINK BAR */}
                 <div className="flex items-center gap-2 bg-white/10 p-2 pl-4 rounded-full border border-white/20 w-full max-w-sm group hover:bg-white/15 transition-colors cursor-pointer" onClick={copyLink}>
                    <Globe size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-200 truncate flex-1 font-mono">
                       {/* Show cleaner URL in UI */}
                       oncue.com/creator/<span className="text-white font-bold">{profile?.handle || '...'}</span>
                    </span>
                    <button 
                       className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:scale-105 active:scale-95 transition flex items-center gap-2"
                    >
                       {copied ? <CheckCircle size={14} className="text-green-600"/> : <Copy size={14}/>}
                       {copied ? 'Copied' : 'Copy'}
                    </button>
                 </div>
              </div>
              
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm hidden md:block">
                  <div className="flex items-center gap-3 mb-2 opacity-50">
                     <div className="w-2 h-2 rounded-full bg-green-500"></div>
                     <span className="text-xs font-bold uppercase tracking-widest">Status</span>
                  </div>
                  <div className="text-xl font-bold">Accepting Bookings</div>
              </div>
           </div>
           
           {/* Decorative */}
           <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-900/40 rounded-full blur-[100px]"></div>
        </div>
      )}

      {/* 2. PENDING REQUESTS */}
      <div>
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            Requests 
            {pendingOrders.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingOrders.length}</span>}
        </h3>
        
        {pendingOrders.length === 0 ? (
           <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-400">
               <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Calendar size={20} className="opacity-50"/>
               </div>
               <p className="font-medium">No pending requests.</p>
               <p className="text-sm mt-1">New offers will appear here.</p>
           </div>
        ) : (
           <div className="grid gap-4">
             {pendingOrders.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                   <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden">
                          {order.brand?.avatar_url ? <img src={order.brand.avatar_url} /> : <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">{order.brand?.name?.[0]}</div>}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{order.project_name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                            {order.brand?.name} • <span className="font-bold text-black">${order.price}</span>
                        </div>
                        <div className="text-xs text-blue-600 font-bold mt-1 bg-blue-50 px-2 py-0.5 rounded-md w-fit">
                           {formatLocalTime(order.scheduled_at)}
                        </div>
                      </div>
                   </div>
                   <div className="flex gap-3 w-full md:w-auto">
                     <button onClick={() => handleStatus(order.id, 'DECLINED')} className="flex-1 md:flex-none px-6 py-3 border border-gray-200 text-gray-600 text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 rounded-xl transition">Decline</button>
                     <button onClick={() => handleStatus(order.id, 'APPROVED')} className="flex-1 md:flex-none px-8 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 shadow-lg transition transform active:scale-95">Accept Job</button>
                   </div>
                </div>
             ))}
           </div>
        )}
      </div>

    </div>
  );
}