import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Questo progetto vive in una sottocartella accanto ad altri lockfile: fissa
  // la radice del tracing su capitolo/, così il build non risale al monorepo.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  // Le pagine pubbliche devono essere statiche e velocissime per il posizionamento.
  // La configurazione specifica arriverà con il compito ⑥ (pagine pubbliche).
};

export default nextConfig;
