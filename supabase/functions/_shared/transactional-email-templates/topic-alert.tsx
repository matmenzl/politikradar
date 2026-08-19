/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface AlertItem {
  title?: string
  parliament?: string
  date?: string
  relevance?: number
  topics?: string[]
  url?: string
  hasStory?: boolean
}

interface TopicAlertProps {
  items?: AlertItem[]
}

const TopicAlertEmail = ({ items = [] }: TopicAlertProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>
      {items.length === 1
        ? 'Ein neues Geschäft zu deinen Themen'
        : `${items.length} neue Geschäfte zu deinen Themen`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={kicker}>politikradar · Themen-Alert</Text>
        <Heading style={h1}>
          {items.length === 1
            ? 'Ein neues Geschäft zu deinen Themen'
            : `${items.length} neue Geschäfte zu deinen Themen`}
        </Heading>
        {items.map((item, i) => (
          <Section key={i} style={card}>
            <Text style={meta}>
              {[item.parliament, item.date].filter(Boolean).join(' · ')}
              {typeof item.relevance === 'number' ? ` · Relevanz ${item.relevance}` : ''}
            </Text>
            {item.url ? (
              <Link href={item.url} style={titleLink}>
                {item.title ?? 'Ohne Titel'}
              </Link>
            ) : (
              <Text style={title}>{item.title ?? 'Ohne Titel'}</Text>
            )}
            {item.topics && item.topics.length > 0 && (
              <Text style={topics}>{item.topics.join(' · ')}</Text>
            )}
            {item.url && (
              <Text style={ctaWrap}>
                <Link href={item.url} style={cta}>
                  {item.hasStory ? 'Story lesen' : 'Geschäft ansehen'}
                </Link>
              </Text>
            )}
          </Section>
        ))}
        <Hr style={hr} />
        <Text style={footer}>
          Du erhältst diese Nachricht, weil du in deinem politikradar-Profil Themen,
          Parlamente oder Stichwörter hinterlegt hast.{' '}
          <Link href="https://politikradar.org/profil" style={footerLink}>
            Einstellungen ändern
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TopicAlertEmail,
  subject: (data: Record<string, any>) => {
    const count = Array.isArray(data.items) ? data.items.length : 0
    return count === 1
      ? 'Neues Geschäft zu deinen Themen'
      : `${count} neue Geschäfte zu deinen Themen`
  },
  displayName: 'Themen-Alert',
  previewData: {
    items: [
      {
        title: 'Kredit für den Ausbau der Velowege im Stadtzentrum',
        parliament: 'Stadtparlament Winterthur',
        date: '2026-08-14',
        relevance: 82,
        topics: ['Verkehr', 'Umwelt'],
        url: 'https://politikradar.org/g/beispiel',
      },
      {
        title: 'Interpellation zur Finanzierung der Tagesschulen',
        parliament: 'Kantonsrat Zürich',
        date: '2026-08-13',
        relevance: 74,
        topics: ['Bildung'],
        url: 'https://politikradar.org/s/beispiel',
        hasStory: true,
      },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, serif' }
const container = { padding: '24px 25px', maxWidth: '600px' }
const kicker = {
  fontFamily: 'Arial, sans-serif',
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: '#8a8a8a',
  margin: '0 0 8px',
}
const h1 = { fontSize: '24px', color: '#111111', margin: '0 0 20px', lineHeight: '1.25' }
const card = {
  border: '1px solid #e5e5e5',
  padding: '14px 16px',
  margin: '0 0 12px',
}
const meta = {
  fontFamily: 'Arial, sans-serif',
  fontSize: '12px',
  color: '#767676',
  margin: '0 0 6px',
}
const title = { fontSize: '17px', color: '#111111', margin: '0', lineHeight: '1.35' }
const titleLink = {
  fontFamily: 'Georgia, serif',
  fontSize: '17px',
  color: '#111111',
  lineHeight: '1.35',
  textDecoration: 'underline',
}
const ctaWrap = { margin: '12px 0 0' }
const cta = {
  fontFamily: 'Arial, sans-serif',
  fontSize: '13px',
  fontWeight: 700,
  color: '#ffffff',
  backgroundColor: '#E84930',
  padding: '9px 14px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footerLink = { color: '#8a8a8a', textDecoration: 'underline' }
const topics = {
  fontFamily: 'Arial, sans-serif',
  fontSize: '12px',
  color: '#767676',
  margin: '8px 0 0',
}
const hr = { borderColor: '#e5e5e5', margin: '24px 0 16px' }
const footer = {
  fontFamily: 'Arial, sans-serif',
  fontSize: '12px',
  color: '#8a8a8a',
  margin: '0',
  lineHeight: '1.5',
}
