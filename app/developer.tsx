import { Link } from 'expo-router';
import { Pressable,ScrollView,Text,View } from 'react-native';
import { OSHero,SectionHeader,useOSCardStyle } from '@/components/KleenestOS';
import { useOwnerTheme } from '@/services/theme';
const routes=[
 ['/capabilities','System Capabilities','Canonical product capability registry and release state.'],
 ['/data','Data Workbench','Audited advanced platform data work.'],
 ['/intelligence','Intelligence Lab','Network intelligence and operating signals.'],
 ['/reports','Reporting','Platform reporting schedules and output.'],
 ['/audit','System Audit','Capability/schema audit and owner activity.'],
] as const;
export default function Developer(){
 const theme=useOwnerTheme();const card=useOSCardStyle();
 return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{padding:16,gap:16,paddingBottom:84,backgroundColor:theme.canvas}}>
  <OSHero eyebrow="KLEENESTOS · DEVELOPER" title="Developer" body="Developer-platform, capability, data and diagnostic controls."/>
  <View style={{gap:9}}><SectionHeader title="Developer controls"/>
   {routes.map(([href,title,body])=><Link key={href} href={href as any} asChild><Pressable style={card}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><View style={{flex:1,gap:3}}><Text style={{fontSize:17,fontWeight:'900',color:theme.ink}}>{title}</Text><Text style={{color:theme.muted,lineHeight:19}}>{body}</Text></View><Text style={{fontSize:24,color:theme.accent}}>›</Text></View></Pressable></Link>)}
  </View>
 </ScrollView>
}
