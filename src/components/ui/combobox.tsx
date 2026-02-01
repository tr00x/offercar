import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ComboboxOption {
  value: string | number
  label: string
  image?: string
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value?: string | number
  onChange: (value: string | number) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
  triggerClassName?: string
  filterOptions?: (options: ComboboxOption[], search: string) => ComboboxOption[]
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  className,
  disabled = false,
  triggerClassName,
  filterOptions,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = React.useMemo(() => {
    if (filterOptions) {
      return filterOptions(options, search)
    }
    if (!search) return options
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    )
  }, [options, search, filterOptions])

  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-muted px-3 py-2 text-sm ring-offset-background cursor-pointer",
          disabled ? "cursor-not-allowed opacity-50" : "hover:bg-accent hover:text-accent-foreground",
          open && "ring-2 ring-ring ring-offset-2",
          triggerClassName
        )}
        onClick={() => !disabled && setOpen(!open)}
      >
        <span className={cn("truncate flex items-center gap-2", !selectedOption && "text-muted-foreground")}>
          {selectedOption?.image && (
            <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-sm bg-muted">
              <img 
                src={selectedOption.image} 
                alt="" 
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          )}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-max min-w-full overflow-auto rounded-md border bg-card text-card-foreground shadow-md [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="sticky top-0 z-10 bg-card p-2 border-b">
            <div className="flex items-center px-2 border rounded-md bg-background">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    value === option.value && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                    setSearch("")
                  }}
                >
                  {option.image && (
                    <div className="relative mr-2 h-6 w-6 shrink-0 overflow-hidden rounded-sm bg-muted">
                      <img 
                        src={option.image} 
                        alt="" 
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  <span className="flex-1 text-left whitespace-nowrap">{option.label}</span>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4 shrink-0",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
