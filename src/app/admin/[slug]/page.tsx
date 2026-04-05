import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabaseServer';
import AdminPanel from '@/components/AdminPanel/AdminPanel';

interface AdminPageProps {
  params: {
    slug: string;
  };
}

async function getEventForAdmin(slug: string) {
  // 1. Récupérer le client serveur Supabase
  const supabase = await createClient();

  // 2. Fetch l'événement par son slug
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !event) return null;

  // 3. Récupérer l'utilisateur pour vérification propriétaire
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || event.owner_id !== user.id) {
    return 'unauthorized';
  }

  return event;
}

export default async function AdminEventPage({ params }: AdminPageProps) {
  const { slug } = await params;
  const result = await getEventForAdmin(slug);

  if (!result) {
    return notFound();
  }

  if (result === 'unauthorized') {
    return redirect('/login');
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-gradient)' }}>
      <AdminPanel event={result} />
    </main>
  );
}
