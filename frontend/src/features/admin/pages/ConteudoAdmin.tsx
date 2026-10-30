import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Edit3, Eye, FileText, Globe2, Info, Plus, RefreshCw, Search, Settings2, Trash2 } from 'lucide-react';

import { ApiError } from '@/shared/api/client';
import { MetricCard, PageHeader, StatusBadge, ToolbarSearch } from '@/shared/components/app';
import {
  createAdminContent,
  deleteAdminContent,
  listAdminContent,
  updateAdminContent,
  type AdminContentItem,
  type AdminContentPayload,
  type AdminContentType,
} from '@/features/admin/api/adminContentApi';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';

type SectionFilter = 'todas' | 'home' | 'sobre' | 'doacoes' | 'footer' | 'outros';
type TypeFilter = AdminContentType | 'todos';

type ContentFormState = {
  chave: string;
  valor: string;
  tipo: AdminContentType;
  descricao: string;
};

type ContentPlacement = {
  route: string;
  area: string;
  impact: string;
  connected: boolean;
  expectedType?: AdminContentType;
};

const connectedContentRules: Record<string, ContentPlacement> = {
  home_titulo: {
    route: '/ - Home',
    area: 'Hero principal',
    impact: 'Altera o título grande da primeira dobra da Home.',
    connected: true,
    expectedType: 'texto',
  },
  home_subtitulo: {
    route: '/ - Home',
    area: 'Hero principal',
    impact: 'Altera o texto de apoio abaixo do título da Home.',
    connected: true,
    expectedType: 'texto',
  },
  home_cta_voluntario: {
    route: '/ - Home',
    area: 'Botões de chamada',
    impact: 'Altera o texto dos botões que levam para o cadastro de voluntário.',
    connected: true,
    expectedType: 'texto',
  },
  home_cta_doacao: {
    route: '/ - Home',
    area: 'Botão de doação',
    impact: 'Altera o texto do botão que leva para a página de doações.',
    connected: true,
    expectedType: 'texto',
  },
  sobre_intro: {
    route: '/sobre',
    area: 'Quem somos - primeiro parágrafo',
    impact: 'Altera o primeiro texto da seção Quem Somos.',
    connected: true,
    expectedType: 'texto',
  },
  sobre_quem_somos: {
    route: '/sobre',
    area: 'Quem somos - primeiro parágrafo',
    impact: 'Chave alternativa usada se sobre_intro não existir ou estiver vazia.',
    connected: true,
    expectedType: 'texto',
  },
  sobre_texto: {
    route: '/sobre',
    area: 'Quem somos - primeiro parágrafo',
    impact: 'Chave alternativa usada se sobre_intro e sobre_quem_somos não existirem ou estiverem vazias.',
    connected: true,
    expectedType: 'texto',
  },
  sobre_missao: {
    route: '/sobre',
    area: 'Quem somos - segundo parágrafo',
    impact: 'Altera o segundo texto da seção Quem Somos.',
    connected: true,
    expectedType: 'texto',
  },
  sobre_mission: {
    route: '/sobre',
    area: 'Quem somos - segundo parágrafo',
    impact: 'Chave alternativa usada se sobre_missao não existir ou estiver vazia.',
    connected: true,
    expectedType: 'texto',
  },
  sobre_proposito: {
    route: '/sobre',
    area: 'Quem somos - segundo parágrafo',
    impact: 'Chave alternativa usada se sobre_missao e sobre_mission não existirem ou estiverem vazias.',
    connected: true,
    expectedType: 'texto',
  },
  pix_chave: {
    route: '/doacoes',
    area: 'Doação de valores - Chave PIX',
    impact: 'Altera a chave PIX exibida e copiada pelo botão.',
    connected: true,
    expectedType: 'texto',
  },
  pix_nome_recebedor: {
    route: '/doacoes',
    area: 'Doação de valores - Dados bancários',
    impact: 'Altera o nome/banco recebedor exibido nos dados bancários.',
    connected: true,
    expectedType: 'texto',
  },
};

const plannedPrefixRules: Array<{ prefix: string; placement: ContentPlacement }> = [
  {
    prefix: 'footer_',
    placement: {
      route: 'Rodapé',
      area: 'Configuração futura',
      impact: 'Chave organizada para rodapé, mas ainda não conectada no frontend público.',
      connected: false,
    },
  },
  {
    prefix: 'instagram_',
    placement: {
      route: 'Configurações sociais',
      area: 'Configuração futura',
      impact: 'Chave organizada para redes sociais, mas ainda não conectada no frontend público.',
      connected: false,
      expectedType: 'url',
    },
  },
  {
    prefix: 'facebook_',
    placement: {
      route: 'Configurações sociais',
      area: 'Configuração futura',
      impact: 'Chave organizada para redes sociais, mas ainda não conectada no frontend público.',
      connected: false,
      expectedType: 'url',
    },
  },
];

const quickContentKeys = [
  'home_titulo',
  'home_subtitulo',
  'home_cta_voluntario',
  'home_cta_doacao',
  'sobre_intro',
  'sobre_missao',
  'pix_chave',
  'pix_nome_recebedor',
];

const sectionOptions: Array<{ label: string; value: SectionFilter }> = [
  { label: 'Todas', value: 'todas' },
  { label: 'Home', value: 'home' },
  { label: 'Sobre', value: 'sobre' },
  { label: 'Doações', value: 'doacoes' },
  { label: 'Footer', value: 'footer' },
  { label: 'Outros', value: 'outros' },
];

const PAGE_SIZE = 10;

const typeOptions: Array<{ label: string; value: TypeFilter }> = [
  { label: 'Todos', value: 'todos' },
  { label: 'Texto', value: 'texto' },
  { label: 'HTML', value: 'html' },
  { label: 'Imagem', value: 'imagem' },
  { label: 'URL', value: 'url' },
  { label: 'JSON', value: 'json' },
];

const emptyForm: ContentFormState = {
  chave: '',
  valor: '',
  tipo: 'texto',
  descricao: '',
};

function apiErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Não foi possível concluir a solicitação.';
}

function normalizeContentKeyInput(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^[_.,-]+|[_.,-]+$/g, '')
    .slice(0, 100);
}

function typeLabel(type: AdminContentType) {
  return typeOptions.find((option) => option.value === type)?.label || type;
}

function sectionForKey(key: string): SectionFilter {
  if (key.startsWith('home_') || key.startsWith('home.')) {
    return 'home';
  }

  if (key.startsWith('sobre_') || key.startsWith('sobre.')) {
    return 'sobre';
  }

  if (key.startsWith('pix_') || key.startsWith('doacoes_') || key.startsWith('donations.')) {
    return 'doacoes';
  }

  if (key.startsWith('footer_') || key.startsWith('footer.')) {
    return 'footer';
  }

  return 'outros';
}

function sectionLabel(section: SectionFilter) {
  return sectionOptions.find((option) => option.value === section)?.label || section;
}


function placementForKey(key: string): ContentPlacement {
  const normalized = normalizeContentKeyInput(key);

  if (connectedContentRules[normalized]) {
    return connectedContentRules[normalized];
  }

  const planned = plannedPrefixRules.find((rule) => normalized.startsWith(rule.prefix));

  if (planned) {
    return planned.placement;
  }

  return {
    route: 'Não conectado',
    area: 'Sem uso no site público',
    impact: 'Esta chave fica salva no CMS, mas não altera nenhuma tela pública até o frontend ser conectado a ela.',
    connected: false,
  };
}

function connectionLabel(placement: ContentPlacement) {
  return placement.connected ? 'Conectado' : 'Não conectado';
}

function connectionClass(placement: ContentPlacement) {
  return placement.connected ? 'text-emerald-700' : 'text-amber-700';
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR');
}

function itemToForm(item: AdminContentItem): ContentFormState {
  return {
    chave: item.chave,
    valor: item.valor,
    tipo: item.tipo,
    descricao: item.descricao || '',
  };
}

function formToPayload(form: ContentFormState): AdminContentPayload {
  return {
    chave: normalizeContentKeyInput(form.chave),
    valor: form.valor,
    tipo: form.tipo,
    descricao: form.descricao.trim(),
  };
}

export function ConteudoAdmin() {
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [query, setQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('todas');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todos');
  const [selectedItem, setSelectedItem] = useState<AdminContentItem | null>(null);
  const [editorItem, setEditorItem] = useState<AdminContentItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<AdminContentItem | null>(null);
  const [formState, setFormState] = useState<ContentFormState>(emptyForm);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadContent = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await listAdminContent({
        q: query.trim() || undefined,
        tipo: typeFilter === 'todos' ? undefined : typeFilter,
        page: currentPage,
        limit: PAGE_SIZE,
      });
      setItems(response.data);
      setTotalPages(Math.max(1, response.meta.totalPages || 1));
    } catch (error) {
      setErrorMessage(apiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [query, typeFilter, currentPage]);


  useEffect(() => {
    setCurrentPage(1);
  }, [query, sectionFilter, typeFilter]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadContent();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [loadContent]);

  const filteredItems = useMemo(() => items.filter((item) => (
    sectionFilter === 'todas' || sectionForKey(item.chave) === sectionFilter
  )), [items, sectionFilter]);

  const metrics = useMemo(() => ({
    total: items.length,
    texts: items.filter((item) => item.tipo === 'texto' || item.tipo === 'html').length,
    settings: items.filter((item) => ['json', 'url'].includes(item.tipo)).length,
    connected: items.filter((item) => placementForKey(item.chave).connected).length,
    sections: new Set(items.map((item) => sectionForKey(item.chave))).size,
  }), [items]);

  const resetFilters = () => {
    setQuery('');
    setSectionFilter('todas');
    setTypeFilter('todos');
    setCurrentPage(1);
  };

  const openEditor = (item?: AdminContentItem) => {
    setEditorItem(item ?? null);
    setFormState(item ? itemToForm(item) : emptyForm);
    setIsEditorOpen(true);
    setSuccessMessage('');
    setErrorMessage('');
  };


  const openKeyEditor = (key: string) => {
    const existingItem = items.find((item) => item.chave === key);

    if (existingItem) {
      openEditor(existingItem);
      return;
    }

    const placement = placementForKey(key);
    setEditorItem(null);
    setFormState({ chave: key, valor: '', tipo: placement.expectedType || 'texto', descricao: placement.area });
    setIsEditorOpen(true);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditorItem(null);
    setFormState(emptyForm);
  };

  const submitEditor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const payload = formToPayload(formState);
      const response = editorItem
        ? await updateAdminContent(editorItem.chave, payload)
        : await createAdminContent(payload);

      setSuccessMessage(response.message);
      closeEditor();
      await loadContent();
    } catch (error) {
      setErrorMessage(apiErrorMessage(error));
    } finally {
      setIsActionLoading(false);
    }
  };

  const runDelete = async () => {
    if (!deleteItem) {
      return;
    }

    setIsActionLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await deleteAdminContent(deleteItem.chave);
      setSuccessMessage(response.message);
      setDeleteItem(null);
      await loadContent();
    } catch (error) {
      setErrorMessage(apiErrorMessage(error));
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="CMS"
        title="Conteúdo do site"
        description="Gerencie textos, contatos e configurações consumidos pelo portal público por chave."
        actions={<button type="button" onClick={() => openEditor()} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"><Plus className="h-4 w-4" />Novo conteúdo</button>}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Blocos" value={metrics.total} icon={Globe2} />
        <MetricCard label="Textos" value={metrics.texts} icon={FileText} tone="emerald" />
        <MetricCard label="Configurações" value={metrics.settings} icon={Settings2} tone="slate" />
        <MetricCard label="Conectados" value={metrics.connected} icon={Info} tone="amber" />
      </div>

      {successMessage ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{successMessage}</div> : null}
      {errorMessage ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div> : null}

      <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Como este CMS altera o site</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">Apenas chaves conectadas ao frontend alteram páginas públicas. Use as chaves abaixo para editar pontos já publicados; chaves novas ficam guardadas, mas aparecem como não conectadas até serem integradas no código.</p>
          </div>
          <StatusBadge>Chave = ponto editável</StatusBadge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {quickContentKeys.map((key) => {
            const placement = placementForKey(key);
            return (
              <button key={key} type="button" onClick={() => openKeyEditor(key)} className="rounded-lg border border-cyan-100 bg-white p-3 text-left shadow-sm transition hover:border-cyan-300 hover:shadow-md">
                <span className="font-mono text-xs font-semibold text-cyan-800">{key}</span>
                <span className="mt-2 block text-sm font-semibold text-slate-900">{placement.route}</span>
                <span className="mt-1 block text-xs text-slate-500">{placement.area}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Blocos de conteúdo</h2>
              <p className="mt-1 text-sm text-slate-500">As chaves são estáveis; para renomear uma chave, crie um novo conteúdo e remova o antigo.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <ToolbarSearch placeholder="Buscar conteúdo" value={query} onChange={(event) => setQuery(event.target.value)} />
              <button type="button" onClick={() => void loadContent()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Atualizar</button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value as SectionFilter)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600">
              {sectionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TypeFilter)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600">
              {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button type="button" onClick={resetFilters} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Limpar filtros</button>
          </div>
        </div>

        {isLoading ? <div className="px-5 py-12 text-center text-sm font-medium text-slate-500">Carregando conteúdos...</div> : null}

        {!isLoading && filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3">Conteúdo</th><th className="px-5 py-3">Chave</th><th className="px-5 py-3">Onde aparece</th><th className="px-5 py-3">Seção</th><th className="px-5 py-3">Tipo</th><th className="px-5 py-3">Atualizado</th><th className="px-5 py-3 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const placement = placementForKey(item.chave);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4"><p className="font-semibold text-slate-950">{item.descricao || item.chave}</p><p className="mt-1 max-w-md truncate text-xs text-slate-500">{item.valor}</p></td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">{item.chave}</td>
                      <td className="px-5 py-4"><p className="font-semibold text-slate-800">{placement.route}</p><p className="mt-1 text-xs text-slate-500">{placement.area}</p><p className={'mt-1 text-xs font-semibold ' + connectionClass(placement)}>{connectionLabel(placement)}</p></td>
                      <td className="px-5 py-4 text-slate-600">{sectionLabel(sectionForKey(item.chave))}</td>
                      <td className="px-5 py-4"><StatusBadge>{typeLabel(item.tipo)}</StatusBadge></td>
                      <td className="px-5 py-4 text-slate-600">{formatDate(item.atualizado_em)}</td>
                      <td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => setSelectedItem(item)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Visualizar"><Eye className="h-4 w-4" /></button><button type="button" onClick={() => openEditor(item)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Editar"><Edit3 className="h-4 w-4" /></button><button type="button" onClick={() => setDeleteItem(item)} className="rounded-md p-2 text-rose-600 hover:bg-rose-50" aria-label="Excluir"><Trash2 className="h-4 w-4" /></button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isLoading && filteredItems.length === 0 ? <div className="flex flex-col items-center justify-center px-5 py-12 text-center text-slate-500"><Search className="mb-3 h-8 w-8 text-slate-300" />Nenhum conteúdo encontrado.</div> : null}

        {!isLoading && totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-600">
            <span>Página {currentPage} de {totalPages}</span>
            <div className="flex gap-2">
              <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Anterior</button>
              <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Próxima</button>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-2xl">
          {selectedItem ? (() => { const placement = placementForKey(selectedItem.chave); return <><DialogHeader><DialogTitle>{selectedItem.descricao || selectedItem.chave}</DialogTitle><DialogDescription>{selectedItem.chave}</DialogDescription></DialogHeader><div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2"><p><span className="text-slate-500">Onde aparece:</span> {placement.route}</p><p><span className="text-slate-500">Área:</span> {placement.area}</p><p><span className="text-slate-500">Conexão:</span> <span className={connectionClass(placement)}>{connectionLabel(placement)}</span></p><p><span className="text-slate-500">Tipo:</span> {typeLabel(selectedItem.tipo)}</p><p className="sm:col-span-2"><span className="text-slate-500">Impacto:</span> {placement.impact}</p><p><span className="text-slate-500">Criado:</span> {formatDate(selectedItem.criado_em)}</p><p><span className="text-slate-500">Atualizado:</span> {formatDate(selectedItem.atualizado_em)}</p></div><p className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">{selectedItem.valor}</p></>; })() : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditorOpen} onOpenChange={(open) => { if (!open) closeEditor(); }}>
        <DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editorItem ? 'Editar conteúdo' : 'Novo conteúdo'}</DialogTitle><DialogDescription>Atualize a chave, tipo e valor do bloco público.</DialogDescription></DialogHeader>
          <form onSubmit={submitEditor} className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">Descrição<input value={formState.descricao} onChange={(event) => setFormState((current) => ({ ...current, descricao: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
            <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">Chave<input required disabled={Boolean(editorItem)} value={formState.chave} onChange={(event) => setFormState((current) => ({ ...current, chave: normalizeContentKeyInput(event.target.value) }))} placeholder="ex: sobre_intro" className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm outline-none focus:border-cyan-600 disabled:bg-slate-50 disabled:text-slate-500" /><span className="block text-xs font-normal text-slate-500">Use uma chave estável. Espaços, acentos e maiúsculas são convertidos automaticamente.</span></label>
            <label className="space-y-2 text-sm font-medium text-slate-700">Tipo<select value={formState.tipo} onChange={(event) => setFormState((current) => ({ ...current, tipo: event.target.value as AdminContentType }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"><option value="texto">Texto</option><option value="html">HTML</option><option value="imagem">Imagem</option><option value="url">URL</option><option value="json">JSON</option></select></label>
            <label className="space-y-2 text-sm font-medium text-slate-700">Seção<input value={sectionLabel(sectionForKey(formState.chave))} disabled className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 outline-none" /></label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm sm:col-span-2">
              <p className="font-semibold text-slate-800">{placementForKey(formState.chave).route} · {placementForKey(formState.chave).area}</p>
              <p className="mt-1 text-slate-600">{placementForKey(formState.chave).impact}</p>
              <p className={'mt-2 text-xs font-semibold ' + connectionClass(placementForKey(formState.chave))}>{connectionLabel(placementForKey(formState.chave))}</p>
            </div>
            <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">Valor<textarea required value={formState.valor} onChange={(event) => setFormState((current) => ({ ...current, valor: event.target.value }))} rows={8} className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>
            <DialogFooter className="sm:col-span-2"><button type="button" disabled={isActionLoading} onClick={closeEditor} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="submit" disabled={isActionLoading} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-70">{isActionLoading ? 'Salvando...' : 'Salvar'}</button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteItem)} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-md">
          <DialogHeader><DialogTitle>Excluir conteúdo</DialogTitle><DialogDescription>Esta ação remove a chave do CMS e pode afetar páginas públicas que dependem dela.</DialogDescription></DialogHeader>
          <p className="text-sm text-slate-700">Excluir definitivamente {deleteItem?.chave}?</p>
          <DialogFooter><button type="button" disabled={isActionLoading} onClick={() => setDeleteItem(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="button" disabled={isActionLoading} onClick={() => void runDelete()} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-70">{isActionLoading ? 'Excluindo...' : 'Excluir'}</button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
