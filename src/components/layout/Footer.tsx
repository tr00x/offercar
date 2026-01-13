import { Link } from 'react-router-dom'
import logo from '@/assets/logo.svg'

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="MashynBazar" className="h-10 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground">
              The best place to buy and sell cars. Find your perfect vehicle today.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-foreground transition-colors">
                  Browse Cars
                </Link>
              </li>
              <li>
                <Link to="/sell" className="hover:text-foreground transition-colors">
                  Sell Your Car
                </Link>
              </li>
              <li>
                <Link to="/biz/apply" className="hover:text-foreground transition-colors">
                  For Business
                </Link>
              </li>
            </ul>
          </div>

          {/* Business */}
          <div>
            <h4 className="font-semibold mb-4">For Business</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/biz/apply" className="hover:text-foreground transition-colors">
                  Become a Dealer
                </Link>
              </li>
              <li>
                <Link to="/biz/apply" className="hover:text-foreground transition-colors">
                  Logistics Services
                </Link>
              </li>
              <li>
                <Link to="/biz/apply" className="hover:text-foreground transition-colors">
                  Broker Services
                </Link>
              </li>
              <li>
                <Link to="/biz/apply" className="hover:text-foreground transition-colors">
                  Car Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MashynBazar. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
