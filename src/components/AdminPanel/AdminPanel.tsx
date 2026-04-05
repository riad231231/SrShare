'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Download, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  Image as ImageIcon,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import styles from './AdminPanel.module.css';

interface Photo {
  id: string;
  file_url: string;
  uploader_name: string;
  created_at: string;
}

interface EventData {
  id: string;
  name: string;
  slug: string;
  date: string;
}

interface AdminPanelProps {
  event: EventData;
}

export default function AdminPanel({ event }: AdminPanelProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [zipping, setZipping] = useState(false);

  const eventUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/event/${event.slug}`;

  useEffect(() => {
    fetchPhotos();
  }, [event.id]);

  const fetchPhotos = async () => {
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false });

    if (!error) setPhotos(data || []);
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deletePhoto = async (id: string, url: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette photo ?')) return;

    // 1. Extraire le chemin du fichier du bucket
    const path = url.split('event-photos/')[1];
    
    // 2. Supprimer de Storage
    const { error: storageError } = await supabase.storage
      .from('event-photos')
      .remove([path]);

    if (storageError) {
      alert('Erreur lors de la suppression physique du fichier.');
      return;
    }

    // 3. Supprimer de DB
    const { error: dbError } = await supabase
      .from('uploads')
      .delete()
      .eq('id', id);

    if (!dbError) {
      setPhotos(photos.filter(p => p.id !== id));
    }
  };

  const downloadZip = async () => {
    setZipping(true);
    try {
      // Appel à votre Edge Function (sera créée dans la Tâche 5)
      const { data, error } = await supabase.functions.invoke('generate-zip', {
        body: { slug: event.slug }
      });
      
      if (error) throw error;
      
      // Téléchargement du blob renvoyé par l'Edge Function
      const blobURL = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = blobURL;
      link.download = `souvenirs-${event.slug}.zip`;
      link.click();
      URL.revokeObjectURL(blobURL);
      
    } catch (e) {
      console.error(e);
      alert('La génération du ZIP n\'est pas encore configurée ou a échoué.');
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="container">
      <header className={styles.header}>
        <div className={styles.topActions}>
          <Link href="/" className={styles.backLink}>
            <ChevronLeft size={16} />
            <span>Tous les événements</span>
          </Link>
          <div className={styles.statusBadge}>Propriétaire</div>
        </div>

        <h1 className={styles.title}>{event.name} - Dashboard</h1>
        <p className={styles.date}>Événement du {new Date(event.date).toLocaleDateString()}</p>
      </header>

      <div className={styles.grid}>
        {/* Section QR Code */}
        <div className={`${styles.card} premium-card`}>
          <h3>Votre QR Code 📱</h3>
          <p>Imprimez-le pour vos invités.</p>
          <div className={styles.qrWrapper}>
            <QRCodeSVG value={eventUrl} size={180} />
          </div>
          <div className={styles.urlBox}>
            <code>{eventUrl}</code>
            <button onClick={copyToClipboard} className={styles.copyBtn}>
              {copied ? <Check size={16} color="#4CAF50" /> : <Copy size={16} />}
            </button>
          </div>
          <Link href={`/event/${event.slug}`} target="_blank" className={styles.previewLink}>
            <ExternalLink size={14} /> Voir la page publique
          </Link>
        </div>

        {/* Section Stats & ZIP */}
        <div className={`${styles.card} premium-card ${styles.zipCard}`}>
          <h3>Récupérer vos souvenirs 🎁</h3>
          <p>Téléchargez toutes les photos de l'événement d'un seul clic.</p>
          
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Photos collectées</span>
              <span className={styles.statValue}>{photos.length}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Dernière activité</span>
              <span className={styles.statValue}>
                {photos.length > 0 
                  ? new Date(photos[0].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : '--:--'}
              </span>
            </div>
          </div>

          <button 
            className="btn-primary" 
            onClick={downloadZip}
            disabled={zipping || photos.length === 0}
          >
            {zipping ? 'Génération en cours...' : 'Télécharger tout (.zip)'}
            <Download size={18} style={{ marginLeft: '10px' }} />
          </button>
        </div>

        {/* Gestion des photos */}
        <div className={`${styles.card} premium-card ${styles.fullWidth}`}>
          <h3>Gestion des photos 🖼️</h3>
          {loading ? <p>Chargement...</p> : (
            <div className={styles.photoGrid}>
              {photos.map(photo => (
                <div key={photo.id} className={styles.photoItem}>
                  <img src={photo.file_url} alt="photo" />
                  <div className={styles.photoInfo}>
                    <span>{photo.uploader_name}</span>
                    <button 
                      onClick={() => deletePhoto(photo.id, photo.file_url)} 
                      className={styles.deleteBtn}
                      title="Supprimer la photo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && photos.length === 0 && <p style={{ textAlign: 'center', color: 'var(--soft-gray)' }}>Aucune photo pour le moment.</p>}
        </div>
      </div>
    </div>
  );
}
