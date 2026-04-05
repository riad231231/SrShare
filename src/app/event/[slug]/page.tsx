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
    <div className="container">
      {/* Header Premium */}
      <header style={{ 
        textAlign: 'center', 
        padding: '3rem 0 2rem 0',
        animation: 'fadeIn 1s' 
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--gold-soft)',
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '1rem'
        }}>
          <Sparkles size={14} />
          <span>Partage de souvenirs</span>
        </div>
        
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700',
          marginBottom: '0.5rem',
          color: 'var(--deep-gray)'
        }}>
          {event.name}
        </h1>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          color: 'var(--soft-gray)',
          fontSize: '0.9rem'
        }}>
          <Calendar size={14} />
          <span>{formattedDate}</span>
        </div>
      </header>

      <main>
        {/* Zone d'Upload (Client Component) */}
        <UploadZone 
          eventId={event.id} 
          eventSlug={event.slug} 
        />

        {/* Séparateur élégant */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '3rem 0',
          gap: '1rem'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
          <span style={{ 
            color: 'var(--gold-soft)', 
            fontSize: '1.2rem',
            fontStyle: 'italic'
          }}>Galerie</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
        </div>

        {/* Galerie Live (Client Component) */}
        <LiveWall eventId={event.id} />
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '2rem 1rem',
        color: 'var(--soft-gray)',
        fontSize: '0.8rem',
        opacity: 0.6
      }}>
        <p>&copy; {new Date().getFullYear()} Qr Share - Souvenirs gravés.</p>
      </footer>
    </div>
  );
}
