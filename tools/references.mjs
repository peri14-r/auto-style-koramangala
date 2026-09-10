import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/Periyasamy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-gpu-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
await context.addInitScript(()=>{Element.prototype.requestPointerLock=()=>{};Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{};});
for(const [name,url] of [['dribbble','https://dribbble.com/shots/26656768-Car-Detailing-Website-Inner-Page-Design'],['pinterest','https://in.pinterest.com/pin/web-design-landing-page-for-detailing-studio-in-2025--140033869659845221/'],['jimbo','https://jimbowash.com']]){const page=await context.newPage();try{await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});await page.waitForTimeout(1600);await page.screenshot({path:`scrollcraft/builds/showroom/${name}.png`});console.log(name,await page.title(),JSON.stringify(await page.locator('img').evaluateAll(xs=>xs.slice(0,10).map(x=>({alt:x.alt,src:x.currentSrc})))));}catch(e){console.log(name,e.message)}await page.close();}
await browser.close();
