;(()=>{
 const root=document.documentElement,pref=matchMedia('(prefers-reduced-motion: reduce)'),motion=document.getElementById('motionToggle'),button=document.getElementById('atmosphereToggle'),panel=document.getElementById('atmospherePanel');let paused=false;
 function sync(){const off=pref.matches||paused;root.dataset.motion=off?'off':'on';motion.disabled=pref.matches;motion.setAttribute('aria-pressed',String(off));motion.textContent=pref.matches?'Reduced motion active':off?'Resume atmosphere':'Pause atmosphere'}
 motion.addEventListener('click',()=>{paused=!paused;sync()});pref.addEventListener('change',sync);sync();
 function open(value){panel.hidden=!value;button.setAttribute('aria-expanded',String(value))}button.addEventListener('click',()=>open(panel.hidden));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){open(false);button.focus()}});
 for(const a of document.querySelectorAll('nav a'))if(a.getAttribute('href')===location.pathname)a.setAttribute('aria-current','page');
})();
