import { useEffect, useMemo, useRef, useState } from "react";

const PALETTE={
  bg:"#07080d",
  panel:"rgba(11,13,20,.82)",
  line:"rgba(255,255,255,.12)",
  ink:"#f8efe9",
  soft:"rgba(248,239,233,.64)",
  dim:"rgba(248,239,233,.42)",
  gold:"#d6b15e",
  pink:"#ff5f91",
  cyan:"#58d7c4",
  blue:"#8fb5ff",
  green:"#9be78d"
};

const PRESETS=[
  {
    id:"performer",
    label:"Performer",
    prompt:"Build a realistic premium AI performer avatar with warm Latina features, long dark hair, expressive brown eyes, a slim athletic body, black and gold stage wardrobe, natural posture, conversational face rig, and elegant room-host energy."
  },
  {
    id:"stage",
    label:"Stage",
    prompt:"Create a luxury VYBE virtual suite with warm spotlights, black marble floor, gold trim, soft neon magenta accents, interactive gift effects, camera rails, and a real-time performer mark."
  },
  {
    id:"motion",
    label:"Motion",
    prompt:"Generate a believable performer motion set: idle breathing, subtle hip weight shift, conversational head turns, gift celebration, lean-in acknowledgement, point-to-game gesture, and smooth transitions."
  },
  {
    id:"wardrobe",
    label:"Wardrobe",
    prompt:"Design an elegant black and gold performance wardrobe with PBR fabric, metal jewelry accents, cloth simulation zones, collision boundaries, and performer-approved variants."
  }
];

const MOTIONS=[
  {id:"idle",label:"Idle",body:"Breathing, gaze, weight transfer"},
  {id:"talk",label:"Talk",body:"Head turns, face cadence, hand settle"},
  {id:"lean",label:"Lean",body:"Spine and head lean toward viewer"},
  {id:"celebrate",label:"Celebrate",body:"Gift reaction with torso and arms"},
  {id:"walk",label:"Walk",body:"Runway step cycle for stage tests"},
  {id:"point",label:"Point",body:"Game or event direction gesture"}
];

const POSE_STATES=[
  {id:"standing",label:"Standing",body:"Full-body reference pose, balance, heels, gaze"},
  {id:"seated",label:"Seated",body:"Chair/floor contact, spine compression, camera framing"},
  {id:"recline",label:"Recline",body:"Back/hip support, hair contact, limb occlusion"},
  {id:"kneel",label:"Kneel",body:"Floor contact, knee/foot locks, weight transfer"},
  {id:"closeup",label:"Close-up",body:"Face, hands, prop, gaze and lens-safe framing"},
  {id:"transition",label:"Transition",body:"Motion between poses without popping or clipping"}
];

const CONTROL_CHANNELS=[
  ["Gaze","Eye aim, blink, attention target",PALETTE.blue],
  ["Face","Expression, lips, brows, breath",PALETTE.pink],
  ["Spine","Lean, twist, posture, balance",PALETTE.cyan],
  ["Hands","Finger pose, grip, touch target",PALETTE.gold],
  ["Props","Approved object sockets and collisions",PALETTE.green],
  ["Camera","Shot safety, crop, occlusion, focus",PALETTE.blue],
  ["Hair","Groom shape and secondary motion",PALETTE.gold],
  ["Cloth","Visibility state, simulation, material rules",PALETTE.pink]
];

const ADULT_RIG_REQUIREMENTS=[
  "Performer-approved likeness, usage rights, and allowed-action profile",
  "Full-body GLB/VRM or MetaHuman-grade rig, not a single-pose photo",
  "Pose library covering standing, seated, reclined, kneeling, close-up, and transitions",
  "Prop sockets for hands, stage objects, and approved body contact zones",
  "Collision, occlusion, and camera QA before any private-session action can run",
  "Wardrobe/visibility states controlled by performer consent and compliance profile",
  "Motion clips must be captured, retargeted, smoothed, and foot/contact locked",
  "Fallback behavior blocks any requested action when the matching rig clip is missing"
];

const MODULES=[
  ["Intent Director","Prompt to structured performer, scene, wardrobe, and motion specs.",PALETTE.gold],
  ["Identity Engine","Consented likeness, body profile, face rig, voice markers, and usage rights.",PALETTE.pink],
  ["Mesh Builder","Topology, UVs, LoDs, material slots, body deformation zones.",PALETTE.cyan],
  ["Rig Builder","Humanoid skeleton, IK, face blendshapes, visemes, collision anchors.",PALETTE.blue],
  ["Motion Engine","Motion retrieval, prompt-to-motion, retargeting, smoothing, foot locking.",PALETTE.green],
  ["Simulation","Hair, cloth, jewelry, soft tissue, contact and self-intersection checks.",PALETTE.gold],
  ["Renderer","Layered rig preview now, GLB/VRM and Unreal-grade runtime next.",PALETTE.cyan],
  ["QA Gate","Anatomy, identity, material, motion, FPS, and compliance scoring.",PALETTE.pink]
];

const TARGET_IMAGE_SRC="/assets/muse/muse-latina-concept.png";
const RIG_ASSET_REV="20260527-rembg-masks";
const RIG_LAYERS=["legs","shoes","hips","torso","front-arm","head"];
const RENDERER_BLOCKED=true;

function deriveSpec(prompt,presetId,motion,pose){
  const text=prompt.toLowerCase();
  const realism=text.includes("real")||text.includes("photoreal")||text.includes("premium")?94:82;
  const cloth=text.includes("cloth")||text.includes("wardrobe")||text.includes("fabric")?91:78;
  const face=text.includes("face")||text.includes("eyes")||text.includes("expressive")?93:84;
  const topology=text.includes("topology")||text.includes("rig")||text.includes("blendshape")?92:86;
  const motionScore=motion==="celebrate"?90:motion==="walk"?84:motion==="lean"?88:pose==="transition"?82:86;
  const stage=text.includes("suite")||text.includes("stage")||presetId==="stage"?"luxury suite":"intimate studio";
  const wardrobe=text.includes("gold")?"black and gold performance wardrobe":text.includes("red")?"deep red stage wardrobe":"black premium performance wardrobe";
  const generation=[
    "Parse prompt into PerformerSceneSpec",
    "Lock consent and identity constraints",
    "Extract likeness anchors from the photoreal target",
    "Generate deformation-safe GLB/VRM topology",
    "Assign PBR skin, fabric, hair, jewelry, and material slots",
    "Build humanoid rig with face, gaze, and viseme channels",
    "Bind prop sockets, contact zones, and pose-specific collisions",
    "Select motion clips and procedural micro-motion",
    "Retarget to current pose family and blend transitions",
    "Run simulation and QA gates",
    "Publish to local real-time runtime"
  ];
  return {
    avatar:"VYBE Forge Performer 001",
    stage,
    wardrobe,
    motion,
    pose,
    faceRig:"ARKit-style expression set plus visemes",
    bodyRig:"Humanoid IK, spine, head, hands, foot locks, contact zones, prop sockets",
    renderer:"Layered character rig now, GLB/VRM runtime next",
    scores:{realism,topology,face,cloth,motion:motionScore,fps:96,compliance:98},
    generation
  };
}

function ForgeCharacterRigTarget({motion,pose,channelFocus,spec,intensity}){
  const targetRef=useRef(null);
  const hasPoseRig=!RENDERER_BLOCKED&&pose==="standing";
  const rigStatus=RENDERER_BLOCKED?"blocked-real-renderer-required":hasPoseRig?"ready":"missing-pose-rig";
  useEffect(()=>{
    let raf=0;
    let frame=0;
    const loop=()=>{
      frame+=1;
      if(targetRef.current){
        targetRef.current.dataset.frame=String(frame);
        targetRef.current.dataset.motion=motion;
        targetRef.current.dataset.pose=pose;
        targetRef.current.dataset.channel=channelFocus;
        targetRef.current.dataset.rigStatus=rigStatus;
        targetRef.current.style.setProperty("--forge-intensity",String(intensity));
      }
      window.__vybeForgeTarget={ready:true,frame,motion,pose,channelFocus,rigStatus,mode:"renderer-gate-no-paper-doll"};
      raf=requestAnimationFrame(loop);
    };
    loop();
    return()=>cancelAnimationFrame(raf);
  },[motion,pose,channelFocus,intensity,rigStatus]);

  const markers=[
    ["Head rig","49%","11%",PALETTE.pink],
    ["Hair groom","61%","18%",PALETTE.gold],
    ["Spine IK","45%","35%",PALETTE.cyan],
    ["Hand socket","35%","54%",PALETTE.green],
    ["Hip anchor","57%","51%",PALETTE.pink],
    ["Foot lock","55%","88%",PALETTE.gold]
  ];
  const motionCopy={
    idle:"requires rigged idle breathing and gaze",
    talk:"requires visemes, face rig, gaze and head motion",
    lean:"requires spine IK and real mesh deformation",
    celebrate:"requires torso, arm, face, hair and cloth animation",
    walk:"requires full-body locomotion, foot locks and balance",
    point:"requires shoulder, elbow, wrist and finger controls"
  }[motion]||"real renderer motion";
  const poseCopy=(POSE_STATES.find(item=>item.id===pose)||POSE_STATES[0]).body;

  return <div ref={targetRef} className={`forge-target forge-motion-${motion} forge-pose-${pose} ${hasPoseRig?"forge-rig-ready":RENDERER_BLOCKED?"forge-rig-reference-only":"forge-rig-missing-pose"} ${RENDERER_BLOCKED?"forge-renderer-blocked":""}`} data-forge-target="character-rig" data-motion-system="renderer-gate-no-paper-doll" data-motion={motion} data-pose={pose} data-channel={channelFocus} data-frame="0" data-rig-status={rigStatus} data-rig-layer-count={RIG_LAYERS.length} style={{position:"relative",minHeight:720,height:"min(82vh,880px)",overflow:"hidden",display:"grid",placeItems:"center",background:"radial-gradient(circle at 50% 18%,rgba(214,177,94,.16),transparent 28%),radial-gradient(circle at 50% 72%,rgba(255,95,145,.16),transparent 34%),#06070b"}}>
    <style>{`
      @keyframes rigScan{0%{transform:translateY(-120%);opacity:0}20%,70%{opacity:.62}100%{transform:translateY(120%);opacity:0}}
      @keyframes rigGlow{0%,100%{opacity:.28;transform:scale(.94)}50%{opacity:.72;transform:scale(1.05)}}
      @keyframes rigMarker{0%,100%{transform:scale(.82);opacity:.58}50%{transform:scale(1.12);opacity:1}}
      @keyframes rigHeadIdle{0%,100%{transform:translate3d(-.2%,0,0) rotate(-.35deg)}35%{transform:translate3d(.55%,-.35%,0) rotate(.8deg)}70%{transform:translate3d(-.45%,.12%,0) rotate(-.25deg)}}
      @keyframes rigTorsoBreath{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(.16%,-.16%,0) scaleX(1.004) scaleY(1.01)}}
      @keyframes rigHipIdle{0%,100%{transform:translate3d(0,0,0) rotate(.12deg)}50%{transform:translate3d(.72%,.12%,0) rotate(.55deg)}}
      @keyframes rigLegBalance{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(-.22%,.18%,0)}}
      @keyframes rigArmIdle{0%,100%{transform:translate3d(0,0,0) rotate(-.25deg)}50%{transform:translate3d(.42%,.2%,0) rotate(1.25deg)}}
      @keyframes rigMouthTalk{0%,100%{transform:scaleX(.72) scaleY(.45);opacity:.32}50%{transform:scaleX(1) scaleY(1.15);opacity:.74}}
      @keyframes rigBlink{0%,91%,100%{opacity:0;transform:scaleY(.2)}92%,94%{opacity:.62;transform:scaleY(1)}}
      @keyframes rigLeanHead{0%,100%{transform:translate3d(0,0,0) rotate(-.2deg)}50%{transform:translate3d(-1.4%,-.75%,0) rotate(-1.8deg) scale(1.012)}}
      @keyframes rigLeanTorso{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(-.72%,-.35%,0) rotate(-.75deg) scale(1.006)}}
      @keyframes rigCelebrateHead{0%,100%{transform:translate3d(0,0,0) rotate(0)}30%{transform:translate3d(-1.1%,-.9%,0) rotate(-3deg)}64%{transform:translate3d(.8%,-.35%,0) rotate(1.8deg)}}
      @keyframes rigCelebrateTorso{0%,100%{transform:translate3d(0,0,0) rotate(0)}36%{transform:translate3d(.35%,-.7%,0) rotate(1.4deg)}68%{transform:translate3d(-.35%,-.2%,0) rotate(-.8deg)}}
      @keyframes rigCelebrateHips{0%,100%{transform:translate3d(0,0,0) rotate(.1deg)}36%{transform:translate3d(1.35%,-.12%,0) rotate(1.15deg)}72%{transform:translate3d(-.55%,.05%,0) rotate(-.5deg)}}
      @keyframes rigArmCelebrate{0%,100%{transform:translate3d(0,0,0) rotate(0)}45%{transform:translate3d(1.15%,-1.2%,0) rotate(-3.1deg)}}
      @keyframes rigPointArm{0%,100%{transform:translate3d(0,0,0) rotate(0)}50%{transform:translate3d(-1.6%,-.45%,0) rotate(-3.6deg)}}
      @keyframes rigWalkLegs{0%,100%{transform:translate3d(-.45%,.2%,0) rotate(-.35deg)}50%{transform:translate3d(.45%,-.25%,0) rotate(.35deg)}}
      .forge-rig-stack{position:relative;z-index:2;height:min(100%,820px);aspect-ratio:910/1729;max-width:92%;isolation:isolate;filter:drop-shadow(0 36px 82px rgba(0,0,0,.72))}
      .forge-rig-ref{position:absolute;right:14px;top:14px;z-index:6;width:116px;border-radius:8px;overflow:hidden;border:1px solid rgba(214,177,94,.45);background:#06070b;box-shadow:0 12px 36px rgba(0,0,0,.45)}
      .forge-rig-ref img{display:block;width:100%;height:170px;object-fit:cover;object-position:50% 12%;filter:saturate(.9) brightness(.82)}
      .forge-rig-ref span{display:block;padding:6px 7px;font-size:.52rem;font-weight:1000;letter-spacing:.08em;text-transform:uppercase;color:${PALETTE.gold}}
      .forge-rig-layer{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;user-select:none;transform-origin:var(--origin,50% 50%);backface-visibility:hidden}
      .forge-rig-layer{will-change:transform,filter,opacity}
      .forge-rig-legs{--origin:52% 72%;z-index:2;animation:rigLegBalance 6.8s ease-in-out infinite}
      .forge-rig-shoes{--origin:54% 92%;z-index:3;animation:rigLegBalance 7.4s ease-in-out infinite reverse}
      .forge-rig-hips{--origin:54% 52%;z-index:4;animation:rigHipIdle 5.8s ease-in-out infinite}
      .forge-rig-torso{--origin:50% 34%;z-index:5;animation:rigTorsoBreath 4.2s ease-in-out infinite}
      .forge-rig-front-arm{--origin:40% 34%;z-index:6;animation:rigArmIdle 5.1s ease-in-out infinite}
      .forge-rig-head{--origin:48% 18%;z-index:7;animation:rigHeadIdle 5.4s ease-in-out infinite}
      .forge-rig-mouth{position:absolute;left:45.8%;top:14.35%;z-index:9;width:3.4%;height:.5%;border-radius:999px;background:rgba(255,138,168,.72);box-shadow:0 0 6px rgba(0,0,0,.5);animation:rigMouthTalk .34s ease-in-out infinite;transform-origin:center}
      .forge-rig-blink{position:absolute;left:42.7%;top:10.55%;z-index:9;width:9.5%;height:.34%;border-radius:999px;background:rgba(18,11,10,.78);animation:rigBlink 5.6s ease-in-out infinite;transform-origin:center}
      .forge-motion-lean .forge-rig-head{animation:rigLeanHead 2.2s ease-in-out infinite}
      .forge-motion-lean .forge-rig-torso{animation:rigLeanTorso 2.2s ease-in-out infinite}
      .forge-motion-celebrate .forge-rig-head{animation:rigCelebrateHead 1.75s ease-in-out infinite}
      .forge-motion-celebrate .forge-rig-torso{animation:rigCelebrateTorso 1.75s ease-in-out infinite}
      .forge-motion-celebrate .forge-rig-hips{animation:rigCelebrateHips 1.75s ease-in-out infinite}
      .forge-motion-celebrate .forge-rig-front-arm{animation:rigArmCelebrate 1.75s ease-in-out infinite}
      .forge-motion-point .forge-rig-front-arm{animation:rigPointArm 2.1s ease-in-out infinite}
      .forge-motion-walk .forge-rig-legs,.forge-motion-walk .forge-rig-shoes{animation:rigWalkLegs 1.2s ease-in-out infinite}
      .forge-marker{animation:rigMarker 2.1s ease-in-out infinite}
      .forge-renderer-blocked .forge-rig-layer,.forge-renderer-blocked .forge-rig-mouth,.forge-renderer-blocked .forge-rig-blink{animation:none!important;transform:none!important}
      .forge-renderer-blocked .forge-rig-layer{opacity:.74;filter:saturate(.86) brightness(.78)}
      .forge-renderer-blocked .forge-rig-mouth,.forge-renderer-blocked .forge-rig-blink{opacity:.12}
      .forge-renderer-blocked .forge-marker{animation:none!important;opacity:.72}
      .forge-rig-missing-pose .forge-rig-stack{filter:drop-shadow(0 36px 82px rgba(0,0,0,.72)) saturate(.72) brightness(.62)}
      .forge-rig-missing-pose .forge-rig-layer{animation:none!important;opacity:.42}
      .forge-rig-missing-pose .forge-rig-mouth,.forge-rig-missing-pose .forge-rig-blink{animation:none!important;opacity:.12;transform:none!important}
    `}</style>
    <div style={{position:"absolute",inset:"6% 9%",borderRadius:"48%",background:"radial-gradient(ellipse,rgba(214,177,94,.18),rgba(255,95,145,.08),transparent 66%)",filter:"blur(18px)",animation:"rigGlow 4.8s ease-in-out infinite"}}/>
    <div className="forge-rig-ref" aria-label="Locked photoreal reference">
      <img src={TARGET_IMAGE_SRC} alt="Locked photoreal performer reference"/>
      <span>Locked reference</span>
    </div>
    <div style={{position:"relative",zIndex:2,height:"100%",width:"100%",display:"grid",placeItems:"center"}}>
      <div className="forge-rig-stack" aria-label="Layered animated character rig">
        {RIG_LAYERS.map(layer=><img key={layer} className={`forge-rig-layer forge-rig-${layer}`} src={`/assets/muse/muse-rig-${layer}.png?v=${RIG_ASSET_REV}`} alt="" aria-hidden="true"/>)}
        <span className="forge-rig-mouth" aria-hidden="true"/>
        <span className="forge-rig-blink" aria-hidden="true"/>
      </div>
      {RENDERER_BLOCKED&&<div style={{position:"absolute",inset:"8% 8%",zIndex:9,display:"grid",placeItems:"start center",pointerEvents:"none"}}>
        <div style={{maxWidth:560,padding:16,borderRadius:12,border:`1px solid ${PALETTE.pink}99`,background:"rgba(7,8,13,.88)",boxShadow:"0 18px 54px rgba(0,0,0,.5)",textAlign:"center"}}>
          <div style={{fontSize:".62rem",fontWeight:1000,letterSpacing:".12em",textTransform:"uppercase",color:PALETTE.pink}}>Renderer gate failed</div>
          <div style={{fontSize:"1rem",fontWeight:1000,lineHeight:1.35,marginTop:7}}>2D image slicing is rejected. This reference cannot perform real pose, contact, cloth, hair, face, mouth, or hand motion.</div>
          <div style={{fontSize:".72rem",lineHeight:1.45,color:PALETTE.soft,marginTop:8}}>Next acceptable backends: commissioned Live2D MVP, rigged GLB/VRM in Three.js, MetaHuman/Unreal stream, or neural LiveAvatar provider.</div>
        </div>
      </div>}
      <div style={{position:"absolute",inset:"3% 10%",pointerEvents:"none",mixBlendMode:"screen"}}>
        <div style={{position:"absolute",left:0,right:0,top:"12%",height:80,background:"linear-gradient(180deg,transparent,rgba(88,215,196,.11),transparent)",animation:"rigScan 5.8s ease-in-out infinite"}}/>
        {markers.map(([label,left,top,tone],i)=><div key={label} className="forge-marker" style={{position:"absolute",left,top,animationDelay:`${i*.18}s`,display:"flex",alignItems:"center",gap:7}}>
          <span style={{width:9,height:9,borderRadius:999,background:tone,boxShadow:`0 0 18px ${tone}`}}/>
          <span style={{padding:"4px 7px",borderRadius:999,border:`1px solid ${tone}66`,background:"rgba(6,7,11,.58)",color:tone,fontSize:".56rem",fontWeight:1000,letterSpacing:".04em",whiteSpace:"nowrap"}}>{label}</span>
        </div>)}
      </div>
      {!RENDERER_BLOCKED&&!hasPoseRig&&<div style={{position:"absolute",inset:"12% 10%",zIndex:8,display:"grid",placeItems:"center",pointerEvents:"none"}}>
        <div style={{maxWidth:420,padding:14,borderRadius:12,border:`1px solid ${PALETTE.pink}88`,background:"rgba(7,8,13,.82)",boxShadow:"0 18px 54px rgba(0,0,0,.45)",textAlign:"center"}}>
          <div style={{fontSize:".62rem",fontWeight:1000,letterSpacing:".12em",textTransform:"uppercase",color:PALETTE.pink}}>Pose rig missing</div>
          <div style={{fontSize:".86rem",fontWeight:1000,lineHeight:1.35,marginTop:6}}>Do not fake {pose}. Capture or generate this pose family before enabling the action.</div>
        </div>
      </div>}
    </div>
    <div style={{position:"absolute",left:16,right:16,bottom:16,zIndex:4,display:"flex",justifyContent:"space-between",gap:10,alignItems:"end",flexWrap:"wrap"}}>
      <div style={{padding:"9px 11px",borderRadius:10,border:`1px solid ${PALETTE.line}`,background:"rgba(7,8,13,.72)",backdropFilter:"blur(10px)"}}>
        <div style={{fontSize:".58rem",fontWeight:1000,letterSpacing:".12em",textTransform:"uppercase",color:PALETTE.gold}}>Reference only</div>
        <div style={{fontSize:".8rem",fontWeight:1000,marginTop:3}}>No paper-doll animation is accepted as final performer tech.</div>
      </div>
      <div style={{padding:"9px 11px",borderRadius:10,border:`1px solid ${PALETTE.line}`,background:"rgba(7,8,13,.72)",backdropFilter:"blur(10px)",textAlign:"right"}}>
        <div style={{fontSize:".58rem",fontWeight:1000,letterSpacing:".12em",textTransform:"uppercase",color:PALETTE.cyan}}>Motion + pose map</div>
        <div style={{fontSize:".8rem",fontWeight:1000,marginTop:3}}>{motionCopy} - {poseCopy}</div>
      </div>
    </div>
  </div>;
}

function ScoreBar({label,value,tone}){
  return <div style={{display:"grid",gap:6}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:10,fontSize:".66rem",fontWeight:1000,color:PALETTE.soft,textTransform:"uppercase",letterSpacing:".08em"}}><span>{label}</span><span style={{color:tone}}>{value}</span></div>
    <div style={{height:7,borderRadius:999,background:"rgba(255,255,255,.07)",overflow:"hidden"}}><div style={{height:"100%",width:`${value}%`,borderRadius:999,background:`linear-gradient(90deg,${tone},rgba(255,255,255,.72))`}}/></div>
  </div>;
}

function Chip({active,children,onClick,tone=PALETTE.gold}){
  return <button type="button" onClick={onClick} style={{height:36,padding:"0 12px",borderRadius:9,border:`1px solid ${active?tone:PALETTE.line}`,background:active?`${tone}1f`:"rgba(255,255,255,.035)",color:active?PALETTE.ink:PALETTE.soft,font:"inherit",fontSize:".68rem",fontWeight:1000,cursor:"pointer",whiteSpace:"nowrap"}}>{children}</button>;
}

export default function VybeForgePreview(){
  const [preset,setPreset]=useState(PRESETS[0]);
  const [prompt,setPrompt]=useState(PRESETS[0].prompt);
  const [motion,setMotion]=useState("idle");
  const [pose,setPose]=useState("standing");
  const [channelFocus,setChannelFocus]=useState("Props");
  const [intensity,setIntensity]=useState(.72);
  const [runId,setRunId]=useState(1);
  const spec=useMemo(()=>deriveSpec(prompt,preset.id,motion,pose),[prompt,preset.id,motion,pose,runId]);
  const panel={border:`1px solid ${PALETTE.line}`,background:"linear-gradient(180deg,rgba(12,14,22,.88),rgba(7,8,13,.96))",borderRadius:12,boxShadow:"0 22px 70px rgba(0,0,0,.32)"};
  const generate=()=>setRunId(v=>v+1);
  const choosePreset=item=>{setPreset(item);setPrompt(item.prompt);setRunId(v=>v+1)};

  return <div style={{minHeight:"100vh",background:"radial-gradient(circle at 20% 12%,rgba(214,177,94,.16),transparent 26%),radial-gradient(circle at 74% 20%,rgba(255,95,145,.18),transparent 30%),linear-gradient(135deg,#07080d,#111018 52%,#07080d)",color:PALETTE.ink,padding:"18px clamp(14px,3vw,34px)",overflowX:"hidden"}}>
    <div style={{maxWidth:1480,margin:"0 auto",display:"grid",gap:14}}>
      <header style={{display:"flex",alignItems:"end",justifyContent:"space-between",gap:14,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:".66rem",fontWeight:1000,letterSpacing:".16em",textTransform:"uppercase",color:PALETTE.gold}}>VYBE Forge Lab</div>
          <h1 style={{fontSize:"clamp(1.7rem,3.4vw,3.5rem)",lineHeight:1.03,fontWeight:1000,marginTop:5}}>Prompt-to-performer 3D creation suite</h1>
          <p style={{maxWidth:860,color:PALETTE.soft,lineHeight:1.55,fontSize:".9rem",marginTop:8}}>Original local workbench for VYBE's proprietary avatar pipeline: intent, identity, mesh, rig, motion, simulation, renderer, and QA in one flow.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(96px,1fr))",gap:8,width:"min(100%,420px)"}}>
          {[["Target","Renderer Gate",PALETTE.cyan],["Mode","No 2D fake",PALETTE.gold],["Run",String(runId).padStart(3,"0"),PALETTE.pink]].map(([k,v,t])=><div key={k} style={{...panel,padding:"10px 12px"}}><div style={{fontSize:".55rem",fontWeight:1000,letterSpacing:".1em",textTransform:"uppercase",color:PALETTE.dim}}>{k}</div><div style={{fontSize:"1rem",fontWeight:1000,color:t,marginTop:3}}>{v}</div></div>)}
        </div>
      </header>

      <main style={{display:"grid",gridTemplateColumns:"minmax(min(100%,560px),1.1fr) minmax(min(100%,520px),.9fr)",gap:14,alignItems:"stretch"}}>
        <section style={{...panel,overflow:"hidden",minHeight:690,display:"grid",gridTemplateRows:"minmax(0,1fr) auto"}}>
          <ForgeCharacterRigTarget motion={motion} pose={pose} channelFocus={channelFocus} spec={spec} intensity={intensity}/>
          <div style={{padding:14,borderTop:`1px solid ${PALETTE.line}`,display:"grid",gap:10,background:"rgba(7,8,13,.88)"}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}>
              <div><div style={{fontSize:".6rem",fontWeight:1000,textTransform:"uppercase",letterSpacing:".12em",color:PALETTE.gold}}>Target rig state</div><div style={{fontSize:"1rem",fontWeight:1000,marginTop:4}}>{spec.avatar} - {motion} / {pose}</div></div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{MOTIONS.map(item=><Chip key={item.id} active={motion===item.id} onClick={()=>setMotion(item.id)} tone={PALETTE.cyan}>{item.label}</Chip>)}</div>
            </div>
            <div style={{display:"grid",gap:7}}>
              <div style={{fontSize:".58rem",fontWeight:1000,textTransform:"uppercase",letterSpacing:".12em",color:PALETTE.dim}}>Pose coverage required before private-session actions</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{POSE_STATES.map(item=><Chip key={item.id} active={pose===item.id} onClick={()=>setPose(item.id)} tone={pose===item.id?PALETTE.pink:PALETTE.gold}>{item.label}</Chip>)}</div>
            </div>
            <label style={{display:"grid",gridTemplateColumns:"auto minmax(140px,1fr) 42px",gap:10,alignItems:"center",fontSize:".72rem",fontWeight:1000,color:PALETTE.soft}}>
              Intensity
              <input type="range" min="0.2" max="1" step="0.01" value={intensity} onChange={e=>setIntensity(Number(e.target.value))} style={{accentColor:PALETTE.pink}}/>
              <span style={{color:PALETTE.pink,textAlign:"right"}}>{Math.round(intensity*100)}</span>
            </label>
          </div>
        </section>

        <section style={{display:"grid",gridTemplateRows:"auto auto minmax(0,1fr)",gap:12,minWidth:0}}>
          <div style={{...panel,padding:14}}>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>{PRESETS.map(item=><Chip key={item.id} active={preset.id===item.id} onClick={()=>choosePreset(item)} tone={item.id==="performer"?PALETTE.pink:item.id==="motion"?PALETTE.cyan:item.id==="stage"?PALETTE.gold:PALETTE.blue}>{item.label}</Chip>)}</div>
            <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={5} style={{width:"100%",resize:"vertical",minHeight:118,borderRadius:10,border:`1px solid ${PALETTE.line}`,background:"rgba(255,255,255,.045)",color:PALETTE.ink,font:"inherit",fontSize:".82rem",lineHeight:1.5,padding:12,outline:"none"}}/>
            <button type="button" onClick={generate} style={{height:42,marginTop:10,width:"100%",border:0,borderRadius:9,background:`linear-gradient(135deg,${PALETTE.gold},${PALETTE.pink})`,color:"#140f12",font:"inherit",fontWeight:1000,cursor:"pointer"}}>Generate Forge Spec</button>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12}}>
            <div style={{...panel,padding:14}}><div style={{fontSize:".6rem",fontWeight:1000,letterSpacing:".12em",textTransform:"uppercase",color:PALETTE.dim}}>Character</div><div style={{fontSize:"1rem",fontWeight:1000,color:PALETTE.pink,marginTop:8}}>{spec.wardrobe}</div><p style={{fontSize:".72rem",lineHeight:1.45,color:PALETTE.soft,marginTop:7}}>{spec.faceRig}</p></div>
            <div style={{...panel,padding:14}}><div style={{fontSize:".6rem",fontWeight:1000,letterSpacing:".12em",textTransform:"uppercase",color:PALETTE.dim}}>Runtime</div><div style={{fontSize:"1rem",fontWeight:1000,color:PALETTE.cyan,marginTop:8}}>{spec.stage}</div><p style={{fontSize:".72rem",lineHeight:1.45,color:PALETTE.soft,marginTop:7}}>{spec.bodyRig}</p></div>
          </div>

          <div style={{...panel,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:10}}>
              <div><div style={{fontSize:".6rem",fontWeight:1000,letterSpacing:".12em",textTransform:"uppercase",color:PALETTE.dim}}>Performer control channels</div><p style={{fontSize:".68rem",lineHeight:1.45,color:PALETTE.soft,marginTop:4}}>Every adult performance request must map to approved rig channels, props, camera, and QA before it can execute.</p></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(118px,1fr))",gap:8}}>
              {CONTROL_CHANNELS.map(([label,body,tone])=><button key={label} type="button" onClick={()=>setChannelFocus(label)} style={{minHeight:74,padding:9,borderRadius:9,border:`1px solid ${channelFocus===label?tone:PALETTE.line}`,background:channelFocus===label?`${tone}18`:"rgba(255,255,255,.03)",color:PALETTE.ink,textAlign:"left",font:"inherit",cursor:"pointer"}}>
                <div style={{fontSize:".72rem",fontWeight:1000,color:tone}}>{label}</div>
                <div style={{fontSize:".58rem",lineHeight:1.35,color:PALETTE.soft,marginTop:4}}>{body}</div>
              </button>)}
            </div>
          </div>

          <div style={{...panel,padding:14,minHeight:0,display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:14}}>
            <div style={{display:"grid",gap:10,alignContent:"start"}}>
              <div style={{fontSize:".6rem",fontWeight:1000,letterSpacing:".12em",textTransform:"uppercase",color:PALETTE.dim}}>Forge pipeline</div>
              {spec.generation.map((item,i)=><div key={item} style={{display:"grid",gridTemplateColumns:"28px 1fr",gap:8,alignItems:"center",padding:9,borderRadius:9,border:`1px solid ${PALETTE.line}`,background:"rgba(255,255,255,.03)"}}><span style={{width:28,height:28,borderRadius:8,display:"grid",placeItems:"center",background:i<runId%9?`${PALETTE.cyan}22`:`${PALETTE.gold}1c`,color:i<runId%9?PALETTE.cyan:PALETTE.gold,fontSize:".68rem",fontWeight:1000}}>{i+1}</span><span style={{fontSize:".72rem",fontWeight:900,lineHeight:1.35,color:PALETTE.soft}}>{item}</span></div>)}
            </div>
            <div style={{display:"grid",gap:12,alignContent:"start"}}>
              <div style={{fontSize:".6rem",fontWeight:1000,letterSpacing:".12em",textTransform:"uppercase",color:PALETTE.dim}}>QA scorecard</div>
              <ScoreBar label="Realism" value={spec.scores.realism} tone={PALETTE.pink}/>
              <ScoreBar label="Topology" value={spec.scores.topology} tone={PALETTE.gold}/>
              <ScoreBar label="Face Rig" value={spec.scores.face} tone={PALETTE.blue}/>
              <ScoreBar label="Cloth" value={spec.scores.cloth} tone={PALETTE.cyan}/>
              <ScoreBar label="Motion" value={spec.scores.motion} tone={PALETTE.green}/>
              <ScoreBar label="FPS" value={spec.scores.fps} tone={PALETTE.gold}/>
              <ScoreBar label="Compliance" value={spec.scores.compliance} tone={PALETTE.pink}/>
            </div>
          </div>

          <div style={{...panel,padding:14}}>
            <div style={{fontSize:".6rem",fontWeight:1000,letterSpacing:".12em",textTransform:"uppercase",color:PALETTE.pink}}>Adult-production precision gates</div>
            <p style={{fontSize:".72rem",lineHeight:1.5,color:PALETTE.soft,marginTop:7}}>This local Forge view stays non-explicit. It defines the exact rig, consent, prop, pose, collision, and QA gates required before any performer-grade private-session action can be available.</p>
            <div style={{display:"grid",gap:7,marginTop:10}}>
              {ADULT_RIG_REQUIREMENTS.map((item,i)=><div key={item} style={{display:"grid",gridTemplateColumns:"26px 1fr",gap:8,alignItems:"center",padding:8,borderRadius:8,border:`1px solid ${PALETTE.line}`,background:"rgba(255,255,255,.028)"}}>
                <span style={{width:26,height:26,borderRadius:8,display:"grid",placeItems:"center",background:i<2?`${PALETTE.green}1f`:`${PALETTE.pink}18`,color:i<2?PALETTE.green:PALETTE.pink,fontSize:".62rem",fontWeight:1000}}>{i<2?"OK":"REQ"}</span>
                <span style={{fontSize:".68rem",lineHeight:1.38,color:PALETTE.soft,fontWeight:900}}>{item}</span>
              </div>)}
            </div>
          </div>
        </section>
      </main>

      <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}>
        {MODULES.map(([title,body,tone])=><div key={title} style={{...panel,padding:14,minHeight:112}}><div style={{width:30,height:30,borderRadius:8,background:`${tone}1f`,border:`1px solid ${tone}66`,marginBottom:10}}/><div style={{fontSize:".84rem",fontWeight:1000,color:tone}}>{title}</div><p style={{fontSize:".7rem",lineHeight:1.45,color:PALETTE.soft,marginTop:6}}>{body}</p></div>)}
      </section>
    </div>
  </div>;
}
