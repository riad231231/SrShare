'use client';

import React, { useState } from 'react';
import { login } from './actions';
import { LogIn, Mail, Lock, Loader2, Sparkles } from 'lucide-react';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function clientAction(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.loginCard} premium-card`}>
        <header className={styles.header}>
          <div className={styles.iconBox}>
            <Sparkles size={24} color="var(--gold-soft)" />
          </div>
          <h1>Qr Share Admin</h1>
          <p>Connectez-vous pour gérer vos événements.</p>
        </header>

        <form action={clientAction} className={styles.form}>
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <Mail className={styles.inputIcon} size={18} />
            <input 
              name="email" 
              type="email" 
              placeholder="Email professionnel" 
              required
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <Lock className={styles.inputIcon} size={18} />
            <input 
              name="password" 
              type="password" 
              placeholder="Mot de passe" 
              required
              className={styles.input}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 className={styles.spinner} /> : (
              <>
                <LogIn size={18} />
                <span>Se connecter</span>
              </>
            )}
          </button>
        </form>

        <footer className={styles.footer}>
          <p>Pas encore de compte ? Contactez l'administrateur.</p>
        </footer>
      </div>
    </div>
  );
}
