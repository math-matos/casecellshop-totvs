/**
 * Selo de patrocínio exibido no topo da página.
 *
 * A logo mora em `public/`, então é referenciada pela URL servida, sem passar
 * pelo bundler (recomendação do Vite para arquivos estáticos).
 */
export function TotvsOffering() {
  return (
    <div className="offering">
      <span className="offering__label">Um oferecimento</span>
      <img
        className="offering__logo"
        src="/totvs-logo.png"
        alt="TOTVS"
        width={92}
        height={27}
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}
