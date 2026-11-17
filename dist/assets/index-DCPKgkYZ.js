(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function t(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(s){if(s.ep)return;s.ep=!0;const r=t(s);fetch(s.href,r)}})();/**
* @vue/shared v3.5.45
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/function Ll(n){const e=Object.create(null);for(const t of n.split(","))e[t]=1;return t=>t in e}const ct={},$i=[],kn=()=>{},Vf=()=>!1,Oo=n=>n.charCodeAt(0)===111&&n.charCodeAt(1)===110&&(n.charCodeAt(2)>122||n.charCodeAt(2)<97),Fo=n=>n.startsWith("onUpdate:"),Lt=Object.assign,Dl=(n,e)=>{const t=n.indexOf(e);t>-1&&n.splice(t,1)},lp=Object.prototype.hasOwnProperty,st=(n,e)=>lp.call(n,e),Oe=Array.isArray,Pi=n=>Cr(n)==="[object Map]",pi=n=>Cr(n)==="[object Set]",fc=n=>Cr(n)==="[object Date]",We=n=>typeof n=="function",St=n=>typeof n=="string",jn=n=>typeof n=="symbol",at=n=>n!==null&&typeof n=="object",Gf=n=>(at(n)||We(n))&&We(n.then)&&We(n.catch),kf=Object.prototype.toString,Cr=n=>kf.call(n),cp=n=>Cr(n).slice(8,-1),Wf=n=>Cr(n)==="[object Object]",Il=n=>St(n)&&n!=="NaN"&&n[0]!=="-"&&""+parseInt(n,10)===n,or=Ll(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"),Bo=n=>{const e=Object.create(null);return t=>e[t]||(e[t]=n(t))},up=/-\w/g,tn=Bo(n=>n.replace(up,e=>e.slice(1).toUpperCase())),fp=/\B([A-Z])/g,os=Bo(n=>n.replace(fp,"-$1").toLowerCase()),zo=Bo(n=>n.charAt(0).toUpperCase()+n.slice(1)),aa=Bo(n=>n?`on${zo(n)}`:""),Hn=(n,e)=>!Object.is(n,e),po=(n,...e)=>{for(let t=0;t<n.length;t++)n[t](...e)},Xf=(n,e,t,i=!1)=>{Object.defineProperty(n,e,{configurable:!0,enumerable:!1,writable:i,value:t})},Pr=n=>{const e=parseFloat(n);return isNaN(e)?n:e};let dc;const Ho=()=>dc||(dc=typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:{});function en(n){if(Oe(n)){const e={};for(let t=0;t<n.length;t++){const i=n[t],s=St(i)?mp(i):en(i);if(s)for(const r in s)e[r]=s[r]}return e}else if(St(n)||at(n))return n}const dp=/;(?![^(]*\))/g,hp=/:([^]+)/,pp=/"(?:[^"\\]|\\[^])*"|'(?:[^'\\]|\\[^])*'|\\[^]|\/\*[^]*?\*\//g;function mp(n){const e={};return n.replace(pp,t=>t.startsWith("/*")?"":t).split(dp).forEach(t=>{if(t){const i=t.split(hp);i.length>1&&(e[i[0].trim()]=i[1].trim())}}),e}function Vn(n){let e="";if(St(n))e=n;else if(Oe(n))for(let t=0;t<n.length;t++){const i=Vn(n[t]);i&&(e+=i+" ")}else if(at(n))for(const t in n)n[t]&&(e+=t+" ");return e.trim()}const gp="itemscope,allowfullscreen,disablepictureinpicture,disableremoteplayback,formnovalidate,ismap,nomodule,novalidate,playsinline,readonly",_p=Ll(gp);function jf(n){return!!n||n===""}function vp(n,e,t){if(n.length!==e.length)return!1;let i=!0;for(let s=0;i&&s<n.length;s++)i=mi(n[s],e[s],t);return i}function hc(n,e,t){if(n.size!==e.size)return!1;const i=Array.from(e),s=new Uint8Array(i.length);for(const r of n){let a=-1;for(let o=0;o<i.length;o++)if(!s[o]&&mi(r,i[o],t)){a=o;break}if(a<0)return!1;s[a]=1}return!0}function xp(n,e,t){let i=Pi(n),s=Pi(e);if(i||s||(i=pi(n),s=pi(e),i||s))return i&&s?hc(n,e,t):!1;const r=Object.keys(n).length,a=Object.keys(e).length;if(r!==a)return!1;for(const o in n){const l=n.hasOwnProperty(o),u=e.hasOwnProperty(o);if(l&&!u||!l&&u||!mi(n[o],e[o],t))return!1}return String(n)===String(e)}function pc(n,e,t,i){t||(t=[new Map,new Map]);const[s,r]=t;if(s.has(n)||r.has(e))return s.get(n)===e&&r.get(e)===n;s.set(n,e),r.set(e,n);const a=i(n,e,t);return s.delete(n),r.delete(e),a}function mi(n,e,t){if(n===e)return!0;let i=fc(n),s=fc(e);return i||s?i&&s?n.getTime()===e.getTime():!1:(i=jn(n),s=jn(e),i||s?n===e:(i=Oe(n),s=Oe(e),i||s?i&&s?pc(n,e,t,vp):!1:(i=at(n),s=at(e),i||s?!i||!s?!1:pc(n,e,t,xp):String(n)===String(e))))}function Ul(n,e){return n.findIndex(t=>mi(t,e))}const qf=n=>!!(n&&n.__v_isRef===!0),xe=n=>St(n)?n:n==null?"":Oe(n)||at(n)&&(n.toString===kf||!We(n.toString))?qf(n)?xe(n.value):JSON.stringify(n,Yf,2):String(n),Yf=(n,e)=>qf(e)?Yf(n,e.value):Pi(e)?{[`Map(${e.size})`]:[...e.entries()].reduce((t,[i,s],r)=>(t[la(i,r)+" =>"]=s,t),{})}:pi(e)?{[`Set(${e.size})`]:[...e.values()].map(t=>la(t))}:jn(e)?la(e):at(e)&&!Oe(e)&&!Wf(e)?String(e):e,la=(n,e="")=>{var t;return jn(n)?`Symbol(${(t=n.description)!=null?t:e})`:n};/**
* @vue/reactivity v3.5.45
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/let Ft;class Mp{constructor(e=!1){this.detached=e,this._active=!0,this._on=0,this.effects=[],this.cleanups=[],this._isPaused=!1,this._warnOnRun=!0,this.__v_skip=!0,!e&&Ft&&(Ft.active?(this.parent=Ft,this.index=(Ft.scopes||(Ft.scopes=[])).push(this)-1):(this._active=!1,this._warnOnRun=!1))}get active(){return this._active}pause(){if(this._active){this._isPaused=!0;let e,t;if(this.scopes){const i=this.scopes.slice();for(e=0,t=i.length;e<t;e++)i[e].pause()}for(e=0,t=this.effects.length;e<t;e++)this.effects[e].pause()}}resume(){if(this._active&&this._isPaused){this._isPaused=!1;let e,t;if(this.scopes){const s=this.scopes.slice();for(e=0,t=s.length;e<t;e++)s[e].resume()}const i=this.effects.slice();for(e=0,t=i.length;e<t;e++)i[e].resume()}}run(e){if(this._active){const t=Ft;try{return Ft=this,e()}finally{Ft=t}}}on(){++this._on===1&&(this.prevScope=Ft,Ft=this)}off(){if(this._on>0&&--this._on===0){if(Ft===this)Ft=this.prevScope;else{let e=Ft;for(;e;){if(e.prevScope===this){e.prevScope=this.prevScope;break}e=e.prevScope}}this.prevScope=void 0}}stop(e){if(this._active){this._active=!1;let t,i;for(t=0,i=this.effects.length;t<i;t++)this.effects[t].stop();for(this.effects.length=0,t=0,i=this.cleanups.length;t<i;t++)this.cleanups[t]();if(this.cleanups.length=0,this.scopes){const s=this.scopes.slice();for(t=0,i=s.length;t<i;t++)s[t].stop(!0);this.scopes.length=0}if(!this.detached&&this.parent&&!e){const s=this.parent.scopes.pop();s&&s!==this&&(this.parent.scopes[this.index]=s,s.index=this.index)}this.parent=void 0}}}function Sp(){return Ft}let ft;const ca=new WeakSet;class Kf{constructor(e){this.fn=e,this.deps=void 0,this.depsTail=void 0,this.flags=5,this.next=void 0,this.cleanup=void 0,this.scheduler=void 0,Ft&&(Ft.active?Ft.effects.push(this):this.flags&=-2)}pause(){this.flags|=64}resume(){this.flags&64&&(this.flags&=-65,ca.has(this)&&(ca.delete(this),this.trigger()))}notify(){this.flags&2&&!(this.flags&32)||this.flags&8||Zf(this)}run(){if(!(this.flags&1))return this.fn();this.flags|=2,mc(this),Jf(this);const e=ft,t=Rn;ft=this,Rn=!0;try{return this.fn()}finally{Qf(this),ft=e,Rn=t,this.flags&=-3}}stop(){if(this.flags&1){for(let e=this.deps;e;e=e.nextDep)Fl(e);this.deps=this.depsTail=void 0,mc(this),this.onStop&&this.onStop(),this.flags&=-2}}trigger(){this.flags&64?ca.add(this):this.scheduler?this.scheduler():this.runIfDirty()}runIfDirty(){rl(this)&&this.run()}get dirty(){return rl(this)}}let $f=0,ar,lr;function Zf(n,e=!1){if(n.flags|=8,e){n.next=lr,lr=n;return}n.next=ar,ar=n}function Nl(){$f++}function Ol(){if(--$f>0)return;if(lr){let e=lr;for(lr=void 0;e;){const t=e.next;e.next=void 0,e.flags&=-9,e=t}}let n;for(;ar;){let e=ar;for(ar=void 0;e;){const t=e.next;if(e.next=void 0,e.flags&=-9,e.flags&1)try{e.trigger()}catch(i){n||(n=i)}e=t}}if(n)throw n}function Jf(n){for(let e=n.deps;e;e=e.nextDep)e.version=-1,e.prevActiveLink=e.dep.activeLink,e.dep.activeLink=e}function Qf(n){let e,t=n.depsTail,i=t;for(;i;){const s=i.prevDep;i.version===-1?(i===t&&(t=s),Fl(i),yp(i)):e=i,i.dep.activeLink=i.prevActiveLink,i.prevActiveLink=void 0,i=s}n.deps=e,n.depsTail=t}function rl(n){for(let e=n.deps;e;e=e.nextDep)if(e.dep.version!==e.version||e.dep.computed&&(ed(e.dep.computed)||e.dep.version!==e.version))return!0;return!!n._dirty}function ed(n){if(n.flags&4&&!(n.flags&16)||(n.flags&=-17,n.globalVersion===gr)||(n.globalVersion=gr,!n.isSSR&&n.flags&128&&(!n.deps&&!n._dirty||!rl(n))))return;n.flags|=2;const e=n.dep,t=ft,i=Rn;ft=n,Rn=!0;try{Jf(n);const s=n.fn(n._value);(e.version===0||Hn(s,n._value))&&(n.flags|=128,n._value=s,e.version++)}catch(s){throw e.version++,s}finally{ft=t,Rn=i,Qf(n),n.flags&=-3}}function Fl(n,e=!1){const{dep:t,prevSub:i,nextSub:s}=n;if(i&&(i.nextSub=s,n.prevSub=void 0),s&&(s.prevSub=i,n.nextSub=void 0),t.subs===n&&(t.subs=i,!i&&t.computed)){t.computed.flags&=-5;for(let r=t.computed.deps;r;r=r.nextDep)Fl(r,!0)}!e&&!--t.sc&&t.map&&t.map.delete(t.key)}function yp(n){const{prevDep:e,nextDep:t}=n;e&&(e.nextDep=t,n.prevDep=void 0),t&&(t.prevDep=e,n.nextDep=void 0)}let Rn=!0;const td=[];function qn(){td.push(Rn),Rn=!1}function Yn(){const n=td.pop();Rn=n===void 0?!0:n}function mc(n){const{cleanup:e}=n;if(n.cleanup=void 0,e){const t=ft;ft=void 0;try{e()}finally{ft=t}}}let gr=0;class Ep{constructor(e,t){this.sub=e,this.dep=t,this.version=t.version,this.nextDep=this.prevDep=this.nextSub=this.prevSub=this.prevActiveLink=void 0}}class Bl{constructor(e){this.computed=e,this.version=0,this.activeLink=void 0,this.subs=void 0,this.map=void 0,this.key=void 0,this.sc=0,this.__v_skip=!0}track(e){if(!ft||!Rn||ft===this.computed)return;let t=this.activeLink;if(t===void 0||t.sub!==ft)t=this.activeLink=new Ep(ft,this),ft.deps?(t.prevDep=ft.depsTail,ft.depsTail.nextDep=t,ft.depsTail=t):ft.deps=ft.depsTail=t,nd(t);else if(t.version===-1&&(t.version=this.version,t.nextDep)){const i=t.nextDep;i.prevDep=t.prevDep,t.prevDep&&(t.prevDep.nextDep=i),t.prevDep=ft.depsTail,t.nextDep=void 0,ft.depsTail.nextDep=t,ft.depsTail=t,ft.deps===t&&(ft.deps=i)}return t}trigger(e){this.version++,gr++,this.notify(e)}notify(e){Nl();try{for(let t=this.subs;t;t=t.prevSub)t.sub.notify()&&t.sub.dep.notify()}finally{Ol()}}}function nd(n){if(n.dep.sc++,n.sub.flags&4){const e=n.dep.computed;if(e&&!n.dep.subs){e.flags|=20;for(let i=e.deps;i;i=i.nextDep)nd(i)}const t=n.dep.subs;t!==n&&(n.prevSub=t,t&&(t.nextSub=n)),n.dep.subs=n}}const ol=new WeakMap,Ji=Symbol(""),al=Symbol(""),_r=Symbol("");function Wt(n,e,t){if(Rn&&ft){let i=ol.get(n);i||ol.set(n,i=new Map);let s=i.get(t);s||(i.set(t,s=new Bl),s.map=i,s.key=t),s.track()}}function ai(n,e,t,i,s,r){const a=ol.get(n);if(!a){gr++;return}const o=l=>{l&&l.trigger()};if(Nl(),e==="clear")a.forEach(o);else{const l=Oe(n),u=l&&Il(t);if(l&&t==="length"){const c=Number(i);a.forEach((f,d)=>{(d==="length"||d===_r||!jn(d)&&d>=c)&&o(f)})}else switch((t!==void 0||a.has(void 0))&&o(a.get(t)),u&&o(a.get(_r)),e){case"add":l?u&&o(a.get("length")):(o(a.get(Ji)),Pi(n)&&o(a.get(al)));break;case"delete":l||(o(a.get(Ji)),Pi(n)&&o(a.get(al)));break;case"set":Pi(n)&&o(a.get(Ji));break}}Ol()}function us(n){const e=ot(n);return e===n||(Wt(e,"iterate",_r),vn(n))?e:Kn(n)?Li(n)?e.map(t=>Ni(xn(t))):e.map(Ni):e.map(xn)}function Vo(n){return Wt(n=ot(n),"iterate",_r),n}function On(n,e){return Kn(n)?Ni(Li(n)?xn(e):e):xn(e)}const bp={__proto__:null,[Symbol.iterator](){return ua(this,Symbol.iterator,n=>On(this,n))},concat(...n){return us(this).concat(...n.map(e=>Oe(e)?us(e):e))},entries(){return ua(this,"entries",n=>(n[1]=On(this,n[1]),n))},every(n,e){return Zn(this,"every",n,e,void 0,arguments)},filter(n,e){return Zn(this,"filter",n,e,t=>t.map(i=>On(this,i)),arguments)},find(n,e){return Zn(this,"find",n,e,t=>On(this,t),arguments)},findIndex(n,e){return Zn(this,"findIndex",n,e,void 0,arguments)},findLast(n,e){return Zn(this,"findLast",n,e,t=>On(this,t),arguments)},findLastIndex(n,e){return Zn(this,"findLastIndex",n,e,void 0,arguments)},forEach(n,e){return Zn(this,"forEach",n,e,void 0,arguments)},includes(...n){return fa(this,"includes",n)},indexOf(...n){return fa(this,"indexOf",n)},join(n){return us(this).join(n)},lastIndexOf(...n){return fa(this,"lastIndexOf",n)},map(n,e){return Zn(this,"map",n,e,void 0,arguments)},pop(){return Ks(this,"pop")},push(...n){return Ks(this,"push",n)},reduce(n,...e){return _c(this,"reduce",n,e)},reduceRight(n,...e){return _c(this,"reduceRight",n,e)},shift(){return Ks(this,"shift")},some(n,e){return Zn(this,"some",n,e,void 0,arguments)},splice(...n){return Ks(this,"splice",n)},toReversed(){return us(this).toReversed()},toSorted(n){return us(this).toSorted(n)},toSpliced(...n){return us(this).toSpliced(...n)},unshift(...n){return Ks(this,"unshift",n)},values(){return ua(this,"values",n=>On(this,n))}};function ua(n,e,t){const i=Vo(n),s=i[e],r=s.call(i);if(i!==n&&!vn(n)){if(r[Symbol.toStringTag]==="Array Iterator"){const a=Object.create(Object.getPrototypeOf(r));return a.next=()=>gc(r.next(),t),s!==id[e]&&Object.defineProperties(a,{return:{get(){const o=r.return;return typeof o=="function"?o.bind(r):o}},throw:{get(){const o=r.throw;return typeof o=="function"?o.bind(r):o}}}),a}r._next=r.next,r.next=()=>gc(r._next(),t)}return r}function gc(n,e){return n.done||(n.value=e(n.value)),n}const id=Array.prototype;function Zn(n,e,t,i,s,r){const a=Vo(n),o=a!==n&&!vn(n),l=a[e];if(l!==id[e]){const f=l.apply(n,r);return o?xn(f):f}let u=t;a!==n&&(o?u=function(f,d){return t.call(this,On(n,f),d,n)}:t.length>2&&(u=function(f,d){return t.call(this,f,d,n)}));const c=l.call(a,u,i);return o&&s?s(c):c}function _c(n,e,t,i){const s=Vo(n),r=s!==n&&!vn(n);let a=t,o=!1;s!==n&&(r?(o=i.length===0,a=function(u,c,f){return o&&(o=!1,u=On(n,u)),t.call(this,u,On(n,c),f,n)}):t.length>3&&(a=function(u,c,f){return t.call(this,u,c,f,n)}));const l=s[e](a,...i);return o?On(n,l):l}function fa(n,e,t){const i=ot(n);Wt(i,"iterate",_r);const s=i[e](...t);return(s===-1||s===!1)&&Vl(t[0])?(t[0]=ot(t[0]),i[e](...t)):s}function Ks(n,e,t=[]){qn(),Nl();const i=ot(n)[e].apply(n,t);return Ol(),Yn(),i}const Tp=Ll("__proto__,__v_isRef,__isVue"),sd=new Set(Object.getOwnPropertyNames(Symbol).filter(n=>n!=="arguments"&&n!=="caller").map(n=>Symbol[n]).filter(jn));function Ap(n){jn(n)||(n=String(n));const e=ot(this);return Wt(e,"has",n),e.hasOwnProperty(n)}class rd{constructor(e=!1,t=!1){this._isReadonly=e,this._isShallow=t}get(e,t,i){if(t==="__v_skip")return e.__v_skip;const s=this._isReadonly,r=this._isShallow;if(t==="__v_isReactive")return!s;if(t==="__v_isReadonly")return s;if(t==="__v_isShallow")return r;if(t==="__v_raw")return i===(s?r?Op:cd:r?ld:ad).get(e)||Object.getPrototypeOf(e)===Object.getPrototypeOf(i)?e:void 0;const a=Oe(e);if(!s){let l;if(a&&(l=bp[t]))return l;if(t==="hasOwnProperty")return Ap}const o=Reflect.get(e,t,jt(e)?e:i);if((jn(t)?sd.has(t):Tp(t))||(s||Wt(e,"get",t),r))return o;if(jt(o)){const l=a&&Il(t)?o:o.value;return s&&at(l)?cl(l):l}return at(o)?s?cl(o):as(o):o}}class od extends rd{constructor(e=!1){super(!1,e)}set(e,t,i,s){let r=e[t];const a=Oe(e)&&Il(t);if(!this._isShallow){const u=Kn(r);if(!vn(i)&&!Kn(i)&&(r=ot(r),i=ot(i)),!a&&jt(r)&&!jt(i))return u||(r.value=i),!0}const o=a?Number(t)<e.length:st(e,t),l=Reflect.set(e,t,i,jt(e)?e:s);return e===ot(s)&&l&&(o?Hn(i,r)&&ai(e,"set",t,i):ai(e,"add",t,i)),l}deleteProperty(e,t){const i=st(e,t);e[t];const s=Reflect.deleteProperty(e,t);return s&&i&&ai(e,"delete",t,void 0),s}has(e,t){const i=Reflect.has(e,t);return(!jn(t)||!sd.has(t))&&Wt(e,"has",t),i}ownKeys(e){return Wt(e,"iterate",Oe(e)?"length":Ji),Reflect.ownKeys(e)}}class wp extends rd{constructor(e=!1){super(!0,e)}set(e,t){return!0}deleteProperty(e,t){return!0}}const Rp=new od,Cp=new wp,Pp=new od(!0);const ll=n=>n,Fr=n=>Reflect.getPrototypeOf(n);function Lp(n,e,t){return function(...i){const s=this.__v_raw,r=ot(s),a=Pi(r),o=n==="entries"||n===Symbol.iterator&&a,l=n==="keys"&&a,u=s[n](...i),c=t?ll:e?Ni:xn;return!e&&Wt(r,"iterate",l?al:Ji),Lt(Object.create(u),{next(){const{value:f,done:d}=u.next();return d?{value:f,done:d}:{value:o?[c(f[0]),c(f[1])]:c(f),done:d}}})}}function Br(n){return function(...e){return n==="delete"?!1:n==="clear"?void 0:this}}function Dp(n,e){const t={get(s){const r=this.__v_raw,a=ot(r),o=ot(s);n||(Hn(s,o)&&Wt(a,"get",s),Wt(a,"get",o));const{has:l}=Fr(a),u=e?ll:n?Ni:xn;if(l.call(a,s))return u(r.get(s));if(l.call(a,o))return u(r.get(o));r!==a&&r.get(s)},get size(){const s=this.__v_raw;return!n&&Wt(ot(s),"iterate",Ji),s.size},has(s){const r=this.__v_raw,a=ot(r),o=ot(s);return n||(Hn(s,o)&&Wt(a,"has",s),Wt(a,"has",o)),s===o?r.has(s):r.has(s)||r.has(o)},forEach(s,r){const a=this,o=a.__v_raw,l=ot(o),u=e?ll:n?Ni:xn;return!n&&Wt(l,"iterate",Ji),o.forEach((c,f)=>s.call(r,u(c),u(f),a))}};return Lt(t,n?{add:Br("add"),set:Br("set"),delete:Br("delete"),clear:Br("clear")}:{add(s){const r=ot(this),a=Fr(r),o=ot(s),l=!e&&!vn(s)&&!Kn(s)?o:s;return a.has.call(r,l)||Hn(s,l)&&a.has.call(r,s)||Hn(o,l)&&a.has.call(r,o)||(r.add(l),ai(r,"add",l,l)),this},set(s,r){!e&&!vn(r)&&!Kn(r)&&(r=ot(r));const a=ot(this),{has:o,get:l}=Fr(a);let u=o.call(a,s);u||(s=ot(s),u=o.call(a,s));const c=l.call(a,s);return a.set(s,r),u?Hn(r,c)&&ai(a,"set",s,r):ai(a,"add",s,r),this},delete(s){const r=ot(this),{has:a,get:o}=Fr(r);let l=a.call(r,s);l||(s=ot(s),l=a.call(r,s)),o&&o.call(r,s);const u=r.delete(s);return l&&ai(r,"delete",s,void 0),u},clear(){const s=ot(this),r=s.size!==0,a=s.clear();return r&&ai(s,"clear",void 0,void 0),a}}),["keys","values","entries",Symbol.iterator].forEach(s=>{t[s]=Lp(s,n,e)}),t}function zl(n,e){const t=Dp(n,e);return(i,s,r)=>s==="__v_isReactive"?!n:s==="__v_isReadonly"?n:s==="__v_isShallow"?e:s==="__v_raw"?i:Reflect.get(st(t,s)&&s in i?t:i,s,r)}const Ip={get:zl(!1,!1)},Up={get:zl(!1,!0)},Np={get:zl(!0,!1)};const ad=new WeakMap,ld=new WeakMap,cd=new WeakMap,Op=new WeakMap;function Fp(n){switch(n){case"Object":case"Array":return 1;case"Map":case"Set":case"WeakMap":case"WeakSet":return 2;default:return 0}}function as(n){return Kn(n)?n:Hl(n,!1,Rp,Ip,ad)}function ud(n){return Hl(n,!1,Pp,Up,ld)}function cl(n){return Hl(n,!0,Cp,Np,cd)}function Hl(n,e,t,i,s){if(!at(n)||n.__v_raw&&!(e&&n.__v_isReactive)||n.__v_skip||!Object.isExtensible(n))return n;const r=s.get(n);if(r)return r;const a=Fp(cp(n));if(a===0)return n;const o=new Proxy(n,a===2?i:t);return s.set(n,o),o}function Li(n){return Kn(n)?Li(n.__v_raw):!!(n&&n.__v_isReactive)}function Kn(n){return!!(n&&n.__v_isReadonly)}function vn(n){return!!(n&&n.__v_isShallow)}function Vl(n){return n?!!n.__v_raw:!1}function ot(n){const e=n&&n.__v_raw;return e?ot(e):n}function Bp(n){return!st(n,"__v_skip")&&Object.isExtensible(n)&&Xf(n,"__v_skip",!0),n}const xn=n=>at(n)?as(n):n,Ni=n=>at(n)?cl(n):n;function jt(n){return n?n.__v_isRef===!0:!1}function di(n){return fd(n,!1)}function zp(n){return fd(n,!0)}function fd(n,e){return jt(n)?n:new Hp(n,e)}class Hp{constructor(e,t){this.dep=new Bl,this.__v_isRef=!0,this.__v_isShallow=!1,this._rawValue=t?e:ot(e),this._value=t?e:xn(e),this.__v_isShallow=t}get value(){return this.dep.track(),this._value}set value(e){const t=this._rawValue,i=this.__v_isShallow||vn(e)||Kn(e);e=i?e:ot(e),Hn(e,t)&&(this._rawValue=e,this._value=i?e:xn(e),this.dep.trigger())}}function Ue(n){return jt(n)?n.value:n}const Vp={get:(n,e,t)=>e==="__v_raw"?n:Ue(Reflect.get(n,e,t)),set:(n,e,t,i)=>{const s=n[e];return jt(s)&&!jt(t)?(s.value=t,!0):Reflect.set(n,e,t,i)}};function dd(n){return Li(n)?n:new Proxy(n,Vp)}class Gp{constructor(e,t,i){this.fn=e,this.setter=t,this._value=void 0,this.dep=new Bl(this),this.__v_isRef=!0,this.deps=void 0,this.depsTail=void 0,this.flags=16,this.globalVersion=gr-1,this.next=void 0,this.effect=this,this.__v_isReadonly=!t,this.isSSR=i}notify(){if(this.flags|=16,!(this.flags&8)&&ft!==this)return Zf(this,!0),!0}get value(){const e=this.dep.track();return ed(this),e&&(e.version=this.dep.version),this._value}set value(e){this.setter&&this.setter(e)}}function kp(n,e,t=!1){let i,s;return We(n)?i=n:(i=n.get,s=n.set),new Gp(i,s,t)}const zr={},xo=new WeakMap;let ji;function Wp(n,e=!1,t=ji){if(t){let i=xo.get(t);i||xo.set(t,i=[]),i.push(n)}}function Xp(n,e,t=ct){const{immediate:i,deep:s,once:r,scheduler:a,augmentJob:o,call:l}=t,u=M=>s?M:vn(M)||s===!1||s===0?li(M,1):li(M);let c,f,d,p,x=!1,_=!1;if(jt(n)?(f=()=>n.value,x=vn(n)):Li(n)?(f=()=>u(n),x=!0):Oe(n)?(_=!0,x=n.some(M=>Li(M)||vn(M)),f=()=>n.map(M=>{if(jt(M))return M.value;if(Li(M))return u(M);if(We(M))return l?l(M,2):M()})):We(n)?e?f=l?()=>l(n,2):n:f=()=>{if(d){qn();try{d()}finally{Yn()}}const M=ji;ji=c;try{return l?l(n,3,[p]):n(p)}finally{ji=M}}:f=kn,e&&s){const M=f,I=s===!0?1/0:s;f=()=>li(M(),I)}const m=Sp(),h=()=>{c.stop(),m&&m.active&&Dl(m.effects,c)};if(r&&e){const M=e;e=(...I)=>{try{return M(...I)}finally{h()}}}let g=_?new Array(n.length).fill(zr):zr;const S=M=>{if(!(!(c.flags&1)||!c.dirty&&!M))if(e){const I=c.run();if(M||s||x||(_?I.some((L,C)=>Hn(L,g[C])):Hn(I,g))){const L=ji;qn();try{d&&d(),ji=c;const C=[I,g===zr?void 0:_&&g[0]===zr?[]:g,p];g=I,l?l(e,3,C):e(...C)}finally{ji=L,Yn()}}}else c.run()};return o&&o(S),c=new Kf(f),c.scheduler=a?()=>a(S,!1):S,p=M=>Wp(M,!1,c),d=c.onStop=()=>{const M=xo.get(c);if(M){if(l)l(M,4);else for(const I of M)I();xo.delete(c)}},e?i?S(!0):g=c.run():a?a(S.bind(null,!0),!0):c.run(),h.pause=c.pause.bind(c),h.resume=c.resume.bind(c),h.stop=h,h}function li(n,e=1/0,t){if(e<=0||!at(n)||n.__v_skip||(t=t||new Map,(t.get(n)||0)>=e))return n;if(t.set(n,e),e--,jt(n))li(n.value,e,t);else if(Oe(n))for(let i=0;i<n.length;i++)li(n[i],e,t);else if(pi(n)||Pi(n))n.forEach(i=>{li(i,e,t)});else if(Wf(n)){for(const i in n)li(n[i],e,t);for(const i of Object.getOwnPropertySymbols(n))Object.prototype.propertyIsEnumerable.call(n,i)&&li(n[i],e,t)}return n}/**
* @vue/runtime-core v3.5.45
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/function Lr(n,e,t,i){try{return i?n(...i):n()}catch(s){Go(s,e,t)}}function Cn(n,e,t,i){if(We(n)){const s=Lr(n,e,t,i);return s&&Gf(s)&&s.catch(r=>{Go(r,e,t,void 0,!0)}),s}if(Oe(n)){const s=[];for(let r=0;r<n.length;r++)s.push(Cn(n[r],e,t,i));return s}}function Go(n,e,t,i=!0,s=!1){const r=e?e.vnode:null,{errorHandler:a,throwUnhandledErrorInProduction:o}=e&&e.appContext.config||ct;if(e){let l=e.parent;const u=e.proxy,c=`https://vuejs.org/error-reference/#runtime-${t}`;for(;l;){const f=l.ec;if(f&&!l.isUnmounted&&(!s||l.scope.active)){for(let d=0;d<f.length;d++)if(f[d](n,u,c)===!1)return}l=l.parent}if(a){qn(),Lr(a,null,10,[n,u,c]),Yn();return}}jp(n,t,r,i,o)}function jp(n,e,t,i=!0,s=!1){if(s)throw n;console.error(n)}const Jt=[];let En=-1;const Fn=[];let bi=null,Cs=0;const hd=Promise.resolve();let Mo=null;function Gl(n){const e=Mo||hd;return n?e.then(this?n.bind(this):n):e}function qp(n){let e=En+1,t=Jt.length;for(;e<t;){const i=e+t>>>1,s=Jt[i],r=vr(s);r<n||r===n&&s.flags&2?e=i+1:t=i}return e}function kl(n){if(!(n.flags&1)){const e=vr(n),t=Jt[Jt.length-1];!t||!(n.flags&2)&&e>=vr(t)?Jt.push(n):Jt.splice(qp(e),0,n),n.flags|=1,pd()}}function pd(){Mo||(Mo=hd.then(_d))}function Yp(n){if(!Oe(n))bi&&n.id===-1?bi.splice(Cs+1,0,n):n.flags&1||(Fn.push(n),n.flags|=1);else for(let e=0;e<n.length;e++)Fn.push(n[e]);pd()}function md(n,e,t,i=En+1){for(;i<Jt.length;i++){const s=Jt[i];if(s&&s.flags&2){if(n&&s.id!==n.uid||e!==void 0&&!(s.id>=e))continue;Jt.splice(i,1),i=n?i-1:En,s.flags&4&&(s.flags&=-2),s(),s.flags&4||(s.flags&=-2)}}}function gd(n,e,t=0){if(Fn.length){let i=Fn,s=0;if(e){i=[];for(let a=0;a<Fn.length;a++){const o=Fn[a];(o.i!==void 0?!o.i||o.i.uid<t:e.has(o))?Fn[s++]=o:i.push(o)}}const r=[...new Set(i)].sort((a,o)=>vr(a)-vr(o));if(Fn.length=s,bi){for(let a=0;a<r.length;a++)bi.push(r[a]);return}for(bi=r,Cs=0;Cs<bi.length;Cs++){const a=bi[Cs];a.flags&4&&(a.flags&=-2),a.flags&8||a(),a.flags&=-2}bi=null,Cs=0}}let da=!1;function Kp(n,e){if(da){n();return}const t=e===void 0?void 0:new Set(Fn);n(),da=!0;try{md(void 0,e),gd(void 0,t,e)}finally{da=!1}}const vr=n=>n.id==null?n.flags&2?-1:1/0:n.id;function _d(n){try{for(En=0;En<Jt.length;En++){const e=Jt[En];e&&!(e.flags&8)&&(e.flags&4&&(e.flags&=-2),Lr(e,e.i,e.i?15:14),e.flags&4||(e.flags&=-2))}}finally{for(;En<Jt.length;En++){const e=Jt[En];e&&(e.flags&=-2)}En=-1,Jt.length=0,gd(),Mo=null,(Jt.length||Fn.length)&&_d()}}let un=null,vd=null;function So(n){const e=un;return un=n,vd=n&&n.type.__scopeId||null,e}function Zi(n,e=un,t){if(!e||n._n)return n;const i=(...s)=>{i._d&&To(-1);const r=So(e),a=Qi.length;let o;try{o=n(...s)}finally{for(let l=Qi.length;l>a;l--)Gd();So(r),i._d&&To(1)}return o};return i._n=!0,i._c=!0,i._d=!0,i}function dt(n,e){if(un===null)return n;const t=jo(un),i=n.dirs||(n.dirs=[]);for(let s=0;s<e.length;s++){let[r,a,o,l=ct]=e[s];r&&(We(r)&&(r={mounted:r,updated:r}),r.deep&&li(a),i.push({dir:r,instance:t,value:a,oldValue:void 0,arg:o,modifiers:l}))}return n}function zi(n,e,t,i){let s=n;if(i==="beforeMount")n._mount=n;else if(i==="beforeUpdate"){const o=e&&e._mount;o&&(o._latest=n,n._mount=o)}else if(i==="mounted"){const o=n._latest;n._mount=n._latest=void 0,o&&(s=o,o._mount=void 0)}const r=s.dirs,a=e&&e.dirs;for(let o=0;o<r.length;o++){let l=r[o];a?l.oldValue=a[o].value:i==="mounted"&&l.oldValue!==void 0&&(l=Lt({},l,{oldValue:void 0}));let u=l.dir[i];u&&(qn(),Cn(u,t,8,[n.el,l,s,e]),Yn())}}function mo(n,e){if(Xt){let t=Xt.provides;const i=Xt.parent&&Xt.parent.provides;i===t&&(t=Xt.provides=Object.create(i)),t[n]=e}}function Wn(n,e,t=!1){const i=Ym();if(i||Ns){let s=Ns?Ns._context.provides:i?i.parent==null||i.ce?i.vnode.appContext&&i.vnode.appContext.provides:i.parent.provides:void 0;if(s&&n in s)return s[n];if(arguments.length>1)return t&&We(e)?e.call(i&&i.proxy):e}}const $p=Symbol.for("v-scx"),Zp=()=>Wn($p);function hi(n,e,t){return xd(n,e,t)}function xd(n,e,t=ct){const{immediate:i,deep:s,flush:r,once:a}=t,o=Lt({},t),l=e&&i||!e&&r!=="post";let u;if(Er){if(r==="sync"){const p=Zp();u=p.__watcherHandles||(p.__watcherHandles=[])}else if(!l){const p=()=>{};return p.stop=kn,p.resume=kn,p.pause=kn,p}}const c=Xt;o.call=(p,x,_)=>Cn(p,c,x,_);let f=!1;r==="post"?o.scheduler=p=>{p.i=c,Yt(p,c&&c.suspense)}:r!=="sync"&&(f=!0,o.scheduler=(p,x)=>{x?p():kl(p)}),o.augmentJob=p=>{e&&(p.flags|=4),f&&(p.flags|=2,c&&(p.id=c.uid,p.i=c))};const d=Xp(n,e,o);return Er&&(u?u.push(d):l&&d()),d}function Jp(n,e,t){const i=this.proxy,s=St(n)?n.includes(".")?Md(i,n):()=>i[n]:n.bind(i,i);let r;We(e)?r=e:(r=e.handler,t=e);const a=Dr(this),o=xd(s,r.bind(i),t);return a(),o}function Md(n,e){const t=e.split(".");return()=>{let i=n;for(let s=0;s<t.length&&i;s++)i=i[t[s]];return i}}const Qp=Symbol("_vte"),ko=n=>n.__isTeleport,ha=Symbol("_leaveCb");function em(n){let e=n[0];if(n.length>1){for(const t of n)if(t.type!==Pn){e=t;break}}return e}function Sd(n){if(!Wl(n))return ko(n.type)&&n.children?em(n.children):n;if(n.component)return n.component.subTree;const{shapeFlag:e,children:t}=n;if(t){if(e&16)return t[0];if(e&32&&We(t.default))return t.default()}}function cr(n,e){if(n.shapeFlag&6&&n.component){n.transition=e;const t=n.component.subTree;cr(ko(t.type)&&Sd(t)||t,e)}else if(n.shapeFlag&128){const t=n.suspense;if(t){const i=t.isHydrating?t.pendingBranch:t.activeBranch;i&&cr(i,e.clone(i))}else n.ssContent.transition=e.clone(n.ssContent),n.ssFallback.transition=e.clone(n.ssFallback)}else if(n.transition=e,n.type===mt&&Oe(n.children)){const t=Cd(n.children,!1);t&&cr(t,e)}}function ul(n){if(n.component)return ul(n.component.subTree);if(n.type===mt){const e=Oe(n.children)&&Cd(n.children,!1);return e?ul(e):void 0}if(n.type!==Pn)return n}function yd(n,e){return We(n)?Lt({name:n.name},e,{setup:n}):n}function Ed(n){n.ids=[n.ids[0]+n.ids[2]+++"-",0,0]}function vc(n,e){let t;return!!((t=Object.getOwnPropertyDescriptor(n,e))&&!t.configurable)}const yo=new WeakMap;function ur(n,e,t,i,s=!1){if(Oe(n)){n.forEach((_,m)=>ur(_,e&&(Oe(e)?e[m]:e),t,i,s));return}if(fr(i)&&!s){i.shapeFlag&512&&i.type.__asyncResolved&&i.component.subTree.component&&ur(n,e,t,i.component.subTree);return}const r=i.shapeFlag&4?jo(i.component):i.el,a=s?null:r,{i:o,r:l}=n,u=e&&e.r,c=o.refs===ct?o.refs={}:o.refs,f=o.setupState,d=ot(f),p=f===ct?Vf:_=>vc(c,_)?!1:st(d,_),x=(_,m)=>!(m&&vc(c,m));if(u!=null&&u!==l){if(xc(e),St(u))c[u]=null,p(u)&&(f[u]=null);else if(jt(u)){const _=e;x(u,_.k)&&(u.value=null),_.k&&(c[_.k]=null)}}if(We(l))Lr(l,o,12,[a,c]);else{const _=St(l),m=jt(l);if(_||m){const h=()=>{if(n.f){const g=_?p(l)?f[l]:c[l]:x()||!n.k?l.value:c[n.k];if(s)Oe(g)&&Dl(g,r);else if(Oe(g))g.includes(r)||g.push(r);else if(_)c[l]=[r],p(l)&&(f[l]=c[l]);else{const S=[r];x(l,n.k)&&(l.value=S),n.k&&(c[n.k]=S)}}else _?(c[l]=a,p(l)&&(f[l]=a)):m&&(x(l,n.k)&&(l.value=a),n.k&&(c[n.k]=a))};if(a){const g=()=>{h(),yo.delete(n)};g.id=-1,yo.set(n,g),Yt(g,t)}else xc(n),h()}}}function xc(n){const e=yo.get(n);e&&(e.flags|=8,yo.delete(n))}Ho().requestIdleCallback;Ho().cancelIdleCallback;const fr=n=>!!n.type.__asyncLoader,Wl=n=>n.type.__isKeepAlive;function tm(n,e){bd(n,"a",e)}function nm(n,e){bd(n,"da",e)}function bd(n,e,t=Xt){const i=n.__wdc||(n.__wdc=()=>{let s=t;for(;s;){if(s.isDeactivated)return;s=s.parent}return n()});if(xr(e,i,t),t){let s=t.parent;for(;s&&s.parent;)Wl(s.parent.vnode)&&im(i,e,t,s),s=s.parent}}function im(n,e,t,i){const s=xr(e,n,i,!0),r=xr("um",()=>Dl(i[e],s),t);r.flags=16}function xr(n,e,t=Xt,i=!1){if(t){const s=t[n]||(t[n]=[]),r=e.__weh||(e.__weh=(...a)=>{qn();const o=Dr(t),l=Cn(e,t,n,a);return o(),Yn(),l});return i?s.unshift(r):s.push(r),r}}const _i=n=>(e,t=Xt)=>{(!Er||n==="sp")&&xr(n,(...i)=>e(...i),t)},sm=_i("bm"),Xl=_i("m"),rm=_i("bu"),om=_i("u"),jl=_i("bum"),am=_i("um"),lm=_i("sp"),cm=_i("rtg"),um=_i("rtc");function fm(n,e=Xt){xr("ec",n,e)}const dm="components";function Eo(n,e){return pm(dm,n,!0,e)||n}const hm=Symbol.for("v-ndc");function pm(n,e,t=!0,i=!1){const s=un||Xt;if(s){const r=s.type;{const o=Qm(r,!1);if(o&&(o===e||o===tn(e)||o===zo(tn(e))))return r}const a=Mc(s[n]||r[n],e)||Mc(s.appContext[n],e);return!a&&i?r:a}}function Mc(n,e){return n&&(n[e]||n[tn(e)]||n[zo(tn(e))])}function wn(n,e,t,i){let s;const r=t,a=Oe(n);if(a||St(n)){const o=a&&Li(n);let l=!1,u=!1;o&&(l=!vn(n),u=Kn(n),n=Vo(n)),s=new Array(n.length);for(let c=0,f=n.length;c<f;c++)s[c]=e(l?u?Ni(xn(n[c])):xn(n[c]):n[c],c,void 0,r)}else if(typeof n=="number")if(!Number.isInteger(n)||n<0)s=[];else{s=new Array(n);for(let o=0;o<n;o++)s[o]=e(o+1,o,void 0,r)}else if(at(n))if(n[Symbol.iterator])s=Array.from(n,(o,l)=>e(o,l,void 0,r));else{const o=Object.keys(n);s=new Array(o.length);for(let l=0,u=o.length;l<u;l++){const c=o[l];s[l]=e(n[c],c,l,r)}}else s=[];return s}const fl=n=>n?jd(n)?jo(n):fl(n.parent):null,dr=Lt(Object.create(null),{$:n=>n,$el:n=>n.vnode.el,$data:n=>n.data,$props:n=>n.props,$attrs:n=>n.attrs,$slots:n=>n.slots,$refs:n=>n.refs,$parent:n=>fl(n.parent),$root:n=>fl(n.root),$host:n=>n.ce,$emit:n=>n.emit,$options:n=>Ad(n),$forceUpdate:n=>n.f||(n.f=()=>{kl(n.update)}),$nextTick:n=>n.n||(n.n=Gl.bind(n.proxy)),$watch:n=>Jp.bind(n)}),pa=(n,e)=>n!==ct&&!n.__isScriptSetup&&st(n,e),mm={get({_:n},e){if(e==="__v_skip")return!0;const{ctx:t,setupState:i,data:s,props:r,accessCache:a,type:o,appContext:l}=n;if(e[0]!=="$"){const d=a[e];if(d!==void 0)switch(d){case 1:return i[e];case 2:return s[e];case 4:return t[e];case 3:return r[e]}else{if(pa(i,e))return a[e]=1,i[e];if(s!==ct&&st(s,e))return a[e]=2,s[e];if(st(r,e))return a[e]=3,r[e];if(t!==ct&&st(t,e))return a[e]=4,t[e];dl&&(a[e]=0)}}const u=dr[e];let c,f;if(u)return e==="$attrs"&&Wt(n.attrs,"get",""),u(n);if((c=o.__cssModules)&&(c=c[e]))return c;if(t!==ct&&st(t,e))return a[e]=4,t[e];if(f=l.config.globalProperties,st(f,e))return f[e]},set({_:n},e,t){const{data:i,setupState:s,ctx:r}=n;return pa(s,e)?(s[e]=t,!0):i!==ct&&st(i,e)?(i[e]=t,!0):st(n.props,e)||e[0]==="$"&&e.slice(1)in n?!1:(r[e]=t,!0)},has({_:{data:n,setupState:e,accessCache:t,ctx:i,appContext:s,props:r,type:a}},o){let l;return!!(t[o]||n!==ct&&o[0]!=="$"&&st(n,o)||pa(e,o)||st(r,o)||st(i,o)||st(dr,o)||st(s.config.globalProperties,o)||(l=a.__cssModules)&&l[o])},defineProperty(n,e,t){return t.get!=null?n._.accessCache[e]=0:st(t,"value")&&this.set(n,e,t.value,null),Reflect.defineProperty(n,e,t)}};function Sc(n){return Oe(n)?n.reduce((e,t)=>(e[t]=null,e),{}):n}let dl=!0;function gm(n){const e=Ad(n),t=n.proxy,i=n.ctx;dl=!1,e.beforeCreate&&yc(e.beforeCreate,n,"bc");const{data:s,computed:r,methods:a,watch:o,provide:l,inject:u,created:c,beforeMount:f,mounted:d,beforeUpdate:p,updated:x,activated:_,deactivated:m,beforeDestroy:h,beforeUnmount:g,destroyed:S,unmounted:M,render:I,renderTracked:L,renderTriggered:C,errorCaptured:ie,serverPrefetch:A,expose:T,inheritAttrs:R,components:k,directives:J,filters:U}=e;if(u&&_m(u,i,null),a)for(const $ in a){const Z=a[$];We(Z)&&(i[$]=Z.bind(t))}if(s){const $=s.call(t,t);at($)&&(n.data=as($))}if(dl=!0,r)for(const $ in r){const Z=r[$],ae=We(Z)?Z.bind(t,t):We(Z.get)?Z.get.bind(t,t):kn,ce=!We(Z)&&We(Z.set)?Z.set.bind(t):kn,de=ht({get:ae,set:ce});Object.defineProperty(i,$,{enumerable:!0,configurable:!0,get:()=>de.value,set:he=>de.value=he})}if(o)for(const $ in o)Td(o[$],i,t,$);if(l){const $=We(l)?l.call(t):l;Reflect.ownKeys($).forEach(Z=>{mo(Z,$[Z])})}c&&yc(c,n,"c");function G($,Z){Oe(Z)?Z.forEach(ae=>$(ae.bind(t))):Z&&$(Z.bind(t))}if(G(sm,f),G(Xl,d),G(rm,p),G(om,x),G(tm,_),G(nm,m),G(fm,ie),G(um,L),G(cm,C),G(jl,g),G(am,M),G(lm,A),Oe(T))if(T.length){const $=n.exposed||(n.exposed={});T.forEach(Z=>{Object.defineProperty($,Z,{get:()=>t[Z],set:ae=>t[Z]=ae,enumerable:!0})})}else n.exposed||(n.exposed={});I&&n.render===kn&&(n.render=I),R!=null&&(n.inheritAttrs=R),k&&(n.components=k),J&&(n.directives=J),A&&Ed(n)}function _m(n,e,t=kn){Oe(n)&&(n=hl(n));for(const i in n){const s=n[i];let r;at(s)?"default"in s?r=Wn(s.from||i,s.default,!0):r=Wn(s.from||i):r=Wn(s),jt(r)?Object.defineProperty(e,i,{enumerable:!0,configurable:!0,get:()=>r.value,set:a=>r.value=a}):e[i]=r}}function yc(n,e,t){Cn(Oe(n)?n.map(i=>i.bind(e.proxy)):n.bind(e.proxy),e,t)}function Td(n,e,t,i){let s=i.includes(".")?Md(t,i):()=>t[i];if(St(n)){const r=e[n];We(r)&&hi(s,r)}else if(We(n))hi(s,n.bind(t));else if(at(n))if(Oe(n))n.forEach(r=>Td(r,e,t,i));else{const r=We(n.handler)?n.handler.bind(t):e[n.handler];We(r)&&hi(s,r,n)}}function Ad(n){const e=n.type,{mixins:t,extends:i}=e,{mixins:s,optionsCache:r,config:{optionMergeStrategies:a}}=n.appContext,o=r.get(e);let l;return o?l=o:!s.length&&!t&&!i?l=e:(l={},s.length&&s.forEach(u=>bo(l,u,a,!0)),bo(l,e,a)),at(e)&&r.set(e,l),l}function bo(n,e,t,i=!1){const{mixins:s,extends:r}=e;r&&bo(n,r,t,!0),s&&s.forEach(a=>bo(n,a,t,!0));for(const a in e)if(!(i&&a==="expose")){const o=vm[a]||t&&t[a];n[a]=o?o(n[a],e[a]):e[a]}return n}const vm={data:Ec,props:bc,emits:bc,methods:sr,computed:sr,beforeCreate:qt,created:qt,beforeMount:qt,mounted:qt,beforeUpdate:qt,updated:qt,beforeDestroy:qt,beforeUnmount:qt,destroyed:qt,unmounted:qt,activated:qt,deactivated:qt,errorCaptured:qt,serverPrefetch:qt,components:sr,directives:sr,watch:Mm,provide:Ec,inject:xm};function Ec(n,e){return e?n?function(){return Lt(We(n)?n.call(this,this):n,We(e)?e.call(this,this):e)}:e:n}function xm(n,e){return sr(hl(n),hl(e))}function hl(n){if(Oe(n)){const e={};for(let t=0;t<n.length;t++)e[n[t]]=n[t];return e}return n}function qt(n,e){return n?[...new Set([].concat(n,e))]:e}function sr(n,e){return n?Lt(Object.create(null),n,e):e}function bc(n,e){return n?Oe(n)&&Oe(e)?[...new Set([...n,...e])]:Lt(Object.create(null),Sc(n),Sc(e??{})):e}function Mm(n,e){if(!n)return e;if(!e)return n;const t=Lt(Object.create(null),n);for(const i in e)t[i]=qt(n[i],e[i]);return t}function wd(){return{app:null,config:{isNativeTag:Vf,performance:!1,globalProperties:{},optionMergeStrategies:{},errorHandler:void 0,warnHandler:void 0,compilerOptions:{}},mixins:[],components:{},directives:{},provides:Object.create(null),optionsCache:new WeakMap,propsCache:new WeakMap,emitsCache:new WeakMap}}let Sm=0;function ym(n,e){return function(i,s=null){We(i)||(i=Lt({},i)),s!=null&&!at(s)&&(s=null);const r=wd(),a=new WeakSet,o=[];let l=!1;const u=r.app={_uid:Sm++,_component:i,_props:s,_container:null,_context:r,_instance:null,version:tg,get config(){return r.config},set config(c){},use(c,...f){return a.has(c)||(c&&We(c.install)?(a.add(c),c.install(u,...f)):We(c)&&(a.add(c),c(u,...f))),u},mixin(c){return r.mixins.includes(c)||r.mixins.push(c),u},component(c,f){return f?(r.components[c]=f,u):r.components[c]},directive(c,f){return f?(r.directives[c]=f,u):r.directives[c]},mount(c,f,d){if(!l){const p=u._ceVNode||Tt(i,s);return p.appContext=r,d===!0?d="svg":d===!1&&(d=void 0),n(p,c,d),l=!0,u._container=c,c.__vue_app__=u,jo(p.component)}},onUnmount(c){o.push(c)},unmount(){l&&(Cn(o,u._instance,16),n(null,u._container),delete u._container.__vue_app__)},provide(c,f){return r.provides[c]=f,u},runWithContext(c){const f=Ns;Ns=u;try{return c()}finally{Ns=f}}};return u}}let Ns=null;const Em=(n,e)=>e==="modelValue"||e==="model-value"?n.modelModifiers:n[`${e}Modifiers`]||n[`${tn(e)}Modifiers`]||n[`${os(e)}Modifiers`];function bm(n,e,...t){if(n.isUnmounted)return;const i=n.vnode.props||ct;let s=t;const r=e.startsWith("update:"),a=r&&Em(i,e.slice(7));a&&(a.trim&&(s=t.map(c=>St(c)?c.trim():c)),a.number&&(s=s.map(Pr)));let o,l=i[o=aa(e)]||i[o=aa(tn(e))];!l&&r&&(l=i[o=aa(os(e))]),l&&Cn(l,n,6,s);const u=i[o+"Once"];if(u){if(!n.emitted)n.emitted={};else if(n.emitted[o])return;n.emitted[o]=!0,Cn(u,n,6,s)}}const Tm=new WeakMap;function Rd(n,e,t=!1){const i=t?Tm:e.emitsCache,s=i.get(n);if(s!==void 0)return s;const r=n.emits;let a={},o=!1;if(!We(n)){const l=u=>{const c=Rd(u,e,!0);c&&(o=!0,Lt(a,c))};!t&&e.mixins.length&&e.mixins.forEach(l),n.extends&&l(n.extends),n.mixins&&n.mixins.forEach(l)}return!r&&!o?(at(n)&&i.set(n,null),null):(Oe(r)?r.forEach(l=>a[l]=null):Lt(a,r),at(n)&&i.set(n,a),a)}function Wo(n,e){return!n||!Oo(e)?!1:(e=e.slice(2),e=e==="Once"?e:e.replace(/Once$/,""),st(n,e[0].toLowerCase()+e.slice(1))||st(n,os(e))||st(n,e))}function Tc(n){const{type:e,vnode:t,proxy:i,withProxy:s,propsOptions:[r],slots:a,attrs:o,emit:l,render:u,renderCache:c,props:f,data:d,setupState:p,ctx:x,inheritAttrs:_}=n,m=So(n);let h,g;try{if(t.shapeFlag&4){const M=s||i,I=M;h=Bn(u.call(I,M,c,f,p,d,x)),g=o}else{const M=e;h=Bn(M.length>1?M(f,{attrs:o,slots:a,emit:l}):M(f,null)),g=e.props?o:Am(o)}}catch(M){Qi.length=0,Go(M,n,1),h=Tt(Pn)}let S=h;if(g&&_!==!1){const M=Object.keys(g),{shapeFlag:I}=S;M.length&&I&7&&(r&&M.some(Fo)&&(g=wm(g,r)),S=Bs(S,g,!1,!0))}if(t.dirs&&(S=Bs(S,null,!1,!0),S.dirs=S.dirs?S.dirs.concat(t.dirs):t.dirs),t.transition){const M=ko(S.type)&&Sd(S)||S;cr(M,t.transition)}return h=S,So(m),h}function Cd(n,e=!0){let t;for(let i=0;i<n.length;i++){const s=n[i];if(Sr(s)){if(s.type!==Pn||s.children==="v-if"){if(t)return;t=s}}else return}return t}const Am=n=>{let e;for(const t in n)(t==="class"||t==="style"||Oo(t))&&((e||(e={}))[t]=n[t]);return e},wm=(n,e)=>{const t={};for(const i in n)(!Fo(i)||!(i.slice(9)in e))&&(t[i]=n[i]);return t};function Rm(n,e,t){const{props:i,children:s,component:r}=n,{props:a,children:o,patchFlag:l}=e,u=r.emitsOptions;if(e.dirs||e.transition)return!0;if(t&&l>=0){if(l&1024)return!0;if(l&16)return i?Ac(i,a,u):!!a;if(l&8){const c=e.dynamicProps;for(let f=0;f<c.length;f++){const d=c[f];if(Pd(a,i,d)&&!Wo(u,d))return!0}}}else return(s||o)&&(!o||!o.$stable)?!0:i===a?!1:i?a?Ac(i,a,u):!0:!!a;return!1}function Ac(n,e,t){const i=Object.keys(e);if(i.length!==Object.keys(n).length)return!0;for(let s=0;s<i.length;s++){const r=i[s];if(!st(n,r)||Pd(e,n,r)&&!Wo(t,r))return!0}return!1}function Pd(n,e,t){const i=n[t],s=e[t];return t==="style"&&at(i)&&at(s)?!mi(i,s):i!==s}function Cm({vnode:n,parent:e,suspense:t},i){for(;e;){const s=e.subTree;if(s.suspense&&s.suspense.activeBranch===n&&(s.suspense.vnode.el=s.el=i,n=s),s===n)(n=e.vnode).el=i,e=e.parent;else break}t&&t.activeBranch===n&&(t.vnode.el=i)}const Ld={},Dd=()=>Object.create(Ld),Id=n=>Object.getPrototypeOf(n)===Ld;function Pm(n,e,t,i=!1){const s={},r=Dd();n.propsDefaults=Object.create(null),Ud(n,e,s,r);for(const a in n.propsOptions[0])a in s||(s[a]=void 0);t?n.props=i?s:ud(s):n.type.props?n.props=s:n.props=r,n.attrs=r}function Lm(n,e,t,i){const{props:s,attrs:r,vnode:{patchFlag:a}}=n,o=ot(s),[l]=n.propsOptions;let u=!1;if((i||a>0)&&!(a&16)){if(a&8){const c=n.vnode.dynamicProps;for(let f=0;f<c.length;f++){let d=c[f];if(Wo(n.emitsOptions,d))continue;const p=e[d];if(l)if(st(r,d))p!==r[d]&&(r[d]=p,u=!0);else{const x=tn(d);s[x]=pl(l,o,x,p,n,!1)}else p!==r[d]&&(r[d]=p,u=!0)}}}else{Ud(n,e,s,r)&&(u=!0);let c;for(const f in o)(!e||!st(e,f)&&((c=os(f))===f||!st(e,c)))&&(l?t&&(t[f]!==void 0||t[c]!==void 0)&&(s[f]=pl(l,o,f,void 0,n,!0)):delete s[f]);if(r!==o)for(const f in r)(!e||!st(e,f))&&(delete r[f],u=!0)}u&&ai(n.attrs,"set","")}function Ud(n,e,t,i){const[s,r]=n.propsOptions;let a=!1,o;if(e)for(let l in e){if(or(l))continue;const u=e[l];let c;s&&st(s,c=tn(l))?!r||!r.includes(c)?t[c]=u:(o||(o={}))[c]=u:Wo(n.emitsOptions,l)||(!(l in i)||u!==i[l])&&(i[l]=u,a=!0)}if(r){const l=ot(t),u=o||ct;for(let c=0;c<r.length;c++){const f=r[c];t[f]=pl(s,l,f,u[f],n,!st(u,f))}}return a}function pl(n,e,t,i,s,r){const a=n[t];if(a!=null){const o=st(a,"default");if(o&&i===void 0){const l=a.default;if(a.type!==Function&&!a.skipFactory&&We(l)){const{propsDefaults:u}=s;if(t in u)i=u[t];else{const c=Dr(s);i=u[t]=l.call(null,e),c()}}else i=l;s.ce&&s.ce._setProp(t,i)}a[0]&&(r&&!o?i=!1:a[1]&&(i===""||i===os(t))&&(i=!0))}return i}const Dm=new WeakMap;function Nd(n,e,t=!1){const i=t?Dm:e.propsCache,s=i.get(n);if(s)return s;const r=n.props,a={},o=[];let l=!1;if(!We(n)){const c=f=>{l=!0;const[d,p]=Nd(f,e,!0);Lt(a,d),p&&o.push(...p)};!t&&e.mixins.length&&e.mixins.forEach(c),n.extends&&c(n.extends),n.mixins&&n.mixins.forEach(c)}if(!r&&!l)return at(n)&&i.set(n,$i),$i;if(Oe(r))for(let c=0;c<r.length;c++){const f=tn(r[c]);wc(f)&&(a[f]=ct)}else if(r)for(const c in r){const f=tn(c);if(wc(f)){const d=r[c],p=a[f]=Oe(d)||We(d)?{type:d}:Lt({},d),x=p.type;let _=!1,m=!0;if(Oe(x))for(let h=0;h<x.length;++h){const g=x[h],S=We(g)&&g.name;if(S==="Boolean"){_=!0;break}else S==="String"&&(m=!1)}else _=We(x)&&x.name==="Boolean";p[0]=_,p[1]=m,(_||st(p,"default"))&&o.push(f)}}const u=[a,o];return at(n)&&i.set(n,u),u}function wc(n){return n[0]!=="$"&&!or(n)}const ql=n=>n==="_"||n==="_ctx"||n==="$stable",Yl=n=>Oe(n)?n.map(Bn):[Bn(n)],Im=(n,e,t)=>{if(e._n)return e;const i=Zi((...s)=>Yl(e(...s)),t);return i._c=!1,i},Od=(n,e,t)=>{const i=n._ctx;for(const s in n){if(ql(s))continue;const r=n[s];if(We(r))e[s]=Im(s,r,i);else if(r!=null){const a=Yl(r);e[s]=()=>a}}},Fd=(n,e)=>{const t=Yl(e);n.slots.default=()=>t},Bd=(n,e,t)=>{for(const i in e)(t||!ql(i))&&(n[i]=e[i])},Um=(n,e,t)=>{const i=n.slots=Dd();if(n.vnode.shapeFlag&32){const s=e._;s?(Bd(i,e,t),t&&Xf(i,"_",s,!0)):Od(e,i)}else e&&Fd(n,e)},Nm=(n,e,t)=>{const{vnode:i,slots:s}=n;let r=!0,a=ct;if(i.shapeFlag&32){const o=e._;o?t&&o===1?r=!1:Bd(s,e,t):(r=!e.$stable,Od(e,s)),a=e}else e&&(Fd(n,e),a={default:1});if(r)for(const o in s)!ql(o)&&a[o]==null&&delete s[o]},Yt=Vm;function Om(n){return Fm(n)}function Fm(n,e){const t=Ho();t.__VUE__=!0;const{insert:i,remove:s,patchProp:r,createElement:a,createText:o,createComment:l,setText:u,setElementText:c,parentNode:f,nextSibling:d,setScopeId:p=kn,insertStaticContent:x}=n,_=(b,y,z,F=null,H=null,X=null,le=void 0,oe=null,E=!!y.dynamicChildren)=>{if(b===y)return;b&&!$s(b,y)&&(F=B(b),he(b,H,X,!0),b=null),y.patchFlag===-2&&(E=!1,y.dynamicChildren=null),y.dynamicChildren&&b&&b.dynamicChildren&&b.dynamicChildren.hasOnce&&(y.dynamicChildren===$i&&(y.dynamicChildren=[]),y.dynamicChildren.hasOnce=!0);const{type:v,ref:O,shapeFlag:j}=y;switch(v){case Xo:m(b,y,z,F);break;case Pn:h(b,y,z,F);break;case ga:b==null&&g(y,z,F,le);break;case mt:k(b,y,z,F,H,X,le,oe,E);break;default:j&1?I(b,y,z,F,H,X,le,oe,E):j&6?J(b,y,z,F,H,X,le,oe,E):(j&64||j&128)&&v.process(b,y,z,F,H,X,le,oe,E,re)}O!=null&&H?ur(O,b&&b.ref,X,y||b,!y):O==null&&b&&b.ref!=null&&ur(b.ref,null,X,b,!0)},m=(b,y,z,F)=>{if(b==null)i(y.el=o(y.children),z,F);else{const H=y.el=b.el;y.children!==b.children&&u(H,y.children)}},h=(b,y,z,F)=>{b==null?i(y.el=l(y.children||""),z,F):y.el=b.el},g=(b,y,z,F)=>{[b.el,b.anchor]=x(b.children,y,z,F,b.el,b.anchor)},S=({el:b,anchor:y},z,F)=>{let H;for(;b&&b!==y;)H=d(b),i(b,z,F),b=H;i(y,z,F)},M=({el:b,anchor:y})=>{let z;for(;b&&b!==y;)z=d(b),s(b),b=z;s(y)},I=(b,y,z,F,H,X,le,oe,E)=>{if(y.type==="svg"?le="svg":y.type==="math"&&(le="mathml"),b==null)L(y,z,F,H,X,le,oe,E);else{const v=b.el&&b.el._isVueCE?b.el:null;try{v&&v._beginPatch(),A(b,y,H,X,le,oe,E)}finally{v&&v._endPatch()}}},L=(b,y,z,F,H,X,le,oe)=>{let E,v;const{props:O,shapeFlag:j,transition:K,dirs:te}=b;if(E=b.el=a(b.type,X,O&&O.is,O),j&8?c(E,b.children):j&16&&ie(b.children,E,null,F,H,ma(b,X),le,oe),te&&zi(b,null,F,"created"),C(E,b,b.scopeId,le,F),O){for(const me in O)me!=="value"&&!or(me)&&r(E,me,null,O[me],X,F);"value"in O&&r(E,"value",null,O.value,X),(v=O.onVnodeBeforeMount)&&Un(v,F,b)}te&&zi(b,null,F,"beforeMount");const Me=Bm(H,K);Me?K.beforeEnter(E):K&&!K.persisted&&(E[Hm]=!0),i(E,y,z),((v=O&&O.onVnodeMounted)||Me||te)&&Yt(()=>{try{v&&Un(v,F,b),Me&&K.enter(E),te&&zi(b,null,F,"mounted")}finally{}},H)},C=(b,y,z,F,H)=>{if(z&&p(b,z),F)for(let X=0;X<F.length;X++)p(b,F[X]);if(H){let X=H.subTree;if(y===X||Vd(X.type)&&(X.ssContent===y||X.ssFallback===y)){const le=H.vnode;C(b,le,le.scopeId,le.slotScopeIds,H.parent)}}},ie=(b,y,z,F,H,X,le,oe,E=0)=>{for(let v=E;v<b.length;v++){const O=b[v]=oe?oi(b[v]):Bn(b[v]);_(null,O,y,z,F,H,X,le,oe)}},A=(b,y,z,F,H,X,le)=>{const oe=y.el=b.el;let{patchFlag:E,dynamicChildren:v,dirs:O}=y;E|=b.patchFlag&16;const j=b.props||ct,K=y.props||ct;let te;if(z&&Hi(z,!1),(te=K.onVnodeBeforeUpdate)&&Un(te,z,y,b),O&&zi(y,b,z,"beforeUpdate"),z&&Hi(z,!0),v&&(!b.dynamicChildren||b.dynamicChildren.length!==v.length)&&(E=0,le=!1,v=null),(j.innerHTML&&K.innerHTML==null||j.textContent&&K.textContent==null)&&c(oe,""),v?T(b.dynamicChildren,v,oe,z,F,ma(y,H),X):le||Z(b,y,oe,null,z,F,ma(y,H),X,!1),E>0){if(E&16)R(oe,j,K,z,H);else if(E&2&&j.class!==K.class&&r(oe,"class",null,K.class,H),E&4&&r(oe,"style",j.style,K.style,H),E&8){const Me=y.dynamicProps;for(let me=0;me<Me.length;me++){const ve=Me[me],we=j[ve],Le=K[ve];(Le!==we||ve==="value")&&r(oe,ve,we,Le,H,z)}}E&1&&b.children!==y.children&&c(oe,y.children)}else!le&&v==null&&R(oe,j,K,z,H);((te=K.onVnodeUpdated)||O)&&Yt(()=>{te&&Un(te,z,y,b),O&&zi(y,b,z,"updated")},F)},T=(b,y,z,F,H,X,le)=>{for(let oe=0;oe<y.length;oe++){const E=b[oe],v=y[oe],O=E.el||hr(E),j=O&&(E.type===mt||!$s(E,v)||E.shapeFlag&198)?f(O):z;_(E,v,j,null,F,H,X,le,!0)}},R=(b,y,z,F,H)=>{if(y!==z){if(y!==ct)for(const X in y)!or(X)&&!(X in z)&&r(b,X,y[X],null,H,F);for(const X in z){if(or(X))continue;const le=z[X],oe=y[X];le!==oe&&X!=="value"&&r(b,X,oe,le,H,F)}"value"in z&&r(b,"value",y.value,z.value,H)}},k=(b,y,z,F,H,X,le,oe,E)=>{const v=y.el=b?b.el:o(""),O=y.anchor=b?b.anchor:o("");let{patchFlag:j,dynamicChildren:K,slotScopeIds:te}=y;te&&(oe=oe?oe.concat(te):te),b==null?(i(v,z,F),i(O,z,F),ie(y.children||[],z,O,H,X,le,oe,E)):j>0&&j&64&&K&&b.dynamicChildren&&b.dynamicChildren.length===K.length?(T(b.dynamicChildren,K,z,H,X,le,oe),(y.key!=null||H&&y===H.subTree)&&zd(b,y,!0)):Z(b,y,z,O,H,X,le,oe,E)},J=(b,y,z,F,H,X,le,oe,E)=>{y.slotScopeIds=oe,b==null?y.shapeFlag&512?H.ctx.activate(y,z,F,le,E):U(y,z,F,H,X,le,E):V(b,y,E)},U=(b,y,z,F,H,X,le)=>{const oe=b.component=qm(b,F,H);if(Wl(b)&&(oe.ctx.renderer=re),Km(oe,!1,le),oe.asyncDep){if(H&&H.registerDep(oe,G,le,X),!b.el){const E=oe.subTree=Tt(Pn);h(null,E,y,z),b.placeholder=E.el}}else G(oe,b,y,z,H,X,le)},V=(b,y,z)=>{const F=y.component=b.component;if(Rm(b,y,z))if(F.asyncDep&&!F.asyncResolved){y.el=b.el,y.placeholder=b.placeholder,$(F,y,z);return}else F.next=y,F.update();else y.el=b.el,y.placeholder=b.placeholder,F.vnode=y},G=(b,y,z,F,H,X,le)=>{const oe=()=>{if(b.isMounted){let{next:j,bu:K,u:te,parent:Me,vnode:me}=b;{const je=Hd(b);if(je){j&&(j.el=me.el,$(b,j,le)),je.asyncDep.then(()=>{const ze=()=>{b.job.flags&8||(H&&H.pendingBranch?Yt(ze,H):v())};ze.flags=48,Yt(ze,H)});return}}let ve=j,we;Hi(b,!1),j?(j.el=me.el,$(b,j,le)):j=me,K&&po(K),(we=j.props&&j.props.onVnodeBeforeUpdate)&&Un(we,Me,j,me),Hi(b,!0);const Le=Tc(b),fe=b.subTree;b.subTree=Le,_(fe,Le,f(fe.el||hr(fe)),B(fe),b,H,X),j.el=Le.el,ve===null&&Cm(b,Le.el),te&&Yt(te,H),(we=j.props&&j.props.onVnodeUpdated)&&Yt(()=>Un(we,Me,j,me),H)}else{let j;const{el:K,props:te}=y,{bm:Me,m:me,parent:ve,root:we,type:Le}=b,fe=fr(y);Hi(b,!1),Me&&po(Me),!fe&&(j=te&&te.onVnodeBeforeMount)&&Un(j,ve,y),Hi(b,!0);{we.ce&&we.ce._hasShadowRoot()&&we.ce._injectChildStyle(Le,b.parent?b.parent.type:void 0);const je=b.subTree=Tc(b);_(null,je,z,F,b,H,X),y.el=je.el}if(me&&Yt(me,H),!fe&&(j=te&&te.onVnodeMounted)){const je=y;Yt(()=>Un(j,ve,je),H)}(y.shapeFlag&256||ve&&fr(ve.vnode)&&ve.vnode.shapeFlag&256)&&b.a&&Yt(b.a,H),b.isMounted=!0,y=z=F=null}};b.scope.on();const E=b.effect=new Kf(oe);b.scope.off();const v=b.update=E.run.bind(E),O=b.job=E.runIfDirty.bind(E);O.i=b,O.id=b.uid,E.scheduler=()=>kl(O),Hi(b,!0),v()},$=(b,y,z)=>{y.component=b;const F=b.vnode.props;b.vnode=y,b.next=null,Lm(b,y.props,F,z),Nm(b,y.children,z),qn(),md(b),Yn()},Z=(b,y,z,F,H,X,le,oe,E=!1)=>{const v=b&&b.children,O=b?b.shapeFlag:0,j=y.children,{patchFlag:K,shapeFlag:te}=y;if(K>0){if(K&128){ce(v,j,z,F,H,X,le,oe,E);return}else if(K&256){ae(v,j,z,F,H,X,le,oe,E);return}}te&8?(O&16&&ye(v,H,X),j!==v&&c(z,j)):O&16?te&16?ce(v,j,z,F,H,X,le,oe,E):ye(v,H,X,!0):(O&8&&c(z,""),te&16&&ie(j,z,F,H,X,le,oe,E))},ae=(b,y,z,F,H,X,le,oe,E)=>{b=b||$i,y=y||$i;const v=b.length,O=y.length,j=Math.min(v,O);let K;for(K=0;K<j;K++){const te=y[K]=E?oi(y[K]):Bn(y[K]);_(b[K],te,z,null,H,X,le,oe,E)}v>O?ye(b,H,X,!0,!1,j):ie(y,z,F,H,X,le,oe,E,j)},ce=(b,y,z,F,H,X,le,oe,E)=>{let v=0;const O=y.length;let j=b.length-1,K=O-1;for(;v<=j&&v<=K;){const te=b[v],Me=y[v]=E?oi(y[v]):Bn(y[v]);if($s(te,Me))_(te,Me,z,null,H,X,le,oe,E);else break;v++}for(;v<=j&&v<=K;){const te=b[j],Me=y[K]=E?oi(y[K]):Bn(y[K]);if($s(te,Me))_(te,Me,z,null,H,X,le,oe,E);else break;j--,K--}if(v>j){if(v<=K){const te=K+1,Me=te<O?y[te].el:F;for(;v<=K;)_(null,y[v]=E?oi(y[v]):Bn(y[v]),z,Me,H,X,le,oe,E),v++}}else if(v>K)for(;v<=j;)he(b[v],H,X,!0),v++;else{const te=v,Me=v,me=new Map;for(v=Me;v<=K;v++){const Re=y[v]=E?oi(y[v]):Bn(y[v]);Re.key!=null&&me.set(Re.key,v)}let ve,we=0;const Le=K-Me+1;let fe=!1,je=0;const ze=new Array(Le);for(v=0;v<Le;v++)ze[v]=0;for(v=te;v<=j;v++){const Re=b[v];if(we>=Le){he(Re,H,X,!0);continue}let be;if(Re.key!=null)be=me.get(Re.key);else for(ve=Me;ve<=K;ve++)if(ze[ve-Me]===0&&$s(Re,y[ve])){be=ve;break}be===void 0?he(Re,H,X,!0):(ze[be-Me]=v+1,be>=je?je=be:fe=!0,_(Re,y[be],z,null,H,X,le,oe,E),we++)}const He=fe?zm(ze):$i;for(ve=He.length-1,v=Le-1;v>=0;v--){const Re=Me+v,be=y[Re],D=y[Re+1],Se=Re+1<O?D.el||hr(D):F;ze[v]===0?_(null,be,z,Se,H,X,le,oe,E):fe&&(ve<0||v!==He[ve]?de(be,z,Se,2):ve--)}}},de=(b,y,z,F,H=null)=>{const{el:X,type:le,transition:oe,children:E,shapeFlag:v}=b;if(v&6){de(b.component.subTree,y,z,F);return}if(v&128){b.suspense.move(y,z,F);return}if(v&64){le.move(b,y,z,re);return}if(le===mt){i(X,y,z);for(let j=0;j<E.length;j++)de(E[j],y,z,F);i(b.anchor,y,z);return}if(le===ga){S(b,y,z);return}if(F!==2&&v&1&&oe)if(F===0)oe.persisted&&!X[ha]?i(X,y,z):(oe.beforeEnter(X),i(X,y,z),Yt(()=>oe.enter(X),H));else{const{leave:j,delayLeave:K,afterLeave:te}=oe,Me=()=>{b.ctx.isUnmounted?s(X):i(X,y,z)},me=()=>{const ve=X._isLeaving||!!X[ha];X._isLeaving&&X[ha](!0),oe.persisted&&!ve?Me():j(X,()=>{Me(),te&&te()})};K?K(X,Me,me):me()}else i(X,y,z)},he=(b,y,z,F=!1,H=!1)=>{const{type:X,props:le,ref:oe,children:E,dynamicChildren:v,shapeFlag:O,patchFlag:j,dirs:K,cacheIndex:te,memo:Me}=b;if((j===-2||v&&v.hasOnce)&&(H=!1),oe!=null&&(qn(),ur(oe,null,z,b,!0),Yn()),te!=null&&(!b.ctx||b.ctx===y)&&(y.renderCache[te]=void 0),O&256&&y.ctx.deactivate(b))return;const me=O&1&&K,ve=!fr(b);let we;if(ve&&(we=le&&le.onVnodeBeforeUnmount)&&Un(we,y,b),O&6)ge(b.component,z,F);else{if(O&128){b.suspense.unmount(z,F);return}me&&zi(b,null,y,"beforeUnmount"),O&64?b.type.remove(b,y,z,re,F):v&&!v.hasOnce&&(X!==mt||j>0&&j&64)?ye(v,y,z,!1,!0):(X===mt&&j&384||!H&&O&16)&&ye(E,y,z),F&&ee(b)}const Le=Me!=null&&te==null;(ve&&(we=le&&le.onVnodeUnmounted)||me||Le)&&Yt(()=>{we&&Un(we,y,b),me&&zi(b,null,y,"unmounted"),Le&&(b.el=null)},z)},ee=b=>{const{type:y,el:z,anchor:F,transition:H}=b,X=y===mt;if(X&&!H){Y(z,F);return}if(y===ga){M(b),H&&!H.persisted&&H.afterLeave&&H.afterLeave();return}const le=X?ul(b):b,oe=()=>{X?f(z)&&Y(z,F):s(z),H&&!H.persisted&&H.afterLeave&&H.afterLeave()};if(le&&le.shapeFlag&1&&H&&!H.persisted){const{leave:E,delayLeave:v}=H,O=le.el,j=()=>E(O,oe);v?v(O,oe,j):j()}else oe()},Y=(b,y)=>{let z;for(;b!==y;)z=d(b),s(b),b=z;s(y)},ge=(b,y,z)=>{const{bum:F,scope:H,job:X,subTree:le,um:oe,m:E,a:v}=b;Rc(E),Rc(v),F&&po(F),H.stop(),X?(X.flags|=8,he(le,b,y,z)):le&&(le.transition=b.vnode.transition,he(le,b,y,z)),oe&&Yt(oe,y);const O=()=>{b.isUnmounted=!0};O.flags=16,Yt(O,y)},ye=(b,y,z,F=!1,H=!1,X=0)=>{for(let le=X;le<b.length;le++)he(b[le],y,z,F,H)},B=b=>{if(b.shapeFlag&6)return B(b.component.subTree);if(b.shapeFlag&128)return b.suspense.next();const y=d(b.anchor||b.el),z=y&&y[Qp];return z?d(z):y},ue=(b,y,z)=>{const F=b&&y._vnode?void 0:b&&b.component?b.component.uid:jm();Kp(()=>{b==null?y._vnode&&he(y._vnode,null,null,!0):_(y._vnode||null,b,y,null,null,null,z),y._vnode=b},F)},re={p:_,um:he,m:de,r:ee,mt:U,mc:ie,pc:Z,pbc:T,n:B,o:n};return{render:ue,hydrate:void 0,createApp:ym(ue)}}function ma({type:n,props:e},t){return t==="svg"&&n==="foreignObject"||t==="mathml"&&n==="annotation-xml"&&e&&e.encoding&&e.encoding.includes("html")?void 0:t}function Hi({effect:n,job:e},t){t?(n.flags|=32,e.flags|=4):(n.flags&=-33,e.flags&=-5)}function Bm(n,e){return(!n||n&&!n.pendingBranch)&&e&&!e.persisted}function zd(n,e,t=!1){const i=n.children,s=e.children;if(Oe(i)&&Oe(s))for(let r=0;r<i.length;r++){const a=i[r];let o=s[r];o.shapeFlag&1&&!o.dynamicChildren&&((o.patchFlag<=0||o.patchFlag===32)&&(o=s[r]=oi(s[r]),o.el=a.el),!t&&o.patchFlag!==-2&&zd(a,o)),o.type===Xo&&(o.patchFlag===-1&&(o=s[r]=oi(o)),o.el=a.el),o.type===Pn&&!o.el&&(o.el=a.el)}}function zm(n){const e=n.slice(),t=[0];let i,s,r,a,o;const l=n.length;for(i=0;i<l;i++){const u=n[i];if(u!==0){if(s=t[t.length-1],n[s]<u){e[i]=s,t.push(i);continue}for(r=0,a=t.length-1;r<a;)o=r+a>>1,n[t[o]]<u?r=o+1:a=o;u<n[t[r]]&&(r>0&&(e[i]=t[r-1]),t[r]=i)}}for(r=t.length,a=t[r-1];r-- >0;)t[r]=a,a=e[a];return t}function Hd(n){const e=n.subTree.component;if(e)return e.asyncDep&&!e.asyncResolved?e:Hd(e)}function Rc(n){if(n)for(let e=0;e<n.length;e++)n[e].flags|=8}function hr(n){if(n.placeholder)return n.placeholder;const e=n.component;if(e)return hr(e.subTree);const t=n.suspense;return t&&t.activeBranch?hr(t.activeBranch):null}const Vd=n=>n.__isSuspense,Hm=Symbol("_deferredEnter");function Vm(n,e){e&&e.pendingBranch?Oe(n)?e.effects.push(...n):e.effects.push(n):Yp(n)}const mt=Symbol.for("v-fgt"),Xo=Symbol.for("v-txt"),Pn=Symbol.for("v-cmt"),ga=Symbol.for("v-stc"),Qi=[];let fn=null;function Ne(n=!1){Qi.push(fn=n?null:[])}function Gd(){Qi.pop(),fn=Qi[Qi.length-1]||null}let Mr=1;function To(n,e=!1){Mr+=n,n<0&&fn&&e&&(fn.hasOnce=!0)}function kd(n){return n.dynamicChildren=Mr>0?fn||$i:null,Gd(),Mr>0&&fn&&fn.push(n),n}function Be(n,e,t,i,s,r){return kd(P(n,e,t,i,s,r,!0))}function Kl(n,e,t,i,s){return kd(Tt(n,e,t,i,s,!0))}function Sr(n){return n?n.__v_isVNode===!0:!1}function $s(n,e){return n.type===e.type&&n.key===e.key}const Wd=({key:n})=>n??null,go=({ref:n,ref_key:e,ref_for:t})=>(typeof n=="number"&&(n=""+n),n!=null?St(n)||jt(n)||We(n)?{i:un,r:n,k:e,f:!!t}:n:null);function P(n,e=null,t=null,i=0,s=null,r=n===mt?0:1,a=!1,o=!1){const l={__v_isVNode:!0,__v_skip:!0,type:n,props:e,key:e&&Wd(e),ref:e&&go(e),scopeId:vd,slotScopeIds:null,children:t,component:null,suspense:null,ssContent:null,ssFallback:null,dirs:null,transition:null,el:null,anchor:null,target:null,targetStart:null,targetAnchor:null,staticCount:0,shapeFlag:r,patchFlag:i,dynamicProps:s,dynamicChildren:null,appContext:null,ctx:un};return o?(Ao(l,t),r&128&&n.normalize(l)):t&&(l.shapeFlag|=St(t)?8:16),Mr>0&&!a&&fn&&(l.patchFlag>0||r&6)&&l.patchFlag!==32&&fn.push(l),l}const Tt=Gm;function Gm(n,e=null,t=null,i=0,s=null,r=!1){if((!n||n===hm)&&(n=Pn),Sr(n)){const o=Bs(n,e,!0);return t&&Ao(o,t),Mr>0&&!r&&fn&&(o.shapeFlag&6?fn[fn.indexOf(n)]=o:fn.push(o)),o.patchFlag=-2,o}if(eg(n)&&(n=n.__vccOpts),e){e=km(e);let{class:o,style:l}=e;o&&!St(o)&&(e.class=Vn(o)),at(l)&&(Vl(l)&&!Oe(l)&&(l=Lt({},l)),e.style=en(l))}const a=St(n)?1:Vd(n)?128:ko(n)?64:at(n)?4:We(n)?2:0;return P(n,e,t,i,s,a,r,!0)}function km(n){return n?Vl(n)?Lt({},n):Id(n)?Lt({},n[Yd]||n):n:null}function Bs(n,e,t=!1,i=!1){const{props:s,ref:r,patchFlag:a,children:o,transition:l}=n,u=e?Wm(s||{},e):s,c={__v_isVNode:!0,__v_skip:!0,type:n.type,props:u,key:u&&Wd(u),ref:e&&e.ref?t&&r?Oe(r)?r.concat(go(e)):[r,go(e)]:go(e):r,scopeId:n.scopeId,slotScopeIds:n.slotScopeIds,children:o,target:n.target,targetStart:n.targetStart,targetAnchor:n.targetAnchor,staticCount:n.staticCount,shapeFlag:n.shapeFlag,patchFlag:e&&n.type!==mt?a===-1?16:a|16:a,dynamicProps:n.dynamicProps,dynamicChildren:n.dynamicChildren,appContext:n.appContext,dirs:n.dirs,transition:l,component:n.component,suspense:n.suspense,ssContent:n.ssContent&&Bs(n.ssContent),ssFallback:n.ssFallback&&Bs(n.ssFallback),placeholder:n.placeholder,el:n.el,anchor:n.anchor,ctx:n.ctx,ce:n.ce,cacheIndex:n.cacheIndex};return l&&i&&cr(c,l.clone(c)),c}function ut(n=" ",e=0){return Tt(Xo,null,n,e)}function cn(n="",e=!1){return e?(Ne(),Kl(Pn,null,n)):Tt(Pn,null,n)}function Bn(n){return n==null||typeof n=="boolean"?Tt(Pn):Oe(n)?Tt(mt,null,n.slice()):Sr(n)?oi(n):Tt(Xo,null,String(n))}function oi(n){return n.el===null&&n.patchFlag!==-1||n.memo?n:Bs(n)}function Ao(n,e){let t=0;const{shapeFlag:i}=n;if(e==null)e=null;else if(Oe(e))t=16;else if(typeof e=="object")if(i&65){const s=e.default;s&&(s._c&&(s._d=!1),Ao(n,s()),s._c&&(s._d=!0));return}else{t=32;const s=e._;!s&&!Id(e)?e._ctx=un:s===3&&un&&(un.slots._===1?e._=1:(e._=2,n.patchFlag|=1024))}else if(We(e)){if(i&65){Ao(n,{default:e});return}e={default:e,_ctx:un},t=32}else e=String(e),i&64?(t=16,e=[ut(e)]):t=8;n.children=e,n.shapeFlag|=t}function Wm(...n){const e={};for(let t=0;t<n.length;t++){const i=n[t];for(const s in i)if(s==="class")e.class!==i.class&&(e.class=Vn([e.class,i.class]));else if(s==="style")e.style=en([e.style,i.style]);else if(Oo(s)){const r=e[s],a=i[s];a&&r!==a&&!(Oe(r)&&r.includes(a))?e[s]=r?[].concat(r,a):a:a==null&&r==null&&!Fo(s)&&(e[s]=a)}else s!==""&&(e[s]=i[s])}return e}function Un(n,e,t,i=null){Cn(n,e,7,[t,i])}const Xm=wd();let Xd=0;function jm(){return Xd}function qm(n,e,t){const i=n.type,s=(e?e.appContext:n.appContext)||Xm,r={uid:Xd++,vnode:n,type:i,parent:e,appContext:s,root:null,next:null,subTree:null,effect:null,update:null,job:null,scope:new Mp(!0),render:null,proxy:null,exposed:null,exposeProxy:null,withProxy:null,provides:e?e.provides:Object.create(s.provides),ids:e?e.ids:["",0,0],accessCache:null,renderCache:[],components:null,directives:null,propsOptions:Nd(i,s),emitsOptions:Rd(i,s),emit:null,emitted:null,propsDefaults:ct,inheritAttrs:i.inheritAttrs,ctx:ct,data:ct,props:ct,attrs:ct,slots:ct,refs:ct,setupState:ct,setupContext:null,suspense:t,suspenseId:t?t.pendingId:0,asyncDep:null,asyncResolved:!1,isMounted:!1,isUnmounted:!1,isDeactivated:!1,bc:null,c:null,bm:null,m:null,bu:null,u:null,um:null,bum:null,da:null,a:null,rtg:null,rtc:null,ec:null,sp:null};return r.ctx={_:r},r.root=e?e.root:r,r.emit=bm.bind(null,r),n.ce&&n.ce(r),r}let Xt=null;const Ym=()=>Xt||un;let wo,yr;{const n=Ho(),e=(t,i)=>{let s;return(s=n[t])||(s=n[t]=[]),s.push(i),r=>{s.length>1?s.forEach(a=>a(r)):s[0](r)}};wo=e("__VUE_INSTANCE_SETTERS__",t=>Xt=t),yr=e("__VUE_SSR_SETTERS__",t=>Er=t)}const Dr=n=>{const e=Xt;return wo(n),n.scope.on(),()=>{n.scope.off(),wo(e)}},Cc=()=>{Xt&&Xt.scope.off(),wo(null)};function jd(n){return n.vnode.shapeFlag&4}let Er=!1;function Km(n,e=!1,t=!1){e&&yr(e);const{props:i,children:s}=n.vnode,r=jd(n);Pm(n,i,r,e),Um(n,s,t||e);const a=r?$m(n,e):void 0;return e&&yr(!1),a}function $m(n,e){const t=n.type;n.accessCache=Object.create(null),n.proxy=new Proxy(n.ctx,mm);const{setup:i}=t;if(i){qn();const s=n.setupContext=i.length>1?Jm(n):null,r=Dr(n),a=Lr(i,n,0,[n.props,s]),o=Gf(a);if(Yn(),r(),(o||n.sp)&&!fr(n)&&Ed(n),o){if(a.then(Cc,Cc),e)return a.then(l=>{yr(!0);try{Pc(n,l,e)}finally{yr(!1)}}).catch(l=>{Go(l,n,0,void 0,!0),n.ssrRender=(u,c)=>c("<!---->")});n.asyncDep=a}else Pc(n,a)}else qd(n)}function Pc(n,e,t){We(e)?n.type.__ssrInlineRender?n.ssrRender=e:n.render=e:at(e)&&(n.setupState=dd(e)),qd(n)}function qd(n,e,t){const i=n.type;n.render||(n.render=i.render||kn);{const s=Dr(n);qn();try{gm(n)}finally{Yn(),s()}}}const Yd=Symbol(),Zm={get(n,e){return Wt(n,"get",""),e===Yd?n:n[e]}};function Jm(n){const e=t=>{n.exposed=t||{}};return{attrs:new Proxy(n.attrs,Zm),slots:n.slots,emit:n.emit,expose:e}}function jo(n){return n.exposed?n.exposeProxy||(n.exposeProxy=new Proxy(dd(Bp(n.exposed)),{get(e,t){if(t in e)return e[t];if(t in dr)return dr[t](n)},has(e,t){return t in e||t in dr}})):n.proxy}function Qm(n,e=!0){return We(n)?n.displayName||n.name:n.name||e&&n.__name}function eg(n){return We(n)&&"__vccOpts"in n}const ht=(n,e)=>kp(n,e,Er);function Kd(n,e,t){try{To(-1);const i=arguments.length;return i===2?at(e)&&!Oe(e)?Sr(e)?Tt(n,null,[e]):Tt(n,e):Tt(n,null,e):(i>3?t=Array.prototype.slice.call(arguments,2):i===3&&Sr(t)&&(t=[t]),Tt(n,e,t))}finally{To(1)}}const tg="3.5.45";/**
* @vue/runtime-dom v3.5.45
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/let ml;const Lc=typeof window<"u"&&window.trustedTypes;if(Lc)try{ml=Lc.createPolicy("vue",{createHTML:n=>n})}catch{}const $d=ml?n=>ml.createHTML(n):n=>n,ng="http://www.w3.org/2000/svg",ig="http://www.w3.org/1998/Math/MathML",ri=typeof document<"u"?document:null,Dc=ri&&ri.createElement("template"),sg={insert:(n,e,t)=>{e.insertBefore(n,t||null)},remove:n=>{const e=n.parentNode;e&&e.removeChild(n)},createElement:(n,e,t,i)=>{const s=e==="svg"?ri.createElementNS(ng,n):e==="mathml"?ri.createElementNS(ig,n):t?ri.createElement(n,{is:t}):ri.createElement(n);return n==="select"&&i&&i.multiple!=null&&s.setAttribute("multiple",i.multiple),s},createText:n=>ri.createTextNode(n),createComment:n=>ri.createComment(n),setText:(n,e)=>{n.nodeValue=e},setElementText:(n,e)=>{n.textContent=e},parentNode:n=>n.parentNode,nextSibling:n=>n.nextSibling,querySelector:n=>ri.querySelector(n),setScopeId(n,e){n.setAttribute(e,"")},insertStaticContent(n,e,t,i,s,r){const a=t?t.previousSibling:e.lastChild;if(s&&(s===r||s.nextSibling))for(;e.insertBefore(s.cloneNode(!0),t),!(s===r||!(s=s.nextSibling)););else{Dc.innerHTML=$d(i==="svg"?`<svg>${n}</svg>`:i==="mathml"?`<math>${n}</math>`:n);const o=Dc.content;if(i==="svg"||i==="mathml"){const l=o.firstChild;for(;l.firstChild;)o.appendChild(l.firstChild);o.removeChild(l)}e.insertBefore(o,t)}return[a?a.nextSibling:e.firstChild,t?t.previousSibling:e.lastChild]}},rg=Symbol("_vtc");function og(n,e,t){const i=n[rg];i&&(e=(e?[e,...i]:[...i]).join(" ")),e==null?n.removeAttribute("class"):t?n.setAttribute("class",e):n.className=e}const Ro=Symbol("_vod"),Zd=Symbol("_vsh"),ag={name:"show",beforeMount(n,{value:e},{transition:t}){n[Ro]=n.style.display==="none"?"":n.style.display,t&&e?t.beforeEnter(n):Zs(n,e)},mounted(n,{value:e},{transition:t}){t&&e&&t.enter(n)},updated(n,{value:e,oldValue:t},{transition:i}){!e!=!t&&(i?e?(i.beforeEnter(n),Zs(n,!0),i.enter(n)):i.leave(n,()=>{Zs(n,!1)}):Zs(n,e))},beforeUnmount(n,{value:e}){Zs(n,e)}};function Zs(n,e){n.style.display=e?n[Ro]:"none",n[Zd]=!e}const lg=Symbol(""),cg=/(?:^|;)\s*display\s*:/;function ug(n,e,t){const i=n.style,s=St(t);let r=!1;if(t&&!s){if(e)if(St(e))for(const a of e.split(";")){const o=a.slice(0,a.indexOf(":")).trim();t[o]==null&&rr(i,o,"")}else for(const a in e)t[a]==null&&rr(i,a,"");for(const a in t){a==="display"&&(r=!0);const o=t[a];o!=null?dg(n,a,!St(e)&&e?e[a]:void 0,o)||rr(i,a,o):rr(i,a,"")}}else if(s){if(e!==t){const a=i[lg];a&&(t+=";"+a),i.cssText=t,r=cg.test(t)}}else e&&n.removeAttribute("style");Ro in n&&((!s||e!==t)&&(n[Ro]=r?i.display:""),n[Zd]&&(i.display="none"))}const Hr=/\s*!important$/;function rr(n,e,t){if(Oe(t))t.forEach(i=>rr(n,e,i));else if(t==null&&(t=""),e.startsWith("--"))Hr.test(t)?n.setProperty(e,t.replace(Hr,""),"important"):n.setProperty(e,t);else{const i=fg(n,e);Hr.test(t)?n.setProperty(os(i),t.replace(Hr,""),"important"):n[i]=t}}const Ic=["Webkit","Moz","ms"],_a={};function fg(n,e){const t=_a[e];if(t)return t;let i=tn(e);if(i!=="filter"&&i in n)return _a[e]=i;i=zo(i);for(let s=0;s<Ic.length;s++){const r=Ic[s]+i;if(r in n)return _a[e]=r}return e}function dg(n,e,t,i){return n.tagName==="TEXTAREA"&&(e==="width"||e==="height")&&St(i)&&t===i}const Uc="http://www.w3.org/1999/xlink";function Nc(n,e,t,i,s,r=_p(e)){i&&e.startsWith("xlink:")?t==null?n.removeAttributeNS(Uc,e.slice(6,e.length)):n.setAttributeNS(Uc,e,t):t==null||r&&!jf(t)?n.removeAttribute(e):n.setAttribute(e,r?"":jn(t)?String(t):t)}function Oc(n,e,t,i,s){if(e==="innerHTML"||e==="textContent"){t!=null&&(n[e]=e==="innerHTML"?$d(t):t);return}const r=n.tagName;if(e==="value"&&r!=="PROGRESS"&&!r.includes("-")){const o=r==="OPTION"?n.getAttribute("value")||"":n.value,l=t==null?n.type==="checkbox"?"on":"":String(t);(o!==l||!("_value"in n))&&(n.value=l),t==null&&n.removeAttribute(e),n._value=t;return}let a=!1;if(t===""||t==null){const o=typeof n[e];o==="boolean"?t=jf(t):t==null&&o==="string"?(t="",a=!0):o==="number"&&(t=0,a=!0)}try{n[e]=t}catch{}a&&n.removeAttribute(s||e)}function wi(n,e,t,i){n.addEventListener(e,t,i)}function hg(n,e,t,i){n.removeEventListener(e,t,i)}const Fc=Symbol("_vei");function pg(n,e,t,i,s=null){const r=n[Fc]||(n[Fc]={}),a=r[e];if(i&&a)a.value=i;else{const[o,l]=_g(e);if(i){const u=r[e]=Mg(i,s);wi(n,o,u,l)}else a&&(hg(n,o,a,l),r[e]=void 0)}}const mg=/(Once|Passive|Capture)$/,gg=/^on:?(?:Once|Passive|Capture)$/;function _g(n){let e,t;for(;(t=n.match(mg))&&!gg.test(n);)e||(e={}),n=n.slice(0,n.length-t[1].length),e[t[1].toLowerCase()]=!0;return[n[2]===":"?n.slice(3):os(n.slice(2)),e]}let va=0;const vg=Promise.resolve(),xg=()=>va||(vg.then(()=>va=0),va=Date.now());function Mg(n,e){const t=i=>{if(!i._vts)i._vts=Date.now();else if(i._vts<=t.attached)return;const s=t.value;if(Oe(s)){const r=i.stopImmediatePropagation;i.stopImmediatePropagation=()=>{r.call(i),i._stopped=!0};const a=s.slice(),o=[i];for(let l=0;l<a.length&&!i._stopped;l++){const u=a[l];u&&Cn(u,e,5,o)}}else Cn(s,e,5,[i])};return t.value=n,t.attached=xg(),t}const Bc=n=>n.charCodeAt(0)===111&&n.charCodeAt(1)===110&&n.charCodeAt(2)>96&&n.charCodeAt(2)<123,Sg=(n,e,t,i,s,r)=>{const a=s==="svg";e==="class"?og(n,i,a):e==="style"?ug(n,t,i):Oo(e)?Fo(e)||pg(n,e,t,i,r):(e[0]==="."?(e=e.slice(1),!0):e[0]==="^"?(e=e.slice(1),!1):yg(n,e,i,a))?(Oc(n,e,i),!n.tagName.includes("-")&&(e==="value"||e==="checked"||e==="selected")&&Nc(n,e,i,a,r,e!=="value")):n._isVueCE&&(Eg(n,e)||n._def.__asyncLoader&&(/[A-Z]/.test(e)||!St(i)))?Oc(n,tn(e),i,r,e):(e==="true-value"?n._trueValue=i:e==="false-value"&&(n._falseValue=i),Nc(n,e,i,a))};function yg(n,e,t,i){if(i)return!!(e==="innerHTML"||e==="textContent"||e in n&&Bc(e)&&We(t));if(e==="spellcheck"||e==="draggable"||e==="translate"||e==="autocorrect"||e==="sandbox"&&n.tagName==="IFRAME"||e==="form"||e==="list"&&n.tagName==="INPUT"||e==="type"&&n.tagName==="TEXTAREA")return!1;if(e==="width"||e==="height"){const s=n.tagName;if(s==="IMG"||s==="VIDEO"||s==="CANVAS"||s==="SOURCE")return!1}return Bc(e)&&St(t)?!1:e in n}function Eg(n,e){const t=n._def.props;if(!t)return!1;const i=tn(e);return Array.isArray(t)?t.some(s=>tn(s)===i):Object.keys(t).some(s=>tn(s)===i)}const zs=n=>{const e=n.props["onUpdate:modelValue"]||!1;return Oe(e)?t=>po(e,t):e};function bg(n){n.target.composing=!0}function zc(n){const e=n.target;e.composing&&(e.composing=!1,e.dispatchEvent(new Event("input")))}const Gn=Symbol("_assign"),Vr=Symbol("_initialValue");function xa(n,e,t){return e&&(n=n.trim()),t&&(n=Pr(n)),n}const bt={created(n,{modifiers:{lazy:e,trim:t,number:i}},s){n.parentNode&&(n.type==="text"?n[Vr]=n.defaultValue.replace(/[\r\n]/g,""):n.type==="textarea"&&(n[Vr]=n.defaultValue.replace(/\r\n?/g,`
`))),n[Gn]=zs(s);const r=i||s.props&&s.props.type==="number";wi(n,e?"change":"input",a=>{a.target.composing||n[Gn](xa(n.value,t,r))}),(t||r)&&wi(n,"change",()=>{n.value=xa(n.value,t,r)}),e||(wi(n,"compositionstart",bg),wi(n,"compositionend",zc),wi(n,"change",zc))},mounted(n,{value:e,modifiers:{trim:t,number:i}}){const s=e??"",r=n[Vr];delete n[Vr],r!==void 0&&(n.type==="text"||n.type==="textarea")&&n.value!==r?n[Gn](xa(n.value,t,i)):n.value=s},beforeUpdate(n,{value:e,oldValue:t,modifiers:{lazy:i,trim:s,number:r}},a){if(n[Gn]=zs(a),n.composing)return;const o=(r||n.type==="number")&&!/^0\d/.test(n.value)?Pr(n.value):n.value,l=e??"";if(o===l)return;const u=n.getRootNode();(u instanceof Document||u instanceof ShadowRoot)&&u.activeElement===n&&n.type!=="range"&&(i&&e===t||s&&n.value.trim()===l)||(n.value=l)}},Tg={deep:!0,created(n,e,t){n[Gn]=zs(t),wi(n,"change",()=>{const i=n._modelValue,s=br(n),r=n.checked,a=n[Gn];if(Oe(i)){const o=Ul(i,s),l=o!==-1;if(r&&!l)a(i.concat(s));else if(!r&&l){const u=[...i];u.splice(o,1),a(u)}}else if(pi(i)){const o=new Set(i);r?o.add(s):o.delete(s),a(o)}else a(Jd(n,r))})},mounted:Hc,beforeUpdate(n,e,t){n[Gn]=zs(t),Hc(n,e,t)}};function Hc(n,{value:e,oldValue:t},i){n._modelValue=e;let s;if(Oe(e))s=Ul(e,i.props.value)>-1;else if(pi(e))s=e.has(i.props.value);else{if(e===t)return;s=mi(e,Jd(n,!0))}n.checked!==s&&(n.checked=s)}const gl={deep:!0,created(n,{value:e,modifiers:{number:t}},i){n._modelValue=e,wi(n,"change",()=>{const s=Array.prototype.filter.call(n.options,l=>l.selected).map(l=>t?Pr(br(l)):br(l)),r=n.multiple,a=r?pi(n._modelValue)?new Set(s):s:s[0],o=n._pendingValue=[r,r?Oe(a)?s.slice():s:a];try{n[Gn](a)}finally{Gl(()=>{n._pendingValue===o&&(n._pendingValue=void 0)})}}),n[Gn]=zs(i)},mounted(n,{value:e,modifiers:{number:t}}){Vc(n,e,t)},beforeUpdate(n,{value:e},t){n._modelValue=e,n[Gn]=zs(t)},updated(n,{value:e,modifiers:{number:t}}){const i=n._pendingValue;n._pendingValue=void 0,(!i||i[0]!==n.multiple||!Ag(e,i[1],i[0]))&&Vc(n,e,t)}};function Ag(n,e,t){if(!t||Oe(n))return mi(n,e);if(pi(n)){if(n.size!==e.length)return!1;for(const i of e)if(!n.has(i))return!1;return!0}return!1}function Vc(n,e,t=!1){const i=n.multiple,s=Oe(e);if(!(i&&!s&&!pi(e))){for(let r=0,a=n.options.length;r<a;r++){const o=n.options[r],l=br(o);if(i)if(s){const u=typeof l;u==="string"||u==="number"?o.selected=e.some(c=>String(c)===String(l)):o.selected=Ul(e,l)>-1}else o.selected=e.has(l)||t&&typeof l=="string"&&e.has(Pr(l));else if(mi(br(o),e)){n.selectedIndex!==r&&(n.selectedIndex=r);return}}!i&&n.selectedIndex!==-1&&(n.selectedIndex=-1)}}function br(n){return"_value"in n?n._value:n.value}function Jd(n,e){const t=e?"_trueValue":"_falseValue";return t in n?n[t]:e}const wg=["ctrl","shift","alt","meta"],Rg={stop:n=>n.stopPropagation(),prevent:n=>n.preventDefault(),self:n=>n.target!==n.currentTarget,ctrl:n=>!n.ctrlKey,shift:n=>!n.shiftKey,alt:n=>!n.altKey,meta:n=>!n.metaKey,left:n=>"button"in n&&n.button!==0,middle:n=>"button"in n&&n.button!==1,right:n=>"button"in n&&n.button!==2,exact:(n,e)=>wg.some(t=>n[`${t}Key`]&&!e.includes(t))},Gc=(n,e)=>{if(!n)return n;const t=n._withMods||(n._withMods={}),i=e.join(".");return t[i]||(t[i]=(s,...r)=>{for(let a=0;a<e.length;a++){const o=Rg[e[a]];if(o&&o(s,e))return}return n(s,...r)})},Cg=Lt({patchProp:Sg},sg);let kc;function Pg(){return kc||(kc=Om(Cg))}const Lg=(...n)=>{const e=Pg().createApp(...n),{mount:t}=e;return e.mount=i=>{const s=Ig(i);if(!s)return;const r=e._component;!We(r)&&!r.render&&!r.template&&(r.template=s.innerHTML),s.nodeType===1&&(s.textContent="");const a=t(s,!1,Dg(s));return s instanceof Element&&(s.removeAttribute("v-cloak"),s.setAttribute("data-v-app","")),a},e};function Dg(n){if(n instanceof SVGElement)return"svg";if(typeof MathMLElement=="function"&&n instanceof MathMLElement)return"mathml"}function Ig(n){return St(n)?document.querySelector(n):n}const Co=[{id:"hg-1k",name:"高压汞灯管 1kW",length:1.2,power:1e3,k:.1,m:2,desc:"通用固化,光谱宽"},{id:"hg-2k",name:"高压汞灯管 2kW",length:1.6,power:2e3,k:.1,m:2,desc:"大幅面高能量"},{id:"led-300",name:"UV-LED线光源 300W",length:.8,power:300,k:.17,m:1.5,desc:"窄光谱,热辐射低"},{id:"mh-500",name:"金属卤素灯 500W",length:1,power:500,k:.12,m:2.2,desc:"铁灯,深层固化"}];function qo(n){return Co.find(e=>e.id===n.model)||Co[0]}const Ma=8;function Qd(n,e,t){const i=(n.yaw||0)*Math.PI/180,s=(n.angle||0)*Math.PI/180,r=Math.cos(i),a=Math.sin(i),o=-Math.sin(s)*Math.sin(i),l=Math.sin(s)*Math.cos(i),u=-Math.cos(s),c=qo(n),f=c.length,d=n.power/Ma;let p=0;for(let x=0;x<Ma;x++){const _=(x+.5)/Ma-.5,m={x:n.x+r*_*f,y:n.y+a*_*f,z:n.z},h=e.x-m.x,g=e.y-m.y,S=e.z-m.z,M=h*h+g*g+S*S;if(M<1e-8)continue;const I=Math.sqrt(M),L=(o*h+l*g+u*S)/I;if(L<=0)continue;const C=-S/I;if(C<=0)continue;let ie=d*c.k*Math.pow(L,c.m)*C/M;if(n.range&&I>n.range){const A=n.range/I;ie*=A*A}Ug(m,e,t)||(p+=ie)}return p}function Ug(n,e,t){for(const i of t){const s=e.x-n.x,r=e.y-n.y,a=e.z-n.z;let o=.001,l=.999,u=!0;const c=[[n.x,s,i.minx,i.maxx],[n.y,r,i.miny,i.maxy],[n.z,a,i.minz,i.maxz]];for(const[f,d,p,x]of c){if(Math.abs(d)<1e-9){if(f<p||f>x){u=!1;break}continue}let _=(p-f)/d,m=(x-f)/d;if(_>m){const h=_;_=m,m=h}if(o=Math.max(o,_),l=Math.min(l,m),o>l){u=!1;break}}if(u)return!0}return!1}function eh(n){return n.workpieces.map(e=>({minx:e.x-e.w/2,maxx:e.x+e.w/2,miny:e.y-e.d/2,maxy:e.y+e.d/2,minz:.8,maxz:.8+e.h}))}const th={day:1.5,night:.15};function Ng(n,e){const i=Math.ceil(e.w/.15),s=Math.ceil(e.h/.15),r=.8+n.params.surfaceZ,a=eh(n),o=th[n.params.shift]||0,l=new Float32Array(i*s);let u=0;for(let c=0;c<s;c++)for(let f=0;f<i;f++){const d=(f+.5)*.15,p=(c+.5)*.15;let x=r;for(const h of n.workpieces)Math.abs(d-h.x)<h.w/2&&Math.abs(p-h.y)<h.d/2&&(x=Math.max(x,.8+h.h+.01));const _={x:d,y:p,z:x};let m=o;for(const h of n.lamps)m+=Qd(h,_,a);l[c*i+f]=m,m>u&&(u=m)}return{cols:i,rows:s,cell:.15,data:l,max:u}}function nh(n){const e=eh(n),t=th[n.params.shift]||0,i=[];for(const s of n.workpieces){const r=Math.max(2,Math.round(s.w/.12)),a=Math.max(2,Math.round(s.d/.12));for(let o=0;o<r;o++)for(let l=0;l<a;l++){const u={x:s.x-s.w/2+(o+.5)*s.w/r,y:s.y-s.d/2+(l+.5)*s.d/a,z:.8+s.h+.01};let c=t;for(const f of n.lamps)c+=Qd(f,u,e);i.push({x:u.x,y:u.y,z:u.z,e:c,wp:s.name})}}return i}function ih(n,e){if(!n.length)return{n:0,avg:0,min:0,max:0,u0:0,u1:0,passRate:0,pass:!1};let t=1/0,i=0,s=0,r=0;for(const l of n)s+=l.e,l.e<t&&(t=l.e),l.e>i&&(i=l.e),l.e>=e.stdMin&&l.e<=e.stdMax&&r++;const a=s/n.length,o=a>0?t/a:0;return{n:n.length,avg:a,min:t,max:i,u0:i>0?t/i:0,u1:o,passRate:r/n.length,pass:t>=e.stdMin&&o>=e.uStd&&i<=e.stdMax}}function Wc(n,e,t){const{cols:i,rows:s,cell:r,data:a}=n,o=new Uint8Array(i*s),l=[],u=t==="below"?c=>c<e:c=>c>e;for(let c=0;c<a.length;c++){if(o[c]||!u(a[c]))continue;const f=[c];o[c]=1;const d=[];let p=t==="below"?1/0:0;for(;f.length;){const x=f.pop(),_=Math.floor(x/i),m=x%i,h=(m+.5)*r,g=(_+.5)*r;d.push([h,g]);const S=a[x];p=t==="below"?Math.min(p,S):Math.max(p,S);const M=[[_-1,m],[_+1,m],[_,m-1],[_,m+1]];for(const[I,L]of M){if(I<0||I>=s||L<0||L>=i)continue;const C=I*i+L;!o[C]&&u(a[C])&&(o[C]=1,f.push(C))}}if(d.length>=3){let x=0,_=0;for(const[h,g]of d)x+=h,_+=g;x/=d.length,_/=d.length;let m=0;for(const[h,g]of d)m=Math.max(m,Math.hypot(h-x,g-_));l.push({cx:+x.toFixed(2),cy:+_.toFixed(2),r:+(m+r/2).toFixed(2),area:+(d.length*r*r).toFixed(3),n:d.length,ext:+p.toFixed(1),cells:d.slice(0,10).map(([h,g])=>[+h.toFixed(2),+g.toFixed(2)])})}}return l.sort((c,f)=>f.area-c.area)}function Og(n,e){const t=as({grid:null,cols:0,rows:0,cell:.15,max:0,samples:[],stats:null,dark:[],over:[],version:0});let i=null;function s(){const r=n.scheme,a=Ng(r,e);t.grid=a.data,t.cols=a.cols,t.rows=a.rows,t.cell=a.cell,t.max=a.max,t.samples=nh(r),t.stats=ih(t.samples,r.params),t.dark=Wc(a,r.params.stdMin,"below"),t.over=Wc(a,r.params.stdMax,"above"),t.version++}return hi(()=>n.scheme,()=>{clearTimeout(i),i=setTimeout(s,120)},{deep:!0}),s(),t}const Je={w:14,h:9},Bt={y:4.5,x0:.8,x1:13.2,z:.8},sh="uv-curing-tool-v1";function rh(){return["上件工位","除尘/前处理","底漆喷涂","流平","UV固化","下件检验"].map((n,e)=>({id:"w"+e,name:n,done:!1}))}function Fg(){return{shift:"day",stdMin:60,stdMax:140,uStd:.7,surfaceZ:.35}}function oh(n,e=6){const t=Bt.x1-Bt.x0;n.workpieces=[];for(let i=0;i<e;i++)n.workpieces.push({id:"wp"+Math.random().toString(36).slice(2,7),name:"工件"+(i+1),x:+(Bt.x0+t*(i+.5)/e).toFixed(2),y:Bt.y,w:.9,d:.6,h:.35})}function ah(){const n={lamps:[],workpieces:[],params:Fg()};return oh(n,6),n}function Bg(){const n=ah();n.lamps=[{id:"L1",model:"hg-1k",name:"高压汞灯管 1kW",x:4.5,y:4.5,z:2.3,angle:12,yaw:90,power:1e3,range:3.5,locked:!1},{id:"L2",model:"hg-1k",name:"高压汞灯管 1kW",x:7,y:4.5,z:2.3,angle:-12,yaw:90,power:1e3,range:3.5,locked:!1},{id:"L3",model:"led-300",name:"UV-LED线光源 300W",x:9.5,y:4.5,z:1.8,angle:0,yaw:90,power:300,range:2.5,locked:!1}];const e={id:"P-demo",name:"汽车内饰件UV固化线",customer:"华骏汽配",product:"ABS内饰面板",qty:12e3,deadline:"2026-12-15",status:"设计中",rework:1,createdAt:"2026-11-10 09:30",history:[{time:"2026-11-10 09:30",action:"客户下单",by:"客户"},{time:"2026-11-12 14:00",action:"提交审核",by:"制作员"},{time:"2026-11-13 10:20",action:"审核退回:固化段均匀度不足",by:"主管"}],workItems:rh(),scheme:n,versions:[]},t=n.lamps.slice(0,2).map(s=>({...s,z:2.6,angle:0})),i=(s,r,a)=>{const o={lamps:JSON.parse(JSON.stringify(a)),workpieces:n.workpieces,params:n.params},l=ih(nh(o),o.params);return{id:"v"+s,name:s,time:r,snapshot:JSON.parse(JSON.stringify(o)),stats:l,dark:0,over:0}};return e.versions.push(i("V1-初版两灯","2026-11-11 16:40",t)),e.versions.push(i("V2-补LED线光","2026-11-14 11:05",n.lamps)),{role:"maker",currentProjectId:"P-demo",projects:[e]}}function zg(){try{const n=localStorage.getItem(sh);if(n)return JSON.parse(n)}catch{}return null}const _t=as(zg()||Bg());hi(_t,()=>{try{localStorage.setItem(sh,JSON.stringify(_t))}catch{}},{deep:!0});function Yo(){return _t.projects.find(n=>n.id===_t.currentProjectId)||null}function Ls(n,e){const t={customer:"客户",maker:"制作员",supervisor:"主管"}[_t.role]||_t.role;n.history.push({time:new Date().toLocaleString("zh-CN",{hour12:!1}),action:e,by:t})}const lh={已下单:"#64b5f6",设计中:"#ffb74d",待审核:"#ba68c8",审核通过:"#81c784",已交付:"#4db6ac"},Hg={class:"app"},Vg={class:"topbar"},Gg={class:"right"},kg=["title"],Wg={class:"role"},Xg={__name:"App",setup(n){const e=ht(()=>Yo());return(t,i)=>{const s=Eo("router-link"),r=Eo("router-view");return Ne(),Be("div",Hg,[P("header",Vg,[i[7]||(i[7]=P("div",{class:"brand"},"UV固化线 · 光源布置与照度预览",-1)),P("nav",null,[Tt(s,{to:"/projects"},{default:Zi(()=>[...i[1]||(i[1]=[ut("项目 / 下单",-1)])]),_:1}),Tt(s,{to:"/design"},{default:Zi(()=>[...i[2]||(i[2]=[ut("光源设计",-1)])]),_:1}),Tt(s,{to:"/compare"},{default:Zi(()=>[...i[3]||(i[3]=[ut("版本对比",-1)])]),_:1}),Tt(s,{to:"/review"},{default:Zi(()=>[...i[4]||(i[4]=[ut("审核交付",-1)])]),_:1})]),P("div",Gg,[e.value?(Ne(),Be("span",{key:0,class:"cur",title:e.value.name},"当前:"+xe(e.value.name),9,kg)):cn("",!0),P("label",Wg,[i[6]||(i[6]=ut(" 角色 ",-1)),dt(P("select",{"onUpdate:modelValue":i[0]||(i[0]=a=>Ue(_t).role=a)},[...i[5]||(i[5]=[P("option",{value:"customer"},"客户",-1),P("option",{value:"maker"},"制作员",-1),P("option",{value:"supervisor"},"主管",-1)])],512),[[gl,Ue(_t).role]])])])]),P("main",null,[Tt(r)])])}}};/*!
 * vue-router v4.6.5
 * (c) 2026 Eduardo San Martin Morote
 * @license MIT
 */const Ps=typeof document<"u";function ch(n){return typeof n=="object"||"displayName"in n||"props"in n||"__vccOpts"in n}function jg(n){return n.__esModule||n[Symbol.toStringTag]==="Module"||n.default&&ch(n.default)}const rt=Object.assign;function Sa(n,e){const t={};for(const i in e){const s=e[i];t[i]=Ln(s)?s.map(n):n(s)}return t}const pr=()=>{},Ln=Array.isArray;function Xc(n,e){const t={};for(const i in n)t[i]=i in e?e[i]:n[i];return t}const uh=/#/g,qg=/&/g,Yg=/\//g,Kg=/=/g,$g=/\?/g,fh=/\+/g,Zg=/%5B/g,Jg=/%5D/g,dh=/%5E/g,Qg=/%60/g,hh=/%7B/g,e_=/%7C/g,ph=/%7D/g,t_=/%20/g;function $l(n){return n==null?"":encodeURI(""+n).replace(e_,"|").replace(Zg,"[").replace(Jg,"]")}function n_(n){return $l(n).replace(hh,"{").replace(ph,"}").replace(dh,"^")}function _l(n){return $l(n).replace(fh,"%2B").replace(t_,"+").replace(uh,"%23").replace(qg,"%26").replace(Qg,"`").replace(hh,"{").replace(ph,"}").replace(dh,"^")}function i_(n){return _l(n).replace(Kg,"%3D")}function s_(n){return $l(n).replace(uh,"%23").replace($g,"%3F")}function r_(n){return s_(n).replace(Yg,"%2F")}function Tr(n){if(n==null)return null;try{return decodeURIComponent(""+n)}catch{}return""+n}const o_=/\/$/,a_=n=>n.replace(o_,"");function ya(n,e,t="/"){let i,s={},r="",a="";const o=e.indexOf("#");let l=e.indexOf("?");return l=o>=0&&l>o?-1:l,l>=0&&(i=e.slice(0,l),r=e.slice(l,o>0?o:e.length),s=n(r.slice(1))),o>=0&&(i=i||e.slice(0,o),a=e.slice(o,e.length)),i=f_(i??e,t),{fullPath:i+r+a,path:i,query:s,hash:Tr(a)}}function l_(n,e){const t=e.query?n(e.query):"";return e.path+(t&&"?")+t+(e.hash||"")}function jc(n,e){return!e||!n.toLowerCase().startsWith(e.toLowerCase())?n:n.slice(e.length)||"/"}function c_(n,e,t){const i=e.matched.length-1,s=t.matched.length-1;return i>-1&&i===s&&Hs(e.matched[i],t.matched[s])&&mh(e.params,t.params)&&n(e.query)===n(t.query)&&e.hash===t.hash}function Hs(n,e){return(n.aliasOf||n)===(e.aliasOf||e)}function mh(n,e){if(Object.keys(n).length!==Object.keys(e).length)return!1;for(var t in n)if(!u_(n[t],e[t]))return!1;return!0}function u_(n,e){return Ln(n)?qc(n,e):Ln(e)?qc(e,n):(n==null?void 0:n.valueOf())===(e==null?void 0:e.valueOf())}function qc(n,e){return Ln(e)?n.length===e.length&&n.every((t,i)=>t===e[i]):n.length===1&&n[0]===e}function f_(n,e){if(n.startsWith("/"))return n;if(!n)return e;const t=e.split("/"),i=n.split("/"),s=i[i.length-1];(s===".."||s===".")&&i.push("");let r=t.length-1,a,o;for(a=0;a<i.length;a++)if(o=i[a],o!==".")if(o==="..")r>1&&r--;else break;return t.slice(0,r).join("/")+"/"+i.slice(a).join("/")}const vi={path:"/",name:void 0,params:{},query:{},hash:"",fullPath:"/",matched:[],meta:{},redirectedFrom:void 0};let vl=function(n){return n.pop="pop",n.push="push",n}({}),Ea=function(n){return n.back="back",n.forward="forward",n.unknown="",n}({});function d_(n){if(!n)if(Ps){const e=document.querySelector("base");n=e&&e.getAttribute("href")||"/",n=n.replace(/^\w+:\/\/[^\/]+/,"")}else n="/";return n[0]!=="/"&&n[0]!=="#"&&(n="/"+n),a_(n)}const h_=/^[^#]+#/;function p_(n,e){return n.replace(h_,"#")+e}function m_(n,e){const t=document.documentElement.getBoundingClientRect(),i=n.getBoundingClientRect();return{behavior:e.behavior,left:i.left-t.left-(e.left||0),top:i.top-t.top-(e.top||0)}}const Ko=()=>({left:window.scrollX,top:window.scrollY});function g_(n){let e;if("el"in n){const t=n.el,i=typeof t=="string"&&t.startsWith("#"),s=typeof t=="string"?i?document.getElementById(t.slice(1)):document.querySelector(t):t;if(!s)return;e=m_(s,n)}else e=n;"scrollBehavior"in document.documentElement.style?window.scrollTo(e):window.scrollTo(e.left!=null?e.left:window.scrollX,e.top!=null?e.top:window.scrollY)}function Yc(n,e){return(history.state?history.state.position-e:-1)+n}const xl=new Map;function __(n,e){xl.set(n,e)}function v_(n){const e=xl.get(n);return xl.delete(n),e}function x_(n){return typeof n=="string"||n&&typeof n=="object"}function gh(n){return typeof n=="string"||typeof n=="symbol"}let Mt=function(n){return n[n.MATCHER_NOT_FOUND=1]="MATCHER_NOT_FOUND",n[n.NAVIGATION_GUARD_REDIRECT=2]="NAVIGATION_GUARD_REDIRECT",n[n.NAVIGATION_ABORTED=4]="NAVIGATION_ABORTED",n[n.NAVIGATION_CANCELLED=8]="NAVIGATION_CANCELLED",n[n.NAVIGATION_DUPLICATED=16]="NAVIGATION_DUPLICATED",n}({});const _h=Symbol("");Mt.MATCHER_NOT_FOUND+"",Mt.NAVIGATION_GUARD_REDIRECT+"",Mt.NAVIGATION_ABORTED+"",Mt.NAVIGATION_CANCELLED+"",Mt.NAVIGATION_DUPLICATED+"";function Vs(n,e){return rt(new Error,{type:n,[_h]:!0},e)}function Jn(n,e){return n instanceof Error&&_h in n&&(e==null||!!(n.type&e))}const M_=["params","query","hash"];function S_(n){if(typeof n=="string")return n;if(n.path!=null)return n.path;const e={};for(const t of M_)t in n&&(e[t]=n[t]);return JSON.stringify(e,null,2)}function y_(n){const e={};if(n===""||n==="?")return e;const t=(n[0]==="?"?n.slice(1):n).split("&");for(let i=0;i<t.length;++i){const s=t[i].replace(fh," "),r=s.indexOf("="),a=Tr(r<0?s:s.slice(0,r)),o=r<0?null:Tr(s.slice(r+1));if(a in e){let l=e[a];Ln(l)||(l=e[a]=[l]),l.push(o)}else e[a]=o}return e}function Kc(n){let e="";for(let t in n){const i=n[t];if(t=i_(t),i==null){i!==void 0&&(e+=(e.length?"&":"")+t);continue}(Ln(i)?i.map(s=>s&&_l(s)):[i&&_l(i)]).forEach(s=>{s!==void 0&&(e+=(e.length?"&":"")+t,s!=null&&(e+="="+s))})}return e}function E_(n){const e={};for(const t in n){const i=n[t];i!==void 0&&(e[t]=Ln(i)?i.map(s=>s==null?null:""+s):i==null?i:""+i)}return e}const b_=Symbol(""),$c=Symbol(""),$o=Symbol(""),vh=Symbol(""),Ml=Symbol("");function Js(){let n=[];function e(i){return n.push(i),()=>{const s=n.indexOf(i);s>-1&&n.splice(s,1)}}function t(){n=[]}return{add:e,list:()=>n.slice(),reset:t}}function Ti(n,e,t,i,s,r=a=>a()){const a=i&&(i.enterCallbacks[s]=i.enterCallbacks[s]||[]);return()=>new Promise((o,l)=>{const u=d=>{d===!1?l(Vs(Mt.NAVIGATION_ABORTED,{from:t,to:e})):d instanceof Error?l(d):x_(d)?l(Vs(Mt.NAVIGATION_GUARD_REDIRECT,{from:e,to:d})):(a&&i.enterCallbacks[s]===a&&typeof d=="function"&&a.push(d),o())},c=r(()=>n.call(i&&i.instances[s],e,t,u));let f=Promise.resolve(c);n.length<3&&(f=f.then(u)),f.catch(d=>l(d))})}function ba(n,e,t,i,s=r=>r()){const r=[];for(const a of n)for(const o in a.components){let l=a.components[o];if(!(e!=="beforeRouteEnter"&&!a.instances[o]))if(ch(l)){const u=(l.__vccOpts||l)[e];u&&r.push(Ti(u,t,i,a,o,s))}else{let u=l();r.push(()=>u.then(c=>{if(!c)throw new Error(`Couldn't resolve component "${o}" at "${a.path}"`);const f=jg(c)?c.default:c;a.mods[o]=c,a.components[o]=f;const d=(f.__vccOpts||f)[e];return d&&Ti(d,t,i,a,o,s)()}))}}return r}function T_(n,e){const t=[],i=[],s=[],r=Math.max(e.matched.length,n.matched.length);for(let a=0;a<r;a++){const o=e.matched[a];o&&(n.matched.find(u=>Hs(u,o))?i.push(o):t.push(o));const l=n.matched[a];l&&(e.matched.find(u=>Hs(u,l))||s.push(l))}return[t,i,s]}/*!
 * vue-router v4.6.5
 * (c) 2026 Eduardo San Martin Morote
 * @license MIT
 */let A_=()=>location.protocol+"//"+location.host;function xh(n,e){const{pathname:t,search:i,hash:s}=e,r=n.indexOf("#");if(r>-1){let a=s.includes(n.slice(r))?n.slice(r).length:1,o=s.slice(a);return o[0]!=="/"&&(o="/"+o),jc(o,"")}return jc(t,n)+i+s}function w_(n,e,t,i){let s=[],r=[],a=null;const o=({state:d})=>{const p=xh(n,location),x=t.value,_=e.value;let m=0;if(d){if(t.value=p,e.value=d,a&&a===x){a=null;return}m=_?d.position-_.position:0}else i(p);s.forEach(h=>{h(t.value,x,{delta:m,type:vl.pop,direction:m?m>0?Ea.forward:Ea.back:Ea.unknown})})};function l(){a=t.value}function u(d){s.push(d);const p=()=>{const x=s.indexOf(d);x>-1&&s.splice(x,1)};return r.push(p),p}function c(){if(document.visibilityState==="hidden"){const{history:d}=window;if(!d.state)return;d.replaceState(rt({},d.state,{scroll:Ko()}),"")}}function f(){for(const d of r)d();r=[],window.removeEventListener("popstate",o),window.removeEventListener("pagehide",c),document.removeEventListener("visibilitychange",c)}return window.addEventListener("popstate",o),window.addEventListener("pagehide",c),document.addEventListener("visibilitychange",c),{pauseListeners:l,listen:u,destroy:f}}function Zc(n,e,t,i=!1,s=!1){return{back:n,current:e,forward:t,replaced:i,position:window.history.length,scroll:s?Ko():null}}function R_(n){const{history:e,location:t}=window,i={value:xh(n,t)},s={value:e.state};s.value||r(i.value,{back:null,current:i.value,forward:null,position:e.length-1,replaced:!0,scroll:null},!0);function r(l,u,c){const f=n.indexOf("#"),d=f>-1?(t.host&&document.querySelector("base")?n:n.slice(f))+l:A_()+n+l;try{e[c?"replaceState":"pushState"](u,"",d),s.value=u}catch(p){console.error(p),t[c?"replace":"assign"](d)}}function a(l,u){r(l,rt({},e.state,Zc(s.value.back,l,s.value.forward,!0),u,{position:s.value.position}),!0),i.value=l}function o(l,u){const c=rt({},s.value,e.state,{forward:l,scroll:Ko()});r(c.current,c,!0),r(l,rt({},Zc(i.value,l,null),{position:c.position+1},u),!1),i.value=l}return{location:i,state:s,push:o,replace:a}}function C_(n){n=d_(n);const e=R_(n),t=w_(n,e.state,e.location,e.replace);function i(r,a=!0){a||t.pauseListeners(),history.go(r)}const s=rt({location:"",base:n,go:i,createHref:p_.bind(null,n)},e,t);return Object.defineProperty(s,"location",{enumerable:!0,get:()=>e.location.value}),Object.defineProperty(s,"state",{enumerable:!0,get:()=>e.state.value}),s}function P_(n){return n=location.host?n||location.pathname+location.search:"",n.includes("#")||(n+="#"),C_(n)}let Nn=function(n){return n[n.Static=0]="Static",n[n.Param=1]="Param",n[n.Group=2]="Group",n}({});var Ct=function(n){return n[n.Static=0]="Static",n[n.Param=1]="Param",n[n.ParamRegExp=2]="ParamRegExp",n[n.ParamRegExpEnd=3]="ParamRegExpEnd",n[n.EscapeNext=4]="EscapeNext",n}(Ct||{});const L_={type:Nn.Static,value:""},D_=/[a-zA-Z0-9_]/;function I_(n){if(!n)return[[]];if(n==="/")return[[L_]];if(!n.startsWith("/"))throw new Error(`Invalid path "${n}"`);function e(p){throw new Error(`ERR (${t})/"${u}": ${p}`)}let t=Ct.Static,i=t;const s=[];let r;function a(){r&&s.push(r),r=[]}let o=0,l,u="",c="";function f(){u&&(t===Ct.Static?r.push({type:Nn.Static,value:u}):t===Ct.Param||t===Ct.ParamRegExp||t===Ct.ParamRegExpEnd?(r.length>1&&(l==="*"||l==="+")&&e(`A repeatable param (${u}) must be alone in its segment. eg: '/:ids+.`),r.push({type:Nn.Param,value:u,regexp:c,repeatable:l==="*"||l==="+",optional:l==="*"||l==="?"})):e("Invalid state to consume buffer"),u="")}function d(){u+=l}for(;o<n.length;){if(l=n[o++],l==="\\"&&t!==Ct.ParamRegExp){i=t,t=Ct.EscapeNext;continue}switch(t){case Ct.Static:l==="/"?(u&&f(),a()):l===":"?(f(),t=Ct.Param):d();break;case Ct.EscapeNext:d(),t=i;break;case Ct.Param:l==="("?t=Ct.ParamRegExp:D_.test(l)?d():(f(),t=Ct.Static,l!=="*"&&l!=="?"&&l!=="+"&&o--);break;case Ct.ParamRegExp:l===")"?c[c.length-1]=="\\"?c=c.slice(0,-1)+l:t=Ct.ParamRegExpEnd:c+=l;break;case Ct.ParamRegExpEnd:f(),t=Ct.Static,l!=="*"&&l!=="?"&&l!=="+"&&o--,c="";break;default:e("Unknown state");break}}return t===Ct.ParamRegExp&&e(`Unfinished custom RegExp for param "${u}"`),f(),a(),s}const Jc="[^/]+?",U_={sensitive:!1,strict:!1,start:!0,end:!0};var $t=function(n){return n[n._multiplier=10]="_multiplier",n[n.Root=90]="Root",n[n.Segment=40]="Segment",n[n.SubSegment=30]="SubSegment",n[n.Static=40]="Static",n[n.Dynamic=20]="Dynamic",n[n.BonusCustomRegExp=10]="BonusCustomRegExp",n[n.BonusWildcard=-50]="BonusWildcard",n[n.BonusRepeatable=-20]="BonusRepeatable",n[n.BonusOptional=-8]="BonusOptional",n[n.BonusStrict=.7000000000000001]="BonusStrict",n[n.BonusCaseSensitive=.25]="BonusCaseSensitive",n}($t||{});const Qc=/[.+*?^${}()[\]/\\|]/g;function N_(n,e){const t=rt({},U_,e),i=[];let s=t.start?"^":"";const r=[],a=n.some(c=>c.some(f=>f.type===Nn.Param&&/\\[1-9k]/.test(f.regexp||"")));for(const c of n){const f=c.length?[]:[$t.Root];t.strict&&!c.length&&(s+="/");for(let d=0;d<c.length;d++){const p=c[d];let x=$t.Segment+(t.sensitive?$t.BonusCaseSensitive:0);if(p.type===Nn.Static)d||(s+="/"),s+=p.value.replace(Qc,"\\$&"),x+=$t.Static;else if(p.type===Nn.Param){const{value:_,repeatable:m,optional:h,regexp:g}=p;r.push({name:_,repeatable:m,optional:h});const S=g||Jc;if(S!==Jc){x+=$t.BonusCustomRegExp;try{`${S}`}catch(C){throw new Error(`Invalid custom RegExp for param "${_}" (${S}): `+C.message)}}let M=m?`((?:${S})(?:/(?:${S}))*)`:`(${S})`;const I=c[d+1],L=c[d+2];!a&&!g&&!m&&L&&L.type===Nn.Param&&!L.regexp&&I.type===Nn.Static&&(M=`([^/](?:(?!${I.value.replace(Qc,"\\$&")})[^/])*)`),d||(M=h&&c.length<2?`(?:/${M})`:"/"+M),h&&(M+="?"),s+=M,x+=$t.Dynamic,h&&(x+=$t.BonusOptional),m&&(x+=$t.BonusRepeatable),S===".*"&&(x+=$t.BonusWildcard)}f.push(x)}i.push(f)}if(t.strict&&t.end){const c=i.length-1;i[c][i[c].length-1]+=$t.BonusStrict}t.strict||(s+="/?"),t.end?s+="$":t.strict&&!s.endsWith("/")&&(s+="(?:/|$)");const o=new RegExp(s,t.sensitive?"":"i");function l(c){const f=c.match(o),d={};if(!f)return null;for(let p=1;p<f.length;p++){const x=f[p]||"",_=r[p-1];d[_.name]=x&&_.repeatable?x.split("/"):x}return d}function u(c){let f="",d=!1;for(const p of n){(!d||!f.endsWith("/"))&&(f+="/"),d=!1;for(const x of p)if(x.type===Nn.Static)f+=x.value;else if(x.type===Nn.Param){const{value:_,repeatable:m,optional:h}=x,g=_ in c?c[_]:"";if(Ln(g)&&!m)throw new Error(`Provided param "${_}" is an array but it is not repeatable (* or + modifiers)`);const S=Ln(g)?g.join("/"):g;if(!S)if(h)p.length<2&&(f.endsWith("/")?f=f.slice(0,-1):d=!0);else throw new Error(`Missing required param "${_}"`);f+=S}}return f||"/"}return{re:o,score:i,keys:r,parse:l,stringify:u}}function O_(n,e){let t=0;for(;t<n.length&&t<e.length;){const i=e[t]-n[t];if(i)return i;t++}return n.length<e.length?n.length===1&&n[0]===$t.Static+$t.Segment?-1:1:n.length>e.length?e.length===1&&e[0]===$t.Static+$t.Segment?1:-1:0}function Mh(n,e){let t=0;const i=n.score,s=e.score;for(;t<i.length&&t<s.length;){const r=O_(i[t],s[t]);if(r)return r;t++}if(Math.abs(s.length-i.length)===1){if(eu(i))return 1;if(eu(s))return-1}return s.length-i.length}function eu(n){const e=n[n.length-1];return n.length>0&&e[e.length-1]<0}const F_={strict:!1,end:!0,sensitive:!1};function B_(n,e,t){const i=N_(I_(n.path),t),s=rt(i,{record:n,parent:e,children:[],alias:[]});return e&&!s.record.aliasOf==!e.record.aliasOf&&e.children.push(s),s}function z_(n,e){const t=[],i=new Map;e=Xc(F_,e);function s(f){return i.get(f)}function r(f,d,p){const x=!p,_=nu(f);_.aliasOf=p&&p.record;const m=Xc(e,f),h=[_];if("alias"in f){const M=typeof f.alias=="string"?[f.alias]:f.alias;for(const I of M)h.push(nu(rt({},_,{components:p?p.record.components:_.components,path:I,aliasOf:p?p.record:_})))}let g,S;for(const M of h){const{path:I}=M;if(d&&I[0]!=="/"){const L=d.record.path,C=L[L.length-1]==="/"?"":"/";M.path=d.record.path+(I&&C+I)}if(g=B_(M,d,m),p?p.alias.push(g):(S=S||g,S!==g&&S.alias.push(g),x&&f.name&&!iu(g)&&a(f.name)),Sh(g)&&l(g),_.children){const L=_.children;for(let C=0;C<L.length;C++)r(L[C],g,p&&p.children[C])}p=p||g}return S?()=>{a(S)}:pr}function a(f){if(gh(f)){const d=i.get(f);d&&(i.delete(f),t.splice(t.indexOf(d),1),d.children.forEach(a),d.alias.forEach(a))}else{const d=t.indexOf(f);d>-1&&(t.splice(d,1),f.record.name&&i.delete(f.record.name),f.children.forEach(a),f.alias.forEach(a))}}function o(){return t}function l(f){const d=G_(f,t);t.splice(d,0,f),f.record.name&&!iu(f)&&i.set(f.record.name,f)}function u(f,d){let p,x={},_,m;if("name"in f&&f.name){if(p=i.get(f.name),!p)throw Vs(Mt.MATCHER_NOT_FOUND,{location:f});m=p.record.name,x=rt(tu(d.params,p.keys.filter(S=>!S.optional).concat(p.parent?p.parent.keys.filter(S=>S.optional):[]).map(S=>S.name)),f.params&&tu(f.params,p.keys.map(S=>S.name))),_=p.stringify(x)}else if(f.path!=null)_=f.path,p=t.find(S=>S.re.test(_)),p&&(x=p.parse(_),m=p.record.name);else{if(p=d.name?i.get(d.name):t.find(S=>S.re.test(d.path)),!p)throw Vs(Mt.MATCHER_NOT_FOUND,{location:f,currentLocation:d});m=p.record.name,x=rt({},d.params,f.params),_=p.stringify(x)}const h=[];let g=p;for(;g;)h.unshift(g.record),g=g.parent;return{name:m,path:_,params:x,matched:h,meta:V_(h)}}n.forEach(f=>r(f));function c(){t.length=0,i.clear()}return{addRoute:r,resolve:u,removeRoute:a,clearRoutes:c,getRoutes:o,getRecordMatcher:s}}function tu(n,e){const t={};for(const i of e)i in n&&(t[i]=n[i]);return t}function nu(n){const e={path:n.path,redirect:n.redirect,name:n.name,meta:n.meta||{},aliasOf:n.aliasOf,beforeEnter:n.beforeEnter,props:H_(n),children:n.children||[],instances:{},leaveGuards:new Set,updateGuards:new Set,enterCallbacks:{},components:"components"in n?n.components||null:n.component&&{default:n.component}};return Object.defineProperty(e,"mods",{value:{}}),e}function H_(n){const e={},t=n.props||!1;if("component"in n)e.default=t;else for(const i in n.components)e[i]=typeof t=="object"?t[i]:t;return e}function iu(n){for(;n;){if(n.record.aliasOf)return!0;n=n.parent}return!1}function V_(n){return n.reduce((e,t)=>rt(e,t.meta),{})}function G_(n,e){let t=0,i=e.length;for(;t!==i;){const r=t+i>>1;Mh(n,e[r])<0?i=r:t=r+1}const s=k_(n);return s&&(i=e.lastIndexOf(s,i-1)),i}function k_(n){let e=n;for(;e=e.parent;)if(Sh(e)&&Mh(n,e)===0)return e}function Sh({record:n}){return!!(n.name||n.components&&Object.keys(n.components).length||n.redirect)}function su(n){const e=Wn($o),t=Wn(vh),i=ht(()=>{const l=Ue(n.to);return e.resolve(l)}),s=ht(()=>{const{matched:l}=i.value,{length:u}=l,c=l[u-1],f=t.matched;if(!c||!f.length)return-1;const d=f.findIndex(Hs.bind(null,c));if(d>-1)return d;const p=ru(l[u-2]);return u>1&&ru(c)===p&&f[f.length-1].path!==p?f.findIndex(Hs.bind(null,l[u-2])):d}),r=ht(()=>s.value>-1&&Y_(t.params,i.value.params)),a=ht(()=>s.value>-1&&s.value===t.matched.length-1&&mh(t.params,i.value.params));function o(l={}){if(q_(l)){const u=e[Ue(n.replace)?"replace":"push"](Ue(n.to)).catch(pr);return n.viewTransition&&typeof document<"u"&&"startViewTransition"in document&&document.startViewTransition(()=>u),u}return Promise.resolve()}return{route:i,href:ht(()=>i.value.href),isActive:r,isExactActive:a,navigate:o}}function W_(n){return n.length===1?n[0]:n}const X_=yd({name:"RouterLink",compatConfig:{MODE:3},props:{to:{type:[String,Object],required:!0},replace:Boolean,activeClass:String,exactActiveClass:String,custom:Boolean,ariaCurrentValue:{type:String,default:"page"},viewTransition:Boolean},useLink:su,setup(n,{slots:e}){const t=as(su(n)),{options:i}=Wn($o),s=ht(()=>({[ou(n.activeClass,i.linkActiveClass,"router-link-active")]:t.isActive,[ou(n.exactActiveClass,i.linkExactActiveClass,"router-link-exact-active")]:t.isExactActive}));return()=>{const r=e.default&&W_(e.default(t));return n.custom?r:Kd("a",{"aria-current":t.isExactActive?n.ariaCurrentValue:null,href:t.href,onClick:t.navigate,class:s.value},r)}}}),j_=X_;function q_(n){if(!(n.metaKey||n.altKey||n.ctrlKey||n.shiftKey)&&!n.defaultPrevented&&!(n.button!==void 0&&n.button!==0)){if(n.currentTarget&&n.currentTarget.getAttribute){const e=n.currentTarget.getAttribute("target");if(/\b_blank\b/i.test(e))return}return n.preventDefault&&n.preventDefault(),!0}}function Y_(n,e){for(const t in e){const i=e[t],s=n[t];if(typeof i=="string"){if(i!==s)return!1}else if(!Ln(s)||s.length!==i.length||i.some((r,a)=>r.valueOf()!==s[a].valueOf()))return!1}return!0}function ru(n){return n?n.aliasOf?n.aliasOf.path:n.path:""}const ou=(n,e,t)=>n??e??t,K_=yd({name:"RouterView",inheritAttrs:!1,props:{name:{type:String,default:"default"},route:Object},compatConfig:{MODE:3},setup(n,{attrs:e,slots:t}){const i=Wn(Ml),s=ht(()=>n.route||i.value),r=Wn($c,0),a=ht(()=>{let u=Ue(r);const{matched:c}=s.value;let f;for(;(f=c[u])&&!f.components;)u++;return u}),o=ht(()=>s.value.matched[a.value]);mo($c,ht(()=>a.value+1)),mo(b_,o),mo(Ml,s);const l=di();return hi(()=>[l.value,o.value,n.name],([u,c,f],[d,p,x])=>{c&&(c.instances[f]=u,p&&p!==c&&u&&u===d&&(c.leaveGuards.size||(c.leaveGuards=p.leaveGuards),c.updateGuards.size||(c.updateGuards=p.updateGuards))),u&&c&&(!p||!Hs(c,p)||!d)&&(c.enterCallbacks[f]||[]).forEach(_=>_(u))},{flush:"post"}),()=>{const u=s.value,c=n.name,f=o.value,d=f&&f.components[c];if(!d)return au(t.default,{Component:d,route:u});const p=f.props[c],x=p?p===!0?u.params:typeof p=="function"?p(u):p:null,m=Kd(d,rt({},x,e,{onVnodeUnmounted:h=>{h.component.isUnmounted&&(f.instances[c]=null)},ref:l}));return au(t.default,{Component:m,route:u})||m}}});function au(n,e){if(!n)return null;const t=n(e);return t.length===1?t[0]:t}const $_=K_;function Z_(n){const e=z_(n.routes,n),t=n.parseQuery||y_,i=n.stringifyQuery||Kc,s=n.history,r=Js(),a=Js(),o=Js(),l=zp(vi);let u=vi;Ps&&n.scrollBehavior&&"scrollRestoration"in history&&(history.scrollRestoration="manual");const c=Sa.bind(null,B=>""+B),f=Sa.bind(null,r_),d=Sa.bind(null,Tr);function p(B,ue){let re,pe;return gh(B)?(re=e.getRecordMatcher(B),pe=ue):pe=B,e.addRoute(pe,re)}function x(B){const ue=e.getRecordMatcher(B);ue&&e.removeRoute(ue)}function _(){return e.getRoutes().map(B=>B.record)}function m(B){return!!e.getRecordMatcher(B)}function h(B,ue){if(ue=rt({},ue||l.value),typeof B=="string"){const F=ya(t,B,ue.path),H=e.resolve({path:F.path},ue),X=s.createHref(F.fullPath);return rt(F,H,{params:d(H.params),hash:Tr(F.hash),redirectedFrom:void 0,href:X})}let re;if(B.path!=null)re=rt({},B,{path:ya(t,B.path,ue.path).path});else{const F=rt({},B.params);for(const H in F)F[H]==null&&delete F[H];re=rt({},B,{params:f(F)}),ue.params=f(ue.params)}const pe=e.resolve(re,ue),b=B.hash||"";pe.params=c(d(pe.params));const y=l_(i,rt({},B,{hash:n_(b),path:pe.path})),z=s.createHref(y);return rt({fullPath:y,hash:b,query:i===Kc?E_(B.query):B.query||{}},pe,{redirectedFrom:void 0,href:z})}function g(B){return typeof B=="string"?ya(t,B,l.value.path):rt({},B)}function S(B,ue){if(u!==B)return Vs(Mt.NAVIGATION_CANCELLED,{from:ue,to:B})}function M(B){return C(B)}function I(B){return M(rt(g(B),{replace:!0}))}function L(B,ue){const re=B.matched[B.matched.length-1];if(re&&re.redirect){const{redirect:pe}=re;let b=typeof pe=="function"?pe(B,ue):pe;return typeof b=="string"&&(b=b.includes("?")||b.includes("#")?b=g(b):{path:b},b.params={}),rt({query:B.query,hash:B.hash,params:b.path!=null?{}:B.params},b)}}function C(B,ue){const re=u=h(B),pe=l.value,b=B.state,y=B.force,z=B.replace===!0,F=L(re,pe);if(F)return C(rt(g(F),{state:typeof F=="object"?rt({},b,F.state):b,force:y,replace:z}),ue||re);const H=re;H.redirectedFrom=ue;let X;return!y&&c_(i,pe,re)&&(X=Vs(Mt.NAVIGATION_DUPLICATED,{to:H,from:pe}),de(pe,pe,!0,!1)),(X?Promise.resolve(X):T(H,pe)).catch(le=>Jn(le)?Jn(le,Mt.NAVIGATION_GUARD_REDIRECT)?le:ce(le):Z(le,H,pe)).then(le=>{if(le){if(Jn(le,Mt.NAVIGATION_GUARD_REDIRECT))return C(rt({replace:z},g(le.to),{state:typeof le.to=="object"?rt({},b,le.to.state):b,force:y}),ue||H)}else le=k(H,pe,!0,z,b);return R(H,pe,le),le})}function ie(B,ue){const re=S(B,ue);return re?Promise.reject(re):Promise.resolve()}function A(B){const ue=Y.values().next().value;return ue&&typeof ue.runWithContext=="function"?ue.runWithContext(B):B()}function T(B,ue){let re;const[pe,b,y]=T_(B,ue);re=ba(pe.reverse(),"beforeRouteLeave",B,ue);for(const F of pe)F.leaveGuards.forEach(H=>{re.push(Ti(H,B,ue))});const z=ie.bind(null,B,ue);return re.push(z),ye(re).then(()=>{re=[];for(const F of r.list())re.push(Ti(F,B,ue));return re.push(z),ye(re)}).then(()=>{re=ba(b,"beforeRouteUpdate",B,ue);for(const F of b)F.updateGuards.forEach(H=>{re.push(Ti(H,B,ue))});return re.push(z),ye(re)}).then(()=>{re=[];for(const F of y)if(F.beforeEnter)if(Ln(F.beforeEnter))for(const H of F.beforeEnter)re.push(Ti(H,B,ue));else re.push(Ti(F.beforeEnter,B,ue));return re.push(z),ye(re)}).then(()=>(B.matched.forEach(F=>F.enterCallbacks={}),re=ba(y,"beforeRouteEnter",B,ue,A),re.push(z),ye(re))).then(()=>{re=[];for(const F of a.list())re.push(Ti(F,B,ue));return re.push(z),ye(re)}).catch(F=>Jn(F,Mt.NAVIGATION_CANCELLED)?F:Promise.reject(F))}function R(B,ue,re){o.list().forEach(pe=>A(()=>pe(B,ue,re)))}function k(B,ue,re,pe,b){const y=S(B,ue);if(y)return y;const z=ue===vi,F=Ps?history.state:{};re&&(pe||z?s.replace(B.fullPath,rt({scroll:z&&F&&F.scroll},b)):s.push(B.fullPath,b)),l.value=B,de(B,ue,re,z),ce()}let J;function U(){J||(J=s.listen((B,ue,re)=>{if(!ge.listening)return;const pe=h(B),b=L(pe,ge.currentRoute.value);if(b){C(rt(b,{replace:!0,force:!0}),pe).catch(pr);return}u=pe;const y=l.value;Ps&&__(Yc(y.fullPath,re.delta),Ko()),T(pe,y).catch(z=>Jn(z,Mt.NAVIGATION_ABORTED|Mt.NAVIGATION_CANCELLED)?z:Jn(z,Mt.NAVIGATION_GUARD_REDIRECT)?(C(rt(g(z.to),{force:!0}),pe).then(F=>{Jn(F,Mt.NAVIGATION_ABORTED|Mt.NAVIGATION_DUPLICATED)&&!re.delta&&re.type===vl.pop&&s.go(-1,!1)}).catch(pr),Promise.reject()):(re.delta&&s.go(-re.delta,!1),Z(z,pe,y))).then(z=>{z=z||k(pe,y,!1),z&&(re.delta&&!Jn(z,Mt.NAVIGATION_CANCELLED)?s.go(-re.delta,!1):re.type===vl.pop&&Jn(z,Mt.NAVIGATION_ABORTED|Mt.NAVIGATION_DUPLICATED)&&s.go(-1,!1)),R(pe,y,z)}).catch(pr)}))}let V=Js(),G=Js(),$;function Z(B,ue,re){ce(B);const pe=G.list();return pe.length?pe.forEach(b=>b(B,ue,re)):console.error(B),Promise.reject(B)}function ae(){return $&&l.value!==vi?Promise.resolve():new Promise((B,ue)=>{V.add([B,ue])})}function ce(B){return $||($=!B,U(),V.list().forEach(([ue,re])=>B?re(B):ue()),V.reset()),B}function de(B,ue,re,pe){const{scrollBehavior:b}=n;if(!Ps||!b)return Promise.resolve();const y=!re&&v_(Yc(B.fullPath,0))||(pe||!re)&&history.state&&history.state.scroll||null;return Gl().then(()=>b(B,ue,y)).then(z=>z&&g_(z)).catch(z=>Z(z,B,ue))}const he=B=>s.go(B);let ee;const Y=new Set,ge={currentRoute:l,listening:!0,addRoute:p,removeRoute:x,clearRoutes:e.clearRoutes,hasRoute:m,getRoutes:_,resolve:h,options:n,push:M,replace:I,go:he,back:()=>he(-1),forward:()=>he(1),beforeEach:r.add,beforeResolve:a.add,afterEach:o.add,onError:G.add,isReady:ae,install(B){B.component("RouterLink",j_),B.component("RouterView",$_),B.config.globalProperties.$router=ge,Object.defineProperty(B.config.globalProperties,"$route",{enumerable:!0,get:()=>Ue(l)}),Ps&&!ee&&l.value===vi&&(ee=!0,M(s.location).catch(pe=>{}));const ue={};for(const pe in vi)Object.defineProperty(ue,pe,{get:()=>l.value[pe],enumerable:!0});B.provide($o,ge),B.provide(vh,ud(ue)),B.provide(Ml,l);const re=B.unmount;Y.add(B),B.unmount=function(){Y.delete(B),Y.size<1&&(u=vi,J&&J(),J=null,l.value=vi,ee=!1,$=!1),re()}}};function ye(B){return B.reduce((ue,re)=>ue.then(()=>A(re)),Promise.resolve())}return ge}function J_(){return Wn($o)}const ls=(n,e)=>{const t=n.__vccOpts||n;for(const[i,s]of e)t[i]=s;return t},Q_={class:"projects"},e0={class:"panel order"},t0={class:"form"},n0={style:{display:"flex",gap:"6px","align-items":"center"}},i0=["disabled"],s0={key:0,class:"tip"},r0={class:"panel list"},o0={class:"ops"},a0=["onClick"],l0=["onClick"],c0={__name:"Projects",setup(n){const e=J_(),t=as({name:"",customer:"",product:"",qty:5e3,deadline:"2026-12-31",stdMin:60,stdMax:140}),i=ht(()=>({customer:"客户",maker:"制作员",supervisor:"主管"})[_t.role]);function s(l){return Math.max(0,Math.ceil((new Date(l.deadline)-Date.now())/864e5))}function r(){const l=ah();l.params.stdMin=t.stdMin,l.params.stdMax=t.stdMax;const u={id:"P"+Date.now(),name:t.name,customer:t.customer,product:t.product,qty:t.qty,deadline:t.deadline,status:"已下单",rework:0,createdAt:new Date().toLocaleString("zh-CN",{hour12:!1}),history:[],workItems:rh(),scheme:l,versions:[]};_t.projects.push(u),_t.currentProjectId=u.id,Ls(u,"客户下单"),t.name="",t.customer="",t.product=""}function a(l){_t.currentProjectId=l.id,l.status==="已下单"&&(l.status="设计中",Ls(l,"开始设计")),e.push("/design")}function o(l){_t.currentProjectId=l.id,e.push("/review")}return(l,u)=>(Ne(),Be("div",Q_,[P("div",e0,[u[14]||(u[14]=P("h3",null,"客户下单 · 新建项目",-1)),P("div",t0,[P("label",null,[u[7]||(u[7]=ut("项目名称",-1)),dt(P("input",{"onUpdate:modelValue":u[0]||(u[0]=c=>t.name=c),placeholder:"如:保险杠UV喷涂线"},null,512),[[bt,t.name]])]),P("label",null,[u[8]||(u[8]=ut("客户",-1)),dt(P("input",{"onUpdate:modelValue":u[1]||(u[1]=c=>t.customer=c),placeholder:"客户名称"},null,512),[[bt,t.customer]])]),P("label",null,[u[9]||(u[9]=ut("产品/材质",-1)),dt(P("input",{"onUpdate:modelValue":u[2]||(u[2]=c=>t.product=c),placeholder:"如:PP保险杠"},null,512),[[bt,t.product]])]),P("label",null,[u[10]||(u[10]=ut("数量(件/月)",-1)),dt(P("input",{type:"number","onUpdate:modelValue":u[3]||(u[3]=c=>t.qty=c),min:"1"},null,512),[[bt,t.qty,void 0,{number:!0}]])]),P("label",null,[u[11]||(u[11]=ut("截止时间",-1)),dt(P("input",{type:"date","onUpdate:modelValue":u[4]||(u[4]=c=>t.deadline=c)},null,512),[[bt,t.deadline]])]),P("label",null,[u[13]||(u[13]=ut("照度标准(mW/cm²) ",-1)),P("div",n0,[dt(P("input",{type:"number","onUpdate:modelValue":u[5]||(u[5]=c=>t.stdMin=c),style:{width:"70px"}},null,512),[[bt,t.stdMin,void 0,{number:!0}]]),u[12]||(u[12]=ut(" ~ ",-1)),dt(P("input",{type:"number","onUpdate:modelValue":u[6]||(u[6]=c=>t.stdMax=c),style:{width:"70px"}},null,512),[[bt,t.stdMax,void 0,{number:!0}]])])])]),P("button",{onClick:r,disabled:!t.name||!t.customer},"创建项目",8,i0),Ue(_t).role!=="customer"?(Ne(),Be("span",s0,"当前角色为"+xe(i.value)+",实际系统中此入口仅客户可见",1)):cn("",!0)]),P("div",r0,[u[16]||(u[16]=P("h3",null,"项目列表",-1)),P("table",null,[u[15]||(u[15]=P("thead",null,[P("tr",null,[P("th",null,"项目"),P("th",null,"客户"),P("th",null,"状态"),P("th",null,"返工"),P("th",null,"截止"),P("th",null,"剩余"),P("th",null,"版本"),P("th",null,"操作")])],-1)),P("tbody",null,[(Ne(!0),Be(mt,null,wn(Ue(_t).projects,c=>(Ne(),Be("tr",{key:c.id,class:Vn({cur:c.id===Ue(_t).currentProjectId})},[P("td",null,xe(c.name),1),P("td",null,xe(c.customer),1),P("td",null,[P("span",{class:"badge",style:en({background:Ue(lh)[c.status]||"#888"})},xe(c.status),5)]),P("td",{style:en({color:c.rework>0?"var(--warn)":"inherit"})},xe(c.rework)+"次",5),P("td",null,xe(c.deadline),1),P("td",{style:en({color:s(c)<3?"var(--bad)":"inherit"})},xe(s(c))+"天",5),P("td",null,xe(c.versions.length),1),P("td",o0,[P("button",{class:"ghost",onClick:f=>a(c)},"设计",8,a0),P("button",{class:"ghost",onClick:f=>o(c)},"审核",8,l0)])],2))),128))])])])]))}},u0=ls(c0,[["__scopeId","data-v-115e7a07"]]),f0={class:"legend"},d0={__name:"HeatmapCanvas",props:["project","sim","selected"],emits:["select"],setup(n,{emit:e}){const t=n,i=e,s=di(null),r=window.devicePixelRatio||1,a={s:50,ox:40,oy:40};let o=null,l=null,u=-1,c=null;const f=ht(()=>Math.round(Math.max(t.project.scheme.params.stdMax*1.3,t.sim.max)));function d(T,R){return[a.ox+T*a.s,a.oy+R*a.s]}function p(T,R){return[(T-a.ox)/a.s,(R-a.oy)/a.s]}function x(){const T=s.value,R=T.parentElement,k=R.clientWidth,J=R.clientHeight;if(!k||!J)return;T.width=k*r,T.height=J*r,T.style.width=k+"px",T.style.height=J+"px";const U=34;a.s=Math.min((k-2*U)/Je.w,(J-2*U)/Je.h),a.ox=(k-Je.w*a.s)/2,a.oy=(J-Je.h*a.s)/2,g()}function _(T){T=Math.min(1,Math.max(0,T));const R=240-240*T;return m(R,90,42+14*T)}function m(T,R,k){R/=100,k/=100;const J=G=>(G+T/30)%12,U=R*Math.min(k,1-k),V=G=>k-U*Math.max(-1,Math.min(J(G)-3,Math.min(9-J(G),1)));return[Math.round(V(0)*255),Math.round(V(8)*255),Math.round(V(4)*255)]}function h(){const{cols:T,rows:R,grid:k}={cols:t.sim.cols,rows:t.sim.rows,grid:t.sim.grid},J=document.createElement("canvas");J.width=T,J.height=R;const U=J.getContext("2d"),V=U.createImageData(T,R),G=Math.max(t.project.scheme.params.stdMax*1.3,t.sim.max,1);for(let $=0;$<k.length;$++){const[Z,ae,ce]=_(k[$]/G);V.data[$*4]=Z,V.data[$*4+1]=ae,V.data[$*4+2]=ce,V.data[$*4+3]=255}U.putImageData(V,0,0),l=J,u=t.sim.version}function g(){const T=s.value;if(!T)return;const R=T.getContext("2d");R.setTransform(r,0,0,r,0,0);const k=T.width/r,J=T.height/r,U=t.project.scheme,V=U.params;R.fillStyle="#0d1420",R.fillRect(0,0,k,J);const[G,$]=d(0,0),Z=Je.w*a.s,ae=Je.h*a.s;R.fillStyle="#141e2d",R.fillRect(G,$,Z,ae),t.sim.grid&&(u!==t.sim.version&&h(),R.save(),R.globalAlpha=.82,R.imageSmoothingEnabled=!0,R.drawImage(l,G,$,Z,ae),R.restore()),R.strokeStyle="rgba(120,150,190,0.14)",R.lineWidth=1,R.beginPath();for(let Y=0;Y<=Je.w;Y++){const[ge]=d(Y,0);R.moveTo(ge,$),R.lineTo(ge,$+ae)}for(let Y=0;Y<=Je.h;Y++){const[,ge]=d(0,Y);R.moveTo(G,ge),R.lineTo(G+Z,ge)}R.stroke(),R.strokeStyle="#5a6b85",R.lineWidth=3,R.strokeRect(G,$,Z,ae),R.fillStyle="#7d8ca3",R.font="11px sans-serif",R.fillText(`车间 ${Je.w}m × ${Je.h}m (坐标单位:m)`,G+6,$+14);const[ce,de]=d(Bt.x0,Bt.y),[he]=d(Bt.x1,Bt.y),ee=.3*a.s;R.strokeStyle="#8d9db5",R.lineWidth=2,R.strokeRect(ce,de-ee,he-ce,ee*2),R.beginPath(),R.strokeStyle="rgba(160,180,205,0.55)",R.lineWidth=1;for(let Y=ce+8;Y<he;Y+=14)R.moveTo(Y,de-ee),R.lineTo(Y+7,de+ee);R.stroke(),R.fillStyle="#8d9db5",R.beginPath(),R.moveTo(he+12,de),R.lineTo(he-2,de-6),R.lineTo(he-2,de+6),R.fill(),R.font="11px sans-serif",R.fillText("输送链 →",ce+4,de-ee-5);for(const Y of U.workpieces){const[ge,ye]=d(Y.x-Y.w/2,Y.y-Y.d/2),B=Y.w*a.s,ue=Y.d*a.s,re=t.selected&&t.selected.type==="wp"&&t.selected.id===Y.id;R.fillStyle=re?"rgba(79,143,247,0.45)":"rgba(30,42,60,0.78)",R.strokeStyle=re?"#4f8ff7":"#93a5c0",R.lineWidth=re?2:1.2,R.fillRect(ge,ye,B,ue),R.strokeRect(ge,ye,B,ue),R.fillStyle="#c9d6e8",R.font="10px sans-serif",R.fillText(`${Y.name} h=${Y.h}m`,ge+3,ye+11)}R.font="bold 11px sans-serif",t.sim.dark.forEach((Y,ge)=>{const[ye,B]=d(Y.cx,Y.cy);R.strokeStyle="#ff1744",R.lineWidth=1.8,R.setLineDash([5,4]),R.beginPath(),R.arc(ye,B,Y.r*a.s,0,Math.PI*2),R.stroke(),R.setLineDash([]),R.fillStyle="#ff5252",R.fillText(`暗区${ge+1} ${Y.ext}`,ye-24,B-Y.r*a.s-4)}),t.sim.over.forEach((Y,ge)=>{const[ye,B]=d(Y.cx,Y.cy);R.strokeStyle="#ff9100",R.lineWidth=1.8,R.beginPath(),R.arc(ye,B,Y.r*a.s,0,Math.PI*2),R.stroke(),R.fillStyle="#ffb74d",R.fillText(`超限${ge+1} ${Y.ext}`,ye-24,B+Y.r*a.s+13)});for(const Y of t.sim.samples){const[ge,ye]=d(Y.x,Y.y);R.fillStyle=Y.e<V.stdMin?"#ff5252":Y.e>V.stdMax?"#ffb74d":"#69f0ae",R.beginPath(),R.arc(ge,ye,2.4,0,Math.PI*2),R.fill()}for(const Y of U.lamps){const ge=qo(Y),[ye,B]=d(Y.x,Y.y),ue=t.selected&&t.selected.type==="lamp"&&t.selected.id===Y.id,re=(Y.yaw||0)*Math.PI/180,pe=(Y.angle||0)*Math.PI/180;R.save(),R.translate(ye,B),R.rotate(re);const b=ge.length*a.s;R.fillStyle=ue?"rgba(255,179,0,0.35)":"rgba(255,213,79,0.22)",R.strokeStyle=ue?"#ffb300":"#ffd54f",R.lineWidth=ue?2.5:1.5,R.beginPath(),R.roundRect(-b/2,-5,b,10,5),R.fill(),R.stroke(),R.restore();const y=-Math.sin(pe)*Math.sin(re),z=Math.sin(pe)*Math.cos(re),F=12+Math.abs(Y.angle)*.9;R.strokeStyle="#ffe082",R.lineWidth=2,R.beginPath(),R.moveTo(ye,B),R.lineTo(ye+y*F,B+z*F),R.stroke(),R.fillStyle=ue?"#ffb300":"#e8d9a0",R.font="10px sans-serif";const H=`${Y.name.split(" ")[0]} z=${Y.z}m ∠${Y.angle}°`;R.fillText(H,ye+8,B-8),Y.locked&&(R.font="12px sans-serif",R.fillText("🔒",ye-18,B-6))}}function S(T){const R=s.value.getBoundingClientRect();return[T.clientX-R.left,T.clientY-R.top]}function M(T,R){const k=t.project.scheme.lamps;for(let J=k.length-1;J>=0;J--)if(Math.hypot(k[J].x-T,k[J].y-R)<.35)return k[J];return null}function I(T,R){const k=t.project.scheme.workpieces;for(let J=k.length-1;J>=0;J--){const U=k[J];if(Math.abs(T-U.x)<U.w/2&&Math.abs(R-U.y)<U.d/2)return U}return null}function L(T){const[R,k]=S(T),[J,U]=p(R,k),V=M(J,U);if(V){i("select",{type:"lamp",id:V.id}),V.locked||(o={kind:"lamp",obj:V,ox:V.x-J,oy:V.y-U});return}const G=I(J,U);if(G){i("select",{type:"wp",id:G.id}),o={kind:"wp",obj:G,ox:G.x-J,oy:G.y-U};return}i("select",null)}function C(T){if(!o)return;const[R,k]=S(T),[J,U]=p(R,k);o.obj.x=+Math.min(Je.w-.2,Math.max(.2,J+o.ox)).toFixed(2),o.obj.y=+Math.min(Je.h-.2,Math.max(.2,U+o.oy)).toFixed(2)}function ie(){o=null}function A(T){const R=T.dataTransfer.getData("text/plain"),k=Co.find(Z=>Z.id===R);if(!k)return;const[J,U]=S(T);let[V,G]=p(J,U);V=+Math.min(Je.w-.3,Math.max(.3,V)).toFixed(2),G=+Math.min(Je.h-.3,Math.max(.3,G)).toFixed(2);const $={id:"L"+Math.random().toString(36).slice(2,7),model:k.id,name:k.name,x:V,y:G,z:2.2,angle:12,yaw:90,power:k.power,range:3.5,locked:!1};t.project.scheme.lamps.push($),i("select",{type:"lamp",id:$.id})}return Xl(()=>{x(),c=new ResizeObserver(x),c.observe(s.value.parentElement)}),jl(()=>c&&c.disconnect()),hi(()=>[t.sim.version,t.project.scheme,t.selected],g,{deep:!0}),(T,R)=>(Ne(),Be("div",{class:"canvas-wrap",onDrop:Gc(A,["prevent"]),onDragover:R[0]||(R[0]=Gc(()=>{},["prevent"]))},[P("canvas",{ref_key:"cv",ref:s,onPointerdown:L,onPointermove:C,onPointerup:ie,onPointerleave:ie},null,544),P("div",f0,[R[1]||(R[1]=P("span",null,"0",-1)),R[2]||(R[2]=P("i",null,null,-1)),P("span",null,xe(f.value)+" mW/cm²",1)]),R[3]||(R[3]=P("div",{class:"hint"},"从左侧灯库拖入灯管 · 拖动调整位置 · 点击选中",-1))],32))}},h0=ls(d0,[["__scopeId","data-v-7b901cf7"]]);/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Zl="160",fs={ROTATE:0,DOLLY:1,PAN:2},ds={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},p0=0,lu=1,m0=2,yh=1,g0=2,si=3,Oi=0,rn=1,ci=2,Di=0,Os=1,cu=2,uu=3,fu=4,_0=5,Yi=100,v0=101,x0=102,du=103,hu=104,M0=200,S0=201,y0=202,E0=203,Sl=204,yl=205,b0=206,T0=207,A0=208,w0=209,R0=210,C0=211,P0=212,L0=213,D0=214,I0=0,U0=1,N0=2,Po=3,O0=4,F0=5,B0=6,z0=7,Eh=0,H0=1,V0=2,Ii=0,G0=1,k0=2,W0=3,X0=4,j0=5,q0=6,bh=300,Gs=301,ks=302,El=303,bl=304,Zo=306,Tl=1e3,Tn=1001,Al=1002,Zt=1003,pu=1004,Ta=1005,mn=1006,Y0=1007,Ar=1008,Ui=1009,K0=1010,$0=1011,Jl=1012,Th=1013,Ri=1014,Ci=1015,wr=1016,Ah=1017,wh=1018,es=1020,Z0=1021,An=1023,J0=1024,Q0=1025,ts=1026,Ws=1027,ev=1028,Rh=1029,tv=1030,Ch=1031,Ph=1033,Aa=33776,wa=33777,Ra=33778,Ca=33779,mu=35840,gu=35841,_u=35842,vu=35843,Lh=36196,xu=37492,Mu=37496,Su=37808,yu=37809,Eu=37810,bu=37811,Tu=37812,Au=37813,wu=37814,Ru=37815,Cu=37816,Pu=37817,Lu=37818,Du=37819,Iu=37820,Uu=37821,Pa=36492,Nu=36494,Ou=36495,nv=36283,Fu=36284,Bu=36285,zu=36286,Dh=3e3,ns=3001,iv=3200,sv=3201,Ih=0,rv=1,_n="",zt="srgb",gi="srgb-linear",Ql="display-p3",Jo="display-p3-linear",Lo="linear",pt="srgb",Do="rec709",Io="p3",hs=7680,Hu=519,ov=512,av=513,lv=514,Uh=515,cv=516,uv=517,fv=518,dv=519,Vu=35044,Gu="300 es",wl=1035,ui=2e3,Uo=2001;class cs{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const i=this._listeners;return i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const s=this._listeners[e];if(s!==void 0){const r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const i=this._listeners[e.type];if(i!==void 0){e.target=this;const s=i.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}}const Vt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],_o=Math.PI/180,Rl=180/Math.PI;function Ir(){const n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Vt[n&255]+Vt[n>>8&255]+Vt[n>>16&255]+Vt[n>>24&255]+"-"+Vt[e&255]+Vt[e>>8&255]+"-"+Vt[e>>16&15|64]+Vt[e>>24&255]+"-"+Vt[t&63|128]+Vt[t>>8&255]+"-"+Vt[t>>16&255]+Vt[t>>24&255]+Vt[i&255]+Vt[i>>8&255]+Vt[i>>16&255]+Vt[i>>24&255]).toLowerCase()}function Qt(n,e,t){return Math.max(e,Math.min(t,n))}function hv(n,e){return(n%e+e)%e}function La(n,e,t){return(1-t)*n+t*e}function ku(n){return(n&n-1)===0&&n!==0}function Cl(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function Qs(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function sn(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}const pv={DEG2RAD:_o};class Xe{constructor(e=0,t=0){Xe.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,i=this.y,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6],this.y=s[1]*t+s[4]*i+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(Qt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const i=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*i-a*s+e.x,this.y=r*s+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Qe{constructor(e,t,i,s,r,a,o,l,u){Qe.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,a,o,l,u)}set(e,t,i,s,r,a,o,l,u){const c=this.elements;return c[0]=e,c[1]=s,c[2]=o,c[3]=t,c[4]=r,c[5]=l,c[6]=i,c[7]=a,c[8]=u,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,s=t.elements,r=this.elements,a=i[0],o=i[3],l=i[6],u=i[1],c=i[4],f=i[7],d=i[2],p=i[5],x=i[8],_=s[0],m=s[3],h=s[6],g=s[1],S=s[4],M=s[7],I=s[2],L=s[5],C=s[8];return r[0]=a*_+o*g+l*I,r[3]=a*m+o*S+l*L,r[6]=a*h+o*M+l*C,r[1]=u*_+c*g+f*I,r[4]=u*m+c*S+f*L,r[7]=u*h+c*M+f*C,r[2]=d*_+p*g+x*I,r[5]=d*m+p*S+x*L,r[8]=d*h+p*M+x*C,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],u=e[7],c=e[8];return t*a*c-t*o*u-i*r*c+i*o*l+s*r*u-s*a*l}invert(){const e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],u=e[7],c=e[8],f=c*a-o*u,d=o*l-c*r,p=u*r-a*l,x=t*f+i*d+s*p;if(x===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/x;return e[0]=f*_,e[1]=(s*u-c*i)*_,e[2]=(o*i-s*a)*_,e[3]=d*_,e[4]=(c*t-s*l)*_,e[5]=(s*r-o*t)*_,e[6]=p*_,e[7]=(i*l-u*t)*_,e[8]=(a*t-i*r)*_,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,s,r,a,o){const l=Math.cos(r),u=Math.sin(r);return this.set(i*l,i*u,-i*(l*a+u*o)+a+e,-s*u,s*l,-s*(-u*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(Da.makeScale(e,t)),this}rotate(e){return this.premultiply(Da.makeRotation(-e)),this}translate(e,t){return this.premultiply(Da.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,i=e.elements;for(let s=0;s<9;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const Da=new Qe;function Nh(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function No(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function mv(){const n=No("canvas");return n.style.display="block",n}const Wu={};function mr(n){n in Wu||(Wu[n]=!0,console.warn(n))}const Xu=new Qe().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),ju=new Qe().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),Gr={[gi]:{transfer:Lo,primaries:Do,toReference:n=>n,fromReference:n=>n},[zt]:{transfer:pt,primaries:Do,toReference:n=>n.convertSRGBToLinear(),fromReference:n=>n.convertLinearToSRGB()},[Jo]:{transfer:Lo,primaries:Io,toReference:n=>n.applyMatrix3(ju),fromReference:n=>n.applyMatrix3(Xu)},[Ql]:{transfer:pt,primaries:Io,toReference:n=>n.convertSRGBToLinear().applyMatrix3(ju),fromReference:n=>n.applyMatrix3(Xu).convertLinearToSRGB()}},gv=new Set([gi,Jo]),lt={enabled:!0,_workingColorSpace:gi,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(n){if(!gv.has(n))throw new Error(`Unsupported working color space, "${n}".`);this._workingColorSpace=n},convert:function(n,e,t){if(this.enabled===!1||e===t||!e||!t)return n;const i=Gr[e].toReference,s=Gr[t].fromReference;return s(i(n))},fromWorkingColorSpace:function(n,e){return this.convert(n,this._workingColorSpace,e)},toWorkingColorSpace:function(n,e){return this.convert(n,e,this._workingColorSpace)},getPrimaries:function(n){return Gr[n].primaries},getTransfer:function(n){return n===_n?Lo:Gr[n].transfer}};function Fs(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Ia(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let ps;class Oh{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{ps===void 0&&(ps=No("canvas")),ps.width=e.width,ps.height=e.height;const i=ps.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),t=ps}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=No("canvas");t.width=e.width,t.height=e.height;const i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const s=i.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=Fs(r[a]/255)*255;return i.putImageData(s,0,0),t}else if(e.data){const t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Fs(t[i]/255)*255):t[i]=Fs(t[i]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let _v=0;class Fh{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:_v++}),this.uuid=Ir(),this.data=e,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(Ua(s[a].image)):r.push(Ua(s[a]))}else r=Ua(s);i.url=r}return t||(e.images[this.uuid]=i),i}}function Ua(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Oh.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let vv=0;class dn extends cs{constructor(e=dn.DEFAULT_IMAGE,t=dn.DEFAULT_MAPPING,i=Tn,s=Tn,r=mn,a=Ar,o=An,l=Ui,u=dn.DEFAULT_ANISOTROPY,c=_n){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:vv++}),this.uuid=Ir(),this.name="",this.source=new Fh(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=u,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Xe(0,0),this.repeat=new Xe(1,1),this.center=new Xe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Qe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof c=="string"?this.colorSpace=c:(mr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=c===ns?zt:_n),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==bh)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Tl:e.x=e.x-Math.floor(e.x);break;case Tn:e.x=e.x<0?0:1;break;case Al:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Tl:e.y=e.y-Math.floor(e.y);break;case Tn:e.y=e.y<0?0:1;break;case Al:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return mr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===zt?ns:Dh}set encoding(e){mr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=e===ns?zt:_n}}dn.DEFAULT_IMAGE=null;dn.DEFAULT_MAPPING=bh;dn.DEFAULT_ANISOTROPY=1;class Ot{constructor(e=0,t=0,i=0,s=1){Ot.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,s){return this.x=e,this.y=t,this.z=i,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,i=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*i+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*i+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*i+a[11]*s+a[15]*r,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,s,r;const l=e.elements,u=l[0],c=l[4],f=l[8],d=l[1],p=l[5],x=l[9],_=l[2],m=l[6],h=l[10];if(Math.abs(c-d)<.01&&Math.abs(f-_)<.01&&Math.abs(x-m)<.01){if(Math.abs(c+d)<.1&&Math.abs(f+_)<.1&&Math.abs(x+m)<.1&&Math.abs(u+p+h-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const S=(u+1)/2,M=(p+1)/2,I=(h+1)/2,L=(c+d)/4,C=(f+_)/4,ie=(x+m)/4;return S>M&&S>I?S<.01?(i=0,s=.707106781,r=.707106781):(i=Math.sqrt(S),s=L/i,r=C/i):M>I?M<.01?(i=.707106781,s=0,r=.707106781):(s=Math.sqrt(M),i=L/s,r=ie/s):I<.01?(i=.707106781,s=.707106781,r=0):(r=Math.sqrt(I),i=C/r,s=ie/r),this.set(i,s,r,t),this}let g=Math.sqrt((m-x)*(m-x)+(f-_)*(f-_)+(d-c)*(d-c));return Math.abs(g)<.001&&(g=1),this.x=(m-x)/g,this.y=(f-_)/g,this.z=(d-c)/g,this.w=Math.acos((u+p+h-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class xv extends cs{constructor(e=1,t=1,i={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new Ot(0,0,e,t),this.scissorTest=!1,this.viewport=new Ot(0,0,e,t);const s={width:e,height:t,depth:1};i.encoding!==void 0&&(mr("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),i.colorSpace=i.encoding===ns?zt:_n),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:mn,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},i),this.texture=new dn(s,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=i.generateMipmaps,this.texture.internalFormat=i.internalFormat,this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}setSize(e,t,i=1){(this.width!==e||this.height!==t||this.depth!==i)&&(this.width=e,this.height=t,this.depth=i,this.texture.image.width=e,this.texture.image.height=t,this.texture.image.depth=i,this.dispose()),this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.texture=e.texture.clone(),this.texture.isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new Fh(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class is extends xv{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}}class Bh extends dn{constructor(e=null,t=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=Zt,this.minFilter=Zt,this.wrapR=Tn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Mv extends dn{constructor(e=null,t=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=Zt,this.minFilter=Zt,this.wrapR=Tn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class ss{constructor(e=0,t=0,i=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=s}static slerpFlat(e,t,i,s,r,a,o){let l=i[s+0],u=i[s+1],c=i[s+2],f=i[s+3];const d=r[a+0],p=r[a+1],x=r[a+2],_=r[a+3];if(o===0){e[t+0]=l,e[t+1]=u,e[t+2]=c,e[t+3]=f;return}if(o===1){e[t+0]=d,e[t+1]=p,e[t+2]=x,e[t+3]=_;return}if(f!==_||l!==d||u!==p||c!==x){let m=1-o;const h=l*d+u*p+c*x+f*_,g=h>=0?1:-1,S=1-h*h;if(S>Number.EPSILON){const I=Math.sqrt(S),L=Math.atan2(I,h*g);m=Math.sin(m*L)/I,o=Math.sin(o*L)/I}const M=o*g;if(l=l*m+d*M,u=u*m+p*M,c=c*m+x*M,f=f*m+_*M,m===1-o){const I=1/Math.sqrt(l*l+u*u+c*c+f*f);l*=I,u*=I,c*=I,f*=I}}e[t]=l,e[t+1]=u,e[t+2]=c,e[t+3]=f}static multiplyQuaternionsFlat(e,t,i,s,r,a){const o=i[s],l=i[s+1],u=i[s+2],c=i[s+3],f=r[a],d=r[a+1],p=r[a+2],x=r[a+3];return e[t]=o*x+c*f+l*p-u*d,e[t+1]=l*x+c*d+u*f-o*p,e[t+2]=u*x+c*p+o*d-l*f,e[t+3]=c*x-o*f-l*d-u*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,s){return this._x=e,this._y=t,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const i=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,u=o(i/2),c=o(s/2),f=o(r/2),d=l(i/2),p=l(s/2),x=l(r/2);switch(a){case"XYZ":this._x=d*c*f+u*p*x,this._y=u*p*f-d*c*x,this._z=u*c*x+d*p*f,this._w=u*c*f-d*p*x;break;case"YXZ":this._x=d*c*f+u*p*x,this._y=u*p*f-d*c*x,this._z=u*c*x-d*p*f,this._w=u*c*f+d*p*x;break;case"ZXY":this._x=d*c*f-u*p*x,this._y=u*p*f+d*c*x,this._z=u*c*x+d*p*f,this._w=u*c*f-d*p*x;break;case"ZYX":this._x=d*c*f-u*p*x,this._y=u*p*f+d*c*x,this._z=u*c*x-d*p*f,this._w=u*c*f+d*p*x;break;case"YZX":this._x=d*c*f+u*p*x,this._y=u*p*f+d*c*x,this._z=u*c*x-d*p*f,this._w=u*c*f-d*p*x;break;case"XZY":this._x=d*c*f-u*p*x,this._y=u*p*f-d*c*x,this._z=u*c*x+d*p*f,this._w=u*c*f+d*p*x;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const i=t/2,s=Math.sin(i);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,i=t[0],s=t[4],r=t[8],a=t[1],o=t[5],l=t[9],u=t[2],c=t[6],f=t[10],d=i+o+f;if(d>0){const p=.5/Math.sqrt(d+1);this._w=.25/p,this._x=(c-l)*p,this._y=(r-u)*p,this._z=(a-s)*p}else if(i>o&&i>f){const p=2*Math.sqrt(1+i-o-f);this._w=(c-l)/p,this._x=.25*p,this._y=(s+a)/p,this._z=(r+u)/p}else if(o>f){const p=2*Math.sqrt(1+o-i-f);this._w=(r-u)/p,this._x=(s+a)/p,this._y=.25*p,this._z=(l+c)/p}else{const p=2*Math.sqrt(1+f-i-o);this._w=(a-s)/p,this._x=(r+u)/p,this._y=(l+c)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Qt(this.dot(e),-1,1)))}rotateTowards(e,t){const i=this.angleTo(e);if(i===0)return this;const s=Math.min(1,t/i);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const i=e._x,s=e._y,r=e._z,a=e._w,o=t._x,l=t._y,u=t._z,c=t._w;return this._x=i*c+a*o+s*u-r*l,this._y=s*c+a*l+r*o-i*u,this._z=r*c+a*u+i*l-s*o,this._w=a*c-i*o-s*l-r*u,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const i=this._x,s=this._y,r=this._z,a=this._w;let o=a*e._w+i*e._x+s*e._y+r*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=i,this._y=s,this._z=r,this;const l=1-o*o;if(l<=Number.EPSILON){const p=1-t;return this._w=p*a+t*this._w,this._x=p*i+t*this._x,this._y=p*s+t*this._y,this._z=p*r+t*this._z,this.normalize(),this}const u=Math.sqrt(l),c=Math.atan2(u,o),f=Math.sin((1-t)*c)/u,d=Math.sin(t*c)/u;return this._w=a*f+this._w*d,this._x=i*f+this._x*d,this._y=s*f+this._y*d,this._z=r*f+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){const e=Math.random(),t=Math.sqrt(1-e),i=Math.sqrt(e),s=2*Math.PI*Math.random(),r=2*Math.PI*Math.random();return this.set(t*Math.cos(s),i*Math.sin(r),i*Math.cos(r),t*Math.sin(s))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class W{constructor(e=0,t=0,i=0){W.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(qu.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(qu.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6]*s,this.y=r[1]*t+r[4]*i+r[7]*s,this.z=r[2]*t+r[5]*i+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,i=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*i+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*i+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*i+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*i+r[10]*s+r[14])*a,this}applyQuaternion(e){const t=this.x,i=this.y,s=this.z,r=e.x,a=e.y,o=e.z,l=e.w,u=2*(a*s-o*i),c=2*(o*t-r*s),f=2*(r*i-a*t);return this.x=t+l*u+a*f-o*c,this.y=i+l*c+o*u-r*f,this.z=s+l*f+r*c-a*u,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*i+r[8]*s,this.y=r[1]*t+r[5]*i+r[9]*s,this.z=r[2]*t+r[6]*i+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const i=e.x,s=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=s*l-r*o,this.y=r*a-i*l,this.z=i*o-s*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Na.copy(this).projectOnVector(e),this.sub(Na)}reflect(e){return this.sub(Na.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(Qt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y,s=this.z-e.z;return t*t+i*i+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){const s=Math.sin(t)*e;return this.x=s*Math.sin(i),this.y=Math.cos(t)*e,this.z=s*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=(Math.random()-.5)*2,t=Math.random()*Math.PI*2,i=Math.sqrt(1-e**2);return this.x=i*Math.cos(t),this.y=i*Math.sin(t),this.z=e,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Na=new W,qu=new ss;class Ur{constructor(e=new W(1/0,1/0,1/0),t=new W(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(Mn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(Mn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=Mn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const r=i.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Mn):Mn.fromBufferAttribute(r,a),Mn.applyMatrix4(e.matrixWorld),this.expandByPoint(Mn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),kr.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),kr.copy(i.boundingBox)),kr.applyMatrix4(e.matrixWorld),this.union(kr)}const s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,Mn),Mn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(er),Wr.subVectors(this.max,er),ms.subVectors(e.a,er),gs.subVectors(e.b,er),_s.subVectors(e.c,er),xi.subVectors(gs,ms),Mi.subVectors(_s,gs),Vi.subVectors(ms,_s);let t=[0,-xi.z,xi.y,0,-Mi.z,Mi.y,0,-Vi.z,Vi.y,xi.z,0,-xi.x,Mi.z,0,-Mi.x,Vi.z,0,-Vi.x,-xi.y,xi.x,0,-Mi.y,Mi.x,0,-Vi.y,Vi.x,0];return!Oa(t,ms,gs,_s,Wr)||(t=[1,0,0,0,1,0,0,0,1],!Oa(t,ms,gs,_s,Wr))?!1:(Xr.crossVectors(xi,Mi),t=[Xr.x,Xr.y,Xr.z],Oa(t,ms,gs,_s,Wr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Mn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Mn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Qn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Qn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Qn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Qn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Qn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Qn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Qn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Qn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Qn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const Qn=[new W,new W,new W,new W,new W,new W,new W,new W],Mn=new W,kr=new Ur,ms=new W,gs=new W,_s=new W,xi=new W,Mi=new W,Vi=new W,er=new W,Wr=new W,Xr=new W,Gi=new W;function Oa(n,e,t,i,s){for(let r=0,a=n.length-3;r<=a;r+=3){Gi.fromArray(n,r);const o=s.x*Math.abs(Gi.x)+s.y*Math.abs(Gi.y)+s.z*Math.abs(Gi.z),l=e.dot(Gi),u=t.dot(Gi),c=i.dot(Gi);if(Math.max(-Math.max(l,u,c),Math.min(l,u,c))>o)return!1}return!0}const Sv=new Ur,tr=new W,Fa=new W;class Qo{constructor(e=new W,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const i=this.center;t!==void 0?i.copy(t):Sv.setFromPoints(e).getCenter(i);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,i.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;tr.subVectors(e,this.center);const t=tr.lengthSq();if(t>this.radius*this.radius){const i=Math.sqrt(t),s=(i-this.radius)*.5;this.center.addScaledVector(tr,s/i),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Fa.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(tr.copy(e.center).add(Fa)),this.expandByPoint(tr.copy(e.center).sub(Fa))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const ei=new W,Ba=new W,jr=new W,Si=new W,za=new W,qr=new W,Ha=new W;class ec{constructor(e=new W,t=new W(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,ei)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=ei.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(ei.copy(this.origin).addScaledVector(this.direction,t),ei.distanceToSquared(e))}distanceSqToSegment(e,t,i,s){Ba.copy(e).add(t).multiplyScalar(.5),jr.copy(t).sub(e).normalize(),Si.copy(this.origin).sub(Ba);const r=e.distanceTo(t)*.5,a=-this.direction.dot(jr),o=Si.dot(this.direction),l=-Si.dot(jr),u=Si.lengthSq(),c=Math.abs(1-a*a);let f,d,p,x;if(c>0)if(f=a*l-o,d=a*o-l,x=r*c,f>=0)if(d>=-x)if(d<=x){const _=1/c;f*=_,d*=_,p=f*(f+a*d+2*o)+d*(a*f+d+2*l)+u}else d=r,f=Math.max(0,-(a*d+o)),p=-f*f+d*(d+2*l)+u;else d=-r,f=Math.max(0,-(a*d+o)),p=-f*f+d*(d+2*l)+u;else d<=-x?(f=Math.max(0,-(-a*r+o)),d=f>0?-r:Math.min(Math.max(-r,-l),r),p=-f*f+d*(d+2*l)+u):d<=x?(f=0,d=Math.min(Math.max(-r,-l),r),p=d*(d+2*l)+u):(f=Math.max(0,-(a*r+o)),d=f>0?r:Math.min(Math.max(-r,-l),r),p=-f*f+d*(d+2*l)+u);else d=a>0?-r:r,f=Math.max(0,-(a*d+o)),p=-f*f+d*(d+2*l)+u;return i&&i.copy(this.origin).addScaledVector(this.direction,f),s&&s.copy(Ba).addScaledVector(jr,d),p}intersectSphere(e,t){ei.subVectors(e.center,this.origin);const i=ei.dot(this.direction),s=ei.dot(ei)-i*i,r=e.radius*e.radius;if(s>r)return null;const a=Math.sqrt(r-s),o=i-a,l=i+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){const i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,s,r,a,o,l;const u=1/this.direction.x,c=1/this.direction.y,f=1/this.direction.z,d=this.origin;return u>=0?(i=(e.min.x-d.x)*u,s=(e.max.x-d.x)*u):(i=(e.max.x-d.x)*u,s=(e.min.x-d.x)*u),c>=0?(r=(e.min.y-d.y)*c,a=(e.max.y-d.y)*c):(r=(e.max.y-d.y)*c,a=(e.min.y-d.y)*c),i>a||r>s||((r>i||isNaN(i))&&(i=r),(a<s||isNaN(s))&&(s=a),f>=0?(o=(e.min.z-d.z)*f,l=(e.max.z-d.z)*f):(o=(e.max.z-d.z)*f,l=(e.min.z-d.z)*f),i>l||o>s)||((o>i||i!==i)&&(i=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,t)}intersectsBox(e){return this.intersectBox(e,ei)!==null}intersectTriangle(e,t,i,s,r){za.subVectors(t,e),qr.subVectors(i,e),Ha.crossVectors(za,qr);let a=this.direction.dot(Ha),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Si.subVectors(this.origin,e);const l=o*this.direction.dot(qr.crossVectors(Si,qr));if(l<0)return null;const u=o*this.direction.dot(za.cross(Si));if(u<0||l+u>a)return null;const c=-o*Si.dot(Ha);return c<0?null:this.at(c/a,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Rt{constructor(e,t,i,s,r,a,o,l,u,c,f,d,p,x,_,m){Rt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,a,o,l,u,c,f,d,p,x,_,m)}set(e,t,i,s,r,a,o,l,u,c,f,d,p,x,_,m){const h=this.elements;return h[0]=e,h[4]=t,h[8]=i,h[12]=s,h[1]=r,h[5]=a,h[9]=o,h[13]=l,h[2]=u,h[6]=c,h[10]=f,h[14]=d,h[3]=p,h[7]=x,h[11]=_,h[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Rt().fromArray(this.elements)}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){const t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,i=e.elements,s=1/vs.setFromMatrixColumn(e,0).length(),r=1/vs.setFromMatrixColumn(e,1).length(),a=1/vs.setFromMatrixColumn(e,2).length();return t[0]=i[0]*s,t[1]=i[1]*s,t[2]=i[2]*s,t[3]=0,t[4]=i[4]*r,t[5]=i[5]*r,t[6]=i[6]*r,t[7]=0,t[8]=i[8]*a,t[9]=i[9]*a,t[10]=i[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,i=e.x,s=e.y,r=e.z,a=Math.cos(i),o=Math.sin(i),l=Math.cos(s),u=Math.sin(s),c=Math.cos(r),f=Math.sin(r);if(e.order==="XYZ"){const d=a*c,p=a*f,x=o*c,_=o*f;t[0]=l*c,t[4]=-l*f,t[8]=u,t[1]=p+x*u,t[5]=d-_*u,t[9]=-o*l,t[2]=_-d*u,t[6]=x+p*u,t[10]=a*l}else if(e.order==="YXZ"){const d=l*c,p=l*f,x=u*c,_=u*f;t[0]=d+_*o,t[4]=x*o-p,t[8]=a*u,t[1]=a*f,t[5]=a*c,t[9]=-o,t[2]=p*o-x,t[6]=_+d*o,t[10]=a*l}else if(e.order==="ZXY"){const d=l*c,p=l*f,x=u*c,_=u*f;t[0]=d-_*o,t[4]=-a*f,t[8]=x+p*o,t[1]=p+x*o,t[5]=a*c,t[9]=_-d*o,t[2]=-a*u,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){const d=a*c,p=a*f,x=o*c,_=o*f;t[0]=l*c,t[4]=x*u-p,t[8]=d*u+_,t[1]=l*f,t[5]=_*u+d,t[9]=p*u-x,t[2]=-u,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){const d=a*l,p=a*u,x=o*l,_=o*u;t[0]=l*c,t[4]=_-d*f,t[8]=x*f+p,t[1]=f,t[5]=a*c,t[9]=-o*c,t[2]=-u*c,t[6]=p*f+x,t[10]=d-_*f}else if(e.order==="XZY"){const d=a*l,p=a*u,x=o*l,_=o*u;t[0]=l*c,t[4]=-f,t[8]=u*c,t[1]=d*f+_,t[5]=a*c,t[9]=p*f-x,t[2]=x*f-p,t[6]=o*c,t[10]=_*f+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(yv,e,Ev)}lookAt(e,t,i){const s=this.elements;return an.subVectors(e,t),an.lengthSq()===0&&(an.z=1),an.normalize(),yi.crossVectors(i,an),yi.lengthSq()===0&&(Math.abs(i.z)===1?an.x+=1e-4:an.z+=1e-4,an.normalize(),yi.crossVectors(i,an)),yi.normalize(),Yr.crossVectors(an,yi),s[0]=yi.x,s[4]=Yr.x,s[8]=an.x,s[1]=yi.y,s[5]=Yr.y,s[9]=an.y,s[2]=yi.z,s[6]=Yr.z,s[10]=an.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,s=t.elements,r=this.elements,a=i[0],o=i[4],l=i[8],u=i[12],c=i[1],f=i[5],d=i[9],p=i[13],x=i[2],_=i[6],m=i[10],h=i[14],g=i[3],S=i[7],M=i[11],I=i[15],L=s[0],C=s[4],ie=s[8],A=s[12],T=s[1],R=s[5],k=s[9],J=s[13],U=s[2],V=s[6],G=s[10],$=s[14],Z=s[3],ae=s[7],ce=s[11],de=s[15];return r[0]=a*L+o*T+l*U+u*Z,r[4]=a*C+o*R+l*V+u*ae,r[8]=a*ie+o*k+l*G+u*ce,r[12]=a*A+o*J+l*$+u*de,r[1]=c*L+f*T+d*U+p*Z,r[5]=c*C+f*R+d*V+p*ae,r[9]=c*ie+f*k+d*G+p*ce,r[13]=c*A+f*J+d*$+p*de,r[2]=x*L+_*T+m*U+h*Z,r[6]=x*C+_*R+m*V+h*ae,r[10]=x*ie+_*k+m*G+h*ce,r[14]=x*A+_*J+m*$+h*de,r[3]=g*L+S*T+M*U+I*Z,r[7]=g*C+S*R+M*V+I*ae,r[11]=g*ie+S*k+M*G+I*ce,r[15]=g*A+S*J+M*$+I*de,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[4],s=e[8],r=e[12],a=e[1],o=e[5],l=e[9],u=e[13],c=e[2],f=e[6],d=e[10],p=e[14],x=e[3],_=e[7],m=e[11],h=e[15];return x*(+r*l*f-s*u*f-r*o*d+i*u*d+s*o*p-i*l*p)+_*(+t*l*p-t*u*d+r*a*d-s*a*p+s*u*c-r*l*c)+m*(+t*u*f-t*o*p-r*a*f+i*a*p+r*o*c-i*u*c)+h*(-s*o*c-t*l*f+t*o*d+s*a*f-i*a*d+i*l*c)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){const s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=i),this}invert(){const e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],u=e[7],c=e[8],f=e[9],d=e[10],p=e[11],x=e[12],_=e[13],m=e[14],h=e[15],g=f*m*u-_*d*u+_*l*p-o*m*p-f*l*h+o*d*h,S=x*d*u-c*m*u-x*l*p+a*m*p+c*l*h-a*d*h,M=c*_*u-x*f*u+x*o*p-a*_*p-c*o*h+a*f*h,I=x*f*l-c*_*l-x*o*d+a*_*d+c*o*m-a*f*m,L=t*g+i*S+s*M+r*I;if(L===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const C=1/L;return e[0]=g*C,e[1]=(_*d*r-f*m*r-_*s*p+i*m*p+f*s*h-i*d*h)*C,e[2]=(o*m*r-_*l*r+_*s*u-i*m*u-o*s*h+i*l*h)*C,e[3]=(f*l*r-o*d*r-f*s*u+i*d*u+o*s*p-i*l*p)*C,e[4]=S*C,e[5]=(c*m*r-x*d*r+x*s*p-t*m*p-c*s*h+t*d*h)*C,e[6]=(x*l*r-a*m*r-x*s*u+t*m*u+a*s*h-t*l*h)*C,e[7]=(a*d*r-c*l*r+c*s*u-t*d*u-a*s*p+t*l*p)*C,e[8]=M*C,e[9]=(x*f*r-c*_*r-x*i*p+t*_*p+c*i*h-t*f*h)*C,e[10]=(a*_*r-x*o*r+x*i*u-t*_*u-a*i*h+t*o*h)*C,e[11]=(c*o*r-a*f*r-c*i*u+t*f*u+a*i*p-t*o*p)*C,e[12]=I*C,e[13]=(c*_*s-x*f*s+x*i*d-t*_*d-c*i*m+t*f*m)*C,e[14]=(x*o*s-a*_*s-x*i*l+t*_*l+a*i*m-t*o*m)*C,e[15]=(a*f*s-c*o*s+c*i*l-t*f*l-a*i*d+t*o*d)*C,this}scale(e){const t=this.elements,i=e.x,s=e.y,r=e.z;return t[0]*=i,t[4]*=s,t[8]*=r,t[1]*=i,t[5]*=s,t[9]*=r,t[2]*=i,t[6]*=s,t[10]*=r,t[3]*=i,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,s))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const i=Math.cos(t),s=Math.sin(t),r=1-i,a=e.x,o=e.y,l=e.z,u=r*a,c=r*o;return this.set(u*a+i,u*o-s*l,u*l+s*o,0,u*o+s*l,c*o+i,c*l-s*a,0,u*l-s*o,c*l+s*a,r*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,s,r,a){return this.set(1,i,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,i){const s=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,u=r+r,c=a+a,f=o+o,d=r*u,p=r*c,x=r*f,_=a*c,m=a*f,h=o*f,g=l*u,S=l*c,M=l*f,I=i.x,L=i.y,C=i.z;return s[0]=(1-(_+h))*I,s[1]=(p+M)*I,s[2]=(x-S)*I,s[3]=0,s[4]=(p-M)*L,s[5]=(1-(d+h))*L,s[6]=(m+g)*L,s[7]=0,s[8]=(x+S)*C,s[9]=(m-g)*C,s[10]=(1-(d+_))*C,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,i){const s=this.elements;let r=vs.set(s[0],s[1],s[2]).length();const a=vs.set(s[4],s[5],s[6]).length(),o=vs.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],Sn.copy(this);const u=1/r,c=1/a,f=1/o;return Sn.elements[0]*=u,Sn.elements[1]*=u,Sn.elements[2]*=u,Sn.elements[4]*=c,Sn.elements[5]*=c,Sn.elements[6]*=c,Sn.elements[8]*=f,Sn.elements[9]*=f,Sn.elements[10]*=f,t.setFromRotationMatrix(Sn),i.x=r,i.y=a,i.z=o,this}makePerspective(e,t,i,s,r,a,o=ui){const l=this.elements,u=2*r/(t-e),c=2*r/(i-s),f=(t+e)/(t-e),d=(i+s)/(i-s);let p,x;if(o===ui)p=-(a+r)/(a-r),x=-2*a*r/(a-r);else if(o===Uo)p=-a/(a-r),x=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=u,l[4]=0,l[8]=f,l[12]=0,l[1]=0,l[5]=c,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=x,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,s,r,a,o=ui){const l=this.elements,u=1/(t-e),c=1/(i-s),f=1/(a-r),d=(t+e)*u,p=(i+s)*c;let x,_;if(o===ui)x=(a+r)*f,_=-2*f;else if(o===Uo)x=r*f,_=-1*f;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*u,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*c,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=_,l[14]=-x,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,i=e.elements;for(let s=0;s<16;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}}const vs=new W,Sn=new Rt,yv=new W(0,0,0),Ev=new W(1,1,1),yi=new W,Yr=new W,an=new W,Yu=new Rt,Ku=new ss;class ea{constructor(e=0,t=0,i=0,s=ea.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,s=this._order){return this._x=e,this._y=t,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){const s=e.elements,r=s[0],a=s[4],o=s[8],l=s[1],u=s[5],c=s[9],f=s[2],d=s[6],p=s[10];switch(t){case"XYZ":this._y=Math.asin(Qt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-c,p),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(d,u),this._z=0);break;case"YXZ":this._x=Math.asin(-Qt(c,-1,1)),Math.abs(c)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,u)):(this._y=Math.atan2(-f,r),this._z=0);break;case"ZXY":this._x=Math.asin(Qt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-f,p),this._z=Math.atan2(-a,u)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Qt(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(d,p),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,u));break;case"YZX":this._z=Math.asin(Qt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-c,u),this._y=Math.atan2(-f,r)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-Qt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,u),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-c,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return Yu.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Yu,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Ku.setFromEuler(this),this.setFromQuaternion(Ku,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}ea.DEFAULT_ORDER="XYZ";class zh{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let bv=0;const $u=new W,xs=new ss,ti=new Rt,Kr=new W,nr=new W,Tv=new W,Av=new ss,Zu=new W(1,0,0),Ju=new W(0,1,0),Qu=new W(0,0,1),wv={type:"added"},Rv={type:"removed"};class Pt extends cs{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:bv++}),this.uuid=Ir(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Pt.DEFAULT_UP.clone();const e=new W,t=new ea,i=new ss,s=new W(1,1,1);function r(){i.setFromEuler(t,!1)}function a(){t.setFromQuaternion(i,void 0,!1)}t._onChange(r),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Rt},normalMatrix:{value:new Qe}}),this.matrix=new Rt,this.matrixWorld=new Rt,this.matrixAutoUpdate=Pt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Pt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new zh,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return xs.setFromAxisAngle(e,t),this.quaternion.multiply(xs),this}rotateOnWorldAxis(e,t){return xs.setFromAxisAngle(e,t),this.quaternion.premultiply(xs),this}rotateX(e){return this.rotateOnAxis(Zu,e)}rotateY(e){return this.rotateOnAxis(Ju,e)}rotateZ(e){return this.rotateOnAxis(Qu,e)}translateOnAxis(e,t){return $u.copy(e).applyQuaternion(this.quaternion),this.position.add($u.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Zu,e)}translateY(e){return this.translateOnAxis(Ju,e)}translateZ(e){return this.translateOnAxis(Qu,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(ti.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Kr.copy(e):Kr.set(e,t,i);const s=this.parent;this.updateWorldMatrix(!0,!1),nr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ti.lookAt(nr,Kr,this.up):ti.lookAt(Kr,nr,this.up),this.quaternion.setFromRotationMatrix(ti),s&&(ti.extractRotation(s.matrixWorld),xs.setFromRotationMatrix(ti),this.quaternion.premultiply(xs.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent(wv)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Rv)),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),ti.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),ti.multiply(e.parent.matrixWorld)),e.applyMatrix4(ti),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,s=this.children.length;i<s;i++){const a=this.children[i].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);const s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(nr,e,Tv),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(nr,Av,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let i=0,s=t.length;i<s;i++){const r=t[i];(r.matrixWorldAutoUpdate===!0||e===!0)&&r.updateMatrixWorld(e)}}updateWorldMatrix(e,t){const i=this.parent;if(e===!0&&i!==null&&i.matrixWorldAutoUpdate===!0&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){const s=this.children;for(let r=0,a=s.length;r<a;r++){const o=s[r];o.matrixWorldAutoUpdate===!0&&o.updateWorldMatrix(!1,!0)}}}toJSON(e){const t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),s.maxGeometryCount=this._maxGeometryCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(e),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let u=0,c=l.length;u<c;u++){const f=l[u];r(e.shapes,f)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,u=this.material.length;l<u;l++)o.push(r(e.materials,this.material[l]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];s.animations.push(r(e.animations,l))}}if(t){const o=a(e.geometries),l=a(e.materials),u=a(e.textures),c=a(e.images),f=a(e.shapes),d=a(e.skeletons),p=a(e.animations),x=a(e.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),u.length>0&&(i.textures=u),c.length>0&&(i.images=c),f.length>0&&(i.shapes=f),d.length>0&&(i.skeletons=d),p.length>0&&(i.animations=p),x.length>0&&(i.nodes=x)}return i.object=s,i;function a(o){const l=[];for(const u in o){const c=o[u];delete c.metadata,l.push(c)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){const s=e.children[i];this.add(s.clone())}return this}}Pt.DEFAULT_UP=new W(0,1,0);Pt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Pt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const yn=new W,ni=new W,Va=new W,ii=new W,Ms=new W,Ss=new W,ef=new W,Ga=new W,ka=new W,Wa=new W;let $r=!1;class bn{constructor(e=new W,t=new W,i=new W){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,s){s.subVectors(i,t),yn.subVectors(e,t),s.cross(yn);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,i,s,r){yn.subVectors(s,t),ni.subVectors(i,t),Va.subVectors(e,t);const a=yn.dot(yn),o=yn.dot(ni),l=yn.dot(Va),u=ni.dot(ni),c=ni.dot(Va),f=a*u-o*o;if(f===0)return r.set(0,0,0),null;const d=1/f,p=(u*l-o*c)*d,x=(a*c-o*l)*d;return r.set(1-p-x,x,p)}static containsPoint(e,t,i,s){return this.getBarycoord(e,t,i,s,ii)===null?!1:ii.x>=0&&ii.y>=0&&ii.x+ii.y<=1}static getUV(e,t,i,s,r,a,o,l){return $r===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),$r=!0),this.getInterpolation(e,t,i,s,r,a,o,l)}static getInterpolation(e,t,i,s,r,a,o,l){return this.getBarycoord(e,t,i,s,ii)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,ii.x),l.addScaledVector(a,ii.y),l.addScaledVector(o,ii.z),l)}static isFrontFacing(e,t,i,s){return yn.subVectors(i,t),ni.subVectors(e,t),yn.cross(ni).dot(s)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,s){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,i,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return yn.subVectors(this.c,this.b),ni.subVectors(this.a,this.b),yn.cross(ni).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return bn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return bn.getBarycoord(e,this.a,this.b,this.c,t)}getUV(e,t,i,s,r){return $r===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),$r=!0),bn.getInterpolation(e,this.a,this.b,this.c,t,i,s,r)}getInterpolation(e,t,i,s,r){return bn.getInterpolation(e,this.a,this.b,this.c,t,i,s,r)}containsPoint(e){return bn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return bn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const i=this.a,s=this.b,r=this.c;let a,o;Ms.subVectors(s,i),Ss.subVectors(r,i),Ga.subVectors(e,i);const l=Ms.dot(Ga),u=Ss.dot(Ga);if(l<=0&&u<=0)return t.copy(i);ka.subVectors(e,s);const c=Ms.dot(ka),f=Ss.dot(ka);if(c>=0&&f<=c)return t.copy(s);const d=l*f-c*u;if(d<=0&&l>=0&&c<=0)return a=l/(l-c),t.copy(i).addScaledVector(Ms,a);Wa.subVectors(e,r);const p=Ms.dot(Wa),x=Ss.dot(Wa);if(x>=0&&p<=x)return t.copy(r);const _=p*u-l*x;if(_<=0&&u>=0&&x<=0)return o=u/(u-x),t.copy(i).addScaledVector(Ss,o);const m=c*x-p*f;if(m<=0&&f-c>=0&&p-x>=0)return ef.subVectors(r,s),o=(f-c)/(f-c+(p-x)),t.copy(s).addScaledVector(ef,o);const h=1/(m+_+d);return a=_*h,o=d*h,t.copy(i).addScaledVector(Ms,a).addScaledVector(Ss,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const Hh={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ei={h:0,s:0,l:0},Zr={h:0,s:0,l:0};function Xa(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}class nt{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){const s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=zt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,lt.toWorkingColorSpace(this,t),this}setRGB(e,t,i,s=lt.workingColorSpace){return this.r=e,this.g=t,this.b=i,lt.toWorkingColorSpace(this,s),this}setHSL(e,t,i,s=lt.workingColorSpace){if(e=hv(e,1),t=Qt(t,0,1),i=Qt(i,0,1),t===0)this.r=this.g=this.b=i;else{const r=i<=.5?i*(1+t):i+t-i*t,a=2*i-r;this.r=Xa(a,r,e+1/3),this.g=Xa(a,r,e),this.b=Xa(a,r,e-1/3)}return lt.toWorkingColorSpace(this,s),this}setStyle(e,t=zt){function i(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r;const a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){const r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=zt){const i=Hh[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Fs(e.r),this.g=Fs(e.g),this.b=Fs(e.b),this}copyLinearToSRGB(e){return this.r=Ia(e.r),this.g=Ia(e.g),this.b=Ia(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=zt){return lt.fromWorkingColorSpace(Gt.copy(this),e),Math.round(Qt(Gt.r*255,0,255))*65536+Math.round(Qt(Gt.g*255,0,255))*256+Math.round(Qt(Gt.b*255,0,255))}getHexString(e=zt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=lt.workingColorSpace){lt.fromWorkingColorSpace(Gt.copy(this),t);const i=Gt.r,s=Gt.g,r=Gt.b,a=Math.max(i,s,r),o=Math.min(i,s,r);let l,u;const c=(o+a)/2;if(o===a)l=0,u=0;else{const f=a-o;switch(u=c<=.5?f/(a+o):f/(2-a-o),a){case i:l=(s-r)/f+(s<r?6:0);break;case s:l=(r-i)/f+2;break;case r:l=(i-s)/f+4;break}l/=6}return e.h=l,e.s=u,e.l=c,e}getRGB(e,t=lt.workingColorSpace){return lt.fromWorkingColorSpace(Gt.copy(this),t),e.r=Gt.r,e.g=Gt.g,e.b=Gt.b,e}getStyle(e=zt){lt.fromWorkingColorSpace(Gt.copy(this),e);const t=Gt.r,i=Gt.g,s=Gt.b;return e!==zt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(e,t,i){return this.getHSL(Ei),this.setHSL(Ei.h+e,Ei.s+t,Ei.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(Ei),e.getHSL(Zr);const i=La(Ei.h,Zr.h,t),s=La(Ei.s,Zr.s,t),r=La(Ei.l,Zr.l,t);return this.setHSL(i,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,i=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*i+r[6]*s,this.g=r[1]*t+r[4]*i+r[7]*s,this.b=r[2]*t+r[5]*i+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Gt=new nt;nt.NAMES=Hh;let Cv=0;class js extends cs{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Cv++}),this.uuid=Ir(),this.name="",this.type="Material",this.blending=Os,this.side=Oi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Sl,this.blendDst=yl,this.blendEquation=Yi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new nt(0,0,0),this.blendAlpha=0,this.depthFunc=Po,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Hu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=hs,this.stencilZFail=hs,this.stencilZPass=hs,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Os&&(i.blending=this.blending),this.side!==Oi&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Sl&&(i.blendSrc=this.blendSrc),this.blendDst!==yl&&(i.blendDst=this.blendDst),this.blendEquation!==Yi&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Po&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Hu&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==hs&&(i.stencilFail=this.stencilFail),this.stencilZFail!==hs&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==hs&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(r){const a=[];for(const o in r){const l=r[o];delete l.metadata,a.push(l)}return a}if(t){const r=s(e.textures),a=s(e.images);r.length>0&&(i.textures=r),a.length>0&&(i.images=a)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let i=null;if(t!==null){const s=t.length;i=new Array(s);for(let r=0;r!==s;++r)i[r]=t[r].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class tc extends js{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new nt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=Eh,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const wt=new W,Jr=new Xe;class Xn{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Vu,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=Ci,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return console.warn("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[i+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Jr.fromBufferAttribute(this,t),Jr.applyMatrix3(e),this.setXY(t,Jr.x,Jr.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)wt.fromBufferAttribute(this,t),wt.applyMatrix3(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)wt.fromBufferAttribute(this,t),wt.applyMatrix4(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)wt.fromBufferAttribute(this,t),wt.applyNormalMatrix(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)wt.fromBufferAttribute(this,t),wt.transformDirection(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Qs(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=sn(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Qs(t,this.array)),t}setX(e,t){return this.normalized&&(t=sn(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Qs(t,this.array)),t}setY(e,t){return this.normalized&&(t=sn(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Qs(t,this.array)),t}setZ(e,t){return this.normalized&&(t=sn(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Qs(t,this.array)),t}setW(e,t){return this.normalized&&(t=sn(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=sn(t,this.array),i=sn(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,s){return e*=this.itemSize,this.normalized&&(t=sn(t,this.array),i=sn(i,this.array),s=sn(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this}setXYZW(e,t,i,s,r){return e*=this.itemSize,this.normalized&&(t=sn(t,this.array),i=sn(i,this.array),s=sn(s,this.array),r=sn(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Vu&&(e.usage=this.usage),e}}class Vh extends Xn{constructor(e,t,i){super(new Uint16Array(e),t,i)}}class Gh extends Xn{constructor(e,t,i){super(new Uint32Array(e),t,i)}}class nn extends Xn{constructor(e,t,i){super(new Float32Array(e),t,i)}}let Pv=0;const pn=new Rt,ja=new Pt,ys=new W,ln=new Ur,ir=new Ur,Nt=new W;class Dn extends cs{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Pv++}),this.uuid=Ir(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Nh(e)?Gh:Vh)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const r=new Qe().getNormalMatrix(e);i.applyNormalMatrix(r),i.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return pn.makeRotationFromQuaternion(e),this.applyMatrix4(pn),this}rotateX(e){return pn.makeRotationX(e),this.applyMatrix4(pn),this}rotateY(e){return pn.makeRotationY(e),this.applyMatrix4(pn),this}rotateZ(e){return pn.makeRotationZ(e),this.applyMatrix4(pn),this}translate(e,t,i){return pn.makeTranslation(e,t,i),this.applyMatrix4(pn),this}scale(e,t,i){return pn.makeScale(e,t,i),this.applyMatrix4(pn),this}lookAt(e){return ja.lookAt(e),ja.updateMatrix(),this.applyMatrix4(ja.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ys).negate(),this.translate(ys.x,ys.y,ys.z),this}setFromPoints(e){const t=[];for(let i=0,s=e.length;i<s;i++){const r=e[i];t.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new nn(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ur);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new W(-1/0,-1/0,-1/0),new W(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,s=t.length;i<s;i++){const r=t[i];ln.setFromBufferAttribute(r),this.morphTargetsRelative?(Nt.addVectors(this.boundingBox.min,ln.min),this.boundingBox.expandByPoint(Nt),Nt.addVectors(this.boundingBox.max,ln.max),this.boundingBox.expandByPoint(Nt)):(this.boundingBox.expandByPoint(ln.min),this.boundingBox.expandByPoint(ln.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Qo);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new W,1/0);return}if(e){const i=this.boundingSphere.center;if(ln.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){const o=t[r];ir.setFromBufferAttribute(o),this.morphTargetsRelative?(Nt.addVectors(ln.min,ir.min),ln.expandByPoint(Nt),Nt.addVectors(ln.max,ir.max),ln.expandByPoint(Nt)):(ln.expandByPoint(ir.min),ln.expandByPoint(ir.max))}ln.getCenter(i);let s=0;for(let r=0,a=e.count;r<a;r++)Nt.fromBufferAttribute(e,r),s=Math.max(s,i.distanceToSquared(Nt));if(t)for(let r=0,a=t.length;r<a;r++){const o=t[r],l=this.morphTargetsRelative;for(let u=0,c=o.count;u<c;u++)Nt.fromBufferAttribute(o,u),l&&(ys.fromBufferAttribute(e,u),Nt.add(ys)),s=Math.max(s,i.distanceToSquared(Nt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=e.array,s=t.position.array,r=t.normal.array,a=t.uv.array,o=s.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Xn(new Float32Array(4*o),4));const l=this.getAttribute("tangent").array,u=[],c=[];for(let T=0;T<o;T++)u[T]=new W,c[T]=new W;const f=new W,d=new W,p=new W,x=new Xe,_=new Xe,m=new Xe,h=new W,g=new W;function S(T,R,k){f.fromArray(s,T*3),d.fromArray(s,R*3),p.fromArray(s,k*3),x.fromArray(a,T*2),_.fromArray(a,R*2),m.fromArray(a,k*2),d.sub(f),p.sub(f),_.sub(x),m.sub(x);const J=1/(_.x*m.y-m.x*_.y);isFinite(J)&&(h.copy(d).multiplyScalar(m.y).addScaledVector(p,-_.y).multiplyScalar(J),g.copy(p).multiplyScalar(_.x).addScaledVector(d,-m.x).multiplyScalar(J),u[T].add(h),u[R].add(h),u[k].add(h),c[T].add(g),c[R].add(g),c[k].add(g))}let M=this.groups;M.length===0&&(M=[{start:0,count:i.length}]);for(let T=0,R=M.length;T<R;++T){const k=M[T],J=k.start,U=k.count;for(let V=J,G=J+U;V<G;V+=3)S(i[V+0],i[V+1],i[V+2])}const I=new W,L=new W,C=new W,ie=new W;function A(T){C.fromArray(r,T*3),ie.copy(C);const R=u[T];I.copy(R),I.sub(C.multiplyScalar(C.dot(R))).normalize(),L.crossVectors(ie,R);const J=L.dot(c[T])<0?-1:1;l[T*4]=I.x,l[T*4+1]=I.y,l[T*4+2]=I.z,l[T*4+3]=J}for(let T=0,R=M.length;T<R;++T){const k=M[T],J=k.start,U=k.count;for(let V=J,G=J+U;V<G;V+=3)A(i[V+0]),A(i[V+1]),A(i[V+2])}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new Xn(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let d=0,p=i.count;d<p;d++)i.setXYZ(d,0,0,0);const s=new W,r=new W,a=new W,o=new W,l=new W,u=new W,c=new W,f=new W;if(e)for(let d=0,p=e.count;d<p;d+=3){const x=e.getX(d+0),_=e.getX(d+1),m=e.getX(d+2);s.fromBufferAttribute(t,x),r.fromBufferAttribute(t,_),a.fromBufferAttribute(t,m),c.subVectors(a,r),f.subVectors(s,r),c.cross(f),o.fromBufferAttribute(i,x),l.fromBufferAttribute(i,_),u.fromBufferAttribute(i,m),o.add(c),l.add(c),u.add(c),i.setXYZ(x,o.x,o.y,o.z),i.setXYZ(_,l.x,l.y,l.z),i.setXYZ(m,u.x,u.y,u.z)}else for(let d=0,p=t.count;d<p;d+=3)s.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),c.subVectors(a,r),f.subVectors(s,r),c.cross(f),i.setXYZ(d+0,c.x,c.y,c.z),i.setXYZ(d+1,c.x,c.y,c.z),i.setXYZ(d+2,c.x,c.y,c.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Nt.fromBufferAttribute(e,t),Nt.normalize(),e.setXYZ(t,Nt.x,Nt.y,Nt.z)}toNonIndexed(){function e(o,l){const u=o.array,c=o.itemSize,f=o.normalized,d=new u.constructor(l.length*c);let p=0,x=0;for(let _=0,m=l.length;_<m;_++){o.isInterleavedBufferAttribute?p=l[_]*o.data.stride+o.offset:p=l[_]*c;for(let h=0;h<c;h++)d[x++]=u[p++]}return new Xn(d,c,f)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Dn,i=this.index.array,s=this.attributes;for(const o in s){const l=s[o],u=e(l,i);t.setAttribute(o,u)}const r=this.morphAttributes;for(const o in r){const l=[],u=r[o];for(let c=0,f=u.length;c<f;c++){const d=u[c],p=e(d,i);l.push(p)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const u=a[o];t.addGroup(u.start,u.count,u.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const u in l)l[u]!==void 0&&(e[u]=l[u]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const i=this.attributes;for(const l in i){const u=i[l];e.data.attributes[l]=u.toJSON(e.data)}const s={};let r=!1;for(const l in this.morphAttributes){const u=this.morphAttributes[l],c=[];for(let f=0,d=u.length;f<d;f++){const p=u[f];c.push(p.toJSON(e.data))}c.length>0&&(s[l]=c,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone(t));const s=e.attributes;for(const u in s){const c=s[u];this.setAttribute(u,c.clone(t))}const r=e.morphAttributes;for(const u in r){const c=[],f=r[u];for(let d=0,p=f.length;d<p;d++)c.push(f[d].clone(t));this.morphAttributes[u]=c}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let u=0,c=a.length;u<c;u++){const f=a[u];this.addGroup(f.start,f.count,f.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const tf=new Rt,ki=new ec,Qr=new Qo,nf=new W,Es=new W,bs=new W,Ts=new W,qa=new W,eo=new W,to=new Xe,no=new Xe,io=new Xe,sf=new W,rf=new W,of=new W,so=new W,ro=new W;class kt extends Pt{constructor(e=new Dn,t=new tc){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){const i=this.geometry,s=i.attributes.position,r=i.morphAttributes.position,a=i.morphTargetsRelative;t.fromBufferAttribute(s,e);const o=this.morphTargetInfluences;if(r&&o){eo.set(0,0,0);for(let l=0,u=r.length;l<u;l++){const c=o[l],f=r[l];c!==0&&(qa.fromBufferAttribute(f,e),a?eo.addScaledVector(qa,c):eo.addScaledVector(qa.sub(t),c))}t.add(eo)}return t}raycast(e,t){const i=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Qr.copy(i.boundingSphere),Qr.applyMatrix4(r),ki.copy(e.ray).recast(e.near),!(Qr.containsPoint(ki.origin)===!1&&(ki.intersectSphere(Qr,nf)===null||ki.origin.distanceToSquared(nf)>(e.far-e.near)**2))&&(tf.copy(r).invert(),ki.copy(e.ray).applyMatrix4(tf),!(i.boundingBox!==null&&ki.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,ki)))}_computeIntersections(e,t,i){let s;const r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,u=r.attributes.uv,c=r.attributes.uv1,f=r.attributes.normal,d=r.groups,p=r.drawRange;if(o!==null)if(Array.isArray(a))for(let x=0,_=d.length;x<_;x++){const m=d[x],h=a[m.materialIndex],g=Math.max(m.start,p.start),S=Math.min(o.count,Math.min(m.start+m.count,p.start+p.count));for(let M=g,I=S;M<I;M+=3){const L=o.getX(M),C=o.getX(M+1),ie=o.getX(M+2);s=oo(this,h,e,i,u,c,f,L,C,ie),s&&(s.faceIndex=Math.floor(M/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{const x=Math.max(0,p.start),_=Math.min(o.count,p.start+p.count);for(let m=x,h=_;m<h;m+=3){const g=o.getX(m),S=o.getX(m+1),M=o.getX(m+2);s=oo(this,a,e,i,u,c,f,g,S,M),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let x=0,_=d.length;x<_;x++){const m=d[x],h=a[m.materialIndex],g=Math.max(m.start,p.start),S=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));for(let M=g,I=S;M<I;M+=3){const L=M,C=M+1,ie=M+2;s=oo(this,h,e,i,u,c,f,L,C,ie),s&&(s.faceIndex=Math.floor(M/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{const x=Math.max(0,p.start),_=Math.min(l.count,p.start+p.count);for(let m=x,h=_;m<h;m+=3){const g=m,S=m+1,M=m+2;s=oo(this,a,e,i,u,c,f,g,S,M),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}}}function Lv(n,e,t,i,s,r,a,o){let l;if(e.side===rn?l=i.intersectTriangle(a,r,s,!0,o):l=i.intersectTriangle(s,r,a,e.side===Oi,o),l===null)return null;ro.copy(o),ro.applyMatrix4(n.matrixWorld);const u=t.ray.origin.distanceTo(ro);return u<t.near||u>t.far?null:{distance:u,point:ro.clone(),object:n}}function oo(n,e,t,i,s,r,a,o,l,u){n.getVertexPosition(o,Es),n.getVertexPosition(l,bs),n.getVertexPosition(u,Ts);const c=Lv(n,e,t,i,Es,bs,Ts,so);if(c){s&&(to.fromBufferAttribute(s,o),no.fromBufferAttribute(s,l),io.fromBufferAttribute(s,u),c.uv=bn.getInterpolation(so,Es,bs,Ts,to,no,io,new Xe)),r&&(to.fromBufferAttribute(r,o),no.fromBufferAttribute(r,l),io.fromBufferAttribute(r,u),c.uv1=bn.getInterpolation(so,Es,bs,Ts,to,no,io,new Xe),c.uv2=c.uv1),a&&(sf.fromBufferAttribute(a,o),rf.fromBufferAttribute(a,l),of.fromBufferAttribute(a,u),c.normal=bn.getInterpolation(so,Es,bs,Ts,sf,rf,of,new W),c.normal.dot(i.direction)>0&&c.normal.multiplyScalar(-1));const f={a:o,b:l,c:u,normal:new W,materialIndex:0};bn.getNormal(Es,bs,Ts,f.normal),c.face=f}return c}class fi extends Dn{constructor(e=1,t=1,i=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:s,heightSegments:r,depthSegments:a};const o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);const l=[],u=[],c=[],f=[];let d=0,p=0;x("z","y","x",-1,-1,i,t,e,a,r,0),x("z","y","x",1,-1,i,t,-e,a,r,1),x("x","z","y",1,1,e,i,t,s,a,2),x("x","z","y",1,-1,e,i,-t,s,a,3),x("x","y","z",1,-1,e,t,i,s,r,4),x("x","y","z",-1,-1,e,t,-i,s,r,5),this.setIndex(l),this.setAttribute("position",new nn(u,3)),this.setAttribute("normal",new nn(c,3)),this.setAttribute("uv",new nn(f,2));function x(_,m,h,g,S,M,I,L,C,ie,A){const T=M/C,R=I/ie,k=M/2,J=I/2,U=L/2,V=C+1,G=ie+1;let $=0,Z=0;const ae=new W;for(let ce=0;ce<G;ce++){const de=ce*R-J;for(let he=0;he<V;he++){const ee=he*T-k;ae[_]=ee*g,ae[m]=de*S,ae[h]=U,u.push(ae.x,ae.y,ae.z),ae[_]=0,ae[m]=0,ae[h]=L>0?1:-1,c.push(ae.x,ae.y,ae.z),f.push(he/C),f.push(1-ce/ie),$+=1}}for(let ce=0;ce<ie;ce++)for(let de=0;de<C;de++){const he=d+de+V*ce,ee=d+de+V*(ce+1),Y=d+(de+1)+V*(ce+1),ge=d+(de+1)+V*ce;l.push(he,ee,ge),l.push(ee,Y,ge),Z+=6}o.addGroup(p,Z,A),p+=Z,d+=$}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new fi(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function Xs(n){const e={};for(const t in n){e[t]={};for(const i in n[t]){const s=n[t][i];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=s.clone():Array.isArray(s)?e[t][i]=s.slice():e[t][i]=s}}return e}function Kt(n){const e={};for(let t=0;t<n.length;t++){const i=Xs(n[t]);for(const s in i)e[s]=i[s]}return e}function Dv(n){const e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function kh(n){return n.getRenderTarget()===null?n.outputColorSpace:lt.workingColorSpace}const Iv={clone:Xs,merge:Kt};var Uv=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Nv=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class rs extends js{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Uv,this.fragmentShader=Nv,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Xs(e.uniforms),this.uniformsGroups=Dv(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const s in this.uniforms){const a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const i={};for(const s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}}class Wh extends Pt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Rt,this.projectionMatrix=new Rt,this.projectionMatrixInverse=new Rt,this.coordinateSystem=ui}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class gn extends Wh{constructor(e=50,t=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Rl*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(_o*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Rl*2*Math.atan(Math.tan(_o*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(e,t,i,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(_o*.5*this.fov)/this.zoom,i=2*t,s=this.aspect*i,r=-.5*s;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,u=a.fullHeight;r+=a.offsetX*s/l,t-=a.offsetY*i/u,s*=a.width/l,i*=a.height/u}const o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const As=-90,ws=1;class Ov extends Pt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new gn(As,ws,e,t);s.layers=this.layers,this.add(s);const r=new gn(As,ws,e,t);r.layers=this.layers,this.add(r);const a=new gn(As,ws,e,t);a.layers=this.layers,this.add(a);const o=new gn(As,ws,e,t);o.layers=this.layers,this.add(o);const l=new gn(As,ws,e,t);l.layers=this.layers,this.add(l);const u=new gn(As,ws,e,t);u.layers=this.layers,this.add(u)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[i,s,r,a,o,l]=t;for(const u of t)this.remove(u);if(e===ui)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Uo)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const u of t)this.add(u),u.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,l,u,c]=this.children,f=e.getRenderTarget(),d=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),x=e.xr.enabled;e.xr.enabled=!1;const _=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,s),e.render(t,r),e.setRenderTarget(i,1,s),e.render(t,a),e.setRenderTarget(i,2,s),e.render(t,o),e.setRenderTarget(i,3,s),e.render(t,l),e.setRenderTarget(i,4,s),e.render(t,u),i.texture.generateMipmaps=_,e.setRenderTarget(i,5,s),e.render(t,c),e.setRenderTarget(f,d,p),e.xr.enabled=x,i.texture.needsPMREMUpdate=!0}}class Xh extends dn{constructor(e,t,i,s,r,a,o,l,u,c){e=e!==void 0?e:[],t=t!==void 0?t:Gs,super(e,t,i,s,r,a,o,l,u,c),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Fv extends is{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},s=[i,i,i,i,i,i];t.encoding!==void 0&&(mr("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),t.colorSpace=t.encoding===ns?zt:_n),this.texture=new Xh(s,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:mn}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new fi(5,5,5),r=new rs({name:"CubemapFromEquirect",uniforms:Xs(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:rn,blending:Di});r.uniforms.tEquirect.value=t;const a=new kt(s,r),o=t.minFilter;return t.minFilter===Ar&&(t.minFilter=mn),new Ov(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,i,s){const r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,i,s);e.setRenderTarget(r)}}const Ya=new W,Bv=new W,zv=new Qe;class Ai{constructor(e=new W(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,s){return this.normal.set(e,t,i),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){const s=Ya.subVectors(i,t).cross(Bv.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const i=e.delta(Ya),s=this.normal.dot(i);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(i,r)}intersectsLine(e){const t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const i=t||zv.getNormalMatrix(e),s=this.coplanarPoint(Ya).applyMatrix4(e),r=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Wi=new Qo,ao=new W;class nc{constructor(e=new Ai,t=new Ai,i=new Ai,s=new Ai,r=new Ai,a=new Ai){this.planes=[e,t,i,s,r,a]}set(e,t,i,s,r,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(i),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){const t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=ui){const i=this.planes,s=e.elements,r=s[0],a=s[1],o=s[2],l=s[3],u=s[4],c=s[5],f=s[6],d=s[7],p=s[8],x=s[9],_=s[10],m=s[11],h=s[12],g=s[13],S=s[14],M=s[15];if(i[0].setComponents(l-r,d-u,m-p,M-h).normalize(),i[1].setComponents(l+r,d+u,m+p,M+h).normalize(),i[2].setComponents(l+a,d+c,m+x,M+g).normalize(),i[3].setComponents(l-a,d-c,m-x,M-g).normalize(),i[4].setComponents(l-o,d-f,m-_,M-S).normalize(),t===ui)i[5].setComponents(l+o,d+f,m+_,M+S).normalize();else if(t===Uo)i[5].setComponents(o,f,_,S).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Wi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Wi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Wi)}intersectsSprite(e){return Wi.center.set(0,0,0),Wi.radius=.7071067811865476,Wi.applyMatrix4(e.matrixWorld),this.intersectsSphere(Wi)}intersectsSphere(e){const t=this.planes,i=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(i)<s)return!1;return!0}intersectsBox(e){const t=this.planes;for(let i=0;i<6;i++){const s=t[i];if(ao.x=s.normal.x>0?e.max.x:e.min.x,ao.y=s.normal.y>0?e.max.y:e.min.y,ao.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(ao)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function jh(){let n=null,e=!1,t=null,i=null;function s(r,a){t(r,a),i=n.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(s),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){n=r}}}function Hv(n,e){const t=e.isWebGL2,i=new WeakMap;function s(u,c){const f=u.array,d=u.usage,p=f.byteLength,x=n.createBuffer();n.bindBuffer(c,x),n.bufferData(c,f,d),u.onUploadCallback();let _;if(f instanceof Float32Array)_=n.FLOAT;else if(f instanceof Uint16Array)if(u.isFloat16BufferAttribute)if(t)_=n.HALF_FLOAT;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else _=n.UNSIGNED_SHORT;else if(f instanceof Int16Array)_=n.SHORT;else if(f instanceof Uint32Array)_=n.UNSIGNED_INT;else if(f instanceof Int32Array)_=n.INT;else if(f instanceof Int8Array)_=n.BYTE;else if(f instanceof Uint8Array)_=n.UNSIGNED_BYTE;else if(f instanceof Uint8ClampedArray)_=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+f);return{buffer:x,type:_,bytesPerElement:f.BYTES_PER_ELEMENT,version:u.version,size:p}}function r(u,c,f){const d=c.array,p=c._updateRange,x=c.updateRanges;if(n.bindBuffer(f,u),p.count===-1&&x.length===0&&n.bufferSubData(f,0,d),x.length!==0){for(let _=0,m=x.length;_<m;_++){const h=x[_];t?n.bufferSubData(f,h.start*d.BYTES_PER_ELEMENT,d,h.start,h.count):n.bufferSubData(f,h.start*d.BYTES_PER_ELEMENT,d.subarray(h.start,h.start+h.count))}c.clearUpdateRanges()}p.count!==-1&&(t?n.bufferSubData(f,p.offset*d.BYTES_PER_ELEMENT,d,p.offset,p.count):n.bufferSubData(f,p.offset*d.BYTES_PER_ELEMENT,d.subarray(p.offset,p.offset+p.count)),p.count=-1),c.onUploadCallback()}function a(u){return u.isInterleavedBufferAttribute&&(u=u.data),i.get(u)}function o(u){u.isInterleavedBufferAttribute&&(u=u.data);const c=i.get(u);c&&(n.deleteBuffer(c.buffer),i.delete(u))}function l(u,c){if(u.isGLBufferAttribute){const d=i.get(u);(!d||d.version<u.version)&&i.set(u,{buffer:u.buffer,type:u.type,bytesPerElement:u.elementSize,version:u.version});return}u.isInterleavedBufferAttribute&&(u=u.data);const f=i.get(u);if(f===void 0)i.set(u,s(u,c));else if(f.version<u.version){if(f.size!==u.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");r(f.buffer,u,c),f.version=u.version}}return{get:a,remove:o,update:l}}class ta extends Dn{constructor(e=1,t=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:s};const r=e/2,a=t/2,o=Math.floor(i),l=Math.floor(s),u=o+1,c=l+1,f=e/o,d=t/l,p=[],x=[],_=[],m=[];for(let h=0;h<c;h++){const g=h*d-a;for(let S=0;S<u;S++){const M=S*f-r;x.push(M,-g,0),_.push(0,0,1),m.push(S/o),m.push(1-h/l)}}for(let h=0;h<l;h++)for(let g=0;g<o;g++){const S=g+u*h,M=g+u*(h+1),I=g+1+u*(h+1),L=g+1+u*h;p.push(S,M,L),p.push(M,I,L)}this.setIndex(p),this.setAttribute("position",new nn(x,3)),this.setAttribute("normal",new nn(_,3)),this.setAttribute("uv",new nn(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ta(e.width,e.height,e.widthSegments,e.heightSegments)}}var Vv=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Gv=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,kv=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Wv=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Xv=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,jv=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,qv=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Yv=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Kv=`#ifdef USE_BATCHING
	attribute float batchId;
	uniform highp sampler2D batchingTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,$v=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,Zv=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Jv=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Qv=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,ex=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,tx=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,nx=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#pragma unroll_loop_start
	for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
		plane = clippingPlanes[ i ];
		if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
	}
	#pragma unroll_loop_end
	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
		bool clipped = true;
		#pragma unroll_loop_start
		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
		}
		#pragma unroll_loop_end
		if ( clipped ) discard;
	#endif
#endif`,ix=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,sx=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,rx=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,ox=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,ax=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,lx=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,cx=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,ux=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,fx=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,dx=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,hx=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,px=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,mx=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,gx=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,_x="gl_FragColor = linearToOutputTexel( gl_FragColor );",vx=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return sRGBTransferOETF( value );
}`,xx=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Mx=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Sx=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,yx=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Ex=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,bx=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Tx=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Ax=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,wx=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Rx=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Cx=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,Px=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Lx=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Dx=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Ix=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	#if defined ( LEGACY_LIGHTS )
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#else
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#endif
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Ux=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Nx=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Ox=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Fx=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Bx=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,zx=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Hx=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Vx=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Gx=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,kx=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Wx=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Xx=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,jx=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,qx=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,Yx=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Kx=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,$x=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Zx=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Jx=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Qx=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,eM=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,tM=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`,nM=`#ifdef USE_MORPHTARGETS
	uniform float morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`,iM=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`,sM=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,rM=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,oM=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,aM=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,lM=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,cM=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,uM=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,fM=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,dM=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,hM=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,pM=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,mM=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,gM=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,_M=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,vM=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,xM=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,MM=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,SM=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,yM=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`,EM=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,bM=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,TM=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,AM=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,wM=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,RM=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,CM=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,PM=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,LM=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,DM=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,IM=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color *= toneMappingExposure;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	return color;
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,UM=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,NM=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,OM=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,FM=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,BM=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,zM=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const HM=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,VM=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,GM=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,kM=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,WM=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,XM=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,jM=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,qM=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,YM=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,KM=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,$M=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,ZM=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,JM=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,QM=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,eS=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,tS=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,nS=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,iS=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,sS=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,rS=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,oS=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,aS=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,lS=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,cS=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,uS=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,fS=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,dS=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,hS=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,pS=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,mS=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,gS=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,_S=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,vS=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,xS=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ke={alphahash_fragment:Vv,alphahash_pars_fragment:Gv,alphamap_fragment:kv,alphamap_pars_fragment:Wv,alphatest_fragment:Xv,alphatest_pars_fragment:jv,aomap_fragment:qv,aomap_pars_fragment:Yv,batching_pars_vertex:Kv,batching_vertex:$v,begin_vertex:Zv,beginnormal_vertex:Jv,bsdfs:Qv,iridescence_fragment:ex,bumpmap_pars_fragment:tx,clipping_planes_fragment:nx,clipping_planes_pars_fragment:ix,clipping_planes_pars_vertex:sx,clipping_planes_vertex:rx,color_fragment:ox,color_pars_fragment:ax,color_pars_vertex:lx,color_vertex:cx,common:ux,cube_uv_reflection_fragment:fx,defaultnormal_vertex:dx,displacementmap_pars_vertex:hx,displacementmap_vertex:px,emissivemap_fragment:mx,emissivemap_pars_fragment:gx,colorspace_fragment:_x,colorspace_pars_fragment:vx,envmap_fragment:xx,envmap_common_pars_fragment:Mx,envmap_pars_fragment:Sx,envmap_pars_vertex:yx,envmap_physical_pars_fragment:Ux,envmap_vertex:Ex,fog_vertex:bx,fog_pars_vertex:Tx,fog_fragment:Ax,fog_pars_fragment:wx,gradientmap_pars_fragment:Rx,lightmap_fragment:Cx,lightmap_pars_fragment:Px,lights_lambert_fragment:Lx,lights_lambert_pars_fragment:Dx,lights_pars_begin:Ix,lights_toon_fragment:Nx,lights_toon_pars_fragment:Ox,lights_phong_fragment:Fx,lights_phong_pars_fragment:Bx,lights_physical_fragment:zx,lights_physical_pars_fragment:Hx,lights_fragment_begin:Vx,lights_fragment_maps:Gx,lights_fragment_end:kx,logdepthbuf_fragment:Wx,logdepthbuf_pars_fragment:Xx,logdepthbuf_pars_vertex:jx,logdepthbuf_vertex:qx,map_fragment:Yx,map_pars_fragment:Kx,map_particle_fragment:$x,map_particle_pars_fragment:Zx,metalnessmap_fragment:Jx,metalnessmap_pars_fragment:Qx,morphcolor_vertex:eM,morphnormal_vertex:tM,morphtarget_pars_vertex:nM,morphtarget_vertex:iM,normal_fragment_begin:sM,normal_fragment_maps:rM,normal_pars_fragment:oM,normal_pars_vertex:aM,normal_vertex:lM,normalmap_pars_fragment:cM,clearcoat_normal_fragment_begin:uM,clearcoat_normal_fragment_maps:fM,clearcoat_pars_fragment:dM,iridescence_pars_fragment:hM,opaque_fragment:pM,packing:mM,premultiplied_alpha_fragment:gM,project_vertex:_M,dithering_fragment:vM,dithering_pars_fragment:xM,roughnessmap_fragment:MM,roughnessmap_pars_fragment:SM,shadowmap_pars_fragment:yM,shadowmap_pars_vertex:EM,shadowmap_vertex:bM,shadowmask_pars_fragment:TM,skinbase_vertex:AM,skinning_pars_vertex:wM,skinning_vertex:RM,skinnormal_vertex:CM,specularmap_fragment:PM,specularmap_pars_fragment:LM,tonemapping_fragment:DM,tonemapping_pars_fragment:IM,transmission_fragment:UM,transmission_pars_fragment:NM,uv_pars_fragment:OM,uv_pars_vertex:FM,uv_vertex:BM,worldpos_vertex:zM,background_vert:HM,background_frag:VM,backgroundCube_vert:GM,backgroundCube_frag:kM,cube_vert:WM,cube_frag:XM,depth_vert:jM,depth_frag:qM,distanceRGBA_vert:YM,distanceRGBA_frag:KM,equirect_vert:$M,equirect_frag:ZM,linedashed_vert:JM,linedashed_frag:QM,meshbasic_vert:eS,meshbasic_frag:tS,meshlambert_vert:nS,meshlambert_frag:iS,meshmatcap_vert:sS,meshmatcap_frag:rS,meshnormal_vert:oS,meshnormal_frag:aS,meshphong_vert:lS,meshphong_frag:cS,meshphysical_vert:uS,meshphysical_frag:fS,meshtoon_vert:dS,meshtoon_frag:hS,points_vert:pS,points_frag:mS,shadow_vert:gS,shadow_frag:_S,sprite_vert:vS,sprite_frag:xS},Te={common:{diffuse:{value:new nt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Qe},alphaMap:{value:null},alphaMapTransform:{value:new Qe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Qe}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Qe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Qe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Qe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Qe},normalScale:{value:new Xe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Qe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Qe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Qe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Qe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new nt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new nt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Qe},alphaTest:{value:0},uvTransform:{value:new Qe}},sprite:{diffuse:{value:new nt(16777215)},opacity:{value:1},center:{value:new Xe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Qe},alphaMap:{value:null},alphaMapTransform:{value:new Qe},alphaTest:{value:0}}},zn={basic:{uniforms:Kt([Te.common,Te.specularmap,Te.envmap,Te.aomap,Te.lightmap,Te.fog]),vertexShader:Ke.meshbasic_vert,fragmentShader:Ke.meshbasic_frag},lambert:{uniforms:Kt([Te.common,Te.specularmap,Te.envmap,Te.aomap,Te.lightmap,Te.emissivemap,Te.bumpmap,Te.normalmap,Te.displacementmap,Te.fog,Te.lights,{emissive:{value:new nt(0)}}]),vertexShader:Ke.meshlambert_vert,fragmentShader:Ke.meshlambert_frag},phong:{uniforms:Kt([Te.common,Te.specularmap,Te.envmap,Te.aomap,Te.lightmap,Te.emissivemap,Te.bumpmap,Te.normalmap,Te.displacementmap,Te.fog,Te.lights,{emissive:{value:new nt(0)},specular:{value:new nt(1118481)},shininess:{value:30}}]),vertexShader:Ke.meshphong_vert,fragmentShader:Ke.meshphong_frag},standard:{uniforms:Kt([Te.common,Te.envmap,Te.aomap,Te.lightmap,Te.emissivemap,Te.bumpmap,Te.normalmap,Te.displacementmap,Te.roughnessmap,Te.metalnessmap,Te.fog,Te.lights,{emissive:{value:new nt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ke.meshphysical_vert,fragmentShader:Ke.meshphysical_frag},toon:{uniforms:Kt([Te.common,Te.aomap,Te.lightmap,Te.emissivemap,Te.bumpmap,Te.normalmap,Te.displacementmap,Te.gradientmap,Te.fog,Te.lights,{emissive:{value:new nt(0)}}]),vertexShader:Ke.meshtoon_vert,fragmentShader:Ke.meshtoon_frag},matcap:{uniforms:Kt([Te.common,Te.bumpmap,Te.normalmap,Te.displacementmap,Te.fog,{matcap:{value:null}}]),vertexShader:Ke.meshmatcap_vert,fragmentShader:Ke.meshmatcap_frag},points:{uniforms:Kt([Te.points,Te.fog]),vertexShader:Ke.points_vert,fragmentShader:Ke.points_frag},dashed:{uniforms:Kt([Te.common,Te.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ke.linedashed_vert,fragmentShader:Ke.linedashed_frag},depth:{uniforms:Kt([Te.common,Te.displacementmap]),vertexShader:Ke.depth_vert,fragmentShader:Ke.depth_frag},normal:{uniforms:Kt([Te.common,Te.bumpmap,Te.normalmap,Te.displacementmap,{opacity:{value:1}}]),vertexShader:Ke.meshnormal_vert,fragmentShader:Ke.meshnormal_frag},sprite:{uniforms:Kt([Te.sprite,Te.fog]),vertexShader:Ke.sprite_vert,fragmentShader:Ke.sprite_frag},background:{uniforms:{uvTransform:{value:new Qe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ke.background_vert,fragmentShader:Ke.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:Ke.backgroundCube_vert,fragmentShader:Ke.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ke.cube_vert,fragmentShader:Ke.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ke.equirect_vert,fragmentShader:Ke.equirect_frag},distanceRGBA:{uniforms:Kt([Te.common,Te.displacementmap,{referencePosition:{value:new W},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ke.distanceRGBA_vert,fragmentShader:Ke.distanceRGBA_frag},shadow:{uniforms:Kt([Te.lights,Te.fog,{color:{value:new nt(0)},opacity:{value:1}}]),vertexShader:Ke.shadow_vert,fragmentShader:Ke.shadow_frag}};zn.physical={uniforms:Kt([zn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Qe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Qe},clearcoatNormalScale:{value:new Xe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Qe},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Qe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Qe},sheen:{value:0},sheenColor:{value:new nt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Qe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Qe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Qe},transmissionSamplerSize:{value:new Xe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Qe},attenuationDistance:{value:0},attenuationColor:{value:new nt(0)},specularColor:{value:new nt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Qe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Qe},anisotropyVector:{value:new Xe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Qe}}]),vertexShader:Ke.meshphysical_vert,fragmentShader:Ke.meshphysical_frag};const lo={r:0,b:0,g:0};function MS(n,e,t,i,s,r,a){const o=new nt(0);let l=r===!0?0:1,u,c,f=null,d=0,p=null;function x(m,h){let g=!1,S=h.isScene===!0?h.background:null;S&&S.isTexture&&(S=(h.backgroundBlurriness>0?t:e).get(S)),S===null?_(o,l):S&&S.isColor&&(_(S,1),g=!0);const M=n.xr.getEnvironmentBlendMode();M==="additive"?i.buffers.color.setClear(0,0,0,1,a):M==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,a),(n.autoClear||g)&&n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil),S&&(S.isCubeTexture||S.mapping===Zo)?(c===void 0&&(c=new kt(new fi(1,1,1),new rs({name:"BackgroundCubeMaterial",uniforms:Xs(zn.backgroundCube.uniforms),vertexShader:zn.backgroundCube.vertexShader,fragmentShader:zn.backgroundCube.fragmentShader,side:rn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(I,L,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(c)),c.material.uniforms.envMap.value=S,c.material.uniforms.flipEnvMap.value=S.isCubeTexture&&S.isRenderTargetTexture===!1?-1:1,c.material.uniforms.backgroundBlurriness.value=h.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=h.backgroundIntensity,c.material.toneMapped=lt.getTransfer(S.colorSpace)!==pt,(f!==S||d!==S.version||p!==n.toneMapping)&&(c.material.needsUpdate=!0,f=S,d=S.version,p=n.toneMapping),c.layers.enableAll(),m.unshift(c,c.geometry,c.material,0,0,null)):S&&S.isTexture&&(u===void 0&&(u=new kt(new ta(2,2),new rs({name:"BackgroundMaterial",uniforms:Xs(zn.background.uniforms),vertexShader:zn.background.vertexShader,fragmentShader:zn.background.fragmentShader,side:Oi,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),Object.defineProperty(u.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(u)),u.material.uniforms.t2D.value=S,u.material.uniforms.backgroundIntensity.value=h.backgroundIntensity,u.material.toneMapped=lt.getTransfer(S.colorSpace)!==pt,S.matrixAutoUpdate===!0&&S.updateMatrix(),u.material.uniforms.uvTransform.value.copy(S.matrix),(f!==S||d!==S.version||p!==n.toneMapping)&&(u.material.needsUpdate=!0,f=S,d=S.version,p=n.toneMapping),u.layers.enableAll(),m.unshift(u,u.geometry,u.material,0,0,null))}function _(m,h){m.getRGB(lo,kh(n)),i.buffers.color.setClear(lo.r,lo.g,lo.b,h,a)}return{getClearColor:function(){return o},setClearColor:function(m,h=1){o.set(m),l=h,_(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(m){l=m,_(o,l)},render:x}}function SS(n,e,t,i){const s=n.getParameter(n.MAX_VERTEX_ATTRIBS),r=i.isWebGL2?null:e.get("OES_vertex_array_object"),a=i.isWebGL2||r!==null,o={},l=m(null);let u=l,c=!1;function f(U,V,G,$,Z){let ae=!1;if(a){const ce=_($,G,V);u!==ce&&(u=ce,p(u.object)),ae=h(U,$,G,Z),ae&&g(U,$,G,Z)}else{const ce=V.wireframe===!0;(u.geometry!==$.id||u.program!==G.id||u.wireframe!==ce)&&(u.geometry=$.id,u.program=G.id,u.wireframe=ce,ae=!0)}Z!==null&&t.update(Z,n.ELEMENT_ARRAY_BUFFER),(ae||c)&&(c=!1,ie(U,V,G,$),Z!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,t.get(Z).buffer))}function d(){return i.isWebGL2?n.createVertexArray():r.createVertexArrayOES()}function p(U){return i.isWebGL2?n.bindVertexArray(U):r.bindVertexArrayOES(U)}function x(U){return i.isWebGL2?n.deleteVertexArray(U):r.deleteVertexArrayOES(U)}function _(U,V,G){const $=G.wireframe===!0;let Z=o[U.id];Z===void 0&&(Z={},o[U.id]=Z);let ae=Z[V.id];ae===void 0&&(ae={},Z[V.id]=ae);let ce=ae[$];return ce===void 0&&(ce=m(d()),ae[$]=ce),ce}function m(U){const V=[],G=[],$=[];for(let Z=0;Z<s;Z++)V[Z]=0,G[Z]=0,$[Z]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:V,enabledAttributes:G,attributeDivisors:$,object:U,attributes:{},index:null}}function h(U,V,G,$){const Z=u.attributes,ae=V.attributes;let ce=0;const de=G.getAttributes();for(const he in de)if(de[he].location>=0){const Y=Z[he];let ge=ae[he];if(ge===void 0&&(he==="instanceMatrix"&&U.instanceMatrix&&(ge=U.instanceMatrix),he==="instanceColor"&&U.instanceColor&&(ge=U.instanceColor)),Y===void 0||Y.attribute!==ge||ge&&Y.data!==ge.data)return!0;ce++}return u.attributesNum!==ce||u.index!==$}function g(U,V,G,$){const Z={},ae=V.attributes;let ce=0;const de=G.getAttributes();for(const he in de)if(de[he].location>=0){let Y=ae[he];Y===void 0&&(he==="instanceMatrix"&&U.instanceMatrix&&(Y=U.instanceMatrix),he==="instanceColor"&&U.instanceColor&&(Y=U.instanceColor));const ge={};ge.attribute=Y,Y&&Y.data&&(ge.data=Y.data),Z[he]=ge,ce++}u.attributes=Z,u.attributesNum=ce,u.index=$}function S(){const U=u.newAttributes;for(let V=0,G=U.length;V<G;V++)U[V]=0}function M(U){I(U,0)}function I(U,V){const G=u.newAttributes,$=u.enabledAttributes,Z=u.attributeDivisors;G[U]=1,$[U]===0&&(n.enableVertexAttribArray(U),$[U]=1),Z[U]!==V&&((i.isWebGL2?n:e.get("ANGLE_instanced_arrays"))[i.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](U,V),Z[U]=V)}function L(){const U=u.newAttributes,V=u.enabledAttributes;for(let G=0,$=V.length;G<$;G++)V[G]!==U[G]&&(n.disableVertexAttribArray(G),V[G]=0)}function C(U,V,G,$,Z,ae,ce){ce===!0?n.vertexAttribIPointer(U,V,G,Z,ae):n.vertexAttribPointer(U,V,G,$,Z,ae)}function ie(U,V,G,$){if(i.isWebGL2===!1&&(U.isInstancedMesh||$.isInstancedBufferGeometry)&&e.get("ANGLE_instanced_arrays")===null)return;S();const Z=$.attributes,ae=G.getAttributes(),ce=V.defaultAttributeValues;for(const de in ae){const he=ae[de];if(he.location>=0){let ee=Z[de];if(ee===void 0&&(de==="instanceMatrix"&&U.instanceMatrix&&(ee=U.instanceMatrix),de==="instanceColor"&&U.instanceColor&&(ee=U.instanceColor)),ee!==void 0){const Y=ee.normalized,ge=ee.itemSize,ye=t.get(ee);if(ye===void 0)continue;const B=ye.buffer,ue=ye.type,re=ye.bytesPerElement,pe=i.isWebGL2===!0&&(ue===n.INT||ue===n.UNSIGNED_INT||ee.gpuType===Th);if(ee.isInterleavedBufferAttribute){const b=ee.data,y=b.stride,z=ee.offset;if(b.isInstancedInterleavedBuffer){for(let F=0;F<he.locationSize;F++)I(he.location+F,b.meshPerAttribute);U.isInstancedMesh!==!0&&$._maxInstanceCount===void 0&&($._maxInstanceCount=b.meshPerAttribute*b.count)}else for(let F=0;F<he.locationSize;F++)M(he.location+F);n.bindBuffer(n.ARRAY_BUFFER,B);for(let F=0;F<he.locationSize;F++)C(he.location+F,ge/he.locationSize,ue,Y,y*re,(z+ge/he.locationSize*F)*re,pe)}else{if(ee.isInstancedBufferAttribute){for(let b=0;b<he.locationSize;b++)I(he.location+b,ee.meshPerAttribute);U.isInstancedMesh!==!0&&$._maxInstanceCount===void 0&&($._maxInstanceCount=ee.meshPerAttribute*ee.count)}else for(let b=0;b<he.locationSize;b++)M(he.location+b);n.bindBuffer(n.ARRAY_BUFFER,B);for(let b=0;b<he.locationSize;b++)C(he.location+b,ge/he.locationSize,ue,Y,ge*re,ge/he.locationSize*b*re,pe)}}else if(ce!==void 0){const Y=ce[de];if(Y!==void 0)switch(Y.length){case 2:n.vertexAttrib2fv(he.location,Y);break;case 3:n.vertexAttrib3fv(he.location,Y);break;case 4:n.vertexAttrib4fv(he.location,Y);break;default:n.vertexAttrib1fv(he.location,Y)}}}}L()}function A(){k();for(const U in o){const V=o[U];for(const G in V){const $=V[G];for(const Z in $)x($[Z].object),delete $[Z];delete V[G]}delete o[U]}}function T(U){if(o[U.id]===void 0)return;const V=o[U.id];for(const G in V){const $=V[G];for(const Z in $)x($[Z].object),delete $[Z];delete V[G]}delete o[U.id]}function R(U){for(const V in o){const G=o[V];if(G[U.id]===void 0)continue;const $=G[U.id];for(const Z in $)x($[Z].object),delete $[Z];delete G[U.id]}}function k(){J(),c=!0,u!==l&&(u=l,p(u.object))}function J(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:f,reset:k,resetDefaultState:J,dispose:A,releaseStatesOfGeometry:T,releaseStatesOfProgram:R,initAttributes:S,enableAttribute:M,disableUnusedAttributes:L}}function yS(n,e,t,i){const s=i.isWebGL2;let r;function a(c){r=c}function o(c,f){n.drawArrays(r,c,f),t.update(f,r,1)}function l(c,f,d){if(d===0)return;let p,x;if(s)p=n,x="drawArraysInstanced";else if(p=e.get("ANGLE_instanced_arrays"),x="drawArraysInstancedANGLE",p===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}p[x](r,c,f,d),t.update(f,r,d)}function u(c,f,d){if(d===0)return;const p=e.get("WEBGL_multi_draw");if(p===null)for(let x=0;x<d;x++)this.render(c[x],f[x]);else{p.multiDrawArraysWEBGL(r,c,0,f,0,d);let x=0;for(let _=0;_<d;_++)x+=f[_];t.update(x,r,1)}}this.setMode=a,this.render=o,this.renderInstances=l,this.renderMultiDraw=u}function ES(n,e,t){let i;function s(){if(i!==void 0)return i;if(e.has("EXT_texture_filter_anisotropic")===!0){const C=e.get("EXT_texture_filter_anisotropic");i=n.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function r(C){if(C==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}const a=typeof WebGL2RenderingContext<"u"&&n.constructor.name==="WebGL2RenderingContext";let o=t.precision!==void 0?t.precision:"highp";const l=r(o);l!==o&&(console.warn("THREE.WebGLRenderer:",o,"not supported, using",l,"instead."),o=l);const u=a||e.has("WEBGL_draw_buffers"),c=t.logarithmicDepthBuffer===!0,f=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),d=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),p=n.getParameter(n.MAX_TEXTURE_SIZE),x=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),_=n.getParameter(n.MAX_VERTEX_ATTRIBS),m=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),h=n.getParameter(n.MAX_VARYING_VECTORS),g=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),S=d>0,M=a||e.has("OES_texture_float"),I=S&&M,L=a?n.getParameter(n.MAX_SAMPLES):0;return{isWebGL2:a,drawBuffers:u,getMaxAnisotropy:s,getMaxPrecision:r,precision:o,logarithmicDepthBuffer:c,maxTextures:f,maxVertexTextures:d,maxTextureSize:p,maxCubemapSize:x,maxAttributes:_,maxVertexUniforms:m,maxVaryings:h,maxFragmentUniforms:g,vertexTextures:S,floatFragmentTextures:M,floatVertexTextures:I,maxSamples:L}}function bS(n){const e=this;let t=null,i=0,s=!1,r=!1;const a=new Ai,o=new Qe,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,d){const p=f.length!==0||d||i!==0||s;return s=d,i=f.length,p},this.beginShadows=function(){r=!0,c(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(f,d){t=c(f,d,0)},this.setState=function(f,d,p){const x=f.clippingPlanes,_=f.clipIntersection,m=f.clipShadows,h=n.get(f);if(!s||x===null||x.length===0||r&&!m)r?c(null):u();else{const g=r?0:i,S=g*4;let M=h.clippingState||null;l.value=M,M=c(x,d,S,p);for(let I=0;I!==S;++I)M[I]=t[I];h.clippingState=M,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=g}};function u(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function c(f,d,p,x){const _=f!==null?f.length:0;let m=null;if(_!==0){if(m=l.value,x!==!0||m===null){const h=p+_*4,g=d.matrixWorldInverse;o.getNormalMatrix(g),(m===null||m.length<h)&&(m=new Float32Array(h));for(let S=0,M=p;S!==_;++S,M+=4)a.copy(f[S]).applyMatrix4(g,o),a.normal.toArray(m,M),m[M+3]=a.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,m}}function TS(n){let e=new WeakMap;function t(a,o){return o===El?a.mapping=Gs:o===bl&&(a.mapping=ks),a}function i(a){if(a&&a.isTexture){const o=a.mapping;if(o===El||o===bl)if(e.has(a)){const l=e.get(a).texture;return t(l,a.mapping)}else{const l=a.image;if(l&&l.height>0){const u=new Fv(l.height/2);return u.fromEquirectangularTexture(n,a),e.set(a,u),a.addEventListener("dispose",s),t(u.texture,a.mapping)}else return null}}return a}function s(a){const o=a.target;o.removeEventListener("dispose",s);const l=e.get(o);l!==void 0&&(e.delete(o),l.dispose())}function r(){e=new WeakMap}return{get:i,dispose:r}}class qh extends Wh{constructor(e=-1,t=1,i=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=i-e,a=i+e,o=s+t,l=s-t;if(this.view!==null&&this.view.enabled){const u=(this.right-this.left)/this.view.fullWidth/this.zoom,c=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=u*this.view.offsetX,a=r+u*this.view.width,o-=c*this.view.offsetY,l=o-c*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const Ds=4,af=[.125,.215,.35,.446,.526,.582],Ki=20,Ka=new qh,lf=new nt;let $a=null,Za=0,Ja=0;const qi=(1+Math.sqrt(5))/2,Rs=1/qi,cf=[new W(1,1,1),new W(-1,1,1),new W(1,1,-1),new W(-1,1,-1),new W(0,qi,Rs),new W(0,qi,-Rs),new W(Rs,0,qi),new W(-Rs,0,qi),new W(qi,Rs,0),new W(-qi,Rs,0)];class uf{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,s=100){$a=this._renderer.getRenderTarget(),Za=this._renderer.getActiveCubeFace(),Ja=this._renderer.getActiveMipmapLevel(),this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,i,s,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=hf(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=df(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget($a,Za,Ja),e.scissorTest=!1,co(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Gs||e.mapping===ks?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),$a=this._renderer.getRenderTarget(),Za=this._renderer.getActiveCubeFace(),Ja=this._renderer.getActiveMipmapLevel();const i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:mn,minFilter:mn,generateMipmaps:!1,type:wr,format:An,colorSpace:gi,depthBuffer:!1},s=ff(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ff(e,t,i);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=AS(r)),this._blurMaterial=wS(r,e,t)}return s}_compileMaterial(e){const t=new kt(this._lodPlanes[0],e);this._renderer.compile(t,Ka)}_sceneToCubeUV(e,t,i,s){const o=new gn(90,1,t,i),l=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],c=this._renderer,f=c.autoClear,d=c.toneMapping;c.getClearColor(lf),c.toneMapping=Ii,c.autoClear=!1;const p=new tc({name:"PMREM.Background",side:rn,depthWrite:!1,depthTest:!1}),x=new kt(new fi,p);let _=!1;const m=e.background;m?m.isColor&&(p.color.copy(m),e.background=null,_=!0):(p.color.copy(lf),_=!0);for(let h=0;h<6;h++){const g=h%3;g===0?(o.up.set(0,l[h],0),o.lookAt(u[h],0,0)):g===1?(o.up.set(0,0,l[h]),o.lookAt(0,u[h],0)):(o.up.set(0,l[h],0),o.lookAt(0,0,u[h]));const S=this._cubeSize;co(s,g*S,h>2?S:0,S,S),c.setRenderTarget(s),_&&c.render(x,o),c.render(e,o)}x.geometry.dispose(),x.material.dispose(),c.toneMapping=d,c.autoClear=f,e.background=m}_textureToCubeUV(e,t){const i=this._renderer,s=e.mapping===Gs||e.mapping===ks;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=hf()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=df());const r=s?this._cubemapMaterial:this._equirectMaterial,a=new kt(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=e;const l=this._cubeSize;co(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(a,Ka)}_applyPMREM(e){const t=this._renderer,i=t.autoClear;t.autoClear=!1;for(let s=1;s<this._lodPlanes.length;s++){const r=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),a=cf[(s-1)%cf.length];this._blur(e,s-1,s,r,a)}t.autoClear=i}_blur(e,t,i,s,r){const a=this._pingPongRenderTarget;this._halfBlur(e,a,t,i,s,"latitudinal",r),this._halfBlur(a,e,i,i,s,"longitudinal",r)}_halfBlur(e,t,i,s,r,a,o){const l=this._renderer,u=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const c=3,f=new kt(this._lodPlanes[s],u),d=u.uniforms,p=this._sizeLods[i]-1,x=isFinite(r)?Math.PI/(2*p):2*Math.PI/(2*Ki-1),_=r/x,m=isFinite(r)?1+Math.floor(c*_):Ki;m>Ki&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Ki}`);const h=[];let g=0;for(let C=0;C<Ki;++C){const ie=C/_,A=Math.exp(-ie*ie/2);h.push(A),C===0?g+=A:C<m&&(g+=2*A)}for(let C=0;C<h.length;C++)h[C]=h[C]/g;d.envMap.value=e.texture,d.samples.value=m,d.weights.value=h,d.latitudinal.value=a==="latitudinal",o&&(d.poleAxis.value=o);const{_lodMax:S}=this;d.dTheta.value=x,d.mipInt.value=S-i;const M=this._sizeLods[s],I=3*M*(s>S-Ds?s-S+Ds:0),L=4*(this._cubeSize-M);co(t,I,L,3*M,2*M),l.setRenderTarget(t),l.render(f,Ka)}}function AS(n){const e=[],t=[],i=[];let s=n;const r=n-Ds+1+af.length;for(let a=0;a<r;a++){const o=Math.pow(2,s);t.push(o);let l=1/o;a>n-Ds?l=af[a-n+Ds-1]:a===0&&(l=0),i.push(l);const u=1/(o-2),c=-u,f=1+u,d=[c,c,f,c,f,f,c,c,f,f,c,f],p=6,x=6,_=3,m=2,h=1,g=new Float32Array(_*x*p),S=new Float32Array(m*x*p),M=new Float32Array(h*x*p);for(let L=0;L<p;L++){const C=L%3*2/3-1,ie=L>2?0:-1,A=[C,ie,0,C+2/3,ie,0,C+2/3,ie+1,0,C,ie,0,C+2/3,ie+1,0,C,ie+1,0];g.set(A,_*x*L),S.set(d,m*x*L);const T=[L,L,L,L,L,L];M.set(T,h*x*L)}const I=new Dn;I.setAttribute("position",new Xn(g,_)),I.setAttribute("uv",new Xn(S,m)),I.setAttribute("faceIndex",new Xn(M,h)),e.push(I),s>Ds&&s--}return{lodPlanes:e,sizeLods:t,sigmas:i}}function ff(n,e,t){const i=new is(n,e,t);return i.texture.mapping=Zo,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function co(n,e,t,i,s){n.viewport.set(e,t,i,s),n.scissor.set(e,t,i,s)}function wS(n,e,t){const i=new Float32Array(Ki),s=new W(0,1,0);return new rs({name:"SphericalGaussianBlur",defines:{n:Ki,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:ic(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Di,depthTest:!1,depthWrite:!1})}function df(){return new rs({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:ic(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Di,depthTest:!1,depthWrite:!1})}function hf(){return new rs({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:ic(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Di,depthTest:!1,depthWrite:!1})}function ic(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function RS(n){let e=new WeakMap,t=null;function i(o){if(o&&o.isTexture){const l=o.mapping,u=l===El||l===bl,c=l===Gs||l===ks;if(u||c)if(o.isRenderTargetTexture&&o.needsPMREMUpdate===!0){o.needsPMREMUpdate=!1;let f=e.get(o);return t===null&&(t=new uf(n)),f=u?t.fromEquirectangular(o,f):t.fromCubemap(o,f),e.set(o,f),f.texture}else{if(e.has(o))return e.get(o).texture;{const f=o.image;if(u&&f&&f.height>0||c&&f&&s(f)){t===null&&(t=new uf(n));const d=u?t.fromEquirectangular(o):t.fromCubemap(o);return e.set(o,d),o.addEventListener("dispose",r),d.texture}else return null}}}return o}function s(o){let l=0;const u=6;for(let c=0;c<u;c++)o[c]!==void 0&&l++;return l===u}function r(o){const l=o.target;l.removeEventListener("dispose",r);const u=e.get(l);u!==void 0&&(e.delete(l),u.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:a}}function CS(n){const e={};function t(i){if(e[i]!==void 0)return e[i];let s;switch(i){case"WEBGL_depth_texture":s=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=n.getExtension(i)}return e[i]=s,s}return{has:function(i){return t(i)!==null},init:function(i){i.isWebGL2?(t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance")):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(i){const s=t(i);return s===null&&console.warn("THREE.WebGLRenderer: "+i+" extension not supported."),s}}}function PS(n,e,t,i){const s={},r=new WeakMap;function a(f){const d=f.target;d.index!==null&&e.remove(d.index);for(const x in d.attributes)e.remove(d.attributes[x]);for(const x in d.morphAttributes){const _=d.morphAttributes[x];for(let m=0,h=_.length;m<h;m++)e.remove(_[m])}d.removeEventListener("dispose",a),delete s[d.id];const p=r.get(d);p&&(e.remove(p),r.delete(d)),i.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(f,d){return s[d.id]===!0||(d.addEventListener("dispose",a),s[d.id]=!0,t.memory.geometries++),d}function l(f){const d=f.attributes;for(const x in d)e.update(d[x],n.ARRAY_BUFFER);const p=f.morphAttributes;for(const x in p){const _=p[x];for(let m=0,h=_.length;m<h;m++)e.update(_[m],n.ARRAY_BUFFER)}}function u(f){const d=[],p=f.index,x=f.attributes.position;let _=0;if(p!==null){const g=p.array;_=p.version;for(let S=0,M=g.length;S<M;S+=3){const I=g[S+0],L=g[S+1],C=g[S+2];d.push(I,L,L,C,C,I)}}else if(x!==void 0){const g=x.array;_=x.version;for(let S=0,M=g.length/3-1;S<M;S+=3){const I=S+0,L=S+1,C=S+2;d.push(I,L,L,C,C,I)}}else return;const m=new(Nh(d)?Gh:Vh)(d,1);m.version=_;const h=r.get(f);h&&e.remove(h),r.set(f,m)}function c(f){const d=r.get(f);if(d){const p=f.index;p!==null&&d.version<p.version&&u(f)}else u(f);return r.get(f)}return{get:o,update:l,getWireframeAttribute:c}}function LS(n,e,t,i){const s=i.isWebGL2;let r;function a(p){r=p}let o,l;function u(p){o=p.type,l=p.bytesPerElement}function c(p,x){n.drawElements(r,x,o,p*l),t.update(x,r,1)}function f(p,x,_){if(_===0)return;let m,h;if(s)m=n,h="drawElementsInstanced";else if(m=e.get("ANGLE_instanced_arrays"),h="drawElementsInstancedANGLE",m===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}m[h](r,x,o,p*l,_),t.update(x,r,_)}function d(p,x,_){if(_===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let h=0;h<_;h++)this.render(p[h]/l,x[h]);else{m.multiDrawElementsWEBGL(r,x,0,o,p,0,_);let h=0;for(let g=0;g<_;g++)h+=x[g];t.update(h,r,1)}}this.setMode=a,this.setIndex=u,this.render=c,this.renderInstances=f,this.renderMultiDraw=d}function DS(n){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,a,o){switch(t.calls++,a){case n.TRIANGLES:t.triangles+=o*(r/3);break;case n.LINES:t.lines+=o*(r/2);break;case n.LINE_STRIP:t.lines+=o*(r-1);break;case n.LINE_LOOP:t.lines+=o*r;break;case n.POINTS:t.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:i}}function IS(n,e){return n[0]-e[0]}function US(n,e){return Math.abs(e[1])-Math.abs(n[1])}function NS(n,e,t){const i={},s=new Float32Array(8),r=new WeakMap,a=new Ot,o=[];for(let u=0;u<8;u++)o[u]=[u,0];function l(u,c,f){const d=u.morphTargetInfluences;if(e.isWebGL2===!0){const x=c.morphAttributes.position||c.morphAttributes.normal||c.morphAttributes.color,_=x!==void 0?x.length:0;let m=r.get(c);if(m===void 0||m.count!==_){let V=function(){J.dispose(),r.delete(c),c.removeEventListener("dispose",V)};var p=V;m!==void 0&&m.texture.dispose();const S=c.morphAttributes.position!==void 0,M=c.morphAttributes.normal!==void 0,I=c.morphAttributes.color!==void 0,L=c.morphAttributes.position||[],C=c.morphAttributes.normal||[],ie=c.morphAttributes.color||[];let A=0;S===!0&&(A=1),M===!0&&(A=2),I===!0&&(A=3);let T=c.attributes.position.count*A,R=1;T>e.maxTextureSize&&(R=Math.ceil(T/e.maxTextureSize),T=e.maxTextureSize);const k=new Float32Array(T*R*4*_),J=new Bh(k,T,R,_);J.type=Ci,J.needsUpdate=!0;const U=A*4;for(let G=0;G<_;G++){const $=L[G],Z=C[G],ae=ie[G],ce=T*R*4*G;for(let de=0;de<$.count;de++){const he=de*U;S===!0&&(a.fromBufferAttribute($,de),k[ce+he+0]=a.x,k[ce+he+1]=a.y,k[ce+he+2]=a.z,k[ce+he+3]=0),M===!0&&(a.fromBufferAttribute(Z,de),k[ce+he+4]=a.x,k[ce+he+5]=a.y,k[ce+he+6]=a.z,k[ce+he+7]=0),I===!0&&(a.fromBufferAttribute(ae,de),k[ce+he+8]=a.x,k[ce+he+9]=a.y,k[ce+he+10]=a.z,k[ce+he+11]=ae.itemSize===4?a.w:1)}}m={count:_,texture:J,size:new Xe(T,R)},r.set(c,m),c.addEventListener("dispose",V)}let h=0;for(let S=0;S<d.length;S++)h+=d[S];const g=c.morphTargetsRelative?1:1-h;f.getUniforms().setValue(n,"morphTargetBaseInfluence",g),f.getUniforms().setValue(n,"morphTargetInfluences",d),f.getUniforms().setValue(n,"morphTargetsTexture",m.texture,t),f.getUniforms().setValue(n,"morphTargetsTextureSize",m.size)}else{const x=d===void 0?0:d.length;let _=i[c.id];if(_===void 0||_.length!==x){_=[];for(let M=0;M<x;M++)_[M]=[M,0];i[c.id]=_}for(let M=0;M<x;M++){const I=_[M];I[0]=M,I[1]=d[M]}_.sort(US);for(let M=0;M<8;M++)M<x&&_[M][1]?(o[M][0]=_[M][0],o[M][1]=_[M][1]):(o[M][0]=Number.MAX_SAFE_INTEGER,o[M][1]=0);o.sort(IS);const m=c.morphAttributes.position,h=c.morphAttributes.normal;let g=0;for(let M=0;M<8;M++){const I=o[M],L=I[0],C=I[1];L!==Number.MAX_SAFE_INTEGER&&C?(m&&c.getAttribute("morphTarget"+M)!==m[L]&&c.setAttribute("morphTarget"+M,m[L]),h&&c.getAttribute("morphNormal"+M)!==h[L]&&c.setAttribute("morphNormal"+M,h[L]),s[M]=C,g+=C):(m&&c.hasAttribute("morphTarget"+M)===!0&&c.deleteAttribute("morphTarget"+M),h&&c.hasAttribute("morphNormal"+M)===!0&&c.deleteAttribute("morphNormal"+M),s[M]=0)}const S=c.morphTargetsRelative?1:1-g;f.getUniforms().setValue(n,"morphTargetBaseInfluence",S),f.getUniforms().setValue(n,"morphTargetInfluences",s)}}return{update:l}}function OS(n,e,t,i){let s=new WeakMap;function r(l){const u=i.render.frame,c=l.geometry,f=e.get(l,c);if(s.get(f)!==u&&(e.update(f),s.set(f,u)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),s.get(l)!==u&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),s.set(l,u))),l.isSkinnedMesh){const d=l.skeleton;s.get(d)!==u&&(d.update(),s.set(d,u))}return f}function a(){s=new WeakMap}function o(l){const u=l.target;u.removeEventListener("dispose",o),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:r,dispose:a}}class Yh extends dn{constructor(e,t,i,s,r,a,o,l,u,c){if(c=c!==void 0?c:ts,c!==ts&&c!==Ws)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&c===ts&&(i=Ri),i===void 0&&c===Ws&&(i=es),super(null,s,r,a,o,l,c,i,u),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:Zt,this.minFilter=l!==void 0?l:Zt,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const Kh=new dn,$h=new Yh(1,1);$h.compareFunction=Uh;const Zh=new Bh,Jh=new Mv,Qh=new Xh,pf=[],mf=[],gf=new Float32Array(16),_f=new Float32Array(9),vf=new Float32Array(4);function qs(n,e,t){const i=n[0];if(i<=0||i>0)return n;const s=e*t;let r=pf[s];if(r===void 0&&(r=new Float32Array(s),pf[s]=r),e!==0){i.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,n[a].toArray(r,o)}return r}function Dt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function It(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function na(n,e){let t=mf[e];t===void 0&&(t=new Int32Array(e),mf[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function FS(n,e){const t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function BS(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Dt(t,e))return;n.uniform2fv(this.addr,e),It(t,e)}}function zS(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Dt(t,e))return;n.uniform3fv(this.addr,e),It(t,e)}}function HS(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Dt(t,e))return;n.uniform4fv(this.addr,e),It(t,e)}}function VS(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Dt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),It(t,e)}else{if(Dt(t,i))return;vf.set(i),n.uniformMatrix2fv(this.addr,!1,vf),It(t,i)}}function GS(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Dt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),It(t,e)}else{if(Dt(t,i))return;_f.set(i),n.uniformMatrix3fv(this.addr,!1,_f),It(t,i)}}function kS(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Dt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),It(t,e)}else{if(Dt(t,i))return;gf.set(i),n.uniformMatrix4fv(this.addr,!1,gf),It(t,i)}}function WS(n,e){const t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function XS(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Dt(t,e))return;n.uniform2iv(this.addr,e),It(t,e)}}function jS(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Dt(t,e))return;n.uniform3iv(this.addr,e),It(t,e)}}function qS(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Dt(t,e))return;n.uniform4iv(this.addr,e),It(t,e)}}function YS(n,e){const t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function KS(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Dt(t,e))return;n.uniform2uiv(this.addr,e),It(t,e)}}function $S(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Dt(t,e))return;n.uniform3uiv(this.addr,e),It(t,e)}}function ZS(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Dt(t,e))return;n.uniform4uiv(this.addr,e),It(t,e)}}function JS(n,e,t){const i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s);const r=this.type===n.SAMPLER_2D_SHADOW?$h:Kh;t.setTexture2D(e||r,s)}function QS(n,e,t){const i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture3D(e||Jh,s)}function ey(n,e,t){const i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTextureCube(e||Qh,s)}function ty(n,e,t){const i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture2DArray(e||Zh,s)}function ny(n){switch(n){case 5126:return FS;case 35664:return BS;case 35665:return zS;case 35666:return HS;case 35674:return VS;case 35675:return GS;case 35676:return kS;case 5124:case 35670:return WS;case 35667:case 35671:return XS;case 35668:case 35672:return jS;case 35669:case 35673:return qS;case 5125:return YS;case 36294:return KS;case 36295:return $S;case 36296:return ZS;case 35678:case 36198:case 36298:case 36306:case 35682:return JS;case 35679:case 36299:case 36307:return QS;case 35680:case 36300:case 36308:case 36293:return ey;case 36289:case 36303:case 36311:case 36292:return ty}}function iy(n,e){n.uniform1fv(this.addr,e)}function sy(n,e){const t=qs(e,this.size,2);n.uniform2fv(this.addr,t)}function ry(n,e){const t=qs(e,this.size,3);n.uniform3fv(this.addr,t)}function oy(n,e){const t=qs(e,this.size,4);n.uniform4fv(this.addr,t)}function ay(n,e){const t=qs(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function ly(n,e){const t=qs(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function cy(n,e){const t=qs(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function uy(n,e){n.uniform1iv(this.addr,e)}function fy(n,e){n.uniform2iv(this.addr,e)}function dy(n,e){n.uniform3iv(this.addr,e)}function hy(n,e){n.uniform4iv(this.addr,e)}function py(n,e){n.uniform1uiv(this.addr,e)}function my(n,e){n.uniform2uiv(this.addr,e)}function gy(n,e){n.uniform3uiv(this.addr,e)}function _y(n,e){n.uniform4uiv(this.addr,e)}function vy(n,e,t){const i=this.cache,s=e.length,r=na(t,s);Dt(i,r)||(n.uniform1iv(this.addr,r),It(i,r));for(let a=0;a!==s;++a)t.setTexture2D(e[a]||Kh,r[a])}function xy(n,e,t){const i=this.cache,s=e.length,r=na(t,s);Dt(i,r)||(n.uniform1iv(this.addr,r),It(i,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||Jh,r[a])}function My(n,e,t){const i=this.cache,s=e.length,r=na(t,s);Dt(i,r)||(n.uniform1iv(this.addr,r),It(i,r));for(let a=0;a!==s;++a)t.setTextureCube(e[a]||Qh,r[a])}function Sy(n,e,t){const i=this.cache,s=e.length,r=na(t,s);Dt(i,r)||(n.uniform1iv(this.addr,r),It(i,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||Zh,r[a])}function yy(n){switch(n){case 5126:return iy;case 35664:return sy;case 35665:return ry;case 35666:return oy;case 35674:return ay;case 35675:return ly;case 35676:return cy;case 5124:case 35670:return uy;case 35667:case 35671:return fy;case 35668:case 35672:return dy;case 35669:case 35673:return hy;case 5125:return py;case 36294:return my;case 36295:return gy;case 36296:return _y;case 35678:case 36198:case 36298:case 36306:case 35682:return vy;case 35679:case 36299:case 36307:return xy;case 35680:case 36300:case 36308:case 36293:return My;case 36289:case 36303:case 36311:case 36292:return Sy}}class Ey{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=ny(t.type)}}class by{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=yy(t.type)}}class Ty{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){const s=this.seq;for(let r=0,a=s.length;r!==a;++r){const o=s[r];o.setValue(e,t[o.id],i)}}}const Qa=/(\w+)(\])?(\[|\.)?/g;function xf(n,e){n.seq.push(e),n.map[e.id]=e}function Ay(n,e,t){const i=n.name,s=i.length;for(Qa.lastIndex=0;;){const r=Qa.exec(i),a=Qa.lastIndex;let o=r[1];const l=r[2]==="]",u=r[3];if(l&&(o=o|0),u===void 0||u==="["&&a+2===s){xf(t,u===void 0?new Ey(o,n,e):new by(o,n,e));break}else{let f=t.map[o];f===void 0&&(f=new Ty(o),xf(t,f)),t=f}}}class vo{constructor(e,t){this.seq=[],this.map={};const i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<i;++s){const r=e.getActiveUniform(t,s),a=e.getUniformLocation(t,r.name);Ay(r,a,this)}}setValue(e,t,i,s){const r=this.map[t];r!==void 0&&r.setValue(e,i,s)}setOptional(e,t,i){const s=t[i];s!==void 0&&this.setValue(e,i,s)}static upload(e,t,i,s){for(let r=0,a=t.length;r!==a;++r){const o=t[r],l=i[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,s)}}static seqWithValue(e,t){const i=[];for(let s=0,r=e.length;s!==r;++s){const a=e[s];a.id in t&&i.push(a)}return i}}function Mf(n,e,t){const i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}const wy=37297;let Ry=0;function Cy(n,e){const t=n.split(`
`),i=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){const o=a+1;i.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return i.join(`
`)}function Py(n){const e=lt.getPrimaries(lt.workingColorSpace),t=lt.getPrimaries(n);let i;switch(e===t?i="":e===Io&&t===Do?i="LinearDisplayP3ToLinearSRGB":e===Do&&t===Io&&(i="LinearSRGBToLinearDisplayP3"),n){case gi:case Jo:return[i,"LinearTransferOETF"];case zt:case Ql:return[i,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",n),[i,"LinearTransferOETF"]}}function Sf(n,e,t){const i=n.getShaderParameter(e,n.COMPILE_STATUS),s=n.getShaderInfoLog(e).trim();if(i&&s==="")return"";const r=/ERROR: 0:(\d+)/.exec(s);if(r){const a=parseInt(r[1]);return t.toUpperCase()+`

`+s+`

`+Cy(n.getShaderSource(e),a)}else return s}function Ly(n,e){const t=Py(e);return`vec4 ${n}( vec4 value ) { return ${t[0]}( ${t[1]}( value ) ); }`}function Dy(n,e){let t;switch(e){case G0:t="Linear";break;case k0:t="Reinhard";break;case W0:t="OptimizedCineon";break;case X0:t="ACESFilmic";break;case q0:t="AgX";break;case j0:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function Iy(n){return[n.extensionDerivatives||n.envMapCubeUVHeight||n.bumpMap||n.normalMapTangentSpace||n.clearcoatNormalMap||n.flatShading||n.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(n.extensionFragDepth||n.logarithmicDepthBuffer)&&n.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",n.extensionDrawBuffers&&n.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(n.extensionShaderTextureLOD||n.envMap||n.transmission)&&n.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(Is).join(`
`)}function Uy(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter(Is).join(`
`)}function Ny(n){const e=[];for(const t in n){const i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function Oy(n,e){const t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){const r=n.getActiveAttrib(e,s),a=r.name;let o=1;r.type===n.FLOAT_MAT2&&(o=2),r.type===n.FLOAT_MAT3&&(o=3),r.type===n.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:n.getAttribLocation(e,a),locationSize:o}}return t}function Is(n){return n!==""}function yf(n,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Ef(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const Fy=/^[ \t]*#include +<([\w\d./]+)>/gm;function Pl(n){return n.replace(Fy,zy)}const By=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);function zy(n,e){let t=Ke[e];if(t===void 0){const i=By.get(e);if(i!==void 0)t=Ke[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Pl(t)}const Hy=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function bf(n){return n.replace(Hy,Vy)}function Vy(n,e,t,i){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Tf(n){let e="precision "+n.precision+` float;
precision `+n.precision+" int;";return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Gy(n){let e="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===yh?e="SHADOWMAP_TYPE_PCF":n.shadowMapType===g0?e="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===si&&(e="SHADOWMAP_TYPE_VSM"),e}function ky(n){let e="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case Gs:case ks:e="ENVMAP_TYPE_CUBE";break;case Zo:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Wy(n){let e="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case ks:e="ENVMAP_MODE_REFRACTION";break}return e}function Xy(n){let e="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case Eh:e="ENVMAP_BLENDING_MULTIPLY";break;case H0:e="ENVMAP_BLENDING_MIX";break;case V0:e="ENVMAP_BLENDING_ADD";break}return e}function jy(n){const e=n.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:i,maxMip:t}}function qy(n,e,t,i){const s=n.getContext(),r=t.defines;let a=t.vertexShader,o=t.fragmentShader;const l=Gy(t),u=ky(t),c=Wy(t),f=Xy(t),d=jy(t),p=t.isWebGL2?"":Iy(t),x=Uy(t),_=Ny(r),m=s.createProgram();let h,g,S=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(h=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(Is).join(`
`),h.length>0&&(h+=`
`),g=[p,"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(Is).join(`
`),g.length>0&&(g+=`
`)):(h=[Tf(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Is).join(`
`),g=[p,Tf(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.envMap?"#define "+c:"",t.envMap?"#define "+f:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Ii?"#define TONE_MAPPING":"",t.toneMapping!==Ii?Ke.tonemapping_pars_fragment:"",t.toneMapping!==Ii?Dy("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ke.colorspace_pars_fragment,Ly("linearToOutputTexel",t.outputColorSpace),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Is).join(`
`)),a=Pl(a),a=yf(a,t),a=Ef(a,t),o=Pl(o),o=yf(o,t),o=Ef(o,t),a=bf(a),o=bf(o),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(S=`#version 300 es
`,h=[x,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+h,g=["precision mediump sampler2DArray;","#define varying in",t.glslVersion===Gu?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Gu?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+g);const M=S+h+a,I=S+g+o,L=Mf(s,s.VERTEX_SHADER,M),C=Mf(s,s.FRAGMENT_SHADER,I);s.attachShader(m,L),s.attachShader(m,C),t.index0AttributeName!==void 0?s.bindAttribLocation(m,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(m,0,"position"),s.linkProgram(m);function ie(k){if(n.debug.checkShaderErrors){const J=s.getProgramInfoLog(m).trim(),U=s.getShaderInfoLog(L).trim(),V=s.getShaderInfoLog(C).trim();let G=!0,$=!0;if(s.getProgramParameter(m,s.LINK_STATUS)===!1)if(G=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(s,m,L,C);else{const Z=Sf(s,L,"vertex"),ae=Sf(s,C,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(m,s.VALIDATE_STATUS)+`

Program Info Log: `+J+`
`+Z+`
`+ae)}else J!==""?console.warn("THREE.WebGLProgram: Program Info Log:",J):(U===""||V==="")&&($=!1);$&&(k.diagnostics={runnable:G,programLog:J,vertexShader:{log:U,prefix:h},fragmentShader:{log:V,prefix:g}})}s.deleteShader(L),s.deleteShader(C),A=new vo(s,m),T=Oy(s,m)}let A;this.getUniforms=function(){return A===void 0&&ie(this),A};let T;this.getAttributes=function(){return T===void 0&&ie(this),T};let R=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return R===!1&&(R=s.getProgramParameter(m,wy)),R},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(m),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Ry++,this.cacheKey=e,this.usedTimes=1,this.program=m,this.vertexShader=L,this.fragmentShader=C,this}let Yy=0;class Ky{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,i=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(i),a=this._getShaderCacheForMaterial(e);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){const t=this.shaderCache;let i=t.get(e);return i===void 0&&(i=new $y(e),t.set(e,i)),i}}class $y{constructor(e){this.id=Yy++,this.code=e,this.usedTimes=0}}function Zy(n,e,t,i,s,r,a){const o=new zh,l=new Ky,u=[],c=s.isWebGL2,f=s.logarithmicDepthBuffer,d=s.vertexTextures;let p=s.precision;const x={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(A){return A===0?"uv":`uv${A}`}function m(A,T,R,k,J){const U=k.fog,V=J.geometry,G=A.isMeshStandardMaterial?k.environment:null,$=(A.isMeshStandardMaterial?t:e).get(A.envMap||G),Z=$&&$.mapping===Zo?$.image.height:null,ae=x[A.type];A.precision!==null&&(p=s.getMaxPrecision(A.precision),p!==A.precision&&console.warn("THREE.WebGLProgram.getParameters:",A.precision,"not supported, using",p,"instead."));const ce=V.morphAttributes.position||V.morphAttributes.normal||V.morphAttributes.color,de=ce!==void 0?ce.length:0;let he=0;V.morphAttributes.position!==void 0&&(he=1),V.morphAttributes.normal!==void 0&&(he=2),V.morphAttributes.color!==void 0&&(he=3);let ee,Y,ge,ye;if(ae){const yt=zn[ae];ee=yt.vertexShader,Y=yt.fragmentShader}else ee=A.vertexShader,Y=A.fragmentShader,l.update(A),ge=l.getVertexShaderID(A),ye=l.getFragmentShaderID(A);const B=n.getRenderTarget(),ue=J.isInstancedMesh===!0,re=J.isBatchedMesh===!0,pe=!!A.map,b=!!A.matcap,y=!!$,z=!!A.aoMap,F=!!A.lightMap,H=!!A.bumpMap,X=!!A.normalMap,le=!!A.displacementMap,oe=!!A.emissiveMap,E=!!A.metalnessMap,v=!!A.roughnessMap,O=A.anisotropy>0,j=A.clearcoat>0,K=A.iridescence>0,te=A.sheen>0,Me=A.transmission>0,me=O&&!!A.anisotropyMap,ve=j&&!!A.clearcoatMap,we=j&&!!A.clearcoatNormalMap,Le=j&&!!A.clearcoatRoughnessMap,fe=K&&!!A.iridescenceMap,je=K&&!!A.iridescenceThicknessMap,ze=te&&!!A.sheenColorMap,He=te&&!!A.sheenRoughnessMap,Re=!!A.specularMap,be=!!A.specularColorMap,D=!!A.specularIntensityMap,Se=Me&&!!A.transmissionMap,De=Me&&!!A.thicknessMap,Pe=!!A.gradientMap,_e=!!A.alphaMap,N=A.alphaTest>0,Ee=!!A.alphaHash,Ae=!!A.extensions,Ve=!!V.attributes.uv1,Fe=!!V.attributes.uv2,et=!!V.attributes.uv3;let tt=Ii;return A.toneMapped&&(B===null||B.isXRRenderTarget===!0)&&(tt=n.toneMapping),{isWebGL2:c,shaderID:ae,shaderType:A.type,shaderName:A.name,vertexShader:ee,fragmentShader:Y,defines:A.defines,customVertexShaderID:ge,customFragmentShaderID:ye,isRawShaderMaterial:A.isRawShaderMaterial===!0,glslVersion:A.glslVersion,precision:p,batching:re,instancing:ue,instancingColor:ue&&J.instanceColor!==null,supportsVertexTextures:d,outputColorSpace:B===null?n.outputColorSpace:B.isXRRenderTarget===!0?B.texture.colorSpace:gi,map:pe,matcap:b,envMap:y,envMapMode:y&&$.mapping,envMapCubeUVHeight:Z,aoMap:z,lightMap:F,bumpMap:H,normalMap:X,displacementMap:d&&le,emissiveMap:oe,normalMapObjectSpace:X&&A.normalMapType===rv,normalMapTangentSpace:X&&A.normalMapType===Ih,metalnessMap:E,roughnessMap:v,anisotropy:O,anisotropyMap:me,clearcoat:j,clearcoatMap:ve,clearcoatNormalMap:we,clearcoatRoughnessMap:Le,iridescence:K,iridescenceMap:fe,iridescenceThicknessMap:je,sheen:te,sheenColorMap:ze,sheenRoughnessMap:He,specularMap:Re,specularColorMap:be,specularIntensityMap:D,transmission:Me,transmissionMap:Se,thicknessMap:De,gradientMap:Pe,opaque:A.transparent===!1&&A.blending===Os,alphaMap:_e,alphaTest:N,alphaHash:Ee,combine:A.combine,mapUv:pe&&_(A.map.channel),aoMapUv:z&&_(A.aoMap.channel),lightMapUv:F&&_(A.lightMap.channel),bumpMapUv:H&&_(A.bumpMap.channel),normalMapUv:X&&_(A.normalMap.channel),displacementMapUv:le&&_(A.displacementMap.channel),emissiveMapUv:oe&&_(A.emissiveMap.channel),metalnessMapUv:E&&_(A.metalnessMap.channel),roughnessMapUv:v&&_(A.roughnessMap.channel),anisotropyMapUv:me&&_(A.anisotropyMap.channel),clearcoatMapUv:ve&&_(A.clearcoatMap.channel),clearcoatNormalMapUv:we&&_(A.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Le&&_(A.clearcoatRoughnessMap.channel),iridescenceMapUv:fe&&_(A.iridescenceMap.channel),iridescenceThicknessMapUv:je&&_(A.iridescenceThicknessMap.channel),sheenColorMapUv:ze&&_(A.sheenColorMap.channel),sheenRoughnessMapUv:He&&_(A.sheenRoughnessMap.channel),specularMapUv:Re&&_(A.specularMap.channel),specularColorMapUv:be&&_(A.specularColorMap.channel),specularIntensityMapUv:D&&_(A.specularIntensityMap.channel),transmissionMapUv:Se&&_(A.transmissionMap.channel),thicknessMapUv:De&&_(A.thicknessMap.channel),alphaMapUv:_e&&_(A.alphaMap.channel),vertexTangents:!!V.attributes.tangent&&(X||O),vertexColors:A.vertexColors,vertexAlphas:A.vertexColors===!0&&!!V.attributes.color&&V.attributes.color.itemSize===4,vertexUv1s:Ve,vertexUv2s:Fe,vertexUv3s:et,pointsUvs:J.isPoints===!0&&!!V.attributes.uv&&(pe||_e),fog:!!U,useFog:A.fog===!0,fogExp2:U&&U.isFogExp2,flatShading:A.flatShading===!0,sizeAttenuation:A.sizeAttenuation===!0,logarithmicDepthBuffer:f,skinning:J.isSkinnedMesh===!0,morphTargets:V.morphAttributes.position!==void 0,morphNormals:V.morphAttributes.normal!==void 0,morphColors:V.morphAttributes.color!==void 0,morphTargetsCount:de,morphTextureStride:he,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:A.dithering,shadowMapEnabled:n.shadowMap.enabled&&R.length>0,shadowMapType:n.shadowMap.type,toneMapping:tt,useLegacyLights:n._useLegacyLights,decodeVideoTexture:pe&&A.map.isVideoTexture===!0&&lt.getTransfer(A.map.colorSpace)===pt,premultipliedAlpha:A.premultipliedAlpha,doubleSided:A.side===ci,flipSided:A.side===rn,useDepthPacking:A.depthPacking>=0,depthPacking:A.depthPacking||0,index0AttributeName:A.index0AttributeName,extensionDerivatives:Ae&&A.extensions.derivatives===!0,extensionFragDepth:Ae&&A.extensions.fragDepth===!0,extensionDrawBuffers:Ae&&A.extensions.drawBuffers===!0,extensionShaderTextureLOD:Ae&&A.extensions.shaderTextureLOD===!0,extensionClipCullDistance:Ae&&A.extensions.clipCullDistance&&i.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:c||i.has("EXT_frag_depth"),rendererExtensionDrawBuffers:c||i.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:c||i.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:A.customProgramCacheKey()}}function h(A){const T=[];if(A.shaderID?T.push(A.shaderID):(T.push(A.customVertexShaderID),T.push(A.customFragmentShaderID)),A.defines!==void 0)for(const R in A.defines)T.push(R),T.push(A.defines[R]);return A.isRawShaderMaterial===!1&&(g(T,A),S(T,A),T.push(n.outputColorSpace)),T.push(A.customProgramCacheKey),T.join()}function g(A,T){A.push(T.precision),A.push(T.outputColorSpace),A.push(T.envMapMode),A.push(T.envMapCubeUVHeight),A.push(T.mapUv),A.push(T.alphaMapUv),A.push(T.lightMapUv),A.push(T.aoMapUv),A.push(T.bumpMapUv),A.push(T.normalMapUv),A.push(T.displacementMapUv),A.push(T.emissiveMapUv),A.push(T.metalnessMapUv),A.push(T.roughnessMapUv),A.push(T.anisotropyMapUv),A.push(T.clearcoatMapUv),A.push(T.clearcoatNormalMapUv),A.push(T.clearcoatRoughnessMapUv),A.push(T.iridescenceMapUv),A.push(T.iridescenceThicknessMapUv),A.push(T.sheenColorMapUv),A.push(T.sheenRoughnessMapUv),A.push(T.specularMapUv),A.push(T.specularColorMapUv),A.push(T.specularIntensityMapUv),A.push(T.transmissionMapUv),A.push(T.thicknessMapUv),A.push(T.combine),A.push(T.fogExp2),A.push(T.sizeAttenuation),A.push(T.morphTargetsCount),A.push(T.morphAttributeCount),A.push(T.numDirLights),A.push(T.numPointLights),A.push(T.numSpotLights),A.push(T.numSpotLightMaps),A.push(T.numHemiLights),A.push(T.numRectAreaLights),A.push(T.numDirLightShadows),A.push(T.numPointLightShadows),A.push(T.numSpotLightShadows),A.push(T.numSpotLightShadowsWithMaps),A.push(T.numLightProbes),A.push(T.shadowMapType),A.push(T.toneMapping),A.push(T.numClippingPlanes),A.push(T.numClipIntersection),A.push(T.depthPacking)}function S(A,T){o.disableAll(),T.isWebGL2&&o.enable(0),T.supportsVertexTextures&&o.enable(1),T.instancing&&o.enable(2),T.instancingColor&&o.enable(3),T.matcap&&o.enable(4),T.envMap&&o.enable(5),T.normalMapObjectSpace&&o.enable(6),T.normalMapTangentSpace&&o.enable(7),T.clearcoat&&o.enable(8),T.iridescence&&o.enable(9),T.alphaTest&&o.enable(10),T.vertexColors&&o.enable(11),T.vertexAlphas&&o.enable(12),T.vertexUv1s&&o.enable(13),T.vertexUv2s&&o.enable(14),T.vertexUv3s&&o.enable(15),T.vertexTangents&&o.enable(16),T.anisotropy&&o.enable(17),T.alphaHash&&o.enable(18),T.batching&&o.enable(19),A.push(o.mask),o.disableAll(),T.fog&&o.enable(0),T.useFog&&o.enable(1),T.flatShading&&o.enable(2),T.logarithmicDepthBuffer&&o.enable(3),T.skinning&&o.enable(4),T.morphTargets&&o.enable(5),T.morphNormals&&o.enable(6),T.morphColors&&o.enable(7),T.premultipliedAlpha&&o.enable(8),T.shadowMapEnabled&&o.enable(9),T.useLegacyLights&&o.enable(10),T.doubleSided&&o.enable(11),T.flipSided&&o.enable(12),T.useDepthPacking&&o.enable(13),T.dithering&&o.enable(14),T.transmission&&o.enable(15),T.sheen&&o.enable(16),T.opaque&&o.enable(17),T.pointsUvs&&o.enable(18),T.decodeVideoTexture&&o.enable(19),A.push(o.mask)}function M(A){const T=x[A.type];let R;if(T){const k=zn[T];R=Iv.clone(k.uniforms)}else R=A.uniforms;return R}function I(A,T){let R;for(let k=0,J=u.length;k<J;k++){const U=u[k];if(U.cacheKey===T){R=U,++R.usedTimes;break}}return R===void 0&&(R=new qy(n,T,A,r),u.push(R)),R}function L(A){if(--A.usedTimes===0){const T=u.indexOf(A);u[T]=u[u.length-1],u.pop(),A.destroy()}}function C(A){l.remove(A)}function ie(){l.dispose()}return{getParameters:m,getProgramCacheKey:h,getUniforms:M,acquireProgram:I,releaseProgram:L,releaseShaderCache:C,programs:u,dispose:ie}}function Jy(){let n=new WeakMap;function e(r){let a=n.get(r);return a===void 0&&(a={},n.set(r,a)),a}function t(r){n.delete(r)}function i(r,a,o){n.get(r)[a]=o}function s(){n=new WeakMap}return{get:e,remove:t,update:i,dispose:s}}function Qy(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function Af(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function wf(){const n=[];let e=0;const t=[],i=[],s=[];function r(){e=0,t.length=0,i.length=0,s.length=0}function a(f,d,p,x,_,m){let h=n[e];return h===void 0?(h={id:f.id,object:f,geometry:d,material:p,groupOrder:x,renderOrder:f.renderOrder,z:_,group:m},n[e]=h):(h.id=f.id,h.object=f,h.geometry=d,h.material=p,h.groupOrder=x,h.renderOrder=f.renderOrder,h.z=_,h.group=m),e++,h}function o(f,d,p,x,_,m){const h=a(f,d,p,x,_,m);p.transmission>0?i.push(h):p.transparent===!0?s.push(h):t.push(h)}function l(f,d,p,x,_,m){const h=a(f,d,p,x,_,m);p.transmission>0?i.unshift(h):p.transparent===!0?s.unshift(h):t.unshift(h)}function u(f,d){t.length>1&&t.sort(f||Qy),i.length>1&&i.sort(d||Af),s.length>1&&s.sort(d||Af)}function c(){for(let f=e,d=n.length;f<d;f++){const p=n[f];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:i,transparent:s,init:r,push:o,unshift:l,finish:c,sort:u}}function eE(){let n=new WeakMap;function e(i,s){const r=n.get(i);let a;return r===void 0?(a=new wf,n.set(i,[a])):s>=r.length?(a=new wf,r.push(a)):a=r[s],a}function t(){n=new WeakMap}return{get:e,dispose:t}}function tE(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new W,color:new nt};break;case"SpotLight":t={position:new W,direction:new W,color:new nt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new W,color:new nt,distance:0,decay:0};break;case"HemisphereLight":t={direction:new W,skyColor:new nt,groundColor:new nt};break;case"RectAreaLight":t={color:new nt,position:new W,halfWidth:new W,halfHeight:new W};break}return n[e.id]=t,t}}}function nE(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Xe};break;case"SpotLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Xe};break;case"PointLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Xe,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}let iE=0;function sE(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function rE(n,e){const t=new tE,i=nE(),s={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)s.probe.push(new W);const r=new W,a=new Rt,o=new Rt;function l(c,f){let d=0,p=0,x=0;for(let k=0;k<9;k++)s.probe[k].set(0,0,0);let _=0,m=0,h=0,g=0,S=0,M=0,I=0,L=0,C=0,ie=0,A=0;c.sort(sE);const T=f===!0?Math.PI:1;for(let k=0,J=c.length;k<J;k++){const U=c[k],V=U.color,G=U.intensity,$=U.distance,Z=U.shadow&&U.shadow.map?U.shadow.map.texture:null;if(U.isAmbientLight)d+=V.r*G*T,p+=V.g*G*T,x+=V.b*G*T;else if(U.isLightProbe){for(let ae=0;ae<9;ae++)s.probe[ae].addScaledVector(U.sh.coefficients[ae],G);A++}else if(U.isDirectionalLight){const ae=t.get(U);if(ae.color.copy(U.color).multiplyScalar(U.intensity*T),U.castShadow){const ce=U.shadow,de=i.get(U);de.shadowBias=ce.bias,de.shadowNormalBias=ce.normalBias,de.shadowRadius=ce.radius,de.shadowMapSize=ce.mapSize,s.directionalShadow[_]=de,s.directionalShadowMap[_]=Z,s.directionalShadowMatrix[_]=U.shadow.matrix,M++}s.directional[_]=ae,_++}else if(U.isSpotLight){const ae=t.get(U);ae.position.setFromMatrixPosition(U.matrixWorld),ae.color.copy(V).multiplyScalar(G*T),ae.distance=$,ae.coneCos=Math.cos(U.angle),ae.penumbraCos=Math.cos(U.angle*(1-U.penumbra)),ae.decay=U.decay,s.spot[h]=ae;const ce=U.shadow;if(U.map&&(s.spotLightMap[C]=U.map,C++,ce.updateMatrices(U),U.castShadow&&ie++),s.spotLightMatrix[h]=ce.matrix,U.castShadow){const de=i.get(U);de.shadowBias=ce.bias,de.shadowNormalBias=ce.normalBias,de.shadowRadius=ce.radius,de.shadowMapSize=ce.mapSize,s.spotShadow[h]=de,s.spotShadowMap[h]=Z,L++}h++}else if(U.isRectAreaLight){const ae=t.get(U);ae.color.copy(V).multiplyScalar(G),ae.halfWidth.set(U.width*.5,0,0),ae.halfHeight.set(0,U.height*.5,0),s.rectArea[g]=ae,g++}else if(U.isPointLight){const ae=t.get(U);if(ae.color.copy(U.color).multiplyScalar(U.intensity*T),ae.distance=U.distance,ae.decay=U.decay,U.castShadow){const ce=U.shadow,de=i.get(U);de.shadowBias=ce.bias,de.shadowNormalBias=ce.normalBias,de.shadowRadius=ce.radius,de.shadowMapSize=ce.mapSize,de.shadowCameraNear=ce.camera.near,de.shadowCameraFar=ce.camera.far,s.pointShadow[m]=de,s.pointShadowMap[m]=Z,s.pointShadowMatrix[m]=U.shadow.matrix,I++}s.point[m]=ae,m++}else if(U.isHemisphereLight){const ae=t.get(U);ae.skyColor.copy(U.color).multiplyScalar(G*T),ae.groundColor.copy(U.groundColor).multiplyScalar(G*T),s.hemi[S]=ae,S++}}g>0&&(e.isWebGL2?n.has("OES_texture_float_linear")===!0?(s.rectAreaLTC1=Te.LTC_FLOAT_1,s.rectAreaLTC2=Te.LTC_FLOAT_2):(s.rectAreaLTC1=Te.LTC_HALF_1,s.rectAreaLTC2=Te.LTC_HALF_2):n.has("OES_texture_float_linear")===!0?(s.rectAreaLTC1=Te.LTC_FLOAT_1,s.rectAreaLTC2=Te.LTC_FLOAT_2):n.has("OES_texture_half_float_linear")===!0?(s.rectAreaLTC1=Te.LTC_HALF_1,s.rectAreaLTC2=Te.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),s.ambient[0]=d,s.ambient[1]=p,s.ambient[2]=x;const R=s.hash;(R.directionalLength!==_||R.pointLength!==m||R.spotLength!==h||R.rectAreaLength!==g||R.hemiLength!==S||R.numDirectionalShadows!==M||R.numPointShadows!==I||R.numSpotShadows!==L||R.numSpotMaps!==C||R.numLightProbes!==A)&&(s.directional.length=_,s.spot.length=h,s.rectArea.length=g,s.point.length=m,s.hemi.length=S,s.directionalShadow.length=M,s.directionalShadowMap.length=M,s.pointShadow.length=I,s.pointShadowMap.length=I,s.spotShadow.length=L,s.spotShadowMap.length=L,s.directionalShadowMatrix.length=M,s.pointShadowMatrix.length=I,s.spotLightMatrix.length=L+C-ie,s.spotLightMap.length=C,s.numSpotLightShadowsWithMaps=ie,s.numLightProbes=A,R.directionalLength=_,R.pointLength=m,R.spotLength=h,R.rectAreaLength=g,R.hemiLength=S,R.numDirectionalShadows=M,R.numPointShadows=I,R.numSpotShadows=L,R.numSpotMaps=C,R.numLightProbes=A,s.version=iE++)}function u(c,f){let d=0,p=0,x=0,_=0,m=0;const h=f.matrixWorldInverse;for(let g=0,S=c.length;g<S;g++){const M=c[g];if(M.isDirectionalLight){const I=s.directional[d];I.direction.setFromMatrixPosition(M.matrixWorld),r.setFromMatrixPosition(M.target.matrixWorld),I.direction.sub(r),I.direction.transformDirection(h),d++}else if(M.isSpotLight){const I=s.spot[x];I.position.setFromMatrixPosition(M.matrixWorld),I.position.applyMatrix4(h),I.direction.setFromMatrixPosition(M.matrixWorld),r.setFromMatrixPosition(M.target.matrixWorld),I.direction.sub(r),I.direction.transformDirection(h),x++}else if(M.isRectAreaLight){const I=s.rectArea[_];I.position.setFromMatrixPosition(M.matrixWorld),I.position.applyMatrix4(h),o.identity(),a.copy(M.matrixWorld),a.premultiply(h),o.extractRotation(a),I.halfWidth.set(M.width*.5,0,0),I.halfHeight.set(0,M.height*.5,0),I.halfWidth.applyMatrix4(o),I.halfHeight.applyMatrix4(o),_++}else if(M.isPointLight){const I=s.point[p];I.position.setFromMatrixPosition(M.matrixWorld),I.position.applyMatrix4(h),p++}else if(M.isHemisphereLight){const I=s.hemi[m];I.direction.setFromMatrixPosition(M.matrixWorld),I.direction.transformDirection(h),m++}}}return{setup:l,setupView:u,state:s}}function Rf(n,e){const t=new rE(n,e),i=[],s=[];function r(){i.length=0,s.length=0}function a(f){i.push(f)}function o(f){s.push(f)}function l(f){t.setup(i,f)}function u(f){t.setupView(i,f)}return{init:r,state:{lightsArray:i,shadowsArray:s,lights:t},setupLights:l,setupLightsView:u,pushLight:a,pushShadow:o}}function oE(n,e){let t=new WeakMap;function i(r,a=0){const o=t.get(r);let l;return o===void 0?(l=new Rf(n,e),t.set(r,[l])):a>=o.length?(l=new Rf(n,e),o.push(l)):l=o[a],l}function s(){t=new WeakMap}return{get:i,dispose:s}}class aE extends js{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=iv,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class lE extends js{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const cE=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,uE=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function fE(n,e,t){let i=new nc;const s=new Xe,r=new Xe,a=new Ot,o=new aE({depthPacking:sv}),l=new lE,u={},c=t.maxTextureSize,f={[Oi]:rn,[rn]:Oi,[ci]:ci},d=new rs({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Xe},radius:{value:4}},vertexShader:cE,fragmentShader:uE}),p=d.clone();p.defines.HORIZONTAL_PASS=1;const x=new Dn;x.setAttribute("position",new Xn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new kt(x,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=yh;let h=this.type;this.render=function(L,C,ie){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||L.length===0)return;const A=n.getRenderTarget(),T=n.getActiveCubeFace(),R=n.getActiveMipmapLevel(),k=n.state;k.setBlending(Di),k.buffers.color.setClear(1,1,1,1),k.buffers.depth.setTest(!0),k.setScissorTest(!1);const J=h!==si&&this.type===si,U=h===si&&this.type!==si;for(let V=0,G=L.length;V<G;V++){const $=L[V],Z=$.shadow;if(Z===void 0){console.warn("THREE.WebGLShadowMap:",$,"has no shadow.");continue}if(Z.autoUpdate===!1&&Z.needsUpdate===!1)continue;s.copy(Z.mapSize);const ae=Z.getFrameExtents();if(s.multiply(ae),r.copy(Z.mapSize),(s.x>c||s.y>c)&&(s.x>c&&(r.x=Math.floor(c/ae.x),s.x=r.x*ae.x,Z.mapSize.x=r.x),s.y>c&&(r.y=Math.floor(c/ae.y),s.y=r.y*ae.y,Z.mapSize.y=r.y)),Z.map===null||J===!0||U===!0){const de=this.type!==si?{minFilter:Zt,magFilter:Zt}:{};Z.map!==null&&Z.map.dispose(),Z.map=new is(s.x,s.y,de),Z.map.texture.name=$.name+".shadowMap",Z.camera.updateProjectionMatrix()}n.setRenderTarget(Z.map),n.clear();const ce=Z.getViewportCount();for(let de=0;de<ce;de++){const he=Z.getViewport(de);a.set(r.x*he.x,r.y*he.y,r.x*he.z,r.y*he.w),k.viewport(a),Z.updateMatrices($,de),i=Z.getFrustum(),M(C,ie,Z.camera,$,this.type)}Z.isPointLightShadow!==!0&&this.type===si&&g(Z,ie),Z.needsUpdate=!1}h=this.type,m.needsUpdate=!1,n.setRenderTarget(A,T,R)};function g(L,C){const ie=e.update(_);d.defines.VSM_SAMPLES!==L.blurSamples&&(d.defines.VSM_SAMPLES=L.blurSamples,p.defines.VSM_SAMPLES=L.blurSamples,d.needsUpdate=!0,p.needsUpdate=!0),L.mapPass===null&&(L.mapPass=new is(s.x,s.y)),d.uniforms.shadow_pass.value=L.map.texture,d.uniforms.resolution.value=L.mapSize,d.uniforms.radius.value=L.radius,n.setRenderTarget(L.mapPass),n.clear(),n.renderBufferDirect(C,null,ie,d,_,null),p.uniforms.shadow_pass.value=L.mapPass.texture,p.uniforms.resolution.value=L.mapSize,p.uniforms.radius.value=L.radius,n.setRenderTarget(L.map),n.clear(),n.renderBufferDirect(C,null,ie,p,_,null)}function S(L,C,ie,A){let T=null;const R=ie.isPointLight===!0?L.customDistanceMaterial:L.customDepthMaterial;if(R!==void 0)T=R;else if(T=ie.isPointLight===!0?l:o,n.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0){const k=T.uuid,J=C.uuid;let U=u[k];U===void 0&&(U={},u[k]=U);let V=U[J];V===void 0&&(V=T.clone(),U[J]=V,C.addEventListener("dispose",I)),T=V}if(T.visible=C.visible,T.wireframe=C.wireframe,A===si?T.side=C.shadowSide!==null?C.shadowSide:C.side:T.side=C.shadowSide!==null?C.shadowSide:f[C.side],T.alphaMap=C.alphaMap,T.alphaTest=C.alphaTest,T.map=C.map,T.clipShadows=C.clipShadows,T.clippingPlanes=C.clippingPlanes,T.clipIntersection=C.clipIntersection,T.displacementMap=C.displacementMap,T.displacementScale=C.displacementScale,T.displacementBias=C.displacementBias,T.wireframeLinewidth=C.wireframeLinewidth,T.linewidth=C.linewidth,ie.isPointLight===!0&&T.isMeshDistanceMaterial===!0){const k=n.properties.get(T);k.light=ie}return T}function M(L,C,ie,A,T){if(L.visible===!1)return;if(L.layers.test(C.layers)&&(L.isMesh||L.isLine||L.isPoints)&&(L.castShadow||L.receiveShadow&&T===si)&&(!L.frustumCulled||i.intersectsObject(L))){L.modelViewMatrix.multiplyMatrices(ie.matrixWorldInverse,L.matrixWorld);const J=e.update(L),U=L.material;if(Array.isArray(U)){const V=J.groups;for(let G=0,$=V.length;G<$;G++){const Z=V[G],ae=U[Z.materialIndex];if(ae&&ae.visible){const ce=S(L,ae,A,T);L.onBeforeShadow(n,L,C,ie,J,ce,Z),n.renderBufferDirect(ie,null,J,ce,L,Z),L.onAfterShadow(n,L,C,ie,J,ce,Z)}}}else if(U.visible){const V=S(L,U,A,T);L.onBeforeShadow(n,L,C,ie,J,V,null),n.renderBufferDirect(ie,null,J,V,L,null),L.onAfterShadow(n,L,C,ie,J,V,null)}}const k=L.children;for(let J=0,U=k.length;J<U;J++)M(k[J],C,ie,A,T)}function I(L){L.target.removeEventListener("dispose",I);for(const ie in u){const A=u[ie],T=L.target.uuid;T in A&&(A[T].dispose(),delete A[T])}}}function dE(n,e,t){const i=t.isWebGL2;function s(){let N=!1;const Ee=new Ot;let Ae=null;const Ve=new Ot(0,0,0,0);return{setMask:function(Fe){Ae!==Fe&&!N&&(n.colorMask(Fe,Fe,Fe,Fe),Ae=Fe)},setLocked:function(Fe){N=Fe},setClear:function(Fe,et,tt,vt,yt){yt===!0&&(Fe*=vt,et*=vt,tt*=vt),Ee.set(Fe,et,tt,vt),Ve.equals(Ee)===!1&&(n.clearColor(Fe,et,tt,vt),Ve.copy(Ee))},reset:function(){N=!1,Ae=null,Ve.set(-1,0,0,0)}}}function r(){let N=!1,Ee=null,Ae=null,Ve=null;return{setTest:function(Fe){Fe?re(n.DEPTH_TEST):pe(n.DEPTH_TEST)},setMask:function(Fe){Ee!==Fe&&!N&&(n.depthMask(Fe),Ee=Fe)},setFunc:function(Fe){if(Ae!==Fe){switch(Fe){case I0:n.depthFunc(n.NEVER);break;case U0:n.depthFunc(n.ALWAYS);break;case N0:n.depthFunc(n.LESS);break;case Po:n.depthFunc(n.LEQUAL);break;case O0:n.depthFunc(n.EQUAL);break;case F0:n.depthFunc(n.GEQUAL);break;case B0:n.depthFunc(n.GREATER);break;case z0:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}Ae=Fe}},setLocked:function(Fe){N=Fe},setClear:function(Fe){Ve!==Fe&&(n.clearDepth(Fe),Ve=Fe)},reset:function(){N=!1,Ee=null,Ae=null,Ve=null}}}function a(){let N=!1,Ee=null,Ae=null,Ve=null,Fe=null,et=null,tt=null,vt=null,yt=null;return{setTest:function(it){N||(it?re(n.STENCIL_TEST):pe(n.STENCIL_TEST))},setMask:function(it){Ee!==it&&!N&&(n.stencilMask(it),Ee=it)},setFunc:function(it,At,In){(Ae!==it||Ve!==At||Fe!==In)&&(n.stencilFunc(it,At,In),Ae=it,Ve=At,Fe=In)},setOp:function(it,At,In){(et!==it||tt!==At||vt!==In)&&(n.stencilOp(it,At,In),et=it,tt=At,vt=In)},setLocked:function(it){N=it},setClear:function(it){yt!==it&&(n.clearStencil(it),yt=it)},reset:function(){N=!1,Ee=null,Ae=null,Ve=null,Fe=null,et=null,tt=null,vt=null,yt=null}}}const o=new s,l=new r,u=new a,c=new WeakMap,f=new WeakMap;let d={},p={},x=new WeakMap,_=[],m=null,h=!1,g=null,S=null,M=null,I=null,L=null,C=null,ie=null,A=new nt(0,0,0),T=0,R=!1,k=null,J=null,U=null,V=null,G=null;const $=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let Z=!1,ae=0;const ce=n.getParameter(n.VERSION);ce.indexOf("WebGL")!==-1?(ae=parseFloat(/^WebGL (\d)/.exec(ce)[1]),Z=ae>=1):ce.indexOf("OpenGL ES")!==-1&&(ae=parseFloat(/^OpenGL ES (\d)/.exec(ce)[1]),Z=ae>=2);let de=null,he={};const ee=n.getParameter(n.SCISSOR_BOX),Y=n.getParameter(n.VIEWPORT),ge=new Ot().fromArray(ee),ye=new Ot().fromArray(Y);function B(N,Ee,Ae,Ve){const Fe=new Uint8Array(4),et=n.createTexture();n.bindTexture(N,et),n.texParameteri(N,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(N,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let tt=0;tt<Ae;tt++)i&&(N===n.TEXTURE_3D||N===n.TEXTURE_2D_ARRAY)?n.texImage3D(Ee,0,n.RGBA,1,1,Ve,0,n.RGBA,n.UNSIGNED_BYTE,Fe):n.texImage2D(Ee+tt,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Fe);return et}const ue={};ue[n.TEXTURE_2D]=B(n.TEXTURE_2D,n.TEXTURE_2D,1),ue[n.TEXTURE_CUBE_MAP]=B(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),i&&(ue[n.TEXTURE_2D_ARRAY]=B(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),ue[n.TEXTURE_3D]=B(n.TEXTURE_3D,n.TEXTURE_3D,1,1)),o.setClear(0,0,0,1),l.setClear(1),u.setClear(0),re(n.DEPTH_TEST),l.setFunc(Po),oe(!1),E(lu),re(n.CULL_FACE),X(Di);function re(N){d[N]!==!0&&(n.enable(N),d[N]=!0)}function pe(N){d[N]!==!1&&(n.disable(N),d[N]=!1)}function b(N,Ee){return p[N]!==Ee?(n.bindFramebuffer(N,Ee),p[N]=Ee,i&&(N===n.DRAW_FRAMEBUFFER&&(p[n.FRAMEBUFFER]=Ee),N===n.FRAMEBUFFER&&(p[n.DRAW_FRAMEBUFFER]=Ee)),!0):!1}function y(N,Ee){let Ae=_,Ve=!1;if(N)if(Ae=x.get(Ee),Ae===void 0&&(Ae=[],x.set(Ee,Ae)),N.isWebGLMultipleRenderTargets){const Fe=N.texture;if(Ae.length!==Fe.length||Ae[0]!==n.COLOR_ATTACHMENT0){for(let et=0,tt=Fe.length;et<tt;et++)Ae[et]=n.COLOR_ATTACHMENT0+et;Ae.length=Fe.length,Ve=!0}}else Ae[0]!==n.COLOR_ATTACHMENT0&&(Ae[0]=n.COLOR_ATTACHMENT0,Ve=!0);else Ae[0]!==n.BACK&&(Ae[0]=n.BACK,Ve=!0);Ve&&(t.isWebGL2?n.drawBuffers(Ae):e.get("WEBGL_draw_buffers").drawBuffersWEBGL(Ae))}function z(N){return m!==N?(n.useProgram(N),m=N,!0):!1}const F={[Yi]:n.FUNC_ADD,[v0]:n.FUNC_SUBTRACT,[x0]:n.FUNC_REVERSE_SUBTRACT};if(i)F[du]=n.MIN,F[hu]=n.MAX;else{const N=e.get("EXT_blend_minmax");N!==null&&(F[du]=N.MIN_EXT,F[hu]=N.MAX_EXT)}const H={[M0]:n.ZERO,[S0]:n.ONE,[y0]:n.SRC_COLOR,[Sl]:n.SRC_ALPHA,[R0]:n.SRC_ALPHA_SATURATE,[A0]:n.DST_COLOR,[b0]:n.DST_ALPHA,[E0]:n.ONE_MINUS_SRC_COLOR,[yl]:n.ONE_MINUS_SRC_ALPHA,[w0]:n.ONE_MINUS_DST_COLOR,[T0]:n.ONE_MINUS_DST_ALPHA,[C0]:n.CONSTANT_COLOR,[P0]:n.ONE_MINUS_CONSTANT_COLOR,[L0]:n.CONSTANT_ALPHA,[D0]:n.ONE_MINUS_CONSTANT_ALPHA};function X(N,Ee,Ae,Ve,Fe,et,tt,vt,yt,it){if(N===Di){h===!0&&(pe(n.BLEND),h=!1);return}if(h===!1&&(re(n.BLEND),h=!0),N!==_0){if(N!==g||it!==R){if((S!==Yi||L!==Yi)&&(n.blendEquation(n.FUNC_ADD),S=Yi,L=Yi),it)switch(N){case Os:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case cu:n.blendFunc(n.ONE,n.ONE);break;case uu:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case fu:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",N);break}else switch(N){case Os:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case cu:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case uu:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case fu:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",N);break}M=null,I=null,C=null,ie=null,A.set(0,0,0),T=0,g=N,R=it}return}Fe=Fe||Ee,et=et||Ae,tt=tt||Ve,(Ee!==S||Fe!==L)&&(n.blendEquationSeparate(F[Ee],F[Fe]),S=Ee,L=Fe),(Ae!==M||Ve!==I||et!==C||tt!==ie)&&(n.blendFuncSeparate(H[Ae],H[Ve],H[et],H[tt]),M=Ae,I=Ve,C=et,ie=tt),(vt.equals(A)===!1||yt!==T)&&(n.blendColor(vt.r,vt.g,vt.b,yt),A.copy(vt),T=yt),g=N,R=!1}function le(N,Ee){N.side===ci?pe(n.CULL_FACE):re(n.CULL_FACE);let Ae=N.side===rn;Ee&&(Ae=!Ae),oe(Ae),N.blending===Os&&N.transparent===!1?X(Di):X(N.blending,N.blendEquation,N.blendSrc,N.blendDst,N.blendEquationAlpha,N.blendSrcAlpha,N.blendDstAlpha,N.blendColor,N.blendAlpha,N.premultipliedAlpha),l.setFunc(N.depthFunc),l.setTest(N.depthTest),l.setMask(N.depthWrite),o.setMask(N.colorWrite);const Ve=N.stencilWrite;u.setTest(Ve),Ve&&(u.setMask(N.stencilWriteMask),u.setFunc(N.stencilFunc,N.stencilRef,N.stencilFuncMask),u.setOp(N.stencilFail,N.stencilZFail,N.stencilZPass)),O(N.polygonOffset,N.polygonOffsetFactor,N.polygonOffsetUnits),N.alphaToCoverage===!0?re(n.SAMPLE_ALPHA_TO_COVERAGE):pe(n.SAMPLE_ALPHA_TO_COVERAGE)}function oe(N){k!==N&&(N?n.frontFace(n.CW):n.frontFace(n.CCW),k=N)}function E(N){N!==p0?(re(n.CULL_FACE),N!==J&&(N===lu?n.cullFace(n.BACK):N===m0?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):pe(n.CULL_FACE),J=N}function v(N){N!==U&&(Z&&n.lineWidth(N),U=N)}function O(N,Ee,Ae){N?(re(n.POLYGON_OFFSET_FILL),(V!==Ee||G!==Ae)&&(n.polygonOffset(Ee,Ae),V=Ee,G=Ae)):pe(n.POLYGON_OFFSET_FILL)}function j(N){N?re(n.SCISSOR_TEST):pe(n.SCISSOR_TEST)}function K(N){N===void 0&&(N=n.TEXTURE0+$-1),de!==N&&(n.activeTexture(N),de=N)}function te(N,Ee,Ae){Ae===void 0&&(de===null?Ae=n.TEXTURE0+$-1:Ae=de);let Ve=he[Ae];Ve===void 0&&(Ve={type:void 0,texture:void 0},he[Ae]=Ve),(Ve.type!==N||Ve.texture!==Ee)&&(de!==Ae&&(n.activeTexture(Ae),de=Ae),n.bindTexture(N,Ee||ue[N]),Ve.type=N,Ve.texture=Ee)}function Me(){const N=he[de];N!==void 0&&N.type!==void 0&&(n.bindTexture(N.type,null),N.type=void 0,N.texture=void 0)}function me(){try{n.compressedTexImage2D.apply(n,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function ve(){try{n.compressedTexImage3D.apply(n,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function we(){try{n.texSubImage2D.apply(n,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Le(){try{n.texSubImage3D.apply(n,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function fe(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function je(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function ze(){try{n.texStorage2D.apply(n,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function He(){try{n.texStorage3D.apply(n,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function Re(){try{n.texImage2D.apply(n,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function be(){try{n.texImage3D.apply(n,arguments)}catch(N){console.error("THREE.WebGLState:",N)}}function D(N){ge.equals(N)===!1&&(n.scissor(N.x,N.y,N.z,N.w),ge.copy(N))}function Se(N){ye.equals(N)===!1&&(n.viewport(N.x,N.y,N.z,N.w),ye.copy(N))}function De(N,Ee){let Ae=f.get(Ee);Ae===void 0&&(Ae=new WeakMap,f.set(Ee,Ae));let Ve=Ae.get(N);Ve===void 0&&(Ve=n.getUniformBlockIndex(Ee,N.name),Ae.set(N,Ve))}function Pe(N,Ee){const Ve=f.get(Ee).get(N);c.get(Ee)!==Ve&&(n.uniformBlockBinding(Ee,Ve,N.__bindingPointIndex),c.set(Ee,Ve))}function _e(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),i===!0&&(n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null)),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),d={},de=null,he={},p={},x=new WeakMap,_=[],m=null,h=!1,g=null,S=null,M=null,I=null,L=null,C=null,ie=null,A=new nt(0,0,0),T=0,R=!1,k=null,J=null,U=null,V=null,G=null,ge.set(0,0,n.canvas.width,n.canvas.height),ye.set(0,0,n.canvas.width,n.canvas.height),o.reset(),l.reset(),u.reset()}return{buffers:{color:o,depth:l,stencil:u},enable:re,disable:pe,bindFramebuffer:b,drawBuffers:y,useProgram:z,setBlending:X,setMaterial:le,setFlipSided:oe,setCullFace:E,setLineWidth:v,setPolygonOffset:O,setScissorTest:j,activeTexture:K,bindTexture:te,unbindTexture:Me,compressedTexImage2D:me,compressedTexImage3D:ve,texImage2D:Re,texImage3D:be,updateUBOMapping:De,uniformBlockBinding:Pe,texStorage2D:ze,texStorage3D:He,texSubImage2D:we,texSubImage3D:Le,compressedTexSubImage2D:fe,compressedTexSubImage3D:je,scissor:D,viewport:Se,reset:_e}}function hE(n,e,t,i,s,r,a){const o=s.isWebGL2,l=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,u=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new WeakMap;let f;const d=new WeakMap;let p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function x(E,v){return p?new OffscreenCanvas(E,v):No("canvas")}function _(E,v,O,j){let K=1;if((E.width>j||E.height>j)&&(K=j/Math.max(E.width,E.height)),K<1||v===!0)if(typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&E instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&E instanceof ImageBitmap){const te=v?Cl:Math.floor,Me=te(K*E.width),me=te(K*E.height);f===void 0&&(f=x(Me,me));const ve=O?x(Me,me):f;return ve.width=Me,ve.height=me,ve.getContext("2d").drawImage(E,0,0,Me,me),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+E.width+"x"+E.height+") to ("+Me+"x"+me+")."),ve}else return"data"in E&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+E.width+"x"+E.height+")."),E;return E}function m(E){return ku(E.width)&&ku(E.height)}function h(E){return o?!1:E.wrapS!==Tn||E.wrapT!==Tn||E.minFilter!==Zt&&E.minFilter!==mn}function g(E,v){return E.generateMipmaps&&v&&E.minFilter!==Zt&&E.minFilter!==mn}function S(E){n.generateMipmap(E)}function M(E,v,O,j,K=!1){if(o===!1)return v;if(E!==null){if(n[E]!==void 0)return n[E];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+E+"'")}let te=v;if(v===n.RED&&(O===n.FLOAT&&(te=n.R32F),O===n.HALF_FLOAT&&(te=n.R16F),O===n.UNSIGNED_BYTE&&(te=n.R8)),v===n.RED_INTEGER&&(O===n.UNSIGNED_BYTE&&(te=n.R8UI),O===n.UNSIGNED_SHORT&&(te=n.R16UI),O===n.UNSIGNED_INT&&(te=n.R32UI),O===n.BYTE&&(te=n.R8I),O===n.SHORT&&(te=n.R16I),O===n.INT&&(te=n.R32I)),v===n.RG&&(O===n.FLOAT&&(te=n.RG32F),O===n.HALF_FLOAT&&(te=n.RG16F),O===n.UNSIGNED_BYTE&&(te=n.RG8)),v===n.RGBA){const Me=K?Lo:lt.getTransfer(j);O===n.FLOAT&&(te=n.RGBA32F),O===n.HALF_FLOAT&&(te=n.RGBA16F),O===n.UNSIGNED_BYTE&&(te=Me===pt?n.SRGB8_ALPHA8:n.RGBA8),O===n.UNSIGNED_SHORT_4_4_4_4&&(te=n.RGBA4),O===n.UNSIGNED_SHORT_5_5_5_1&&(te=n.RGB5_A1)}return(te===n.R16F||te===n.R32F||te===n.RG16F||te===n.RG32F||te===n.RGBA16F||te===n.RGBA32F)&&e.get("EXT_color_buffer_float"),te}function I(E,v,O){return g(E,O)===!0||E.isFramebufferTexture&&E.minFilter!==Zt&&E.minFilter!==mn?Math.log2(Math.max(v.width,v.height))+1:E.mipmaps!==void 0&&E.mipmaps.length>0?E.mipmaps.length:E.isCompressedTexture&&Array.isArray(E.image)?v.mipmaps.length:1}function L(E){return E===Zt||E===pu||E===Ta?n.NEAREST:n.LINEAR}function C(E){const v=E.target;v.removeEventListener("dispose",C),A(v),v.isVideoTexture&&c.delete(v)}function ie(E){const v=E.target;v.removeEventListener("dispose",ie),R(v)}function A(E){const v=i.get(E);if(v.__webglInit===void 0)return;const O=E.source,j=d.get(O);if(j){const K=j[v.__cacheKey];K.usedTimes--,K.usedTimes===0&&T(E),Object.keys(j).length===0&&d.delete(O)}i.remove(E)}function T(E){const v=i.get(E);n.deleteTexture(v.__webglTexture);const O=E.source,j=d.get(O);delete j[v.__cacheKey],a.memory.textures--}function R(E){const v=E.texture,O=i.get(E),j=i.get(v);if(j.__webglTexture!==void 0&&(n.deleteTexture(j.__webglTexture),a.memory.textures--),E.depthTexture&&E.depthTexture.dispose(),E.isWebGLCubeRenderTarget)for(let K=0;K<6;K++){if(Array.isArray(O.__webglFramebuffer[K]))for(let te=0;te<O.__webglFramebuffer[K].length;te++)n.deleteFramebuffer(O.__webglFramebuffer[K][te]);else n.deleteFramebuffer(O.__webglFramebuffer[K]);O.__webglDepthbuffer&&n.deleteRenderbuffer(O.__webglDepthbuffer[K])}else{if(Array.isArray(O.__webglFramebuffer))for(let K=0;K<O.__webglFramebuffer.length;K++)n.deleteFramebuffer(O.__webglFramebuffer[K]);else n.deleteFramebuffer(O.__webglFramebuffer);if(O.__webglDepthbuffer&&n.deleteRenderbuffer(O.__webglDepthbuffer),O.__webglMultisampledFramebuffer&&n.deleteFramebuffer(O.__webglMultisampledFramebuffer),O.__webglColorRenderbuffer)for(let K=0;K<O.__webglColorRenderbuffer.length;K++)O.__webglColorRenderbuffer[K]&&n.deleteRenderbuffer(O.__webglColorRenderbuffer[K]);O.__webglDepthRenderbuffer&&n.deleteRenderbuffer(O.__webglDepthRenderbuffer)}if(E.isWebGLMultipleRenderTargets)for(let K=0,te=v.length;K<te;K++){const Me=i.get(v[K]);Me.__webglTexture&&(n.deleteTexture(Me.__webglTexture),a.memory.textures--),i.remove(v[K])}i.remove(v),i.remove(E)}let k=0;function J(){k=0}function U(){const E=k;return E>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+E+" texture units while this GPU supports only "+s.maxTextures),k+=1,E}function V(E){const v=[];return v.push(E.wrapS),v.push(E.wrapT),v.push(E.wrapR||0),v.push(E.magFilter),v.push(E.minFilter),v.push(E.anisotropy),v.push(E.internalFormat),v.push(E.format),v.push(E.type),v.push(E.generateMipmaps),v.push(E.premultiplyAlpha),v.push(E.flipY),v.push(E.unpackAlignment),v.push(E.colorSpace),v.join()}function G(E,v){const O=i.get(E);if(E.isVideoTexture&&le(E),E.isRenderTargetTexture===!1&&E.version>0&&O.__version!==E.version){const j=E.image;if(j===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(j.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{ge(O,E,v);return}}t.bindTexture(n.TEXTURE_2D,O.__webglTexture,n.TEXTURE0+v)}function $(E,v){const O=i.get(E);if(E.version>0&&O.__version!==E.version){ge(O,E,v);return}t.bindTexture(n.TEXTURE_2D_ARRAY,O.__webglTexture,n.TEXTURE0+v)}function Z(E,v){const O=i.get(E);if(E.version>0&&O.__version!==E.version){ge(O,E,v);return}t.bindTexture(n.TEXTURE_3D,O.__webglTexture,n.TEXTURE0+v)}function ae(E,v){const O=i.get(E);if(E.version>0&&O.__version!==E.version){ye(O,E,v);return}t.bindTexture(n.TEXTURE_CUBE_MAP,O.__webglTexture,n.TEXTURE0+v)}const ce={[Tl]:n.REPEAT,[Tn]:n.CLAMP_TO_EDGE,[Al]:n.MIRRORED_REPEAT},de={[Zt]:n.NEAREST,[pu]:n.NEAREST_MIPMAP_NEAREST,[Ta]:n.NEAREST_MIPMAP_LINEAR,[mn]:n.LINEAR,[Y0]:n.LINEAR_MIPMAP_NEAREST,[Ar]:n.LINEAR_MIPMAP_LINEAR},he={[ov]:n.NEVER,[dv]:n.ALWAYS,[av]:n.LESS,[Uh]:n.LEQUAL,[lv]:n.EQUAL,[fv]:n.GEQUAL,[cv]:n.GREATER,[uv]:n.NOTEQUAL};function ee(E,v,O){if(O?(n.texParameteri(E,n.TEXTURE_WRAP_S,ce[v.wrapS]),n.texParameteri(E,n.TEXTURE_WRAP_T,ce[v.wrapT]),(E===n.TEXTURE_3D||E===n.TEXTURE_2D_ARRAY)&&n.texParameteri(E,n.TEXTURE_WRAP_R,ce[v.wrapR]),n.texParameteri(E,n.TEXTURE_MAG_FILTER,de[v.magFilter]),n.texParameteri(E,n.TEXTURE_MIN_FILTER,de[v.minFilter])):(n.texParameteri(E,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(E,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE),(E===n.TEXTURE_3D||E===n.TEXTURE_2D_ARRAY)&&n.texParameteri(E,n.TEXTURE_WRAP_R,n.CLAMP_TO_EDGE),(v.wrapS!==Tn||v.wrapT!==Tn)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),n.texParameteri(E,n.TEXTURE_MAG_FILTER,L(v.magFilter)),n.texParameteri(E,n.TEXTURE_MIN_FILTER,L(v.minFilter)),v.minFilter!==Zt&&v.minFilter!==mn&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),v.compareFunction&&(n.texParameteri(E,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(E,n.TEXTURE_COMPARE_FUNC,he[v.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){const j=e.get("EXT_texture_filter_anisotropic");if(v.magFilter===Zt||v.minFilter!==Ta&&v.minFilter!==Ar||v.type===Ci&&e.has("OES_texture_float_linear")===!1||o===!1&&v.type===wr&&e.has("OES_texture_half_float_linear")===!1)return;(v.anisotropy>1||i.get(v).__currentAnisotropy)&&(n.texParameterf(E,j.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,s.getMaxAnisotropy())),i.get(v).__currentAnisotropy=v.anisotropy)}}function Y(E,v){let O=!1;E.__webglInit===void 0&&(E.__webglInit=!0,v.addEventListener("dispose",C));const j=v.source;let K=d.get(j);K===void 0&&(K={},d.set(j,K));const te=V(v);if(te!==E.__cacheKey){K[te]===void 0&&(K[te]={texture:n.createTexture(),usedTimes:0},a.memory.textures++,O=!0),K[te].usedTimes++;const Me=K[E.__cacheKey];Me!==void 0&&(K[E.__cacheKey].usedTimes--,Me.usedTimes===0&&T(v)),E.__cacheKey=te,E.__webglTexture=K[te].texture}return O}function ge(E,v,O){let j=n.TEXTURE_2D;(v.isDataArrayTexture||v.isCompressedArrayTexture)&&(j=n.TEXTURE_2D_ARRAY),v.isData3DTexture&&(j=n.TEXTURE_3D);const K=Y(E,v),te=v.source;t.bindTexture(j,E.__webglTexture,n.TEXTURE0+O);const Me=i.get(te);if(te.version!==Me.__version||K===!0){t.activeTexture(n.TEXTURE0+O);const me=lt.getPrimaries(lt.workingColorSpace),ve=v.colorSpace===_n?null:lt.getPrimaries(v.colorSpace),we=v.colorSpace===_n||me===ve?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,v.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,v.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,we);const Le=h(v)&&m(v.image)===!1;let fe=_(v.image,Le,!1,s.maxTextureSize);fe=oe(v,fe);const je=m(fe)||o,ze=r.convert(v.format,v.colorSpace);let He=r.convert(v.type),Re=M(v.internalFormat,ze,He,v.colorSpace,v.isVideoTexture);ee(j,v,je);let be;const D=v.mipmaps,Se=o&&v.isVideoTexture!==!0&&Re!==Lh,De=Me.__version===void 0||K===!0,Pe=I(v,fe,je);if(v.isDepthTexture)Re=n.DEPTH_COMPONENT,o?v.type===Ci?Re=n.DEPTH_COMPONENT32F:v.type===Ri?Re=n.DEPTH_COMPONENT24:v.type===es?Re=n.DEPTH24_STENCIL8:Re=n.DEPTH_COMPONENT16:v.type===Ci&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),v.format===ts&&Re===n.DEPTH_COMPONENT&&v.type!==Jl&&v.type!==Ri&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),v.type=Ri,He=r.convert(v.type)),v.format===Ws&&Re===n.DEPTH_COMPONENT&&(Re=n.DEPTH_STENCIL,v.type!==es&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),v.type=es,He=r.convert(v.type))),De&&(Se?t.texStorage2D(n.TEXTURE_2D,1,Re,fe.width,fe.height):t.texImage2D(n.TEXTURE_2D,0,Re,fe.width,fe.height,0,ze,He,null));else if(v.isDataTexture)if(D.length>0&&je){Se&&De&&t.texStorage2D(n.TEXTURE_2D,Pe,Re,D[0].width,D[0].height);for(let _e=0,N=D.length;_e<N;_e++)be=D[_e],Se?t.texSubImage2D(n.TEXTURE_2D,_e,0,0,be.width,be.height,ze,He,be.data):t.texImage2D(n.TEXTURE_2D,_e,Re,be.width,be.height,0,ze,He,be.data);v.generateMipmaps=!1}else Se?(De&&t.texStorage2D(n.TEXTURE_2D,Pe,Re,fe.width,fe.height),t.texSubImage2D(n.TEXTURE_2D,0,0,0,fe.width,fe.height,ze,He,fe.data)):t.texImage2D(n.TEXTURE_2D,0,Re,fe.width,fe.height,0,ze,He,fe.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){Se&&De&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Pe,Re,D[0].width,D[0].height,fe.depth);for(let _e=0,N=D.length;_e<N;_e++)be=D[_e],v.format!==An?ze!==null?Se?t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,_e,0,0,0,be.width,be.height,fe.depth,ze,be.data,0,0):t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,_e,Re,be.width,be.height,fe.depth,0,be.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Se?t.texSubImage3D(n.TEXTURE_2D_ARRAY,_e,0,0,0,be.width,be.height,fe.depth,ze,He,be.data):t.texImage3D(n.TEXTURE_2D_ARRAY,_e,Re,be.width,be.height,fe.depth,0,ze,He,be.data)}else{Se&&De&&t.texStorage2D(n.TEXTURE_2D,Pe,Re,D[0].width,D[0].height);for(let _e=0,N=D.length;_e<N;_e++)be=D[_e],v.format!==An?ze!==null?Se?t.compressedTexSubImage2D(n.TEXTURE_2D,_e,0,0,be.width,be.height,ze,be.data):t.compressedTexImage2D(n.TEXTURE_2D,_e,Re,be.width,be.height,0,be.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Se?t.texSubImage2D(n.TEXTURE_2D,_e,0,0,be.width,be.height,ze,He,be.data):t.texImage2D(n.TEXTURE_2D,_e,Re,be.width,be.height,0,ze,He,be.data)}else if(v.isDataArrayTexture)Se?(De&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Pe,Re,fe.width,fe.height,fe.depth),t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,fe.width,fe.height,fe.depth,ze,He,fe.data)):t.texImage3D(n.TEXTURE_2D_ARRAY,0,Re,fe.width,fe.height,fe.depth,0,ze,He,fe.data);else if(v.isData3DTexture)Se?(De&&t.texStorage3D(n.TEXTURE_3D,Pe,Re,fe.width,fe.height,fe.depth),t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,fe.width,fe.height,fe.depth,ze,He,fe.data)):t.texImage3D(n.TEXTURE_3D,0,Re,fe.width,fe.height,fe.depth,0,ze,He,fe.data);else if(v.isFramebufferTexture){if(De)if(Se)t.texStorage2D(n.TEXTURE_2D,Pe,Re,fe.width,fe.height);else{let _e=fe.width,N=fe.height;for(let Ee=0;Ee<Pe;Ee++)t.texImage2D(n.TEXTURE_2D,Ee,Re,_e,N,0,ze,He,null),_e>>=1,N>>=1}}else if(D.length>0&&je){Se&&De&&t.texStorage2D(n.TEXTURE_2D,Pe,Re,D[0].width,D[0].height);for(let _e=0,N=D.length;_e<N;_e++)be=D[_e],Se?t.texSubImage2D(n.TEXTURE_2D,_e,0,0,ze,He,be):t.texImage2D(n.TEXTURE_2D,_e,Re,ze,He,be);v.generateMipmaps=!1}else Se?(De&&t.texStorage2D(n.TEXTURE_2D,Pe,Re,fe.width,fe.height),t.texSubImage2D(n.TEXTURE_2D,0,0,0,ze,He,fe)):t.texImage2D(n.TEXTURE_2D,0,Re,ze,He,fe);g(v,je)&&S(j),Me.__version=te.version,v.onUpdate&&v.onUpdate(v)}E.__version=v.version}function ye(E,v,O){if(v.image.length!==6)return;const j=Y(E,v),K=v.source;t.bindTexture(n.TEXTURE_CUBE_MAP,E.__webglTexture,n.TEXTURE0+O);const te=i.get(K);if(K.version!==te.__version||j===!0){t.activeTexture(n.TEXTURE0+O);const Me=lt.getPrimaries(lt.workingColorSpace),me=v.colorSpace===_n?null:lt.getPrimaries(v.colorSpace),ve=v.colorSpace===_n||Me===me?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,v.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,v.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,ve);const we=v.isCompressedTexture||v.image[0].isCompressedTexture,Le=v.image[0]&&v.image[0].isDataTexture,fe=[];for(let _e=0;_e<6;_e++)!we&&!Le?fe[_e]=_(v.image[_e],!1,!0,s.maxCubemapSize):fe[_e]=Le?v.image[_e].image:v.image[_e],fe[_e]=oe(v,fe[_e]);const je=fe[0],ze=m(je)||o,He=r.convert(v.format,v.colorSpace),Re=r.convert(v.type),be=M(v.internalFormat,He,Re,v.colorSpace),D=o&&v.isVideoTexture!==!0,Se=te.__version===void 0||j===!0;let De=I(v,je,ze);ee(n.TEXTURE_CUBE_MAP,v,ze);let Pe;if(we){D&&Se&&t.texStorage2D(n.TEXTURE_CUBE_MAP,De,be,je.width,je.height);for(let _e=0;_e<6;_e++){Pe=fe[_e].mipmaps;for(let N=0;N<Pe.length;N++){const Ee=Pe[N];v.format!==An?He!==null?D?t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+_e,N,0,0,Ee.width,Ee.height,He,Ee.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+_e,N,be,Ee.width,Ee.height,0,Ee.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):D?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+_e,N,0,0,Ee.width,Ee.height,He,Re,Ee.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+_e,N,be,Ee.width,Ee.height,0,He,Re,Ee.data)}}}else{Pe=v.mipmaps,D&&Se&&(Pe.length>0&&De++,t.texStorage2D(n.TEXTURE_CUBE_MAP,De,be,fe[0].width,fe[0].height));for(let _e=0;_e<6;_e++)if(Le){D?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+_e,0,0,0,fe[_e].width,fe[_e].height,He,Re,fe[_e].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+_e,0,be,fe[_e].width,fe[_e].height,0,He,Re,fe[_e].data);for(let N=0;N<Pe.length;N++){const Ae=Pe[N].image[_e].image;D?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+_e,N+1,0,0,Ae.width,Ae.height,He,Re,Ae.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+_e,N+1,be,Ae.width,Ae.height,0,He,Re,Ae.data)}}else{D?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+_e,0,0,0,He,Re,fe[_e]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+_e,0,be,He,Re,fe[_e]);for(let N=0;N<Pe.length;N++){const Ee=Pe[N];D?t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+_e,N+1,0,0,He,Re,Ee.image[_e]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+_e,N+1,be,He,Re,Ee.image[_e])}}}g(v,ze)&&S(n.TEXTURE_CUBE_MAP),te.__version=K.version,v.onUpdate&&v.onUpdate(v)}E.__version=v.version}function B(E,v,O,j,K,te){const Me=r.convert(O.format,O.colorSpace),me=r.convert(O.type),ve=M(O.internalFormat,Me,me,O.colorSpace);if(!i.get(v).__hasExternalTextures){const Le=Math.max(1,v.width>>te),fe=Math.max(1,v.height>>te);K===n.TEXTURE_3D||K===n.TEXTURE_2D_ARRAY?t.texImage3D(K,te,ve,Le,fe,v.depth,0,Me,me,null):t.texImage2D(K,te,ve,Le,fe,0,Me,me,null)}t.bindFramebuffer(n.FRAMEBUFFER,E),X(v)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,j,K,i.get(O).__webglTexture,0,H(v)):(K===n.TEXTURE_2D||K>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&K<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,j,K,i.get(O).__webglTexture,te),t.bindFramebuffer(n.FRAMEBUFFER,null)}function ue(E,v,O){if(n.bindRenderbuffer(n.RENDERBUFFER,E),v.depthBuffer&&!v.stencilBuffer){let j=o===!0?n.DEPTH_COMPONENT24:n.DEPTH_COMPONENT16;if(O||X(v)){const K=v.depthTexture;K&&K.isDepthTexture&&(K.type===Ci?j=n.DEPTH_COMPONENT32F:K.type===Ri&&(j=n.DEPTH_COMPONENT24));const te=H(v);X(v)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,te,j,v.width,v.height):n.renderbufferStorageMultisample(n.RENDERBUFFER,te,j,v.width,v.height)}else n.renderbufferStorage(n.RENDERBUFFER,j,v.width,v.height);n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.RENDERBUFFER,E)}else if(v.depthBuffer&&v.stencilBuffer){const j=H(v);O&&X(v)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,j,n.DEPTH24_STENCIL8,v.width,v.height):X(v)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,j,n.DEPTH24_STENCIL8,v.width,v.height):n.renderbufferStorage(n.RENDERBUFFER,n.DEPTH_STENCIL,v.width,v.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.RENDERBUFFER,E)}else{const j=v.isWebGLMultipleRenderTargets===!0?v.texture:[v.texture];for(let K=0;K<j.length;K++){const te=j[K],Me=r.convert(te.format,te.colorSpace),me=r.convert(te.type),ve=M(te.internalFormat,Me,me,te.colorSpace),we=H(v);O&&X(v)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,we,ve,v.width,v.height):X(v)?l.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,we,ve,v.width,v.height):n.renderbufferStorage(n.RENDERBUFFER,ve,v.width,v.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function re(E,v){if(v&&v.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(n.FRAMEBUFFER,E),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!i.get(v.depthTexture).__webglTexture||v.depthTexture.image.width!==v.width||v.depthTexture.image.height!==v.height)&&(v.depthTexture.image.width=v.width,v.depthTexture.image.height=v.height,v.depthTexture.needsUpdate=!0),G(v.depthTexture,0);const j=i.get(v.depthTexture).__webglTexture,K=H(v);if(v.depthTexture.format===ts)X(v)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,j,0,K):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,j,0);else if(v.depthTexture.format===Ws)X(v)?l.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,j,0,K):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,j,0);else throw new Error("Unknown depthTexture format")}function pe(E){const v=i.get(E),O=E.isWebGLCubeRenderTarget===!0;if(E.depthTexture&&!v.__autoAllocateDepthBuffer){if(O)throw new Error("target.depthTexture not supported in Cube render targets");re(v.__webglFramebuffer,E)}else if(O){v.__webglDepthbuffer=[];for(let j=0;j<6;j++)t.bindFramebuffer(n.FRAMEBUFFER,v.__webglFramebuffer[j]),v.__webglDepthbuffer[j]=n.createRenderbuffer(),ue(v.__webglDepthbuffer[j],E,!1)}else t.bindFramebuffer(n.FRAMEBUFFER,v.__webglFramebuffer),v.__webglDepthbuffer=n.createRenderbuffer(),ue(v.__webglDepthbuffer,E,!1);t.bindFramebuffer(n.FRAMEBUFFER,null)}function b(E,v,O){const j=i.get(E);v!==void 0&&B(j.__webglFramebuffer,E,E.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),O!==void 0&&pe(E)}function y(E){const v=E.texture,O=i.get(E),j=i.get(v);E.addEventListener("dispose",ie),E.isWebGLMultipleRenderTargets!==!0&&(j.__webglTexture===void 0&&(j.__webglTexture=n.createTexture()),j.__version=v.version,a.memory.textures++);const K=E.isWebGLCubeRenderTarget===!0,te=E.isWebGLMultipleRenderTargets===!0,Me=m(E)||o;if(K){O.__webglFramebuffer=[];for(let me=0;me<6;me++)if(o&&v.mipmaps&&v.mipmaps.length>0){O.__webglFramebuffer[me]=[];for(let ve=0;ve<v.mipmaps.length;ve++)O.__webglFramebuffer[me][ve]=n.createFramebuffer()}else O.__webglFramebuffer[me]=n.createFramebuffer()}else{if(o&&v.mipmaps&&v.mipmaps.length>0){O.__webglFramebuffer=[];for(let me=0;me<v.mipmaps.length;me++)O.__webglFramebuffer[me]=n.createFramebuffer()}else O.__webglFramebuffer=n.createFramebuffer();if(te)if(s.drawBuffers){const me=E.texture;for(let ve=0,we=me.length;ve<we;ve++){const Le=i.get(me[ve]);Le.__webglTexture===void 0&&(Le.__webglTexture=n.createTexture(),a.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(o&&E.samples>0&&X(E)===!1){const me=te?v:[v];O.__webglMultisampledFramebuffer=n.createFramebuffer(),O.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let ve=0;ve<me.length;ve++){const we=me[ve];O.__webglColorRenderbuffer[ve]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,O.__webglColorRenderbuffer[ve]);const Le=r.convert(we.format,we.colorSpace),fe=r.convert(we.type),je=M(we.internalFormat,Le,fe,we.colorSpace,E.isXRRenderTarget===!0),ze=H(E);n.renderbufferStorageMultisample(n.RENDERBUFFER,ze,je,E.width,E.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ve,n.RENDERBUFFER,O.__webglColorRenderbuffer[ve])}n.bindRenderbuffer(n.RENDERBUFFER,null),E.depthBuffer&&(O.__webglDepthRenderbuffer=n.createRenderbuffer(),ue(O.__webglDepthRenderbuffer,E,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(K){t.bindTexture(n.TEXTURE_CUBE_MAP,j.__webglTexture),ee(n.TEXTURE_CUBE_MAP,v,Me);for(let me=0;me<6;me++)if(o&&v.mipmaps&&v.mipmaps.length>0)for(let ve=0;ve<v.mipmaps.length;ve++)B(O.__webglFramebuffer[me][ve],E,v,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+me,ve);else B(O.__webglFramebuffer[me],E,v,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+me,0);g(v,Me)&&S(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(te){const me=E.texture;for(let ve=0,we=me.length;ve<we;ve++){const Le=me[ve],fe=i.get(Le);t.bindTexture(n.TEXTURE_2D,fe.__webglTexture),ee(n.TEXTURE_2D,Le,Me),B(O.__webglFramebuffer,E,Le,n.COLOR_ATTACHMENT0+ve,n.TEXTURE_2D,0),g(Le,Me)&&S(n.TEXTURE_2D)}t.unbindTexture()}else{let me=n.TEXTURE_2D;if((E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(o?me=E.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),t.bindTexture(me,j.__webglTexture),ee(me,v,Me),o&&v.mipmaps&&v.mipmaps.length>0)for(let ve=0;ve<v.mipmaps.length;ve++)B(O.__webglFramebuffer[ve],E,v,n.COLOR_ATTACHMENT0,me,ve);else B(O.__webglFramebuffer,E,v,n.COLOR_ATTACHMENT0,me,0);g(v,Me)&&S(me),t.unbindTexture()}E.depthBuffer&&pe(E)}function z(E){const v=m(E)||o,O=E.isWebGLMultipleRenderTargets===!0?E.texture:[E.texture];for(let j=0,K=O.length;j<K;j++){const te=O[j];if(g(te,v)){const Me=E.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:n.TEXTURE_2D,me=i.get(te).__webglTexture;t.bindTexture(Me,me),S(Me),t.unbindTexture()}}}function F(E){if(o&&E.samples>0&&X(E)===!1){const v=E.isWebGLMultipleRenderTargets?E.texture:[E.texture],O=E.width,j=E.height;let K=n.COLOR_BUFFER_BIT;const te=[],Me=E.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,me=i.get(E),ve=E.isWebGLMultipleRenderTargets===!0;if(ve)for(let we=0;we<v.length;we++)t.bindFramebuffer(n.FRAMEBUFFER,me.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+we,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,me.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+we,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,me.__webglMultisampledFramebuffer),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,me.__webglFramebuffer);for(let we=0;we<v.length;we++){te.push(n.COLOR_ATTACHMENT0+we),E.depthBuffer&&te.push(Me);const Le=me.__ignoreDepthValues!==void 0?me.__ignoreDepthValues:!1;if(Le===!1&&(E.depthBuffer&&(K|=n.DEPTH_BUFFER_BIT),E.stencilBuffer&&(K|=n.STENCIL_BUFFER_BIT)),ve&&n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,me.__webglColorRenderbuffer[we]),Le===!0&&(n.invalidateFramebuffer(n.READ_FRAMEBUFFER,[Me]),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[Me])),ve){const fe=i.get(v[we]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,fe,0)}n.blitFramebuffer(0,0,O,j,0,0,O,j,K,n.NEAREST),u&&n.invalidateFramebuffer(n.READ_FRAMEBUFFER,te)}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),ve)for(let we=0;we<v.length;we++){t.bindFramebuffer(n.FRAMEBUFFER,me.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+we,n.RENDERBUFFER,me.__webglColorRenderbuffer[we]);const Le=i.get(v[we]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,me.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+we,n.TEXTURE_2D,Le,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,me.__webglMultisampledFramebuffer)}}function H(E){return Math.min(s.maxSamples,E.samples)}function X(E){const v=i.get(E);return o&&E.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function le(E){const v=a.render.frame;c.get(E)!==v&&(c.set(E,v),E.update())}function oe(E,v){const O=E.colorSpace,j=E.format,K=E.type;return E.isCompressedTexture===!0||E.isVideoTexture===!0||E.format===wl||O!==gi&&O!==_n&&(lt.getTransfer(O)===pt?o===!1?e.has("EXT_sRGB")===!0&&j===An?(E.format=wl,E.minFilter=mn,E.generateMipmaps=!1):v=Oh.sRGBToLinear(v):(j!==An||K!==Ui)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",O)),v}this.allocateTextureUnit=U,this.resetTextureUnits=J,this.setTexture2D=G,this.setTexture2DArray=$,this.setTexture3D=Z,this.setTextureCube=ae,this.rebindTextures=b,this.setupRenderTarget=y,this.updateRenderTargetMipmap=z,this.updateMultisampleRenderTarget=F,this.setupDepthRenderbuffer=pe,this.setupFrameBufferTexture=B,this.useMultisampledRTT=X}function pE(n,e,t){const i=t.isWebGL2;function s(r,a=_n){let o;const l=lt.getTransfer(a);if(r===Ui)return n.UNSIGNED_BYTE;if(r===Ah)return n.UNSIGNED_SHORT_4_4_4_4;if(r===wh)return n.UNSIGNED_SHORT_5_5_5_1;if(r===K0)return n.BYTE;if(r===$0)return n.SHORT;if(r===Jl)return n.UNSIGNED_SHORT;if(r===Th)return n.INT;if(r===Ri)return n.UNSIGNED_INT;if(r===Ci)return n.FLOAT;if(r===wr)return i?n.HALF_FLOAT:(o=e.get("OES_texture_half_float"),o!==null?o.HALF_FLOAT_OES:null);if(r===Z0)return n.ALPHA;if(r===An)return n.RGBA;if(r===J0)return n.LUMINANCE;if(r===Q0)return n.LUMINANCE_ALPHA;if(r===ts)return n.DEPTH_COMPONENT;if(r===Ws)return n.DEPTH_STENCIL;if(r===wl)return o=e.get("EXT_sRGB"),o!==null?o.SRGB_ALPHA_EXT:null;if(r===ev)return n.RED;if(r===Rh)return n.RED_INTEGER;if(r===tv)return n.RG;if(r===Ch)return n.RG_INTEGER;if(r===Ph)return n.RGBA_INTEGER;if(r===Aa||r===wa||r===Ra||r===Ca)if(l===pt)if(o=e.get("WEBGL_compressed_texture_s3tc_srgb"),o!==null){if(r===Aa)return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(r===wa)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(r===Ra)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(r===Ca)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(o=e.get("WEBGL_compressed_texture_s3tc"),o!==null){if(r===Aa)return o.COMPRESSED_RGB_S3TC_DXT1_EXT;if(r===wa)return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(r===Ra)return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(r===Ca)return o.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(r===mu||r===gu||r===_u||r===vu)if(o=e.get("WEBGL_compressed_texture_pvrtc"),o!==null){if(r===mu)return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(r===gu)return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(r===_u)return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(r===vu)return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(r===Lh)return o=e.get("WEBGL_compressed_texture_etc1"),o!==null?o.COMPRESSED_RGB_ETC1_WEBGL:null;if(r===xu||r===Mu)if(o=e.get("WEBGL_compressed_texture_etc"),o!==null){if(r===xu)return l===pt?o.COMPRESSED_SRGB8_ETC2:o.COMPRESSED_RGB8_ETC2;if(r===Mu)return l===pt?o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:o.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(r===Su||r===yu||r===Eu||r===bu||r===Tu||r===Au||r===wu||r===Ru||r===Cu||r===Pu||r===Lu||r===Du||r===Iu||r===Uu)if(o=e.get("WEBGL_compressed_texture_astc"),o!==null){if(r===Su)return l===pt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:o.COMPRESSED_RGBA_ASTC_4x4_KHR;if(r===yu)return l===pt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:o.COMPRESSED_RGBA_ASTC_5x4_KHR;if(r===Eu)return l===pt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:o.COMPRESSED_RGBA_ASTC_5x5_KHR;if(r===bu)return l===pt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:o.COMPRESSED_RGBA_ASTC_6x5_KHR;if(r===Tu)return l===pt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:o.COMPRESSED_RGBA_ASTC_6x6_KHR;if(r===Au)return l===pt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:o.COMPRESSED_RGBA_ASTC_8x5_KHR;if(r===wu)return l===pt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:o.COMPRESSED_RGBA_ASTC_8x6_KHR;if(r===Ru)return l===pt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:o.COMPRESSED_RGBA_ASTC_8x8_KHR;if(r===Cu)return l===pt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:o.COMPRESSED_RGBA_ASTC_10x5_KHR;if(r===Pu)return l===pt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:o.COMPRESSED_RGBA_ASTC_10x6_KHR;if(r===Lu)return l===pt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:o.COMPRESSED_RGBA_ASTC_10x8_KHR;if(r===Du)return l===pt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:o.COMPRESSED_RGBA_ASTC_10x10_KHR;if(r===Iu)return l===pt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:o.COMPRESSED_RGBA_ASTC_12x10_KHR;if(r===Uu)return l===pt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:o.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(r===Pa||r===Nu||r===Ou)if(o=e.get("EXT_texture_compression_bptc"),o!==null){if(r===Pa)return l===pt?o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:o.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(r===Nu)return o.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(r===Ou)return o.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(r===nv||r===Fu||r===Bu||r===zu)if(o=e.get("EXT_texture_compression_rgtc"),o!==null){if(r===Pa)return o.COMPRESSED_RED_RGTC1_EXT;if(r===Fu)return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(r===Bu)return o.COMPRESSED_RED_GREEN_RGTC2_EXT;if(r===zu)return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return r===es?i?n.UNSIGNED_INT_24_8:(o=e.get("WEBGL_depth_texture"),o!==null?o.UNSIGNED_INT_24_8_WEBGL:null):n[r]!==void 0?n[r]:null}return{convert:s}}class mE extends gn{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class Us extends Pt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const gE={type:"move"};class el{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Us,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Us,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new W,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new W),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Us,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new W,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new W),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let s=null,r=null,a=null;const o=this._targetRay,l=this._grip,u=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(u&&e.hand){a=!0;for(const _ of e.hand.values()){const m=t.getJointPose(_,i),h=this._getHandJoint(u,_);m!==null&&(h.matrix.fromArray(m.transform.matrix),h.matrix.decompose(h.position,h.rotation,h.scale),h.matrixWorldNeedsUpdate=!0,h.jointRadius=m.radius),h.visible=m!==null}const c=u.joints["index-finger-tip"],f=u.joints["thumb-tip"],d=c.position.distanceTo(f.position),p=.02,x=.005;u.inputState.pinching&&d>p+x?(u.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!u.inputState.pinching&&d<=p-x&&(u.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,i),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(s=t.getPose(e.targetRaySpace,i),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(gE)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),u!==null&&(u.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const i=new Us;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}}class _E extends cs{constructor(e,t){super();const i=this;let s=null,r=1,a=null,o="local-floor",l=1,u=null,c=null,f=null,d=null,p=null,x=null;const _=t.getContextAttributes();let m=null,h=null;const g=[],S=[],M=new Xe;let I=null;const L=new gn;L.layers.enable(1),L.viewport=new Ot;const C=new gn;C.layers.enable(2),C.viewport=new Ot;const ie=[L,C],A=new mE;A.layers.enable(1),A.layers.enable(2);let T=null,R=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(ee){let Y=g[ee];return Y===void 0&&(Y=new el,g[ee]=Y),Y.getTargetRaySpace()},this.getControllerGrip=function(ee){let Y=g[ee];return Y===void 0&&(Y=new el,g[ee]=Y),Y.getGripSpace()},this.getHand=function(ee){let Y=g[ee];return Y===void 0&&(Y=new el,g[ee]=Y),Y.getHandSpace()};function k(ee){const Y=S.indexOf(ee.inputSource);if(Y===-1)return;const ge=g[Y];ge!==void 0&&(ge.update(ee.inputSource,ee.frame,u||a),ge.dispatchEvent({type:ee.type,data:ee.inputSource}))}function J(){s.removeEventListener("select",k),s.removeEventListener("selectstart",k),s.removeEventListener("selectend",k),s.removeEventListener("squeeze",k),s.removeEventListener("squeezestart",k),s.removeEventListener("squeezeend",k),s.removeEventListener("end",J),s.removeEventListener("inputsourceschange",U);for(let ee=0;ee<g.length;ee++){const Y=S[ee];Y!==null&&(S[ee]=null,g[ee].disconnect(Y))}T=null,R=null,e.setRenderTarget(m),p=null,d=null,f=null,s=null,h=null,he.stop(),i.isPresenting=!1,e.setPixelRatio(I),e.setSize(M.width,M.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(ee){r=ee,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(ee){o=ee,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return u||a},this.setReferenceSpace=function(ee){u=ee},this.getBaseLayer=function(){return d!==null?d:p},this.getBinding=function(){return f},this.getFrame=function(){return x},this.getSession=function(){return s},this.setSession=async function(ee){if(s=ee,s!==null){if(m=e.getRenderTarget(),s.addEventListener("select",k),s.addEventListener("selectstart",k),s.addEventListener("selectend",k),s.addEventListener("squeeze",k),s.addEventListener("squeezestart",k),s.addEventListener("squeezeend",k),s.addEventListener("end",J),s.addEventListener("inputsourceschange",U),_.xrCompatible!==!0&&await t.makeXRCompatible(),I=e.getPixelRatio(),e.getSize(M),s.renderState.layers===void 0||e.capabilities.isWebGL2===!1){const Y={antialias:s.renderState.layers===void 0?_.antialias:!0,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:r};p=new XRWebGLLayer(s,t,Y),s.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),h=new is(p.framebufferWidth,p.framebufferHeight,{format:An,type:Ui,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil})}else{let Y=null,ge=null,ye=null;_.depth&&(ye=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Y=_.stencil?Ws:ts,ge=_.stencil?es:Ri);const B={colorFormat:t.RGBA8,depthFormat:ye,scaleFactor:r};f=new XRWebGLBinding(s,t),d=f.createProjectionLayer(B),s.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),h=new is(d.textureWidth,d.textureHeight,{format:An,type:Ui,depthTexture:new Yh(d.textureWidth,d.textureHeight,ge,void 0,void 0,void 0,void 0,void 0,void 0,Y),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0});const ue=e.properties.get(h);ue.__ignoreDepthValues=d.ignoreDepthValues}h.isXRRenderTarget=!0,this.setFoveation(l),u=null,a=await s.requestReferenceSpace(o),he.setContext(s),he.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode};function U(ee){for(let Y=0;Y<ee.removed.length;Y++){const ge=ee.removed[Y],ye=S.indexOf(ge);ye>=0&&(S[ye]=null,g[ye].disconnect(ge))}for(let Y=0;Y<ee.added.length;Y++){const ge=ee.added[Y];let ye=S.indexOf(ge);if(ye===-1){for(let ue=0;ue<g.length;ue++)if(ue>=S.length){S.push(ge),ye=ue;break}else if(S[ue]===null){S[ue]=ge,ye=ue;break}if(ye===-1)break}const B=g[ye];B&&B.connect(ge)}}const V=new W,G=new W;function $(ee,Y,ge){V.setFromMatrixPosition(Y.matrixWorld),G.setFromMatrixPosition(ge.matrixWorld);const ye=V.distanceTo(G),B=Y.projectionMatrix.elements,ue=ge.projectionMatrix.elements,re=B[14]/(B[10]-1),pe=B[14]/(B[10]+1),b=(B[9]+1)/B[5],y=(B[9]-1)/B[5],z=(B[8]-1)/B[0],F=(ue[8]+1)/ue[0],H=re*z,X=re*F,le=ye/(-z+F),oe=le*-z;Y.matrixWorld.decompose(ee.position,ee.quaternion,ee.scale),ee.translateX(oe),ee.translateZ(le),ee.matrixWorld.compose(ee.position,ee.quaternion,ee.scale),ee.matrixWorldInverse.copy(ee.matrixWorld).invert();const E=re+le,v=pe+le,O=H-oe,j=X+(ye-oe),K=b*pe/v*E,te=y*pe/v*E;ee.projectionMatrix.makePerspective(O,j,K,te,E,v),ee.projectionMatrixInverse.copy(ee.projectionMatrix).invert()}function Z(ee,Y){Y===null?ee.matrixWorld.copy(ee.matrix):ee.matrixWorld.multiplyMatrices(Y.matrixWorld,ee.matrix),ee.matrixWorldInverse.copy(ee.matrixWorld).invert()}this.updateCamera=function(ee){if(s===null)return;A.near=C.near=L.near=ee.near,A.far=C.far=L.far=ee.far,(T!==A.near||R!==A.far)&&(s.updateRenderState({depthNear:A.near,depthFar:A.far}),T=A.near,R=A.far);const Y=ee.parent,ge=A.cameras;Z(A,Y);for(let ye=0;ye<ge.length;ye++)Z(ge[ye],Y);ge.length===2?$(A,L,C):A.projectionMatrix.copy(L.projectionMatrix),ae(ee,A,Y)};function ae(ee,Y,ge){ge===null?ee.matrix.copy(Y.matrixWorld):(ee.matrix.copy(ge.matrixWorld),ee.matrix.invert(),ee.matrix.multiply(Y.matrixWorld)),ee.matrix.decompose(ee.position,ee.quaternion,ee.scale),ee.updateMatrixWorld(!0),ee.projectionMatrix.copy(Y.projectionMatrix),ee.projectionMatrixInverse.copy(Y.projectionMatrixInverse),ee.isPerspectiveCamera&&(ee.fov=Rl*2*Math.atan(1/ee.projectionMatrix.elements[5]),ee.zoom=1)}this.getCamera=function(){return A},this.getFoveation=function(){if(!(d===null&&p===null))return l},this.setFoveation=function(ee){l=ee,d!==null&&(d.fixedFoveation=ee),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=ee)};let ce=null;function de(ee,Y){if(c=Y.getViewerPose(u||a),x=Y,c!==null){const ge=c.views;p!==null&&(e.setRenderTargetFramebuffer(h,p.framebuffer),e.setRenderTarget(h));let ye=!1;ge.length!==A.cameras.length&&(A.cameras.length=0,ye=!0);for(let B=0;B<ge.length;B++){const ue=ge[B];let re=null;if(p!==null)re=p.getViewport(ue);else{const b=f.getViewSubImage(d,ue);re=b.viewport,B===0&&(e.setRenderTargetTextures(h,b.colorTexture,d.ignoreDepthValues?void 0:b.depthStencilTexture),e.setRenderTarget(h))}let pe=ie[B];pe===void 0&&(pe=new gn,pe.layers.enable(B),pe.viewport=new Ot,ie[B]=pe),pe.matrix.fromArray(ue.transform.matrix),pe.matrix.decompose(pe.position,pe.quaternion,pe.scale),pe.projectionMatrix.fromArray(ue.projectionMatrix),pe.projectionMatrixInverse.copy(pe.projectionMatrix).invert(),pe.viewport.set(re.x,re.y,re.width,re.height),B===0&&(A.matrix.copy(pe.matrix),A.matrix.decompose(A.position,A.quaternion,A.scale)),ye===!0&&A.cameras.push(pe)}}for(let ge=0;ge<g.length;ge++){const ye=S[ge],B=g[ge];ye!==null&&B!==void 0&&B.update(ye,Y,u||a)}ce&&ce(ee,Y),Y.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:Y}),x=null}const he=new jh;he.setAnimationLoop(de),this.setAnimationLoop=function(ee){ce=ee},this.dispose=function(){}}}function vE(n,e){function t(m,h){m.matrixAutoUpdate===!0&&m.updateMatrix(),h.value.copy(m.matrix)}function i(m,h){h.color.getRGB(m.fogColor.value,kh(n)),h.isFog?(m.fogNear.value=h.near,m.fogFar.value=h.far):h.isFogExp2&&(m.fogDensity.value=h.density)}function s(m,h,g,S,M){h.isMeshBasicMaterial||h.isMeshLambertMaterial?r(m,h):h.isMeshToonMaterial?(r(m,h),f(m,h)):h.isMeshPhongMaterial?(r(m,h),c(m,h)):h.isMeshStandardMaterial?(r(m,h),d(m,h),h.isMeshPhysicalMaterial&&p(m,h,M)):h.isMeshMatcapMaterial?(r(m,h),x(m,h)):h.isMeshDepthMaterial?r(m,h):h.isMeshDistanceMaterial?(r(m,h),_(m,h)):h.isMeshNormalMaterial?r(m,h):h.isLineBasicMaterial?(a(m,h),h.isLineDashedMaterial&&o(m,h)):h.isPointsMaterial?l(m,h,g,S):h.isSpriteMaterial?u(m,h):h.isShadowMaterial?(m.color.value.copy(h.color),m.opacity.value=h.opacity):h.isShaderMaterial&&(h.uniformsNeedUpdate=!1)}function r(m,h){m.opacity.value=h.opacity,h.color&&m.diffuse.value.copy(h.color),h.emissive&&m.emissive.value.copy(h.emissive).multiplyScalar(h.emissiveIntensity),h.map&&(m.map.value=h.map,t(h.map,m.mapTransform)),h.alphaMap&&(m.alphaMap.value=h.alphaMap,t(h.alphaMap,m.alphaMapTransform)),h.bumpMap&&(m.bumpMap.value=h.bumpMap,t(h.bumpMap,m.bumpMapTransform),m.bumpScale.value=h.bumpScale,h.side===rn&&(m.bumpScale.value*=-1)),h.normalMap&&(m.normalMap.value=h.normalMap,t(h.normalMap,m.normalMapTransform),m.normalScale.value.copy(h.normalScale),h.side===rn&&m.normalScale.value.negate()),h.displacementMap&&(m.displacementMap.value=h.displacementMap,t(h.displacementMap,m.displacementMapTransform),m.displacementScale.value=h.displacementScale,m.displacementBias.value=h.displacementBias),h.emissiveMap&&(m.emissiveMap.value=h.emissiveMap,t(h.emissiveMap,m.emissiveMapTransform)),h.specularMap&&(m.specularMap.value=h.specularMap,t(h.specularMap,m.specularMapTransform)),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest);const g=e.get(h).envMap;if(g&&(m.envMap.value=g,m.flipEnvMap.value=g.isCubeTexture&&g.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=h.reflectivity,m.ior.value=h.ior,m.refractionRatio.value=h.refractionRatio),h.lightMap){m.lightMap.value=h.lightMap;const S=n._useLegacyLights===!0?Math.PI:1;m.lightMapIntensity.value=h.lightMapIntensity*S,t(h.lightMap,m.lightMapTransform)}h.aoMap&&(m.aoMap.value=h.aoMap,m.aoMapIntensity.value=h.aoMapIntensity,t(h.aoMap,m.aoMapTransform))}function a(m,h){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity,h.map&&(m.map.value=h.map,t(h.map,m.mapTransform))}function o(m,h){m.dashSize.value=h.dashSize,m.totalSize.value=h.dashSize+h.gapSize,m.scale.value=h.scale}function l(m,h,g,S){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity,m.size.value=h.size*g,m.scale.value=S*.5,h.map&&(m.map.value=h.map,t(h.map,m.uvTransform)),h.alphaMap&&(m.alphaMap.value=h.alphaMap,t(h.alphaMap,m.alphaMapTransform)),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest)}function u(m,h){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity,m.rotation.value=h.rotation,h.map&&(m.map.value=h.map,t(h.map,m.mapTransform)),h.alphaMap&&(m.alphaMap.value=h.alphaMap,t(h.alphaMap,m.alphaMapTransform)),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest)}function c(m,h){m.specular.value.copy(h.specular),m.shininess.value=Math.max(h.shininess,1e-4)}function f(m,h){h.gradientMap&&(m.gradientMap.value=h.gradientMap)}function d(m,h){m.metalness.value=h.metalness,h.metalnessMap&&(m.metalnessMap.value=h.metalnessMap,t(h.metalnessMap,m.metalnessMapTransform)),m.roughness.value=h.roughness,h.roughnessMap&&(m.roughnessMap.value=h.roughnessMap,t(h.roughnessMap,m.roughnessMapTransform)),e.get(h).envMap&&(m.envMapIntensity.value=h.envMapIntensity)}function p(m,h,g){m.ior.value=h.ior,h.sheen>0&&(m.sheenColor.value.copy(h.sheenColor).multiplyScalar(h.sheen),m.sheenRoughness.value=h.sheenRoughness,h.sheenColorMap&&(m.sheenColorMap.value=h.sheenColorMap,t(h.sheenColorMap,m.sheenColorMapTransform)),h.sheenRoughnessMap&&(m.sheenRoughnessMap.value=h.sheenRoughnessMap,t(h.sheenRoughnessMap,m.sheenRoughnessMapTransform))),h.clearcoat>0&&(m.clearcoat.value=h.clearcoat,m.clearcoatRoughness.value=h.clearcoatRoughness,h.clearcoatMap&&(m.clearcoatMap.value=h.clearcoatMap,t(h.clearcoatMap,m.clearcoatMapTransform)),h.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=h.clearcoatRoughnessMap,t(h.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),h.clearcoatNormalMap&&(m.clearcoatNormalMap.value=h.clearcoatNormalMap,t(h.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(h.clearcoatNormalScale),h.side===rn&&m.clearcoatNormalScale.value.negate())),h.iridescence>0&&(m.iridescence.value=h.iridescence,m.iridescenceIOR.value=h.iridescenceIOR,m.iridescenceThicknessMinimum.value=h.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=h.iridescenceThicknessRange[1],h.iridescenceMap&&(m.iridescenceMap.value=h.iridescenceMap,t(h.iridescenceMap,m.iridescenceMapTransform)),h.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=h.iridescenceThicknessMap,t(h.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),h.transmission>0&&(m.transmission.value=h.transmission,m.transmissionSamplerMap.value=g.texture,m.transmissionSamplerSize.value.set(g.width,g.height),h.transmissionMap&&(m.transmissionMap.value=h.transmissionMap,t(h.transmissionMap,m.transmissionMapTransform)),m.thickness.value=h.thickness,h.thicknessMap&&(m.thicknessMap.value=h.thicknessMap,t(h.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=h.attenuationDistance,m.attenuationColor.value.copy(h.attenuationColor)),h.anisotropy>0&&(m.anisotropyVector.value.set(h.anisotropy*Math.cos(h.anisotropyRotation),h.anisotropy*Math.sin(h.anisotropyRotation)),h.anisotropyMap&&(m.anisotropyMap.value=h.anisotropyMap,t(h.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=h.specularIntensity,m.specularColor.value.copy(h.specularColor),h.specularColorMap&&(m.specularColorMap.value=h.specularColorMap,t(h.specularColorMap,m.specularColorMapTransform)),h.specularIntensityMap&&(m.specularIntensityMap.value=h.specularIntensityMap,t(h.specularIntensityMap,m.specularIntensityMapTransform))}function x(m,h){h.matcap&&(m.matcap.value=h.matcap)}function _(m,h){const g=e.get(h).light;m.referencePosition.value.setFromMatrixPosition(g.matrixWorld),m.nearDistance.value=g.shadow.camera.near,m.farDistance.value=g.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function xE(n,e,t,i){let s={},r={},a=[];const o=t.isWebGL2?n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS):0;function l(g,S){const M=S.program;i.uniformBlockBinding(g,M)}function u(g,S){let M=s[g.id];M===void 0&&(x(g),M=c(g),s[g.id]=M,g.addEventListener("dispose",m));const I=S.program;i.updateUBOMapping(g,I);const L=e.render.frame;r[g.id]!==L&&(d(g),r[g.id]=L)}function c(g){const S=f();g.__bindingPointIndex=S;const M=n.createBuffer(),I=g.__size,L=g.usage;return n.bindBuffer(n.UNIFORM_BUFFER,M),n.bufferData(n.UNIFORM_BUFFER,I,L),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,S,M),M}function f(){for(let g=0;g<o;g++)if(a.indexOf(g)===-1)return a.push(g),g;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(g){const S=s[g.id],M=g.uniforms,I=g.__cache;n.bindBuffer(n.UNIFORM_BUFFER,S);for(let L=0,C=M.length;L<C;L++){const ie=Array.isArray(M[L])?M[L]:[M[L]];for(let A=0,T=ie.length;A<T;A++){const R=ie[A];if(p(R,L,A,I)===!0){const k=R.__offset,J=Array.isArray(R.value)?R.value:[R.value];let U=0;for(let V=0;V<J.length;V++){const G=J[V],$=_(G);typeof G=="number"||typeof G=="boolean"?(R.__data[0]=G,n.bufferSubData(n.UNIFORM_BUFFER,k+U,R.__data)):G.isMatrix3?(R.__data[0]=G.elements[0],R.__data[1]=G.elements[1],R.__data[2]=G.elements[2],R.__data[3]=0,R.__data[4]=G.elements[3],R.__data[5]=G.elements[4],R.__data[6]=G.elements[5],R.__data[7]=0,R.__data[8]=G.elements[6],R.__data[9]=G.elements[7],R.__data[10]=G.elements[8],R.__data[11]=0):(G.toArray(R.__data,U),U+=$.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,k,R.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function p(g,S,M,I){const L=g.value,C=S+"_"+M;if(I[C]===void 0)return typeof L=="number"||typeof L=="boolean"?I[C]=L:I[C]=L.clone(),!0;{const ie=I[C];if(typeof L=="number"||typeof L=="boolean"){if(ie!==L)return I[C]=L,!0}else if(ie.equals(L)===!1)return ie.copy(L),!0}return!1}function x(g){const S=g.uniforms;let M=0;const I=16;for(let C=0,ie=S.length;C<ie;C++){const A=Array.isArray(S[C])?S[C]:[S[C]];for(let T=0,R=A.length;T<R;T++){const k=A[T],J=Array.isArray(k.value)?k.value:[k.value];for(let U=0,V=J.length;U<V;U++){const G=J[U],$=_(G),Z=M%I;Z!==0&&I-Z<$.boundary&&(M+=I-Z),k.__data=new Float32Array($.storage/Float32Array.BYTES_PER_ELEMENT),k.__offset=M,M+=$.storage}}}const L=M%I;return L>0&&(M+=I-L),g.__size=M,g.__cache={},this}function _(g){const S={boundary:0,storage:0};return typeof g=="number"||typeof g=="boolean"?(S.boundary=4,S.storage=4):g.isVector2?(S.boundary=8,S.storage=8):g.isVector3||g.isColor?(S.boundary=16,S.storage=12):g.isVector4?(S.boundary=16,S.storage=16):g.isMatrix3?(S.boundary=48,S.storage=48):g.isMatrix4?(S.boundary=64,S.storage=64):g.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",g),S}function m(g){const S=g.target;S.removeEventListener("dispose",m);const M=a.indexOf(S.__bindingPointIndex);a.splice(M,1),n.deleteBuffer(s[S.id]),delete s[S.id],delete r[S.id]}function h(){for(const g in s)n.deleteBuffer(s[g]);a=[],s={},r={}}return{bind:l,update:u,dispose:h}}class ep{constructor(e={}){const{canvas:t=mv(),context:i=null,depth:s=!0,stencil:r=!0,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:u=!1,powerPreference:c="default",failIfMajorPerformanceCaveat:f=!1}=e;this.isWebGLRenderer=!0;let d;i!==null?d=i.getContextAttributes().alpha:d=a;const p=new Uint32Array(4),x=new Int32Array(4);let _=null,m=null;const h=[],g=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=zt,this._useLegacyLights=!1,this.toneMapping=Ii,this.toneMappingExposure=1;const S=this;let M=!1,I=0,L=0,C=null,ie=-1,A=null;const T=new Ot,R=new Ot;let k=null;const J=new nt(0);let U=0,V=t.width,G=t.height,$=1,Z=null,ae=null;const ce=new Ot(0,0,V,G),de=new Ot(0,0,V,G);let he=!1;const ee=new nc;let Y=!1,ge=!1,ye=null;const B=new Rt,ue=new Xe,re=new W,pe={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function b(){return C===null?$:1}let y=i;function z(w,q){for(let ne=0;ne<w.length;ne++){const se=w[ne],Q=t.getContext(se,q);if(Q!==null)return Q}return null}try{const w={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:u,powerPreference:c,failIfMajorPerformanceCaveat:f};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Zl}`),t.addEventListener("webglcontextlost",_e,!1),t.addEventListener("webglcontextrestored",N,!1),t.addEventListener("webglcontextcreationerror",Ee,!1),y===null){const q=["webgl2","webgl","experimental-webgl"];if(S.isWebGL1Renderer===!0&&q.shift(),y=z(q,w),y===null)throw z(q)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext<"u"&&y instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),y.getShaderPrecisionFormat===void 0&&(y.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(w){throw console.error("THREE.WebGLRenderer: "+w.message),w}let F,H,X,le,oe,E,v,O,j,K,te,Me,me,ve,we,Le,fe,je,ze,He,Re,be,D,Se;function De(){F=new CS(y),H=new ES(y,F,e),F.init(H),be=new pE(y,F,H),X=new dE(y,F,H),le=new DS(y),oe=new Jy,E=new hE(y,F,X,oe,H,be,le),v=new TS(S),O=new RS(S),j=new Hv(y,H),D=new SS(y,F,j,H),K=new PS(y,j,le,D),te=new OS(y,K,j,le),ze=new NS(y,H,E),Le=new bS(oe),Me=new Zy(S,v,O,F,H,D,Le),me=new vE(S,oe),ve=new eE,we=new oE(F,H),je=new MS(S,v,O,X,te,d,l),fe=new fE(S,te,H),Se=new xE(y,le,H,X),He=new yS(y,F,le,H),Re=new LS(y,F,le,H),le.programs=Me.programs,S.capabilities=H,S.extensions=F,S.properties=oe,S.renderLists=ve,S.shadowMap=fe,S.state=X,S.info=le}De();const Pe=new _E(S,y);this.xr=Pe,this.getContext=function(){return y},this.getContextAttributes=function(){return y.getContextAttributes()},this.forceContextLoss=function(){const w=F.get("WEBGL_lose_context");w&&w.loseContext()},this.forceContextRestore=function(){const w=F.get("WEBGL_lose_context");w&&w.restoreContext()},this.getPixelRatio=function(){return $},this.setPixelRatio=function(w){w!==void 0&&($=w,this.setSize(V,G,!1))},this.getSize=function(w){return w.set(V,G)},this.setSize=function(w,q,ne=!0){if(Pe.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}V=w,G=q,t.width=Math.floor(w*$),t.height=Math.floor(q*$),ne===!0&&(t.style.width=w+"px",t.style.height=q+"px"),this.setViewport(0,0,w,q)},this.getDrawingBufferSize=function(w){return w.set(V*$,G*$).floor()},this.setDrawingBufferSize=function(w,q,ne){V=w,G=q,$=ne,t.width=Math.floor(w*ne),t.height=Math.floor(q*ne),this.setViewport(0,0,w,q)},this.getCurrentViewport=function(w){return w.copy(T)},this.getViewport=function(w){return w.copy(ce)},this.setViewport=function(w,q,ne,se){w.isVector4?ce.set(w.x,w.y,w.z,w.w):ce.set(w,q,ne,se),X.viewport(T.copy(ce).multiplyScalar($).floor())},this.getScissor=function(w){return w.copy(de)},this.setScissor=function(w,q,ne,se){w.isVector4?de.set(w.x,w.y,w.z,w.w):de.set(w,q,ne,se),X.scissor(R.copy(de).multiplyScalar($).floor())},this.getScissorTest=function(){return he},this.setScissorTest=function(w){X.setScissorTest(he=w)},this.setOpaqueSort=function(w){Z=w},this.setTransparentSort=function(w){ae=w},this.getClearColor=function(w){return w.copy(je.getClearColor())},this.setClearColor=function(){je.setClearColor.apply(je,arguments)},this.getClearAlpha=function(){return je.getClearAlpha()},this.setClearAlpha=function(){je.setClearAlpha.apply(je,arguments)},this.clear=function(w=!0,q=!0,ne=!0){let se=0;if(w){let Q=!1;if(C!==null){const Ce=C.texture.format;Q=Ce===Ph||Ce===Ch||Ce===Rh}if(Q){const Ce=C.texture.type,Ie=Ce===Ui||Ce===Ri||Ce===Jl||Ce===es||Ce===Ah||Ce===wh,Ge=je.getClearColor(),ke=je.getClearAlpha(),$e=Ge.r,qe=Ge.g,Ye=Ge.b;Ie?(p[0]=$e,p[1]=qe,p[2]=Ye,p[3]=ke,y.clearBufferuiv(y.COLOR,0,p)):(x[0]=$e,x[1]=qe,x[2]=Ye,x[3]=ke,y.clearBufferiv(y.COLOR,0,x))}else se|=y.COLOR_BUFFER_BIT}q&&(se|=y.DEPTH_BUFFER_BIT),ne&&(se|=y.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),y.clear(se)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",_e,!1),t.removeEventListener("webglcontextrestored",N,!1),t.removeEventListener("webglcontextcreationerror",Ee,!1),ve.dispose(),we.dispose(),oe.dispose(),v.dispose(),O.dispose(),te.dispose(),D.dispose(),Se.dispose(),Me.dispose(),Pe.dispose(),Pe.removeEventListener("sessionstart",yt),Pe.removeEventListener("sessionend",it),ye&&(ye.dispose(),ye=null),At.stop()};function _e(w){w.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),M=!0}function N(){console.log("THREE.WebGLRenderer: Context Restored."),M=!1;const w=le.autoReset,q=fe.enabled,ne=fe.autoUpdate,se=fe.needsUpdate,Q=fe.type;De(),le.autoReset=w,fe.enabled=q,fe.autoUpdate=ne,fe.needsUpdate=se,fe.type=Q}function Ee(w){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",w.statusMessage)}function Ae(w){const q=w.target;q.removeEventListener("dispose",Ae),Ve(q)}function Ve(w){Fe(w),oe.remove(w)}function Fe(w){const q=oe.get(w).programs;q!==void 0&&(q.forEach(function(ne){Me.releaseProgram(ne)}),w.isShaderMaterial&&Me.releaseShaderCache(w))}this.renderBufferDirect=function(w,q,ne,se,Q,Ce){q===null&&(q=pe);const Ie=Q.isMesh&&Q.matrixWorld.determinant()<0,Ge=sp(w,q,ne,se,Q);X.setMaterial(se,Ie);let ke=ne.index,$e=1;if(se.wireframe===!0){if(ke=K.getWireframeAttribute(ne),ke===void 0)return;$e=2}const qe=ne.drawRange,Ye=ne.attributes.position;let Et=qe.start*$e,on=(qe.start+qe.count)*$e;Ce!==null&&(Et=Math.max(Et,Ce.start*$e),on=Math.min(on,(Ce.start+Ce.count)*$e)),ke!==null?(Et=Math.max(Et,0),on=Math.min(on,ke.count)):Ye!=null&&(Et=Math.max(Et,0),on=Math.min(on,Ye.count));const Ut=on-Et;if(Ut<0||Ut===1/0)return;D.setup(Q,se,Ge,ne,ke);let $n,gt=He;if(ke!==null&&($n=j.get(ke),gt=Re,gt.setIndex($n)),Q.isMesh)se.wireframe===!0?(X.setLineWidth(se.wireframeLinewidth*b()),gt.setMode(y.LINES)):gt.setMode(y.TRIANGLES);else if(Q.isLine){let Ze=se.linewidth;Ze===void 0&&(Ze=1),X.setLineWidth(Ze*b()),Q.isLineSegments?gt.setMode(y.LINES):Q.isLineLoop?gt.setMode(y.LINE_LOOP):gt.setMode(y.LINE_STRIP)}else Q.isPoints?gt.setMode(y.POINTS):Q.isSprite&&gt.setMode(y.TRIANGLES);if(Q.isBatchedMesh)gt.renderMultiDraw(Q._multiDrawStarts,Q._multiDrawCounts,Q._multiDrawCount);else if(Q.isInstancedMesh)gt.renderInstances(Et,Ut,Q.count);else if(ne.isInstancedBufferGeometry){const Ze=ne._maxInstanceCount!==void 0?ne._maxInstanceCount:1/0,ia=Math.min(ne.instanceCount,Ze);gt.renderInstances(Et,Ut,ia)}else gt.render(Et,Ut)};function et(w,q,ne){w.transparent===!0&&w.side===ci&&w.forceSinglePass===!1?(w.side=rn,w.needsUpdate=!0,Or(w,q,ne),w.side=Oi,w.needsUpdate=!0,Or(w,q,ne),w.side=ci):Or(w,q,ne)}this.compile=function(w,q,ne=null){ne===null&&(ne=w),m=we.get(ne),m.init(),g.push(m),ne.traverseVisible(function(Q){Q.isLight&&Q.layers.test(q.layers)&&(m.pushLight(Q),Q.castShadow&&m.pushShadow(Q))}),w!==ne&&w.traverseVisible(function(Q){Q.isLight&&Q.layers.test(q.layers)&&(m.pushLight(Q),Q.castShadow&&m.pushShadow(Q))}),m.setupLights(S._useLegacyLights);const se=new Set;return w.traverse(function(Q){const Ce=Q.material;if(Ce)if(Array.isArray(Ce))for(let Ie=0;Ie<Ce.length;Ie++){const Ge=Ce[Ie];et(Ge,ne,Q),se.add(Ge)}else et(Ce,ne,Q),se.add(Ce)}),g.pop(),m=null,se},this.compileAsync=function(w,q,ne=null){const se=this.compile(w,q,ne);return new Promise(Q=>{function Ce(){if(se.forEach(function(Ie){oe.get(Ie).currentProgram.isReady()&&se.delete(Ie)}),se.size===0){Q(w);return}setTimeout(Ce,10)}F.get("KHR_parallel_shader_compile")!==null?Ce():setTimeout(Ce,10)})};let tt=null;function vt(w){tt&&tt(w)}function yt(){At.stop()}function it(){At.start()}const At=new jh;At.setAnimationLoop(vt),typeof self<"u"&&At.setContext(self),this.setAnimationLoop=function(w){tt=w,Pe.setAnimationLoop(w),w===null?At.stop():At.start()},Pe.addEventListener("sessionstart",yt),Pe.addEventListener("sessionend",it),this.render=function(w,q){if(q!==void 0&&q.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(M===!0)return;w.matrixWorldAutoUpdate===!0&&w.updateMatrixWorld(),q.parent===null&&q.matrixWorldAutoUpdate===!0&&q.updateMatrixWorld(),Pe.enabled===!0&&Pe.isPresenting===!0&&(Pe.cameraAutoUpdate===!0&&Pe.updateCamera(q),q=Pe.getCamera()),w.isScene===!0&&w.onBeforeRender(S,w,q,C),m=we.get(w,g.length),m.init(),g.push(m),B.multiplyMatrices(q.projectionMatrix,q.matrixWorldInverse),ee.setFromProjectionMatrix(B),ge=this.localClippingEnabled,Y=Le.init(this.clippingPlanes,ge),_=ve.get(w,h.length),_.init(),h.push(_),In(w,q,0,S.sortObjects),_.finish(),S.sortObjects===!0&&_.sort(Z,ae),this.info.render.frame++,Y===!0&&Le.beginShadows();const ne=m.state.shadowsArray;if(fe.render(ne,w,q),Y===!0&&Le.endShadows(),this.info.autoReset===!0&&this.info.reset(),je.render(_,w),m.setupLights(S._useLegacyLights),q.isArrayCamera){const se=q.cameras;for(let Q=0,Ce=se.length;Q<Ce;Q++){const Ie=se[Q];rc(_,w,Ie,Ie.viewport)}}else rc(_,w,q);C!==null&&(E.updateMultisampleRenderTarget(C),E.updateRenderTargetMipmap(C)),w.isScene===!0&&w.onAfterRender(S,w,q),D.resetDefaultState(),ie=-1,A=null,g.pop(),g.length>0?m=g[g.length-1]:m=null,h.pop(),h.length>0?_=h[h.length-1]:_=null};function In(w,q,ne,se){if(w.visible===!1)return;if(w.layers.test(q.layers)){if(w.isGroup)ne=w.renderOrder;else if(w.isLOD)w.autoUpdate===!0&&w.update(q);else if(w.isLight)m.pushLight(w),w.castShadow&&m.pushShadow(w);else if(w.isSprite){if(!w.frustumCulled||ee.intersectsSprite(w)){se&&re.setFromMatrixPosition(w.matrixWorld).applyMatrix4(B);const Ie=te.update(w),Ge=w.material;Ge.visible&&_.push(w,Ie,Ge,ne,re.z,null)}}else if((w.isMesh||w.isLine||w.isPoints)&&(!w.frustumCulled||ee.intersectsObject(w))){const Ie=te.update(w),Ge=w.material;if(se&&(w.boundingSphere!==void 0?(w.boundingSphere===null&&w.computeBoundingSphere(),re.copy(w.boundingSphere.center)):(Ie.boundingSphere===null&&Ie.computeBoundingSphere(),re.copy(Ie.boundingSphere.center)),re.applyMatrix4(w.matrixWorld).applyMatrix4(B)),Array.isArray(Ge)){const ke=Ie.groups;for(let $e=0,qe=ke.length;$e<qe;$e++){const Ye=ke[$e],Et=Ge[Ye.materialIndex];Et&&Et.visible&&_.push(w,Ie,Et,ne,re.z,Ye)}}else Ge.visible&&_.push(w,Ie,Ge,ne,re.z,null)}}const Ce=w.children;for(let Ie=0,Ge=Ce.length;Ie<Ge;Ie++)In(Ce[Ie],q,ne,se)}function rc(w,q,ne,se){const Q=w.opaque,Ce=w.transmissive,Ie=w.transparent;m.setupLightsView(ne),Y===!0&&Le.setGlobalState(S.clippingPlanes,ne),Ce.length>0&&ip(Q,Ce,q,ne),se&&X.viewport(T.copy(se)),Q.length>0&&Nr(Q,q,ne),Ce.length>0&&Nr(Ce,q,ne),Ie.length>0&&Nr(Ie,q,ne),X.buffers.depth.setTest(!0),X.buffers.depth.setMask(!0),X.buffers.color.setMask(!0),X.setPolygonOffset(!1)}function ip(w,q,ne,se){if((ne.isScene===!0?ne.overrideMaterial:null)!==null)return;const Ce=H.isWebGL2;ye===null&&(ye=new is(1,1,{generateMipmaps:!0,type:F.has("EXT_color_buffer_half_float")?wr:Ui,minFilter:Ar,samples:Ce?4:0})),S.getDrawingBufferSize(ue),Ce?ye.setSize(ue.x,ue.y):ye.setSize(Cl(ue.x),Cl(ue.y));const Ie=S.getRenderTarget();S.setRenderTarget(ye),S.getClearColor(J),U=S.getClearAlpha(),U<1&&S.setClearColor(16777215,.5),S.clear();const Ge=S.toneMapping;S.toneMapping=Ii,Nr(w,ne,se),E.updateMultisampleRenderTarget(ye),E.updateRenderTargetMipmap(ye);let ke=!1;for(let $e=0,qe=q.length;$e<qe;$e++){const Ye=q[$e],Et=Ye.object,on=Ye.geometry,Ut=Ye.material,$n=Ye.group;if(Ut.side===ci&&Et.layers.test(se.layers)){const gt=Ut.side;Ut.side=rn,Ut.needsUpdate=!0,oc(Et,ne,se,on,Ut,$n),Ut.side=gt,Ut.needsUpdate=!0,ke=!0}}ke===!0&&(E.updateMultisampleRenderTarget(ye),E.updateRenderTargetMipmap(ye)),S.setRenderTarget(Ie),S.setClearColor(J,U),S.toneMapping=Ge}function Nr(w,q,ne){const se=q.isScene===!0?q.overrideMaterial:null;for(let Q=0,Ce=w.length;Q<Ce;Q++){const Ie=w[Q],Ge=Ie.object,ke=Ie.geometry,$e=se===null?Ie.material:se,qe=Ie.group;Ge.layers.test(ne.layers)&&oc(Ge,q,ne,ke,$e,qe)}}function oc(w,q,ne,se,Q,Ce){w.onBeforeRender(S,q,ne,se,Q,Ce),w.modelViewMatrix.multiplyMatrices(ne.matrixWorldInverse,w.matrixWorld),w.normalMatrix.getNormalMatrix(w.modelViewMatrix),Q.onBeforeRender(S,q,ne,se,w,Ce),Q.transparent===!0&&Q.side===ci&&Q.forceSinglePass===!1?(Q.side=rn,Q.needsUpdate=!0,S.renderBufferDirect(ne,q,se,Q,w,Ce),Q.side=Oi,Q.needsUpdate=!0,S.renderBufferDirect(ne,q,se,Q,w,Ce),Q.side=ci):S.renderBufferDirect(ne,q,se,Q,w,Ce),w.onAfterRender(S,q,ne,se,Q,Ce)}function Or(w,q,ne){q.isScene!==!0&&(q=pe);const se=oe.get(w),Q=m.state.lights,Ce=m.state.shadowsArray,Ie=Q.state.version,Ge=Me.getParameters(w,Q.state,Ce,q,ne),ke=Me.getProgramCacheKey(Ge);let $e=se.programs;se.environment=w.isMeshStandardMaterial?q.environment:null,se.fog=q.fog,se.envMap=(w.isMeshStandardMaterial?O:v).get(w.envMap||se.environment),$e===void 0&&(w.addEventListener("dispose",Ae),$e=new Map,se.programs=$e);let qe=$e.get(ke);if(qe!==void 0){if(se.currentProgram===qe&&se.lightsStateVersion===Ie)return lc(w,Ge),qe}else Ge.uniforms=Me.getUniforms(w),w.onBuild(ne,Ge,S),w.onBeforeCompile(Ge,S),qe=Me.acquireProgram(Ge,ke),$e.set(ke,qe),se.uniforms=Ge.uniforms;const Ye=se.uniforms;return(!w.isShaderMaterial&&!w.isRawShaderMaterial||w.clipping===!0)&&(Ye.clippingPlanes=Le.uniform),lc(w,Ge),se.needsLights=op(w),se.lightsStateVersion=Ie,se.needsLights&&(Ye.ambientLightColor.value=Q.state.ambient,Ye.lightProbe.value=Q.state.probe,Ye.directionalLights.value=Q.state.directional,Ye.directionalLightShadows.value=Q.state.directionalShadow,Ye.spotLights.value=Q.state.spot,Ye.spotLightShadows.value=Q.state.spotShadow,Ye.rectAreaLights.value=Q.state.rectArea,Ye.ltc_1.value=Q.state.rectAreaLTC1,Ye.ltc_2.value=Q.state.rectAreaLTC2,Ye.pointLights.value=Q.state.point,Ye.pointLightShadows.value=Q.state.pointShadow,Ye.hemisphereLights.value=Q.state.hemi,Ye.directionalShadowMap.value=Q.state.directionalShadowMap,Ye.directionalShadowMatrix.value=Q.state.directionalShadowMatrix,Ye.spotShadowMap.value=Q.state.spotShadowMap,Ye.spotLightMatrix.value=Q.state.spotLightMatrix,Ye.spotLightMap.value=Q.state.spotLightMap,Ye.pointShadowMap.value=Q.state.pointShadowMap,Ye.pointShadowMatrix.value=Q.state.pointShadowMatrix),se.currentProgram=qe,se.uniformsList=null,qe}function ac(w){if(w.uniformsList===null){const q=w.currentProgram.getUniforms();w.uniformsList=vo.seqWithValue(q.seq,w.uniforms)}return w.uniformsList}function lc(w,q){const ne=oe.get(w);ne.outputColorSpace=q.outputColorSpace,ne.batching=q.batching,ne.instancing=q.instancing,ne.instancingColor=q.instancingColor,ne.skinning=q.skinning,ne.morphTargets=q.morphTargets,ne.morphNormals=q.morphNormals,ne.morphColors=q.morphColors,ne.morphTargetsCount=q.morphTargetsCount,ne.numClippingPlanes=q.numClippingPlanes,ne.numIntersection=q.numClipIntersection,ne.vertexAlphas=q.vertexAlphas,ne.vertexTangents=q.vertexTangents,ne.toneMapping=q.toneMapping}function sp(w,q,ne,se,Q){q.isScene!==!0&&(q=pe),E.resetTextureUnits();const Ce=q.fog,Ie=se.isMeshStandardMaterial?q.environment:null,Ge=C===null?S.outputColorSpace:C.isXRRenderTarget===!0?C.texture.colorSpace:gi,ke=(se.isMeshStandardMaterial?O:v).get(se.envMap||Ie),$e=se.vertexColors===!0&&!!ne.attributes.color&&ne.attributes.color.itemSize===4,qe=!!ne.attributes.tangent&&(!!se.normalMap||se.anisotropy>0),Ye=!!ne.morphAttributes.position,Et=!!ne.morphAttributes.normal,on=!!ne.morphAttributes.color;let Ut=Ii;se.toneMapped&&(C===null||C.isXRRenderTarget===!0)&&(Ut=S.toneMapping);const $n=ne.morphAttributes.position||ne.morphAttributes.normal||ne.morphAttributes.color,gt=$n!==void 0?$n.length:0,Ze=oe.get(se),ia=m.state.lights;if(Y===!0&&(ge===!0||w!==A)){const hn=w===A&&se.id===ie;Le.setState(se,w,hn)}let xt=!1;se.version===Ze.__version?(Ze.needsLights&&Ze.lightsStateVersion!==ia.state.version||Ze.outputColorSpace!==Ge||Q.isBatchedMesh&&Ze.batching===!1||!Q.isBatchedMesh&&Ze.batching===!0||Q.isInstancedMesh&&Ze.instancing===!1||!Q.isInstancedMesh&&Ze.instancing===!0||Q.isSkinnedMesh&&Ze.skinning===!1||!Q.isSkinnedMesh&&Ze.skinning===!0||Q.isInstancedMesh&&Ze.instancingColor===!0&&Q.instanceColor===null||Q.isInstancedMesh&&Ze.instancingColor===!1&&Q.instanceColor!==null||Ze.envMap!==ke||se.fog===!0&&Ze.fog!==Ce||Ze.numClippingPlanes!==void 0&&(Ze.numClippingPlanes!==Le.numPlanes||Ze.numIntersection!==Le.numIntersection)||Ze.vertexAlphas!==$e||Ze.vertexTangents!==qe||Ze.morphTargets!==Ye||Ze.morphNormals!==Et||Ze.morphColors!==on||Ze.toneMapping!==Ut||H.isWebGL2===!0&&Ze.morphTargetsCount!==gt)&&(xt=!0):(xt=!0,Ze.__version=se.version);let Fi=Ze.currentProgram;xt===!0&&(Fi=Or(se,q,Q));let cc=!1,Ys=!1,sa=!1;const Ht=Fi.getUniforms(),Bi=Ze.uniforms;if(X.useProgram(Fi.program)&&(cc=!0,Ys=!0,sa=!0),se.id!==ie&&(ie=se.id,Ys=!0),cc||A!==w){Ht.setValue(y,"projectionMatrix",w.projectionMatrix),Ht.setValue(y,"viewMatrix",w.matrixWorldInverse);const hn=Ht.map.cameraPosition;hn!==void 0&&hn.setValue(y,re.setFromMatrixPosition(w.matrixWorld)),H.logarithmicDepthBuffer&&Ht.setValue(y,"logDepthBufFC",2/(Math.log(w.far+1)/Math.LN2)),(se.isMeshPhongMaterial||se.isMeshToonMaterial||se.isMeshLambertMaterial||se.isMeshBasicMaterial||se.isMeshStandardMaterial||se.isShaderMaterial)&&Ht.setValue(y,"isOrthographic",w.isOrthographicCamera===!0),A!==w&&(A=w,Ys=!0,sa=!0)}if(Q.isSkinnedMesh){Ht.setOptional(y,Q,"bindMatrix"),Ht.setOptional(y,Q,"bindMatrixInverse");const hn=Q.skeleton;hn&&(H.floatVertexTextures?(hn.boneTexture===null&&hn.computeBoneTexture(),Ht.setValue(y,"boneTexture",hn.boneTexture,E)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}Q.isBatchedMesh&&(Ht.setOptional(y,Q,"batchingTexture"),Ht.setValue(y,"batchingTexture",Q._matricesTexture,E));const ra=ne.morphAttributes;if((ra.position!==void 0||ra.normal!==void 0||ra.color!==void 0&&H.isWebGL2===!0)&&ze.update(Q,ne,Fi),(Ys||Ze.receiveShadow!==Q.receiveShadow)&&(Ze.receiveShadow=Q.receiveShadow,Ht.setValue(y,"receiveShadow",Q.receiveShadow)),se.isMeshGouraudMaterial&&se.envMap!==null&&(Bi.envMap.value=ke,Bi.flipEnvMap.value=ke.isCubeTexture&&ke.isRenderTargetTexture===!1?-1:1),Ys&&(Ht.setValue(y,"toneMappingExposure",S.toneMappingExposure),Ze.needsLights&&rp(Bi,sa),Ce&&se.fog===!0&&me.refreshFogUniforms(Bi,Ce),me.refreshMaterialUniforms(Bi,se,$,G,ye),vo.upload(y,ac(Ze),Bi,E)),se.isShaderMaterial&&se.uniformsNeedUpdate===!0&&(vo.upload(y,ac(Ze),Bi,E),se.uniformsNeedUpdate=!1),se.isSpriteMaterial&&Ht.setValue(y,"center",Q.center),Ht.setValue(y,"modelViewMatrix",Q.modelViewMatrix),Ht.setValue(y,"normalMatrix",Q.normalMatrix),Ht.setValue(y,"modelMatrix",Q.matrixWorld),se.isShaderMaterial||se.isRawShaderMaterial){const hn=se.uniformsGroups;for(let oa=0,ap=hn.length;oa<ap;oa++)if(H.isWebGL2){const uc=hn[oa];Se.update(uc,Fi),Se.bind(uc,Fi)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return Fi}function rp(w,q){w.ambientLightColor.needsUpdate=q,w.lightProbe.needsUpdate=q,w.directionalLights.needsUpdate=q,w.directionalLightShadows.needsUpdate=q,w.pointLights.needsUpdate=q,w.pointLightShadows.needsUpdate=q,w.spotLights.needsUpdate=q,w.spotLightShadows.needsUpdate=q,w.rectAreaLights.needsUpdate=q,w.hemisphereLights.needsUpdate=q}function op(w){return w.isMeshLambertMaterial||w.isMeshToonMaterial||w.isMeshPhongMaterial||w.isMeshStandardMaterial||w.isShadowMaterial||w.isShaderMaterial&&w.lights===!0}this.getActiveCubeFace=function(){return I},this.getActiveMipmapLevel=function(){return L},this.getRenderTarget=function(){return C},this.setRenderTargetTextures=function(w,q,ne){oe.get(w.texture).__webglTexture=q,oe.get(w.depthTexture).__webglTexture=ne;const se=oe.get(w);se.__hasExternalTextures=!0,se.__hasExternalTextures&&(se.__autoAllocateDepthBuffer=ne===void 0,se.__autoAllocateDepthBuffer||F.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),se.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(w,q){const ne=oe.get(w);ne.__webglFramebuffer=q,ne.__useDefaultFramebuffer=q===void 0},this.setRenderTarget=function(w,q=0,ne=0){C=w,I=q,L=ne;let se=!0,Q=null,Ce=!1,Ie=!1;if(w){const ke=oe.get(w);ke.__useDefaultFramebuffer!==void 0?(X.bindFramebuffer(y.FRAMEBUFFER,null),se=!1):ke.__webglFramebuffer===void 0?E.setupRenderTarget(w):ke.__hasExternalTextures&&E.rebindTextures(w,oe.get(w.texture).__webglTexture,oe.get(w.depthTexture).__webglTexture);const $e=w.texture;($e.isData3DTexture||$e.isDataArrayTexture||$e.isCompressedArrayTexture)&&(Ie=!0);const qe=oe.get(w).__webglFramebuffer;w.isWebGLCubeRenderTarget?(Array.isArray(qe[q])?Q=qe[q][ne]:Q=qe[q],Ce=!0):H.isWebGL2&&w.samples>0&&E.useMultisampledRTT(w)===!1?Q=oe.get(w).__webglMultisampledFramebuffer:Array.isArray(qe)?Q=qe[ne]:Q=qe,T.copy(w.viewport),R.copy(w.scissor),k=w.scissorTest}else T.copy(ce).multiplyScalar($).floor(),R.copy(de).multiplyScalar($).floor(),k=he;if(X.bindFramebuffer(y.FRAMEBUFFER,Q)&&H.drawBuffers&&se&&X.drawBuffers(w,Q),X.viewport(T),X.scissor(R),X.setScissorTest(k),Ce){const ke=oe.get(w.texture);y.framebufferTexture2D(y.FRAMEBUFFER,y.COLOR_ATTACHMENT0,y.TEXTURE_CUBE_MAP_POSITIVE_X+q,ke.__webglTexture,ne)}else if(Ie){const ke=oe.get(w.texture),$e=q||0;y.framebufferTextureLayer(y.FRAMEBUFFER,y.COLOR_ATTACHMENT0,ke.__webglTexture,ne||0,$e)}ie=-1},this.readRenderTargetPixels=function(w,q,ne,se,Q,Ce,Ie){if(!(w&&w.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ge=oe.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&Ie!==void 0&&(Ge=Ge[Ie]),Ge){X.bindFramebuffer(y.FRAMEBUFFER,Ge);try{const ke=w.texture,$e=ke.format,qe=ke.type;if($e!==An&&be.convert($e)!==y.getParameter(y.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}const Ye=qe===wr&&(F.has("EXT_color_buffer_half_float")||H.isWebGL2&&F.has("EXT_color_buffer_float"));if(qe!==Ui&&be.convert(qe)!==y.getParameter(y.IMPLEMENTATION_COLOR_READ_TYPE)&&!(qe===Ci&&(H.isWebGL2||F.has("OES_texture_float")||F.has("WEBGL_color_buffer_float")))&&!Ye){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}q>=0&&q<=w.width-se&&ne>=0&&ne<=w.height-Q&&y.readPixels(q,ne,se,Q,be.convert($e),be.convert(qe),Ce)}finally{const ke=C!==null?oe.get(C).__webglFramebuffer:null;X.bindFramebuffer(y.FRAMEBUFFER,ke)}}},this.copyFramebufferToTexture=function(w,q,ne=0){const se=Math.pow(2,-ne),Q=Math.floor(q.image.width*se),Ce=Math.floor(q.image.height*se);E.setTexture2D(q,0),y.copyTexSubImage2D(y.TEXTURE_2D,ne,0,0,w.x,w.y,Q,Ce),X.unbindTexture()},this.copyTextureToTexture=function(w,q,ne,se=0){const Q=q.image.width,Ce=q.image.height,Ie=be.convert(ne.format),Ge=be.convert(ne.type);E.setTexture2D(ne,0),y.pixelStorei(y.UNPACK_FLIP_Y_WEBGL,ne.flipY),y.pixelStorei(y.UNPACK_PREMULTIPLY_ALPHA_WEBGL,ne.premultiplyAlpha),y.pixelStorei(y.UNPACK_ALIGNMENT,ne.unpackAlignment),q.isDataTexture?y.texSubImage2D(y.TEXTURE_2D,se,w.x,w.y,Q,Ce,Ie,Ge,q.image.data):q.isCompressedTexture?y.compressedTexSubImage2D(y.TEXTURE_2D,se,w.x,w.y,q.mipmaps[0].width,q.mipmaps[0].height,Ie,q.mipmaps[0].data):y.texSubImage2D(y.TEXTURE_2D,se,w.x,w.y,Ie,Ge,q.image),se===0&&ne.generateMipmaps&&y.generateMipmap(y.TEXTURE_2D),X.unbindTexture()},this.copyTextureToTexture3D=function(w,q,ne,se,Q=0){if(S.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}const Ce=w.max.x-w.min.x+1,Ie=w.max.y-w.min.y+1,Ge=w.max.z-w.min.z+1,ke=be.convert(se.format),$e=be.convert(se.type);let qe;if(se.isData3DTexture)E.setTexture3D(se,0),qe=y.TEXTURE_3D;else if(se.isDataArrayTexture||se.isCompressedArrayTexture)E.setTexture2DArray(se,0),qe=y.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}y.pixelStorei(y.UNPACK_FLIP_Y_WEBGL,se.flipY),y.pixelStorei(y.UNPACK_PREMULTIPLY_ALPHA_WEBGL,se.premultiplyAlpha),y.pixelStorei(y.UNPACK_ALIGNMENT,se.unpackAlignment);const Ye=y.getParameter(y.UNPACK_ROW_LENGTH),Et=y.getParameter(y.UNPACK_IMAGE_HEIGHT),on=y.getParameter(y.UNPACK_SKIP_PIXELS),Ut=y.getParameter(y.UNPACK_SKIP_ROWS),$n=y.getParameter(y.UNPACK_SKIP_IMAGES),gt=ne.isCompressedTexture?ne.mipmaps[Q]:ne.image;y.pixelStorei(y.UNPACK_ROW_LENGTH,gt.width),y.pixelStorei(y.UNPACK_IMAGE_HEIGHT,gt.height),y.pixelStorei(y.UNPACK_SKIP_PIXELS,w.min.x),y.pixelStorei(y.UNPACK_SKIP_ROWS,w.min.y),y.pixelStorei(y.UNPACK_SKIP_IMAGES,w.min.z),ne.isDataTexture||ne.isData3DTexture?y.texSubImage3D(qe,Q,q.x,q.y,q.z,Ce,Ie,Ge,ke,$e,gt.data):ne.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),y.compressedTexSubImage3D(qe,Q,q.x,q.y,q.z,Ce,Ie,Ge,ke,gt.data)):y.texSubImage3D(qe,Q,q.x,q.y,q.z,Ce,Ie,Ge,ke,$e,gt),y.pixelStorei(y.UNPACK_ROW_LENGTH,Ye),y.pixelStorei(y.UNPACK_IMAGE_HEIGHT,Et),y.pixelStorei(y.UNPACK_SKIP_PIXELS,on),y.pixelStorei(y.UNPACK_SKIP_ROWS,Ut),y.pixelStorei(y.UNPACK_SKIP_IMAGES,$n),Q===0&&se.generateMipmaps&&y.generateMipmap(qe),X.unbindTexture()},this.initTexture=function(w){w.isCubeTexture?E.setTextureCube(w,0):w.isData3DTexture?E.setTexture3D(w,0):w.isDataArrayTexture||w.isCompressedArrayTexture?E.setTexture2DArray(w,0):E.setTexture2D(w,0),X.unbindTexture()},this.resetState=function(){I=0,L=0,C=null,X.reset(),D.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ui}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=e===Ql?"display-p3":"srgb",t.unpackColorSpace=lt.workingColorSpace===Jo?"display-p3":"srgb"}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace===zt?ns:Dh}set outputEncoding(e){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=e===ns?zt:gi}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(e){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=e}}class ME extends ep{}ME.prototype.isWebGL1Renderer=!0;class SE extends Pt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t}}class sc extends js{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new nt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const Cf=new W,Pf=new W,Lf=new Rt,tl=new ec,uo=new Qo;class tp extends Pt{constructor(e=new Dn,t=new sc){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,i=[0];for(let s=1,r=t.count;s<r;s++)Cf.fromBufferAttribute(t,s-1),Pf.fromBufferAttribute(t,s),i[s]=i[s-1],i[s]+=Cf.distanceTo(Pf);e.setAttribute("lineDistance",new nn(i,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const i=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),uo.copy(i.boundingSphere),uo.applyMatrix4(s),uo.radius+=r,e.ray.intersectsSphere(uo)===!1)return;Lf.copy(s).invert(),tl.copy(e.ray).applyMatrix4(Lf);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,u=new W,c=new W,f=new W,d=new W,p=this.isLineSegments?2:1,x=i.index,m=i.attributes.position;if(x!==null){const h=Math.max(0,a.start),g=Math.min(x.count,a.start+a.count);for(let S=h,M=g-1;S<M;S+=p){const I=x.getX(S),L=x.getX(S+1);if(u.fromBufferAttribute(m,I),c.fromBufferAttribute(m,L),tl.distanceSqToSegment(u,c,d,f)>l)continue;d.applyMatrix4(this.matrixWorld);const ie=e.ray.origin.distanceTo(d);ie<e.near||ie>e.far||t.push({distance:ie,point:f.clone().applyMatrix4(this.matrixWorld),index:S,face:null,faceIndex:null,object:this})}}else{const h=Math.max(0,a.start),g=Math.min(m.count,a.start+a.count);for(let S=h,M=g-1;S<M;S+=p){if(u.fromBufferAttribute(m,S),c.fromBufferAttribute(m,S+1),tl.distanceSqToSegment(u,c,d,f)>l)continue;d.applyMatrix4(this.matrixWorld);const L=e.ray.origin.distanceTo(d);L<e.near||L>e.far||t.push({distance:L,point:f.clone().applyMatrix4(this.matrixWorld),index:S,face:null,faceIndex:null,object:this})}}}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}const Df=new W,If=new W;class yE extends tp{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,i=[];for(let s=0,r=t.count;s<r;s+=2)Df.fromBufferAttribute(t,s),If.fromBufferAttribute(t,s+1),i[s]=s===0?0:i[s-1],i[s+1]=i[s]+Df.distanceTo(If);e.setAttribute("lineDistance",new nn(i,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class Rr extends Dn{constructor(e=1,t=1,i=1,s=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};const u=this;s=Math.floor(s),r=Math.floor(r);const c=[],f=[],d=[],p=[];let x=0;const _=[],m=i/2;let h=0;g(),a===!1&&(e>0&&S(!0),t>0&&S(!1)),this.setIndex(c),this.setAttribute("position",new nn(f,3)),this.setAttribute("normal",new nn(d,3)),this.setAttribute("uv",new nn(p,2));function g(){const M=new W,I=new W;let L=0;const C=(t-e)/i;for(let ie=0;ie<=r;ie++){const A=[],T=ie/r,R=T*(t-e)+e;for(let k=0;k<=s;k++){const J=k/s,U=J*l+o,V=Math.sin(U),G=Math.cos(U);I.x=R*V,I.y=-T*i+m,I.z=R*G,f.push(I.x,I.y,I.z),M.set(V,C,G).normalize(),d.push(M.x,M.y,M.z),p.push(J,1-T),A.push(x++)}_.push(A)}for(let ie=0;ie<s;ie++)for(let A=0;A<r;A++){const T=_[A][ie],R=_[A+1][ie],k=_[A+1][ie+1],J=_[A][ie+1];c.push(T,R,J),c.push(R,k,J),L+=6}u.addGroup(h,L,0),h+=L}function S(M){const I=x,L=new Xe,C=new W;let ie=0;const A=M===!0?e:t,T=M===!0?1:-1;for(let k=1;k<=s;k++)f.push(0,m*T,0),d.push(0,T,0),p.push(.5,.5),x++;const R=x;for(let k=0;k<=s;k++){const U=k/s*l+o,V=Math.cos(U),G=Math.sin(U);C.x=A*G,C.y=m*T,C.z=A*V,f.push(C.x,C.y,C.z),d.push(0,T,0),L.x=V*.5+.5,L.y=G*.5*T+.5,p.push(L.x,L.y),x++}for(let k=0;k<s;k++){const J=I+k,U=R+k;M===!0?c.push(U,U+1,J):c.push(U+1,U,J),ie+=3}u.addGroup(h,ie,M===!0?1:2),h+=ie}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Rr(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Xi extends js{constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new nt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new nt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ih,this.normalScale=new Xe(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class np extends Pt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new nt(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),t}}class EE extends np{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Pt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new nt(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}}const nl=new Rt,Uf=new W,Nf=new W;class bE{constructor(e){this.camera=e,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Xe(512,512),this.map=null,this.mapPass=null,this.matrix=new Rt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new nc,this._frameExtents=new Xe(1,1),this._viewportCount=1,this._viewports=[new Ot(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,i=this.matrix;Uf.setFromMatrixPosition(e.matrixWorld),t.position.copy(Uf),Nf.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Nf),t.updateMatrixWorld(),nl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(nl),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(nl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class TE extends bE{constructor(){super(new qh(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class AE extends np{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Pt.DEFAULT_UP),this.updateMatrix(),this.target=new Pt,this.shadow=new TE}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class Of{constructor(e=1,t=0,i=0){return this.radius=e,this.phi=t,this.theta=i,this}set(e,t,i){return this.radius=e,this.phi=t,this.theta=i,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,i){return this.radius=Math.sqrt(e*e+t*t+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,i),this.phi=Math.acos(Qt(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}class wE extends yE{constructor(e=10,t=10,i=4473924,s=8947848){i=new nt(i),s=new nt(s);const r=t/2,a=e/t,o=e/2,l=[],u=[];for(let d=0,p=0,x=-o;d<=t;d++,x+=a){l.push(-o,0,x,o,0,x),l.push(x,0,-o,x,0,o);const _=d===r?i:s;_.toArray(u,p),p+=3,_.toArray(u,p),p+=3,_.toArray(u,p),p+=3,_.toArray(u,p),p+=3}const c=new Dn;c.setAttribute("position",new nn(l,3)),c.setAttribute("color",new nn(u,3));const f=new sc({vertexColors:!0,toneMapped:!1});super(c,f),this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}}const Ff=new W;let fo,il;class RE extends Pt{constructor(e=new W(0,0,1),t=new W(0,0,0),i=1,s=16776960,r=i*.2,a=r*.2){super(),this.type="ArrowHelper",fo===void 0&&(fo=new Dn,fo.setAttribute("position",new nn([0,0,0,0,1,0],3)),il=new Rr(0,.5,1,5,1),il.translate(0,-.5,0)),this.position.copy(t),this.line=new tp(fo,new sc({color:s,toneMapped:!1})),this.line.matrixAutoUpdate=!1,this.add(this.line),this.cone=new kt(il,new tc({color:s,toneMapped:!1})),this.cone.matrixAutoUpdate=!1,this.add(this.cone),this.setDirection(e),this.setLength(i,r,a)}setDirection(e){if(e.y>.99999)this.quaternion.set(0,0,0,1);else if(e.y<-.99999)this.quaternion.set(1,0,0,0);else{Ff.set(e.z,0,-e.x).normalize();const t=Math.acos(e.y);this.quaternion.setFromAxisAngle(Ff,t)}}setLength(e,t=e*.2,i=t*.2){this.line.scale.set(1,Math.max(1e-4,e-t),1),this.line.updateMatrix(),this.cone.scale.set(i,t,i),this.cone.position.y=e,this.cone.updateMatrix()}setColor(e){this.line.material.color.set(e),this.cone.material.color.set(e)}copy(e){return super.copy(e,!1),this.line.copy(e.line),this.cone.copy(e.cone),this}dispose(){this.line.geometry.dispose(),this.line.material.dispose(),this.cone.geometry.dispose(),this.cone.material.dispose()}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Zl}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Zl);const Bf={type:"change"},sl={type:"start"},zf={type:"end"},ho=new ec,Hf=new Ai,CE=Math.cos(70*pv.DEG2RAD);class PE extends cs{constructor(e,t){super(),this.object=e,this.domElement=t,this.domElement.style.touchAction="none",this.enabled=!0,this.target=new W,this.cursor=new W,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:fs.ROTATE,MIDDLE:fs.DOLLY,RIGHT:fs.PAN},this.touches={ONE:ds.ROTATE,TWO:ds.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this.getPolarAngle=function(){return o.phi},this.getAzimuthalAngle=function(){return o.theta},this.getDistance=function(){return this.object.position.distanceTo(this.target)},this.listenToKeyEvents=function(D){D.addEventListener("keydown",we),this._domElementKeyEvents=D},this.stopListenToKeyEvents=function(){this._domElementKeyEvents.removeEventListener("keydown",we),this._domElementKeyEvents=null},this.saveState=function(){i.target0.copy(i.target),i.position0.copy(i.object.position),i.zoom0=i.object.zoom},this.reset=function(){i.target.copy(i.target0),i.object.position.copy(i.position0),i.object.zoom=i.zoom0,i.object.updateProjectionMatrix(),i.dispatchEvent(Bf),i.update(),r=s.NONE},this.update=function(){const D=new W,Se=new ss().setFromUnitVectors(e.up,new W(0,1,0)),De=Se.clone().invert(),Pe=new W,_e=new ss,N=new W,Ee=2*Math.PI;return function(Ve=null){const Fe=i.object.position;D.copy(Fe).sub(i.target),D.applyQuaternion(Se),o.setFromVector3(D),i.autoRotate&&r===s.NONE&&k(T(Ve)),i.enableDamping?(o.theta+=l.theta*i.dampingFactor,o.phi+=l.phi*i.dampingFactor):(o.theta+=l.theta,o.phi+=l.phi);let et=i.minAzimuthAngle,tt=i.maxAzimuthAngle;isFinite(et)&&isFinite(tt)&&(et<-Math.PI?et+=Ee:et>Math.PI&&(et-=Ee),tt<-Math.PI?tt+=Ee:tt>Math.PI&&(tt-=Ee),et<=tt?o.theta=Math.max(et,Math.min(tt,o.theta)):o.theta=o.theta>(et+tt)/2?Math.max(et,o.theta):Math.min(tt,o.theta)),o.phi=Math.max(i.minPolarAngle,Math.min(i.maxPolarAngle,o.phi)),o.makeSafe(),i.enableDamping===!0?i.target.addScaledVector(c,i.dampingFactor):i.target.add(c),i.target.sub(i.cursor),i.target.clampLength(i.minTargetRadius,i.maxTargetRadius),i.target.add(i.cursor),i.zoomToCursor&&L||i.object.isOrthographicCamera?o.radius=ce(o.radius):o.radius=ce(o.radius*u),D.setFromSpherical(o),D.applyQuaternion(De),Fe.copy(i.target).add(D),i.object.lookAt(i.target),i.enableDamping===!0?(l.theta*=1-i.dampingFactor,l.phi*=1-i.dampingFactor,c.multiplyScalar(1-i.dampingFactor)):(l.set(0,0,0),c.set(0,0,0));let vt=!1;if(i.zoomToCursor&&L){let yt=null;if(i.object.isPerspectiveCamera){const it=D.length();yt=ce(it*u);const At=it-yt;i.object.position.addScaledVector(M,At),i.object.updateMatrixWorld()}else if(i.object.isOrthographicCamera){const it=new W(I.x,I.y,0);it.unproject(i.object),i.object.zoom=Math.max(i.minZoom,Math.min(i.maxZoom,i.object.zoom/u)),i.object.updateProjectionMatrix(),vt=!0;const At=new W(I.x,I.y,0);At.unproject(i.object),i.object.position.sub(At).add(it),i.object.updateMatrixWorld(),yt=D.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),i.zoomToCursor=!1;yt!==null&&(this.screenSpacePanning?i.target.set(0,0,-1).transformDirection(i.object.matrix).multiplyScalar(yt).add(i.object.position):(ho.origin.copy(i.object.position),ho.direction.set(0,0,-1).transformDirection(i.object.matrix),Math.abs(i.object.up.dot(ho.direction))<CE?e.lookAt(i.target):(Hf.setFromNormalAndCoplanarPoint(i.object.up,i.target),ho.intersectPlane(Hf,i.target))))}else i.object.isOrthographicCamera&&(i.object.zoom=Math.max(i.minZoom,Math.min(i.maxZoom,i.object.zoom/u)),i.object.updateProjectionMatrix(),vt=!0);return u=1,L=!1,vt||Pe.distanceToSquared(i.object.position)>a||8*(1-_e.dot(i.object.quaternion))>a||N.distanceToSquared(i.target)>0?(i.dispatchEvent(Bf),Pe.copy(i.object.position),_e.copy(i.object.quaternion),N.copy(i.target),!0):!1}}(),this.dispose=function(){i.domElement.removeEventListener("contextmenu",je),i.domElement.removeEventListener("pointerdown",E),i.domElement.removeEventListener("pointercancel",O),i.domElement.removeEventListener("wheel",te),i.domElement.removeEventListener("pointermove",v),i.domElement.removeEventListener("pointerup",O),i._domElementKeyEvents!==null&&(i._domElementKeyEvents.removeEventListener("keydown",we),i._domElementKeyEvents=null)};const i=this,s={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6};let r=s.NONE;const a=1e-6,o=new Of,l=new Of;let u=1;const c=new W,f=new Xe,d=new Xe,p=new Xe,x=new Xe,_=new Xe,m=new Xe,h=new Xe,g=new Xe,S=new Xe,M=new W,I=new Xe;let L=!1;const C=[],ie={};let A=!1;function T(D){return D!==null?2*Math.PI/60*i.autoRotateSpeed*D:2*Math.PI/60/60*i.autoRotateSpeed}function R(D){const Se=Math.abs(D*.01);return Math.pow(.95,i.zoomSpeed*Se)}function k(D){l.theta-=D}function J(D){l.phi-=D}const U=function(){const D=new W;return function(De,Pe){D.setFromMatrixColumn(Pe,0),D.multiplyScalar(-De),c.add(D)}}(),V=function(){const D=new W;return function(De,Pe){i.screenSpacePanning===!0?D.setFromMatrixColumn(Pe,1):(D.setFromMatrixColumn(Pe,0),D.crossVectors(i.object.up,D)),D.multiplyScalar(De),c.add(D)}}(),G=function(){const D=new W;return function(De,Pe){const _e=i.domElement;if(i.object.isPerspectiveCamera){const N=i.object.position;D.copy(N).sub(i.target);let Ee=D.length();Ee*=Math.tan(i.object.fov/2*Math.PI/180),U(2*De*Ee/_e.clientHeight,i.object.matrix),V(2*Pe*Ee/_e.clientHeight,i.object.matrix)}else i.object.isOrthographicCamera?(U(De*(i.object.right-i.object.left)/i.object.zoom/_e.clientWidth,i.object.matrix),V(Pe*(i.object.top-i.object.bottom)/i.object.zoom/_e.clientHeight,i.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),i.enablePan=!1)}}();function $(D){i.object.isPerspectiveCamera||i.object.isOrthographicCamera?u/=D:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),i.enableZoom=!1)}function Z(D){i.object.isPerspectiveCamera||i.object.isOrthographicCamera?u*=D:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),i.enableZoom=!1)}function ae(D,Se){if(!i.zoomToCursor)return;L=!0;const De=i.domElement.getBoundingClientRect(),Pe=D-De.left,_e=Se-De.top,N=De.width,Ee=De.height;I.x=Pe/N*2-1,I.y=-(_e/Ee)*2+1,M.set(I.x,I.y,1).unproject(i.object).sub(i.object.position).normalize()}function ce(D){return Math.max(i.minDistance,Math.min(i.maxDistance,D))}function de(D){f.set(D.clientX,D.clientY)}function he(D){ae(D.clientX,D.clientX),h.set(D.clientX,D.clientY)}function ee(D){x.set(D.clientX,D.clientY)}function Y(D){d.set(D.clientX,D.clientY),p.subVectors(d,f).multiplyScalar(i.rotateSpeed);const Se=i.domElement;k(2*Math.PI*p.x/Se.clientHeight),J(2*Math.PI*p.y/Se.clientHeight),f.copy(d),i.update()}function ge(D){g.set(D.clientX,D.clientY),S.subVectors(g,h),S.y>0?$(R(S.y)):S.y<0&&Z(R(S.y)),h.copy(g),i.update()}function ye(D){_.set(D.clientX,D.clientY),m.subVectors(_,x).multiplyScalar(i.panSpeed),G(m.x,m.y),x.copy(_),i.update()}function B(D){ae(D.clientX,D.clientY),D.deltaY<0?Z(R(D.deltaY)):D.deltaY>0&&$(R(D.deltaY)),i.update()}function ue(D){let Se=!1;switch(D.code){case i.keys.UP:D.ctrlKey||D.metaKey||D.shiftKey?J(2*Math.PI*i.rotateSpeed/i.domElement.clientHeight):G(0,i.keyPanSpeed),Se=!0;break;case i.keys.BOTTOM:D.ctrlKey||D.metaKey||D.shiftKey?J(-2*Math.PI*i.rotateSpeed/i.domElement.clientHeight):G(0,-i.keyPanSpeed),Se=!0;break;case i.keys.LEFT:D.ctrlKey||D.metaKey||D.shiftKey?k(2*Math.PI*i.rotateSpeed/i.domElement.clientHeight):G(i.keyPanSpeed,0),Se=!0;break;case i.keys.RIGHT:D.ctrlKey||D.metaKey||D.shiftKey?k(-2*Math.PI*i.rotateSpeed/i.domElement.clientHeight):G(-i.keyPanSpeed,0),Se=!0;break}Se&&(D.preventDefault(),i.update())}function re(D){if(C.length===1)f.set(D.pageX,D.pageY);else{const Se=be(D),De=.5*(D.pageX+Se.x),Pe=.5*(D.pageY+Se.y);f.set(De,Pe)}}function pe(D){if(C.length===1)x.set(D.pageX,D.pageY);else{const Se=be(D),De=.5*(D.pageX+Se.x),Pe=.5*(D.pageY+Se.y);x.set(De,Pe)}}function b(D){const Se=be(D),De=D.pageX-Se.x,Pe=D.pageY-Se.y,_e=Math.sqrt(De*De+Pe*Pe);h.set(0,_e)}function y(D){i.enableZoom&&b(D),i.enablePan&&pe(D)}function z(D){i.enableZoom&&b(D),i.enableRotate&&re(D)}function F(D){if(C.length==1)d.set(D.pageX,D.pageY);else{const De=be(D),Pe=.5*(D.pageX+De.x),_e=.5*(D.pageY+De.y);d.set(Pe,_e)}p.subVectors(d,f).multiplyScalar(i.rotateSpeed);const Se=i.domElement;k(2*Math.PI*p.x/Se.clientHeight),J(2*Math.PI*p.y/Se.clientHeight),f.copy(d)}function H(D){if(C.length===1)_.set(D.pageX,D.pageY);else{const Se=be(D),De=.5*(D.pageX+Se.x),Pe=.5*(D.pageY+Se.y);_.set(De,Pe)}m.subVectors(_,x).multiplyScalar(i.panSpeed),G(m.x,m.y),x.copy(_)}function X(D){const Se=be(D),De=D.pageX-Se.x,Pe=D.pageY-Se.y,_e=Math.sqrt(De*De+Pe*Pe);g.set(0,_e),S.set(0,Math.pow(g.y/h.y,i.zoomSpeed)),$(S.y),h.copy(g);const N=(D.pageX+Se.x)*.5,Ee=(D.pageY+Se.y)*.5;ae(N,Ee)}function le(D){i.enableZoom&&X(D),i.enablePan&&H(D)}function oe(D){i.enableZoom&&X(D),i.enableRotate&&F(D)}function E(D){i.enabled!==!1&&(C.length===0&&(i.domElement.setPointerCapture(D.pointerId),i.domElement.addEventListener("pointermove",v),i.domElement.addEventListener("pointerup",O)),ze(D),D.pointerType==="touch"?Le(D):j(D))}function v(D){i.enabled!==!1&&(D.pointerType==="touch"?fe(D):K(D))}function O(D){He(D),C.length===0&&(i.domElement.releasePointerCapture(D.pointerId),i.domElement.removeEventListener("pointermove",v),i.domElement.removeEventListener("pointerup",O)),i.dispatchEvent(zf),r=s.NONE}function j(D){let Se;switch(D.button){case 0:Se=i.mouseButtons.LEFT;break;case 1:Se=i.mouseButtons.MIDDLE;break;case 2:Se=i.mouseButtons.RIGHT;break;default:Se=-1}switch(Se){case fs.DOLLY:if(i.enableZoom===!1)return;he(D),r=s.DOLLY;break;case fs.ROTATE:if(D.ctrlKey||D.metaKey||D.shiftKey){if(i.enablePan===!1)return;ee(D),r=s.PAN}else{if(i.enableRotate===!1)return;de(D),r=s.ROTATE}break;case fs.PAN:if(D.ctrlKey||D.metaKey||D.shiftKey){if(i.enableRotate===!1)return;de(D),r=s.ROTATE}else{if(i.enablePan===!1)return;ee(D),r=s.PAN}break;default:r=s.NONE}r!==s.NONE&&i.dispatchEvent(sl)}function K(D){switch(r){case s.ROTATE:if(i.enableRotate===!1)return;Y(D);break;case s.DOLLY:if(i.enableZoom===!1)return;ge(D);break;case s.PAN:if(i.enablePan===!1)return;ye(D);break}}function te(D){i.enabled===!1||i.enableZoom===!1||r!==s.NONE||(D.preventDefault(),i.dispatchEvent(sl),B(Me(D)),i.dispatchEvent(zf))}function Me(D){const Se=D.deltaMode,De={clientX:D.clientX,clientY:D.clientY,deltaY:D.deltaY};switch(Se){case 1:De.deltaY*=16;break;case 2:De.deltaY*=100;break}return D.ctrlKey&&!A&&(De.deltaY*=10),De}function me(D){D.key==="Control"&&(A=!0,document.addEventListener("keyup",ve,{passive:!0,capture:!0}))}function ve(D){D.key==="Control"&&(A=!1,document.removeEventListener("keyup",ve,{passive:!0,capture:!0}))}function we(D){i.enabled===!1||i.enablePan===!1||ue(D)}function Le(D){switch(Re(D),C.length){case 1:switch(i.touches.ONE){case ds.ROTATE:if(i.enableRotate===!1)return;re(D),r=s.TOUCH_ROTATE;break;case ds.PAN:if(i.enablePan===!1)return;pe(D),r=s.TOUCH_PAN;break;default:r=s.NONE}break;case 2:switch(i.touches.TWO){case ds.DOLLY_PAN:if(i.enableZoom===!1&&i.enablePan===!1)return;y(D),r=s.TOUCH_DOLLY_PAN;break;case ds.DOLLY_ROTATE:if(i.enableZoom===!1&&i.enableRotate===!1)return;z(D),r=s.TOUCH_DOLLY_ROTATE;break;default:r=s.NONE}break;default:r=s.NONE}r!==s.NONE&&i.dispatchEvent(sl)}function fe(D){switch(Re(D),r){case s.TOUCH_ROTATE:if(i.enableRotate===!1)return;F(D),i.update();break;case s.TOUCH_PAN:if(i.enablePan===!1)return;H(D),i.update();break;case s.TOUCH_DOLLY_PAN:if(i.enableZoom===!1&&i.enablePan===!1)return;le(D),i.update();break;case s.TOUCH_DOLLY_ROTATE:if(i.enableZoom===!1&&i.enableRotate===!1)return;oe(D),i.update();break;default:r=s.NONE}}function je(D){i.enabled!==!1&&D.preventDefault()}function ze(D){C.push(D.pointerId)}function He(D){delete ie[D.pointerId];for(let Se=0;Se<C.length;Se++)if(C[Se]==D.pointerId){C.splice(Se,1);return}}function Re(D){let Se=ie[D.pointerId];Se===void 0&&(Se=new Xe,ie[D.pointerId]=Se),Se.set(D.pageX,D.pageY)}function be(D){const Se=D.pointerId===C[0]?C[1]:C[0];return ie[Se]}i.domElement.addEventListener("contextmenu",je),i.domElement.addEventListener("pointerdown",E),i.domElement.addEventListener("pointercancel",O),i.domElement.addEventListener("wheel",te,{passive:!1}),document.addEventListener("keydown",me,{passive:!0,capture:!0}),this.update()}}const LE={__name:"ThreeView",props:["project"],setup(n){const e=n,t=di(null);let i,s,r,a,o=0,l=null,u,c;function f(){const m=t.value;i=new ep({antialias:!0}),i.setPixelRatio(window.devicePixelRatio),i.setSize(m.clientWidth,m.clientHeight),m.appendChild(i.domElement),s=new SE,r=new gn(50,m.clientWidth/m.clientHeight,.1,200),r.position.set(Je.w/2,11,13),a=new PE(r,i.domElement),a.target.set(Je.w/2,.5,Je.h/2),a.enableDamping=!0,a.maxPolarAngle=Math.PI/2.05,u=new EE(16777215,3359829,.9),c=new AE(16773853,1.1),c.position.set(6,12,4),s.add(u,c);const h=new kt(new ta(Je.w,Je.h),new Xi({color:1713204,roughness:.95}));h.rotation.x=-Math.PI/2,h.position.set(Je.w/2,0,Je.h/2),s.add(h);const g=new wE(Math.max(Je.w,Je.h),Math.max(Je.w,Je.h),2899029,2240586);g.position.set(Je.w/2,.01,Je.h/2),s.add(g);const S=new Xi({color:2767442,transparent:!0,opacity:.25}),M=(C,ie,A,T,R,k)=>{const J=new kt(new fi(C,ie,A),S);J.position.set(T,R,k),s.add(J)};M(Je.w,3,.1,Je.w/2,1.5,0),M(Je.w,3,.1,Je.w/2,1.5,Je.h),M(.1,3,Je.h,0,1.5,Je.h/2),M(.1,3,Je.h,Je.w,1.5,Je.h/2);const I=Bt.x1-Bt.x0,L=new kt(new fi(I,Bt.z,.6),new Xi({color:4872818,roughness:.7,metalness:.4}));L.position.set((Bt.x0+Bt.x1)/2,Bt.z/2,Bt.y),s.add(L),l=new Us,s.add(l),d(),p()}function d(){for(;l.children.length;)l.children.pop().traverse(S=>{S.geometry&&S.geometry.dispose(),S.material&&S.material.dispose&&S.material.dispose()});const m=e.project.scheme;for(const g of m.workpieces){const S=new kt(new fi(g.w,g.h,g.d),new Xi({color:9413565,roughness:.55}));S.position.set(g.x,Bt.z+g.h/2,g.y),l.add(S)}for(const g of m.lamps){const S=qo(g),M=new Us,I=(g.yaw||0)*Math.PI/180,L=new kt(new Rr(.045,.045,S.length,16),new Xi({color:6969856,emissive:16761095,emissiveIntensity:g.locked?.5:1.4})),C=new W(Math.cos(I),0,Math.sin(I));L.quaternion.setFromUnitVectors(new W(0,1,0),C),M.add(L);const ie=new kt(new fi(S.length,.06,.22),new Xi({color:3622236,metalness:.6,roughness:.4}));ie.position.y=.1,ie.rotation.y=-I,M.add(ie);const A=new kt(new Rr(.02,.02,Math.max(.1,3.2-g.z),8),new Xi({color:5596542}));A.position.y=(3.2-g.z)/2+.12,M.add(A);const T=(g.angle||0)*Math.PI/180,R=new W(-Math.sin(T)*Math.sin(I),-Math.cos(T),Math.sin(T)*Math.cos(I)).normalize(),k=new RE(R,new W(0,0,0),.55,16766287,.14,.08);M.add(k),M.position.set(g.x,g.z,g.y),l.add(M)}const h=m.params.shift==="day";s.background=new nt(h?1845821:395794),u.intensity=h?.9:.18,c.intensity=h?1.1:.08,c.color.set(h?16773853:8952319)}function p(){o=requestAnimationFrame(p),a.update(),i.render(s,r)}function x(){const m=t.value;!m||!i||(r.aspect=m.clientWidth/m.clientHeight,r.updateProjectionMatrix(),i.setSize(m.clientWidth,m.clientHeight))}let _=null;return Xl(()=>{f(),_=new ResizeObserver(x),_.observe(t.value)}),jl(()=>{cancelAnimationFrame(o),_&&_.disconnect(),i&&i.dispose()}),hi(()=>e.project.scheme,d,{deep:!0}),(m,h)=>(Ne(),Be("div",{ref_key:"host",ref:t,class:"three-host"},null,512))}},DE=ls(LE,[["__scopeId","data-v-6fbce3dc"]]),IE={class:"design"},UE={class:"side left"},NE={class:"panel"},OE=["onDragstart"],FE={key:0,class:"panel"},BE={class:"row"},zE=["disabled"],HE={class:"val"},VE={class:"row"},GE=["disabled"],kE={class:"val"},WE={class:"row"},XE=["disabled"],jE={class:"val"},qE={class:"row"},YE=["max","disabled"],KE={class:"val"},$E={class:"row"},ZE=["disabled"],JE={class:"val"},QE={class:"row btns"},eb={key:1,class:"panel"},tb={class:"row"},nb={class:"val"},ib={class:"row"},sb={class:"val"},rb={class:"row"},ob={class:"val"},ab={class:"row btns"},lb={class:"panel"},cb={class:"row"},ub={class:"center"},fb={class:"toolbar"},db={class:"side right"},hb={class:"panel"},pb={class:"row"},mb={class:"row"},gb={class:"row"},_b={class:"row"},vb={key:0,class:"panel"},xb={class:"stat"},Mb={class:"stat"},Sb={class:"stat"},yb={class:"ubar"},Eb={class:"stat"},bb={class:"stat"},Tb={class:"panel zones"},Ab={class:"mono"},wb={key:0},Rb={style:{"margin-top":"10px"}},Cb={class:"mono"},Pb={key:0},Lb={class:"panel"},Db={class:"row"},Ib={class:"dim"},Ub={class:"dim"},Nb={class:"vb"},Ob=["onClick"],Fb=["onClick"],Bb={__name:"DesignMain",props:["project"],setup(n){const e=n,t=e.project.scheme,i=Og(e.project,Je),s=di(null),r=di("2d"),a=di(""),o=ht(()=>{var h;return((h=s.value)==null?void 0:h.type)==="lamp"?t.lamps.find(g=>g.id===s.value.id):null}),l=ht(()=>{var h;return((h=s.value)==null?void 0:h.type)==="wp"?t.workpieces.find(g=>g.id===s.value.id):null});function u(h){const g=t.lamps.findIndex(S=>S.id===h);g>=0&&t.lamps.splice(g,1),s.value=null}function c(h){const g=t.workpieces.findIndex(S=>S.id===h);g>=0&&t.workpieces.splice(g,1),s.value=null}function f(){t.workpieces.push({id:"wp"+Math.random().toString(36).slice(2,7),name:"工件"+(t.workpieces.length+1),x:3+t.workpieces.length*.8,y:Bt.y,w:.9,d:.6,h:.35})}function d(){oh(t,6)}function p(h){t.lamps.forEach(g=>{g.locked=h})}function x(){const h=a.value.trim()||`V${e.project.versions.length+1}`;e.project.versions.push({id:"v"+Date.now(),name:h,time:new Date().toLocaleString("zh-CN",{hour12:!1}),snapshot:JSON.parse(JSON.stringify({lamps:t.lamps,workpieces:t.workpieces,params:t.params})),stats:JSON.parse(JSON.stringify(i.stats)),dark:i.dark.length,over:i.over.length}),a.value=""}function _(h){const g=JSON.parse(JSON.stringify(h.snapshot));t.lamps=g.lamps,t.workpieces=g.workpieces,Object.assign(t.params,g.params),s.value=null}function m(h){const g=e.project.versions.findIndex(S=>S.id===h);g>=0&&e.project.versions.splice(g,1)}return(h,g)=>{const S=Eo("router-link");return Ne(),Be("div",IE,[P("aside",UE,[P("div",NE,[g[23]||(g[23]=P("h3",null,"灯库(拖入画布)",-1)),(Ne(!0),Be(mt,null,wn(Ue(Co),M=>(Ne(),Be("div",{key:M.id,class:"lib-item",draggable:"true",onDragstart:I=>I.dataTransfer.setData("text/plain",M.id)},[P("b",null,xe(M.name),1),P("span",null,xe(M.desc)+" · 管长"+xe(M.length)+"m · 额定"+xe(M.power)+"W",1)],40,OE))),128))]),o.value?(Ne(),Be("div",FE,[P("h3",null,"灯管参数 "+xe(o.value.locked?"🔒已锁定":""),1),P("div",BE,[g[24]||(g[24]=P("label",null,"高度 z",-1)),dt(P("input",{type:"range",min:"1.2",max:"3",step:"0.05","onUpdate:modelValue":g[0]||(g[0]=M=>o.value.z=M),disabled:o.value.locked},null,8,zE),[[bt,o.value.z,void 0,{number:!0}]]),P("span",HE,xe(o.value.z)+"m",1)]),P("div",VE,[g[25]||(g[25]=P("label",null,"倾角",-1)),dt(P("input",{type:"range",min:"-60",max:"60",step:"1","onUpdate:modelValue":g[1]||(g[1]=M=>o.value.angle=M),disabled:o.value.locked},null,8,GE),[[bt,o.value.angle,void 0,{number:!0}]]),P("span",kE,xe(o.value.angle)+"°",1)]),P("div",WE,[g[26]||(g[26]=P("label",null,"水平转角",-1)),dt(P("input",{type:"range",min:"0",max:"180",step:"5","onUpdate:modelValue":g[2]||(g[2]=M=>o.value.yaw=M),disabled:o.value.locked},null,8,XE),[[bt,o.value.yaw,void 0,{number:!0}]]),P("span",jE,xe(o.value.yaw)+"°",1)]),P("div",qE,[g[27]||(g[27]=P("label",null,"功率",-1)),dt(P("input",{type:"range",min:"50",max:Ue(qo)(o.value).power,step:"10","onUpdate:modelValue":g[3]||(g[3]=M=>o.value.power=M),disabled:o.value.locked},null,8,YE),[[bt,o.value.power,void 0,{number:!0}]]),P("span",KE,xe(o.value.power)+"W",1)]),P("div",$E,[g[28]||(g[28]=P("label",null,"照射距离",-1)),dt(P("input",{type:"range",min:"1",max:"6",step:"0.1","onUpdate:modelValue":g[4]||(g[4]=M=>o.value.range=M),disabled:o.value.locked},null,8,ZE),[[bt,o.value.range,void 0,{number:!0}]]),P("span",JE,xe(o.value.range)+"m",1)]),P("div",QE,[P("button",{class:"ghost",onClick:g[5]||(g[5]=M=>o.value.locked=!o.value)},xe(o.value.locked?"解锁":"锁定"),1),P("button",{class:"danger",onClick:g[6]||(g[6]=M=>u(o.value.id))},"删除")])])):l.value?(Ne(),Be("div",eb,[P("h3",null,"工件 "+xe(l.value.name),1),P("div",tb,[g[29]||(g[29]=P("label",null,"宽 w",-1)),dt(P("input",{type:"range",min:"0.3",max:"2",step:"0.05","onUpdate:modelValue":g[7]||(g[7]=M=>l.value.w=M)},null,512),[[bt,l.value.w,void 0,{number:!0}]]),P("span",nb,xe(l.value.w)+"m",1)]),P("div",ib,[g[30]||(g[30]=P("label",null,"深 d",-1)),dt(P("input",{type:"range",min:"0.3",max:"1.5",step:"0.05","onUpdate:modelValue":g[8]||(g[8]=M=>l.value.d=M)},null,512),[[bt,l.value.d,void 0,{number:!0}]]),P("span",sb,xe(l.value.d)+"m",1)]),P("div",rb,[g[31]||(g[31]=P("label",null,"高 h",-1)),dt(P("input",{type:"range",min:"0.1",max:"0.8",step:"0.05","onUpdate:modelValue":g[9]||(g[9]=M=>l.value.h=M)},null,512),[[bt,l.value.h,void 0,{number:!0}]]),P("span",ob,xe(l.value.h)+"m",1)]),P("div",ab,[P("button",{class:"danger",onClick:g[10]||(g[10]=M=>c(l.value.id))},"删除")])])):cn("",!0),P("div",lb,[g[33]||(g[33]=P("h3",null,"工件摆放",-1)),P("div",{class:"row btns"},[P("button",{class:"ghost",onClick:f},"添加工件"),P("button",{class:"ghost",onClick:d},"沿链自动摆放")]),P("div",cb,[g[32]||(g[32]=P("label",null,"锁定操作",-1)),P("button",{class:"ghost",onClick:g[11]||(g[11]=M=>p(!0))},"全锁"),P("button",{class:"ghost",onClick:g[12]||(g[12]=M=>p(!1))},"全解锁")])])]),P("section",ub,[P("div",fb,[P("button",{class:Vn({ghost:r.value!=="2d"}),onClick:g[13]||(g[13]=M=>r.value="2d")},"俯视照度图",2),P("button",{class:Vn({ghost:r.value!=="3d"}),onClick:g[14]||(g[14]=M=>r.value="3d")},"3D 预览",2),g[34]||(g[34]=P("span",{class:"sp"},null,-1)),P("button",{class:Vn(["shift",{on:Ue(t).params.shift==="day"}]),onClick:g[15]||(g[15]=M=>Ue(t).params.shift="day")},"☀ 白班",2),P("button",{class:Vn(["shift",{on:Ue(t).params.shift==="night"}]),onClick:g[16]||(g[16]=M=>Ue(t).params.shift="night")},"🌙 夜班",2)]),dt(Tt(h0,{project:n.project,sim:Ue(i),selected:s.value,onSelect:g[17]||(g[17]=M=>s.value=M)},null,8,["project","sim","selected"]),[[ag,r.value==="2d"]]),r.value==="3d"?(Ne(),Kl(DE,{key:0,project:n.project},null,8,["project"])):cn("",!0)]),P("aside",db,[P("div",hb,[g[42]||(g[42]=P("h3",null,"验收标准",-1)),P("div",pb,[g[35]||(g[35]=P("label",null,"照度下限",-1)),dt(P("input",{type:"number","onUpdate:modelValue":g[18]||(g[18]=M=>Ue(t).params.stdMin=M),style:{width:"70px"}},null,512),[[bt,Ue(t).params.stdMin,void 0,{number:!0}]]),g[36]||(g[36]=ut(" mW/cm²",-1))]),P("div",mb,[g[37]||(g[37]=P("label",null,"照度上限",-1)),dt(P("input",{type:"number","onUpdate:modelValue":g[19]||(g[19]=M=>Ue(t).params.stdMax=M),style:{width:"70px"}},null,512),[[bt,Ue(t).params.stdMax,void 0,{number:!0}]]),g[38]||(g[38]=ut(" mW/cm²",-1))]),P("div",gb,[g[39]||(g[39]=P("label",null,"均匀度≥",-1)),dt(P("input",{type:"number","onUpdate:modelValue":g[20]||(g[20]=M=>Ue(t).params.uStd=M),step:"0.05",min:"0.3",max:"0.95",style:{width:"70px"}},null,512),[[bt,Ue(t).params.uStd,void 0,{number:!0}]])]),P("div",_b,[g[40]||(g[40]=P("label",null,"照射面高",-1)),dt(P("input",{type:"number","onUpdate:modelValue":g[21]||(g[21]=M=>Ue(t).params.surfaceZ=M),step:"0.05",min:"0",max:"1",style:{width:"70px"}},null,512),[[bt,Ue(t).params.surfaceZ,void 0,{number:!0}]]),g[41]||(g[41]=ut(" m(输送面以上)",-1))])]),Ue(i).stats?(Ne(),Be("div",vb,[P("h3",null,"采样统计("+xe(Ue(i).stats.n)+"点)",1),P("div",xb,[g[43]||(g[43]=P("span",null,"平均照度",-1)),P("b",null,xe(Ue(i).stats.avg.toFixed(1)),1)]),P("div",Mb,[g[44]||(g[44]=P("span",null,"最小 / 最大",-1)),P("b",null,xe(Ue(i).stats.min.toFixed(1))+" / "+xe(Ue(i).stats.max.toFixed(1)),1)]),P("div",Sb,[g[45]||(g[45]=P("span",null,"均匀度 U=最小/平均",-1)),P("b",{style:en({color:Ue(i).stats.u1>=Ue(t).params.uStd?"var(--ok)":"var(--bad)"})},xe(Ue(i).stats.u1.toFixed(2)),5)]),P("div",yb,[P("i",{style:en({width:Math.min(100,Ue(i).stats.u1/Ue(t).params.uStd*100)+"%"}),class:Vn({bad:Ue(i).stats.u1<Ue(t).params.uStd})},null,6)]),P("div",Eb,[g[46]||(g[46]=P("span",null,"采样合格率",-1)),P("b",null,xe((Ue(i).stats.passRate*100).toFixed(0))+"%",1)]),P("div",bb,[g[47]||(g[47]=P("span",null,"判定",-1)),P("b",{style:en({color:Ue(i).stats.pass?"var(--ok)":"var(--bad)"})},xe(Ue(i).stats.pass?"✔ 达标":"✘ 不达标"),5)])])):cn("",!0),P("div",Tb,[P("h3",null,"暗区(低于"+xe(Ue(t).params.stdMin)+") "+xe(Ue(i).dark.length)+"处",1),(Ne(!0),Be(mt,null,wn(Ue(i).dark,(M,I)=>(Ne(),Be("div",{key:"d"+I,class:"zone dark"},[P("b",null,"暗区"+xe(I+1),1),ut(" 中心("+xe(M.cx)+", "+xe(M.cy)+") 面积"+xe(M.area)+"m² 最低"+xe(M.ext)+" ",1),P("div",Ab,[ut(xe(M.cells.map(L=>`(${L[0]},${L[1]})`).join(" ")),1),M.n>10?(Ne(),Be("span",wb," …共"+xe(M.n)+"格",1)):cn("",!0)])]))),128)),P("h3",Rb,"超限(高于"+xe(Ue(t).params.stdMax)+") "+xe(Ue(i).over.length)+"处",1),(Ne(!0),Be(mt,null,wn(Ue(i).over,(M,I)=>(Ne(),Be("div",{key:"o"+I,class:"zone over"},[P("b",null,"超限"+xe(I+1),1),ut(" 中心("+xe(M.cx)+", "+xe(M.cy)+") 面积"+xe(M.area)+"m² 峰值"+xe(M.ext)+" ",1),P("div",Cb,[ut(xe(M.cells.map(L=>`(${L[0]},${L[1]})`).join(" ")),1),M.n>10?(Ne(),Be("span",Pb," …共"+xe(M.n)+"格",1)):cn("",!0)])]))),128))]),P("div",Lb,[g[51]||(g[51]=P("h3",null,"方案版本",-1)),P("div",Db,[dt(P("input",{"onUpdate:modelValue":g[22]||(g[22]=M=>a.value=M),placeholder:"版本名,如 V2-加密固化段",style:{flex:"1"}},null,512),[[bt,a.value]]),P("button",{onClick:x},"存版本")]),(Ne(!0),Be(mt,null,wn(n.project.versions,M=>(Ne(),Be("div",{key:M.id,class:"ver"},[P("div",null,[P("b",null,xe(M.name),1),g[48]||(g[48]=ut()),P("span",Ib,xe(M.time),1),g[49]||(g[49]=P("br",null,null,-1)),P("span",Ub,"U="+xe(M.stats.u1.toFixed(2))+" 平均"+xe(M.stats.avg.toFixed(1))+" 暗区"+xe(M.dark)+" 超限"+xe(M.over),1)]),P("div",Nb,[P("button",{class:"ghost",onClick:I=>_(M)},"载入",8,Ob),P("button",{class:"ghost",onClick:I=>m(M.id)},"删",8,Fb)])]))),128)),Tt(S,{to:"/compare"},{default:Zi(()=>[...g[50]||(g[50]=[P("button",{class:"ghost",style:{width:"100%","margin-top":"6px"}},"去版本对比 →",-1)])]),_:1})])])])}}},zb=ls(Bb,[["__scopeId","data-v-7ccf45c9"]]),Hb={class:"design-wrap"},Vb={key:1,class:"empty panel"},Gb={__name:"Design",setup(n){const e=ht(()=>Yo());return(t,i)=>{const s=Eo("router-link");return Ne(),Be("div",Hb,[e.value?(Ne(),Kl(zb,{key:e.value.id,project:e.value},null,8,["project"])):(Ne(),Be("div",Vb,[i[1]||(i[1]=P("p",null,"还没有选择项目。",-1)),Tt(s,{to:"/projects"},{default:Zi(()=>[...i[0]||(i[0]=[P("button",null,"去项目列表选择 / 下单",-1)])]),_:1})]))])}}},kb=ls(Gb,[["__scopeId","data-v-dadf77fd"]]),Wb={key:0,class:"compare"},Xb={class:"panel head"},jb={key:0,class:"pickers"},qb=["value"],Yb=["value"],Kb={key:1,class:"dim"},$b={class:"panel"},Zb={class:"lbl"},Jb={class:"bars"},Qb={class:"bar a"},eT={class:"bar b"},tT={class:"lg"},nT={class:"panel"},iT={key:1,class:"panel",style:{margin:"40px auto"}},sT={__name:"Compare",setup(n){const e=ht(()=>Yo()),t=di(""),i=di("");hi(e,u=>{u&&u.versions.length&&(t.value=u.versions[0].id,i.value=u.versions[u.versions.length-1].id)},{immediate:!0});const s=ht(()=>{var u;return(u=e.value)==null?void 0:u.versions.find(c=>c.id===t.value)}),r=ht(()=>{var u;return(u=e.value)==null?void 0:u.versions.find(c=>c.id===i.value)});function a(u,c=1){return u===void 0?"-":u.toFixed(c)}const o=ht(()=>{if(!s.value||!r.value)return[];const u=(c,f,d,p,x=2,_=!0)=>{const m=Math.max(f,d,1e-6),h=d-f,g=_?h>=0:h<=0;return{label:c,wa:f/m*100,wb:d/m*100,fa:a(f,x)+p,fb:a(d,x)+p,delta:(h>=0?"+":"")+a(h,x)+p,good:g}};return[u("均匀度 U",s.value.stats.u1,r.value.stats.u1,""),u("平均照度",s.value.stats.avg,r.value.stats.avg,""),u("最低照度",s.value.stats.min,r.value.stats.min,""),u("合格率",s.value.stats.passRate*100,r.value.stats.passRate*100,"%",0),u("暗区数",s.value.dark,r.value.dark,"处",0,!1),u("超限区数",s.value.over,r.value.over,"处",0,!1)]}),l=ht(()=>{if(!s.value||!r.value)return[];const u=s.value,c=r.value,f=(d,p,x,_=2,m=!0)=>{const h=x-p;return{k:d,a:a(p,_),b:a(x,_),d:(h>=0?"+":"")+a(h,_),good:Math.abs(h)<1e-9?null:m?h>0:h<0}};return[f("采样点数",u.stats.n,c.stats.n,0,!0),f("平均照度 mW/cm²",u.stats.avg,c.stats.avg),f("最小照度 mW/cm²",u.stats.min,c.stats.min),f("最大照度 mW/cm²",u.stats.max,c.stats.max),f("均匀度 U(最小/平均)",u.stats.u1,c.stats.u1),f("均匀度 U0(最小/最大)",u.stats.u0,c.stats.u0),f("采样合格率",u.stats.passRate,c.stats.passRate,3),f("暗区数量",u.dark,c.dark,0,!1),f("超限区数量",u.over,c.over,0,!1),{k:"判定",a:u.stats.pass?"达标":"不达标",b:c.stats.pass?"达标":"不达标",d:"",good:null}]});return(u,c)=>e.value?(Ne(),Be("div",Wb,[P("div",Xb,[P("h3",null,"方案版本对比 — "+xe(e.value.name),1),e.value.versions.length>=2?(Ne(),Be("div",jb,[P("label",null,[c[2]||(c[2]=ut("版本A ",-1)),dt(P("select",{"onUpdate:modelValue":c[0]||(c[0]=f=>t.value=f)},[(Ne(!0),Be(mt,null,wn(e.value.versions,f=>(Ne(),Be("option",{key:f.id,value:f.id},xe(f.name)+"("+xe(f.time)+")",9,qb))),128))],512),[[gl,t.value]])]),P("label",null,[c[3]||(c[3]=ut("版本B ",-1)),dt(P("select",{"onUpdate:modelValue":c[1]||(c[1]=f=>i.value=f)},[(Ne(!0),Be(mt,null,wn(e.value.versions,f=>(Ne(),Be("option",{key:f.id,value:f.id},xe(f.name)+"("+xe(f.time)+")",9,Yb))),128))],512),[[gl,i.value]])])])):(Ne(),Be("p",Kb,"版本不足两个,请先在「光源设计」界面保存方案版本。"))]),s.value&&r.value?(Ne(),Be(mt,{key:0},[P("div",$b,[c[6]||(c[6]=P("h3",null,"均匀度对比",-1)),(Ne(!0),Be(mt,null,wn(o.value,f=>(Ne(),Be("div",{class:"ubar-row",key:f.label},[P("span",Zb,xe(f.label),1),P("div",Jb,[P("div",Qb,[P("i",{style:en({width:f.wa+"%"})},null,4),P("em",null,xe(f.fa),1)]),P("div",eT,[P("i",{style:en({width:f.wb+"%"})},null,4),P("em",null,xe(f.fb),1)])]),P("span",{class:"delta",style:en({color:f.good?"var(--ok)":"var(--bad)"})},xe(f.delta),5)]))),128)),P("div",tT,[c[4]||(c[4]=P("i",{class:"sw a"},null,-1)),ut(xe(s.value.name)+" ",1),c[5]||(c[5]=P("i",{class:"sw b"},null,-1)),ut(xe(r.value.name),1)])]),P("div",nT,[c[9]||(c[9]=P("h3",null,"明细",-1)),P("table",null,[P("thead",null,[P("tr",null,[c[7]||(c[7]=P("th",null,"指标",-1)),P("th",null,xe(s.value.name),1),P("th",null,xe(r.value.name),1),c[8]||(c[8]=P("th",null,"变化",-1))])]),P("tbody",null,[(Ne(!0),Be(mt,null,wn(l.value,f=>(Ne(),Be("tr",{key:f.k},[P("td",null,xe(f.k),1),P("td",null,xe(f.a),1),P("td",null,xe(f.b),1),P("td",{style:en({color:f.good===null?"inherit":f.good?"var(--ok)":"var(--bad)"})},xe(f.d),5)]))),128))])])])],64)):cn("",!0)])):(Ne(),Be("div",iT,"请先在项目列表选择一个项目。"))}},rT=ls(sT,[["__scopeId","data-v-8f3d6012"]]),oT={key:0,class:"review"},aT={class:"panel info"},lT={class:"grid"},cT={key:0,class:"reject"},uT={class:"panel"},fT=["onUpdate:modelValue","disabled"],dT={class:"actions"},hT=["disabled"],pT={key:0,class:"tip"},mT={key:1,class:"tip"},gT={class:"panel"},_T={class:"actions"},vT=["disabled"],xT=["disabled"],MT={key:0,class:"tip"},ST={key:1,class:"dim"},yT={key:2,class:"actions"},ET=["disabled"],bT={key:3,class:"okline"},TT={class:"panel"},AT={class:"mono"},wT={key:1,class:"panel",style:{margin:"40px auto"}},RT={__name:"Review",setup(n){const e=ht(()=>Yo()),t=di(""),i=ht(()=>e.value?Math.max(0,Math.ceil((new Date(e.value.deadline)-Date.now())/864e5)):0),s=ht(()=>e.value&&e.value.workItems.every(c=>c.done)),r=ht(()=>e.value&&s.value&&_t.role==="maker"&&["设计中","已下单"].includes(e.value.status));function a(){e.value.status="待审核",Ls(e.value,"提交审核")}function o(){e.value.status="审核通过",Ls(e.value,"审核通过")}function l(){e.value.rework++,e.value.status="设计中",e.value.lastReject=t.value.trim(),Ls(e.value,`审核退回:${e.value.lastReject}(第${e.value.rework}次返工)`),t.value=""}function u(){const c=e.value,f={项目:{名称:c.name,客户:c.customer,产品:c.product,数量:c.qty,截止时间:c.deadline,返工次数:c.rework},交付时间:new Date().toLocaleString("zh-CN",{hour12:!1}),最终方案:c.scheme,版本记录:c.versions.map(x=>({名称:x.name,时间:x.time,统计:x.stats})),工位条目:c.workItems,流转记录:c.history},d=new Blob([JSON.stringify(f,null,2)],{type:"application/json"}),p=document.createElement("a");p.href=URL.createObjectURL(d),p.download=`${c.name}_UV方案交付包.json`,p.click(),URL.revokeObjectURL(p.href),c.status="已交付",c.deliveredAt=new Date().toLocaleString("zh-CN",{hour12:!1}),Ls(c,"打包交付")}return(c,f)=>e.value?(Ne(),Be("div",oT,[P("div",aT,[f[9]||(f[9]=P("h3",null,"项目信息",-1)),P("div",lT,[P("div",null,[f[1]||(f[1]=P("span",null,"项目",-1)),P("b",null,xe(e.value.name),1)]),P("div",null,[f[2]||(f[2]=P("span",null,"客户",-1)),P("b",null,xe(e.value.customer),1)]),P("div",null,[f[3]||(f[3]=P("span",null,"产品",-1)),P("b",null,xe(e.value.product),1)]),P("div",null,[f[4]||(f[4]=P("span",null,"数量",-1)),P("b",null,xe(e.value.qty)+" 件/月",1)]),P("div",null,[f[5]||(f[5]=P("span",null,"状态",-1)),P("b",null,[P("span",{class:"badge",style:en({background:Ue(lh)[e.value.status]||"#888"})},xe(e.value.status),5)])]),P("div",null,[f[6]||(f[6]=P("span",null,"返工次数",-1)),P("b",{style:en({color:e.value.rework?"var(--warn)":"inherit"})},xe(e.value.rework)+" 次",5)]),P("div",null,[f[7]||(f[7]=P("span",null,"截止时间",-1)),P("b",null,xe(e.value.deadline)+"(剩 "+xe(i.value)+" 天)",1)]),P("div",null,[f[8]||(f[8]=P("span",null,"方案版本",-1)),P("b",null,xe(e.value.versions.length)+" 个",1)])]),e.value.lastReject?(Ne(),Be("div",cT,"最近退回原因:"+xe(e.value.lastReject),1)):cn("",!0)]),P("div",uT,[f[10]||(f[10]=P("h3",null,"工位条目(制作员逐项完成)",-1)),(Ne(!0),Be(mt,null,wn(e.value.workItems,d=>(Ne(),Be("div",{key:d.id,class:"wi"},[P("label",null,[dt(P("input",{type:"checkbox","onUpdate:modelValue":p=>d.done=p,disabled:Ue(_t).role!=="maker"||e.value.status==="已交付"},null,8,fT),[[Tg,d.done]]),P("span",{class:Vn({done:d.done})},xe(d.name),3)]),P("em",null,xe(d.done?"已完成":"待完成"),1)]))),128)),P("div",dT,[P("button",{onClick:a,disabled:!r.value},"提交审核",8,hT),s.value?Ue(_t).role!=="maker"?(Ne(),Be("span",mT,"需制作员角色提交")):cn("",!0):(Ne(),Be("span",pT,"全部工位完成后才能提交审核"))])]),P("div",gT,[f[11]||(f[11]=P("h3",null,"主管审核",-1)),e.value.status==="待审核"?(Ne(),Be(mt,{key:0},[dt(P("textarea",{"onUpdate:modelValue":f[0]||(f[0]=d=>t.value=d),placeholder:"退回原因(退回时填写,如:固化段均匀度不足)"},null,512),[[bt,t.value]]),P("div",_T,[P("button",{class:"ok",onClick:o,disabled:Ue(_t).role!=="supervisor"},"审核通过",8,vT),P("button",{class:"danger",onClick:l,disabled:Ue(_t).role!=="supervisor"||!t.value.trim()},"退回返工",8,xT),Ue(_t).role!=="supervisor"?(Ne(),Be("span",MT,"需主管角色操作")):cn("",!0)])],64)):(Ne(),Be("p",ST,"当前状态「"+xe(e.value.status)+"」,"+xe(e.value.status==="审核通过"?"可执行打包交付。":"待制作员提交审核。"),1)),e.value.status==="审核通过"?(Ne(),Be("div",yT,[P("button",{onClick:u,disabled:Ue(_t).role!=="supervisor"},"打包交付(导出交付包)",8,ET)])):cn("",!0),e.value.status==="已交付"?(Ne(),Be("p",bT,"✔ 已于 "+xe(e.value.deliveredAt)+" 打包交付",1)):cn("",!0)]),P("div",TT,[f[13]||(f[13]=P("h3",null,"流转记录",-1)),(Ne(!0),Be(mt,null,wn([...e.value.history].reverse(),(d,p)=>(Ne(),Be("div",{key:p,class:"hist"},[P("span",AT,xe(d.time),1),f[12]||(f[12]=ut()),P("b",null,xe(d.by),1),ut(" "+xe(d.action),1)]))),128))])])):(Ne(),Be("div",wT,"请先在项目列表选择一个项目。"))}},CT=ls(RT,[["__scopeId","data-v-74fbefb5"]]),PT=Z_({history:P_(),routes:[{path:"/",redirect:"/projects"},{path:"/projects",component:u0,name:"projects"},{path:"/design",component:kb,name:"design"},{path:"/compare",component:rT,name:"compare"},{path:"/review",component:CT,name:"review"}]});Lg(Xg).use(PT).mount("#app");
