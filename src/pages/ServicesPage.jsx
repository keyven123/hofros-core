import FeatureCard from '../components/common/FeatureCard'
import SectionTitle from '../components/common/SectionTitle'

const services = [
  {
    title: 'Platform Engineering',
    description: 'Build stable web foundations, CI/CD flow, and deployment automation.',
  },
  {
    title: 'Product Delivery',
    description:
      'Translate business goals into modular features with transparent execution.',
  },
  {
    title: 'Data & Integrations',
    description:
      'Connect internal and external systems through secure APIs and MySQL modeling.',
  },
]

function ServicesPage() {
  return (
    <section>
      <SectionTitle
        eyebrow="Services"
        title="Capabilities prepared for growth"
        description="The hofros foundation supports digital products from MVP phase to enterprise evolution."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {services.map((service) => (
          <FeatureCard
            key={service.title}
            title={service.title}
            description={service.description}
          />
        ))}
      </div>
    </section>
  )
}

export default ServicesPage
