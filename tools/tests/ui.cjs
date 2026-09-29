const {chooseChapter,showPreferences}=require('./helpers.cjs');
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {resolve}=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const ready=async p=>{await p.waitForFunction(()=>document.querySelector('#tot')?.textContent==='552')};
 const waitCount=async n=>page.waitForFunction(n=>Number(document.querySelector('#cnt').textContent)===n,n);
 const checks=[];
 try {
 await page.goto('http://127.0.0.1:4173');await ready(page);
 assert.equal(await page.locator('.card').count(),552);assert.equal(await page.locator('.sec-block').count(),32);checks.push('552 entries / 32 chapters rendered');
 await page.screenshot({path:'design/desktop.png'});
 await page.locator('[data-path="health"]').click();
 await page.waitForFunction(()=>Number(document.querySelector('#cnt').textContent)===143);assert.match(page.url(),/sec=/);const health=Number(await page.locator('#cnt').textContent());assert(health>0&&health<552);checks.push('scenario navigation filters chapters');
 await page.locator('#clear-top').click();await waitCount(552);
 await page.locator('#q').fill('安全带');await page.waitForFunction(()=>document.querySelector('#cnt').textContent!=='552');assert(Number(await page.locator('#cnt').textContent())>0);checks.push('keyword search produces matching results');
 await page.locator('#q').fill('zzzz_nonexistent_24979');await waitCount(0);assert(await page.locator('#empty').isVisible());await page.locator('#reset2').click();await waitCount(552);checks.push('empty state and reset');
 await page.locator('#easy-start').click();await page.waitForFunction(()=>location.search.includes('will='));assert.match(page.url(),/money=0/);assert.match(decodeURIComponent(page.url()),/will=否/);assert(Number(await page.locator('#cnt').textContent())>0);checks.push('zero-cost / low-effort combined filtering');
 await page.locator('#clear-top').click();await waitCount(552);
 await chooseChapter(page,'1');await showPreferences(page);await page.locator('#e-1-1 .save-button').click();assert.equal(await page.locator('#saved-count').textContent(),'1');await page.locator('#saved-filter').click();await waitCount(1);assert(await page.locator('#e-1-1').isVisible());
 await page.reload();await ready(page);assert.equal(await page.locator('#saved-count').textContent(),'1');assert.equal(await page.locator('#e-1-1 .save-button').getAttribute('aria-pressed'),'true');checks.push('bookmark persisted across reload');
 await showPreferences(page);await page.locator('#text-size').click();assert(await page.locator('html').evaluate(el=>el.classList.contains('large-text')));await page.reload();await ready(page);assert.equal(await page.locator('#text-size').getAttribute('aria-pressed'),'true');await showPreferences(page);await page.locator('#text-size').click();checks.push('reading font preference persisted');
 await page.locator('#e-1-1 .src summary').click();assert(await page.locator('#e-1-1 .src .body a').first().isVisible());checks.push('expand original citations');
 await page.locator('#theme').click();assert(await page.locator('html').evaluate(el=>el.classList.contains('dark')));await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'design/dark.png'});await page.locator('#theme').click();checks.push('dark theme');
 await page.locator('#library').scrollIntoViewIfNeeded();await page.screenshot({path:'design/library.png'});
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto('http://127.0.0.1:4173');await ready(mobile);assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await mobile.screenshot({path:'design/mobile.png'});
 await mobile.locator('#mobile-filter').click();assert(await mobile.locator('#sidebar').evaluate(el=>el.classList.contains('open')));await mobile.locator('#f-sec [data-v="13"]').click();assert.equal(await mobile.locator('#menu').getAttribute('aria-expanded'),'false');assert.match(mobile.url(),/sec=13/);await mobile.screenshot({path:'design/mobile-library.png'});checks.push('390px responsive layout and filter drawer');
 await mobile.setViewportSize({width:320,height:740});assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));checks.push('320px narrow viewport without horizontal overflow');
 const offline=await browser.newContext({offline:true,viewport:{width:1280,height:900},reducedMotion:'reduce'});const op=await offline.newPage();op.on('pageerror',e=>errors.push(e.message));let remoteRequests=0;op.on('request',req=>{if(/^https?:/.test(req.url()))remoteRequests++});await op.goto(pathToFileURL(resolve('dist/HowToLiveBetter.html')).href);await ready(op);await op.locator('#q').fill('安全带');await op.waitForFunction(()=>Number(document.querySelector('#cnt').textContent)>0&&Number(document.querySelector('#cnt').textContent)<552);assert.equal(remoteRequests,0);checks.push('file:// fully offline: all content loaded, search works, zero HTTP requests');
 assert.deepEqual(errors,[]);checks.push('zero browser runtime errors');
 console.log(JSON.stringify({passed:checks.length,checks},null,2));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
