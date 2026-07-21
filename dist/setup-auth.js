#!/usr/bin/env node
import{readFileSync as x,existsSync as E}from"fs";import{join as T}from"path";import{homedir as M}from"os";import{z as s}from"zod";var g=s.object({environmentUrl:s.string().url("Must be a valid Dataverse environment URL").refine(t=>t.startsWith("https://"),{message:"Dataverse environment URL must use HTTPS"}).refine(t=>{try{return new URL(t).hostname.toLowerCase().endsWith(".dynamics.com")}catch{return!1}},{message:"environmentUrl must be a *.dynamics.com host"}),requestTimeoutMs:s.number().positive().default(3e4),maxRetries:s.number().min(0).max(10).default(3),authMethod:s.enum(["device-code","client-credentials","managed-identity"]).default("device-code"),tenantId:s.string().min(1).optional(),clientId:s.string().min(1).optional(),clientSecret:s.string().min(1).optional(),managedIdentityClientId:s.string().min(1).optional()}).superRefine((t,e)=>{t.authMethod==="client-credentials"&&(t.tenantId||e.addIssue({code:s.ZodIssueCode.custom,path:["tenantId"],message:"tenantId is required when authMethod is 'client-credentials'"}),t.clientId||e.addIssue({code:s.ZodIssueCode.custom,path:["clientId"],message:"clientId is required when authMethod is 'client-credentials'"}),t.clientSecret||e.addIssue({code:s.ZodIssueCode.custom,path:["clientSecret"],message:"clientSecret is required when authMethod is 'client-credentials'. Prefer AZURE_CLIENT_SECRET env var over storing it in config.json."}))});import{createCipheriv as P,createDecipheriv as D,createHash as U,randomBytes as _}from"crypto";function y(){let t=[process.env.COMPUTERNAME??process.env.HOSTNAME??"",process.env.USERNAME??process.env.USER??"","mcp-dataverse-cache-v1"].join(".");return U("sha256").update(t).digest()}function w(t){let e=y(),n=_(16),r=P("aes-256-gcm",e,n),i=Buffer.concat([r.update(t,"utf-8"),r.final()]),o={v:1,iv:n.toString("hex"),tag:r.getAuthTag().toString("hex"),d:i.toString("hex")};return JSON.stringify(o)}function d(t){let e=JSON.parse(t);if(e.v!==1)throw new Error("Unknown encrypted-blob format version");let n=Buffer.from(e.iv,"hex"),r=Buffer.from(e.tag,"hex"),i=Buffer.from(e.d,"hex"),o=D("aes-256-gcm",y(),n);return o.setAuthTag(r),o.update(i).toString("utf-8")+o.final("utf-8")}function C(t){try{let e=JSON.parse(t);return e.v===1&&typeof e.iv=="string"&&typeof e.tag=="string"&&typeof e.d=="string"}catch{return!1}}var A="config.json";function k(){let t=T(M(),".mcp-dataverse",A),e=process.env.MCP_CONFIG_PATH??(E(t)?t:T(process.cwd(),A)),n={};if(E(e)){let a=x(e,"utf-8");try{n=JSON.parse(a)}catch{throw new Error(`Invalid JSON in ${e}. Check for syntax errors (trailing commas, missing quotes).`)}}let r=process.env.DATAVERSE_ENV_URL??process.env.environmentUrl;r&&(n.environmentUrl=r);let i=process.env.REQUEST_TIMEOUT_MS??process.env.requestTimeoutMs;i&&(n.requestTimeoutMs=Number(i));let o=process.env.MAX_RETRIES??process.env.maxRetries;o&&(n.maxRetries=Number(o));let c=process.env.AUTH_METHOD??process.env.authMethod;c&&(n.authMethod=c);let p=process.env.AZURE_TENANT_ID??process.env.tenantId;p&&(n.tenantId=p);let m=process.env.AZURE_CLIENT_ID??process.env.clientId;m&&(n.clientId=m);let f=process.env.AZURE_CLIENT_SECRET??process.env.clientSecret;if(f)n.clientSecret=f;else if(typeof n.clientSecret=="string"&&C(n.clientSecret))try{n.clientSecret=d(n.clientSecret)}catch{throw new Error("Failed to decrypt clientSecret from config.json. The config may have been created on a different machine or user account. Re-run 'npx mcp-dataverse install' or set AZURE_CLIENT_SECRET env var.")}let v=process.env.AZURE_MANAGED_IDENTITY_CLIENT_ID??process.env.managedIdentityClientId;v&&(n.managedIdentityClientId=v);let l=g.safeParse(n);if(!l.success)throw new Error(`Invalid configuration:
${l.error.issues.map(a=>`  - ${a.path.join(".")}: ${a.message}`).join(`
`)}`);return l.data}import{PublicClientApplication as N}from"@azure/msal-node";import{existsSync as $,mkdirSync as F,readFileSync as O,writeFileSync as q}from"fs";import{homedir as L}from"os";import{join as b}from"path";import{exec as B}from"child_process";import{platform as S}from"process";function I(t){let e=S==="win32"?`echo|set /p="${t}"| clip`:S==="darwin"?`printf '%s' '${t}' | pbcopy`:`printf '%s' '${t}' | xclip -selection clipboard 2>/dev/null || printf '%s' '${t}' | xsel --clipboard 2>/dev/null`;B(e,()=>{})}var j="1950a258-227b-4e31-a9cf-717495945fc2",R=b(L(),".mcp-dataverse"),h=b(R,"msal-cache.json"),V=300*1e3;function H(){return{beforeCacheAccess:async t=>{if($(h))try{let e=O(h,"utf-8"),n;try{n=d(e)}catch{n=e}t.tokenCache.deserialize(n)}catch{}},afterCacheAccess:async t=>{t.cacheHasChanged&&(F(R,{recursive:!0}),q(h,w(t.tokenCache.serialize()),{encoding:"utf-8",mode:384}))}}}var u=class{environmentUrl;pca;cachedToken=null;tokenExpiresAt=0;pendingAuth=null;backgroundAuthFlow=null;activeDeviceCode=null;constructor(e){this.environmentUrl=e.replace(/\/$/,""),this.pca=new N({auth:{clientId:j,authority:"https://login.microsoftonline.com/common"},cache:{cachePlugin:H()}})}async getToken(){let e=Date.now();return this.cachedToken!==null&&this.tokenExpiresAt>e+6e4?this.cachedToken:this.pendingAuth!==null?this.pendingAuth:(this.pendingAuth=this.refreshToken().finally(()=>{this.pendingAuth=null}),this.pendingAuth)}invalidateToken(){this.cachedToken=null,this.tokenExpiresAt=0}async isAuthenticated(){try{return await this.getToken(),!0}catch{return!1}}async setupViaDeviceCode(){await this.runDeviceCodeFlowBlocking()}async refreshToken(){let e=await this.pca.getAllAccounts();if(e.length>0)try{return await this.acquireSilently()}catch{process.stderr.write(`
[mcp-dataverse] Session expired \u2014 initiating re-authentication.
`)}return this.authenticateViaDeviceCode(e.length===0?"first-time":"session-expired")}async authenticateViaDeviceCode(e){if(this.backgroundAuthFlow)try{return await this.acquireSilently()}catch{}let n=null,r=new Promise(i=>{n=i});if(this.backgroundAuthFlow||(this.activeDeviceCode=null,this.backgroundAuthFlow=this.pca.acquireTokenByDeviceCode({scopes:[`${this.environmentUrl}/.default`],deviceCodeCallback:i=>{I(i.userCode),this.activeDeviceCode={userCode:i.userCode,verificationUri:i.verificationUri},n?.(),n=null,process.stderr.write(`
[mcp-dataverse] Sign in required

  1. Open ${i.verificationUri} in your browser
     (use the browser profile linked to your Power Platform account)
  2. Paste the code: ${i.userCode}  (already copied to your clipboard)
  3. Sign in with your work account

`)}}).then(i=>{i&&(this.cacheResult(i),process.stderr.write(`
[mcp-dataverse] Authenticated \u2713  Token cached.

`))}).catch(i=>{let o=i instanceof Error?i.message:String(i);process.stderr.write(`
[mcp-dataverse] Background auth failed: ${o}
`)}).finally(()=>{this.backgroundAuthFlow=null,this.activeDeviceCode=null}),await Promise.race([r,new Promise(i=>setTimeout(i,6e3))])),this.activeDeviceCode!==null){let{userCode:i,verificationUri:o}=this.activeDeviceCode,c=e==="first-time"?"First-time sign-in required to connect to Dataverse.":"Your Dataverse session has expired. Please sign in again.";throw new Error(`${c}

  1. Open this URL in your browser:
     ${o}

  2. Enter the code: ${i}  (already copied to your clipboard)

  3. Sign in with your organizational (work/school) account

Authentication is running in the background. Once you have signed in, retry this command.`)}throw new Error(`Authentication required but could not reach the Microsoft sign-in service.
Check your network connection and retry.

Alternatively, pre-authenticate via the terminal:
  npx mcp-dataverse-auth ${this.environmentUrl}
Then restart the MCP server.`)}async acquireSilently(){let e=await this.pca.getAllAccounts();if(e.length===0)throw new Error("No account found in cache after authentication.");let n=await this.pca.acquireTokenSilent({scopes:[`${this.environmentUrl}/.default`],account:e[0]});if(!n?.accessToken)throw new Error("Token acquisition returned an empty access token.");return this.cacheResult(n),n.accessToken}async runDeviceCodeFlowBlocking(){let e=await Promise.race([this.pca.acquireTokenByDeviceCode({scopes:[`${this.environmentUrl}/.default`],deviceCodeCallback:n=>{I(n.userCode),process.stderr.write(`
[mcp-dataverse] Sign in required

  1. Open ${n.verificationUri} in your browser
     (use the browser profile linked to your Power Platform account)
  2. Paste the code: ${n.userCode}  (already copied to your clipboard)
  3. Sign in with your work account

`)}}),new Promise((n,r)=>setTimeout(()=>r(new Error("Authentication timed out after 5 minutes. Please try again.")),V))]);e&&(this.cacheResult(e),process.stderr.write(`
[mcp-dataverse] Authenticated \u2713  Token cached \u2014 no sign-in needed next time.

`))}cacheResult(e){this.cachedToken=e.accessToken,this.tokenExpiresAt=e.expiresOn?.getTime()??Date.now()+3300*1e3}};async function Z(){process.stderr.write(`MCP Dataverse \u2014 One-time Authentication Setup
`),process.stderr.write(`\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
`);let t=process.argv[2];t&&(process.env.DATAVERSE_ENV_URL=t);let e;try{e=k()}catch{process.stderr.write(`Environment URL is required.
Usage: npx mcp-dataverse-auth https://yourorg.crm.dynamics.com
Or set DATAVERSE_ENV_URL before running.
`),process.exit(1)}process.stderr.write(`Environment : ${e.environmentUrl}
`),process.stderr.write(`Token cache : ~/.mcp-dataverse/msal-cache.json

`),process.stderr.write(`A browser window will open. Sign in with your Microsoft account.

`),await new u(e.environmentUrl).setupViaDeviceCode(),process.stderr.write(`
\u2713 Authentication successful!
  Token cached in ~/.mcp-dataverse/msal-cache.json

  Restart the MCP server in VS Code to apply.
`)}Z().catch(t=>{process.stderr.write(`
Setup failed: ${t instanceof Error?t.message:String(t)}
`),process.exit(1)});
