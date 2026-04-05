'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Settings, 
  Calendar, 
  ChevronRight, 
  LogOut, 
  Sparkles,
  Camera
} from 'lucide-react';
import Link from 'next/link';
import styles from './Dashboard.module.css';

interface Event {
  id: string;
  name: string;
  slug: string;
  date: string;
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', date: '' });
  const router = useRouter();

  useEffect(() => {
    // 1. Vérification session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        fetchEvents(session.user.id);
      }
    });
  }, []);

  const fetchEvents = async (userId: string) => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('owner_id', userId)
      .order('date', { ascending: false });

    if (!error) setEvents(data || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.date) return;

    const slug = newEvent.name
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '') + '-' + Math.random().toString(36).substring(7);

    const { data, error } = await supabase.from('events').insert({
      name: newEvent.name,
      slug,
      date: newEvent.date,
      owner_id: session.user.id
    }).select().single();

    if (!error && data) {
      router.push(`/admin/${data.slug}`);
    } else {
      alert(`Erreur lors de la création : ${error?.message || 'Inconnue'}`);
      console.error(error);
    }
  };

  if (loading) return <div className={styles.loading}>Chargement de vos événements...</div>;

  return (
    <div className="container">
      <header className={styles.header}>
        <div className={styles.topInfo}>
          <div className={styles.logoBox}>
            <Sparkles size={24} color="var(--gold-soft)" />
            <span>Qr Share</span>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={18} />
          </button>
        </div>

        <h1 className={styles.title}>Mes Événements</h1>
        <p className={styles.subtitle}>Gérez vos mariages, fêtes et séminaires en toute simplicité.</p>
      </header>

      <main className={styles.main}>
        {/* Grille des événements existants */}
        <div className={styles.grid}>
          {events.map(event => (
            <Link href={`/admin/${event.slug}`} key={event.id} className={`${styles.eventCard} glass`}>
              <div className={styles.eventIcon}>
                <Camera size={24} />
              </div>
              <div className={styles.eventInfo}>
                <h3>{event.name}</h3>
                <div className={styles.meta}>
                  <Calendar size={14} />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
              </div>
              <ChevronRight className={styles.arrow} size={20} />
            </Link>
          ))}
          
          {/* Bouton pour ouvrir le créateur */}
          {!isCreating && (
            <button className={styles.addBtn} onClick={() => setIsCreating(true)}>
              <Plus size={32} />
              <span>Créer un événement</span>
            </button>
          )}

          {/* Formulaire de création (Card interactive) */}
          {isCreating && (
            <form className={`${styles.createCard} premium-card`} onSubmit={createEvent}>
              <h3>Nouvel Événement</h3>
              <input 
                type="text" 
                placeholder="Nom (ex: Mariage de Léa & Paul)" 
                value={newEvent.name}
                onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                required
                className={styles.input}
              />
              <input 
                type="date" 
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                required
                className={styles.input}
              />
              <div className={styles.formActions}>
                <button type="button" onClick={() => setIsCreating(false)} className={styles.cancelBtn}>Annuler</button>
                <button type="submit" className="btn-primary">Confirmer</button>
              </div>
            </form>
          )}
        </div>

        {events.length === 0 && !isCreating && (
          <div className={styles.emptyState}>
            <p>Vous n'avez pas encore d'événements créés.</p>
          </div>
        )}
      </main>
    </div>
  );
}
