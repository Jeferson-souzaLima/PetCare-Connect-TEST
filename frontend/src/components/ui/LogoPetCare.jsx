/**
 * Logo do PetCare Connect para fundo verde (letras claras, fundo transparente), em public/.
 * WebP em 1x/2x/3x com PNG 2x de reserva; width/height fixos para a página não pular ao carregar.
 * Em fundo claro (login, telas brancas) use o /logo.png, que tem fundo escuro próprio.
 */
export function LogoPetCare({ className = "", alt = "PetCare Connect" }) {
  return (
    <picture>
      <source type="image/webp" srcSet="/logo-header.webp 1x, /logo-header@2x.webp 2x, /logo-header@3x.webp 3x" />
      <img src="/logo-header@2x.png" width={90} height={48} alt={alt} decoding="async" className={`w-auto ${className}`} />
    </picture>
  );
}
