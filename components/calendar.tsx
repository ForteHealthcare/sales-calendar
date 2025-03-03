"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { EventForm } from "@/components/event-form"
import { fetchEvents, createEvent, deleteEvent } from "@/lib/onedrive"
import type { CalendarEvent } from "@/types/calendar"

export default function Calendar() {
  const { data: session } = useSession()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const { toast } = useToast()

  // Fetch events from OneDrive
  useEffect(() => {
    if (session?.accessToken) {
      setLoading(true)
      fetchEvents(session.accessToken)
        .then((fetchedEvents) => {
          setEvents(fetchedEvents)
          setLoading(false)
        })
        .catch((error) => {
          console.error("Failed to fetch events:", error)
          toast({
            title: "Error",
            description: "Failed to load calendar events",
            variant: "destructive",
          })
          setLoading(false)
        })
    }
  }, [session, toast])

  // Generate days for the current month view
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Handle adding a new event
  const handleAddEvent = async (newEvent: Omit<CalendarEvent, "id">) => {
    if (!session?.accessToken) return

    try {
      const createdEvent = await createEvent(newEvent, session.accessToken)
      setEvents([...events, createdEvent])
      setIsAddEventOpen(false)
      toast({
        title: "Success",
        description: "Event added successfully",
      })
    } catch (error) {
      console.error("Failed to create event:", error)
      toast({
        title: "Error",
        description: "Failed to add event",
        variant: "destructive",
      })
    }
  }

  // Handle deleting an event
  const handleDeleteEvent = async (eventId: string) => {
    if (!session?.accessToken) return

    try {
      await deleteEvent(eventId, session.accessToken)
      setEvents(events.filter((event) => event.id !== eventId))
      setSelectedEvent(null)
      toast({
        title: "Success",
        description: "Event deleted successfully",
      })
    } catch (error) {
      console.error("Failed to delete event:", error)
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      })
    }
  }

  // Navigation functions
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  if (loading) {
    return <CalendarSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <h2 className="text-xl font-semibold">{format(currentDate, "MMMM yyyy")}</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={prevMonth}>
            Previous
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" onClick={nextMonth}>
            Next
          </Button>
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
              </DialogHeader>
              <EventForm onSubmit={handleAddEvent} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center font-medium py-2">
            {day}
          </div>
        ))}

        {days.map((day) => {
          const dayEvents = events.filter((event) => isSameDay(new Date(event.date), day))

          return (
            <div
              key={day.toString()}
              className={`min-h-[100px] p-2 border rounded-md ${
                isSameMonth(day, currentDate) ? "bg-card" : "bg-muted/50"
              }`}
            >
              <div className="font-medium text-sm mb-1">{format(day, "d")}</div>
              <div className="space-y-1">
                {dayEvents.map((event) => (
                  <Dialog key={event.id}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left p-1 h-auto text-xs"
                        onClick={() => setSelectedEvent(event)}
                      >
                        {event.title}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{event.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <p className="text-sm font-medium">Date</p>
                          <p className="text-sm">{format(new Date(event.date), "PPP")}</p>
                        </div>
                        {event.description && (
                          <div>
                            <p className="text-sm font-medium">Description</p>
                            <p className="text-sm">{event.description}</p>
                          </div>
                        )}
                        <Button variant="destructive" className="w-full" onClick={() => handleDeleteEvent(event.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Event
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array(7)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-10" />
          ))}
        {Array(35)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={`day-${i}`} className="h-[100px]" />
          ))}
      </div>
    </div>
  )
}

