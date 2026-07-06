/**
 * MarketingLayout.jsx — Wraps all marketing/public pages
 * Provides Navbar + children + Footer
 */
import Navbar from './Navbar';
import Footer from './Footer';

export default function MarketingLayout({ children }) {
  return (
    <div className="min-h-screen bg-white font-gabarito flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
