import { sections } from './content'

export interface NavLinkConfig {
  key: string
  label: string
  href: string
  disabled?: boolean
}

export interface NavGroupConfig {
  label: string
  links: NavLinkConfig[]
}

function sectionLink(key: string): NavLinkConfig {
  const section = sections.find(s => s.key === key)
  if (!section) throw new Error(`navGroups: unknown section key "${key}"`)
  return { key: section.key, label: section.label, href: `/guide/${section.key}` }
}

/**
 * CardNav shows at most 3 groups. `habits` (Phase 8) and `grocery-list`
 * (Phase 9) aren't content sections, so they're plain links.
 */
export const navGroups: NavGroupConfig[] = [
  {
    label: 'Keep the place running',
    links: [
      sectionLink('cleaning'),
      sectionLink('materials'),
      sectionLink('appliances'),
      { key: 'habits', label: 'Habits', href: '/guide/habits' },
    ],
  },
  {
    label: 'Food',
    links: [
      sectionLink('groceries'),
      { key: 'grocery-list', label: 'Grocery list', href: '/guide/grocery-list' },
      sectionLink('recipes'),
    ],
  },
  {
    label: 'Life in London',
    links: [
      sectionLink('roommates'),
      sectionLink('life'),
      sectionLink('uni'),
    ],
  },
]
