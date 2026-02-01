import { Link } from 'react-router-dom'
import logo from '@/assets/logo.png'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-4">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src={logo} alt="OfferCars" className="h-10 w-auto" />
              <span className="text-xl font-bold tracking-tight">OfferCars</span>
            </Link>
            <p className="text-sm text-neutral-500">
              Marketplace for people who actually care about cars. Discovery, chat,
              logistics – all in one flow.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-neutral-400">
                Verified dealers
              </span>
              <span className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-neutral-400">
                Built-in logistics
              </span>
              <span className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-neutral-400">
                Secure chat
              </span>
            </div>
          </div>

          <div className="grid flex-1 gap-8 text-sm md:grid-cols-3">
            <div>
              <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
                Product
              </h4>
              <ul className="space-y-2 text-neutral-400">
                <li>
                  <Link to="/index" className="transition-colors hover:text-white">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/cars" className="transition-colors hover:text-white">
                    Browse cars
                  </Link>
                </li>
                <li>
                  <Link to="/sell" className="transition-colors hover:text-white">
                    Sell your car
                  </Link>
                </li>
                <li>
                  <Link to="/garage" className="transition-colors hover:text-white">
                    My Garage
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
                For business
              </h4>
              <ul className="space-y-2 text-neutral-400">
                <li>
                  <Link to="/biz/apply" className="transition-colors hover:text-white">
                    Become a dealer
                  </Link>
                </li>
                <li>
                  <Link to="/biz/apply" className="transition-colors hover:text-white">
                    Logistics partners
                  </Link>
                </li>
                <li>
                  <Link to="/biz/apply" className="transition-colors hover:text-white">
                    Broker & service
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
                Info
              </h4>
              <ul className="space-y-2 text-neutral-400">
                <li>
                  <Link to="/help" className="transition-colors hover:text-white">
                    Help center
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="transition-colors hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="transition-colors hover:text-white">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="transition-colors hover:text-white">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-white/5 pt-6 text-xs text-neutral-500 md:flex-row md:items-center md:justify-between">
          <p>
            &copy; {new Date().getFullYear()} OfferCars. Crafted for modern car marketplaces.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-md border border-white/5 bg-white/[0.02] px-3 py-1">
              Live inventory
            </span>
            <span className="rounded-md border border-white/5 bg-white/[0.02] px-3 py-1">
              Dubai — Global
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
