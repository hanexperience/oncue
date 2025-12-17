"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient'; 
import { useUser } from "@clerk/nextjs";
import { createDateFromLocalInput } from '../lib/dateUtils';

// 1. Define Types
type Booking = {
  id: number;
  project_name: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'LIVE' | 'COMPLETED';
  price: string;
  date_text: string;
  scheduled_at?: string; // New field
  stream_link?: string;  // New field
  checked_in_at?: string; // New field
  creator?: { name: string; handle: string; avatar_url: string };
  brand?: { name: string; avatar_url: string }; 
};

type BookingContextType = {
  bookings: Booking[];
  balance: number;
  prompterMessage: string;
  userRole: 'brand' | 'creator'; 
  
  // Actions
  setUserRole: (role: 'brand' | 'creator') => void;
  addBooking: (creatorId: string, price: string, name: string, date: string) => Promise<void>;
  updateStatus: (id: number, status: string) => Promise<void>;
  sendPrompterMessage: (msg: string) => Promise<void>;
  
  // NEW ACTIONS (These were missing from export)
  submitStreamLink: (bookingId: number, link: string) => Promise<void>;
  checkInCreator: (bookingId: number) => Promise<void>;
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [prompterMessage, setPrompterMessage] = useState("Welcome to the stream!");
  const [balance, setBalance] = useState(14250);
  const [userRole, setUserRole] = useState<'brand' | 'creator'>('brand');

  // --- 1. SETUP & FETCH ---
  
  const refreshUserRole = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (data?.role) {
      setUserRole(data.role as 'brand' | 'creator');
    }
  };

  const fetchBookings = async () => {
    if (!user) return; 

    let query = supabase
      .from('bookings')
      .select(`*, creator:creator_id (name, handle, avatar_url), brand:brand_id (name, avatar_url)`)
      .order('created_at', { ascending: false });

    // Filter based on who is logged in
    if (userRole === 'brand') {
      query = query.eq('brand_id', user.id);
    } else {
      query = query.eq('creator_id', user.id);
    }

    const { data, error } = await query;
    if (error) console.error('Error fetching bookings:', error);
    if (data) setBookings(data);
  };

  useEffect(() => {
    if (user) {
      refreshUserRole();
      fetchBookings();
    }
    
    // Realtime Listener
    const channel = supabase
      .channel('realtime_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setPrompterMessage(payload.new.content);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userRole]);

  // --- 2. ACTIONS ---

  const ensureProfileExists = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
    
    if (!data) {
      await supabase.from('profiles').insert({
        id: user.id,
        name: user.fullName || "New User",
        email: user.primaryEmailAddress?.emailAddress,
        role: userRole,
        avatar_url: user.imageUrl
      });
    }
  };

const addBooking = async (creatorId: string, price: string, creatorName: string, dateString: string) => {
    if (!user) { alert("Please sign in."); return; }
    
    // --- TIMEZONE FIX ---
    // 1. Force the string to be treated as YOUR local time
    const localDate = createDateFromLocalInput(dateString);
    
    // 2. Convert that exact moment to UTC for the database
    const utcDate = localDate.toISOString();
    
    // Debugging Log (Check your browser console when you click book!)
    console.log("Booking Debug:", {
       input: dateString,
       interpretedAsLocal: localDate.toString(),
       sendingToDB: utcDate
    });
    // --------------------

    await ensureProfileExists();
    const tempId = Date.now();
    
    // Optimistic Update
    setBookings(prev => [{
      id: tempId,
      project_name: "New Campaign",
      status: 'PENDING',
      price,
      date_text: "Just Now",
      scheduled_at: utcDate, // Save the corrected UTC
      creator: { name: creatorName, handle: "...", avatar_url: "..." }
    } as Booking, ...prev]);

    const { error } = await supabase.from('bookings').insert({
      brand_id: user.id,
      creator_id: creatorId,
      project_name: "New Campaign Request",
      price: price,
      status: 'PENDING',
      scheduled_at: utcDate // Save the corrected UTC
    });

    if (error) console.error("Booking failed:", error);
    else fetchBookings(); 
  };

  const updateStatus = async (id: number, status: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: status as any } : b));
    await supabase.from('bookings').update({ status: status }).eq('id', id);
  };

  const sendPrompterMessage = async (msg: string) => {
    setPrompterMessage(msg);
    await supabase.from('messages').insert({ content: msg });
  };

  // --- NEW FUNCTIONS (The Missing Piece) ---

  const submitStreamLink = async (bookingId: number, link: string) => {
    // Optimistic
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, stream_link: link } : b));
    // DB
    const { error } = await supabase.from('bookings').update({ stream_link: link }).eq('id', bookingId);
    if(error) alert("Error saving link: " + error.message);
  };

  const checkInCreator = async (bookingId: number) => {
    // Optimistic
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, checked_in_at: new Date().toISOString() } : b));
    // DB
    await supabase.from('bookings').update({ checked_in_at: new Date().toISOString() }).eq('id', bookingId);
  };

  return (
    <BookingContext.Provider value={{ 
      bookings, 
      balance, 
      prompterMessage, 
      userRole,
      setUserRole,
      addBooking, 
      updateStatus, 
      sendPrompterMessage,
      // --- EXPORTING THE NEW FUNCTIONS HERE ---
      submitStreamLink, 
      checkInCreator
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) throw new Error('useBooking must be used within a BookingProvider');
  return context;
}