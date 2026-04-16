import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { eventAPI } from '../../services/api';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';

const EMPTY = { title:'', description:'', event_date:'', end_date:'', location:'', event_type:'Academic', organized_by:'School' };

const Events: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modal, setModal] = useState<boolean>(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY);

  const fetch = async () => {
    try { const r = await eventAPI.getAll(); setEvents(r.data.data || []); }
    catch(e){} finally { setLoading(false); }
  };
  useEffect(()=>{fetch();},[]);

  const typeColors = { Academic:'bg-blue-100 text-blue-700', Sports:'bg-green-100 text-green-700', Cultural:'bg-purple-100 text-purple-700', Holiday:'bg-red-100 text-red-700', Meeting:'bg-yellow-100 text-yellow-700', Other:'bg-gray-100 text-gray-700' };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (editing) { await eventAPI.update(editing._id, form); toast.success('Updated'); }
      else { await eventAPI.create(form); toast.success('Event created'); }
      setModal(false); fetch();
    } catch(err) { toast.error(err.response?.data?.message||'Error'); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Events</h1><p className="text-sm text-gray-500">School events calendar</p></div>
        <button onClick={()=>{setEditing(null);setForm(EMPTY);setModal(true);}} className="btn-primary flex items-center gap-2"><FaPlus />Add Event</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.length===0 ? <div className="col-span-2 bg-white rounded-xl p-10 text-center text-gray-400">No events scheduled</div>
        : events.map(ev=>(
          <div key={ev._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{ev.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[ev.event_type]||'bg-gray-100 text-gray-700'}`}>{ev.event_type}</span>
                </div>
                {ev.description && <p className="text-sm text-gray-600 mt-1">{ev.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><FaCalendarAlt />{new Date(ev.event_date).toLocaleDateString()}</span>
                  {ev.location && <span className="flex items-center gap-1"><FaMapMarkerAlt />{ev.location}</span>}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={()=>{setEditing(ev);setForm({...ev,event_date:ev.event_date?.split('T')[0],end_date:ev.end_date?.split('T')[0]});setModal(true);}} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><FaEdit /></button>
                <button onClick={async()=>{if(window.confirm('Delete?')){await eventAPI.delete(ev._id);toast.success('Deleted');fetch();}}} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><FaTrash /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal isOpen={modal} onClose={()=>setModal(false)} title={editing?'Edit Event':'Add Event'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input className="input-field" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input-field" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
              <input type="date" className="input-field" required value={form.event_date} onChange={e=>setForm({...form,event_date:e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" className="input-field" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input className="input-field" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select className="input-field" value={form.event_type} onChange={e=>setForm({...form,event_type:e.target.value})}>
                {['Academic','Sports','Cultural','Holiday','Meeting','Other'].map(t=><option key={t}>{t}</option>)}
              </select></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editing?'Update':'Create'}</button>
            <button type="button" onClick={()=>setModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Events;
