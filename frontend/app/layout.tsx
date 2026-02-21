// app/layout.tsx
"use client"; // <--- AJOUTEZ CETTE LIGNE ICI

import './globals.css';
import { Toaster } from 'react-hot-toast';
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const TIMEOUT = 20 * 60 * 1000; // 20 minutes

    const logout = () => {
      localStorage.removeItem('token');
      router.push("/login");
      alert("Session expirée pour inactivité.");
    };

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, TIMEOUT);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer));

    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <html lang="fr">
      <body>
        <Toaster />
        {children}
      </body>
    </html>
  );
}