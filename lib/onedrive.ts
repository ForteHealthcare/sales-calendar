import type { CalendarEvent } from "@/types/calendar"

const GRAPH_API_ENDPOINT = "https://graph.microsoft.com/v1.0"
const CALENDAR_FILE_NAME = "calendar-events.json"

async function getCalendarFileId(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${GRAPH_API_ENDPOINT}/me/drive/root:/Documents/${CALENDAR_FILE_NAME}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      return data.id
    }

    return null
  } catch (error) {
    console.error("Error getting calendar file ID:", error)
    return null
  }
}

async function createCalendarFile(accessToken: string): Promise<string> {
  try {
    const response = await fetch(`${GRAPH_API_ENDPOINT}/me/drive/root:/Documents/${CALENDAR_FILE_NAME}:/content`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([]),
    })

    if (!response.ok) {
      throw new Error("Failed to create calendar file")
    }

    const data = await response.json()
    return data.id
  } catch (error) {
    console.error("Error creating calendar file:", error)
    throw error
  }
}

export async function fetchEvents(accessToken: string): Promise<CalendarEvent[]> {
  try {
    let fileId = await getCalendarFileId(accessToken)

    if (!fileId) {
      fileId = await createCalendarFile(accessToken)
    }

    const response = await fetch(`${GRAPH_API_ENDPOINT}/me/drive/items/${fileId}/content`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch calendar events")
    }

    const events = await response.json()
    return events
  } catch (error) {
    console.error("Error fetching events:", error)
    throw error
  }
}

export async function createEvent(event: Omit<CalendarEvent, "id">, accessToken: string): Promise<CalendarEvent> {
  try {
    const events = await fetchEvents(accessToken)

    const newEvent: CalendarEvent = {
      ...event,
      id: crypto.randomUUID(),
    }

    const updatedEvents = [...events, newEvent]

    let fileId = await getCalendarFileId(accessToken)
    if (!fileId) {
      fileId = await createCalendarFile(accessToken)
    }

    const response = await fetch(`${GRAPH_API_ENDPOINT}/me/drive/items/${fileId}/content`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedEvents),
    })

    if (!response.ok) {
      throw new Error("Failed to create event")
    }

    return newEvent
  } catch (error) {
    console.error("Error creating event:", error)
    throw error
  }
}

export async function deleteEvent(eventId: string, accessToken: string): Promise<void> {
  try {
    const events = await fetchEvents(accessToken)

    const updatedEvents = events.filter((event) => event.id !== eventId)

    const fileId = await getCalendarFileId(accessToken)
    if (!fileId) {
      throw new Error("Calendar file not found")
    }

    const response = await fetch(`${GRAPH_API_ENDPOINT}/me/drive/items/${fileId}/content`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedEvents),
    })

    if (!response.ok) {
      throw new Error("Failed to delete event")
    }
  } catch (error) {
    console.error("Error deleting event:", error)
    throw error
  }
}

