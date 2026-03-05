import{PublicClientApplication as p}from"@azure/msal-node";import{existsSync as d,mkdirSync as m,readFileSync as f,writeFileSync as g}from"fs";import{homedir as v}from"os";import{join as u}from"path";import{exec as y}from"child_process";import{platform as c}from"process";import{createCipheriv as w,createDecipheriv as C,createHash as k,randomBytes as T}from"crypto";function A(n){let e=c==="win32"?`echo|set /p="${n}"| clip`:c==="darwin"?`printf '%s' '${n}' | pbcopy`:`printf '%s' '${n}' | xclip -selection clipboard 2>/dev/null || printf '%s' '${n}' | xsel --clipboard 2>/dev/null`;y(e,()=>{})}var E="1950a258-227b-4e31-a9cf-717495945fc2",h=u(v(),".mcp-dataverse"),a=u(h,"msal-cache.json"),S=300*1e3;function l(){let n=[process.env.COMPUTERNAME??process.env.HOSTNAME??"",process.env.USERNAME??process.env.USER??"","mcp-dataverse-cache-v1"].join(".");return k("sha256").update(n).digest()}function P(n){let e=l(),t=T(16),r=w("aes-256-gcm",e,t),i=Buffer.concat([r.update(n,"utf-8"),r.final()]);return JSON.stringify({v:1,iv:t.toString("hex"),tag:r.getAuthTag().toString("hex"),d:i.toString("hex")})}function x(n){let e=JSON.parse(n);if(e.v!==1)throw new Error("Unknown cache format version");let t=Buffer.from(e.iv,"hex"),r=Buffer.from(e.tag,"hex"),i=Buffer.from(e.d,"hex"),o=C("aes-256-gcm",l(),t);return o.setAuthTag(r),o.update(i).toString("utf-8")+o.final("utf-8")}function b(){return{beforeCacheAccess:async n=>{if(d(a))try{let e=f(a,"utf-8"),t;try{t=x(e)}catch{t=e}n.tokenCache.deserialize(t)}catch{}},afterCacheAccess:async n=>{n.cacheHasChanged&&(m(h,{recursive:!0}),g(a,P(n.tokenCache.serialize()),{encoding:"utf-8",mode:384}))}}}var s=class{environmentUrl;pca;cachedToken=null;tokenExpiresAt=0;pendingAuth=null;constructor(e){this.environmentUrl=e.replace(/\/$/,""),this.pca=new p({auth:{clientId:E,authority:"https://login.microsoftonline.com/common"},cache:{cachePlugin:b()}})}async getToken(){let e=Date.now();return this.cachedToken!==null&&this.tokenExpiresAt>e+6e4?this.cachedToken:this.pendingAuth!==null?this.pendingAuth:(this.pendingAuth=this.refreshToken().finally(()=>{this.pendingAuth=null}),this.pendingAuth)}invalidateToken(){this.cachedToken=null,this.tokenExpiresAt=0}async isAuthenticated(){try{return await this.getToken(),!0}catch{return!1}}async setupViaDeviceCode(){await this.runDeviceCodeFlow()}async refreshToken(){if((await this.pca.getAllAccounts()).length===0){process.stderr.write(`
[mcp-dataverse] First-time authentication required.
Environment: ${this.environmentUrl}
Open the URL below in your browser to sign in.

`);try{return await this.runDeviceCodeFlow(),await this.acquireSilently()}catch(t){let r=t instanceof Error?t.message:String(t);throw new Error(`Authentication setup failed: ${r}

You can also authenticate manually:
  npx mcp-dataverse-auth ${this.environmentUrl}
Then restart the MCP server in VS Code.`)}}try{return await this.acquireSilently()}catch{process.stderr.write(`
[mcp-dataverse] Session expired \u2014 re-authenticating.
Open the URL below in your browser to sign in again.

`);try{return await this.runDeviceCodeFlow(),await this.acquireSilently()}catch(t){this.cachedToken=null;let r=t instanceof Error?t.message:String(t);throw new Error(`Re-authentication failed: ${r}

To authenticate manually:
  npx mcp-dataverse-auth ${this.environmentUrl}
Then restart the MCP server in VS Code.`)}}}async acquireSilently(){let e=await this.pca.getAllAccounts();if(e.length===0)throw new Error("No account found in cache after authentication.");let t=await this.pca.acquireTokenSilent({scopes:[`${this.environmentUrl}/.default`],account:e[0]});if(!t?.accessToken)throw new Error("Token acquisition returned an empty access token.");return this.cacheResult(t),t.accessToken}async runDeviceCodeFlow(){let e=await Promise.race([this.pca.acquireTokenByDeviceCode({scopes:[`${this.environmentUrl}/.default`],deviceCodeCallback:t=>{A(t.userCode),process.stderr.write(`
[mcp-dataverse] Sign in required

  1. Open ${t.verificationUri} in your browser
     (use the browser profile linked to your Power Platform account)
  2. Paste the code: ${t.userCode}  (already copied to your clipboard)
  3. Sign in with your work account

`)}}),new Promise((t,r)=>setTimeout(()=>r(new Error("Authentication timed out after 5 minutes. Please try again.")),S))]);e&&(this.cacheResult(e),process.stderr.write(`
[mcp-dataverse] Authenticated \u2713  Token cached \u2014 no sign-in needed next time.

`))}cacheResult(e){this.cachedToken=e.accessToken,this.tokenExpiresAt=e.expiresOn?.getTime()??Date.now()+3300*1e3}};export{s as a};
