"use client";
import React, { useState } from "react";
import { Bell, MessageSquare, Zap, Send } from "lucide-react";
import Navbar from "../components/Navbar";
import { AGENCY_ROSTER } from "../lib/data";
import { useBooking } from "../context/BookingContext";

export default function AgencyPage() {
  const { bookings, balance, sendPrompterMessage } = useBooking();
  const [inputMessage, setInputMessage] = useState("");

  const { userRole } = useBooking();

    if (userRole === 'creator') {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-500 mb-4">Creators cannot access the Agency Portal.</p>
            <button className="text-blue-600 underline" onClick={() => window.history.back()}>Go Back</button>
        </div>
        </div>
    );
    }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendPrompterMessage(inputMessage); // Send to Context
    setInputMessage(""); // Clear input
    alert("Message sent to Teleprompter!");
  };

  

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans">
      <Navbar />

      <div className="p-4 md:p-8 max-w-7xl mx-auto pb-20">
        
        {/* --- NEW: LIVE DIRECTOR CONSOLE --- */}
        <div className="bg-black text-white rounded-xl p-6 mb-8 shadow-2xl border border-gray-800">
          <div className="flex items-center gap-2 mb-4 text-red-500 font-bold uppercase tracking-widest text-xs animate-pulse">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            Live Command Center
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-serif mb-2">Real-Time Direction</h3>
              <p className="text-gray-400 text-sm mb-4">Send instructions directly to the talent's teleprompter screen.</p>
              
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ex: Show the product close up..." 
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                />
                <button type="submit" className="bg-white text-black font-bold px-6 py-3 rounded-lg hover:bg-gray-200 transition flex items-center gap-2">
                  <Send size={16} /> Send
                </button>
              </form>

              <div className="flex gap-2 mt-3">
                <button onClick={() => sendPrompterMessage("WRAP IT UP!")} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded border border-gray-600">"Wrap it up"</button>
                <button onClick={() => sendPrompterMessage("Mention the 20% Discount!")} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded border border-gray-600">"Mention Discount"</button>
                <button onClick={() => sendPrompterMessage("Check the audio.")} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded border border-gray-600">"Check Audio"</button>
              </div>
            </div>

            <div className="w-full md:w-1/3 bg-gray-900 rounded-lg p-4 border border-gray-800 flex flex-col justify-center items-center text-center opacity-50">
              <Zap size={32} className="text-yellow-500 mb-2" />
              <div className="text-xs font-bold text-gray-500">Connected to:</div>
              <div className="font-bold text-white">Sarah Jenkins (Studio)</div>
            </div>
          </div>
        </div>
        {/* --- END CONSOLE --- */}

        <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif mb-2">Roster Management</h2>
            <p className="text-sm md:text-base text-gray-500">Monitor your talent, approve briefs, and track commissions.</p>
          </div>
          {/* Balance Block */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-widest">Pending Payouts</div>
              <div className="text-2xl font-mono font-bold">${balance.toLocaleString()}</div>
            </div>
          </div>
        </header>

        {/* Existing Roster Grid... (Keep your existing code here) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {AGENCY_ROSTER.map((talent, i) => (
             /* Keep existing card code */
             <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm relative overflow-hidden">
                <div className="font-bold text-sm mb-1">{talent.name}</div>
                <div className="text-xs text-gray-500">{talent.status}</div>
             </div>
          ))}
        </div>

        {/* Existing Bookings List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
           <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 font-bold text-sm uppercase flex gap-2">
             <Bell size={16} /> Contract Requests ({bookings.length})
           </div>
           {bookings.map((booking) => (
             <div key={booking.id} className="p-4 border-b border-gray-100 flex justify-between">
                <div>
                  <div className="font-bold">{booking.name}</div>
                  <div className="text-xs text-gray-500">{booking.status}</div>
                </div>
                <button className="bg-black text-white px-3 py-1 rounded text-xs">Manage</button>
             </div>
           ))}
        </div>

      </div>
    </div>
  );
}