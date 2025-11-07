import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pulso',
  description: 'Plataforma de donación de sangre',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
