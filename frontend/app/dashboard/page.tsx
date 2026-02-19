import AuthGuard from '@/components/AuthGuard';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <main className="p-8">
        <h1 className="text-2xl font-bold">Tableau de Bord - Eco1</h1>
        <p>Bienvenue dans votre espace sécurisé.</p>
        {/* Ton contenu ici */}
      </main>
    </AuthGuard>
  );
}