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
      // Largura máxima do conteúdo das páginas do cliente (cabeçalho, home, catálogo).
      maxWidth: {
        'pc-pagina': '1600px',
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
        // Janelas rápidas da barra inferior e visualização rápida do produto.
        'pc-janela': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'pc-painel-lateral': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'pc-folha': 'pc-folha 500ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'pc-janela': 'pc-janela 180ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'pc-painel-lateral': 'pc-painel-lateral 320ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
