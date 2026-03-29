import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Fuel Management System",
  description: "Track and analyse fleet fuel consumption",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
