"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "@clerk/nextjs";
import { Bell, Calendar, ChevronRight, PlayCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import { formatLocalTime } from "../lib/dateUtils";

export default function BrandDashboard() {
  const { user } = useUser();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Brand's Bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('bookings')
        .select(`*, creator:creator_id (name, handle, avatar_url)`)
        .eq('brand_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setBookings(data);
      setLoading(false);
    };
    fetchBookings();
  }, [user]);

  // Group bookings for clean UI
  const liveBookings = bookings.filter(b => b.status === 'LIVE');
  const activeBookings = bookings.filter(b => b.status === 'APPROVED' || b.status === 'PENDING');
  const pastBookings = bookings.filter(b => b.status === 'COMPLETED' || b.status === 'DECLINED');

  if (loading) return <div className="p-20 text-center animate-pulse">Loading Campaigns...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-serif font-bold mb-2">Campaign Manager</h1>
            <p className="text-gray-500">Track contracts and direct live streams.</p>
          </div>
          <Link href="/marketplace">
            <button className="bg-black text-white px-6 py-3 rounded-full font-bold text-sm hover:scale-105 transition">
              + New Campaign
            </button>
          </Link>
        </div>

        {/* 1. LIVE NOW SECTION (Highlighted) */}
        {liveBookings.length > 0 && (
          <div className="mb-12">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-red-600 mb-4 animate-pulse">
              <span className="w-2 h-2 bg-red-600 rounded-full"></span> Live Now
            </h2>
            <div className="grid gap-6">
              {liveBookings.map(booking => (
                <Link href={`/agency/live/${booking.id}`} key={booking.id}>
                  <div className="bg-black text-white p-8 rounded-2xl border border-gray-800 shadow-2xl hover:scale-[1.01] transition-transform cursor-pointer flex justify-between items-center group">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <img src={booking.creator?.avatar_url} className="w-16 h-16 rounded-full border-2 border-red-500" />
                        <div className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">LIVE</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold mb-1">{booking.project_name}</div>
                        <div className="text-gray-400 text-sm">Hosted by {booking.creator?.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right mr-4 hidden md:block">
                         <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Duration</div>
                         <div className="font-mono text-red-400">00:14:32</div>
                      </div>
                      <button className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 group-hover:bg-red-600 group-hover:text-white transition-colors">
                        Enter Director Console <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 2. UPCOMING / PENDING */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Calendar size={20} /> Active Campaigns
            </h2>
            
            {activeBookings.length === 0 ? (
               <div className="bg-white p-10 rounded-2xl border border-dashed border-gray-300 text-center text-gray-400">
                  No active campaigns. Book talent in the Marketplace.
               </div>
            ) : (
               <div className="space-y-4">
                {activeBookings.map(booking => (
                   <div key={booking.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-4 w-full">
                        <img src={booking.creator?.avatar_url} className="w-12 h-12 rounded-full bg-gray-100" />
                        <div>
                          <div className="font-bold text-lg">{booking.project_name}</div>
                          
                          {/* SHOW SCHEDULED TIME */}
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                             <Calendar size={14} className="text-gray-400"/>
                            <span className="font-medium text-black">
                                {formatLocalTime(booking.scheduled_at)}
                                </span>
                          </div>
                        </div>
                      </div>
                      {/* Status Badge */}
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap
                        ${booking.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'}
                      `}>
                        {booking.status === 'PENDING' ? 'Waiting for Acceptance' : 'Scheduled'}
                      </div>
                      
                      {booking.status === 'APPROVED' && (
                         <Link href={`/agency/live/${booking.id}`}>
                           <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black whitespace-nowrap">
                             Prep Console
                           </button>
                         </Link>
                      )}
                   </div>
                 ))}
               </div>
            )}
          </div>

          {/* 3. PAST HISTORY */}
          <div>
            <h2 className="text-xl font-bold mb-6 text-gray-400">History</h2>
            <div className="space-y-4 opacity-60">
              {pastBookings.map(booking => (
                <div key={booking.id} className="bg-gray-100 p-4 rounded-xl flex justify-between items-center">
                   <div className="text-sm font-bold">{booking.project_name}</div>
                   <div className="text-xs font-bold uppercase">{booking.status}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}