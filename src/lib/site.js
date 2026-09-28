// Dados da arquitetura (gerados por scripts/extract-xlsx.py) e utilitários de navegação.
import pages from '../data/pages.json' with { type: 'json' };
import articles from '../data/articles.json' with { type: 'json' };
import links from '../data/links.json' with { type: 'json' };
import menu from '../data/menu.json' with { type: 'json' };
import content from '../data/content.json' with { type: 'json' };

export const SITE_NAME = 'Turbo Trade Marketing';
export const QUOTE_URL = '/solicitar-orcamento/';

export { pages, articles, links, menu };

// Artigos entram no mesmo formato das páginas do mapa, filhos de /blog/.
const articlePages = articles.map((a) => ({
  id: a.id,
  hub: 'Blog',
  level: 2,
  name: a.title,
  url: a.url,
  type: 'Artigo',
  keyword: a.keyword,
  variations: [],
  intent: 'Informacional',
  intentDetail: '',
  stage: a.stage,
  persona: a.persona,
  cta: '',
  parent: '/blog/',
  priority: a.priority,
  condition: 'Nenhuma',
  status: a.status,
  target: a.target,
}));

export const allPages = [...pages, ...articlePages];
const byUrl = new Map(allPages.map((p) => [p.url, p]));

export const getPage = (url) => byUrl.get(url);

export const getContent = (url) => content[url] ?? null;

// Primeira frase da intro, sem marcadores (usada em cards).
export function summary(url) {
  const intro = getContent(url)?.intro?.[0];
  if (!intro) return '';
  const text = intro.replace(/\s*\[VALIDAR[^\]]*\]/g, '');
  return text.match(/^.+?[.!?](\s|$)/)?.[0].trim() ?? text;
}

// Primeira frase útil do conteúdo, sem marcadores, cortada para meta description.
export function describe(page) {
  const intro = getContent(page.url)?.intro?.[0];
  const text = (intro || page.intentDetail || `${page.name}: ${page.keyword}.`).replace(/\s*\[VALIDAR[^\]]*\]/g, '');
  return text.length <= 158 ? text : text.slice(0, 155).replace(/\s+\S*$/, '') + '...';
}

// Páginas com condição para publicar ficam fora do índice até terem informação real.
export const isNoindex = (p) => p.condition && p.condition !== 'Nenhuma';
export const noindexUrls = () => allPages.filter(isNoindex).map((p) => p.url);

export function breadcrumb(url) {
  const trail = [];
  let p = byUrl.get(url);
  while (p && p.url !== '/') {
    trail.unshift({ name: p.name, url: p.url });
    p = byUrl.get(p.parent);
  }
  trail.unshift({ name: 'Home', url: '/' });
  return trail;
}

export const children = (url) => allPages.filter((p) => p.parent === url && p.url !== url);

export const outgoingLinks = (url) => links.filter((l) => l.from === url);

export function menuTree(area) {
  const items = menu.filter((m) => m.area === area);
  const tree = [];
  const stack = [];
  for (const m of items) {
    const node = { ...m, children: [] };
    stack.length = m.level - 1;
    if (m.level === 1) tree.push(node);
    else stack[m.level - 2]?.children.push(node);
    stack[m.level - 1] = node;
  }
  return tree;
}
