import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  ChevronDown,
  Car,
  CreditCard,
  Truck,
  Shield,
  MessageCircle,
  Settings,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Send,
  Bot,
  User,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'

type FAQItem = {
  question: string
  answer: string
}

type Category = {
  id: string
  title: string
  icon: React.ReactNode
  description: string
  faqs: FAQItem[]
}

const categories: Category[] = [
  {
    id: 'buying',
    title: 'Buying a car',
    icon: <Car className="h-5 w-5" />,
    description: 'Everything about finding and purchasing your perfect car',
    faqs: [
      {
        question: 'How do I search for a car?',
        answer:
          'Use our powerful search filters on the main page. You can filter by brand, model, year, price range, mileage, and many other parameters. Save your searches to get notified about new listings.',
      },
      {
        question: 'How do I contact a seller?',
        answer:
          'Click the "Message" button on any car listing to start a chat with the seller. You can discuss details, negotiate price, and arrange viewings all within our secure messaging system.',
      },
      {
        question: 'Can I inspect the car before buying?',
        answer:
          'Absolutely! We recommend arranging an inspection with the seller. You can also use our verified service centers for professional pre-purchase inspections.',
      },
      {
        question: 'What payment methods are accepted?',
        answer:
          'Payment terms are agreed between buyer and seller. We recommend using secure payment methods and meeting at safe locations for transactions.',
      },
    ],
  },
  {
    id: 'selling',
    title: 'Selling your car',
    icon: <CreditCard className="h-5 w-5" />,
    description: 'Tips and guidance for selling your vehicle',
    faqs: [
      {
        question: 'How do I list my car for sale?',
        answer:
          'Click "Sell your car" in the navigation, fill in the details about your vehicle, upload high-quality photos, and set your price. Your listing will be live within minutes.',
      },
      {
        question: 'How many photos can I upload?',
        answer:
          'You can upload up to 20 photos per listing. We recommend including exterior shots from all angles, interior photos, engine bay, and any special features.',
      },
      {
        question: 'How do I price my car competitively?',
        answer:
          'Research similar listings on our platform to understand market prices. Consider your car\'s condition, mileage, service history, and any modifications when setting your price.',
      },
      {
        question: 'Can I edit my listing after publishing?',
        answer:
          'Yes! Go to your Garage, find your listing, and click Edit. You can update photos, description, and price at any time.',
      },
    ],
  },
  {
    id: 'logistics',
    title: 'Shipping & Delivery',
    icon: <Truck className="h-5 w-5" />,
    description: 'Car transportation and delivery services',
    faqs: [
      {
        question: 'Do you offer car shipping?',
        answer:
          'Yes! We partner with verified logistics companies to offer car shipping across the UAE and internationally. Contact our logistics partners through the Business section.',
      },
      {
        question: 'How much does shipping cost?',
        answer:
          'Shipping costs depend on distance, vehicle size, and delivery speed. Get instant quotes by contacting our logistics partners directly.',
      },
      {
        question: 'Is my car insured during transport?',
        answer:
          'All our logistics partners provide insurance coverage during transport. Verify the coverage details with your chosen transporter before booking.',
      },
      {
        question: 'How long does delivery take?',
        answer:
          'Local UAE delivery typically takes 1-3 days. International shipping varies by destination - usually 2-4 weeks for standard sea freight.',
      },
    ],
  },
  {
    id: 'safety',
    title: 'Safety & Security',
    icon: <Shield className="h-5 w-5" />,
    description: 'Protecting yourself during transactions',
    faqs: [
      {
        question: 'How do I avoid scams?',
        answer:
          'Never send money before seeing the car in person. Use our in-app messaging. Meet in public places. Verify documents carefully. If a deal seems too good to be true, it probably is.',
      },
      {
        question: 'Are sellers verified?',
        answer:
          'Dealer accounts go through our verification process. Look for the "Verified Dealer" badge. Private sellers can also verify their identity for additional trust.',
      },
      {
        question: 'What if I have a dispute with a seller?',
        answer:
          'Contact our support team through the Help Center. We can mediate disputes and take action against users who violate our terms.',
      },
      {
        question: 'How is my personal data protected?',
        answer:
          'We use industry-standard encryption and security practices. Read our Privacy Policy for detailed information about data protection.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & Settings',
    icon: <Settings className="h-5 w-5" />,
    description: 'Managing your OfferCars account',
    faqs: [
      {
        question: 'How do I create an account?',
        answer:
          'Click "Sign in" and follow the registration process. You can sign up with your email or phone number. Verification helps build trust with other users.',
      },
      {
        question: 'How do I reset my password?',
        answer:
          'On the login page, click "Forgot password". Enter your email and we\'ll send you a reset link. Check your spam folder if you don\'t see it.',
      },
      {
        question: 'Can I delete my account?',
        answer:
          'Yes. Go to Profile > Settings and select "Delete Account". This action is permanent and will remove all your listings and messages.',
      },
      {
        question: 'How do I become a dealer?',
        answer:
          'Apply through the "For Business" section. Submit your business documents and wait for verification. Approved dealers get additional features and visibility.',
      },
    ],
  },
]

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const aiResponses: Record<string, string> = {
  default:
    "I can help you with questions about buying or selling cars, shipping, account settings, and more. What would you like to know?",
  price:
    "To price your car competitively, check similar listings on OfferCars. Consider mileage, condition, service history, and market demand.",
  sell: "To sell your car: click 'Sell your car', upload photos, fill in details, and set your price. Your listing goes live instantly.",
  buy: "Use our filters to find cars by brand, model, year, price, and location. Save searches to get notifications for new listings.",
  shipping:
    "We partner with verified logistics companies for shipping across UAE and internationally. Contact our partners through the Business section.",
  payment:
    "Payment is arranged between buyer and seller. We recommend meeting in person and using secure payment methods.",
  verify:
    "To become a verified dealer, go to 'For Business' and submit your application. Verification takes 2-3 business days.",
  contact:
    "Reach our support at support@offercars.com or +971 4 555 1234. Live chat is available 24/7.",
}

function getAiResponse(question: string): string {
  const q = question.toLowerCase()
  if (q.includes('price') || q.includes('cost') || q.includes('worth') || q.includes('value'))
    return aiResponses.price
  if (q.includes('sell') || q.includes('list') || q.includes('post'))
    return aiResponses.sell
  if (q.includes('buy') || q.includes('find') || q.includes('search') || q.includes('filter'))
    return aiResponses.buy
  if (q.includes('ship') || q.includes('deliver') || q.includes('transport') || q.includes('logistics'))
    return aiResponses.shipping
  if (q.includes('pay') || q.includes('money') || q.includes('transfer'))
    return aiResponses.payment
  if (q.includes('verify') || q.includes('dealer') || q.includes('business') || q.includes('badge'))
    return aiResponses.verify
  if (q.includes('contact') || q.includes('support') || q.includes('help') || q.includes('call'))
    return aiResponses.contact
  return aiResponses.default
}

function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm OfferBot. Ask me about buying, selling, or shipping cars.",
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsTyping(true)

    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 800))

    const response = getAiResponse(userMessage)
    setIsTyping(false)
    setMessages((prev) => [...prev, { role: 'assistant', content: response }])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const suggestedQuestions = ['Sell my car', 'Car value', 'Shipping', 'Become dealer']

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground font-medium shadow-lg hover:opacity-90 transition-all ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline text-sm">Ask AI</span>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[340px] max-w-[calc(100vw-48px)] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-secondary border-b border-border">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-foreground">OfferBot</h3>
              <p className="text-[11px] text-muted-foreground">AI Assistant</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-3 space-y-3 scrollbar-hide">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-md shrink-0 ${
                    msg.role === 'assistant'
                      ? 'bg-primary/10 text-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {msg.role === 'assistant' ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                </div>
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                    msg.role === 'assistant'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-foreground shrink-0">
                  <Bot className="h-3 w-3" />
                </div>
                <div className="bg-secondary rounded-xl px-3 py-2.5">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 2 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border bg-secondary/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function AccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left transition-colors hover:text-foreground text-secondary-foreground"
      >
        <span className="font-medium pr-4">{item.question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 pb-4' : 'max-h-0'
        }`}
      >
        <p className="text-muted-foreground leading-relaxed text-sm">{item.answer}</p>
      </div>
    </div>
  )
}

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [openFaqs, setOpenFaqs] = useState<Set<string>>(new Set())

  const toggleFaq = (categoryId: string, index: number) => {
    const key = `${categoryId}-${index}`
    setOpenFaqs((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      faqs: cat.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.faqs.length > 0 || !searchQuery)

  const displayCategories = selectedCategory
    ? filteredCategories.filter((cat) => cat.id === selectedCategory)
    : filteredCategories

  return (
    <div className="bg-background min-h-screen text-foreground pb-20">
      {/* Floating AI Assistant */}
      <AiAssistant />

      {/* Hero Section */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-muted-foreground text-xs">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Support</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">
              Help Center
            </h1>
            <p className="text-muted-foreground">
              Find answers to common questions or contact our support team
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto mt-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-5 text-sm bg-card border-border rounded-xl focus:border-primary/30 focus:ring-0"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !selectedCategory
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
            }`}
          >
            All topics
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* Category Cards with FAQs */}
        {searchQuery && filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary mb-4">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-foreground">No results found</h3>
            <p className="text-muted-foreground text-sm">
              Try searching for something else or{' '}
              <Link to="/contact" className="text-foreground hover:underline">
                contact support
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayCategories.map((category) => (
              <div
                key={category.id}
                className="rounded-2xl bg-card border border-border overflow-hidden"
              >
                {/* Category Header */}
                <div className="flex items-start gap-4 p-5 border-b border-border">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary text-muted-foreground">
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-medium mb-0.5 text-foreground">{category.title}</h2>
                    <p className="text-muted-foreground text-sm">{category.description}</p>
                  </div>
                </div>

                {/* FAQs */}
                <div className="px-5">
                  {category.faqs.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      item={faq}
                      isOpen={openFaqs.has(`${category.id}-${index}`)}
                      onToggle={() => toggleFaq(category.id, index)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-12 rounded-2xl bg-card border border-border p-8 md:p-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary text-muted-foreground mb-4">
            <MessageCircle className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-medium mb-2 text-foreground">Still have questions?</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6 text-sm">
            Can't find what you're looking for? Our support team is ready to help.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-colors text-sm"
          >
            Contact Support
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
