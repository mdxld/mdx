import { IconType } from 'react-icons'

/**
 * Icon library mappings
 */
export const ICON_LIBRARIES = {
  Io: 'react-icons/io',
  Io5: 'react-icons/io5',
  Fa: 'react-icons/fa',
  Fa6: 'react-icons/fa6',
  Md: 'react-icons/md',
  Ti: 'react-icons/ti',
  Go: 'react-icons/go',
  Fi: 'react-icons/fi',
  Gi: 'react-icons/gi',
  Wi: 'react-icons/wi',
  Di: 'react-icons/di',
  Ai: 'react-icons/ai',
  Bs: 'react-icons/bs',
  Ri: 'react-icons/ri',
  Fc: 'react-icons/fc',
  Gr: 'react-icons/gr',
  Hi: 'react-icons/hi',
  Hi2: 'react-icons/hi2',
  Sl: 'react-icons/sl',
  Im: 'react-icons/im',
  Bi: 'react-icons/bi',
  Pi: 'react-icons/pi',
  Vsc: 'react-icons/vsc',
  Tb: 'react-icons/tb',
  Tfi: 'react-icons/tfi',
  Si: 'react-icons/si',
  Lu: 'react-icons/lu',
  Rx: 'react-icons/rx',
  Cg: 'react-icons/cg',
  Ci: 'react-icons/ci',
  Lia: 'react-icons/lia',
} as const

/**
 * Template literal types for all react-icons libraries
 * This provides type safety while supporting all icons without hardcoding
 */
export type IconName =
  | `Io${string}` // react-icons/io (Ionicons 4)
  | `Io5${string}` // react-icons/io5 (Ionicons 5)
  | `Fa${string}` // react-icons/fa (Font Awesome 5)
  | `Fa6${string}` // react-icons/fa6 (Font Awesome 6)
  | `Md${string}` // react-icons/md (Material Design)
  | `Ti${string}` // react-icons/ti (Typicons)
  | `Go${string}` // react-icons/go (Github Octicons)
  | `Fi${string}` // react-icons/fi (Feather)
  | `Gi${string}` // react-icons/gi (Game Icons)
  | `Wi${string}` // react-icons/wi (Weather Icons)
  | `Di${string}` // react-icons/di (Devicons)
  | `Ai${string}` // react-icons/ai (Ant Design)
  | `Bs${string}` // react-icons/bs (Bootstrap)
  | `Ri${string}` // react-icons/ri (Remix Icon)
  | `Fc${string}` // react-icons/fc (Flat Color Icons)
  | `Gr${string}` // react-icons/gr (Grommet)
  | `Hi${string}` // react-icons/hi (Heroicons)
  | `Hi2${string}` // react-icons/hi2 (Heroicons 2)
  | `Sl${string}` // react-icons/sl (Simple Line Icons)
  | `Im${string}` // react-icons/im (IcoMoon Free)
  | `Bi${string}` // react-icons/bi (BoxIcons)
  | `Pi${string}` // react-icons/pi (Phosphor)
  | `Vsc${string}` // react-icons/vsc (VS Code Icons)
  | `Tb${string}` // react-icons/tb (Tabler)
  | `Tfi${string}` // react-icons/tfi (Themify)
  | `Si${string}` // react-icons/si (Simple Icons)
  | `Lu${string}` // react-icons/lu (Lucide)
  | `Rx${string}` // react-icons/rx (Radix UI)
  | `Cg${string}` // react-icons/cg (css.gg)
  | `Ci${string}` // react-icons/ci (Circum Icons)
  | `Lia${string}` // react-icons/lia (Line Awesome)

/**
 * Helper function to determine which library an icon belongs to
 */
export function getIconLibrary(iconName: string): keyof typeof ICON_LIBRARIES | null {
  const sortedPrefixes = Object.keys(ICON_LIBRARIES).sort((a, b) => b.length - a.length)

  for (const prefix of sortedPrefixes) {
    if (iconName.startsWith(prefix)) {
      return prefix as keyof typeof ICON_LIBRARIES
    }
  }
  return null
}
