function SectionTitle({ eyebrow, title, description }) {
  return (
    <header className="mb-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
        {title}
      </h2>
      <p className="mt-3 max-w-3xl text-base text-slate-600">{description}</p>
    </header>
  )
}

export default SectionTitle
