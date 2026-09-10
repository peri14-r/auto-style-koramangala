import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Auto Style Koramangala | Anything But Ordinary',description:'Explore the Auto Style concept showroom. Discover car accessories, exterior styling, lighting, audio and interior ideas for your next upgrade in Koramangala.',metadataBase:new URL('https://auto-style-koramangala-concept.speriya14.chatgpt.site'),robots:{index:false,follow:false},icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><head><link rel="stylesheet" href="/scrollcraft/scrollcraft.css"/><link rel="preload" href="/fonts/barlow-condensed-800.ttf" as="font" type="font/ttf" crossOrigin="anonymous"/></head><body>{children}</body></html>}

