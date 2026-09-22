import { Link } from 'expo-router';
import { Pressable,ScrollView,Text,View } from 'react-native';
import { OSHero,SectionHeader,useOSCardStyle } from '@/components/KleenestOS';
import { useOwnerTheme } from '@/services/theme';
const routes=[
 ['/access','People & Access','Users, roles, subscriptions and authority.'],
 ['/businesses','Businesses & Network','Locations, memberships, verification and entitlements.'],
 ['/progression','Economy & Progression','XP, levels, objectives, rewards and progression policy.'],
 ['/creator-missions','Creator Missions','Creator assignments, tracking links and mission QR codes.'],
 ['/sponsored-ads','Sponsored Advertising','Campaign approval, placement CRUD, serving controls and performance.'],
 ['/moderation','Trust & Moderation','Reports, safety and trust queues.'],
 ['/email-notifications','Email Notifications','Operational alerts, digests, audits and delivery history.'],
 ['/audit','System Audit','Capability and owner activity audits.'],
] as const;
export default function Control(){
 const theme=useOwnerTheme();const card=useOSCardStyle();
 return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{padding:16,gap:16,paddingBottom:84,backgroundColor:theme.canvas}}>
  <OSHero eyebrow="KLEENESTOS · CONTROL" title="Control Center" body="Daily owner authority in one place."/>
  <View style={{gap:9}}><SectionHeader title="Platform controls" body="Direct actions, not duplicate dashboards."/>
   {routes.map(([href,title,body])=><Link key={href} href={href as any} asChild><Pressable style={card}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><View style={{flex:1,gap:3}}><Text style={{fontSize:17,fontWeight:'900',color:theme.ink}}>{title}</Text><Text style={{color:theme.muted,lineHeight:19}}>{body}</Text></View><Text style={{fontSize:24,color:theme.accent}}>›</Text></View></Pressable></Link>)}
  </View>
 </ScrollView>
}
