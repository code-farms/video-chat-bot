import type {Metadata} from 'next';
import { Nunito } from 'next/font/google'; // Import Nunito font
import './globals.css';
import ReduxProvider from '@/lib/redux/provider'; // Import ReduxProvider

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
    <html lang="en">
      {/* Apply Nunito font class to the body */}
      <body className={`${nunito.className} antialiased`}>
        <ReduxProvider>{children}</ReduxProvider> {/* Wrap children with ReduxProvider */}
      </body>
    </html>
  );
}
