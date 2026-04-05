import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import JSZip from "https://esm.sh/jszip@3.10.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Gestion du preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { slug } = await req.json()
    
    if (!slug) throw new Error("Le slug de l'événement est requis.")

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Lister tous les fichiers du dossier de l'événement
    console.log(`Génération du ZIP pour le slug: ${slug}...`);
    
    const { data: list, error: listError } = await supabaseAdmin.storage
      .from('event-photos')
      .list(slug);

    if (listError) throw listError;
    if (!list || list.length === 0) throw new Error("Aucune photo trouvée pour cet événement.");

    // 2. Initialiser le ZIP
    const zip = new JSZip();

    // 3. Télécharger et ajouter chaque fichier au ZIP
    for (const item of list) {
      if (item.name === '.emptyFolderPlaceholder') continue;
      
      const { data, error } = await supabaseAdmin.storage
        .from('event-photos')
        .download(`${slug}/${item.name}`);
      
      if (!error && data) {
        const buffer = await data.arrayBuffer();
        zip.file(item.name, buffer);
      }
    }

    // 4. Générer le binaire ZIP final
    const zipContent = await zip.generateAsync({ type: "uint8array" });

    console.log(`ZIP généré avec succès pour ${slug} (${list.length} photos)`);

    return new Response(zipContent, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="souvenirs-${slug}.zip"`
      },
    });

  } catch (error) {
    console.error("Erreur Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
