import{a as o,b as a}from"./chunk-KJ3HM2VM.js";import{PublicClientApplication as u}from"@azure/msal-node";import{existsSync as p,mkdirSync as d,readFileSync as m,writeFileSync as f}from"fs";import{homedir as w}from"os";import{join as l}from"path";import{exec as y}from"child_process";import{platform as c}from"process";function v(n){let t=c==="win32"?`echo|set /p="${n}"| clip`:c==="darwin"?`printf '%s' '${n}' | pbcopy`:`printf '%s' '${n}' | xclip -selection clipboard 2>/dev/null || printf '%s' '${n}' | xsel --clipboard 2>/dev/null`;y(t,()=>{})}var g="1950a258-227b-4e31-a9cf-717495945fc2",h=l(w(),".mcp-dataverse"),r=l(h,"msal-cache.json"),C=300*1e3;function k(){return{beforeCacheAccess:async n=>{if(p(r))try{let t=m(r,"utf-8"),e;try{e=a(t)}catch{e=t}n.tokenCache.deserialize(e)}catch{}},afterCacheAccess:async n=>{n.cacheHasChanged&&(d(h,{recursive:!0}),f(r,o(n.tokenCache.serialize()),{encoding:"utf-8",mode:384}))}}}var s=class{environmentUrl;pca;cachedToken=null;tokenExpiresAt=0;pendingAuth=null;constructor(t){this.environmentUrl=t.replace(/\/$/,""),this.pca=new u({auth:{clientId:g,authority:"https://login.microsoftonline.com/common"},cache:{cachePlugin:k()}})}async getToken(){let t=Date.now();return this.cachedToken!==null&&this.tokenExpiresAt>t+6e4?this.cachedToken:this.pendingAuth!==null?this.pendingAuth:(this.pendingAuth=this.refreshToken().finally(()=>{this.pendingAuth=null}),this.pendingAuth)}invalidateToken(){this.cachedToken=null,this.tokenExpiresAt=0}async isAuthenticated(){try{return await this.getToken(),!0}catch{return!1}}async setupViaDeviceCode(){await this.runDeviceCodeFlow()}async refreshToken(){if((await this.pca.getAllAccounts()).length===0){process.stderr.write(`
[mcp-dataverse] First-time authentication required.
Environment: ${this.environmentUrl}
Open the URL below in your browser to sign in.

`);try{return await this.runDeviceCodeFlow(),await this.acquireSilently()}catch(e){let i=e instanceof Error?e.message:String(e);throw new Error(`Authentication setup failed: ${i}

You can also authenticate manually:
  npx mcp-dataverse-auth ${this.environmentUrl}
Then restart the MCP server in VS Code.`)}}try{return await this.acquireSilently()}catch{process.stderr.write(`
[mcp-dataverse] Session expired \u2014 re-authenticating.
Open the URL below in your browser to sign in again.

`);try{return await this.runDeviceCodeFlow(),await this.acquireSilently()}catch(e){this.cachedToken=null;let i=e instanceof Error?e.message:String(e);throw new Error(`Re-authentication failed: ${i}

To authenticate manually:
  npx mcp-dataverse-auth ${this.environmentUrl}
Then restart the MCP server in VS Code.`)}}}async acquireSilently(){let t=await this.pca.getAllAccounts();if(t.length===0)throw new Error("No account found in cache after authentication.");let e=await this.pca.acquireTokenSilent({scopes:[`${this.environmentUrl}/.default`],account:t[0]});if(!e?.accessToken)throw new Error("Token acquisition returned an empty access token.");return this.cacheResult(e),e.accessToken}async runDeviceCodeFlow(){let t=await Promise.race([this.pca.acquireTokenByDeviceCode({scopes:[`${this.environmentUrl}/.default`],deviceCodeCallback:e=>{v(e.userCode),process.stderr.write(`
[mcp-dataverse] Sign in required

  1. Open ${e.verificationUri} in your browser
     (use the browser profile linked to your Power Platform account)
  2. Paste the code: ${e.userCode}  (already copied to your clipboard)
  3. Sign in with your work account

`)}}),new Promise((e,i)=>setTimeout(()=>i(new Error("Authentication timed out after 5 minutes. Please try again.")),C))]);t&&(this.cacheResult(t),process.stderr.write(`
[mcp-dataverse] Authenticated \u2713  Token cached \u2014 no sign-in needed next time.

`))}cacheResult(t){this.cachedToken=t.accessToken,this.tokenExpiresAt=t.expiresOn?.getTime()??Date.now()+3300*1e3}};export{s as a};
