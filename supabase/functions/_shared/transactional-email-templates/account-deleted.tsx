/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface AccountDeletedProps {
  email?: string
  deletedAt?: string
}

const AccountDeletedEmail = ({ email, deletedAt }: AccountDeletedProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Dein politikradar-Profil wurde gelöscht</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={kicker}>politikradar · Konto</Text>
        <Heading style={h1}>Dein Profil wurde gelöscht</Heading>
        <Text style={paragraph}>
          Wir haben dein politikradar-Konto{email ? ` (${email})` : ''} und alle dazugehörigen
          Daten endgültig gelöscht: Profil-Einstellungen, Themen, Parlamente, Stichwörter und
          die Versandhistorie deiner Alerts.
        </Text>
        <Text style={paragraph}>
          Du erhältst ab sofort keine Themen-Alerts mehr. Diese Löschung lässt sich nicht
          rückgängig machen – du kannst dich aber jederzeit neu registrieren.
        </Text>
        {deletedAt && <Text style={meta}>Gelöscht am {deletedAt}</Text>}
        <Hr style={hr} />
        <Text style={footer}>
          Du erhältst diese Nachricht als Bestätigung deiner Profil-Löschung bei politikradar.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AccountDeletedEmail,
  subject: 'Dein politikradar-Profil wurde gelöscht',
  displayName: 'Profil gelöscht',
  previewData: {
    email: 'redaktion@example.com',
    deletedAt: '19.08.2026',
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
const paragraph = { fontSize: '16px', color: '#111111', margin: '0 0 14px', lineHeight: '1.5' }
const meta = {
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
