// app/onboarding/page.tsx (Updated)
import React, { Suspense } from "react";
// Import the new component you created in Step 1
import OnboardingForm from "./OnboardingForm"; 
import { Loader2 } from "lucide-react";

// The main page component is now a Server Component (no 'use client')
export default function OnboardingPage() {
  return (
    // Wrap the client component in Suspense
    // This allows the server to skip rendering the client-specific hook 
    // and wait for the client to hydrate with the actual search params.
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="animate-spin text-black" size={32} />
        </div>
      }
    >
      <OnboardingForm />
    </Suspense>
  );
}