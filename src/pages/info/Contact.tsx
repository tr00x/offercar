import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

type ContactReason = {
  id: string
  label: string
}

const contactReasons: ContactReason[] = [
  { id: 'general', label: 'General inquiry' },
  { id: 'buying', label: 'Buying help' },
  { id: 'selling', label: 'Selling help' },
  { id: 'business', label: 'Business partnership' },
  { id: 'report', label: 'Report an issue' },
  { id: 'feedback', label: 'Feedback' },
]

export function Contact() {
  const [selectedReason, setSelectedReason] = useState<string>('general')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  if (isSubmitted) {
    return (
      <div className="bg-background min-h-screen text-foreground flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary text-foreground mb-6">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Message sent!</h1>
          <p className="text-muted-foreground mb-8">
            Thank you for reaching out. We'll get back to you within 24 hours.
          </p>
          <div className="space-y-3">
            <Link
              to="/"
              className="block w-full px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-colors"
            >
              Back to home
            </Link>
            <button
              onClick={() => {
                setIsSubmitted(false)
                setFormData({ name: '', email: '', phone: '', message: '' })
              }}
              className="block w-full px-6 py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors"
            >
              Send another message
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen text-foreground pb-20">
      {/* Hero */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-muted-foreground text-xs mb-4">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Get in touch</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Contact us
            </h1>
            <p className="text-muted-foreground">
              Have a question or need assistance? We're here to help.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-[1fr,340px] gap-8 lg:gap-12">
          {/* Contact Form */}
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl bg-card border border-border p-6 md:p-8">
              <h2 className="text-xl font-medium mb-6">Send us a message</h2>

              {/* Reason Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-muted-foreground mb-3">What can we help you with?</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {contactReasons.map((reason) => (
                    <button
                      key={reason.id}
                      type="button"
                      onClick={() => setSelectedReason(reason.id)}
                      className={`p-3 rounded-xl text-left transition-all border text-sm ${
                        selectedReason === reason.id
                          ? 'bg-primary/10 border-primary/30 text-foreground'
                          : 'bg-secondary/30 border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-2">
                      Your name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="bg-background border-border focus:border-primary/30"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">
                      Email address
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      className="bg-background border-border focus:border-primary/30"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-2">
                    Phone number <span className="text-muted-foreground/60">(optional)</span>
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+971 50 123 4567"
                    className="bg-background border-border focus:border-primary/30"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-muted-foreground mb-2">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us how we can help..."
                    rows={5}
                    className="bg-background border-border focus:border-primary/30 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-6 text-base font-medium bg-primary text-primary-foreground hover:opacity-90"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Send message
                    </span>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Contact Info Sidebar */}
          <div className="order-1 lg:order-2 space-y-4">
            {/* Quick Contact */}
            <div className="rounded-2xl bg-card border border-border p-5">
              <h3 className="text-sm font-medium mb-4">Quick contact</h3>
              <div className="space-y-3">
                <a
                  href="mailto:support@offercars.com"
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary transition-colors group"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary text-muted-foreground group-hover:text-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">Email</span>
                    <span className="text-sm">support@offercars.com</span>
                  </div>
                </a>

                <a
                  href="tel:+97145551234"
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary transition-colors group"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary text-muted-foreground group-hover:text-foreground">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">Phone</span>
                    <span className="text-sm">+971 4 555 1234</span>
                  </div>
                </a>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">Address</span>
                    <span className="text-sm">Dubai Silicon Oasis, DDP<br />Dubai, UAE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Working Hours */}
            <div className="rounded-2xl bg-card border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Working hours</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monday - Friday</span>
                  <span>9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saturday</span>
                  <span>10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sunday</span>
                  <span className="text-muted-foreground/60">Closed</span>
                </div>
              </div>
            </div>

            {/* Help Center Link */}
            <Link
              to="/help"
              className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border hover:bg-secondary/50 transition-colors group"
            >
              <div>
                <span className="block font-medium text-sm">Browse Help Center</span>
                <span className="text-xs text-muted-foreground">Find answers to common questions</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
