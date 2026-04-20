import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageCarouselProps {
  images: string[]
  linkTo: string
}

const ImageCarousel = ({ images, linkTo }: ImageCarouselProps) => {
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef<number | null>(null)

  if (images.length === 0) return null

  const prev = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrent((c) => Math.max(0, c - 1))
  }

  const next = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrent((c) => Math.min(images.length - 1, c + 1))
  }

  const goTo = (e: React.MouseEvent, i: number) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrent(i)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 40) setCurrent((c) => Math.min(images.length - 1, c + 1))
    else if (diff < -40) setCurrent((c) => Math.max(0, c - 1))
    touchStartX.current = null
  }

  const atStart = current === 0
  const atEnd = current === images.length - 1

  return (
    <a
      href={linkTo}
      className="block relative w-full h-48 overflow-hidden bg-slate-100 dark:bg-slate-700 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="flex h-full transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((src, i) => (
          <div key={i} className="w-full h-full shrink-0">
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className={`absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:cursor-pointer transition-opacity ${atStart ? 'opacity-20' : 'opacity-80 hover:opacity-100'}`}
            disabled={atStart}
          >
            <ChevronLeft size={16} className="text-white" />
          </button>

          <button
            onClick={next}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:cursor-pointer transition-opacity ${atEnd ? 'opacity-20' : 'opacity-80 hover:opacity-100'}`}
            disabled={atEnd}
          >
            <ChevronRight size={16} className="text-white" />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => goTo(e, i)}
                className={`rounded-full transition-all hover:cursor-pointer ${i === current ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </>
      )}
    </a>
  )
}

export default ImageCarousel
