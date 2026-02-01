
export function AppBanner() {
  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-background via-card to-secondary p-8 md:p-12 min-h-[300px] flex items-center border border-border">
      <div className="relative z-10 max-w-lg">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
          More possibilities in the <br/> OfferCars app
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Install the app via QR-code or download from App Store and Google Play
        </p>
        
        <div className="flex flex-wrap gap-4">
          <a href="#" className="hover:opacity-80 transition-opacity">
             <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="h-10" />
          </a>
          <a href="#" className="hover:opacity-80 transition-opacity">
             <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-10" />
          </a>
        </div>
      </div>
      
      {/* Clean App Screenshot */}
      <div className="absolute right-16 -bottom-12 w-[240px] hidden md:block transform rotate-[-6deg] hover:rotate-0 transition-transform duration-500">
        <img 
          src="/app_banner.jpg" 
          alt="App Screen" 
          className="w-full h-auto rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[6px] border-black/20"
        />
      </div>
    </div>
  )
}
