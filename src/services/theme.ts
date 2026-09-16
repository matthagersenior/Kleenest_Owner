import * as SecureStore from 'expo-secure-store';
import { useEffect,useState } from 'react';
import { useColorScheme } from 'react-native';

export type OwnerThemeMode=
  'default'|'light'|'dark'|'system'|'early-access'|
  'founders'|'clean-slate'|'midnight-transit'|'neon-city'|'trailblazer'|'verified-gold'|
  'civic-atlas'|'road-warrior'|'community-builder'|'data-guardian'|
  'spring-renewal'|'summer-roadtrip'|'stl-edition'|'chicago-edition'|
  'fall'|'halloween'|'thanksgiving'|'christmas';

export type OwnerTheme={
  mode:OwnerThemeMode;resolved:'light'|'dark';canvas:string;surface:string;surfaceRaised:string;ink:string;muted:string;line:string;
  accent:string;accentSoft:string;accentText:string;danger:string;warning:string;success:string;statusBar:'light'|'dark';
};

export const OWNER_THEME_OPTIONS:ReadonlyArray<{value:OwnerThemeMode;label:string;description:string}>=[
  {value:'default',label:'Default',description:'Kleenest branded light environment.'},
  {value:'light',label:'Light',description:'Bright, high-contrast surfaces.'},
  {value:'dark',label:'Dark',description:'Low-light Owner surfaces.'},
  {value:'system',label:'System',description:'Follow this device appearance.'},
  {value:'early-access',label:'Early Access',description:'Beta theme for the people shaping Kleenest before launch.'},
  {value:'founders',label:'Founders Edition',description:'Obsidian, mint and restrained gold for early builders.'},
  {value:'clean-slate',label:'Clean Slate',description:'Ultra-clear, clinical surfaces for accuracy-first work.'},
  {value:'midnight-transit',label:'Midnight Transit',description:'Deep transit navy with electric route accents.'},
  {value:'neon-city',label:'Neon City',description:'Dense-market night energy with cyan and magenta signals.'},
  {value:'trailblazer',label:'Trailblazer',description:'Topographic field colors for expanding the map.'},
  {value:'verified-gold',label:'Verified Gold',description:'Charcoal and gold prestige for high-trust work.'},
  {value:'civic-atlas',label:'Civic Atlas',description:'Cartographic paper, civic blue and map-grid precision.'},
  {value:'road-warrior',label:'Road Warrior',description:'Asphalt, safety orange and highway white.'},
  {value:'community-builder',label:'Community Builder',description:'Warm social surfaces for community contribution.'},
  {value:'data-guardian',label:'Data Guardian',description:'Radar-grid dark mode for verification and data quality.'},
  {value:'spring-renewal',label:'Spring Renewal',description:'Fresh mint, blossom and rain-washed surfaces.'},
  {value:'summer-roadtrip',label:'Summer Roadtrip',description:'Sky, sand and roadside citrus.'},
  {value:'stl-edition',label:'St. Louis Edition',description:'Arch-inspired regional edition.'},
  {value:'chicago-edition',label:'Chicago Edition',description:'Lakefront blue, steel and signal red.'},
  {value:'fall',label:'Autumn Trail',description:'Parchment, copper, leaves and moss.'},
  {value:'halloween',label:'Night Watch',description:'Pumpkin fire, moonlight and midnight violet.'},
  {value:'thanksgiving',label:'Harvest Table',description:'Cranberry, walnut, copper and harvest gold.'},
  {value:'christmas',label:'Winter Guardian',description:'Evergreen night, snow, winter red and gold.'},
];

const STORAGE_KEY='kleenest.theme.mode.v1';
const MODES=new Set<OwnerThemeMode>(OWNER_THEME_OPTIONS.map(x=>x.value));
const listeners=new Set<(mode:OwnerThemeMode)=>void>();
let currentMode:OwnerThemeMode='default';
let systemDark=false;

type Edition=Omit<OwnerTheme,'mode'>;
const editions:Partial<Record<OwnerThemeMode,Edition>>={
  'early-access':{resolved:'dark',canvas:'#030712',surface:'#111d35',surfaceRaised:'#1d3153',ink:'#ffffff',muted:'#c2cee2',line:'#50698f',accent:'#e39bff',accentSoft:'#392647',accentText:'#06100d',danger:'#ff8fa3',warning:'#ffd166',success:'#66e3c4',statusBar:'light'},
  'founders':{resolved:'dark',canvas:'#050a09',surface:'#101a17',surfaceRaised:'#192a25',ink:'#fbfdfc',muted:'#bccbc5',line:'#3a544b',accent:'#66e3c4',accentSoft:'#173931',accentText:'#07120f',danger:'#ff8490',warning:'#e5bf65',success:'#66e3c4',statusBar:'light'},
  'clean-slate':{resolved:'light',canvas:'#e9f1ee',surface:'#ffffff',surfaceRaised:'#e8f0ee',ink:'#10211d',muted:'#52645f',line:'#bccdc8',accent:'#247466',accentSoft:'#dcece7',accentText:'#ffffff',danger:'#9a3838',warning:'#90631d',success:'#247466',statusBar:'dark'},
  'midnight-transit':{resolved:'dark',canvas:'#070d18',surface:'#101b2d',surfaceRaised:'#182943',ink:'#f5f8ff',muted:'#b4c3d8',line:'#334a69',accent:'#72b8ff',accentSoft:'#173653',accentText:'#06101a',danger:'#ff7f8c',warning:'#ffc86a',success:'#72d4b4',statusBar:'light'},
  'neon-city':{resolved:'dark',canvas:'#05070b',surface:'#11151d',surfaceRaised:'#1b2230',ink:'#f9fbff',muted:'#bbc4d1',line:'#3a4658',accent:'#ff7ad9',accentSoft:'#172d34',accentText:'#041311',danger:'#ff6281',warning:'#ffd65c',success:'#44f1a6',statusBar:'light'},
  'trailblazer':{resolved:'light',canvas:'#eee8d8',surface:'#fffaf0',surfaceRaised:'#e0d7bf',ink:'#263326',muted:'#5e6650',line:'#c6b994',accent:'#4d7044',accentSoft:'#dce5cf',accentText:'#ffffff',danger:'#8b4338',warning:'#8a651c',success:'#4d7044',statusBar:'dark'},
  'verified-gold':{resolved:'dark',canvas:'#0a0a09',surface:'#171714',surfaceRaised:'#24231e',ink:'#fffdf7',muted:'#c8c2ad',line:'#5a5236',accent:'#e7c45d',accentSoft:'#3b3216',accentText:'#1a1505',danger:'#ff7c7c',warning:'#e7c45d',success:'#88d2a2',statusBar:'light'},
  'civic-atlas':{resolved:'light',canvas:'#edf1ef',surface:'#fffdf8',surfaceRaised:'#e0e7e4',ink:'#172d39',muted:'#536875',line:'#bdc9ca',accent:'#315f78',accentSoft:'#dce8ed',accentText:'#ffffff',danger:'#934241',warning:'#8b651f',success:'#41745b',statusBar:'dark'},
  'road-warrior':{resolved:'dark',canvas:'#111314',surface:'#1d2022',surfaceRaised:'#2b3033',ink:'#f8faf9',muted:'#bec5c2',line:'#50595a',accent:'#f39a43',accentSoft:'#45301d',accentText:'#1a0f05',danger:'#ff7777',warning:'#f6c25d',success:'#78cf9d',statusBar:'light'},
  'community-builder':{resolved:'light',canvas:'#f6eee9',surface:'#fffaf6',surfaceRaised:'#ecdcd4',ink:'#382623',muted:'#755d57',line:'#d7bbb0',accent:'#8a546e',accentSoft:'#f0ddd6',accentText:'#ffffff',danger:'#9b3f42',warning:'#9b6a24',success:'#39745b',statusBar:'dark'},
  'data-guardian':{resolved:'dark',canvas:'#06100e',surface:'#0e1f1b',surfaceRaised:'#17332d',ink:'#ecfff9',muted:'#afd0c5',line:'#2e5a50',accent:'#51e3b8',accentSoft:'#143b32',accentText:'#04120d',danger:'#ff7786',warning:'#eacb63',success:'#51e3b8',statusBar:'light'},
  'spring-renewal':{resolved:'light',canvas:'#eef7ef',surface:'#fffefd',surfaceRaised:'#e2efe3',ink:'#203222',muted:'#617364',line:'#c3d5c4',accent:'#4f8b66',accentSoft:'#dff0e3',accentText:'#ffffff',danger:'#a14a55',warning:'#9d742d',success:'#4f8b66',statusBar:'dark'},
  'summer-roadtrip':{resolved:'light',canvas:'#edf7fb',surface:'#fffdf7',surfaceRaised:'#e6efe9',ink:'#20313a',muted:'#5d7079',line:'#bed0d7',accent:'#e57b37',accentSoft:'#fde7d6',accentText:'#ffffff',danger:'#a54242',warning:'#a8681e',success:'#3d8066',statusBar:'dark'},
  'stl-edition':{resolved:'dark',canvas:'#0c1420',surface:'#152335',surfaceRaised:'#20344d',ink:'#f8fbff',muted:'#b9c8d9',line:'#405a76',accent:'#f4c45f',accentSoft:'#3a321d',accentText:'#17200a',danger:'#e96b74',warning:'#f4c45f',success:'#78d0a2',statusBar:'light'},
  'chicago-edition':{resolved:'dark',canvas:'#09121c',surface:'#122338',surfaceRaised:'#1d3551',ink:'#f5f9ff',muted:'#b6c7da',line:'#3d5875',accent:'#71b7ed',accentSoft:'#173552',accentText:'#07131e',danger:'#ef6d74',warning:'#e6bf63',success:'#72d0ad',statusBar:'light'},
  'fall':{resolved:'light',canvas:'#e9ead8',surface:'#fbf8ea',surfaceRaised:'#ddd9b8',ink:'#21311f',muted:'#526042',line:'#c2bd92',accent:'#5f7138',accentSoft:'#dfe0be',accentText:'#ffffff',danger:'#963f36',warning:'#8b631c',success:'#4f7047',statusBar:'dark'},
  'halloween':{resolved:'dark',canvas:'#050208',surface:'#1b1024',surfaceRaised:'#332040',ink:'#fff7ed',muted:'#c9b8cf',line:'#594068',accent:'#d787ff',accentSoft:'#33203f',accentText:'#140a04',danger:'#ff718b',warning:'#ffb347',success:'#6fe7d8',statusBar:'light'},
  'thanksgiving':{resolved:'light',canvas:'#f3e6df',surface:'#fff8f3',surfaceRaised:'#e8cfc3',ink:'#321d1b',muted:'#76564f',line:'#d6b7aa',accent:'#7f3d38',accentSoft:'#ecd1c7',accentText:'#ffffff',danger:'#8d3138',warning:'#8b5d1d',success:'#56633b',statusBar:'dark'},
  'christmas':{resolved:'dark',canvas:'#07130f',surface:'#0e211a',surfaceRaised:'#163126',ink:'#f7fbf9',muted:'#b6c9c0',line:'#315044',accent:'#f0c75e',accentSoft:'#193d30',accentText:'#102018',danger:'#ef6a6a',warning:'#f0c75e',success:'#83d6a6',statusBar:'light'},
};

function validMode(value:unknown):value is OwnerThemeMode{return typeof value==='string'&&MODES.has(value as OwnerThemeMode)}
function storage(){const root=globalThis as any;try{return root?.localStorage??root?.window?.localStorage??null}catch{return null}}
export function setOwnerSystemDark(value:boolean){systemDark=value}
export function getOwnerThemeMode(){return currentMode}

export async function loadOwnerThemeMode():Promise<OwnerThemeMode>{
  let stored:string|null=null;const local=storage();
  if(local){try{stored=local.getItem(STORAGE_KEY)}catch{}}
  else{try{stored=await SecureStore.getItemAsync(STORAGE_KEY)}catch{}}
  currentMode=validMode(stored)?stored:'default';return currentMode;
}
export async function setOwnerThemeMode(mode:OwnerThemeMode){
  if(!validMode(mode))throw new Error('Unsupported Kleenest theme mode.');
  currentMode=mode;const local=storage();
  if(local){try{local.setItem(STORAGE_KEY,mode)}catch{}}
  else{try{await SecureStore.setItemAsync(STORAGE_KEY,mode)}catch{}}
  for(const listener of listeners)listener(mode);return mode;
}
export function subscribeOwnerTheme(listener:(mode:OwnerThemeMode)=>void){listeners.add(listener);return()=>listeners.delete(listener)}

export function resolveOwnerTheme(mode:OwnerThemeMode=currentMode,dark=systemDark):OwnerTheme{
  const edition=editions[mode];if(edition)return{mode,...edition};
  const resolved:OwnerTheme['resolved']=mode==='dark'||(mode==='system'&&dark)?'dark':'light';
  if(resolved==='dark')return{mode,resolved,canvas:'#050c08',surface:'#14241a',surfaceRaised:'#22372a',ink:'#ffffff',muted:'#c2cec7',line:'#4c6254',accent:'#bdabe8',accentSoft:'#2b2440',accentText:'#07110c',danger:'#ef8d8d',warning:'#e8bb68',success:'#75c99b',statusBar:'light'};
  const branded=mode==='default';
  return{mode,resolved,canvas:branded?'#edf3ef':'#f5f7f6',surface:'#ffffff',surfaceRaised:branded?'#e4ece7':'#eef2ef',ink:'#0b1b12',muted:'#4f5f56',line:'#b8c8bd',accent:'#65548f',accentSoft:'#ece8f5',accentText:'#ffffff',danger:'#8a3434',warning:'#9b6518',success:'#2f7a53',statusBar:'dark'};
}
export function getResolvedOwnerTheme(){return resolveOwnerTheme(currentMode,systemDark)}
export function useOwnerTheme(){
  const scheme=useColorScheme();const[mode,setMode]=useState<OwnerThemeMode>(currentMode);
  useEffect(()=>{setOwnerSystemDark(scheme==='dark')},[scheme]);
  useEffect(()=>{let active=true;void loadOwnerThemeMode().then(v=>{if(active)setMode(v)});const unsubscribe=subscribeOwnerTheme(v=>{if(active)setMode(v)});return()=>{active=false;unsubscribe()}},[]);
  return resolveOwnerTheme(mode,scheme==='dark');
}
