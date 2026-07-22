/**
 * Resolves notification actionUrls to valid, role-appropriate app routes.
 * Handles legacy/outdated paths stored on existing notifications without
 * requiring a data migration.
 */

export type NotificationRouteStatus =
  | 'ok'
  | 'missing_url'
  | 'invalid_params'
  | 'remapped'
  | 'unavailable';

export interface ResolveNotificationRouteResult {
  path: string | null;
  status: NotificationRouteStatus;
  /** Module list path when the specific resource cannot be opened */
  moduleFallback: string;
  message?: string;
}

const INVALID_PARAM = /^(undefined|null|nan|)$/i;

function isInvalidSegment(value: string | null | undefined): boolean {
  if (value == null) return true;
  return INVALID_PARAM.test(String(value).trim());
}

function splitUrl(raw: string): { pathname: string; search: string; hash: string } {
  try {
    const url = new URL(raw, 'http://local.invalid');
    return { pathname: url.pathname, search: url.search, hash: url.hash };
  } catch {
    const [pathAndQuery, hash = ''] = raw.split('#');
    const [pathname, search = ''] = (pathAndQuery || '/').split('?');
    return {
      pathname: pathname || '/',
      search: search ? `?${search}` : '',
      hash: hash ? `#${hash}` : '',
    };
  }
}

function joinUrl(pathname: string, search = '', hash = ''): string {
  return `${pathname}${search}${hash}`;
}

function hasInvalidPathParams(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  return segments.some((seg) => isInvalidSegment(seg));
}

function hasInvalidQueryIds(search: string): boolean {
  if (!search) return false;
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const idKeys = [
    'id',
    'loan',
    'loanId',
    'tripId',
    'bidId',
    'cargoId',
    'loadId',
    'contractId',
    'inspectionId',
    'disputeId',
    'paymentId',
    'invoiceId',
    'reportId',
    'notificationId',
    'matchId',
    'bookingId',
  ];
  for (const key of idKeys) {
    if (params.has(key) && isInvalidSegment(params.get(key))) {
      return true;
    }
  }
  return false;
}

/** Role-aware notifications hub */
export function getNotificationsHubPath(role?: string | null): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin/notifications';
    case 'ADMIN':
      return '/admin-operational/notifications';
    case 'TENANT_ADMIN':
      return '/tenant-admin/notifications';
    case 'TRUCK_OWNER':
      return '/dashboard/fleet/notifications';
    case 'DRIVER':
      return '/dashboard/driver/notifications';
    case 'BROKER':
      return '/dashboard/broker/notifications';
    case 'CUSTOMS_OFFICER':
      return '/dashboard/customs/notifications';
    case 'LENDER':
      return '/lender/notifications';
    case 'CARGO_OWNER':
    case 'CARGO_RECEIVER':
      return '/dashboard/notifications';
    default:
      return '/dashboard/notifications';
  }
}

/** Default module home by role when a deep link cannot be resolved */
export function getRoleHomePath(role?: string | null): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin';
    case 'ADMIN':
      return '/admin-operational';
    case 'TENANT_ADMIN':
      return '/tenant-admin';
    case 'TRUCK_OWNER':
      return '/dashboard/fleet';
    case 'DRIVER':
      return '/dashboard/driver';
    case 'BROKER':
      return '/dashboard/broker';
    case 'CUSTOMS_OFFICER':
      return '/dashboard/customs';
    case 'LENDER':
      return '/lender';
    case 'CARGO_OWNER':
    case 'CARGO_RECEIVER':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}

function moduleFallbackForPath(pathname: string, role?: string | null): string {
  if (pathname.includes('/loan') || pathname.includes('/lending') || pathname.includes('/lender/')) {
    if (role === 'LENDER') return '/lender/requests';
    if (role === 'TRUCK_OWNER') return '/dashboard/fleet/loan-requests';
    return '/dashboard/loan-requests';
  }
  if (pathname.includes('/bid') || pathname.includes('/auction') || pathname.includes('/smart-match') || pathname.includes('/smart-book')) {
    if (role === 'TRUCK_OWNER') return '/dashboard/fleet/my-bids';
    if (role === 'BROKER') return '/dashboard/broker/bidding';
    return '/dashboard/bidding';
  }
  if (pathname.includes('/trip') || pathname.includes('/mission')) {
    if (role === 'DRIVER') return '/dashboard/driver/trips';
    if (role === 'TRUCK_OWNER') return '/dashboard/trips';
    if (role === 'BROKER') return '/dashboard/broker/tracking';
    return '/dashboard/tracking';
  }
  if (pathname.includes('/payment') || pathname.includes('/invoice') || pathname.includes('/financial') || pathname.includes('/receipt')) {
    if (role === 'TRUCK_OWNER') return '/dashboard/fleet/financial';
    if (role === 'LENDER') return '/lender/receipts';
    if (role === 'DRIVER') return '/dashboard/driver/finance';
    return '/dashboard/payments';
  }
  if (pathname.includes('/inspect') || pathname.includes('/customs')) {
    if (role === 'BROKER') return '/dashboard/broker/customs-inspections';
    if (role === 'DRIVER') return '/dashboard/driver/inspection';
    if (role === 'CUSTOMS_OFFICER') return '/dashboard/customs/inspections';
    return '/dashboard/customs-inspections';
  }
  if (pathname.includes('/cargo') || pathname.includes('/load') || pathname.includes('/shipment')) {
    if (role === 'BROKER') return '/dashboard/broker/loads';
    if (role === 'TRUCK_OWNER') return '/dashboard/fleet';
    if (role === 'DRIVER') return '/dashboard/driver/cargo';
    return '/dashboard/cargos';
  }
  if (pathname.includes('/dispute')) {
    if (role === 'BROKER') return '/dashboard/broker/disputes';
    if (role === 'TRUCK_OWNER') return '/dashboard/fleet/disputes';
    if (role === 'LENDER') return '/lender/disputes';
    if (role === 'DRIVER') return '/dashboard/driver/disputes';
    return '/dashboard/disputes';
  }
  if (pathname.includes('/credit')) {
    if (role === 'TRUCK_OWNER') return '/dashboard/fleet/credits';
    if (role === 'TENANT_ADMIN') return '/tenant-admin/purchase-credits';
    return getRoleHomePath(role);
  }
  return getRoleHomePath(role);
}

/**
 * Rewrite a single legacy pathname (+ search) into a current route for the role.
 * Returns null if no rewrite applies (caller keeps original).
 */
function rewriteLegacyPath(
  pathname: string,
  search: string,
  role?: string | null,
): { pathname: string; search: string } | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  // Bare /notifications → role hub
  if (pathname === '/notifications' || pathname === '/notification-center') {
    return { pathname: getNotificationsHubPath(role), search: '' };
  }

  // Driver missing dashboard prefix
  if (pathname === '/driver/trips' || pathname.startsWith('/driver/trips/')) {
    return { pathname: pathname.replace(/^\/driver/, '/dashboard/driver'), search };
  }
  if (pathname.startsWith('/driver/') && !pathname.startsWith('/dashboard/driver')) {
    return { pathname: `/dashboard${pathname}`, search };
  }

  // Fleet trips live at /dashboard/trips
  if (pathname === '/dashboard/fleet/trips' || pathname.startsWith('/dashboard/fleet/trips/')) {
    const tripId = pathname.split('/')[4];
    if (tripId && !isInvalidSegment(tripId)) {
      params.set('tripId', tripId);
      const q = params.toString();
      return { pathname: '/dashboard/trips', search: q ? `?${q}` : '' };
    }
    return { pathname: '/dashboard/trips', search };
  }

  // Credits
  if (pathname === '/dashboard/credits' || pathname === '/dashboard/credits/topup') {
    if (role === 'TENANT_ADMIN') {
      return { pathname: '/tenant-admin/purchase-credits', search: '' };
    }
    if (pathname.endsWith('/topup')) {
      return { pathname: '/dashboard/fleet/buy-credits', search: '' };
    }
    return { pathname: '/dashboard/fleet/credits', search: '' };
  }

  // Lending (API-style paths → UI)
  const lendingMatch = pathname.match(/^\/lending\/loan-requests\/([^/]+)$/);
  if (lendingMatch) {
    const loanId = lendingMatch[1];
    if (isInvalidSegment(loanId)) {
      return { pathname: '/lender/requests', search: '' };
    }
    return { pathname: '/lender/requests', search: `?loan=${encodeURIComponent(loanId)}` };
  }
  if (pathname === '/lending/loan-requests' || pathname.startsWith('/lending/')) {
    return { pathname: '/lender/requests', search };
  }

  // /loans/:id → cargo-owner loan requests
  const loansMatch = pathname.match(/^\/loans\/([^/]+)$/);
  if (loansMatch) {
    const loanId = loansMatch[1];
    if (isInvalidSegment(loanId)) {
      return { pathname: '/dashboard/loan-requests', search: '' };
    }
    return {
      pathname: '/dashboard/loan-requests',
      search: `?loan=${encodeURIComponent(loanId)}`,
    };
  }
  if (pathname === '/loans') {
    return { pathname: '/dashboard/loan-requests', search: '' };
  }

  // Bare /payments
  if (pathname === '/payments') {
    if (role === 'TRUCK_OWNER') return { pathname: '/dashboard/fleet/financial', search: '' };
    if (role === 'LENDER') return { pathname: '/lender/receipts', search: '' };
    if (role === 'DRIVER') return { pathname: '/dashboard/driver/finance', search: '' };
    return { pathname: '/dashboard/payments', search: '' };
  }

  // /fleet/payments (missing /dashboard)
  if (pathname === '/fleet/payments' || pathname.startsWith('/fleet/payments')) {
    return { pathname: '/dashboard/fleet/financial', search };
  }

  // Customs officer paths without dashboard prefix
  if (pathname.startsWith('/customs/inspections')) {
    return { pathname: `/dashboard${pathname}`, search };
  }
  if (pathname === '/customs' || pathname.startsWith('/customs/')) {
    return { pathname: `/dashboard${pathname}`, search };
  }

  // Receiver cargos
  if (pathname === '/dashboard/receiver/cargos' || pathname.startsWith('/dashboard/receiver/')) {
    return { pathname: '/dashboard/cargos/my-cargos', search: '' };
  }

  // Nested financial payments
  if (pathname === '/dashboard/financial/payments' || pathname.startsWith('/dashboard/financial/payments')) {
    if (role === 'TRUCK_OWNER') return { pathname: '/dashboard/fleet/financial', search };
    return { pathname: '/dashboard/payments', search };
  }

  // Cargo matches child (no route)
  const matchesPath = pathname.match(/^\/dashboard\/cargos\/([^/]+)\/matches$/);
  if (matchesPath) {
    if (role === 'TRUCK_OWNER') return { pathname: '/dashboard/fleet/smart-bookings', search: '' };
    if (role === 'BROKER') return { pathname: '/dashboard/broker/smart-matching', search: '' };
    return { pathname: '/dashboard/smart-matching', search: '' };
  }

  // cargo-owner/shipments
  const shipmentMatch = pathname.match(/^\/cargo-owner\/shipments\/([^/]+)$/);
  if (shipmentMatch) {
    const id = shipmentMatch[1];
    if (!isInvalidSegment(id)) {
      return { pathname: `/dashboard/tracking/trips/${id}`, search: '' };
    }
    return { pathname: '/dashboard/tracking', search: '' };
  }

  // Missions without driver prefix
  if (pathname === '/dashboard/missions' || pathname.startsWith('/dashboard/missions/')) {
    return { pathname: pathname.replace('/dashboard/missions', '/dashboard/driver/missions'), search };
  }

  // Fleet safety detail id not supported
  const safetyMatch = pathname.match(/^\/dashboard\/fleet\/safety\/([^/]+)$/);
  if (safetyMatch) {
    return { pathname: '/dashboard/fleet/safety', search: '' };
  }

  // Truck-owner role remaps for cargo-owner layout paths
  if (role === 'TRUCK_OWNER') {
    if (pathname === '/dashboard/bidding' || pathname.startsWith('/dashboard/bidding/')) {
      return { pathname: '/dashboard/fleet/my-bids', search };
    }
    if (pathname === '/dashboard/my-bids' || pathname.startsWith('/dashboard/my-bids')) {
      return { pathname: '/dashboard/fleet/my-bids', search };
    }
    if (pathname === '/dashboard/smart-matching' || pathname.startsWith('/dashboard/smart-matching')) {
      return { pathname: '/dashboard/fleet/smart-bookings', search: '' };
    }
    if (pathname === '/dashboard/payments' || pathname === '/dashboard/pending-payments') {
      return { pathname: '/dashboard/fleet/financial', search };
    }
    if (pathname === '/dashboard/invoices') {
      return { pathname: '/dashboard/fleet/financial', search };
    }
  }

  // Broker should not use cargo-owner bidding/smart-matching roots
  if (role === 'BROKER') {
    if (pathname === '/dashboard/bidding' || pathname.startsWith('/dashboard/bidding/')) {
      return { pathname: '/dashboard/broker/bidding', search };
    }
    if (pathname === '/dashboard/smart-matching' || pathname.startsWith('/dashboard/smart-matching')) {
      return { pathname: '/dashboard/broker/smart-matching', search: '' };
    }
    if (pathname === '/dashboard/customs-inspections' || pathname.startsWith('/dashboard/customs-inspections/')) {
      return {
        pathname: pathname.replace('/dashboard/customs-inspections', '/dashboard/broker/customs-inspections'),
        search,
      };
    }
  }

  // Lender should not land on cargo loan pages
  if (role === 'LENDER') {
    if (pathname.startsWith('/dashboard/loan-requests') || pathname.startsWith('/loans')) {
      const loan = params.get('loan') || params.get('loanId');
      if (loan && !isInvalidSegment(loan)) {
        return { pathname: '/lender/requests', search: `?loan=${encodeURIComponent(loan)}` };
      }
      return { pathname: '/lender/requests', search: '' };
    }
  }

  // Driver should not open fleet/cargo-owner trip roots
  if (role === 'DRIVER') {
    if (pathname === '/dashboard/trips' || pathname.startsWith('/dashboard/fleet/trips')) {
      const tripId = params.get('tripId');
      if (tripId && !isInvalidSegment(tripId)) {
        return { pathname: '/dashboard/driver/trips', search: `?tripId=${encodeURIComponent(tripId)}` };
      }
      return { pathname: '/dashboard/driver/trips', search };
    }
  }

  return null;
}

function buildUnavailablePath(moduleFallback: string, message?: string): string {
  const params = new URLSearchParams();
  params.set('module', moduleFallback);
  if (message) params.set('message', message);
  return `/resource-unavailable?${params.toString()}`;
}

/**
 * Resolve a notification actionUrl for the current user role.
 */
export function resolveNotificationRoute(
  actionUrl: string | null | undefined,
  role?: string | null,
  options?: { notificationType?: string },
): ResolveNotificationRouteResult {
  const home = getRoleHomePath(role);

  if (!actionUrl || !String(actionUrl).trim()) {
    // Type-based soft fallback when URL is missing
    const type = (options?.notificationType || '').toUpperCase();
    let fallback = home;
    if (type.includes('LOAN') || type.includes('LENDER')) {
      fallback = role === 'LENDER' ? '/lender/requests' : '/dashboard/loan-requests';
    } else if (type.includes('AUCTION') || type.includes('BID') || type.includes('SMART_MATCH')) {
      fallback =
        role === 'TRUCK_OWNER'
          ? '/dashboard/fleet/my-bids'
          : role === 'BROKER'
            ? '/dashboard/broker/bidding'
            : '/dashboard/bidding';
    } else if (type.includes('TRIP') || type.includes('DRIVER_ASSIGN')) {
      fallback =
        role === 'DRIVER'
          ? '/dashboard/driver/trips'
          : role === 'TRUCK_OWNER'
            ? '/dashboard/trips'
            : '/dashboard/tracking';
    } else if (type.includes('PAYMENT') || type.includes('INVOICE')) {
      fallback = role === 'TRUCK_OWNER' ? '/dashboard/fleet/financial' : '/dashboard/payments';
    } else if (type.includes('PRE_TRIP') || type.includes('INSPECT') || type.includes('CUSTOMS')) {
      fallback =
        role === 'DRIVER'
          ? '/dashboard/driver/inspection'
          : role === 'BROKER'
            ? '/dashboard/broker/customs-inspections'
            : '/dashboard/customs-inspections';
    }

    return {
      path: fallback,
      status: 'missing_url',
      moduleFallback: fallback,
      message: 'This notification has no destination link. Opening the related module instead.',
    };
  }

  const trimmed = String(actionUrl).trim();
  // External URLs: pass through
  if (/^https?:\/\//i.test(trimmed)) {
    return { path: trimmed, status: 'ok', moduleFallback: home };
  }

  const { pathname: rawPath, search: rawSearch, hash } = splitUrl(trimmed);
  let pathname = rawPath;
  let search = rawSearch;

  const rewritten = rewriteLegacyPath(pathname, search, role);
  let remapped = false;
  if (rewritten) {
    pathname = rewritten.pathname;
    search = rewritten.search;
    remapped = true;
  }

  const moduleFallback = moduleFallbackForPath(pathname, role);

  if (hasInvalidPathParams(pathname) || hasInvalidQueryIds(search)) {
    return {
      path: buildUnavailablePath(
        moduleFallback,
        'The referenced record is missing or no longer available.',
      ),
      status: 'invalid_params',
      moduleFallback,
      message: 'The referenced record is missing or no longer available.',
    };
  }

  // Guard: truck owner must not open tenant-admin / lender / admin trees
  if (role === 'TRUCK_OWNER') {
    if (
      pathname.startsWith('/tenant-admin') ||
      pathname.startsWith('/lender') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/admin-operational') ||
      pathname.startsWith('/admin-tenant')
    ) {
      return {
        path: buildUnavailablePath(home, 'You do not have access to this page.'),
        status: 'unavailable',
        moduleFallback: home,
        message: 'You do not have access to this page.',
      };
    }
  }

  if (role === 'CARGO_OWNER' || role === 'CARGO_RECEIVER') {
    if (
      pathname.startsWith('/lender') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/tenant-admin') ||
      pathname.startsWith('/dashboard/fleet')
    ) {
      return {
        path: buildUnavailablePath(home, 'You do not have access to this page.'),
        status: 'unavailable',
        moduleFallback: home,
        message: 'You do not have access to this page.',
      };
    }
  }

  if (role === 'BROKER') {
    if (
      pathname.startsWith('/lender') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/tenant-admin') ||
      pathname.startsWith('/dashboard/fleet')
    ) {
      return {
        path: buildUnavailablePath(home, 'You do not have access to this page.'),
        status: 'unavailable',
        moduleFallback: home,
        message: 'You do not have access to this page.',
      };
    }
  }

  if (role === 'DRIVER') {
    if (
      pathname.startsWith('/lender') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/tenant-admin') ||
      pathname.startsWith('/dashboard/fleet') ||
      pathname.startsWith('/admin-operational') ||
      pathname.startsWith('/admin-tenant')
    ) {
      return {
        path: buildUnavailablePath('/dashboard/driver', 'You do not have access to this page.'),
        status: 'unavailable',
        moduleFallback: '/dashboard/driver',
        message: 'You do not have access to this page.',
      };
    }
  }

  if (role === 'LENDER') {
    if (
      pathname.startsWith('/dashboard/fleet') ||
      pathname.startsWith('/dashboard/driver') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/tenant-admin')
    ) {
      return {
        path: buildUnavailablePath('/lender', 'You do not have access to this page.'),
        status: 'unavailable',
        moduleFallback: '/lender',
        message: 'You do not have access to this page.',
      };
    }
  }

  return {
    path: joinUrl(pathname, search, hash),
    status: remapped ? 'remapped' : 'ok',
    moduleFallback,
  };
}
