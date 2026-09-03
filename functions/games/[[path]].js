// 诊断：列出运行时绑定桶的全部对象，确认绑定指向
export async function onRequestGet({ request, env }) {
  if (!env || typeof env.MY_GAME_BUCKET?.list !== 'function') {
    return new Response('NO-BINDING typeof=' + typeof env?.MY_GAME_BUCKET, {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
  try {
    const listing = await env.MY_GAME_BUCKET.list({ limit: 12 });
    const keys = listing.objects.map((o) => o.key);
    return new Response('LIST-ALL count=' + listing.objects.length + ' keys=' + JSON.stringify(keys), {
      status: 200,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    return new Response('LIST-ERR ' + String(err), {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
}
