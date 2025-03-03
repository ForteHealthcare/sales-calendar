export interface CalendarEvent {
  id: string
  title: string
  date: string // ISO string
  description?: string
}

// Extend the next-auth session type to include the access token
declare module "next-auth" {
  interface Session {
    accessToken?: string
  }
}

