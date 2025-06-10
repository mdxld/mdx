# `@mdxui/magicui` - Motion & Animation Components

A collection of beautiful motion and visual effect components powered by Framer Motion. Create engaging user interfaces with animated text, interactive elements, and stunning visual effects.

## Features

- **Animated Text** - Various text animation effects and transitions
- **Visual Effects** - Interactive elements like Globe, Confetti, and more
- **Framer Motion** - Built on top of Framer Motion for smooth animations
- **TypeScript** - Full TypeScript support with proper type definitions
- **Customizable** - Flexible props for customizing animations and effects

## Installation

```bash
npm install @mdxui/magicui
# or
pnpm add @mdxui/magicui
# or
yarn add @mdxui/magicui
```

## Usage

### Animated Text Components

```tsx
import { 
  TextAnimate, 
  TypingAnimation, 
  WordRotate,
  HyperText,
  AnimatedGradientText 
} from '@mdxui/magicui'

export default function TextAnimations() {
  return (
    <div>
      <TextAnimate text="Animated text effect" />
      <TypingAnimation text="Typing animation..." />
      <WordRotate words={['Amazing', 'Beautiful', 'Stunning']} />
      <HyperText text="Hyper text effect" />
      <AnimatedGradientText>Gradient animated text</AnimatedGradientText>
    </div>
  )
}
```

### Visual Effect Components

```tsx
import { Globe, Confetti, NumberTicker } from '@mdxui/magicui'

export default function VisualEffects() {
  return (
    <div>
      <Globe />
      <Confetti />
      <NumberTicker value={1000} />
    </div>
  )
}
```

### Text Reveal and Morphing

```tsx
import { 
  TextReveal, 
  MorphingText, 
  BoxReveal,
  FlipText 
} from '@mdxui/magicui'

export default function RevealEffects() {
  return (
    <div>
      <TextReveal text="Text reveals on scroll" />
      <MorphingText texts={['First', 'Second', 'Third']} />
      <BoxReveal>
        <h1>Content revealed with box effect</h1>
      </BoxReveal>
      <FlipText text="Flipping text animation" />
    </div>
  )
}
```

## Available Components

### Text Animation
- **TextAnimate** - General text animation effects
- **TypingAnimation** - Typewriter-style text animation
- **WordRotate** - Rotating word carousel effect
- **HyperText** - Hyper-style text effects
- **AnimatedGradientText** - Text with animated gradient colors
- **AnimatedShinyText** - Text with shiny animation effect

### Visual Effects
- **Globe** - Interactive 3D globe component
- **Confetti** - Confetti animation effect
- **NumberTicker** - Animated number counter
- **SparklesText** - Text with sparkle effects

### Reveal & Morphing
- **TextReveal** - Text reveal on scroll animations
- **MorphingText** - Text morphing between different strings
- **BoxReveal** - Content reveal with box animation
- **FlipText** - Text flipping animation effects
- **SpinningText** - Spinning text animation

### Utility Effects
- **LineShadowText** - Text with line shadow effects
- **AuroraText** - Aurora-style text effects
- **ScrollBasedVelocity** - Scroll-based velocity animations

## License

MIT
