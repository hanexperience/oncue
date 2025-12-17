"use client";
import React from "react";
import { Eye, MousePointer, TrendingUp } from "lucide-react";

export default function InsightsPage() {
  // Mock Data for Prototype
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const views = [12, 19, 3, 5, 22, 15, 28];
  const max = Math.max(...views);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200">
           <div className="flex justify-between items-start mb-4">
             <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Eye size={20}/></div>
             <div className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">+12%</div>
           </div>
           <div className="text-3xl font-serif font-bold mb-1">1,240</div>
           <div className="text-xs text-gray-500 uppercase tracking-widest">Profile Views</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200">
           <div className="flex justify-between items-start mb-4">
             <div className="bg-purple-50 p-2 rounded-lg text-purple-600"><MousePointer size={20}/></div>
             <div className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">+5%</div>
           </div>
           <div className="text-3xl font-serif font-bold mb-1">4.8%</div>
           <div className="text-xs text-gray-500 uppercase tracking-widest">Click Through Rate</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200">
           <div className="flex justify-between items-start mb-4">
             <div className="bg-orange-50 p-2 rounded-lg text-orange-600"><TrendingUp size={20}/></div>
             <div className="text-gray-400 text-xs font-bold px-2 py-1 rounded">--</div>
           </div>
           <div className="text-3xl font-serif font-bold mb-1">$1,200</div>
           <div className="text-xs text-gray-500 uppercase tracking-widest">Est. Revenue</div>
        </div>
      </div>

      {/* CSS Bar Chart */}
      <div className="bg-white p-8 rounded-2xl border border-gray-200">
        <h3 className="font-bold text-lg mb-8">Profile Activity (Last 7 Days)</h3>
        
        <div className="flex items-end justify-between h-64 gap-2 md:gap-4">
          {views.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
               <div className="opacity-0 group-hover:opacity-100 transition text-xs font-bold bg-black text-white px-2 py-1 rounded mb-2">
                 {val}
               </div>
               <div 
                 className="w-full bg-gray-100 rounded-t-lg group-hover:bg-black transition-all duration-500 relative overflow-hidden"
                 style={{ height: `${(val / max) * 100}%` }}
               >
                 {/* Animated Fill Effect */}
                 <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-gray-900 to-gray-700 h-0 group-hover:h-full transition-all duration-500"></div>
               </div>
               <div className="text-xs text-gray-400 font-medium uppercase">{days[i]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}