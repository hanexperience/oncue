"use client";
import React from "react";
import Link from "next/link";
import { ShieldCheck, Calendar, LayoutTemplate, BarChart3, CheckCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import { useBooking } from "../context/BookingContext";

export default function DashboardPage() {
  const { bookings, updateStatus } = useBooking();

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans">
      <Navbar />

      <div className="p-4 md:p-8 max-w-5xl mx-auto pb-20">
        {/* Header Profile */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
               <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" alt="Profile" />
               <div className="absolute bottom-0 right-0 bg-black text-white text-xs px-2 py-1 rounded-full border-2 border-white font-bold flex items-center gap-1">
                 <ShieldCheck size={12} /> PRO
               </div>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-serif">Sarah Jenkins</h2>
              <p className="text-gray-500 text-sm md:text-base">Fashion & Lifestyle • Level 4 Creator</p>
              <div className="flex flex-wrap gap-2 md:gap-4 mt-2 text-sm font-medium">
                 <span className="text-green-600 bg-green-50 px-2 py-1 rounded">98% Reliability</span>
                 <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded">14m Avg Retention</span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COL: BOOKINGS */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2"><Calendar size={18} /> Booking Requests</h3>
            
            {bookings.length === 0 && (
              <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                No active bookings. Check back later!
              </div>
            )}

            {bookings.map((booking) => (
              <div key={booking.id} className={`bg-white border rounded-xl p-6 shadow-sm transition-all ${booking.status === 'PENDING' ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start mb-2">
                   <div>
                     {booking.status === 'PENDING' && (
                       <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block animate-pulse">Action Required</span>
                     )}
                     {booking.status === 'APPROVED' && (
                       <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block">Upcoming</span>
                     )}
                     <h4 className="text-xl font-bold">{booking.name}</h4>
                     <p className="text-gray-500 text-sm">{booking.date}</p>
                   </div>
                   <div className="text-right">
                     <div className="font-mono font-bold text-lg">{booking.price}</div>
                     <div className="text-xs text-gray-400">Fixed Fee</div>
                   </div>
                </div>

                {/* Action Buttons */}
                {booking.status === 'PENDING' ? (
                  <div className="flex gap-3 mt-6">
                    <button 
                      onClick={() => updateStatus(booking.id, 'APPROVED')}
                      className="flex-1 bg-black text-white py-3 rounded-lg font-bold hover:scale-[1.02] transition"
                    >
                      Accept Job
                    </button>
                    <button 
                      onClick={() => updateStatus(booking.id, 'DECLINED')}
                      className="px-6 py-3 border border-gray-200 rounded-lg font-bold text-gray-500 hover:bg-gray-50"
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <div className="mt-6">
                    <Link href="/studio">
                      <button className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition flex items-center justify-center gap-2">
                        <LayoutTemplate size={18} /> Enter Studio
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* RIGHT COL: STATS */}
          <div className="space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2"><BarChart3 size={18} /> Performance Score</h3>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-center mb-6">
                <div className="inline-block p-4 rounded-full border-4 border-green-500 text-3xl font-bold font-mono text-green-600 mb-2">9.4</div>
                <div className="text-sm font-bold text-gray-800">Excellent Standing</div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Punctuality</span><span className="text-green-600">100%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-full"></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Brief Adherence</span><span className="text-green-600">92%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[92%]"></div></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}