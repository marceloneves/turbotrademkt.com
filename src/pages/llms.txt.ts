// llms.txt gerado a partir da arquitetura: só páginas indexáveis, agrupadas por hub.
import { allPages, isNoindex, summary, SITE_NAME } from '../lib/site.js';

export function GET({ site }) {
  const abs = (url: string) => new URL(url, site).href;
  const pages = allPages.filter((p) => !isNoindex(p) && p.url !== '/');
  const groups = new Map<string, typeof pages>();
  for (const p of pages) {
    if (!groups.has(p.hub)) groups.set(p.hub, []);
    groups.get(p.hub).push(p);
  }

  const lines = [
    `# ${SITE_NAME}`,
    '',
    '> Agência de trade marketing para indústrias e marcas que vendem no varejo brasileiro: promotores de vendas, merchandising no PDV, auditoria, inteligência de mercado, consultoria, lançamentos, live marketing e treinamento de equipes de varejo.',
    '',
    'O site é escrito para gerentes de trade marketing, diretores comerciais, donos de indústrias regionais e áreas de compras. O serviço é para marcas e indústrias; candidatos a vaga de promotor devem usar a página de vagas.',
    '',
  ];
  for (const [hub, list] of groups) {
    lines.push(`## ${hub}`, '');
    for (const p of list) {
      const desc = summary(p.url);
      lines.push(`- [${p.name}](${abs(p.url)})${desc ? `: ${desc}` : ''}`);
    }
    lines.push('');
  }
  lines.push('## Optional', '', `- [Sitemap](${abs('/sitemap-index.xml')})`, '');

  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
