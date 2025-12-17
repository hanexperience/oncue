"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "@clerk/nextjs";
import { Clock, Calendar, Video, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";
import { formatLocalTime } from "../lib/dateUtils";


export default function DashboardPage() {
  const { user } = useUser();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('bookings')
        .select(`*, brand:brand_id (name, avatar_url)`)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setOrders(data);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleStatus = async (id: number, newStatus: string) => {
     setOrders(prev => prev.map(o => o.id === id ? {...o, status: newStatus} : o));
     await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* 1. NEXT UP (The "Hero" Card) */}
      {orders.filter(o => o.status === 'APPROVED').map(order => (
        <div key={order.id} className="bg-black text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
           <div className="relative z-10">
              <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-widest text-xs mb-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Upcoming Stream
              </div>
              <h2 className="text-3xl font-serif font-bold mb-2">{order.project_name}</h2>
              
              {/* --- UPDATE 1: HERO CARD TIME --- */}
              <div className="flex items-center gap-4 text-gray-400 text-sm">
                {/* Replaced the separate Date/Time lines with the unified Helper */}
                <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-white">
                    <Clock size={14}/> {formatLocalTime(order.scheduled_at)}
                </span>
              </div>
              {/* -------------------------------- */}

           </div>

           <div className="relative z-10 flex flex-col gap-3 w-full md:w-auto">
              {!order.stream_link ? (
                <Link href={`/studio/${order.id}`}>
                   <button className="w-full bg-white text-black px-6 py-3 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition">
                     <AlertCircle size={18} className="text-orange-500"/> Add Stream Link
                   </button>
                </Link>
              ) : (
                <Link href={`/studio/${order.id}`}>
                   <button className="w-full bg-red-600 text-white px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-red-900/20">
                     Enter Studio <ChevronRight size={18} />
                   </button>
                </Link>
              )}
           </div>

           <div className="absolute top-0 right-0 w-64 h-64 bg-gray-800 rounded-full blur-3xl opacity-30 translate-x-1/3 -translate-y-1/3"></div>
        </div>
      ))}

      {/* 2. PENDING REQUESTS */}
      <div>
        <h3 className="font-bold text-lg mb-4">Requests</h3>
        {orders.filter(o => o.status === 'PENDING').length === 0 && <div className="text-gray-400 text-sm">No pending requests.</div>}
        
        <div className="grid gap-4">
          {orders.filter(o => o.status === 'PENDING').map(order => (
            <div key={order.id} className="bg-white p-6 rounded-2xl border border-gray-200 flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center font-bold">{order.brand?.name[0]}</div>
                  <div>
                    <div className="font-bold">{order.project_name}</div>
                    <div className="text-sm text-gray-500">{order.brand?.name} • {order.price}</div>
                    
                    {/* --- UPDATE 2: PENDING CARD TIME --- */}
                    <div className="text-xs text-blue-600 font-medium mt-1">
                       Requested: {formatLocalTime(order.scheduled_at)}
                    </div>
                    {/* ----------------------------------- */}

                  </div>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => handleStatus(order.id, 'DECLINED')} className="px-4 py-2 text-red-600 text-sm font-bold hover:bg-red-50 rounded-lg">Decline</button>
                 <button onClick={() => handleStatus(order.id, 'APPROVED')} className="px-6 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800">Accept</button>
               </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}