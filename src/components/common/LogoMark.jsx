import logoUrl from '../../assets/logo-hofros.png'

function LogoMark({ size = 'md' }) {
  const height = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
  }

  const key = size in height ? size : 'md'

  return (
    <img
      src={logoUrl}
      alt="Hofros"
      className={`${height[key]} w-auto object-contain object-left`}
    />
  )
}

export default LogoMark
