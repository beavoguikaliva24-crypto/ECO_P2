// app/layout.tsx
import './globals.css'; // <--- Vérifie que cette ligne est présente !
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Toaster />
        {children}
      </body>
    </html>
  );
}