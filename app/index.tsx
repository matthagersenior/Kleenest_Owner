import { Link } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  DiagnosticDisclosure,
  HealthCard,
  OSHero,
  SectionHeader,
  StatusPill,
  osCard,
  osColors,
} from '@/components/KleenestOS';
import {
  getOwnerAuthorization,
  type OwnerAuthorization,
} from '@/services/ownerAuthorization';
import { getOwnerEconomySnapshot } from '@/services/ownerEconomy';
import { getOwnerModerationQueues } from '@/services/ownerModeration';
import { getOwnerOperationsSnapshot } from '@/services/ownerOperations';
import { getPlatformHistory } from '@/services/controlPlane';

type State = {
  authorization: OwnerAuthorization | null;
  economy: any | null;
  moderation: any | null;
  operations: any | null;
  history: any | null;
};

type AttentionItem = {
  key: string;
  href: string;
  title: string;
  body: string;
  tone: 'danger' | 'warning';
};

const empty: State = {
  authorization: null,
  economy: null,
  moderation: null,
  operations: null,
  history: null,
};

const routes = [
  ['/access', 'People & Access', 'Search users and control roles, subscriptions and admin authority.'],
  ['/businesses', 'Businesses & Network', 'Search businesses, memberships, locations and Fleet/Enterprise entitlements.'],
  ['/progression', 'Economy', 'Operate XP issuance, evidence tiers, levels, objectives and reward policy.'],
  ['/moderation', 'Trust & Moderation', 'Resolve reports and pending trust queues.'],
  ['/operations', 'Operations', 'Control ingestion and inspect integrity, delivery and backend health.'],
  ['/audit', 'System Audit', 'Run capability and activity audits.'],
  ['/capabilities', 'System Capabilities', 'Inspect the canonical capability registry and retirement state.'],
  ['/data', 'System Data Workbench', 'Use the audited CRUD gateway for advanced platform data work.'],
] as const;

function object(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function number(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function countIntegrityIssues(value: unknown) {
  if (!Array.isArray(value)) return 0;
  return value.reduce((total, row) => total + number(object(row).issue_count), 0);
}

function compactBytes(value: unknown) {
  const bytes = number(value);
  if (bytes <= 0) return '0 MB';
  const mb = bytes / 1024 / 1024;
  if (mb < 1024) return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

function AttentionCard({ item }: { item: AttentionItem }) {
  const danger = item.tone === 'danger';
  return (
    <Link href={item.href as any} asChild>
      <Pressable
        style={{
          ...osCard,
          borderColor: danger ? '#e8bbbb' : '#efd9a5',
          backgroundColor: danger ? '#fff6f6' : '#fffaf0',
          gap: 5,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text
              style={{
                color: danger ? osColors.danger : osColors.warning,
                fontWeight: '900',
              }}
            >
              {item.title}
            </Text>
            <Text style={{ color: osColors.muted, lineHeight: 19 }}>{item.body}</Text>
          </View>
          <Text style={{ color: osColors.green, fontSize: 22 }}>›</Text>
        </View>
      </Pressable>
    </Link>
  );
}

export default function KleenestOSCommandCenter() {
  const [state, setState] = useState<State>(empty);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const load = useCallback(async () => {
    const authorization = await getOwnerAuthorization();
    if (!authorization.authorized) throw new Error('KleenestOS authorization required.');

    const settled = await Promise.allSettled([
      getOwnerEconomySnapshot(),
      getOwnerModerationQueues(),
      getOwnerOperationsSnapshot(),
      getPlatformHistory(25),
    ]);

    const nextErrors: string[] = [];
    const value = (index: number) => {
      const result = settled[index];
      if (result.status === 'fulfilled') return result.value;
      nextErrors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
      return null;
    };

    setState({
      authorization,
      economy: value(0),
      moderation: value(1),
      operations: value(2),
      history: value(3),
    });
    setErrors(nextErrors);
  }, []);

  useEffect(() => {
    load()
      .catch((cause) => setErrors([cause instanceof Error ? cause.message : String(cause)]))
      .finally(() => setLoading(false));
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  const ingestion = object(state.operations?.ingestion);
  const storage = object(ingestion.storage_guard);
  const markets = object(ingestion.markets);
  const scheduler = object(ingestion.scheduler);
  const nativePush = object(state.operations?.nativePush);

  const paused = Boolean(storage.paused);
  const hardStop = Boolean(storage.hard_stop);
  const schedulerActive = scheduler.active === true;
  const integrityIssueCount = countIntegrityIssues(state.operations?.integrity);
  const nativePushFailures = number(nativePush.failed) + number(nativePush.expired);
  const activePushTokens = number(nativePush.active_tokens);
  const reviewCount = state.moderation?.reviewReports?.length ?? 0;
  const pendingBusinessCount = state.moderation?.pendingBusinesses?.length ?? 0;
  const anomalyCount = state.economy?.anomalyCandidates?.length ?? 0;

  const attention = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    if (hardStop || paused) {
      items.push({
        key: 'ingestion-paused',
        href: '/operations',
        title: hardStop ? 'Ingestion hard stop' : 'Ingestion paused',
        body: String(storage.pause_reason ?? 'The national ingestion guard requires owner review.'),
        tone: 'danger',
      });
    }
    if (!schedulerActive) {
      items.push({
        key: 'scheduler',
        href: '/operations',
        title: 'Ingestion scheduler is inactive',
        body: 'Live runs may still be finishing, but the canonical pg_cron scheduler is not active.',
        tone: 'warning',
      });
    }
    if (integrityIssueCount > 0) {
      items.push({
        key: 'integrity',
        href: '/operations',
        title: `${integrityIssueCount} data integrity issue${integrityIssueCount === 1 ? '' : 's'}`,
        body: 'Open Operations to inspect orphaned or contradictory platform records.',
        tone: 'danger',
      });
    }
    if (nativePushFailures > 0) {
      items.push({
        key: 'native-push',
        href: '/operations',
        title: `${nativePushFailures} native push delivery failure${nativePushFailures === 1 ? '' : 's'}`,
        body: 'Inspect delivery receipts and exhausted retry attempts.',
        tone: 'warning',
      });
    }
    if (reviewCount > 0) {
      items.push({
        key: 'moderation',
        href: '/moderation',
        title: `${reviewCount} moderation item${reviewCount === 1 ? '' : 's'} waiting`,
        body: 'Review trust reports that need an owner/admin decision.',
        tone: 'warning',
      });
    }
    if (pendingBusinessCount > 0) {
      items.push({
        key: 'businesses',
        href: '/businesses',
        title: `${pendingBusinessCount} business item${pendingBusinessCount === 1 ? '' : 's'} waiting`,
        body: 'Resolve pending business/network administration.',
        tone: 'warning',
      });
    }
    if (anomalyCount > 0) {
      items.push({
        key: 'economy',
        href: '/progression',
        title: `${anomalyCount} economy anomal${anomalyCount === 1 ? 'y' : 'ies'}`,
        body: 'Review high-velocity XP or progression activity.',
        tone: 'warning',
      });
    }
    return items;
  }, [
    anomalyCount,
    hardStop,
    integrityIssueCount,
    nativePushFailures,
    paused,
    pendingBusinessCount,
    reviewCount,
    schedulerActive,
    storage.pause_reason,
  ]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const observedPercent = number(storage.observed_percent);
  const diskPercent = number(storage.disk_observed_percent);
  const runningMarkets = number(markets.running);
  const pendingMarkets = number(markets.pending);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 64 }}
    >
      <OSHero
        eyebrow="KLEENESTOS · PRIVATE PLATFORM OPERATING SYSTEM"
        title="COMMAND CENTER"
        body="Live platform state, what needs attention, and the control surface that can resolve it."
      >
        {state.authorization ? (
          <StatusPill
            label={
              state.authorization.is_platform_owner
                ? 'PLATFORM OWNER · FULL CONTROL'
                : 'ADMIN · RESTRICTED CONTROL'
            }
            tone={state.authorization.is_platform_owner ? 'good' : 'warning'}
          />
        ) : null}
      </OSHero>

      {errors.map((message, index) => (
        <View
          key={`${message}-${index}`}
          style={{ ...osCard, borderColor: '#e8bbbb', backgroundColor: '#fff6f6' }}
        >
          <Text style={{ color: osColors.danger, fontWeight: '900' }}>Subsystem degraded</Text>
          <Text style={{ color: osColors.danger }}>{message}</Text>
        </View>
      ))}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <HealthCard
          label="Ingestion"
          value={paused ? 'PAUSED' : `${runningMarkets} LIVE`}
          tone={hardStop ? 'danger' : paused ? 'warning' : 'good'}
          detail={`${pendingMarkets} pending markets · ${String(scheduler.source ?? 'scheduler unknown')}`}
        />
        <HealthCard
          label="Database"
          value={`${observedPercent.toFixed(1)}%`}
          tone={observedPercent >= 70 ? 'warning' : 'good'}
          detail={`${compactBytes(storage.observed_bytes)} observed · WAL ${compactBytes(storage.wal_bytes)}`}
        />
        <HealthCard
          label="Disk observed"
          value={`${diskPercent.toFixed(1)}%`}
          tone={diskPercent >= 85 ? 'danger' : diskPercent >= 70 ? 'warning' : 'good'}
          detail="Database + WAL/overhead observation"
        />
        <HealthCard
          label="Native push"
          value={activePushTokens}
          tone={nativePushFailures > 0 ? 'warning' : 'good'}
          detail={`${nativePushFailures} failed/expired · active device tokens`}
        />
        <HealthCard
          label="Integrity"
          value={integrityIssueCount}
          tone={integrityIssueCount > 0 ? 'danger' : 'good'}
          detail="Canonical orphan/consistency checks"
        />
        <HealthCard
          label="Moderation"
          value={reviewCount}
          tone={reviewCount ? 'warning' : 'good'}
          detail="Pending review reports"
        />
      </View>

      <View style={{ gap: 9 }}>
        <SectionHeader
          title="Needs attention"
          body="KleenestOS promotes actionable platform conditions here instead of making you hunt through diagnostics."
        />
        {attention.length ? (
          attention.map((item) => <AttentionCard key={item.key} item={item} />)
        ) : (
          <View style={{ ...osCard, gap: 5 }}>
            <Text style={{ color: osColors.good, fontWeight: '900' }}>No active owner actions</Text>
            <Text style={{ color: osColors.muted }}>
              Current operational, moderation, integrity, delivery, and economy gates are clear.
            </Text>
          </View>
        )}
      </View>

      <View style={{ ...osCard, backgroundColor: osColors.ink, gap: 8 }}>
        <Text style={{ color: '#bde4cf', fontWeight: '900', letterSpacing: 1, fontSize: 10 }}>
          ECONOMY PULSE
        </Text>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '900' }}>
          {number(state.economy?.xpLast24h).toLocaleString()} XP issued in the last 24 hours
        </Text>
        <Text style={{ color: '#dce8e1' }}>
          {number(state.economy?.discoveries).toLocaleString()} canonical discoveries ·{' '}
          {number(state.economy?.onSiteDiscoveries).toLocaleString()} on-site live ·{' '}
          {number(state.economy?.activeObjectives).toLocaleString()} active objectives
        </Text>
        <Link href="/progression" asChild>
          <Pressable
            style={{
              alignSelf: 'flex-start',
              backgroundColor: '#d9efe1',
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 9,
            }}
          >
            <Text style={{ fontWeight: '900', color: osColors.ink }}>Open Economy →</Text>
          </Pressable>
        </Link>
      </View>

      <View style={{ gap: 9 }}>
        <SectionHeader title="Operating domains" body="Primary KleenestOS control surfaces." />
        {routes.map(([href, title, body], index) => (
          <Link key={href} href={href} asChild>
            <Pressable style={{ ...osCard, backgroundColor: index < 5 ? 'white' : '#f7f9f8' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 17, fontWeight: '900', color: osColors.ink }}>{title}</Text>
                  <Text style={{ color: osColors.muted, lineHeight: 19 }}>{body}</Text>
                </View>
                <Text style={{ fontSize: 22, color: osColors.green }}>›</Text>
              </View>
            </Pressable>
          </Link>
        ))}
      </View>

      <View style={{ gap: 9 }}>
        <SectionHeader
          title="Recent control-plane activity"
          body="Audited platform changes and administrative history stay available below the live action surface."
        />
        <DiagnosticDisclosure title="control-plane history" value={state.history} />
      </View>
    </ScrollView>
  );
}
