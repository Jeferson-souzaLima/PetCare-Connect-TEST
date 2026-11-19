/**
 * Logo do PetCare Connect para fundo verde (letras claras, fundo transparente), em public/.
 * WebP em 90, 180 e 270 px de largura, com PNG 2x de reserva; width/height fixos para a página não pular ao carregar.
 * larguraExibida (atributo sizes) diz ao navegador o tamanho na tela, para escolher a versão nítida
 * quando o logo aparece maior que o do cabeçalho.
 * Em fundo claro use o /logo.png, que tem fundo escuro próprio.
 */
export function LogoPetCare({ className = "", alt = "PetCare Connect", larguraExibida = "90px" }) {
  return (
    <picture>
      <source
        type="image/webp"
        srcSet="/logo-header.webp 90w, /logo-header@2x.webp 180w, /logo-header@3x.webp 270w"
        sizes={larguraExibida}
      />
      <img src="/logo-header@2x.png" width={90} height={48} alt={alt} decoding="async" className={`w-auto ${className}`} />
    </picture>
  );
}
