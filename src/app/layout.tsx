import type { Metadata } from 'next';
import { Nunito } from 'next/font/google'; // Import Nunito font
import './globals.css';
import ReduxProvider from '@/lib/redux/provider'; // Import ReduxProvider
import { ThemeProvider } from '@/context/ThemeProvider'; // Import ThemeProvider
import { Toaster } from '@/components/ui/toaster'; // Import Toaster

// Configure Nunito font
const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito', // Optional: Define CSS variable if needed
});

export const metadata: Metadata = {
  title: 'VideoChat Hub',
  description: 'Upload, preview videos, and chat.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/*
        The head tag is automatically managed by Next.js.
        Avoid adding tags like <title> or <meta> directly here.
        Metadata should be defined using the `metadata` export above.
        https://nextjs.org/docs/app/building-your-application/optimizing/metadata
      */}
      <head />
      {/* Apply Nunito font class to the body */}
      <body className={`${nunito.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReduxProvider>{children}</ReduxProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
