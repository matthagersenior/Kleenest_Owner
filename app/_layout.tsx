import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout(){return <><StatusBar style="auto"/><Stack screenOptions={{headerLargeTitle:true,headerShadowVisible:false,contentStyle:{backgroundColor:'#f4f6f5'}}}><Stack.Screen name="index" options={{title:'Kleenest Owner'}}/></Stack></>}
