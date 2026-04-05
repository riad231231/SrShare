'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './UploadZone.module.css';

interface FileWithPreview extends File {
  preview: string;
}

interface UploadZoneProps {
  eventId: string;
  eventSlug: string;
  onSuccess?: () => void;
}

export default function UploadZone({ eventId, eventSlug, onSuccess }: UploadZoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [progress, setProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
      }));
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(selectedFiles[index].preview);
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setProgress(0);
    setSuccessCount(0);

    const total = selectedFiles.length;

    try {
      for (let i = 0; i < total; i++) {
        const file = selectedFiles[i];
        
        // 1. Renommage unique pour éviter les collisions
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${eventSlug}/${fileName}`;

        // 2. Upload vers Storage
        const { error: uploadError } = await supabase.storage
          .from('event-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 3. Récupérer l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('event-photos')
          .getPublicUrl(filePath);

        // 4. Insertion dans la table DB
        const { error: dbError } = await supabase.from('uploads').insert({
          event_id: eventId,
          file_url: publicUrl,
          uploader_name: name || 'Invité'
        });

        if (dbError) throw dbError;

        setSuccessCount(prev => prev + 1);
        setProgress(Math.round(((i + 1) / total) * 100));
      }

      // Nettoyage après succès
      setTimeout(() => {
        setSelectedFiles([]);
        setSuccessCount(0);
        setUploading(false);
        if (onSuccess) onSuccess();
      }, 1500);

    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert('Une erreur est survenue lors de l\'upload. Veuillez réessayer.');
      setUploading(false);
    }
  };

  return (
    <div className={`${styles.wrapper} premium-card`}>
      <h2 className={styles.title}>Partagez vos souvenirs 📸</h2>
      <p className={styles.subtitle}>Sélectionnez vos plus belles photos pour l'événement.</p>

      {!uploading && (
        <div 
          className={styles.dropzone}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleFileChange} 
            ref={fileInputRef}
            className={styles.hiddenInput}
          />
          <Upload className={styles.uploadIcon} />
          <p>Cliquez pour choisir des photos</p>
          <span className={styles.hint}>JPG, PNG ou HEIC (max 10MB)</span>
        </div>
      )}

      {selectedFiles.length > 0 && !uploading && (
        <div className={styles.previewContainer}>
          <div className={styles.previewGrid}>
            {selectedFiles.map((file, idx) => (
              <div key={idx} className={styles.previewItem}>
                <img src={file.preview} alt="preview" />
                <button onClick={() => removeFile(idx)} className={styles.removeBtn}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className={styles.form}>
            <input 
              type="text" 
              placeholder="Votre prénom (optionnel)" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
            />
            <button className="btn-primary" onClick={uploadFiles}>
              Envoyer {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {uploading && (
        <div className={styles.loadingState}>
          {progress < 100 ? (
            <>
              <Loader2 className={styles.spinner} />
              <p>Envoi en cours... {progress}%</p>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
              </div>
            </>
          ) : (
            <div className={styles.successMessage}>
              <CheckCircle2 className={styles.successIcon} />
              <p>Terminé ! Vos photos sont en ligne.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
