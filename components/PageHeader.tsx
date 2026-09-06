import { BrandHeading } from '@/components/BrandHeading'

interface PageHeaderProps {
  title: string
  subtitle?: string
  className?: string
  children?: React.ReactNode
  /** Good Times caps (main tab screens). Default false — FF DIN via ui-page-title. */
  brand?: boolean
}

export function PageHeader({ title, subtitle, className = '', children, brand = false }: PageHeaderProps) {
  return (
    <header className={className}>
      {brand ? (
        <BrandHeading variant="page">{title}</BrandHeading>
      ) : (
        <h1 className="ui-page-title">{title}</h1>
      )}
      {subtitle ? <p className="ui-subtitle mt-2">{subtitle}</p> : null}
      {children}
    </header>
  )
}
