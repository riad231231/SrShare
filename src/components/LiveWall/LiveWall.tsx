'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './LiveWall.module.css';
import { ImageIcon, Users } from 'lucide-react';

interface Photo {
  id: string;
  file_url: string;
  uploader_name: string;
  created_at: string;
}

interface LiveWallProps {
  eventId: string;
}

export default function LiveWall({ eventId }: LiveWallProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Récupération initiale des photos
    const fetchPhotos = async () => {
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur SQL:', error);
      } else {
        setPhotos(data || []);
      }
      setLoading(false);
    };

    fetchPhotos();

    // 2. Écoute des changements en temps réel
    const channel = supabase
      .channel(`event-wall-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'uploads',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          const newPhoto = payload.new as Photo;
          setPhotos((current) => [newPhoto, ...current]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  if (loading) return (
    <div className={styles.emptyState}>
      <div className={styles.pulse}></div>
      <p>Chargement du mur des souvenirs...</p>
    </div>
  );

  return (
    <section className={styles.container}>
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <ImageIcon size={18} />
          <span>{photos.length} photo{photos.length > 1 ? 's' : ''}</span>
        </div>
        <div className={styles.statItem}>
          <Users size={18} />
          <span>{new Set(photos.map(p => p.uploader_name)).size} invités ont partagé</span>
        </div>
      </div>

      <div className={styles.masonryGrid}>
        {photos.map((photo) => (
          <div key={photo.id} className={`${styles.photoCard} glass`}>
            <img src={photo.file_url} alt={`Photo par ${photo.uploader_name}`} loading="lazy" />
            <div className={styles.overlay}>
              <span className={styles.uploaderName}>
                {photo.uploader_name || 'Invité'}
              </span>
              <span className={styles.time}>
                {new Date(photo.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {photos.length === 0 && (
        <div className={styles.noPhotos}>
          <ImageIcon size={48} className={styles.emptyIcon} />
          <h3>Le mur est encore vide !</h3>
          <p>Soyez le premier à partager une photo de cet événement.</p>
        </div>
      )}
    </section>
  );
}
