import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { CalendarEvent } from '@/api/entities';
import { Course } from '@/api/entities';
import { Quiz } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, CheckCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';

export default function Calendar() {
  const [currentUser, setCurrentUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      const [userEvents, userCourses, allQuizzes] = await Promise.all([
        CalendarEvent.filter({ user_id: user.id }),
        Course.list(),
        Quiz.list()
      ]);

      // Add quiz deadlines as events
      const quizEvents = allQuizzes
        .filter(q => q.due_date)
        .map(q => ({
          id: `quiz-${q.id}`,
          title: `Quiz: ${q.title}`,
          event_type: 'quiz',
          event_date: q.due_date,
          course_id: q.course_id,
          isQuiz: true,
          quizId: q.id
        }));

      setEvents([...userEvents, ...quizEvents]);
      setCourses(userCourses);
    } catch (error) {
      console.error("Error loading calendar data:", error);
    }
    setLoading(false);
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getEventsForDay = (day) => {
    return events.filter(event => 
      isSameDay(new Date(event.event_date), day)
    );
  };

  const handleSaveEvent = async () => {
    if (!editingEvent.title || !editingEvent.event_date) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const eventData = {
        ...editingEvent,
        user_id: currentUser.id
      };

      if (editingEvent.id) {
        await CalendarEvent.update(editingEvent.id, eventData);
      } else {
        await CalendarEvent.create(eventData);
      }

      await loadData();
      setIsModalOpen(false);
      setEditingEvent(null);
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const handleToggleComplete = async (event) => {
    if (event.isQuiz) return;
    
    try {
      await CalendarEvent.update(event.id, {
        ...event,
        is_completed: !event.is_completed
      });
      await loadData();
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const openAddModal = (date = selectedDate) => {
    setEditingEvent({
      title: '',
      description: '',
      event_type: 'reminder',
      event_date: format(date, 'yyyy-MM-dd\'T\'HH:mm'),
      reminder_minutes_before: 60,
      course_id: ''
    });
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const days = getDaysInMonth();
  const dayEvents = getEventsForDay(selectedDate);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Calendar</h1>
          <Button onClick={() => openAddModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
                  {day}
                </div>
              ))}
              
              {days.map(day => {
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                
                return (
                  <button
                    key={day.toString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      aspect-square p-2 rounded-lg border-2 transition-all
                      ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-200'}
                      ${isToday ? 'bg-blue-100' : 'bg-gray-50'}
                      ${!isSameMonth(day, currentDate) ? 'opacity-40' : ''}
                    `}
                  >
                    <div className="text-sm font-medium">{format(day, 'd')}</div>
                    {dayEvents.length > 0 && (
                      <div className="flex justify-center mt-1 space-x-1">
                        {dayEvents.slice(0, 3).map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Events for Selected Day */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {format(selectedDate, 'MMM d, yyyy')}
              </h3>
              <Button size="sm" variant="outline" onClick={() => openAddModal(selectedDate)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {dayEvents.length > 0 ? (
                dayEvents.map(event => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      event.isQuiz ? 'border-red-500 bg-red-50' :
                      event.event_type === 'deadline' ? 'border-orange-500 bg-orange-50' :
                      event.event_type === 'study_session' ? 'border-green-500 bg-green-50' :
                      'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        )}
                        <div className="flex items-center text-xs text-gray-500 mt-2">
                          <Clock className="w-3 h-3 mr-1" />
                          {format(new Date(event.event_date), 'h:mm a')}
                        </div>
                      </div>
                      {!event.isQuiz && (
                        <button
                          onClick={() => handleToggleComplete(event)}
                          className={`ml-2 p-1 rounded ${
                            event.is_completed ? 'text-green-600' : 'text-gray-400 hover:text-green-600'
                          }`}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No events for this day</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Event Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingEvent?.id ? 'Edit' : 'Add'} Event</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Input
              placeholder="Event Title"
              value={editingEvent?.title || ''}
              onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})}
            />
            <Textarea
              placeholder="Description / Notes"
              value={editingEvent?.description || ''}
              onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
            />
            <Select
              value={editingEvent?.event_type || ''}
              onValueChange={(value) => setEditingEvent({...editingEvent, event_type: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="study_session">Study Session</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={editingEvent?.course_id || ''}
              onValueChange={(value) => setEditingEvent({...editingEvent, course_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Related Course (Optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No Course</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="datetime-local"
              value={editingEvent?.event_date || ''}
              onChange={(e) => setEditingEvent({...editingEvent, event_date: e.target.value})}
            />
            <Input
              type="number"
              placeholder="Reminder (minutes before)"
              value={editingEvent?.reminder_minutes_before || ''}
              onChange={(e) => setEditingEvent({...editingEvent, reminder_minutes_before: Number(e.target.value)})}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEvent}>Save Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}