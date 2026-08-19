import type { ComponentType } from 'npm:react@18.3.1'
import { template as topicAlertTemplate } from './topic-alert.tsx'
import { template as accountDeletedTemplate } from './account-deleted.tsx'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome.tsx'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'topic-alert': topicAlertTemplate,
  'account-deleted': accountDeletedTemplate,
}
