import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Auto Style Koramangala | Make Every Drive Yours',description:'A website concept for Auto Style Koramangala: car accessories, lighting, audio, interiors and SUV styling with direct WhatsApp enquiries.',metadataBase:new URL('https://auto-style-koramangala-concept.speriya14.chatgpt.site'),robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
