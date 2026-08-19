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
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
