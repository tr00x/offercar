import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, ChevronRight, AlertTriangle } from 'lucide-react'

type Section = {
  id: string
  title: string
  content: React.ReactNode
}

const sections: Section[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    content: (
      <>
        <p>
          By accessing or using OfferCars, you agree to be bound by these Terms of Service. These Terms constitute a legally binding agreement between you and OfferCars FZ-LLC.
        </p>
        <p>
          If you do not agree to all of these Terms, you are not authorized to use our Services.
        </p>
      </>
    ),
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    content: (
      <>
        <p>To use our Services, you must:</p>
        <ul className="list-disc list-inside space-y-1 ml-2 mt-2 text-sm">
          <li>Be at least 18 years of age</li>
          <li>Have the legal capacity to enter into binding contracts</li>
          <li>Not be prohibited from using our Services under applicable laws</li>
          <li>Provide accurate and complete registration information</li>
        </ul>
      </>
    ),
  },
  {
    id: 'accounts',
    title: 'User Accounts',
    content: (
      <>
        <p className="font-medium text-foreground">Account Security</p>
        <p className="text-sm mt-1">You are responsible for safeguarding your password and for all activities that occur under your account.</p>
        <ul className="list-disc list-inside space-y-1 ml-2 mt-3 text-sm">
          <li>Not share your account credentials with anyone</li>
          <li>Notify us immediately of any unauthorized use</li>
          <li>Use strong, unique passwords</li>
        </ul>
      </>
    ),
  },
  {
    id: 'listings',
    title: 'Vehicle Listings',
    content: (
      <>
        <p className="font-medium text-foreground">Listing Requirements</p>
        <ul className="list-disc list-inside space-y-1 ml-2 mt-2 text-sm">
          <li>Be the legal owner or authorized representative</li>
          <li>Provide accurate and complete information</li>
          <li>Include clear photographs of the actual vehicle</li>
          <li>Disclose any known defects or damage</li>
        </ul>

        <p className="font-medium text-foreground mt-5">Prohibited Listings</p>
        <ul className="list-disc list-inside space-y-1 ml-2 mt-2 text-sm">
          <li>Stolen vehicles or those with undisclosed liens</li>
          <li>Vehicles with odometer tampering</li>
          <li>Misrepresented vehicles</li>
          <li>Vehicles that cannot be legally transferred</li>
        </ul>
      </>
    ),
  },
  {
    id: 'transactions',
    title: 'Transactions',
    content: (
      <>
        <p>OfferCars is a platform that connects buyers and sellers. We are not a party to any transaction between users.</p>
        <ul className="list-disc list-inside space-y-1 ml-2 mt-3 text-sm">
          <li>All transactions are between the buyer and seller directly</li>
          <li>We do not guarantee the quality, safety, or legality of any vehicle</li>
          <li>We do not verify vehicle history or seller representations</li>
          <li>Payment terms are arranged between parties</li>
        </ul>
      </>
    ),
  },
  {
    id: 'conduct',
    title: 'User Conduct',
    content: (
      <>
        <p>When using our Services, you agree NOT to:</p>
        <ul className="list-disc list-inside space-y-1 ml-2 mt-2 text-sm">
          <li>Violate any applicable laws or regulations</li>
          <li>Post false, misleading, or fraudulent content</li>
          <li>Harass, abuse, or threaten other users</li>
          <li>Spam or send unsolicited communications</li>
          <li>Attempt to gain unauthorized access to our systems</li>
          <li>Interfere with the proper functioning of our Services</li>
        </ul>
      </>
    ),
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    content: (
      <>
        <div className="p-4 rounded-xl bg-secondary border border-border mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-secondary-foreground">
              Our services are provided "as is" without warranties of any kind, either express or implied.
            </p>
          </div>
        </div>
        <p className="text-sm">We do not warrant that our Services will be uninterrupted, error-free, or secure.</p>
      </>
    ),
  },
  {
    id: 'limitation',
    title: 'Limitation of Liability',
    content: (
      <p className="text-sm">
        To the maximum extent permitted by law, OfferCars shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our Services.
      </p>
    ),
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    content: (
      <p className="text-sm">
        These Terms shall be governed by and construed in accordance with the laws of the United Arab Emirates. Any disputes shall be resolved through binding arbitration in Dubai, UAE.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact Information',
    content: (
      <>
        <p>If you have any questions about these Terms:</p>
        <ul className="list-none space-y-1 mt-3 text-sm">
          <li><strong className="text-foreground">Email:</strong> legal@offercars.com</li>
          <li><strong className="text-foreground">Address:</strong> Dubai Silicon Oasis, DDP, Dubai, UAE</li>
        </ul>
        <p className="mt-4 text-sm">
          For privacy inquiries, see our <Link to="/privacy" className="text-foreground hover:underline">Privacy Policy</Link>.
        </p>
      </>
    ),
  },
]

export function Terms() {
  const [activeSection, setActiveSection] = useState<string>('acceptance')

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map((s) => ({
        id: s.id,
        element: document.getElementById(s.id),
      }))

      const scrollPosition = window.scrollY + 200

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i]
        if (section.element && section.element.offsetTop <= scrollPosition) {
          setActiveSection(section.id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const bodyRect = document.body.getBoundingClientRect().top
      const elementRect = element.getBoundingClientRect().top
      const elementPosition = elementRect - bodyRect
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div className="bg-background min-h-screen text-foreground pb-20">
      {/* Hero */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-muted-foreground text-xs mb-4">
              <FileText className="h-3.5 w-3.5" />
              <span>Legal</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Please read these terms carefully before using OfferCars.
            </p>
            <p className="text-sm text-muted-foreground/60 mt-3">
              Last updated: January 15, 2026
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-[200px,1fr] gap-8 lg:gap-12">
          {/* Table of Contents */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Table of Contents
              </h3>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                      activeSection === section.id
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <ChevronRight className={`h-3 w-3 shrink-0 ${activeSection === section.id ? 'opacity-100' : 'opacity-0'}`} />
                    <span className="truncate">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="max-w-2xl">
            {/* Mobile ToC */}
            <div className="lg:hidden mb-8">
              <details className="group rounded-xl bg-card border border-border p-4">
                <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-medium">
                  Table of Contents
                  <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                </summary>
                <nav className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>
              </details>
            </div>

            {/* Sections */}
            <div className="space-y-10">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="text-xl font-medium mb-4">{section.title}</h2>
                  <div className="text-muted-foreground space-y-3 leading-relaxed">
                    {section.content}
                  </div>
                </section>
              ))}
            </div>

            {/* Agreement Notice */}
            <div className="mt-12 p-5 rounded-xl bg-card border border-border">
              <p className="text-sm text-muted-foreground">
                By using OfferCars, you acknowledge that you have read and agree to these Terms of Service and our{' '}
                <Link to="/privacy" className="text-foreground hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
