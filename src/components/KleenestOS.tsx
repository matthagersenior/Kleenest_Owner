import { ReactNode,useState } from 'react';
import { Pressable,Text,View } from 'react-native';
import { getResolvedOwnerTheme,useOwnerTheme } from '@/services/theme';

export const osColors=new Proxy({} as Record<string,string>,{
  get(_target,prop:string){
    const t=getResolvedOwnerTheme();
    const map:Record<string,string>={
      ink:t.ink,green:t.accent,mint:t.accentSoft,paper:t.canvas,white:t.surface,muted:t.muted,border:t.line,
      danger:t.danger,warning:t.warning,good:t.success
    };
    return map[prop];
  }
}) as {ink:string;green:string;mint:string;paper:string;white:string;muted:string;border:string;danger:string;warning:string;good:string};

export const osCard=new Proxy({} as any,{
  ownKeys(){return['backgroundColor','borderRadius','padding','borderWidth','borderColor','gap']},
  getOwnPropertyDescriptor(){return{enumerable:true,configurable:true}},
  get(_target,prop:string){
    const t=getResolvedOwnerTheme();
    const map:any={backgroundColor:t.surface,borderRadius:18,padding:15,borderWidth:1,borderColor:t.line,gap:7};
    return map[prop];
  }
}) as {backgroundColor:string;borderRadius:number;padding:number;borderWidth:number;borderColor:string;gap:number};

export function useOSCardStyle(){const t=useOwnerTheme();return{backgroundColor:t.surface,borderRadius:18,padding:15,borderWidth:1,borderColor:t.line,gap:7} as const}

export function OSHero({eyebrow,title,body,children}:{eyebrow:string;title:string;body:string;children?:ReactNode}){
  const t=useOwnerTheme();
  return <View style={{backgroundColor:t.accent,borderRadius:22,padding:18,gap:7,borderWidth:1,borderColor:t.accent}}>
    <Text style={{color:t.accentText,fontWeight:'900',letterSpacing:1.3,fontSize:10,opacity:.8}}>{eyebrow}</Text>
    <Text style={{color:t.accentText,fontSize:28,fontWeight:'900'}}>{title}</Text>
    <Text style={{color:t.accentText,lineHeight:20,opacity:.9}}>{body}</Text>{children}
  </View>
}

export function StatusPill({label,tone='neutral'}:{label:string;tone?:'good'|'warning'|'danger'|'neutral'}){
  const t=useOwnerTheme();
  const color=tone==='good'?t.success:tone==='warning'?t.warning:tone==='danger'?t.danger:t.muted;
  return <View style={{alignSelf:'flex-start',borderRadius:999,paddingHorizontal:9,paddingVertical:5,backgroundColor:t.surfaceRaised,borderWidth:1,borderColor:tone==='neutral'?t.line:color}}>
    <Text style={{color,fontWeight:'900',fontSize:11}}>{label}</Text>
  </View>
}

export function HealthCard({label,value,detail,tone='neutral',onPress}:{label:string;value:string|number;detail?:string;tone?:'good'|'warning'|'danger'|'neutral';onPress?:()=>void}){
  const t=useOwnerTheme();const card=useOSCardStyle();
  const body=<View style={{...card,minWidth:145,flexGrow:1}}><StatusPill label={label} tone={tone}/><Text style={{fontSize:25,fontWeight:'900',color:t.ink}}>{String(value)}</Text>{detail?<Text style={{color:t.muted,lineHeight:18}}>{detail}</Text>:null}</View>;
  return onPress?<Pressable onPress={onPress} style={{flexGrow:1,flexBasis:145}}>{body}</Pressable>:body;
}

export function SectionHeader({title,body,actionLabel,onAction}:{title:string;body?:string;actionLabel?:string;onAction?:()=>void}){
  const t=useOwnerTheme();
  return <View style={{gap:4}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8}}><Text style={{fontSize:19,fontWeight:'900',color:t.ink,flex:1}}>{title}</Text>{actionLabel&&onAction?<Pressable onPress={onAction}><Text style={{fontWeight:'900',color:t.accent}}>{actionLabel}</Text></Pressable>:null}</View>{body?<Text style={{color:t.muted,lineHeight:19}}>{body}</Text>:null}</View>
}

export function EntityRow({title,subtitle,meta,onPress,children}:{title:string;subtitle?:string;meta?:string;onPress?:()=>void;children?:ReactNode}){
  const t=useOwnerTheme();const card=useOSCardStyle();
  const body=<View style={card}><Text style={{fontSize:16,fontWeight:'900',color:t.ink}}>{title}</Text>{subtitle?<Text style={{color:t.muted}}>{subtitle}</Text>:null}{meta?<Text style={{fontSize:12,color:t.muted}}>{meta}</Text>:null}{children}</View>;
  return onPress?<Pressable onPress={onPress}>{body}</Pressable>:body;
}

export function ActionSheetCard({title,body,children}:{title:string;body?:string;children:ReactNode}){
  const t=useOwnerTheme();const card=useOSCardStyle();
  return <View style={card}><Text style={{fontSize:17,fontWeight:'900',color:t.ink}}>{title}</Text>{body?<Text style={{color:t.muted,lineHeight:19}}>{body}</Text>:null}{children}</View>
}

export function AuditTrailCard({reason,createdAt,actor}:{reason:string;createdAt?:string;actor?:string}){
  const t=useOwnerTheme();const card=useOSCardStyle();
  return <View style={{...card,padding:12}}><Text style={{fontWeight:'800',color:t.ink}}>{reason}</Text><Text style={{fontSize:12,color:t.muted}}>{[actor,createdAt].filter(Boolean).join(' · ')}</Text></View>
}

export function DiagnosticDisclosure({title,value}:{title:string;value:unknown}){
  const[open,setOpen]=useState(false);const t=useOwnerTheme();const card=useOSCardStyle();
  return <View style={card}><Pressable onPress={()=>setOpen(v=>!v)}><Text style={{fontWeight:'900',color:t.accent}}>{open?'Hide':'Show'} {title}</Text></Pressable>{open?<Text selectable style={{fontFamily:'monospace',fontSize:11,color:t.muted}}>{JSON.stringify(value,null,2)}</Text>:null}</View>
}

export function PrimaryAction({label,onPress,disabled=false,danger=false}:{label:string;onPress:()=>void;disabled?:boolean;danger?:boolean}){
  const t=useOwnerTheme();
  return <Pressable disabled={disabled} onPress={onPress} style={{alignSelf:'flex-start',borderRadius:12,paddingHorizontal:14,paddingVertical:11,backgroundColor:danger?t.danger:t.accent,opacity:disabled?.5:1}}><Text style={{color:t.accentText,fontWeight:'900'}}>{label}</Text></Pressable>
}
