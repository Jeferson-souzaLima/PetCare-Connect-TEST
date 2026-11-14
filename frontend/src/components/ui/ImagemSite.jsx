/**
 * Imagem do site servida pelo R2 em duas larguras (celular e desktop); o navegador escolhe pelo `sizes`.
 * Se o arquivo falhar (404, rede), chama `aoFalhar` para a tela voltar ao fallback.
 */
export function ImagemSite({ celular, desktop, larguras, sizes, alt, className = "", aoFalhar }) {
  const [larguraCelular, larguraDesktop] = larguras;
  return (
    <img
      src={celular}
      srcSet={`${celular} ${larguraCelular}w, ${desktop} ${larguraDesktop}w`}
      sizes={sizes}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={aoFalhar}
      className={className}
    />
  );
}
