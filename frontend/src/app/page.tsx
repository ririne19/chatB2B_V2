import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl font-bold text-slate-900">ENTREPRISE DEMO</h1>
        <p className="text-lg text-slate-600">
          Plateforme de communication sécurisée
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex justify-center items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="inline-flex justify-center items-center px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
