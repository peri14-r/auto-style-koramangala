import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const{chromium}=require('C:/Users/Periyasamy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-unsafe-swiftshader']});
const ctx=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});await ctx.addInitScript(()=>{Element.prototype.requestPointerLock=()=>{};Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{};});
const page=await ctx.newPage();page.on('pageerror',e=>console.log('PAGE ERROR',e.message));page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
await page.goto('http://localhost:5190/',{waitUntil:'domcontentloaded',timeout:60000});await page.waitForTimeout(6000);await page.screenshot({path:'scrollcraft/builds/showroom/first-desktop.png'});console.log('SCENES',await page.locator('.car-scene').evaluateAll(xs=>xs.map(x=>({c:x.className,s:x.dataset.sceneState,r:x.getBoundingClientRect().toJSON()}))));
await page.locator('#studio').scrollIntoViewIfNeeded();await page.waitForTimeout(2500);await page.screenshot({path:'scrollcraft/builds/showroom/first-studio.png'});console.log('OVERFLOW',await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth})));
await browser.close();
