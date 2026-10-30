import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Eye,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  UserCheck,
  UserRound,
  XCircle,
} from 'lucide-react';

import { MetricCard, PageHeader, StatusBadge, ToolbarSearch } from '@/shared/components/app';
import { ApiError } from '@/shared/api/client';
import { getInterestAreas, type InterestArea } from '@/features/public/api/publicApi';
import {
  approveAdminVolunteer,
  createAdminVolunteer,
  deleteAdminVolunteer,
  listAdminVolunteers,
  reactivateAdminVolunteer,
  rejectAdminVolunteer,
  suspendAdminVolunteer,
  updateAdminVolunteer,
  type AdminVolunteer,
  type AdminVolunteerPayload,
  type AdminVolunteerStatus,
} from '@/features/admin/api/adminVolunteersApi';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';

const PAGE_SIZE = 10;

const fallbackInterestAreas: InterestArea[] = [
  { id: 1, nome: 'Acolhimento nas ruas' },
  { id: 2, nome: 'Preparação de alimentos' },
  { id: 3, nome: 'Distribuição de refeições' },
  { id: 4, nome: 'Triagem de doações' },
  { id: 5, nome: 'Logística e transporte' },
  { id: 6, nome: 'Comunicação e redes sociais' },
  { id: 7, nome: 'Captação de doações' },
  { id: 8, nome: 'Organização de eventos' },
  { id: 9, nome: 'Apoio administrativo' },
  { id: 10, nome: 'Fotografia e registros' },
];

const statusOptions: Array<{ label: string; value: AdminVolunteerStatus | 'todos' }> = [
  { label: 'Todos', value: 'todos' },
  { label: 'Pendente', value: 'pendente' },
  { label: 'Aprovado', value: 'aprovado' },
  { label: 'Inativo', value: 'inativo' },
  { label: 'Suspenso', value: 'suspenso' },
  { label: 'Rejeitado', value: 'rejeitado' },
];

type VolunteerFormState = {
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  mensagem: string;
  comoSoube: string;
  status: 'pendente' | 'aprovado';
  areas_interesse: number[];
};

const emptyForm: VolunteerFormState = {
  nome: '',
  email: '',
  telefone: '',
  cidade: '',
  mensagem: '',
  comoSoube: 'Cadastro manual admin',
  status: 'aprovado',
  areas_interesse: [],
};

function statusLabel(status: AdminVolunteerStatus) {
  return statusOptions.find((item) => item.value === status)?.label || status;
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString('pt-BR') : '-';
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function parseMessageField(message: string | null, label: string) {
  const prefix = `${label}:`;
  return (message || '')
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.toLowerCase().startsWith(prefix.toLowerCase()))
    ?.slice(prefix.length)
    .trim() || '';
}

function mainObservation(message: string | null) {
  return (message || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.toLowerCase().startsWith('cidade:') && !line.toLowerCase().startsWith('como soube:'))
    .join('\n') || '';
}

function volunteerCity(volunteer: AdminVolunteer) {
  return parseMessageField(volunteer.mensagem, 'Cidade') || 'Não informado';
}

function volunteerAreas(volunteer: AdminVolunteer) {
  return volunteer.areas.length ? volunteer.areas.map((area) => area.nome).join(', ') : 'Não informado';
}

function volunteerToForm(volunteer: AdminVolunteer): VolunteerFormState {
  return {
    nome: volunteer.nome,
    email: volunteer.email,
    telefone: volunteer.telefone || '',
    cidade: volunteerCity(volunteer) === 'Não informado' ? '' : volunteerCity(volunteer),
    mensagem: mainObservation(volunteer.mensagem),
    comoSoube: parseMessageField(volunteer.mensagem, 'Como soube') || 'Cadastro manual admin',
    status: volunteer.status === 'aprovado' ? 'aprovado' : 'pendente',
    areas_interesse: volunteer.areas.map((area) => area.id),
  };
}

function apiErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Não foi possível concluir a solicitação.';
}

export function VoluntariosAdmin() {
  const [volunteers, setVolunteers] = useState<AdminVolunteer[]>([]);
  const [interestAreas, setInterestAreas] = useState<InterestArea[]>(fallbackInterestAreas);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminVolunteerStatus | 'todos'>('todos');
  const [cityFilter, setCityFilter] = useState('Todas');
  const [selectedVolunteer, setSelectedVolunteer] = useState<AdminVolunteer | null>(null);
  const [editorVolunteer, setEditorVolunteer] = useState<AdminVolunteer | null>(null);
  const [formState, setFormState] = useState<VolunteerFormState>(emptyForm);
  const [approvalVolunteer, setApprovalVolunteer] = useState<AdminVolunteer | null>(null);
  const [rejectionVolunteer, setRejectionVolunteer] = useState<AdminVolunteer | null>(null);
  const [suspensionVolunteer, setSuspensionVolunteer] = useState<AdminVolunteer | null>(null);
  const [reactivationVolunteer, setReactivationVolunteer] = useState<AdminVolunteer | null>(null);
  const [deleteVolunteer, setDeleteVolunteer] = useState<AdminVolunteer | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadVolunteers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await listAdminVolunteers({
        q: query.trim() || undefined,
        status: statusFilter === 'todos' ? undefined : statusFilter,
        page: currentPage,
        limit: PAGE_SIZE,
      });
      setVolunteers(response.data);
      setTotalPages(Math.max(1, response.meta.totalPages || 1));
    } catch (error) {
      setErrorMessage(apiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, query, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [cityFilter, query, statusFilter]);

  useEffect(() => {
    getInterestAreas()
      .then((response) => setInterestAreas(response.data.length ? response.data : fallbackInterestAreas))
      .catch(() => setInterestAreas(fallbackInterestAreas));
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadVolunteers();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [loadVolunteers]);

  const cityOptions = useMemo(() => {
    const cities = [...new Set(volunteers.map(volunteerCity).filter((city) => city !== 'Não informado'))].sort();
    return ['Todas', ...cities];
  }, [volunteers]);

  const visibleVolunteers = useMemo(() => volunteers.filter((volunteer) => cityFilter === 'Todas' || volunteerCity(volunteer) === cityFilter), [cityFilter, volunteers]);

  const metrics = useMemo(() => ({
    pending: volunteers.filter((volunteer) => volunteer.status === 'pendente').length,
    approved: volunteers.filter((volunteer) => volunteer.status === 'aprovado').length,
    inactive: volunteers.filter((volunteer) => volunteer.status === 'inativo' || volunteer.status === 'suspenso').length,
    total: volunteers.length,
  }), [volunteers]);

  const openEditor = (volunteer?: AdminVolunteer) => {
    setEditorVolunteer(volunteer ?? null);
    setFormState(volunteer ? volunteerToForm(volunteer) : emptyForm);
    setIsEditorOpen(true);
  };

  const selectedAreaItems = interestAreas.filter((area) => formState.areas_interesse.includes(area.id));

  const toggleArea = (areaId: number) => {
    setFormState((current) => ({
      ...current,
      areas_interesse: current.areas_interesse.includes(areaId)
        ? current.areas_interesse.filter((id) => id !== areaId)
        : [...current.areas_interesse, areaId],
    }));
  };

  const submitEditor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const payload: AdminVolunteerPayload = formState;

    try {
      const response = editorVolunteer
        ? await updateAdminVolunteer(editorVolunteer.id, payload)
        : await createAdminVolunteer(payload);

      setSuccessMessage(response.message);
      setIsEditorOpen(false);
      setEditorVolunteer(null);
      setFormState(emptyForm);
      await loadVolunteers();
    } catch (error) {
      setErrorMessage(apiErrorMessage(error));
    } finally {
      setIsActionLoading(false);
    }
  };

  const runAction = async (action: () => Promise<{ message: string }>, close: () => void) => {
    setIsActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await action();
      setSuccessMessage(response.message);
      close();
      await loadVolunteers();
    } catch (error) {
      setErrorMessage(apiErrorMessage(error));
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Fluxo de aprovação"
        title="Voluntários"
        description="Analise cadastros públicos, aprove voluntários e acompanhe o status de acesso ao portal."
        actions={<button type="button" onClick={() => openEditor()} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"><Plus className="h-4 w-4" />Cadastrar voluntário</button>}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Pendentes" value={metrics.pending} icon={AlertTriangle} tone="amber" />
        <MetricCard label="Aprovados" value={metrics.approved} icon={UserCheck} tone="emerald" />
        <MetricCard label="Total cadastrado" value={metrics.total} icon={UserRound} />
        <MetricCard label="Inativos/suspensos" value={metrics.inactive} icon={XCircle} tone="rose" />
      </div>

      {successMessage ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{successMessage}</div> : null}
      {errorMessage ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div> : null}

      {metrics.pending > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div><h2 className="text-lg font-bold text-amber-950">Cadastros aguardando análise</h2><p className="mt-1 text-sm text-amber-800">Priorize aprovação ou rejeição para liberar convite de acesso ao portal.</p></div>
            <button type="button" onClick={() => setStatusFilter('pendente')} className="inline-flex w-fit items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">Ver pendentes</button>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><h2 className="text-xl font-bold text-slate-950">Lista de voluntários</h2><p className="mt-1 text-sm text-slate-500">Dados carregados da API administrativa protegida.</p></div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><ToolbarSearch placeholder="Buscar por nome, e-mail ou telefone" value={query} onChange={(event) => setQuery(event.target.value)} /><button type="button" onClick={() => void loadVolunteers()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Atualizar</button></div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AdminVolunteerStatus | 'todos')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600">{cityOptions.map((city) => <option key={city}>{city}</option>)}</select>
            <button type="button" onClick={() => { setQuery(''); setStatusFilter('todos'); setCityFilter('Todas'); setCurrentPage(1); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Limpar filtros</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Voluntário</th><th className="px-5 py-3">Contato</th><th className="px-5 py-3">Cidade</th><th className="px-5 py-3">Áreas</th><th className="px-5 py-3">Cadastro</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Ações</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {visibleVolunteers.map((volunteer) => (
                <tr key={volunteer.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50 text-sm font-bold text-cyan-700">{initials(volunteer.nome)}</div><div><span className="font-semibold text-slate-950">{volunteer.nome}</span><p className="mt-1 text-xs text-slate-500">{volunteer.tem_senha ? 'Conta ativada' : 'Aguardando ativação'}</p></div></div></td>
                  <td className="px-5 py-4 text-slate-600"><p>{volunteer.email}</p><p className="mt-1 text-xs text-slate-500">{volunteer.telefone || '-'}</p></td>
                  <td className="px-5 py-4 text-slate-600">{volunteerCity(volunteer)}</td>
                  <td className="px-5 py-4 text-slate-600">{volunteerAreas(volunteer)}</td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(volunteer.criado_em)}</td>
                  <td className="px-5 py-4"><StatusBadge>{statusLabel(volunteer.status)}</StatusBadge></td>
                  <td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => setSelectedVolunteer(volunteer)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Visualizar"><Eye className="h-4 w-4" /></button><button type="button" onClick={() => openEditor(volunteer)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Editar"><Edit3 className="h-4 w-4" /></button>{volunteer.status === 'pendente' || volunteer.status === 'rejeitado' || (volunteer.status === 'aprovado' && !volunteer.tem_senha) ? <button type="button" onClick={() => setApprovalVolunteer(volunteer)} className="rounded-md p-2 text-emerald-600 hover:bg-emerald-50" aria-label="Aprovar"><CheckCircle2 className="h-4 w-4" /></button> : null}{volunteer.status === 'pendente' ? <button type="button" onClick={() => setRejectionVolunteer(volunteer)} className="rounded-md p-2 text-rose-600 hover:bg-rose-50" aria-label="Rejeitar"><XCircle className="h-4 w-4" /></button> : null}{volunteer.status === 'aprovado' ? <button type="button" onClick={() => setSuspensionVolunteer(volunteer)} className="rounded-md p-2 text-amber-600 hover:bg-amber-50" aria-label="Suspender"><AlertTriangle className="h-4 w-4" /></button> : null}{volunteer.status === 'suspenso' || volunteer.status === 'inativo' ? <button type="button" onClick={() => setReactivationVolunteer(volunteer)} className="rounded-md p-2 text-emerald-600 hover:bg-emerald-50" aria-label="Reativar"><RotateCcw className="h-4 w-4" /></button> : null}<button type="button" onClick={() => setDeleteVolunteer(volunteer)} className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600" aria-label="Excluir"><Trash2 className="h-4 w-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isLoading ? <div className="px-5 py-12 text-center text-sm font-medium text-slate-500">Carregando voluntários...</div> : null}
        {!isLoading && visibleVolunteers.length === 0 ? <div className="flex flex-col items-center justify-center px-5 py-12 text-center text-slate-500"><Search className="mb-3 h-8 w-8 text-slate-300" />Nenhum voluntário encontrado.</div> : null}

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

      <Dialog open={Boolean(selectedVolunteer)} onOpenChange={(open) => !open && setSelectedVolunteer(null)}><DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-2xl">{selectedVolunteer ? <><DialogHeader><DialogTitle>{selectedVolunteer.nome}</DialogTitle><DialogDescription>{selectedVolunteer.email} · {selectedVolunteer.telefone || 'Sem telefone'}</DialogDescription></DialogHeader><div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2"><p><span className="text-slate-500">Cidade:</span> {volunteerCity(selectedVolunteer)}</p><p><span className="text-slate-500">Áreas:</span> {volunteerAreas(selectedVolunteer)}</p><p><span className="text-slate-500">Cadastro:</span> {formatDate(selectedVolunteer.criado_em)}</p><p><span className="text-slate-500">Status:</span> {statusLabel(selectedVolunteer.status)}</p><p><span className="text-slate-500">Ativação:</span> {selectedVolunteer.tem_senha ? 'Conta ativada' : 'Pendente'}</p><p><span className="text-slate-500">Último login:</span> {formatDate(selectedVolunteer.ultimo_login)}</p><p className="whitespace-pre-line sm:col-span-2"><span className="text-slate-500">Observação:</span> {mainObservation(selectedVolunteer.mensagem) || 'Sem observação informada.'}</p>{selectedVolunteer.motivo_rejeicao ? <p className="sm:col-span-2"><span className="text-slate-500">Motivo da rejeição:</span> {selectedVolunteer.motivo_rejeicao}</p> : null}</div></> : null}</DialogContent></Dialog>

      <Dialog open={isEditorOpen} onOpenChange={(open) => { setIsEditorOpen(open); if (!open) setEditorVolunteer(null); }}><DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-2xl"><DialogHeader><DialogTitle>{editorVolunteer ? 'Editar voluntário' : 'Cadastrar voluntário manualmente'}</DialogTitle><DialogDescription>{editorVolunteer ? 'Atualize os dados básicos e áreas de interesse.' : 'Cadastre alguém diretamente pelo painel administrativo.'}</DialogDescription></DialogHeader><form onSubmit={submitEditor} className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">Nome<input required value={formState.nome} onChange={(event) => setFormState((current) => ({ ...current, nome: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label><label className="space-y-2 text-sm font-medium text-slate-700">E-mail<input required type="email" value={formState.email} onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label><label className="space-y-2 text-sm font-medium text-slate-700">Telefone<input value={formState.telefone} onChange={(event) => setFormState((current) => ({ ...current, telefone: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label><label className="space-y-2 text-sm font-medium text-slate-700">Cidade<input value={formState.cidade} onChange={(event) => setFormState((current) => ({ ...current, cidade: event.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label>{!editorVolunteer ? <label className="space-y-2 text-sm font-medium text-slate-700">Status inicial<select value={formState.status} onChange={(event) => setFormState((current) => ({ ...current, status: event.target.value as 'pendente' | 'aprovado' }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"><option value="aprovado">Aprovado e gerar convite</option><option value="pendente">Pendente</option></select></label> : <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">Status atual: <strong>{statusLabel(editorVolunteer.status)}</strong><br />Use as ações da tabela para aprovar, rejeitar, suspender ou reativar.</div>}<label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">Áreas de interesse<select defaultValue="" onChange={(event) => { const areaId = Number(event.target.value); if (areaId) toggleArea(areaId); event.target.value = ''; }} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"><option value="" disabled>Adicionar área</option>{interestAreas.filter((area) => !formState.areas_interesse.includes(area.id)).map((area) => <option key={area.id} value={area.id}>{area.nome}</option>)}</select>{selectedAreaItems.length ? <div className="flex flex-wrap gap-2">{selectedAreaItems.map((area) => <button key={area.id} type="button" onClick={() => toggleArea(area.id)} className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">{area.nome} ×</button>)}</div> : null}</label><label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">Observação<textarea value={formState.mensagem} onChange={(event) => setFormState((current) => ({ ...current, mensagem: event.target.value }))} rows={4} className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /></label><DialogFooter className="sm:col-span-2"><button type="button" disabled={isActionLoading} onClick={() => setIsEditorOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="submit" disabled={isActionLoading} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-70">{isActionLoading ? 'Salvando...' : 'Salvar'}</button></DialogFooter></form></DialogContent></Dialog>

      <Dialog open={Boolean(approvalVolunteer)} onOpenChange={(open) => !open && setApprovalVolunteer(null)}><DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-md"><DialogHeader><DialogTitle>Aprovar voluntário</DialogTitle><DialogDescription>Ao aprovar, o sistema gera convite de acesso ao portal e registra o e-mail na fila.</DialogDescription></DialogHeader><p className="text-sm text-slate-700">Aprovar cadastro de {approvalVolunteer?.nome}?</p><DialogFooter><button type="button" disabled={isActionLoading} onClick={() => setApprovalVolunteer(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="button" disabled={isActionLoading} onClick={() => approvalVolunteer && void runAction(() => approveAdminVolunteer(approvalVolunteer.id), () => setApprovalVolunteer(null))} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-70">{isActionLoading ? 'Aprovando...' : 'Aprovar e gerar convite'}</button></DialogFooter></DialogContent></Dialog>
      <Dialog open={Boolean(rejectionVolunteer)} onOpenChange={(open) => { if (!open) { setRejectionVolunteer(null); setRejectionReason(''); } }}><DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-md"><DialogHeader><DialogTitle>Rejeitar cadastro</DialogTitle><DialogDescription>Informe um motivo interno para manter histórico administrativo.</DialogDescription></DialogHeader><textarea rows={4} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Motivo da rejeição" className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /><DialogFooter><button type="button" disabled={isActionLoading} onClick={() => { setRejectionVolunteer(null); setRejectionReason(''); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="button" disabled={isActionLoading} onClick={() => rejectionVolunteer && void runAction(() => rejectAdminVolunteer(rejectionVolunteer.id, rejectionReason.trim()), () => { setRejectionVolunteer(null); setRejectionReason(''); })} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-70">{isActionLoading ? 'Rejeitando...' : 'Rejeitar'}</button></DialogFooter></DialogContent></Dialog>
      <Dialog open={Boolean(suspensionVolunteer)} onOpenChange={(open) => { if (!open) { setSuspensionVolunteer(null); setSuspensionReason(''); } }}><DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-md"><DialogHeader><DialogTitle>Suspender voluntário</DialogTitle><DialogDescription>A suspensão bloqueia o acesso ao portal para este voluntário.</DialogDescription></DialogHeader><textarea rows={4} value={suspensionReason} onChange={(event) => setSuspensionReason(event.target.value)} placeholder="Motivo da suspensão" className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-600" /><DialogFooter><button type="button" disabled={isActionLoading} onClick={() => { setSuspensionVolunteer(null); setSuspensionReason(''); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="button" disabled={isActionLoading} onClick={() => suspensionVolunteer && void runAction(() => suspendAdminVolunteer(suspensionVolunteer.id, suspensionReason.trim()), () => { setSuspensionVolunteer(null); setSuspensionReason(''); })} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-70">{isActionLoading ? 'Suspendendo...' : 'Suspender'}</button></DialogFooter></DialogContent></Dialog>
      <Dialog open={Boolean(reactivationVolunteer)} onOpenChange={(open) => !open && setReactivationVolunteer(null)}><DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-md"><DialogHeader><DialogTitle>Reativar voluntário</DialogTitle><DialogDescription>O voluntário voltará para aprovado. Se ainda não tiver senha, um novo convite será gerado.</DialogDescription></DialogHeader><p className="text-sm text-slate-700">Reativar {reactivationVolunteer?.nome}?</p><DialogFooter><button type="button" disabled={isActionLoading} onClick={() => setReactivationVolunteer(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="button" disabled={isActionLoading} onClick={() => reactivationVolunteer && void runAction(() => reactivateAdminVolunteer(reactivationVolunteer.id), () => setReactivationVolunteer(null))} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-70">{isActionLoading ? 'Reativando...' : 'Reativar'}</button></DialogFooter></DialogContent></Dialog>
      <Dialog open={Boolean(deleteVolunteer)} onOpenChange={(open) => !open && setDeleteVolunteer(null)}><DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-md"><DialogHeader><DialogTitle>Excluir voluntário</DialogTitle><DialogDescription>Esta ação remove definitivamente o cadastro e dados vinculados ao voluntário.</DialogDescription></DialogHeader><p className="text-sm text-slate-700">Excluir definitivamente {deleteVolunteer?.nome}? Esta ação não pode ser desfeita.</p><DialogFooter><button type="button" disabled={isActionLoading} onClick={() => setDeleteVolunteer(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70">Cancelar</button><button type="button" disabled={isActionLoading} onClick={() => deleteVolunteer && void runAction(() => deleteAdminVolunteer(deleteVolunteer.id), () => setDeleteVolunteer(null))} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-70">{isActionLoading ? 'Excluindo...' : 'Excluir definitivamente'}</button></DialogFooter></DialogContent></Dialog>
    </section>
  );
}
