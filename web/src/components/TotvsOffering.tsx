/**
 * Selo de patrocínio exibido no topo da página.
 *
 * A logo mora em `public/`, então é referenciada pela URL servida, sem passar
 * pelo bundler (recomendação do Vite para arquivos estáticos).
 */
export function TotvsOffering() {
  return (
    <div className="flex flex-none flex-col items-end gap-1.5 max-[640px]:items-start">
      <span className="text-[10.5px] font-semibold uppercase tracking-[1.1px] text-muted">
        Um oferecimento
      </span>
      <img
        className="block h-auto w-[92px]"
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
