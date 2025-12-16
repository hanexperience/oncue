"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient'; 
import { useUser } from "@clerk/nextjs";

// 1. Define Types
type Booking = {
  id: number;
  project_name: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'LIVE' | 'COMPLETED';
  price: string;
  date_text: string;
  creator?: { name: string; handle: string; avatar_url: string }; 
};

type BookingContextType = {
  bookings: Booking[];
  balance: number;
  prompterMessage: string;
  addBooking: (creatorId: string, price: string, name: string) => Promise<void>;
  updateStatus: (id: number, status: string) => Promise<void>;
  sendPrompterMessage: (msg: string) => Promise<void>;
  userRole: 'brand' | 'creator'; 
  setUserRole: (role: 'brand' | 'creator') => void;
  toggleRole: () => void; 
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [prompterMessage, setPrompterMessage] = useState("Welcome to the stream!");
  const [balance, setBalance] = useState(14250);
  const [userRole, setUserRole] = useState<'brand' | 'creator'>('brand');

  // --- A. FETCH DATA ---
  const fetchBookings = async () => {
    if (!user) return; 

    let query = supabase
      .from('bookings')
      .select(`*, creator:creator_id (name, handle, avatar_url)`)
      .order('created_at', { ascending: false });

    // FILTER LOGIC
    if (userRole === 'brand') {
      // Brand sees bookings they created
      query = query.eq('brand_id', user.id);
    } 
    // (Optional: Add logic here if you want Creators to only see their own bookings)

    // EXECUTE QUERY (Runs for both roles)
    const { data, error } = await query;

    if (error) console.error('Error fetching bookings:', error);
    if (data) {
      const formatted = data.map((b: any) => ({
        id: b.id,
        project_name: b.project_name,
        status: b.status,
        price: b.price,
        date_text: b.date_text,
        creator: b.creator
      }));
      setBookings(formatted);
    }
  };

  // --- B. EFFECT ---
  useEffect(() => {
    fetchBookings();
    
    // Subscribe to Realtime Messages
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

  // --- C. ACTIONS ---
  const ensureProfileExists = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
    
    if (!data) {
      await supabase.from('profiles').insert({
        id: user.id,
        name: user.fullName || "New Brand",
        email: user.primaryEmailAddress?.emailAddress,
        role: 'brand',
        avatar_url: user.imageUrl
      });
    }
  };

  const addBooking = async (creatorId: string, price: string, creatorName: string) => {
    if (!user) {
        alert("Please sign in.");
        return;
    }

    await ensureProfileExists();
    
    // Optimistic Update
    const tempId = Date.now();
    const newBooking = {
      id: tempId,
      project_name: "New Campaign Request",
      status: 'PENDING' as const,
      price: price,
      date_text: "Requested Just Now",
      creator: { name: creatorName, handle: "...", avatar_url: "..." }
    };
    setBookings(prev => [newBooking, ...prev]);

    // Database Insert
    const { error } = await supabase.from('bookings').insert({
      brand_id: user.id, // <--- FIXED: Uses Real User ID
      creator_id: creatorId, // <--- FIXED: Uses the passed creatorId
      project_name: "New Campaign Request",
      price: price,
      status: 'PENDING',
      date_text: "Requested Just Now"
    });

    if (error) {
      console.error("Booking failed:", error);
    } else {
      fetchBookings(); 
    }
  };

  const updateStatus = async (id: number, status: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: status as any } : b));

    const { error } = await supabase
      .from('bookings')
      .update({ status: status })
      .eq('id', id);

    if (error) {
      console.error("Error updating status:", error);
      fetchBookings(); 
    }
  };

  const sendPrompterMessage = async (msg: string) => {
    setPrompterMessage(msg);
    await supabase.from('messages').insert({ content: msg });
  };

  const toggleRole = () => {
    setUserRole(prev => prev === 'brand' ? 'creator' : 'brand');
  };

  return (
    <BookingContext.Provider value={{ 
      bookings, balance, prompterMessage, addBooking, updateStatus, sendPrompterMessage, 
      userRole, setUserRole, toggleRole 
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