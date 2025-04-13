'use client';

import { useState, useEffect } from 'react';
import { db } from '../../../utils/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  additionalFields?: Record<string, string>;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    name: '',
    date: '',
    time: '',
    location: '',
    description: '',
    additionalFields: {},
  });
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const q = query(collection(db, 'events'), orderBy('date'));
      const querySnapshot = await getDocs(q);
      const eventsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      setEvents(eventsList);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'events'), {
        ...newEvent,
        additionalFields: newEvent.additionalFields || {},
      });
      setNewEvent({
        name: '',
        date: '',
        time: '',
        location: '',
        description: '',
        additionalFields: {},
      });
      fetchEvents();
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    
    try {
      await updateDoc(doc(db, 'events', editingEvent.id), {
        ...editingEvent,
        additionalFields: editingEvent.additionalFields || {},
      });
      setEditingEvent(null);
      fetchEvents();
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await deleteDoc(doc(db, 'events', id));
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const addCustomField = () => {
    if (!newFieldKey || !newFieldValue) return;
    
    if (editingEvent) {
      setEditingEvent({
        ...editingEvent,
        additionalFields: {
          ...editingEvent.additionalFields,
          [newFieldKey]: newFieldValue,
        },
      });
    } else {
      setNewEvent({
        ...newEvent,
        additionalFields: {
          ...newEvent.additionalFields,
          [newFieldKey]: newFieldValue,
        },
      });
    }
    
    setNewFieldKey('');
    setNewFieldValue('');
  };

  const removeCustomField = (key: string) => {
    if (editingEvent) {
      const fields = { ...editingEvent.additionalFields };
      delete fields[key];
      setEditingEvent({ ...editingEvent, additionalFields: fields });
    } else {
      const fields = { ...newEvent.additionalFields };
      delete fields[key];
      setNewEvent({ ...newEvent, additionalFields: fields });
    }
  };

  if (loading) return <p className="text-white">Loading...</p>;

  return (
    <div className="space-y-8">
      <div className="bg-slate-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">
          {editingEvent ? 'Edit Event' : 'Add New Event'}
        </h2>
        <form onSubmit={editingEvent ? handleUpdateEvent : handleAddEvent} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Event Name"
              value={editingEvent ? editingEvent.name : newEvent.name}
              onChange={(e) => editingEvent 
                ? setEditingEvent({ ...editingEvent, name: e.target.value })
                : setNewEvent({ ...newEvent, name: e.target.value })}
              className="bg-slate-700 border border-slate-600 text-white p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="date"
              value={editingEvent ? editingEvent.date : newEvent.date}
              onChange={(e) => editingEvent 
                ? setEditingEvent({ ...editingEvent, date: e.target.value })
                : setNewEvent({ ...newEvent, date: e.target.value })}
              className="bg-slate-700 border border-slate-600 text-white p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="time"
              value={editingEvent ? editingEvent.time : newEvent.time}
              onChange={(e) => editingEvent 
                ? setEditingEvent({ ...editingEvent, time: e.target.value })
                : setNewEvent({ ...newEvent, time: e.target.value })}
              className="bg-slate-700 border border-slate-600 text-white p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Location"
              value={editingEvent ? editingEvent.location : newEvent.location}
              onChange={(e) => editingEvent 
                ? setEditingEvent({ ...editingEvent, location: e.target.value })
                : setNewEvent({ ...newEvent, location: e.target.value })}
              className="bg-slate-700 border border-slate-600 text-white p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <textarea
            placeholder="Description"
            value={editingEvent ? editingEvent.description : newEvent.description}
            onChange={(e) => editingEvent 
              ? setEditingEvent({ ...editingEvent, description: e.target.value })
              : setNewEvent({ ...newEvent, description: e.target.value })}
            className="bg-slate-700 border border-slate-600 text-white p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />

          <div className="space-y-2">
            <h3 className="font-medium text-white">Additional Fields</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Field Name"
                value={newFieldKey}
                onChange={(e) => setNewFieldKey(e.target.value)}
                className="bg-slate-700 border border-slate-600 text-white p-2 rounded flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Field Value"
                value={newFieldValue}
                onChange={(e) => setNewFieldValue(e.target.value)}
                className="bg-slate-700 border border-slate-600 text-white p-2 rounded flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={addCustomField}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Field
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(editingEvent ? editingEvent.additionalFields || {} : newEvent.additionalFields || {}).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2 bg-slate-700 p-2 rounded">
                  <span className="font-medium text-white">{key}:</span>
                  <span className="text-slate-300">{value}</span>
                  <button
                    type="button"
                    onClick={() => removeCustomField(key)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            {editingEvent && (
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-500"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
            >
              {editingEvent ? 'Update Event' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-slate-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Events</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-slate-700">
                  <td className="px-6 py-4 whitespace-nowrap text-white">{event.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">{event.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">{event.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">{event.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setEditingEvent(event)}
                      className="text-blue-400 hover:text-blue-300 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 