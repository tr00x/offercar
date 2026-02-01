const stories = [
  { id: 1, title: "Toyota Camry", price: "2 500 000 ₽", image: "https://images.unsplash.com/photo-1621007947382-bb3c3968e3bb?w=500&auto=format&fit=crop&q=60", location: "Ashgabat" },
  { id: 2, title: "BMW X5", price: "7 150 000 ₽", image: "https://images.unsplash.com/photo-1555215695-3004980adade?w=500&auto=format&fit=crop&q=60", location: "Mary" },
  { id: 3, title: "Oshan X5", price: "2 800 000 ₽", image: "https://images.unsplash.com/photo-1621007947382-bb3c3968e3bb?w=500&auto=format&fit=crop&q=60", location: "Ashgabat" }, // Duplicate placeholder
  { id: 4, title: "E-Class", price: "3 150 000 ₽", image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=500&auto=format&fit=crop&q=60", location: "Dashoguz" },
  { id: 5, title: "Hyundai Sonata", price: "1 900 000 ₽", image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&auto=format&fit=crop&q=60", location: "Ashgabat" },
]

export function Stories() {
  return (
    <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
      <div className="flex gap-4 min-w-max">
        {stories.map((story) => (
          <div key={story.id} className="relative w-40 h-24 sm:w-48 sm:h-32 rounded-lg overflow-hidden cursor-pointer group shrink-0">
            <img 
              src={story.image} 
              alt={story.title} 
              className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 right-2 text-white">
               <div className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded w-fit mb-1">
                 {story.price}
               </div>
               <div className="text-xs font-medium truncate">{story.title}, 2021</div>
               <div className="text-[10px] text-white/70 truncate">{story.location}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
