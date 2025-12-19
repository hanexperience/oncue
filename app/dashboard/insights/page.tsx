"use client";
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../../lib/supabaseClient";
import { Eye, MousePointer, TrendingUp, Loader2 } from "lucide-react";

export default function InsightsPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  
  // State for metrics
  const [metrics, setMetrics] = useState({
    views: 0,
    clicks: 0,
    revenue: 0,
    chartData: [] as { date: string, count: number }[]
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;

      // 1. Fetch Aggregated Data (Views/Clicks)
      // Since we are likely inserting a row per day or per view, we aggregate here.
      // For simplicity in this prototype, let's assume the 'analytics' table stores daily summaries.
      
      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('date', { ascending: true });

      // 2. Fetch Total Revenue from Bookings
      const { data: bookingData } = await supabase
         .from('bookings')
         .select('price')
         .eq('creator_id', user.id)
         .eq('status', 'COMPLETED'); // Only count completed jobs

      // Process Data
      const totalRevenue = bookingData ? bookingData.reduce((acc, b) => acc + Number(b.price), 0) : 0;
      
      // Generate Last 7 Days (Empty placeholders if no data)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
         const d = new Date();
         d.setDate(d.getDate() - (6 - i));
         return d.toISOString().split('T')[0]; // YYYY-MM-DD
      });

      const chartData = last7Days.map(date => {
          const row = data?.find((r: any) => r.date === date);
          return {
             date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
             count: row ? row.profile_views : 0
          };
      });

      const totalViews = data ? data.reduce((acc: number, r: any) => acc + r.profile_views, 0) : 0;
      const totalClicks = data ? data.reduce((acc: number, r: any) => acc + r.link_clicks, 0) : 0;

      // Calculate CTR safely
      const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0";

      setMetrics({
         views: totalViews,
         clicks: totalClicks, // Using clicks as CTR numerator proxy for now
         revenue: totalRevenue,
         chartData
      });
      
      setLoading(false);
    };

    fetchAnalytics();
  }, [user]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  // Helper for Chart Scaling
  const maxView = Math.max(...metrics.chartData.map(d => d.count), 10); // Minimum scale of 10 for visuals

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Views */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
           <div className="flex justify-between items-start mb-4">
             <div className="bg-black text-white p-3 rounded-xl"><Eye size={20}/></div>
             {metrics.views > 0 && <div className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">+12%</div>}
           </div>
           <div className="text-4xl font-serif font-bold mb-1">{metrics.views.toLocaleString()}</div>
           <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Profile Views</div>
        </div>

        {/* CTR */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
           <div className="flex justify-between items-start mb-4">
             <div className="bg-gray-100 text-black p-3 rounded-xl"><MousePointer size={20}/></div>
             {Number(metrics.clicks) > 0 && <div className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">+5%</div>}
           </div>
           <div className="text-4xl font-serif font-bold mb-1">{((metrics.clicks / (metrics.views || 1)) * 100).toFixed(1)}%</div>
           <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Click Through Rate</div>
        </div>

        {/* Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
           <div className="flex justify-between items-start mb-4">
             <div className="bg-green-100 text-green-700 p-3 rounded-xl"><TrendingUp size={20}/></div>
           </div>
           <div className="text-4xl font-serif font-bold mb-1">${metrics.revenue.toLocaleString()}</div>
           <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Total Earned</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-lg">Profile Activity</h3>
            <span className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-500">Last 7 Days</span>
        </div>
        
        {/* The Graph */}
        <div className="flex items-end justify-between h-64 gap-2 md:gap-4 border-b border-gray-100 pb-2">
          {metrics.chartData.map((data, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer relative">
               
               {/* Tooltip */}
               <div className="opacity-0 group-hover:opacity-100 transition absolute -top-10 bg-black text-white text-xs font-bold px-2 py-1 rounded pointer-events-none">
                 {data.count} Views
               </div>

               {/* Bar */}
               <div 
                 className="w-full bg-gray-100 rounded-t-xl group-hover:bg-black transition-all duration-500 relative overflow-hidden"
                 style={{ height: `${Math.max((data.count / maxView) * 100, 5)}%` }} // Min height 5% so it's visible
               >
                 {/* Empty State Visuals for new users (Stripes) */}
                 {data.count === 0 && (
                     <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#000_5px,#000_10px)]"></div>
                 )}
               </div>
               
               {/* Label */}
               <div className="text-xs text-gray-400 font-bold uppercase mt-2">{data.date}</div>
            </div>
          ))}
        </div>
        
        {metrics.views === 0 && (
            <div className="text-center mt-6 text-gray-400 text-sm">
                Share your profile link to start tracking traffic.
            </div>
        )}
      </div>
    </div>
  );
}