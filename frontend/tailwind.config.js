import { fontFamily } from 'tailwindcss/defaultTheme';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        josefin: ['Josefin Sans', ...fontFamily.sans],
      },
      // Tokens da nova home (prefixo pc). Valores medidos no mockup e ajustados para contraste AA.
      colors: {
        pc: {
          'verde-900': '#023F1E',
          'verde-700': '#0B5A24',
          'verde-100': '#E6F2E1',
          lima: '#BFF837',
          fundo: '#F8F8F8',
          pessego: '#F9E2D0',
          texto: '#212121',
          'texto-suave': '#4B5563',
        },
      },
      borderRadius: {
        'pc-card': '16px',
        'pc-pill': '9999px',
      },
      boxShadow: {
        'pc-card': '0 2px 10px rgba(2, 63, 30, 0.08)',
      },
      // Entrada da home no celular: o painel claro sobe como uma folha. Usada com motion-safe (respeita "reduzir movimento").
      keyframes: {
        'pc-folha': {
          from: { opacity: '0.4', transform: 'translateY(160px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pc-folha': 'pc-folha 500ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
