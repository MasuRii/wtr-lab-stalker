(function () {
  'use strict';

  type FetchInput = Parameters<typeof window.fetch>[0];
  type FetchInit = Parameters<typeof window.fetch>[1];
  type UserSource = 'user-search' | 'leaderboard';

  interface RawUser {
    id?: unknown;
    user_name?: unknown;
    username?: unknown;
    name?: unknown;
    label?: unknown;
    member_status?: unknown;
    member?: unknown;
    role?: unknown;
    rank?: unknown;
    view?: unknown;
    exp?: unknown;
    review_count?: unknown;
    ticket_count?: unknown;
    giveaway_wins?: unknown;
  }

  interface NormalizedUser {
    id: string;
    name: string;
    member: string;
    role: number | null;
    source: UserSource;
    rank: number | null;
    view: unknown;
    exp: unknown;
    reviewCount: unknown;
    ticketCount: unknown;
    giveawayWins: unknown;
  }

  interface UserSearchPayload {
    success?: boolean;
    message?: string;
    data?: RawUser[];
  }

  interface LeaderboardPageProps {
    base_rank?: unknown;
    users?: RawUser[];
  }

  interface LeaderboardPayload {
    pageProps?: LeaderboardPageProps;
  }

  interface FallbackCache {
    createdAt?: unknown;
    users?: NormalizedUser[];
  }

  interface CurrentSearchState {
    query: string;
    apiUsers: NormalizedUser[];
    fallbackUsers: NormalizedUser[];
    nextFallbackPage: number;
    exhausted: boolean;
    loadingMore: boolean;
  }

  interface RenderOptions {
    showLoadMore?: boolean;
    loading?: boolean;
  }

  interface UserSearchError extends Error {
    code?: 'UNAUTHORIZED';
  }

  interface MountObserver extends MutationObserver {
    mountTimer?: number;
  }

  interface NextDataWindow extends Window {
    __NEXT_DATA__?: { buildId?: unknown };
  }

  const SCRIPT_ID = 'wtr-lab-stalker';
  const LEGACY_SCRIPT_ID = 'wtr-user-finder';
  const STYLE_ID = `${SCRIPT_ID}-style`;
  const ACTIVE_CLASS = `${SCRIPT_ID}-mode`;
  const LEGACY_ACTIVE_CLASS = 'wtr-user-stalker-mode';
  const MOBILE_SEARCH_CLASS = `${SCRIPT_ID}-mobile-search`;
  const LEGACY_MOBILE_SEARCH_CLASS = `${LEGACY_SCRIPT_ID}-mobile-search`;
  const INPUT_BOUND_DATA_KEY = 'wtrLabStalkerBound';
  const LEGACY_INPUT_BOUND_DATA_KEY = 'wtrUserFinderBound';
  const LOGO_BOUND_DATA_KEY = 'wtrLabStalkerLogoBound';
  const LEGACY_LOGO_BOUND_DATA_KEY = 'wtrUserFinderLogoBound';
  const MIN_QUERY_LENGTH = 2;
  const SEARCH_LIMIT = 10;
  const FALLBACK_PAGES_PER_SORT = 2;
  const LOAD_MORE_PAGES_PER_SORT = 2;
  const MAX_FALLBACK_PAGE = 50;
  const FALLBACK_SORTS = ['view', 'review_count', 'exp', 'ticket_count', 'giveaway_wins'];
  const FALLBACK_CACHE_TTL_MS = 15 * 60 * 1000;

  function getErrorMessage(error: unknown, fallbackMessage: string): string {
    return error instanceof Error ? error.message : fallbackMessage;
  }

  function isUnauthorizedError(error: unknown): error is UserSearchError {
    return error instanceof Error && (error as UserSearchError).code === 'UNAUTHORIZED';
  }

  let activeRequestId = 0;
  let activeMode = false;
  let lastQuery = '';
  let debounceTimer = 0;
  let fallbackIndexPromise: Promise<NormalizedUser[]> | null = null;
  let mountedInput: HTMLInputElement | null = null;
  let mountedForm: HTMLFormElement | null = null;
  let mountedMenu: HTMLElement | null = null;
  let originalPlaceholder = '';
  let nativeSearchGuardInstalled = false;
  let currentSearchState: CurrentSearchState | null = null;
  const leaderboardPageCache = new Map<string, Promise<NormalizedUser[]>>();

  function getRequestUrl(input: FetchInput): string {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.href;
    if (input && typeof input === 'object' && 'url' in input && typeof input.url === 'string') return input.url;
    return String(input || '');
  }

  function getRequestMethod(input: FetchInput, init: FetchInit): string {
    if (init?.method) return String(init.method).toUpperCase();
    if (input && typeof input === 'object' && 'method' in input && input.method) return String(input.method).toUpperCase();
    return 'GET';
  }

  function isNativeNovelSearchRequest(input: FetchInput, init?: FetchInit): boolean {
    if (!activeMode) return false;

    const url = getRequestUrl(input);
    const method = getRequestMethod(input, init);

    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.origin === window.location.origin && parsed.pathname === '/api/search' && method === 'POST';
    } catch (_) {
      return url === '/api/search' && method === 'POST';
    }
  }

  function emptyNovelSearchResponse(): Response {
    return new Response(JSON.stringify({ success: true, data: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  function installNativeSearchGuard(): void {
    if (nativeSearchGuardInstalled || typeof window.fetch !== 'function') return;

    nativeSearchGuardInstalled = true;
    const nativeFetch = window.fetch.bind(window);

    window.fetch = function guardedFetch(input: FetchInput, init?: FetchInit): Promise<Response> {
      if (isNativeNovelSearchRequest(input, init)) {
        return Promise.resolve(emptyNovelSearchResponse());
      }

      return nativeFetch(input, init);
    };
  }

  function injectStyle(): void {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes wtrStalkerIgnite {
        0% { transform: scale(1); filter: none; }
        18% { transform: scale(.94) rotate(-2deg); filter: drop-shadow(0 0 0 rgba(177, 18, 38, 0)); }
        46% { transform: scale(1.08) rotate(2deg); filter: drop-shadow(0 0 10px rgba(177, 18, 38, .9)); }
        72% { transform: scale(.99); filter: drop-shadow(0 0 4px rgba(177, 18, 38, .65)); }
        100% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(177, 18, 38, .45)); }
      }

      @keyframes wtrStalkerScan {
        0% { opacity: 0; transform: translateX(-24px); }
        20% { opacity: .8; }
        100% { opacity: 0; transform: translateX(260px); }
      }

      nav .navbar-brand svg {
        cursor: crosshair;
      }

      body.${ACTIVE_CLASS} nav .navbar-brand svg {
        animation: wtrStalkerIgnite 760ms ease both;
      }

      body.${ACTIVE_CLASS} nav .navbar-brand svg,
      body.${ACTIVE_CLASS} nav .navbar-brand svg path {
        fill: #b11226 !important;
      }

      nav .search-input {
        position: relative;
      }

      body.${ACTIVE_CLASS} nav .search-input::after {
        content: "";
        position: absolute;
        left: 8px;
        top: 6px;
        width: 34px;
        height: calc(100% - 12px);
        pointer-events: none;
        background: linear-gradient(90deg, transparent, rgba(177, 18, 38, .18), transparent);
        animation: wtrStalkerScan 1.5s ease-in-out infinite;
      }

      body.${ACTIVE_CLASS} nav .search-input .form-control {
        border-color: #b11226 !important;
        box-shadow: 0 0 0 .16rem rgba(177, 18, 38, .22) !important;
      }

      body.${ACTIVE_CLASS} nav .search-input .icon,
      body.${ACTIVE_CLASS} nav .search-input use {
        color: #b11226;
        fill: #b11226 !important;
      }

      body.${ACTIVE_CLASS} nav .search-bar > .search-result {
        display: none !important;
      }

      body.${ACTIVE_CLASS} nav .${MOBILE_SEARCH_CLASS},
      body.${LEGACY_ACTIVE_CLASS} nav .${LEGACY_MOBILE_SEARCH_CLASS} {
        border-color: #b11226 !important;
        color: #b11226 !important;
      }

      body.${ACTIVE_CLASS} nav .${MOBILE_SEARCH_CLASS} svg,
      body.${ACTIVE_CLASS} nav .${MOBILE_SEARCH_CLASS} use,
      body.${LEGACY_ACTIVE_CLASS} nav .${LEGACY_MOBILE_SEARCH_CLASS} svg,
      body.${LEGACY_ACTIVE_CLASS} nav .${LEGACY_MOBILE_SEARCH_CLASS} use {
        color: #b11226 !important;
        fill: #b11226 !important;
      }

      @media (max-width: 991.98px) {
        body.${ACTIVE_CLASS} .${SCRIPT_ID}-menu {
          left: .5rem !important;
          right: .5rem !important;
          width: auto;
        }
      }

      .${SCRIPT_ID}-menu {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        right: 0;
        z-index: 1100;
        display: none;
        overflow: hidden;
        background: var(--bs-body-bg, #fff);
        border: 1px solid rgba(177, 18, 38, .35);
        border-radius: .375rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, .16);
      }

      body.${ACTIVE_CLASS} .${SCRIPT_ID}-menu.is-open,
      body.${LEGACY_ACTIVE_CLASS} .${LEGACY_SCRIPT_ID}-menu.is-open {
        display: block;
      }

      .${SCRIPT_ID}-menu-list {
        max-height: min(420px, calc(100vh - 120px));
        overflow-y: auto;
      }

      .${SCRIPT_ID}-status,
      .${SCRIPT_ID}-result,
      .${SCRIPT_ID}-load-more {
        display: block;
        padding: .5rem .65rem;
        font-size: .875rem;
      }

      .${SCRIPT_ID}-status {
        color: #6c757d;
      }

      .${SCRIPT_ID}-load-more {
        width: 100%;
        border: 0;
        border-top: 1px solid rgba(0, 0, 0, .075);
        background: transparent;
        color: #b11226;
        text-align: left;
        font-weight: 600;
      }

      .${SCRIPT_ID}-load-more:hover,
      .${SCRIPT_ID}-load-more:focus {
        background: rgba(177, 18, 38, .08);
        outline: none;
      }

      .${SCRIPT_ID}-load-more:disabled {
        color: #6c757d;
        cursor: wait;
      }

      .${SCRIPT_ID}-result {
        color: inherit;
        text-decoration: none;
        border-top: 1px solid rgba(0, 0, 0, .075);
      }

      .${SCRIPT_ID}-result:first-child {
        border-top: 0;
      }

      .${SCRIPT_ID}-result:hover,
      .${SCRIPT_ID}-result:focus {
        background: rgba(177, 18, 38, .08);
        outline: none;
      }

      .${SCRIPT_ID}-name {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 600;
      }

      .${SCRIPT_ID}-meta {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-top: .125rem;
        color: #6c757d;
        font-size: .75rem;
      }

      [data-bs-theme="dark"] .${SCRIPT_ID}-menu {
        background: var(--bs-dark, #212529);
        border-color: rgba(177, 18, 38, .55);
        box-shadow: 0 2px 8px rgba(0, 0, 0, .4);
      }

      [data-bs-theme="dark"] .${SCRIPT_ID}-result,
      [data-bs-theme="dark"] .${SCRIPT_ID}-load-more {
        border-top-color: rgba(255, 255, 255, .1);
      }

      [data-bs-theme="dark"] .${SCRIPT_ID}-result:hover,
      [data-bs-theme="dark"] .${SCRIPT_ID}-result:focus {
        background: rgba(177, 18, 38, .2);
      }
    `;
    document.head.appendChild(style);
  }

  function getLocale(): string {
    const match = window.location.pathname.match(/^\/([a-z]{2})(?:\/|$)/i);
    return match?.[1] ?? 'en';
  }

  function getBuildId(): string | null {
    const nextData = (window as NextDataWindow).__NEXT_DATA__;
    if (nextData?.buildId) {
      return String(nextData.buildId);
    }

    for (const script of document.scripts) {
      const src = script.src || '';
      const match = src.match(/\/_next\/static\/([^/]+)\/_buildManifest\.js/);
      if (match?.[1]) return match[1];
    }

    return null;
  }

  function profileHref(userId: string): string {
    return `/${getLocale()}/profile/${encodeURIComponent(userId)}`;
  }

  function cleanName(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  function fallbackUserName(userId: unknown): string {
    const prefix = String(userId || '').split('-')[0] || 'unknown';
    return `User-${prefix}`;
  }

  function normalizeUser(raw: RawUser | null | undefined, source: UserSource): NormalizedUser | null {
    if (!raw?.id) return null;

    const id = String(raw.id);
    const name = cleanName(raw.user_name) || cleanName(raw.username) || cleanName(raw.name) || cleanName(raw.label) || fallbackUserName(id);
    const member = cleanName(raw.member_status) || cleanName(raw.member) || 'free';
    const role = Number.isFinite(Number(raw.role)) ? Number(raw.role) : null;

    return {
      id,
      name,
      member,
      role,
      source,
      rank: Number.isFinite(Number(raw.rank)) ? Number(raw.rank) : null,
      view: raw.view ?? null,
      exp: raw.exp ?? null,
      reviewCount: raw.review_count ?? null,
      ticketCount: raw.ticket_count ?? null,
      giveawayWins: raw.giveaway_wins ?? null,
    };
  }

  function uniqueUsers(users: Array<NormalizedUser | null>): NormalizedUser[] {
    const seen = new Set<string>();
    const result: NormalizedUser[] = [];

    for (const user of users) {
      if (!user || seen.has(user.id)) continue;
      seen.add(user.id);
      result.push(user);
    }

    return result;
  }

  async function readJson<T>(response: Response): Promise<T | null> {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  }

  async function searchUsersApi(query: string): Promise<NormalizedUser[]> {
    const params = new URLSearchParams({ q: query, limit: String(SEARCH_LIMIT) });
    const response = await fetch(`/api/users/search?${params.toString()}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (response.status === 401) {
      throw Object.assign(new Error('User search requires a logged-in session.'), { code: 'UNAUTHORIZED' as const });
    }

    if (!response.ok) {
      throw new Error(`User search failed with HTTP ${response.status}.`);
    }

    const payload = await readJson<UserSearchPayload>(response);
    if (!payload || payload.success === false) {
      throw new Error((payload && payload.message) || 'User search failed.');
    }

    return uniqueUsers((payload.data || []).map((item) => normalizeUser(item, 'user-search')));
  }

  function fallbackCacheKey(scriptId = SCRIPT_ID): string {
    return `${scriptId}:fallback:${getLocale()}:${getBuildId() || 'unknown'}`;
  }

  function getFreshFallbackUsers(cached: FallbackCache | null): NormalizedUser[] | null {
    if (!cached || Date.now() - Number(cached.createdAt) > FALLBACK_CACHE_TTL_MS) return null;
    return cached.users || null;
  }

  function readFallbackCache(): NormalizedUser[] | null {
    try {
      const cached = JSON.parse(sessionStorage.getItem(fallbackCacheKey()) || 'null') as FallbackCache | null;
      const cachedUsers = getFreshFallbackUsers(cached);
      if (cachedUsers) return cachedUsers;

      const legacyCached = JSON.parse(sessionStorage.getItem(fallbackCacheKey(LEGACY_SCRIPT_ID)) || 'null') as FallbackCache | null;
      return getFreshFallbackUsers(legacyCached);
    } catch (_) {
      return null;
    }
  }

  function writeFallbackCache(users: NormalizedUser[]): void {
    try {
      sessionStorage.setItem(fallbackCacheKey(), JSON.stringify({ createdAt: Date.now(), users }));
    } catch (_) {
      // Session storage can be unavailable in hardened browser profiles.
    }
  }

  async function fetchLeaderboardPage(buildId: string, sort: string, page: number): Promise<NormalizedUser[]> {
    const locale = getLocale();
    const cacheKey = `${buildId}:${locale}:${sort}:${page}`;
    const cachedPage = leaderboardPageCache.get(cacheKey);
    if (cachedPage) return cachedPage;

    const pagePromise = (async () => {
      const params = new URLSearchParams({ sort, page: String(page), locale });
      const url = `/_next/data/${encodeURIComponent(buildId)}/${locale}/leaderboard.json?${params.toString()}`;
      const response = await fetch(url, {
        credentials: 'include',
        headers: { Accept: 'application/json', 'x-nextjs-data': '1' },
      });

      if (!response.ok) return [];

      const payload = await readJson<LeaderboardPayload>(response);
      const pageProps = payload && payload.pageProps;
      const baseRank = Number(pageProps && pageProps.base_rank) || 0;

      return uniqueUsers((pageProps?.users || []).map((user, index) => normalizeUser({ ...user, rank: baseRank + index + 1 }, 'leaderboard')));
    })();

    leaderboardPageCache.set(cacheKey, pagePromise);
    return pagePromise;
  }

  async function getFallbackIndex(): Promise<NormalizedUser[]> {
    const cachedUsers = readFallbackCache();
    if (cachedUsers) return cachedUsers;

    if (fallbackIndexPromise) return fallbackIndexPromise;

    fallbackIndexPromise = (async () => {
      const buildId = getBuildId();
      if (!buildId) return [];

      const requests: Array<Promise<NormalizedUser[]>> = [];
      for (const sort of FALLBACK_SORTS) {
        for (let page = 1; page <= FALLBACK_PAGES_PER_SORT; page += 1) {
          requests.push(fetchLeaderboardPage(buildId, sort, page));
        }
      }

      const pages = await Promise.all(requests);
      const users = uniqueUsers(pages.flat());
      writeFallbackCache(users);
      return users;
    })().finally(() => {
      fallbackIndexPromise = null;
    });

    return fallbackIndexPromise;
  }

  function userMatchesQuery(user: NormalizedUser, needle: string): boolean {
    return user.name.toLocaleLowerCase().includes(needle) || user.id.toLocaleLowerCase() === needle;
  }

  function userSearchRank(user: NormalizedUser, needle: string): number {
    const name = user.name.toLocaleLowerCase();
    const id = user.id.toLocaleLowerCase();

    if (name === needle) return 0;
    if (name.startsWith(needle)) return 1;
    if (id === needle) return 2;
    if (name.includes(needle)) return 3;
    return 4;
  }

  function sortUsersForQuery(users: NormalizedUser[], query: string): NormalizedUser[] {
    const needle = query.toLocaleLowerCase();

    return [...users].sort((a, b) => {
      const rankDiff = userSearchRank(a, needle) - userSearchRank(b, needle);
      if (rankDiff !== 0) return rankDiff;

      if (a.rank && b.rank) return a.rank - b.rank;
      if (a.rank) return -1;
      if (b.rank) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  async function searchLeaderboardPages(query: string, startPage: number, pageCount: number): Promise<NormalizedUser[]> {
    const buildId = getBuildId();
    if (!buildId) return [];

    const needle = query.toLocaleLowerCase();
    const requests: Array<Promise<NormalizedUser[]>> = [];
    const lastPage = Math.min(startPage + pageCount - 1, MAX_FALLBACK_PAGE);

    for (const sort of FALLBACK_SORTS) {
      for (let page = startPage; page <= lastPage; page += 1) {
        requests.push(fetchLeaderboardPage(buildId, sort, page));
      }
    }

    const pages = await Promise.all(requests);
    const users = uniqueUsers(pages.flat());
    return sortUsersForQuery(users.filter((user) => userMatchesQuery(user, needle)), query);
  }

  async function searchLeaderboardFallback(query: string): Promise<NormalizedUser[]> {
    return searchLeaderboardPages(query, 1, FALLBACK_PAGES_PER_SORT);
  }

  function mergeSearchResults(apiUsers: NormalizedUser[], fallbackUsers: NormalizedUser[], query: string, limit = SEARCH_LIMIT): NormalizedUser[] {
    return sortUsersForQuery(uniqueUsers([...apiUsers, ...fallbackUsers]), query).slice(0, limit);
  }

  function hasFallbackOnlyResult(apiUsers: NormalizedUser[], fallbackUsers: NormalizedUser[]): boolean {
    const apiIds = new Set(apiUsers.map((user) => user.id));
    return fallbackUsers.some((user) => !apiIds.has(user.id));
  }

  function formatNumber(value: unknown): string {
    if (value === null || value === undefined || value === '') return '';
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString() : String(value);
  }

  function resultMeta(user: NormalizedUser): string {
    const parts: string[] = [];
    if (user.member) parts.push(user.member);
    if (user.role !== null) parts.push(`role ${user.role}`);
    if (user.rank) parts.push(`#${user.rank}`);
    if (user.reviewCount !== null && user.reviewCount !== undefined) parts.push(`${formatNumber(user.reviewCount)} reviews`);
    if (user.exp !== null && user.exp !== undefined) parts.push(`${formatNumber(user.exp)} exp`);
    return parts.join(' · ');
  }

  function setMenuOpen(isOpen: boolean): void {
    if (mountedMenu) mountedMenu.classList.toggle('is-open', isOpen);
  }

  function clearMenu(): void {
    const list = mountedMenu && mountedMenu.querySelector(`.${SCRIPT_ID}-menu-list`);
    if (list) list.innerHTML = '';
  }

  function setStatus(message: string): void {
    const list = mountedMenu && mountedMenu.querySelector(`.${SCRIPT_ID}-menu-list`);
    if (!list) return;

    list.innerHTML = '';
    const status = document.createElement('div');
    status.className = `${SCRIPT_ID}-status`;
    status.textContent = message;
    list.appendChild(status);
    setMenuOpen(true);
  }

  function renderResults(users: NormalizedUser[], note: string, options: RenderOptions = {}): void {
    const list = mountedMenu && mountedMenu.querySelector(`.${SCRIPT_ID}-menu-list`);
    if (!list) return;

    list.innerHTML = '';

    if (note) {
      const status = document.createElement('div');
      status.className = `${SCRIPT_ID}-status`;
      status.textContent = note;
      list.appendChild(status);
    }

    if (!users.length) {
      const status = document.createElement('div');
      status.className = `${SCRIPT_ID}-status`;
      status.textContent = 'No users found.';
      list.appendChild(status);
    }

    for (const user of users) {
      const link = document.createElement('a');
      link.className = `${SCRIPT_ID}-result`;
      link.href = profileHref(user.id);
      link.dataset.userId = user.id;

      const name = document.createElement('span');
      name.className = `${SCRIPT_ID}-name`;
      name.textContent = user.name;

      const meta = document.createElement('span');
      meta.className = `${SCRIPT_ID}-meta`;
      meta.textContent = resultMeta(user) || user.id;

      link.append(name, meta);
      list.appendChild(link);
    }

    if (options.showLoadMore) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `${SCRIPT_ID}-load-more`;
      button.textContent = options.loading ? 'Loading more relevant users...' : 'Load more relevant users';
      button.disabled = Boolean(options.loading);
      button.addEventListener('click', loadMoreRelevantUsers);
      list.appendChild(button);
    }

    setMenuOpen(true);
  }

  function renderCurrentSearch(note = ''): void {
    if (!currentSearchState) return;

    const fallbackLimit = Math.max(SEARCH_LIMIT, currentSearchState.fallbackUsers.length + currentSearchState.apiUsers.length);
    const users = mergeSearchResults(currentSearchState.apiUsers, currentSearchState.fallbackUsers, currentSearchState.query, fallbackLimit);

    renderResults(users, note, {
      showLoadMore: !currentSearchState.exhausted,
      loading: currentSearchState.loadingMore,
    });
  }

  async function loadMoreRelevantUsers(): Promise<void> {
    if (!currentSearchState || currentSearchState.loadingMore || currentSearchState.exhausted) return;

    const state = currentSearchState;
    const requestId = activeRequestId;
    state.loadingMore = true;
    renderCurrentSearch();

    try {
      const nextMatches = await searchLeaderboardPages(state.query, state.nextFallbackPage, LOAD_MORE_PAGES_PER_SORT);
      if (requestId !== activeRequestId || state !== currentSearchState || !activeMode) return;

      state.nextFallbackPage += LOAD_MORE_PAGES_PER_SORT;
      state.fallbackUsers = uniqueUsers([...state.fallbackUsers, ...nextMatches]);
      state.exhausted = state.nextFallbackPage > MAX_FALLBACK_PAGE;
      state.loadingMore = false;

      renderCurrentSearch(nextMatches.length ? '' : 'No relevant users found in the next leaderboard pages.');
    } catch (error) {
      if (requestId !== activeRequestId || state !== currentSearchState || !activeMode) return;

      state.loadingMore = false;
      renderCurrentSearch(getErrorMessage(error, 'Could not load more users.'));
    }
  }

  async function runSearch(query: string): Promise<void> {
    const requestId = ++activeRequestId;
    lastQuery = query;

    if (!activeMode) return;

    if (query.length < MIN_QUERY_LENGTH) {
      currentSearchState = null;
      setStatus('Type at least 2 characters to stalk a user.');
      return;
    }

    currentSearchState = null;
    setStatus('Searching users...');

    try {
      const apiUsers = await searchUsersApi(query);
      const fallbackUsers = await searchLeaderboardFallback(query);
      if (requestId !== activeRequestId || query !== lastQuery || !activeMode) return;

      currentSearchState = {
        query,
        apiUsers,
        fallbackUsers,
        nextFallbackPage: FALLBACK_PAGES_PER_SORT + 1,
        exhausted: FALLBACK_PAGES_PER_SORT >= MAX_FALLBACK_PAGE,
        loadingMore: false,
      };
      renderCurrentSearch();
    } catch (error) {
      if (requestId !== activeRequestId || query !== lastQuery || !activeMode) return;

      if (isUnauthorizedError(error)) {
        setStatus('Login required for full user search. Checking leaderboard matches...');
        const fallbackUsers = await searchLeaderboardFallback(query);
        if (requestId !== activeRequestId || query !== lastQuery || !activeMode) return;

        currentSearchState = {
          query,
          apiUsers: [],
          fallbackUsers,
          nextFallbackPage: FALLBACK_PAGES_PER_SORT + 1,
          exhausted: FALLBACK_PAGES_PER_SORT >= MAX_FALLBACK_PAGE,
          loadingMore: false,
        };
        renderCurrentSearch('Limited leaderboard matches shown. Login enables full user search.');
        return;
      }

      setStatus('User API failed. Checking leaderboard matches...');
      const fallbackUsers = await searchLeaderboardFallback(query);
      if (requestId !== activeRequestId || query !== lastQuery || !activeMode) return;

      currentSearchState = {
        query,
        apiUsers: [],
        fallbackUsers,
        nextFallbackPage: FALLBACK_PAGES_PER_SORT + 1,
        exhausted: FALLBACK_PAGES_PER_SORT >= MAX_FALLBACK_PAGE,
        loadingMore: false,
      };
      renderCurrentSearch(fallbackUsers.length ? 'Showing leaderboard matches because user API search failed.' : getErrorMessage(error, 'User search failed.'));
    }
  }

  function isMobileViewport(): boolean {
    return window.matchMedia('(max-width: 991.98px)').matches;
  }

  function getMobileSearchButton(): HTMLButtonElement | null {
    const icon = document.querySelector('nav .d-lg-none use[href="#search"], nav .d-lg-none use[xlink\\:href="#search"]');
    return icon ? icon.closest('button') : null;
  }

  function markMobileSearchButton(): void {
    const button = getMobileSearchButton();
    if (button) button.classList.add(MOBILE_SEARCH_CLASS, LEGACY_MOBILE_SEARCH_CLASS);
  }

  function isInputVisible(): boolean {
    if (!mountedInput) return false;

    const style = window.getComputedStyle(mountedInput);
    const rect = mountedInput.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  }

  function openMobileSearchIfNeeded(): void {
    if (!isMobileViewport()) return;

    markMobileSearchButton();

    if (!isInputVisible()) {
      const button = getMobileSearchButton();
      if (button) button.click();
    }
  }

  function activateMode(): void {
    if (!mountedInput) return;

    activeMode = true;
    activeRequestId += 1;
    document.body.classList.add(ACTIVE_CLASS, LEGACY_ACTIVE_CLASS);
    mountedInput.placeholder = 'Find user...';
    mountedInput.value = '';
    openMobileSearchIfNeeded();
    setStatus('Type at least 2 characters to stalk a user.');
    window.setTimeout(() => mountedInput && mountedInput.focus(), isMobileViewport() ? 90 : 0);
  }

  function deactivateMode(): void {
    activeMode = false;
    activeRequestId += 1;
    lastQuery = '';
    currentSearchState = null;
    document.body.classList.remove(ACTIVE_CLASS, LEGACY_ACTIVE_CLASS);

    if (mountedInput) {
      mountedInput.placeholder = originalPlaceholder || 'Search...';
      mountedInput.value = '';
    }

    clearMenu();
    setMenuOpen(false);
  }

  function toggleMode(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (activeMode) {
      deactivateMode();
    } else {
      activateMode();
    }
  }

  function ensureMenu(searchInput: HTMLElement): HTMLElement {
    let menu = searchInput.querySelector<HTMLElement>(`.${SCRIPT_ID}-menu`);
    if (menu) return menu;

    menu = document.createElement('div');
    menu.className = `${SCRIPT_ID}-menu`;
    menu.setAttribute('role', 'listbox');
    menu.innerHTML = `<div class="${SCRIPT_ID}-menu-list"></div>`;
    searchInput.appendChild(menu);
    return menu;
  }

  function bindSearchHijack(input: HTMLInputElement, form: HTMLFormElement | null): void {
    if (input.dataset[INPUT_BOUND_DATA_KEY] === 'true' || input.dataset[LEGACY_INPUT_BOUND_DATA_KEY] === 'true') return;

    input.dataset[INPUT_BOUND_DATA_KEY] = 'true';
    input.dataset[LEGACY_INPUT_BOUND_DATA_KEY] = 'true';

    for (const eventName of ['beforeinput', 'change', 'keyup', 'search']) {
      input.addEventListener(eventName, (event) => {
        if (!activeMode) return;
        event.stopImmediatePropagation();
      }, true);
    }

    input.addEventListener('input', (event) => {
      if (!activeMode) return;

      event.stopImmediatePropagation();
      const query = input.value.trim();
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => runSearch(query), 260);
    }, true);

    input.addEventListener('keydown', (event) => {
      if (!activeMode) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        deactivateMode();
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopImmediatePropagation();
        const firstResult = mountedMenu?.querySelector<HTMLAnchorElement>(`.${SCRIPT_ID}-result`);
        if (firstResult) window.location.assign(firstResult.href);
      }
    }, true);

    if (form && form.dataset[INPUT_BOUND_DATA_KEY] !== 'true' && form.dataset[LEGACY_INPUT_BOUND_DATA_KEY] !== 'true') {
      form.dataset[INPUT_BOUND_DATA_KEY] = 'true';
      form.dataset[LEGACY_INPUT_BOUND_DATA_KEY] = 'true';
      form.addEventListener('submit', (event) => {
        if (!activeMode) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        const firstResult = mountedMenu?.querySelector<HTMLAnchorElement>(`.${SCRIPT_ID}-result`);
        if (firstResult) window.location.assign(firstResult.href);
      }, true);
    }
  }

  function bindLogoIcon(brandIcon: SVGElement): void {
    if (brandIcon.dataset[LOGO_BOUND_DATA_KEY] === 'true' || brandIcon.dataset[LEGACY_LOGO_BOUND_DATA_KEY] === 'true') return;

    brandIcon.dataset[LOGO_BOUND_DATA_KEY] = 'true';
    brandIcon.dataset[LEGACY_LOGO_BOUND_DATA_KEY] = 'true';
    brandIcon.setAttribute('role', 'button');
    brandIcon.setAttribute('tabindex', '0');
    brandIcon.setAttribute('aria-label', 'Toggle WTR-LAB user stalker search');
    brandIcon.addEventListener('click', toggleMode, true);
    brandIcon.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      toggleMode(event);
    }, true);
  }

  function mount(): boolean {
    injectStyle();

    const navbar = document.querySelector('nav');
    const brand = navbar?.querySelector<HTMLElement>('.navbar-brand');
    const brandIcon = brand?.querySelector<SVGElement>('svg');
    const searchInput = navbar?.querySelector<HTMLElement>('.search-input');
    const input = searchInput?.querySelector<HTMLInputElement>('input[type="search"], input');
    const form = input?.closest<HTMLFormElement>('form') ?? null;

    if (!navbar || !brandIcon || !searchInput || !input) return false;

    mountedInput = input;
    mountedForm = form;
    mountedMenu = ensureMenu(searchInput);

    if (!originalPlaceholder) originalPlaceholder = input.getAttribute('placeholder') || 'Search...';

    bindLogoIcon(brandIcon);
    bindSearchHijack(input, form);
    markMobileSearchButton();

    return true;
  }

  function start(): void {
    installNativeSearchGuard();
    mount();

    const observer: MountObserver = new MutationObserver(() => {
      window.clearTimeout(observer.mountTimer);
      observer.mountTimer = window.setTimeout(() => {
        const wasActive = activeMode;
        mount();
        if (wasActive && mountedInput) {
          document.body.classList.add(ACTIVE_CLASS, LEGACY_ACTIVE_CLASS);
          mountedInput.placeholder = 'Find user...';
        }
      }, 100);
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  installNativeSearchGuard();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
