import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { Action, ErrorBanner, Hero, JsonPanel, card, colors } from "@/components/OwnerUI";
import { getOwnerControlPlaneBundle, getSession, runCapabilityAudit } from "@/services/controlPlane";

type Bundle = Awaited<ReturnType<typeof getOwnerControlPlaneBundle>>;
const links = [
  ["/access","Product access","Business, Fleet and Enterprise entitlement authority."],
  ["/operations","Platform operations","Health, ingestion, moderation, notification and resource state."],
  ["/progression","Discovery + progression","Canonical discoveries, evidence tiers, XP economy, objectives and cross-product progression."],
  ["/audit","Audit & activity","Raw-schema audits, canonical-domain checks and platform events."],
  ["/capabilities","Capability catalog","Operational, CRUD, classification and retirement authority."],
  ["/intelligence","Cross-network intelligence","Live Business, Fleet and Enterprise intelligence RPCs."],
  ["/reports","Reporting history","Schedules and delivery runs across governed scopes."],
  ["/data","Data workbench","Approved resources through the audited admin gateway."],
] as const;
function count(value: unknown) { if (Array.isArray(value)) return value.length; if (value && typeof value === "object") return Object.keys(value as object).length; return 0; }
export default function OwnerControlPlane() {
  const [bundle, setBundle] = useState<Bundle | null>(null),[loading, setLoading] = useState(true),[refreshing, setRefreshing] = useState(false),[running, setRunning] = useState(false),[error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { if (!(await getSession())) throw new Error("Platform Owner authentication required."); setBundle(await getOwnerControlPlaneBundle()); }, []);
  useEffect(() => { load().catch((e) => setError(e instanceof Error ? e.message : String(e))).finally(() => setLoading(false)); }, [load]);
  async function refresh() { setRefreshing(true); setError(null); try { await load(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setRefreshing(false); } }
  async function audit() { setRunning(true); setError(null); try { await runCapabilityAudit(); await load(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setRunning(false); } }
  if (loading) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator size="large" /></View>;
  return <ScrollView contentInsetAdjustmentBehavior="automatic" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 56 }}>
    <Hero eyebrow="PRIVATE PLATFORM CONTROL PLANE" title="Kleenest Owner" body="Authoritative oversight across Consumer, Business, Fleet and Enterprise without replicating customer applications." />
    <ErrorBanner message={error} />
    {error ? <Link href="/auth" asChild><Pressable style={{ alignSelf: "flex-start", backgroundColor: "#132b21", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 }}><Text style={{ color: "white", fontWeight: "800" }}>Sign in as platform owner</Text></Pressable></Link> : null}
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}><Metric label="Pending businesses" value={count(bundle?.pending)} /><Metric label="Capability groups" value={count(bundle?.classifications)} /><Metric label="Retirement rows" value={count(bundle?.retirement)} /><Metric label="Domain issues" value={count(bundle?.domainIssues)} /></View>
    <View style={{ ...card, backgroundColor:'#132b21', gap:6 }}><Text style={{color:'#bfe0cb',fontWeight:'900',fontSize:11,letterSpacing:1}}>CANONICAL ENGAGEMENT GRAPH</Text><Text style={{color:'white',fontSize:20,fontWeight:'900'}}>Discovery, evidence and progression now share a governed control-plane view.</Text><Text style={{color:'#dce8e1',lineHeight:20}}>Owner can inspect evidence tier mix, total XP, active quests/missions/challenges/journeys/campaigns/contests and Fleet progression without creating a second customer-facing reward authority.</Text></View>
    <View style={{ gap: 10 }}>{links.map(([href, title, body]) => <Link key={href} href={href} asChild><Pressable style={card}><Text selectable style={{ fontSize: 18, fontWeight: "800" }}>{title}</Text><Text selectable style={{ color: colors.muted }}>{body}</Text></Pressable></Link>)}</View>
    <Action label={running ? "Running audit…" : "Run capability audit"} disabled={running} onPress={audit} />
    <JsonPanel title="Platform snapshot" value={bundle?.snapshot} /><JsonPanel title="Control-plane history" value={bundle?.history} /><JsonPanel title="Capability classification" value={bundle?.classifications} /><JsonPanel title="Domain issues" value={bundle?.domainIssues} /><JsonPanel title="Pending business administration" value={bundle?.pending} />
  </ScrollView>;
}
function Metric({ label, value }: { label: string; value: number }) { return <View style={{ ...card, minWidth: 125, flexGrow: 1 }}><Text selectable style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>{label}</Text><Text selectable style={{ fontSize: 24, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{value}</Text></View>; }
