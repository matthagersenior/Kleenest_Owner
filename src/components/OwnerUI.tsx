import type { ReactNode } from 'react';
import { Pressable,Text,TextInput,View } from 'react-native';

export const colors={ink:'#132b21',muted:'#627269',surface:'#ffffff',line:'#dce4df',danger:'#8b2d2d',canvas:'#f4f6f5'};
export const card={backgroundColor:colors.surface,borderRadius:18,borderCurve:'continuous' as const,padding:15,gap:8,boxShadow:'0 1px 2px rgba(0,0,0,0.05)' as const};
export const input={backgroundColor:colors.surface,borderRadius:12,borderCurve:'continuous' as const,padding:12,borderWidth:1,borderColor:colors.line};
export function Hero({eyebrow,title,body}:{eyebrow:string;title:string;body:string}){return <View style={{backgroundColor:colors.ink,borderRadius:22,borderCurve:'continuous',padding:18,gap:6}}><Text selectable style={{color:'#bde4cf',fontSize:12,fontWeight:'800'}}>{eyebrow}</Text><Text selectable style={{color:'white',fontSize:24,fontWeight:'800'}}>{title}</Text><Text selectable style={{color:'#dce8e1',lineHeight:20}}>{body}</Text></View>}
export function Action({label,onPress,disabled=false}:{label:string;onPress:()=>void;disabled?:boolean}){return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={{alignSelf:'flex-start',backgroundColor:colors.ink,borderRadius:999,paddingHorizontal:14,paddingVertical:10,opacity:disabled?.5:1}}><Text style={{color:'white',fontWeight:'800'}}>{label}</Text></Pressable>}
export function Field(props:React.ComponentProps<typeof TextInput>){return <TextInput {...props} style={[input,props.style]}/>}
export function Panel({title,children}:{title:string;children:ReactNode}){return <View style={card}><Text selectable style={{fontSize:18,fontWeight:'800'}}>{title}</Text>{children}</View>}
export function JsonPanel({title,value}:{title:string;value:unknown}){return <Panel title={title}><Text selectable style={{color:colors.muted,lineHeight:19}}>{JSON.stringify(value??{},null,2)}</Text></Panel>}
export function ErrorBanner({message}:{message:string|null}){return message?<View style={{backgroundColor:'#fff0f0',borderRadius:14,borderCurve:'continuous',padding:12}}><Text selectable style={{color:colors.danger}}>{message}</Text></View>:null}
