import "./globals.css";

export const metadata = {
  title: "Mindwood",
  description: "Mindwood app harmonisée avec Grain Atelier",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <div className="mw-shell">
          <div className="mw-overlay" />
          <div className="mw-content">
            {/* Ajoutez ici un Header ou Provider si besoin */}
            <main className="w-full">{children}</main>
            {/* Ajoutez ici un Footer si besoin */}
          </div>
        </div>
      </body>
    </html>
  );
}
