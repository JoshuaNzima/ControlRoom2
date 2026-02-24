import React from 'react';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import ZoneCommanderLayout from '@/Layouts/ZoneCommanderLayout';
import Modal from '@/Components/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import IconMapper from '@/Components/IconMapper';

type DownRecord = {
	id: number;
	type: 'guard_absent' | 'site_unmanned' | 'other';
	status: 'open' | 'escalated' | 'resolved';
	title: string;
	description?: string;
	escalation_level: number;
	created_at: string;
	client_site_id: number | null;
	guard_id: number | null;
	client_site?: { id: number; name: string; client_name: string } | null;
	guard?: { id: number; name: string; employee_id: string } | null;
};

type Guard = {
	id: number;
	name: string;
	employee_id: string;
	site_id: number | null;
	site_name: string;
	client_name: string;
};

type SiteResult = { id: number; name: string; client_name: string };

export default function Downs({ downs = [], guards = [] }: { downs: DownRecord[]; guards: Guard[] }) {
	const [reportOpen, setReportOpen] = React.useState(false);
	const [coverOpen, setCoverOpen] = React.useState(false);
	const [selectedDown, setSelectedDown] = React.useState<DownRecord | null>(null);

	const [type, setType] = React.useState<DownRecord['type']>('guard_absent');
	const [title, setTitle] = React.useState('');
	const [description, setDescription] = React.useState('');

	const [siteSearch, setSiteSearch] = React.useState('');
	const [siteResults, setSiteResults] = React.useState<SiteResult[]>([]);
	const [loadingSites, setLoadingSites] = React.useState(false);
	const [selectedSiteId, setSelectedSiteId] = React.useState<number | null>(null);
	const [selectedSiteLabel, setSelectedSiteLabel] = React.useState('');

	const [guardSearch, setGuardSearch] = React.useState('');
	const [selectedGuardId, setSelectedGuardId] = React.useState<number | null>(null);
	const [selectedGuardLabel, setSelectedGuardLabel] = React.useState('');

	const [coverSearch, setCoverSearch] = React.useState('');
	const [coverGuardId, setCoverGuardId] = React.useState<number | null>(null);

	const counts = React.useMemo(() => {
		const open = downs.filter((d) => d.status === 'open').length;
		const escalated = downs.filter((d) => d.status === 'escalated').length;
		const resolved = downs.filter((d) => d.status === 'resolved').length;
		return { open, escalated, resolved };
	}, [downs]);

	const statusBadge = (status: DownRecord['status']) => {
		if (status === 'resolved') return <Badge variant="success">Resolved</Badge>;
		if (status === 'escalated') return <Badge variant="destructive">Escalated</Badge>;
		return <Badge variant="warning">Open</Badge>;
	};

	const typeBadge = (t: DownRecord['type']) => {
		if (t === 'guard_absent') return <Badge variant="destructive">Guard Absent</Badge>;
		if (t === 'site_unmanned') return <Badge variant="warning">Site Unmanned</Badge>;
		return <Badge variant="outline">Other</Badge>;
	};

	const filteredGuards = React.useMemo(() => {
		const q = guardSearch.trim().toLowerCase();
		if (!q) return guards;
		return guards.filter((g) => {
			return (
				g.name.toLowerCase().includes(q) ||
				g.employee_id.toLowerCase().includes(q) ||
				g.site_name.toLowerCase().includes(q) ||
				g.client_name.toLowerCase().includes(q)
			);
		});
	}, [guards, guardSearch]);

	const filteredCoverGuards = React.useMemo(() => {
		const q = coverSearch.trim().toLowerCase();
		if (!q) return guards;
		return guards.filter((g) => {
			return (
				g.name.toLowerCase().includes(q) ||
				g.employee_id.toLowerCase().includes(q) ||
				g.site_name.toLowerCase().includes(q) ||
				g.client_name.toLowerCase().includes(q)
			);
		});
	}, [guards, coverSearch]);

	const resetReport = () => {
		setType('guard_absent');
		setTitle('');
		setDescription('');
		setSiteSearch('');
		setSiteResults([]);
		setLoadingSites(false);
		setSelectedSiteId(null);
		setSelectedSiteLabel('');
		setGuardSearch('');
		setSelectedGuardId(null);
		setSelectedGuardLabel('');
	};

	const loadSites = React.useCallback(async () => {
		try {
			setLoadingSites(true);
			const params = new URLSearchParams();
			if (siteSearch) params.set('search', siteSearch);
			const qs = params.toString();
			const url = qs ? `${route('zone.sites.json')}?${qs}` : route('zone.sites.json');
			const res = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
			if (!res.ok) {
				setSiteResults([]);
				return;
			}
			const json = await res.json();
			setSiteResults(Array.isArray(json) ? json : []);
		} catch {
			setSiteResults([]);
		} finally {
			setLoadingSites(false);
		}
	}, [siteSearch]);

	const canSubmitReport = !!selectedSiteId && (type !== 'guard_absent' || !!selectedGuardId);

	const submitReport = () => {
		if (!canSubmitReport) return;
		router.post(
			route('zone.downs.store'),
			{
				client_site_id: selectedSiteId,
				type,
				guard_id: type === 'guard_absent' ? selectedGuardId : null,
				title: title || undefined,
				description: description || undefined,
			},
			{
				preserveScroll: true,
				onSuccess: () => {
					setReportOpen(false);
					resetReport();
					router.reload();
				},
			}
		);
	};

	const escalate = (id: number) => {
		router.post(route('zone.downs.escalate', id), {}, { preserveScroll: true, onSuccess: () => router.reload() });
	};

	const resolve = (id: number) => {
		router.post(route('zone.downs.resolve', id), {}, { preserveScroll: true, onSuccess: () => router.reload() });
	};

	const openCover = (down: DownRecord) => {
		setSelectedDown(down);
		setCoverSearch('');
		setCoverGuardId(null);
		setCoverOpen(true);
	};

	const deployCover = () => {
		if (!selectedDown?.client_site_id || !coverGuardId) return;
		router.post(
			route('zone.guards.assign-site'),
			{ guard_id: coverGuardId, client_site_id: selectedDown.client_site_id },
			{
				preserveScroll: true,
				onSuccess: () => {
					setCoverOpen(false);
					setSelectedDown(null);
					router.reload();
				},
			}
		);
	};

	return (
		<ZoneCommanderLayout title="Downs">
			<Head title="Downs" />

			<div className="w-full min-h-screen p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
				<div className="flex items-start justify-between gap-3">
					<div>
						<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Coverage Downs</h2>
						<p className="text-sm text-gray-600 dark:text-gray-300">Absences and site coverage issues in your zone.</p>
					</div>
					<Button
						onClick={() => {
							setReportOpen(true);
						}}
						className="shrink-0"
					>
						<IconMapper name="AlertTriangle" className="w-4 h-4 mr-2" />
						Report Down
					</Button>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<Card>
						<CardContent className="p-4 flex items-center justify-between">
							<div>
								<div className="text-xs text-gray-500 dark:text-gray-400">Open</div>
								<div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{counts.open}</div>
							</div>
							<div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
								<IconMapper name="AlertTriangle" className="w-5 h-5 text-yellow-700 dark:text-yellow-200" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4 flex items-center justify-between">
							<div>
								<div className="text-xs text-gray-500 dark:text-gray-400">Escalated</div>
								<div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{counts.escalated}</div>
							</div>
							<div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
								<IconMapper name="Siren" className="w-5 h-5 text-red-700 dark:text-red-200" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4 flex items-center justify-between">
							<div>
								<div className="text-xs text-gray-500 dark:text-gray-400">Resolved</div>
								<div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{counts.resolved}</div>
							</div>
							<div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
								<IconMapper name="CheckCircle" className="w-5 h-5 text-green-700 dark:text-green-200" />
							</div>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<IconMapper name="AlertTriangle" className="w-5 h-5" />
							Downs
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<div className="divide-y divide-gray-100 dark:divide-gray-800">
							{downs.map((d) => {
								const siteLabel = d.client_site ? `${d.client_site.client_name} • ${d.client_site.name}` : '';
								const guardLabel = d.guard ? `${d.guard.name}${d.guard.employee_id ? ' • ' + d.guard.employee_id : ''}` : '';
								const created = d.created_at ? format(new Date(d.created_at), 'MMM d, HH:mm') : '';

								return (
									<div key={d.id} className="p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
										<div className="min-w-0">
											<div className="flex flex-wrap items-center gap-2">
												<div className="font-medium text-gray-900 dark:text-gray-100 break-words">{d.title}</div>
												{typeBadge(d.type)}
												{statusBadge(d.status)}
												{d.escalation_level > 0 && <Badge variant="secondary">Level {d.escalation_level}</Badge>}
											</div>
											{siteLabel && <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{siteLabel}</div>}
											{guardLabel && <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">Guard: {guardLabel}</div>}
											{d.description && <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{d.description}</div>}
											{created && <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{created}</div>}
										</div>

										<div className="flex flex-wrap gap-2 sm:justify-end">
											{d.status !== 'resolved' && (
												<Button variant="outline" size="sm" onClick={() => openCover(d)}>
													<IconMapper name="Users" className="w-4 h-4 mr-2" />
													Deploy Cover
												</Button>
											)}
											{d.status !== 'resolved' && (
												<Button variant="outline" size="sm" onClick={() => escalate(d.id)}>
													<IconMapper name="Siren" className="w-4 h-4 mr-2" />
													Escalate
												</Button>
											)}
											{d.status !== 'resolved' && (
												<Button variant="default" size="sm" onClick={() => resolve(d.id)}>
													<IconMapper name="CheckCircle" className="w-4 h-4 mr-2" />
													Resolve
												</Button>
											)}
										</div>
									</div>
								);
							})}

							{downs.length === 0 && (
								<div className="p-8 text-center">
									<div className="text-sm text-gray-600 dark:text-gray-300">No downs in your zone.</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			<Modal
				show={reportOpen}
				onClose={() => {
					setReportOpen(false);
					resetReport();
				}}
				maxWidth="xl"
			>
				<div className="p-4 sm:p-6 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
					<div className="flex items-start justify-between gap-3">
						<div>
							<h3 className="text-lg font-semibold">Report Down</h3>
							<p className="text-sm text-gray-600 dark:text-gray-300">Log an issue and notify coverage action.</p>
						</div>
						<Button variant="outline" size="sm" onClick={() => { setReportOpen(false); resetReport(); }}>
							Close
						</Button>
					</div>

					<div className="mt-4 space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
							<select
								value={type}
								onChange={(e) => {
									const v = e.target.value as DownRecord['type'];
									setType(v);
									if (v !== 'guard_absent') {
										setSelectedGuardId(null);
										setSelectedGuardLabel('');
									}
								}}
								className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm shadow-black/5 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:border-transparent dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:shadow-none"
							>
								<option value="guard_absent">Guard absent</option>
								<option value="site_unmanned">Site unmanned</option>
								<option value="other">Other</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Site</label>
							<div className="mt-1 flex gap-2">
								<Input
									value={siteSearch}
									onChange={(e) => setSiteSearch(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											loadSites();
										}
									}}
									placeholder="Search site or client name"
								/>
								<Button variant="outline" onClick={loadSites} disabled={loadingSites}>
									{loadingSites ? 'Loading…' : 'Search'}
								</Button>
							</div>
							{selectedSiteLabel && <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Selected: <span className="text-gray-800 dark:text-gray-200 font-medium">{selectedSiteLabel}</span></div>}
							<div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800">
								{siteResults.length === 0 ? (
									<div className="p-3 text-sm text-gray-600 dark:text-gray-300">{loadingSites ? 'Searching…' : 'No results'}</div>
								) : (
									<ul className="divide-y divide-gray-100 dark:divide-gray-800">
										{siteResults.map((s) => (
											<li key={s.id}>
												<button
													type="button"
													onClick={() => {
														setSelectedSiteId(s.id);
														setSelectedSiteLabel(`${s.client_name} • ${s.name}`);
													}}
													className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900"
												>
													<div className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.client_name}</div>
													<div className="text-xs text-gray-600 dark:text-gray-300">{s.name}</div>
												</button>
											</li>
										))}
									</ul>
								)}
							</div>
						</div>

						{type === 'guard_absent' && (
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Absent Guard</label>
								<div className="mt-1">
									<Input
										value={guardSearch}
										onChange={(e) => setGuardSearch(e.target.value)}
										placeholder="Search guard name, employee ID, site"
									/>
								</div>
								{selectedGuardLabel && <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Selected: <span className="text-gray-800 dark:text-gray-200 font-medium">{selectedGuardLabel}</span></div>}
								<div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800">
									{filteredGuards.length === 0 ? (
										<div className="p-3 text-sm text-gray-600 dark:text-gray-300">No guards found</div>
									) : (
										<ul className="divide-y divide-gray-100 dark:divide-gray-800">
											{filteredGuards.slice(0, 150).map((g) => (
												<li key={g.id}>
													<button
														type="button"
														onClick={() => {
														setSelectedGuardId(g.id);
														setSelectedGuardLabel(`${g.name}${g.employee_id ? ' • ' + g.employee_id : ''}`);
													}}
													className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900"
												>
													<div className="text-sm font-medium text-gray-900 dark:text-gray-100">{g.name}</div>
													<div className="text-xs text-gray-600 dark:text-gray-300">{g.client_name} • {g.site_name}{g.employee_id ? ` • ${g.employee_id}` : ''}</div>
												</button>
												</li>
											))}
										</ul>
									)}
								</div>
							</div>
						)}

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title (optional)</label>
							<Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Auto-generated if empty" className="mt-1" />
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (optional)</label>
							<textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={3}
								className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm shadow-black/5 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:border-transparent dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:placeholder-gray-500 dark:shadow-none"
								placeholder="Add context (e.g. no show, phone unreachable, etc.)"
							/>
						</div>

						<div className="pt-2 flex items-center justify-end gap-2">
							<Button variant="outline" onClick={() => { setReportOpen(false); resetReport(); }}>Cancel</Button>
							<Button onClick={submitReport} disabled={!canSubmitReport}>Report Down</Button>
						</div>
					</div>
				</div>
			</Modal>

			<Modal
				show={coverOpen}
				onClose={() => {
					setCoverOpen(false);
					setSelectedDown(null);
					setCoverSearch('');
					setCoverGuardId(null);
				}}
				maxWidth="xl"
			>
				<div className="p-4 sm:p-6 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
					<div className="flex items-start justify-between gap-3">
						<div>
							<h3 className="text-lg font-semibold">Deploy Coverage</h3>
							<p className="text-sm text-gray-600 dark:text-gray-300">Deploy a different guard to cover the downed site.</p>
						</div>
						<Button variant="outline" size="sm" onClick={() => { setCoverOpen(false); setSelectedDown(null); setCoverSearch(''); setCoverGuardId(null); }}>Close</Button>
					</div>

					<div className="mt-4 space-y-4">
						{selectedDown?.client_site && (
							<div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
								<div className="text-sm font-medium text-gray-900 dark:text-gray-100">Target Site</div>
								<div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{selectedDown.client_site.client_name} • {selectedDown.client_site.name}</div>
								{selectedDown.guard && <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Absent: {selectedDown.guard.name}{selectedDown.guard.employee_id ? ` • ${selectedDown.guard.employee_id}` : ''}</div>}
							</div>
						)}

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cover Guard</label>
							<Input value={coverSearch} onChange={(e) => setCoverSearch(e.target.value)} placeholder="Search guard" className="mt-1" />
							<div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800">
								{filteredCoverGuards.length === 0 ? (
									<div className="p-3 text-sm text-gray-600 dark:text-gray-300">No guards found</div>
								) : (
									<ul className="divide-y divide-gray-100 dark:divide-gray-800">
										{filteredCoverGuards
											.filter((g) => (selectedDown?.guard_id ? g.id !== selectedDown.guard_id : true))
											.slice(0, 200)
											.map((g) => (
												<li key={g.id}>
													<button
														type="button"
														onClick={() => setCoverGuardId(g.id)}
													className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 ${coverGuardId === g.id ? 'bg-coin-50 dark:bg-gray-900/60' : ''}`}
												>
													<div className="text-sm font-medium text-gray-900 dark:text-gray-100">{g.name}</div>
													<div className="text-xs text-gray-600 dark:text-gray-300">{g.client_name} • {g.site_name}{g.employee_id ? ` • ${g.employee_id}` : ''}</div>
												</button>
											</li>
										))}
									</ul>
								)}
							</div>
						</div>

						<div className="pt-2 flex items-center justify-end gap-2">
							<Button variant="outline" onClick={() => { setCoverOpen(false); setSelectedDown(null); setCoverSearch(''); setCoverGuardId(null); }}>Cancel</Button>
							<Button onClick={deployCover} disabled={!selectedDown?.client_site_id || !coverGuardId}>Deploy</Button>
						</div>
					</div>
				</div>
			</Modal>
		</ZoneCommanderLayout>
	);
}


