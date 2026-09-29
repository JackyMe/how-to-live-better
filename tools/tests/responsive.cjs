const {chooseChapter,showPreferences}=require('./helpers.cjs');
const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
for(const [width,height] of [[320,740],[390,844],[430,932],[640,900],[768,1024],[960,720],[1024,768],[1440,900],[1920,1080],[844,390]]){
 const p=await b.newPage({viewport:{width,height},reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto((process.env.TEST_URL||'http://127.0.0.1:4173/')+'?sec=2#guide-sleep');await p.waitForFunction(()=>document.querySelector('#guide-sleep')?.open);
 const overflow=()=>p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert(!(await overflow()),width+' document overflow');
 assert(await p.locator('#guide-sleep '+(width<=640?'.guide-art-mobile':'.guide-art-wide')).isVisible());
 assert.equal(await p.locator('#guide-sleep svg:visible').count(),1);
 assert((await p.locator('.guide-content').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize)))>=15);
 await showPreferences(p);
 for(const selector of ['#chapter-prev','#chapter-next','#quick-a','#quick-all','#text-size'])assert((await p.locator(selector).boundingBox()).height>=44,selector+' touch height');
 if(height<500)assert.equal(await p.locator('.reading-tools').evaluate(e=>getComputedStyle(e).position),'static');
 await p.locator('#text-size').click();assert((await p.locator('.guide-content').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize)))>=18);assert(!(await overflow()),'large text overflow '+width);await p.locator('#text-size').click();
 await p.locator('#guide-sleep').evaluate(e=>e.scrollIntoView({block:'start'}));
 assert.equal(await p.locator('.card:visible').count(),1);
 await p.locator('#guide-sleep figure').scrollIntoViewIfNeeded();await p.screenshot({path:'/tmp/better-responsive-'+width+'.png'});
 await p.locator('#theme').click();assert(!(await overflow()));
 if(width<=960){await p.locator('#menu').click();assert(await p.locator('#sidebar').evaluate(e=>e.classList.contains('open')));await p.locator('#f-sec [data-v="23"]').click();assert.equal(await p.locator('#chapter-select').inputValue(),'23');assert.equal(await p.locator('#menu').getAttribute('aria-expanded'),'false');}
 assert.deepEqual(errors,[]);console.log(width+' × '+height+' PASS');await p.close();
}
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
