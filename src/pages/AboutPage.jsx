import SectionTitle from '../components/common/SectionTitle'

function AboutPage() {
  return (
    <section className="max-w-4xl">
      <SectionTitle
        eyebrow="About hofros"
        title="A platform focused on quality and scalability"
        description="hofros is designed as a modern digital platform where product, engineering, and operations can scale together from day one."
      />

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-600 shadow-sm">
        <p>
          The frontend follows a page-first architecture to keep features isolated and
          maintainable.
        </p>
        <p>
          The backend adopts Laravel conventions with dedicated folders for controllers,
          services, requests, and models to support enterprise-grade development.
        </p>
      </div>
    </section>
  )
}

export default AboutPage
