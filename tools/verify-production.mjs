import fs from 'node:fs';
import {chromium} from 'playwright-core';
const out='scrollcraft/builds/showroom/verification';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-unsafe-swiftshader']});
try {
const context=await browser.newContext({viewport:{width:1440,height:1000}});
await context.addInitScript(()=>{Element.prototype.requestPointerLock=()=>{};Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{};window.__opened=[];window.open=url=>{window.__opened.push(url);return null;};});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
await page.goto('http://127.0.0.1:5191/',{waitUntil:'domcontentloaded'});await page.waitForSelector('.hero-scene.ready');await page.waitForTimeout(1000);
await page.mouse.move(100,400);await page.waitForTimeout(900);await page.locator('.hero-scene').screenshot({path:out+'/pointer-left.png'});
await page.mouse.move(1200,700);await page.waitForTimeout(900);await page.locator('.hero-scene').screenshot({path:out+'/pointer-right.png'});
await page.locator('.swatch').filter({hasText:'Graphite'}).click();await page.getByLabel('What do you drive?').fill('Hyundai i20');await page.locator('button[type=submit]').click();
const result={errors,title:await page.title(),draftComplete:await page.evaluate(()=>decodeURIComponent(window.__opened[0]||'').includes('Graphite')),overflow:await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)};
fs.writeFileSync(out+'/production.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(errors.length||!result.draftComplete||result.overflow)process.exitCode=1;
}finally{await browser.close();}
