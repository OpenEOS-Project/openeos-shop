import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescriptConfig from 'eslint-config-next/typescript';

/**
 * Dieses Repo hatte bisher weder eine ESLint-Konfiguration noch die Pakete
 * dafuer; geprueft wurde allein, ob `next build` durchlaeuft.
 *
 * Anders als im Dashboard (Next 15) wird hier nicht ueber `FlatCompat`
 * eingebunden: eslint-config-next 16 liefert bereits fertige Flat-Configs,
 * und der Umweg ueber die alte Schnittstelle scheitert an der Schema-
 * Pruefung.
 *
 * Bewusst der Regelsatz von Next und nicht mehr — er faengt ab, was in einer
 * Next-Anwendung wirklich schadet.
 */
const eslintConfig = [
  ...coreWebVitals,
  ...typescriptConfig,
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
  {
    /* Altlasten bleiben sichtbar, blockieren aber nicht — sonst waere die
       Pruefung am ersten Tag rot und am zweiten abgeschaltet. Regeln, die
       auf echte Fehler zeigen, blockieren weiterhin. */
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },
];

export default eslintConfig;
