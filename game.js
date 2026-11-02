import * as THREE from 'three';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#a5bdc8');
scene.fog = new THREE.FogExp2('#a5bdc8', 0.00155);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 1000);
const hemi = new THREE.HemisphereLight('#d8efff', '#465049', 2.15); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffe3bf', 3.2); sun.position.set(-110, 150, 70); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -120; sun.shadow.camera.right = 120; sun.shadow.camera.top = 120; sun.shadow.camera.bottom = -120; sun.shadow.bias = -0.00015; scene.add(sun);
const fill = new THREE.DirectionalLight('#78a9dc', 0.8); fill.position.set(90, 50, -100); scene.add(fill);

const mat = (color, roughness = .82, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const asphalt = mat('#30383d'), sidewalk = mat('#9e9d91'), concrete = mat('#b8b1a3'), white = mat('#ece7d7'), dark = mat('#141b20', .48), glass = new THREE.MeshStandardMaterial({ color: '#78a4af', roughness: .24, metalness: .3, transparent: true, opacity: .76 }), tireMat = mat('#17191a'), lampMat = new THREE.MeshStandardMaterial({ color: '#e5c27e', emissive: '#ffac48', emissiveIntensity: 1.5 });
const boxGeo = new THREE.BoxGeometry(1,1,1);
function box(parent, x,y,z, sx,sy,sz, material, cast = true) { const m = new THREE.Mesh(boxGeo, material); m.position.set(x,y,z); m.scale.set(sx,sy,sz); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; }

// A wide, continuous city floor and a walkable grid of streets.
const ground = new THREE.Mesh(new THREE.PlaneGeometry(900,900), mat('#75816f')); ground.rotation.x=-Math.PI/2; ground.position.y=-.12; ground.receiveShadow=true; scene.add(ground);
const citySize=720, streetGap=90, roadWidth=17, blockHalf=(streetGap-roadWidth)/2;
for(let v=-360;v<=360;v+=streetGap){
  const r1=new THREE.Mesh(new THREE.PlaneGeometry(citySize,roadWidth),asphalt);r1.rotation.x=-Math.PI/2;r1.position.set(0,.005,v);r1.receiveShadow=true;scene.add(r1);
  const r2=new THREE.Mesh(new THREE.PlaneGeometry(roadWidth,citySize),asphalt);r2.rotation.x=-Math.PI/2;r2.position.set(v,.006,0);r2.receiveShadow=true;scene.add(r2);
  for(const s of [-1,1]){
    const curbA=new THREE.Mesh(new THREE.PlaneGeometry(citySize,2.4),sidewalk);curbA.rotation.x=-Math.PI/2;curbA.position.set(0,.018,v+s*(roadWidth/2+1.2));scene.add(curbA);
    const curbB=new THREE.Mesh(new THREE.PlaneGeometry(2.4,citySize),sidewalk);curbB.rotation.x=-Math.PI/2;curbB.position.set(v+s*(roadWidth/2+1.2),.019,0);scene.add(curbB);
  }
  // Center dashes and crosswalks, repeated at intersections.
  for(let p=-350;p<350;p+=11){
    const dash=new THREE.Mesh(new THREE.PlaneGeometry(3,.22),mat('#c5bd9f'));dash.rotation.x=-Math.PI/2;dash.position.set(p,.026,v);scene.add(dash);
    const dash2=new THREE.Mesh(new THREE.PlaneGeometry(.22,3),mat('#c5bd9f'));dash2.rotation.x=-Math.PI/2;dash2.position.set(v,.027,p);scene.add(dash2);
  }
  for(const dir of [-1,1]) for(let i=0;i<5;i++){
    const c1=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.5),white);c1.rotation.x=-Math.PI/2;c1.position.set(v+dir*(roadWidth/2+1.2),.03,v-7+i*1.35);scene.add(c1);
    const c2=new THREE.Mesh(new THREE.PlaneGeometry(1.5,1.1),white);c2.rotation.x=-Math.PI/2;c2.position.set(v-7+i*1.35,.03,v+dir*(roadWidth/2+1.2));scene.add(c2);
  }
}

// Procedural blocks: varied storefronts, apartments, rooftop details, trees and palms.
let seed=4831; function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const buildingColors=['#cfbca3','#b7c1bd','#c7aa91','#8f9ea0','#d3c7b1','#a8aba2','#d3b59d','#98a9aa','#bcae95'];
const buildings=[];
for(let gx=-4;gx<4;gx++) for(let gz=-4;gz<4;gz++){
  const cx=gx*streetGap+streetGap/2, cz=gz*streetGap+streetGap/2;
  const count=1+(rand()>.42?1:0);
  for(let n=0;n<count;n++){
    const w= count===1?52:24+rand()*12, d=count===1?53:24+rand()*12;
    const ox=count===1?0:(n===0?-17:17), oz=count===1?0:(n===0?13:-13);
    const h=12+Math.pow(rand(),1.7)*50;
    const color=buildingColors[Math.floor(rand()*buildingColors.length)];
    const root=new THREE.Group();root.position.set(cx+ox,0,cz+oz);scene.add(root);
    const body=box(root,0,h/2,0,w,h,d,mat(color)); buildings.push(body);
    // Rooftop lip, AC boxes and a water tank.
    box(root,0,h+.25,0,w+.7,.5,d+.7,mat('#938e84'));
    for(let k=0;k<1+Math.floor(rand()*3);k++) box(root,(rand()-.5)*w*.55,h+1+rand()*1.5,(rand()-.5)*d*.55,3+rand()*4,2+rand()*2,3+rand()*4,mat('#858b87'));
    if(rand()>.54){const tank=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.3,2.5,10),mat('#667774'));tank.position.set((rand()-.5)*w*.4,h+2,(rand()-.5)*d*.4);root.add(tank);}
    // Repeating warm windows on each visible facade.
    const rows=Math.floor(h/4.8), cols=Math.max(2,Math.floor(w/6));
    const brightWindows=[], darkWindows=[]; const dummy=new THREE.Object3D();
    for(let row=0;row<rows;row++) for(let col=0;col<cols;col++){
      const wy=3+row*4.7, wx=-w/2+3.1+col*((w-6.2)/Math.max(1,cols-1));
      const addWindow=(x,y,z,sx,sy,sz)=>{dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();(rand()>.24?brightWindows:darkWindows).push(dummy.matrix.clone());};
      addWindow(wx,wy,d/2+.015,1.5,1.8,.07);
      if(rand()>.25)addWindow(wx,wy,-d/2-.015,1.5,1.8,.07);
      if(col%2===0){const sideCols=Math.max(2,Math.floor(d/6));const wz=-d/2+3+Math.floor(col/2)%sideCols*(d-6)/Math.max(1,sideCols-1);addWindow(w/2+.015,wy,wz,.07,1.8,1.5);}
    }
    for(const [windows,color,emissive] of [[brightWindows,'#849395','#8a6c45'],[darkWindows,'#47545a','#11191e']])if(windows.length){
      const wm=new THREE.MeshStandardMaterial({color,emissive,emissiveIntensity:color==='#849395'?.19:.05,roughness:.5});
      const instances=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),wm,windows.length);instances.castShadow=false;instances.receiveShadow=false;
      windows.forEach((matrix,index)=>instances.setMatrixAt(index,matrix));root.add(instances);
    }
    // Ground-floor awnings and saturated shop signs.
    if(h<30){const signMat=new THREE.MeshStandardMaterial({color:rand()>.5?'#e26f53':'#36a8a0',emissive:rand()>.5?'#71301d':'#164b49',emissiveIntensity:.42});box(root,0,3.8,d/2+.12,w*.55,1.1,.25,signMat);}
  }
  // Green pockets on most blocks.
  if(rand()>.22){for(let t=0;t<2;t++){
    const tx=cx+(rand()-.5)*45,tz=cz+(rand()-.5)*43;
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.28,.42,3,7),mat('#70543e'));trunk.position.set(tx,1.5,tz);trunk.castShadow=true;scene.add(trunk);
    const foliage=new THREE.Mesh(new THREE.IcosahedronGeometry(2.6+rand()*1.5,1),mat(rand()>.5?'#54745a':'#687f58'));foliage.position.set(tx,4.1,tz);foliage.castShadow=true;scene.add(foliage);
  }}
}
// Simple streetlights along selected sidewalks.
for(let x=-315;x<=315;x+=90) for(const side of [-1,1]) for(let z=-300;z<=300;z+=90){
  const lx=x+side*12,lz=z+streetGap/2;
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.17,6.6,7),mat('#343c3d'));pole.position.set(lx,3.3,lz);pole.castShadow=true;scene.add(pole);
  const arm=box(scene,lx+side*.8,6.35,lz,1.6,.12,.12,mat('#343c3d'));arm.rotation.y=0;
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.24,8,6),lampMat);bulb.position.set(lx+side*1.5,6.2,lz);scene.add(bulb);
}

function makeCar(color='#cf4638', withDriver=false){
  const root=new THREE.Group();const paint=new THREE.MeshStandardMaterial({color,roughness:.32,metalness:.38});
  box(root,0,.8,0,2.1,.62,4.25,paint);box(root,0,1.35,-.18,1.72,.8,2.4,paint);
  const cabin=box(root,0,1.43,-.23,1.55,.62,2.15,glass,false);cabin.material=glass;
  box(root,0,.83,2.13,1.85,.2,.08,mat('#272d2e')); // grille
  for(const side of [-1,1]){
    box(root,side*.73,.91,-2.14,.42,.18,.1,mat('#fff1bd',.24));
    box(root,side*.73,.91,2.14,.4,.19,.1,new THREE.MeshStandardMaterial({color:'#e04a3f',emissive:'#7a100d',emissiveIntensity:.7}));
  }
  const wheels=[];
  for(const x of [-1.03,1.03]) for(const z of [-1.35,1.35]){
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.28,14),tireMat);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.44,z);wheel.castShadow=true;root.add(wheel);wheels.push(wheel);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.295,10),mat('#a3a9a4',.28,.6));hub.rotation.z=Math.PI/2;hub.position.copy(wheel.position);root.add(hub);
  }
  box(root,-.36,1.18,-.34,.12,.13,.2,mat('#202625'));box(root,.36,1.18,-.34,.12,.13,.2,mat('#202625'));
  root.userData.wheels=wheels;root.userData.speed=0;root.userData.paint=paint;scene.add(root);return root;
}
const car=makeCar('#cf493c');car.position.set(5,0,7);car.rotation.y=0;
const parked=[];
for(const [x,z,r,c] of [[-15,-22,.1,'#d3a94a'],[23,17,Math.PI,'#467982'],[-26,62,Math.PI/2,'#d1d1c5'],[42,-62,-Math.PI/2,'#b64737'],[-68,14,0,'#556b9a'],[65,105,Math.PI,'#a8b9b2']]){const p=makeCar(c);p.position.set(x,0,z);p.rotation.y=r;parked.push(p);}

// Player avatar with a visible head/torso silhouette.
const player=new THREE.Group();const bodyMat=mat('#d7ff4f'), pantsMat=mat('#263943'), skinMat=mat('#bb896d');
const torso=box(player,0,1.13,0,.58,.82,.34,bodyMat);const head=new THREE.Mesh(new THREE.SphereGeometry(.22,12,10),skinMat);head.position.y=1.75;head.castShadow=true;player.add(head);
const legL=box(player,-.17,.48,0,.2,.65,.23,pantsMat),legR=box(player,.17,.48,0,.2,.65,.23,pantsMat);
const armL=box(player,-.39,1.14,0,.16,.68,.18,skinMat),armR=box(player,.39,1.14,0,.16,.68,.18,skinMat);
player.position.set(2.4,0,7);scene.add(player);
let driving=false, yaw=0, cameraYaw=0, cameraPitch=.12, velocity=0, steer=0, cash=1250;

const route=[new THREE.Vector3(5,0,-88),new THREE.Vector3(88,0,-88),new THREE.Vector3(88,0,92),new THREE.Vector3(178,0,92),new THREE.Vector3(178,0,-88),new THREE.Vector3(268,0,-88)];
const checkpointGroup=new THREE.Group();scene.add(checkpointGroup);let checkpointMeshes=[],missionActive=false,checkpointIndex=0,missionTime=82;
function makeCheckpoint(p){const g=new THREE.Group();g.position.copy(p);const ring=new THREE.Mesh(new THREE.TorusGeometry(4.5,.36,8,32),new THREE.MeshStandardMaterial({color:'#d7ff4f',emissive:'#d7ff4f',emissiveIntensity:1.6,roughness:.3}));ring.position.y=3.2;g.add(ring);const beam=new THREE.Mesh(new THREE.CylinderGeometry(.12,.7,3.2,12,1,true),new THREE.MeshBasicMaterial({color:'#d7ff4f',transparent:true,opacity:.2,side:THREE.DoubleSide}));beam.position.y=1.6;g.add(beam);const light=new THREE.PointLight('#d7ff4f',20,13,2);light.position.y=3;g.add(light);checkpointGroup.add(g);return g;}
route.forEach(p=>checkpointMeshes.push(makeCheckpoint(p)));checkpointGroup.visible=false;
// Collectible cash pickups are placed along side streets.
const pickups=[];for(const [x,z] of [[-41,-43],[43,-132],[132,42],[-133,132],[223,42],[312,-132]]){const g=new THREE.Group();g.position.set(x,1.15,z);const token=new THREE.Mesh(new THREE.TorusGeometry(.7,.13,7,18),new THREE.MeshStandardMaterial({color:'#d7ff4f',emissive:'#73b529',emissiveIntensity:1.3}));token.rotation.x=Math.PI/2;g.add(token);const dot=new THREE.Mesh(new THREE.SphereGeometry(.32,8,6),mat('#d7ff4f'));g.add(dot);scene.add(g);pickups.push({group:g,active:true});}

const keys=new Set();let drag=null,lastPointer={x:0,y:0};
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys.add(k);if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(k==='e')toggleVehicle();if(k==='escape')document.exitPointerLock?.();});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};lastPointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-lastPointer.x,dy=e.clientY-lastPointer.y;cameraYaw-=dx*.004;cameraPitch=THREE.MathUtils.clamp(cameraPitch+dy*.002,-.1,.7);lastPointer={x:e.clientX,y:e.clientY};});
canvas.addEventListener('pointerup',()=>drag=null);
function hookButton(button,key){button.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(key);button.setPointerCapture?.(e.pointerId)});for(const ev of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(ev,()=>keys.delete(key));}
document.querySelectorAll('[data-key]').forEach(b=>hookButton(b,b.dataset.key));document.querySelector('#mobileEnter').addEventListener('click',toggleVehicle);

function toggleVehicle(){if(driving){driving=false;player.visible=true;player.position.set(car.position.x+Math.cos(yaw)*2.1,0,car.position.z-Math.sin(yaw)*2.1);player.rotation.y=yaw;velocity*=.45;showToast('ON FOOT · EXPLORE THE CITY');}else if(player.position.distanceTo(car.position)<5){driving=true;player.visible=false;yaw=car.rotation.y;cameraYaw=0;showToast('VEHICLE ACQUIRED · LET’S MOVE');}else showToast('GET CLOSER TO YOUR RED CAR');}
let toastTimer;function showToast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2100);}
const startBtn=document.querySelector('#startMission');startBtn.addEventListener('click',()=>{if(!missionActive){missionActive=true;missionTime=82;checkpointIndex=0;checkpointGroup.visible=true;startBtn.querySelector('span').textContent='MISSION IN PROGRESS';startBtn.style.background='#f0bd55';showToast('RACE STARTED · HIT THE GREEN RINGS');}else if(checkpointIndex>=route.length){missionActive=true;checkpointIndex=0;missionTime=82;checkpointGroup.visible=true;showToast('NEW RUN · MAKE IT COUNT');}});

const minimap=document.querySelector('#minimap'),ctx=minimap.getContext('2d');
function drawMap(){const w=minimap.width,h=minimap.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#19252d';ctx.fillRect(0,0,w,h);const px=car.position.x,pz=car.position.z,scale=.48;ctx.save();ctx.translate(w/2,h/2);ctx.rotate(-yaw);ctx.translate(-px*scale,-pz*scale);
 ctx.fillStyle='#4b5959';for(let v=-360;v<=360;v+=90){ctx.fillRect(-360*scale,v*scale,720*scale,17*scale);ctx.fillRect(v*scale,-360*scale,17*scale,720*scale);}
 ctx.fillStyle='#b9b6a4';for(let x=-315;x<=315;x+=90)for(let z=-315;z<=315;z+=90){ctx.fillRect(x*scale-12,z*scale-12,65*scale,65*scale);}
 for(const p of pickups){if(p.active){ctx.fillStyle='#d7ff4f';ctx.beginPath();ctx.arc(p.group.position.x*scale,p.group.position.z*scale,2.6,0,Math.PI*2);ctx.fill();}}
 if(missionActive&&checkpointIndex<route.length){ctx.fillStyle='#d7ff4f';ctx.beginPath();ctx.arc(route[checkpointIndex].x*scale,route[checkpointIndex].z*scale,5,0,Math.PI*2);ctx.fill();}
 ctx.restore();ctx.beginPath();ctx.fillStyle='#d7ff4f';ctx.moveTo(w/2,h/2-8);ctx.lineTo(w/2-5,h/2+5);ctx.lineTo(w/2+5,h/2+5);ctx.closePath();ctx.fill();ctx.strokeStyle='#101722';ctx.lineWidth=2;ctx.stroke();
}
function update(dt){
  const accel=keys.has('w')||keys.has('arrowup'), brake=keys.has('s')||keys.has('arrowdown'), left=keys.has('a')||keys.has('arrowleft'), right=keys.has('d')||keys.has('arrowright'), hand=keys.has(' ')||keys.has('space');
  if(driving){
    const maxSpeed=33;velocity+=(accel?24:0)*dt;velocity-=(brake?32:0)*dt;velocity*=Math.pow(hand?.965:.989,dt*60);velocity*=Math.pow(.995,dt*60);velocity=THREE.MathUtils.clamp(velocity,-11,maxSpeed);
    const input=(right?1:0)-(left?1:0);steer=THREE.MathUtils.damp(steer,input,.14,dt);yaw-=steer*velocity*.016*dt*(hand?1.3:1);
    car.position.x-=Math.sin(yaw)*velocity*dt;car.position.z-=Math.cos(yaw)*velocity*dt;car.rotation.y=yaw;
    for(const w of car.userData.wheels)w.rotation.x+=velocity*dt*1.8;
    const kmh=Math.round(Math.abs(velocity)*4.2);document.querySelector('#speed').textContent=String(kmh).padStart(3,'0');document.querySelector('#speedbar').style.width=Math.min(100,kmh/1.3)+'%';
  }else{
    const moveX=(right?1:0)-(left?1:0),moveZ=(brake?1:0)-(accel?1:0);const v=new THREE.Vector3(moveX,0,moveZ);
    if(v.lengthSq()>0){v.normalize().applyAxisAngle(new THREE.Vector3(0,1,0),cameraYaw);player.position.addScaledVector(v,dt*7);player.rotation.y=Math.atan2(-v.x,-v.z);legL.rotation.x=Math.sin(performance.now()*.012)*.55;legR.rotation.x=-legL.rotation.x;armL.rotation.x=-legL.rotation.x*.5;armR.rotation.x=-legR.rotation.x*.5;}else{legL.rotation.x=THREE.MathUtils.damp(legL.rotation.x,0,9,dt);legR.rotation.x=THREE.MathUtils.damp(legR.rotation.x,0,9,dt);}
    player.position.x=THREE.MathUtils.clamp(player.position.x,-350,350);player.position.z=THREE.MathUtils.clamp(player.position.z,-350,350);
  }
  // Prevent driving through building footprints; collisions softly bounce the car back.
  if(driving){for(const b of buildings){const p=new THREE.Vector3();b.getWorldPosition(p);const hx=b.scale.x/2+1.6,hz=b.scale.z/2+2.6;if(Math.abs(car.position.x-p.x)<hx&&Math.abs(car.position.z-p.z)<hz){car.position.x-=Math.sin(yaw)*velocity*dt*2;car.position.z-=Math.cos(yaw)*velocity*dt*2;velocity*=-.22;}}}
  const activePosition=driving?car.position:player.position;
  for(const pickup of pickups){if(!pickup.active)continue;pickup.group.rotation.y+=dt*1.6;pickup.group.position.y=1.15+Math.sin(performance.now()*.003+pickup.group.position.x)*.18;if(activePosition.distanceTo(pickup.group.position)<(driving?3.4:2.1)){pickup.active=false;pickup.group.visible=false;cash+=250;document.querySelector('#cash').textContent='$ '+cash.toLocaleString('en-US');showToast('+$250 · CASH PICKUP');}}
  if(missionActive){missionTime-=dt;if(checkpointIndex<route.length&&activePosition.distanceTo(route[checkpointIndex])<8){checkpointMeshes[checkpointIndex].visible=false;checkpointIndex++;document.querySelector('#missionProgress').style.width=(checkpointIndex/route.length*100)+'%';document.querySelector('#checkpointCount').textContent=`${checkpointIndex} / ${route.length}`;if(checkpointIndex<route.length)checkpointMeshes[checkpointIndex].visible=true;else{missionActive=false;checkpointGroup.visible=false;cash+=2500;document.querySelector('#cash').textContent='$ '+cash.toLocaleString('en-US');startBtn.querySelector('span').textContent='PLAY AGAIN';startBtn.style.background='#d7ff4f';showToast('RACE COMPLETE · +$2,500');}}if(missionTime<=0&&missionActive){missionActive=false;checkpointGroup.visible=false;startBtn.querySelector('span').textContent='TRY AGAIN';startBtn.style.background='#d7ff4f';showToast('TIME’S UP · TAKE ANOTHER RUN');}}
  for(let i=0;i<checkpointMeshes.length;i++)if(checkpointMeshes[i].visible){checkpointMeshes[i].rotation.y+=dt*.45;const s=1+Math.sin(performance.now()*.003+i)*.045;checkpointMeshes[i].scale.setScalar(s);}
  // Chase camera with orbit from pointer drag.
  const focus=driving?car.position:player.position;const targetYaw=driving?yaw+cameraYaw:cameraYaw;const dist=driving?10.5:8.5;const height=driving?4.4:3.8;const desired=new THREE.Vector3(focus.x+Math.sin(targetYaw)*dist,focus.y+height+cameraPitch*5,focus.z+Math.cos(targetYaw)*dist);
  camera.position.lerp(desired,1-Math.exp(-4.4*dt));camera.lookAt(focus.x,focus.y+(driving?1.1:1.2),focus.z);
  const nearby=player.position.distanceTo(car.position);
  document.querySelector('#prompt').classList.toggle('visible',!driving&&nearby<5);document.querySelector('#vehicleHud').classList.toggle('visible',driving);
  if(missionActive&&checkpointIndex<route.length)checkpointMeshes[checkpointIndex].visible=true;
  drawMap();
}
let prev=performance.now();function animate(now){requestAnimationFrame(animate);const dt=Math.min(.04,(now-prev)/1000);prev=now;update(dt);renderer.render(scene,camera);}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);

// Begin with a cinematic view of the sports car and reveal the game once the first frame is ready.
player.visible=true;player.position.set(2.4,0,7);player.rotation.y=0;camera.position.set(10,8,23);camera.lookAt(0,1,0);
requestAnimationFrame(()=>{document.querySelector('#loading').classList.add('done');setTimeout(()=>document.querySelector('#loading').remove(),600);});
requestAnimationFrame(animate);
