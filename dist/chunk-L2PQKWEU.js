import{a,b as s}from"./chunk-KJ3HM2VM.js";import{PublicClientApplication as m}from"@azure/msal-node";import{existsSync as f,mkdirSync as g,readFileSync as y,writeFileSync as w}from"fs";import{homedir as k}from"os";import{join as d}from"path";import{exec as C}from"child_process";import{platform as u}from"process";function l(n){let e=u==="win32"?`echo|set /p="${n}"| clip`:u==="darwin"?`printf '%s' '${n}' | pbcopy`:`printf '%s' '${n}' | xclip -selection clipboard 2>/dev/null || printf '%s' '${n}' | xsel --clipboard 2>/dev/null`;C(e,()=>{})}var A="1950a258-227b-4e31-a9cf-717495945fc2",p=d(k(),".mcp-dataverse"),c=d(p,"msal-cache.json"),P=300*1e3;function T(){return{beforeCacheAccess:async n=>{if(f(c))try{let e=y(c,"utf-8"),i;try{i=s(e)}catch{i=e}n.tokenCache.deserialize(i)}catch{}},afterCacheAccess:async n=>{n.cacheHasChanged&&(g(p,{recursive:!0}),w(c,a(n.tokenCache.serialize()),{encoding:"utf-8",mode:384}))}}}var h=class{environmentUrl;pca;cachedToken=null;tokenExpiresAt=0;pendingAuth=null;backgroundAuthFlow=null;activeDeviceCode=null;constructor(e){this.environmentUrl=e.replace(/\/$/,""),this.pca=new m({auth:{clientId:A,authority:"https://login.microsoftonline.com/common"},cache:{cachePlugin:T()}})}async getToken(){let e=Date.now();return this.cachedToken!==null&&this.tokenExpiresAt>e+6e4?this.cachedToken:this.pendingAuth!==null?this.pendingAuth:(this.pendingAuth=this.refreshToken().finally(()=>{this.pendingAuth=null}),this.pendingAuth)}invalidateToken(){this.cachedToken=null,this.tokenExpiresAt=0}async isAuthenticated(){try{return await this.getToken(),!0}catch{return!1}}async setupViaDeviceCode(){await this.runDeviceCodeFlowBlocking()}async refreshToken(){let e=await this.pca.getAllAccounts();if(e.length>0)try{return await this.acquireSilently()}catch{process.stderr.write(`
[mcp-dataverse] Session expired \u2014 initiating re-authentication.
`)}return this.authenticateViaDeviceCode(e.length===0?"first-time":"session-expired")}async authenticateViaDeviceCode(e){if(this.backgroundAuthFlow)try{return await this.acquireSilently()}catch{}let i=null,r=new Promise(t=>{i=t});if(this.backgroundAuthFlow||(this.activeDeviceCode=null,this.backgroundAuthFlow=this.pca.acquireTokenByDeviceCode({scopes:[`${this.environmentUrl}/.default`],deviceCodeCallback:t=>{l(t.userCode),this.activeDeviceCode={userCode:t.userCode,verificationUri:t.verificationUri},i?.(),i=null,process.stderr.write(`
[mcp-dataverse] Sign in required

  1. Open ${t.verificationUri} in your browser
     (use the browser profile linked to your Power Platform account)
  2. Paste the code: ${t.userCode}  (already copied to your clipboard)
  3. Sign in with your work account

`)}}).then(t=>{t&&(this.cacheResult(t),process.stderr.write(`
[mcp-dataverse] Authenticated \u2713  Token cached.

`))}).catch(t=>{let o=t instanceof Error?t.message:String(t);process.stderr.write(`
[mcp-dataverse] Background auth failed: ${o}
`)}).finally(()=>{this.backgroundAuthFlow=null,this.activeDeviceCode=null}),await Promise.race([r,new Promise(t=>setTimeout(t,6e3))])),this.activeDeviceCode!==null){let{userCode:t,verificationUri:o}=this.activeDeviceCode,v=e==="first-time"?"First-time sign-in required to connect to Dataverse.":"Your Dataverse session has expired. Please sign in again.";throw new Error(`${v}

  1. Open this URL in your browser:
     ${o}

  2. Enter the code: ${t}  (already copied to your clipboard)

  3. Sign in with your organizational (work/school) account

Authentication is running in the background. Once you have signed in, retry this command.`)}throw new Error(`Authentication required but could not reach the Microsoft sign-in service.
Check your network connection and retry.

Alternatively, pre-authenticate via the terminal:
  npx mcp-dataverse-auth ${this.environmentUrl}
Then restart the MCP server.`)}async acquireSilently(){let e=await this.pca.getAllAccounts();if(e.length===0)throw new Error("No account found in cache after authentication.");let i=await this.pca.acquireTokenSilent({scopes:[`${this.environmentUrl}/.default`],account:e[0]});if(!i?.accessToken)throw new Error("Token acquisition returned an empty access token.");return this.cacheResult(i),i.accessToken}async runDeviceCodeFlowBlocking(){let e=await Promise.race([this.pca.acquireTokenByDeviceCode({scopes:[`${this.environmentUrl}/.default`],deviceCodeCallback:i=>{l(i.userCode),process.stderr.write(`
[mcp-dataverse] Sign in required

  1. Open ${i.verificationUri} in your browser
     (use the browser profile linked to your Power Platform account)
  2. Paste the code: ${i.userCode}  (already copied to your clipboard)
  3. Sign in with your work account

`)}}),new Promise((i,r)=>setTimeout(()=>r(new Error("Authentication timed out after 5 minutes. Please try again.")),P))]);e&&(this.cacheResult(e),process.stderr.write(`
[mcp-dataverse] Authenticated \u2713  Token cached \u2014 no sign-in needed next time.

`))}cacheResult(e){this.cachedToken=e.accessToken,this.tokenExpiresAt=e.expiresOn?.getTime()??Date.now()+3300*1e3}};export{h as a};
