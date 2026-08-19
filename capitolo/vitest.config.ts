import { defineConfig } from 'vitest/config';

// Config locale: evita che vitest risalga alla radice del monorepo e raccolga
// la configurazione di un altro progetto. Capitolo resta autonomo.
export default defineConfig({
  test: {
    root: __dirname,
    include: ['test/**/*.test.ts'],
    // I test toccano Postgres: niente parallelismo fra file, per non pestarsi
    // i piedi sugli stessi record.
    fileParallelism: false,
  },
});
