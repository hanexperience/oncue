"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { useBooking } from "../../../context/BookingContext";
import { Send, FileText, ArrowLeft, Clock, Eye, MessageSquare, AlertCircle } from "lucide-react";
import StreamPlayer from '../../../components/StreamPlayer'; // Ensure this path is correct

export default function DirectorConsole() {
  const { id } = useParams();
  const router = useRouter();
  const { sendPrompterMessage } = useBooking();
  const [booking, setBooking] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      const { data } = await supabase
        .from('bookings')
        .select(`*, creator:creator_id (*)`)
        .eq('id', id)
        .single();
      
      if (data) {
        setBooking(data);
        setIsLive(data.status === 'LIVE');
      }
    };
    fetchBooking();
  }, [id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendPrompterMessage(message);
    setMessage("");
  };

  const toggleLiveStatus = async () => {
    const newStatus = isLive ? 'COMPLETED' : 'LIVE';
    await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
    setIsLive(!isLive);
    if (newStatus === 'COMPLETED') router.push('/agency');
  };

  if (!booking) return <div className="p-20 text-center">Loading Console...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden flex flex-col">
      
      {/* 1. COMPACT HEADER */}
      <div className="bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center">
         <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-white"><ArrowLeft size={20}/></button>
            <div>
               <h1 className="font-bold text-sm md:text-lg flex items-center gap-2">
                 {isLive && <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>}
                 {booking.project_name}
               </h1>
               <div className="text-xs text-gray-500">Host: {booking.creator?.name}</div>
            </div>
         </div>
         <div className="flex items-center gap-4">
            {isLive && (
              <div className="hidden md:flex items-center gap-4 text-xs font-mono text-red-500">
                <span className="flex items-center gap-1"><Eye size={14}/> 12.4k</span>
                <span className="flex items-center gap-1"><Clock size={14}/> 00:14:23</span>
              </div>
            )}
            <button 
              onClick={toggleLiveStatus}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isLive ? "End Stream" : "Go Live"}
            </button>
         </div>
      </div>

      {/* 2. MAIN CONSOLE GRID */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        
        {/* LEFT: THE BRIEF (2 Cols) */}
        <div className="hidden lg:block col-span-2 bg-gray-900 border-r border-gray-800 p-6 overflow-y-auto">
           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><FileText size={14}/> Campaign Brief</h3>
           
           <div className="space-y-6 text-sm text-gray-300">
              <div>
                <div className="text-gray-500 text-xs mb-1">Key Message</div>
                <p>Highlight the waterproofing features and the new 24hr battery life.</p>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">Offer Code</div>
                <div className="font-mono text-green-400 bg-green-900/30 p-2 rounded text-center">SUMMER20</div>
              </div>
              <div>
                 <div className="text-gray-500 text-xs mb-1">Do Not Say</div>
                 <ul className="list-disc pl-4 space-y-1 text-red-300">
                    <li>"Cheap"</li>
                    <li>Competitor names</li>
                 </ul>
              </div>
           </div>
        </div>

        {/* --- FIXED CENTER SECTION --- */}
        {/* CENTER: THE VIDEO FEED (7 Cols) */}
        <div className="col-span-12 lg:col-span-7 bg-black flex items-center justify-center relative p-6">
           
           {/* Mobile Container: We constrain width/aspect ratio to simulate phone screen */}
           <div className="relative w-full max-w-[450px] aspect-[9/16] bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
              
              {/* The Smart Player */}
              <StreamPlayer url={booking.stream_link || ""} />
              
              {/* Overlay if NOT Live (Z-Index ensures it sits ON TOP of player) */}
              {!isLive && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                   <div className="text-gray-400 mb-4 font-medium">Stream is currently offline</div>
                   <button onClick={toggleLiveStatus} className="bg-green-600 px-8 py-3 rounded-full font-bold hover:bg-green-500 transition shadow-lg shadow-green-900/20">
                     Start Broadcast
                   </button>
                </div>
              )}
           </div>

        </div>
        {/* --- END FIXED CENTER SECTION --- */}

        {/* RIGHT: DIRECTOR CONTROLS (3 Cols) */}
        <div className="col-span-12 lg:col-span-3 bg-gray-900 border-l border-gray-800 flex flex-col">
           
           <div className="p-4 border-b border-gray-800">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
               <MessageSquare size={14}/> Real-Time Prompter
             </h3>
           </div>

           {/* Teleprompter Input */}
           <div className="flex-1 p-4 flex flex-col justify-end">
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                 {["Wrap it up", "Show Product", "Check Audio", "Smile!"].map(txt => (
                    <button 
                      key={txt}
                      onClick={() => sendPrompterMessage(txt)}
                      className="bg-gray-800 hover:bg-gray-700 text-xs py-2 rounded text-gray-300 transition"
                    >
                      {txt}
                    </button>
                 ))}
              </div>

              <form onSubmit={handleSendMessage} className="relative">
                 <textarea 
                   value={message}
                   onChange={e => setMessage(e.target.value)}
                   placeholder="Type message to host..."
                   className="w-full bg-black border border-gray-700 rounded-xl p-4 pr-12 text-white h-32 focus:border-red-500 outline-none resize-none"
                   onKeyDown={(e) => {
                     if(e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       handleSendMessage(e);
                     }
                   }}
                 />
                 <button className="absolute bottom-3 right-3 bg-red-600 p-2 rounded-full hover:bg-red-500 transition">
                   <Send size={16} />
                 </button>
              </form>
              <div className="text-[10px] text-gray-500 mt-2 text-center">
                 <AlertCircle size={10} className="inline mr-1"/>
                 Message appears instantly on host's screen
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}