import type { ReactNode } from 'react';

export const metadata = {
  title: 'Capitolo',
  description:
    'Regole e scadenze della tesi, per corso, con la fonte accanto a ogni dato.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
