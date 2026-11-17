// Servidor da Aurora: entrega a página e guarda a chave da IA em segredo.
const http=require('http'),fs=require('fs'),path=require('path');
const KEY=process.env.ANTHROPIC_API_KEY,CODE=process.env.APP_PASSWORD||'',MODEL=process.env.AURORA_MODEL||'claude-sonnet-5-5';
const SYS=c=>`Você é ${c.assistant||'Aurora'}, assistente de voz para pessoas cegas e com baixa visão, no Brasil. Fale em português brasileiro, de forma acolhedora, natural e curta (1 a 3 frases, sem listas, sem markdown, pois sua resposta será lida em voz alta). Chame a pessoa de ${c.user||'você'}. Diferencie o que é confirmado, estimado e desconhecido. Nunca invente horários de ônibus, trânsito, preços ou o que há ao redor. Você não vê o ambiente, não detecta obstáculos nem semáforos e não deve afirmar que uma travessia é segura. Navegação, "onde estou" e "o que tem perto" são tratados pelo aplicativo. Se faltar informação, faça uma pergunta curta. Contexto atual: ${JSON.stringify(c)}`;
http.createServer(async(req,res)=>{
 if(req.method==='GET'&&(req.url==='/'||req.url.startsWith('/?'))){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(fs.readFileSync(path.join(__dirname,'index.html')))}
 if(req.method==='POST'&&req.url==='/api/chat'){
  if(!KEY){res.writeHead(501);return res.end('{}')}
  if(CODE&&req.headers['x-access']!==CODE){res.writeHead(401);return res.end('{}')}
  let b='';for await(const c of req)b+=c;
  try{const{messages,context}=JSON.parse(b);
   const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':KEY,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:MODEL,max_tokens:400,system:SYS(context||{}),messages:(messages||[]).slice(-12)})});
   const j=await r.json();if(!r.ok){console.error(j);res.writeHead(502);return res.end('{}')}
   res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({text:j.content.map(x=>x.text||'').join('')}))
  }catch(e){console.error(e);res.writeHead(500);return res.end('{}')}}
 res.writeHead(404);res.end();
}).listen(process.env.PORT||3000,()=>console.log('Aurora no ar'));
