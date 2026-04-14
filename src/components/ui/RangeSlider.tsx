import * as SliderPrimitive from '@radix-ui/react-slider'

/**
 * Slider de rango con dos thumbs (mínimo y máximo).
 * Usado en filtros avanzados del Inventario.
 */
export function RangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onValueChange,
}: {
  min: number
  max: number
  valueMin: number
  valueMax: number
  onValueChange: (min: number, max: number) => void
}) {
  return (
    <SliderPrimitive.Root
      min={min}
      max={max}
      step={1}
      value={[valueMin, valueMax]}
      onValueChange={([lo, hi]) => onValueChange(lo, hi)}
      className="relative flex w-full touch-none items-center"
      style={{ height: '20px' }}
    >
      <SliderPrimitive.Track
        className="relative h-1 w-full grow overflow-hidden rounded-full"
        style={{ background: 'var(--border)' }}
      >
        <SliderPrimitive.Range
          className="absolute h-full rounded-full"
          style={{ background: 'var(--color-accent)' }}
        />
      </SliderPrimitive.Track>
      {/* Thumb mínimo */}
      <SliderPrimitive.Thumb
        className="block h-5 w-5 rounded-full border-2 shadow transition-colors focus:outline-none"
        style={{ background: 'var(--bg)', borderColor: 'var(--color-accent)' }}
      />
      {/* Thumb máximo */}
      <SliderPrimitive.Thumb
        className="block h-5 w-5 rounded-full border-2 shadow transition-colors focus:outline-none"
        style={{ background: 'var(--bg)', borderColor: 'var(--color-accent)' }}
      />
    </SliderPrimitive.Root>
  )
}
