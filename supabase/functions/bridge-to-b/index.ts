// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

/// <reference lib="deno.ns" />

const TARGET_URL = Deno.env.get("TARGET_URL")!;   
console.log('TARGET URLLL ' + TARGET_URL)
const TARGET_KEY = Deno.env.get("TARGET_KEY")!;   
console.log('TARGET URLLL ' + TARGET_KEY)


const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info, x-supabase-authorization",
  "Content-Type": "application/json",
};
const json = (d:any, s=200)=>new Response(JSON.stringify(d), { status:s, headers:CORS });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({}, 200);

  try {
    const b = await req.json();
    if (!b?.user_id) return json({ error: "user_id zorunlu" }, 400);

    const dateStr = typeof b.date === "string" ? b.date : new Date(b.date).toISOString();

    const headers = {
      apikey: TARGET_KEY,
      Authorization: `Bearer ${TARGET_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation", 
    };

    if (b.action === "update_ticket") {
      if (!b.user_id) return json({ ok: false, error: "user_id zorunlu" }, 400);
     

      const resp = await fetch(
        `${TARGET_URL}/rest/v1/appointments?user_id=eq.${encodeURIComponent(b.user_id)}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ 
            user_id: b.user_id,
            flight_booked: b.flight_booked ,
        

          }),
        }
      );

      const txt = await resp.text();
      if (!resp.ok) {
        return json({ ok: false, status: resp.status, error: txt || resp.statusText }, resp.status);
      }

      const arr = txt ? JSON.parse(txt) : [];
      return json({ ok: true, updated: Array.isArray(arr) ? arr.length : 0, rows: arr });
    }
    if (b.id) {
      const byId = await fetch(
        `${TARGET_URL}/rest/v1/appointments?user_id=eq.${encodeURIComponent(b.user_id)}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            user_id: b.user_id,
            first_name: b.first_name,
            last_name: b.last_name,
            city: b.city,
            person_count: b.person_count,
            date: dateStr,
            
          }),
        }
      );
      const txtId = await byId.text();
      const arrId = byId.ok && txtId ? JSON.parse(txtId) : [];
      if (Array.isArray(arrId) && arrId.length > 0) {
        return new Response(txtId || "[]", { status: byId.status, headers: CORS });
      }
    }


    const byUser = await fetch(
      `${TARGET_URL}/rest/v1/appointments?user_id=eq.${encodeURIComponent(b.user_id)}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          first_name: b.first_name,
          last_name: b.last_name,
          city: b.city,
          person_count: b.person_count,
          date: dateStr,
        }),
      }
    );
    const txtUser = await byUser.text();
    const arrUser = byUser.ok && txtUser ? JSON.parse(txtUser) : [];
    if (Array.isArray(arrUser) && arrUser.length > 0) {
      return new Response(txtUser || "[]", { status: byUser.status, headers: CORS });
    }


    const ins = await fetch(`${TARGET_URL}/rest/v1/appointments`, {
      method: "POST",
      headers,
      body: JSON.stringify([{
        ...(b.id ? { id: b.id } : {}),
        user_id: b.user_id,
        first_name: b.first_name,
        last_name: b.last_name,
        city: b.city,
        person_count: b.person_count,
        date: dateStr,
      }]),
    });
    const txtIns = await ins.text();
    return new Response(txtIns || "[]", { status: ins.status, headers: CORS });

  } catch (e:any) {
    return json({ error: e?.message ?? String(e) }, 500);
  }
});
// Deno.serve(async (req) => {
//   if (req.method === "OPTIONS") return json({}, 200);

//   try {
//     const body = await req.json();
//     if (!body?.user_id) return json({ error: "user_id zorunlu" }, 400);

//     // Upsert: user_id çatışma alanı
//     const res = await fetch(`${TARGET_URL}/rest/v1/appointments?on_conflict=id`, {
//       method: "POST",
//       headers: {
//         apikey: TARGET_KEY,
//         Authorization: `Bearer ${TARGET_KEY}`,
//         "Content-Type": "application/json",
     
//         Prefer: "resolution=merge-duplicates,return=representation",
//       },
//       body: JSON.stringify([{
//         user_id: body.user_id,
//         first_name: body.first_name,
//         last_name: body.last_name,
//         city: body.city,
//         person_count: body.person_count,
//         date: body.date, 
//       }]),
//     });

//     const text = await res.text();
//     return new Response(text, {
//       status: res.status,
//       headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
//     });
//   } catch (e:any) {
//     return json({ error: e?.message ?? String(e) }, 500);
//   }
// });
/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/bridge-to-b' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
