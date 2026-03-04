import type { Metadata } from "next";
import { Providers } from "./providers";
import { ConditionalNavbar } from "./ConditionalNavbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "ENTREPRISE DEMO",
  description: "Plateforme de communication ENTREPRISE DEMO — clients et support",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <Providers>
          <ConditionalNavbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
