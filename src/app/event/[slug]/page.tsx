import React from 'react';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import UploadZone from '@/components/UploadZone/UploadZone';
import LiveWall from '@/components/LiveWall/LiveWall';
import { Sparkles, Calendar } from 'lucide-react';

interface EventPageProps {
  params: {
    slug: string;
  };
}

// Fonction pour récupérer les données de l'événement côté serveur
async function getEvent(slug: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    return notFound();
  }

  const formattedDate = new Date(event.date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      {/* Header */}
      <header style={{ textAlign: 'center', padding: '2.5rem 0 2rem 0', animation: 'fadeIn 0.7s ease-out' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          color: 'var(--gold-soft)',
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          fontWeight: 700,
          marginBottom: '0.75rem'
        }}>
          <Sparkles size={11} />
          <span>Partage de souvenirs</span>
        </div>

        <h1 style={{ marginBottom: '0.5rem', wordBreak: 'break-word' }}>
          {event.name}
        </h1>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.35rem',
          color: 'var(--soft-gray)',
          fontSize: '0.85rem',
          opacity: 0.85
        }}>
          <Calendar size={13} />
          <span>{formattedDate}</span>
        </div>
      </header>

      <main>
        <UploadZone eventId={event.id} eventSlug={event.slug} />

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '2.5rem 0',
          gap: '0.75rem'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
          <span style={{ color: 'var(--gold-soft)', fontSize: '1rem', fontStyle: 'italic', fontWeight: 600 }}>Galerie</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
        </div>

        <LiveWall eventId={event.id} />
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '2rem 0 1rem',
        color: 'var(--soft-gray)',
        fontSize: '0.75rem',
        opacity: 0.55
      }}>
        <p>&copy; {new Date().getFullYear()} Qr Share</p>
      </footer>
    </div>
  );
}
