import SectionTitle from '../components/common/SectionTitle'

function ContactPage() {
  return (
    <section className="max-w-3xl">
      <SectionTitle
        eyebrow="Contact"
        title="Start your next project with hofros"
        description="Use this section as a placeholder for your real contact form or customer support channels."
      />

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <dl className="space-y-4 text-sm text-slate-600">
          <div>
            <dt className="font-medium text-slate-900">Email</dt>
            <dd>hello@hofros.local</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Phone</dt>
            <dd>+62 000-0000-0000</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Address</dt>
            <dd>Jakarta, Indonesia</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}

export default ContactPage
