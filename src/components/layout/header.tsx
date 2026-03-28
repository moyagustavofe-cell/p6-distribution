interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-[#E5E5E5] bg-white px-8 py-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-black">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-[#737373]">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}
