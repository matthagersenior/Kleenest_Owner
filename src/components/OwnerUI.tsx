import type { ReactNode } from 'react';
import { Pressable,Text,TextInput,View } from 'react-native';
import { getResolvedOwnerTheme,useOwnerTheme } from '@/services/theme';

export const colors=new Proxy({} as Record<string,string>,{
  get(_target,prop:string){
    const t=getResolvedOwnerTheme();
    const map:Record<string,string>={
      ink:t.ink,muted:t.muted,surface:t.surface,line:t.line,danger:t.danger,canvas:t.canvas,
      accent:t.accent,accentSoft:t.accentSoft,surfaceRaised:t.surfaceRaised,success:t.success,warning:t.warning,
    };
    return map[prop];
  }
}) as {ink:string;muted:string;surface:string;line:string;danger:string;canvas:string;accent:string;accentSoft:string;surfaceRaised:string;success:string;warning:string};

export const card=new Proxy({} as any,{
  ownKeys(){return['backgroundColor','borderRadius','borderCurve','padding','gap','borderWidth','borderColor']},
  getOwnPropertyDescriptor(){return{enumerable:true,configurable:true}},
  get(_target,prop:string){
    const t=getResolvedOwnerTheme();
    const map:any={backgroundColor:t.surface,borderRadius:18,borderCurve:'continuous',padding:15,gap:8,borderWidth:1,borderColor:t.line};
    return map[prop];
  }
}) as {backgroundColor:string;borderRadius:number;borderCurve:'continuous';padding:number;gap:number;borderWidth:number;borderColor:string};

export const input=new Proxy({} as any,{
  ownKeys(){return['backgroundColor','borderRadius','borderCurve','padding','borderWidth','borderColor','color']},
  getOwnPropertyDescriptor(){return{enumerable:true,configurable:true}},
  get(_target,prop:string){
    const t=getResolvedOwnerTheme();
    const map:any={backgroundColor:t.surfaceRaised,borderRadius:12,borderCurve:'continuous',padding:12,borderWidth:1,borderColor:t.line,color:t.ink};
    return map[prop];
  }
}) as {backgroundColor:string;borderRadius:number;borderCurve:'continuous';padding:number;borderWidth:number;borderColor:string;color:string};

export function Hero({eyebrow,title,body}:{eyebrow:string;title:string;body:string}){
  const t=useOwnerTheme();
  return <View style={{backgroundColor:t.accent,borderRadius:22,borderCurve:'continuous',padding:18,gap:6,borderWidth:1,borderColor:t.accent}}>
    <Text selectable style={{color:t.accentText,fontSize:12,fontWeight:'800',opacity:.82}}>{eyebrow}</Text>
    <Text selectable style={{color:t.accentText,fontSize:24,fontWeight:'800'}}>{title}</Text>
    <Text selectable style={{color:t.accentText,lineHeight:20,opacity:.9}}>{body}</Text>
  </View>;
}
export function Action({label,onPress,disabled=false}:{label:string;onPress:()=>void;disabled?:boolean}){
  const t=useOwnerTheme();
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={{alignSelf:'flex-start',backgroundColor:t.accent,borderRadius:999,paddingHorizontal:14,paddingVertical:10,opacity:disabled?.5:1}}><Text style={{color:t.accentText,fontWeight:'800'}}>{label}</Text></Pressable>;
}
export function Field(props:React.ComponentProps<typeof TextInput>){
  const t=useOwnerTheme();
  return <TextInput {...props} placeholderTextColor={props.placeholderTextColor??t.muted} style={[input,props.style]}/>;
}
export function Panel({title,children}:{title:string;children:ReactNode}){
  const t=useOwnerTheme();
  return <View style={card}><Text selectable style={{fontSize:18,fontWeight:'800',color:t.ink}}>{title}</Text>{children}</View>;
}
export function JsonPanel({title,value}:{title:string;value:unknown}){
  const t=useOwnerTheme();
  return <Panel title={title}><Text selectable style={{color:t.muted,lineHeight:19}}>{JSON.stringify(value??{},null,2)}</Text></Panel>;
}
export function ErrorBanner({message}:{message:string|null}){
  const t=useOwnerTheme();
  return message?<View style={{backgroundColor:t.danger+'18',borderRadius:14,borderCurve:'continuous',padding:12,borderWidth:1,borderColor:t.danger+'55'}}><Text selectable style={{color:t.danger}}>{message}</Text></View>:null;
}
