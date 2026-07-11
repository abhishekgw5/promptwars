import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MonsoonGuard — AI-Powered Monsoon Preparedness',
  description:
    'GenAI-powered solution for monsoon preparedness with personalized plans, real-time weather alerts, emergency checklists, travel advisories, and multilingual safety guidance.',
  keywords: ['monsoon', 'preparedness', 'weather', 'safety', 'AI', 'India'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
