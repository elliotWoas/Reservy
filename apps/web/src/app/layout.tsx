import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'رزِروی | پلتفرم مدیریت و نوبت‌دهی آنلاین خدمات',
  description: 'سیستم جامع رزرواسیون آنلاین و مدیریت کسب‌وکارهای خدماتی',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className="dark">
      <body className="min-h-screen bg-[#0B0F17] text-slate-100 selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
