import { useState, useEffect } from 'react'
import { Shield, ChevronRight } from 'lucide-react'

type Section = {
  id: string
  title: string
  content: React.ReactNode
}

const sections: Section[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    content: (
      <>
        <p>
          Welcome to OfferCars. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
        </p>
        <p>
          By using OfferCars, you agree to the collection and use of information in accordance with this policy.
        </p>
      </>
    ),
  },
  {
    id: 'information-collected',
    title: 'Information We Collect',
    content: (
      <>
        <p className="font-medium text-foreground">Personal Information</p>
        <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
          <li>Name, email address, and phone number when you create an account</li>
          <li>Profile information including profile photo and bio</li>
          <li>Payment information when you make transactions</li>
          <li>Communication data from messages sent through our platform</li>
        </ul>

        <p className="font-medium text-foreground mt-5">Automatically Collected Information</p>
        <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
          <li>Device information (device type, operating system, unique device identifiers)</li>
          <li>Log data (IP address, browser type, pages visited, time spent)</li>
          <li>Location data (with your consent) for showing relevant listings</li>
          <li>Cookies and similar tracking technologies</li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use',
    title: 'How We Use Your Information',
    content: (
      <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
        <li>To provide and maintain our services</li>
        <li>To process your transactions and send related information</li>
        <li>To send you technical notices, updates, and security alerts</li>
        <li>To respond to your comments, questions, and customer service requests</li>
        <li>To monitor and analyze trends, usage, and activities</li>
        <li>To detect, investigate, and prevent fraudulent transactions and abuse</li>
        <li>To personalize and improve your experience</li>
      </ul>
    ),
  },
  {
    id: 'sharing',
    title: 'Information Sharing',
    content: (
      <ul className="list-disc list-inside space-y-2 ml-2 text-sm">
        <li><strong className="text-foreground">With Other Users:</strong> When you create a listing or communicate through our platform, certain information is visible to other users.</li>
        <li><strong className="text-foreground">With Service Providers:</strong> We share data with third-party vendors who perform services for us.</li>
        <li><strong className="text-foreground">For Business Transfers:</strong> In connection with any merger, sale of company assets, or acquisition.</li>
        <li><strong className="text-foreground">For Legal Purposes:</strong> When required by law or to protect our rights.</li>
      </ul>
    ),
  },
  {
    id: 'data-security',
    title: 'Data Security',
    content: (
      <>
        <p>We implement appropriate technical and organizational security measures:</p>
        <ul className="list-disc list-inside space-y-1 ml-2 mt-3 text-sm">
          <li>Encryption of data in transit using TLS/SSL</li>
          <li>Encryption of sensitive data at rest</li>
          <li>Regular security assessments and penetration testing</li>
          <li>Access controls and authentication mechanisms</li>
        </ul>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    content: (
      <>
        <p>You have the following rights regarding your personal information:</p>
        <ul className="list-disc list-inside space-y-1 ml-2 mt-3 text-sm">
          <li><strong className="text-foreground">Access:</strong> Request access to your personal data</li>
          <li><strong className="text-foreground">Correction:</strong> Request correction of inaccurate data</li>
          <li><strong className="text-foreground">Deletion:</strong> Request deletion of your personal data</li>
          <li><strong className="text-foreground">Portability:</strong> Request transfer of your data</li>
          <li><strong className="text-foreground">Opt-out:</strong> Opt out of marketing communications</li>
        </ul>
        <p className="mt-3 text-sm">To exercise any of these rights, contact us at privacy@offercars.com</p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact Us',
    content: (
      <>
        <p>If you have any questions about this Privacy Policy:</p>
        <ul className="list-none space-y-1 mt-3 text-sm">
          <li><strong className="text-foreground">Email:</strong> privacy@offercars.com</li>
          <li><strong className="text-foreground">Address:</strong> Dubai Silicon Oasis, DDP, Dubai, UAE</li>
          <li><strong className="text-foreground">Phone:</strong> +971 4 555 1234</li>
        </ul>
      </>
    ),
  },
]

export function Privacy() {
  const [activeSection, setActiveSection] = useState<string>('introduction')

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
              <Shield className="h-3.5 w-3.5" />
              <span>Legal</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Learn how we collect, use, and protect your personal information.
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
                On this page
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
                <nav className="mt-3 space-y-1">
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
          </div>
        </div>
      </div>
    </div>
  )
}
