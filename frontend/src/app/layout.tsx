import type { Metadata } from 'next';
import Providers from '@/components/providers';

export const metadata: Metadata = {
  title: 'Private Finance Advisor',
  description: 'Make smarter spending decisions with AI-powered financial analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
