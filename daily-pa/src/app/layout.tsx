import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'CLASP - 你的虚拟私人助理',
    template: '%s | CLASP',
  },
  description: '一个帮助你管理待办事项、日程安排和消费记录的虚拟私人助理应用',
  keywords: ['待办事项', '日历', '消费记录', '私人助理', 'AI助手'],
  authors: [{ name: 'CLASP Team' }],
  creator: 'CLASP',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={poppins.className}>
        {children}
      </body>
    </html>
  );
}
