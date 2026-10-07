import Head from 'expo-router/head';
import { useEffect } from 'react';
import Communications from './communications';

const base=(process.env.EXPO_PUBLIC_WEB_BASE_URL||'').replace(/\/$/,'');
const manifestHref=`${base}/mail-manifest.json`;
const serviceWorkerHref=`${base}/mail-sw.js`;
const iconHref=`${base}/mail-icon.svg`;

export default function KleenestMail(){
  useEffect(()=>{
    const nav=(globalThis as any)?.navigator;
    if(nav?.serviceWorker){
      nav.serviceWorker.register(serviceWorkerHref).catch(()=>undefined);
    }
  },[]);

  return <>
    <Head>
      <title>Kleenest Mail</title>
      <meta name="description" content="Secure Kleenest email for personal and operational @kleenest.us mailboxes."/>
      <meta name="theme-color" content="#0d4f3c"/>
      <meta name="application-name" content="Kleenest Mail"/>
      <meta name="apple-mobile-web-app-capable" content="yes"/>
      <meta name="apple-mobile-web-app-title" content="Kleenest Mail"/>
      <link rel="manifest" href={manifestHref}/>
      <link rel="icon" href={iconHref}/>
    </Head>
    <Communications/>
  </>;
}
