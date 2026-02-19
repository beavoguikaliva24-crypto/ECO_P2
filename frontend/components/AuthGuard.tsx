"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // On vérifie si l'utilisateur existe dans le stockage local
    const user = localStorage.getItem('user');

    if (!user) {
      // Si rien n'est trouvé, on redirige vers login
      router.replace('/login');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  // On n'affiche rien tant que la vérification n'est pas faite
  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return <>{children}</>;
}