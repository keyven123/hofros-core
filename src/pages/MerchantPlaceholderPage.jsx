function MerchantPlaceholderPage({ title }) {
  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center gap-4 bg-[#f6f9ff] px-6 py-16">
      <div className="rounded-2xl border border-amber-200 bg-[#fffbeb] px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
        Work in progress
      </div>
      <h1 className="text-center text-2xl font-black tracking-tight text-[#0f3f73] md:text-3xl">{title}</h1>
      <p className="max-w-md text-center text-sm text-slate-500">
        This section is under development. Check back soon for updates.
      </p>
    </div>
  )
}

export default MerchantPlaceholderPage
