import "./globals.css";
import Navbar from "@/components/Navbar";
import NetworkStatus from "@/components/NetworkStatus";

export const metadata = {
  title: "FuelCore — Fuel Management System",
  description: "Track and analyse fleet fuel consumption",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NetworkStatus />
        <Navbar />
        <div className="main-content">
          {children}
        </div>
      </body>
    </html>
  );
}
