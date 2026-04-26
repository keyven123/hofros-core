import LogoMark from '../common/LogoMark'

function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="inline-flex items-center gap-2">
          <LogoMark size="sm" />
        </div>

        <p className="text-sm text-slate-500">© {new Date().getFullYear()} hofros. All rights reserved.</p>

        <div className="flex items-center gap-5 text-sm text-slate-500">
          <a href="/#privacy" className="transition hover:text-[#103f6f]">
            Privacy
          </a>
          <a href="/#terms" className="transition hover:text-[#103f6f]">
            Terms
          </a>
          <a href="/#contact" className="transition hover:text-[#103f6f]">
            Contact
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
