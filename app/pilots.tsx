import { Link } from 'expo-router';
import { Pressable,ScrollView,Text,View } from 'react-native';
import { OSHero,SectionHeader,useOSCardStyle } from '@/components/KleenestOS';
import { useOwnerTheme } from '@/services/theme';
const routes=[
 ['/creator-missions','Creator Missions','Prepare creator assignments, QR/tracking links and activation controls.'],
 ['/businesses','Business Pilot Network','Manage participating businesses, locations and verification state.'],
 ['/reports','Pilot Reporting','Inspect reporting output and pilot evidence.'],
 ['/intelligence','Pilot Intelligence','Review operating signals and recommendations that affect pilots.'],
] as const;
export default function Pilots(){
 const theme=useOwnerTheme();const card=useOSCardStyle();
 return <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{padding:16,gap:16,paddingBottom:84,backgroundColor:theme.canvas}}>
  <OSHero eyebrow="KLEENESTOS · PILOTS" title="Pilots" body="Creator, business and evidence workflows for proving the network in-market."/>
  <View style={{gap:9}}><SectionHeader title="Pilot workspace"/>
   {routes.map(([href,title,body])=><Link key={href} href={href as any} asChild><Pressable style={card}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><View style={{flex:1,gap:3}}><Text style={{fontSize:17,fontWeight:'900',color:theme.ink}}>{title}</Text><Text style={{color:theme.muted,lineHeight:19}}>{body}</Text></View><Text style={{fontSize:24,color:theme.accent}}>›</Text></View></Pressable></Link>)}
  </View>
 </ScrollView>
}
