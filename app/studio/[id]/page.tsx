"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { useBooking } from "../../context/BookingContext";
import { Clock, Link as LinkIcon, CheckCircle, ExternalLink, Play, MessageSquare, Mic, Wifi } from "lucide-react";
import StreamPlayer from '../../components/StreamPlayer';

export default function CreatorStudio() {
  const { id } = useParams();
  const { submitStreamLink, checkInCreator, prompterMessage } = useBooking();
  const [booking, setBooking] = useState<any>(null);
  const [linkInput, setLinkInput] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [isReady, setIsReady] = useState(false); // Within 30 mins

  // 1. Fetch Booking Data
  useEffect(() => {
    const fetchBooking = async () => {
      const { data } = await supabase.from('bookings').select('*').eq('id', id).single();
      if (data) {
        setBooking(data);
        if (data.stream_link) setLinkInput(data.stream_link);
      }
    };
    fetchBooking();
    
    // Refresh every minute to check if we are within the 30min window
    const interval = setInterval(() => calculateTime(), 60000);
    return () => clearInterval(interval);
  }, [id]);

const getEmbedUrl = (url: string) => {
    if (!url) return "";
    // If user already pasted the embed version, leave it
    if (url.includes("/embed")) return url;
    
    // 1. Remove query params (like ?igsh=...)
    // 2. Remove trailing slash
    const cleanUrl = url.split('?')[0].replace(/\/$/, "");
    
    // 3. Append /embed
    return `${cleanUrl}/embed`;
  };

  // 2. Countdown Logic
const calculateTime = () => {
    if (!booking?.scheduled_at) return;
    
    const now = new Date().getTime();
    // The "Z" at the end of the string from Supabase ensures this parses as UTC
    // If Supabase sends a string without Z, we append it to be safe
    const timeString = booking.scheduled_at.endsWith('Z') || booking.scheduled_at.includes('+') 
        ? booking.scheduled_at 
        : booking.scheduled_at + 'Z';
        
    const eventTime = new Date(timeString).getTime();
    const diff = eventTime - now;

    // If the event is in the past or happening now (within 30 mins)
    if (diff < 1800000) { 
        setIsReady(true);
        if (diff < 0) {
            // It's technically "started", but we let them check in
            setTimeLeft("Ready to Start");
            return;
        }
    }

    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    setTimeLeft(`${hours}h ${minutes}m`);
  };


  useEffect(() => { if(booking) calculateTime() }, [booking]);


  // --- VIEW 1: LOADING ---
  if (!booking) return <div className="p-20 text-center">Loading Studio...</div>;


  // --- VIEW 2: PASTE LINK (Step 1) ---
  if (!booking.stream_link) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
         <div className="bg-white max-w-lg w-full p-8 rounded-3xl shadow-xl text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"><LinkIcon size={32}/></div>
            <h1 className="text-2xl font-bold mb-2">Setup Stream Link</h1>
            <p className="text-gray-500 mb-8">Paste your scheduled Instagram, YouTube, or TikTok live link so the agency can tune in.</p>
            
            <input 
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="https://instagram.com/p/..."
              className="w-full border p-4 rounded-xl mb-4 bg-gray-50 text-black"
            />
            <button 
              onClick={async () => {
                // 1. Send to Database
                await submitStreamLink(Number(id), linkInput);
                
                // 2. FORCE UI UPDATE (Add this line)
                // This updates the local screen immediately so you move to the next step
                setBooking((prev: any) => ({ ...prev, stream_link: linkInput }));
              }}
              className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800"
            >
              Save Link
            </button>
         </div>
      </div>
    );
  }

  // --- VIEW 3: WAITING ROOM (Step 2) ---
  if (!booking.checked_in_at) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
         {/* Background Pulse */}
         <div className="absolute w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>

         <div className="relative z-10 text-center max-w-lg">
            <h1 className="text-5xl font-mono font-bold mb-2">{timeLeft || "Soon"}</h1>
            <p className="text-gray-400 uppercase tracking-widest text-sm mb-12">Until Show Time</p>

            <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/10 mb-8">
               <h3 className="font-bold text-lg mb-4">Pre-Flight Checklist</h3>
               <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle size={16} className="text-green-500"/> Brief Reviewed</div>
                  <div className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle size={16} className="text-green-500"/> Link Submitted</div>
                  <div className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle size={16} className="text-green-500"/> Equipment Ready</div>
               </div>
            </div>

<button 
              disabled={!isReady} 
              onClick={async () => {
                // 1. Update Database
                await checkInCreator(Number(id));
                
                // 2. FORCE UI UPDATE (Add this line)
                // This manually sets the check-in time locally so the screen switches instantly
                setBooking((prev: any) => ({ ...prev, checked_in_at: new Date().toISOString() }));
              }}
              className={`w-full py-5 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all
                ${isReady 
                  ? "bg-green-500 hover:bg-green-400 text-black shadow-[0_0_30px_rgba(34,197,94,0.4)]" 
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"}
              `}
            >
              {isReady ? "Check In Now" : "Check-in unlocks in 30m"}
            </button>
         </div>
      </div>
    );
  }

  // --- VIEW 4: LIVE STUDIO (Step 3 - The "Performance" Mode) ---
  return (
    <div className="h-screen bg-black text-white flex flex-col font-sans">
       
       {/* HEADER */}
       <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
             <span className="font-bold tracking-widest text-sm uppercase text-red-500">Studio Live</span>
          </div>
          <div className="text-sm font-bold">{booking.project_name}</div>
          <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
             <span className="flex items-center gap-1"><Wifi size={14} className="text-green-500"/> Excellent</span>
             <span className="flex items-center gap-1"><Mic size={14}/> Active</span>
          </div>
       </div>

       {/* MAIN WORKSPACE */}
       <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: TELEPROMPTER (Big Text) */}
          <div className="flex-1 border-r border-gray-800 flex flex-col relative">
             <div className="absolute top-4 left-4 text-xs font-bold text-gray-500 uppercase tracking-widest z-10">Teleprompter Feed</div>
             
             {/* The Message Area */}
             <div className="flex-1 flex items-center justify-center p-12 text-center">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight transition-all duration-300">
                   {prompterMessage || <span className="text-gray-700 italic">Waiting for Director...</span>}
                </h1>
             </div>

             {/* Brief Overlay (Bottom) */}
             <div className="h-32 bg-gray-900/50 border-t border-gray-800 p-4 overflow-y-auto">
                <div className="text-xs font-bold text-gray-500 mb-1">Brief Notes:</div>
                <p className="text-gray-300 text-sm leading-relaxed">{booking.brief_content}</p>
             </div>
          </div>

          {/* RIGHT: STREAM & CHAT */}
<div className="w-[400px] flex flex-col bg-gray-900 border-l border-gray-800">
             
             {/* Stream Preview */}
             <div className="h-[400px] bg-black relative group border-b border-gray-800">
                {/* REPLACED THE IFRAME MESS WITH THIS: */}
                <StreamPlayer url={booking.stream_link} />
             </div>
             {/* Simulated Chat */}
             <div className="flex-1 flex flex-col bg-gray-900 border-t border-gray-800">
                <div className="p-3 border-b border-gray-800 text-xs font-bold text-gray-400 flex items-center gap-2">
                   <MessageSquare size={12}/> Live Chat Aggregator
                </div>
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                   {/* Dummy Comments */}
                   <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-[10px] flex items-center justify-center">J</div>
                      <div><div className="text-xs font-bold text-gray-400">jason_99</div><div className="text-sm">Is this the new model?</div></div>
                   </div>
                   <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-500 text-[10px] flex items-center justify-center">S</div>
                      <div><div className="text-xs font-bold text-gray-400">sarah_styles</div><div className="text-sm">Love that jacket! 😍</div></div>
                   </div>
                   <div className="flex gap-2 opacity-50">
                      <div className="w-6 h-6 rounded-full bg-green-500 text-[10px] flex items-center justify-center">M</div>
                      <div><div className="text-xs font-bold text-gray-400">mike_t</div><div className="text-sm">Does it come in black?</div></div>
                   </div>
                </div>
             </div>

          </div>
       </div>

    </div>
  );
}