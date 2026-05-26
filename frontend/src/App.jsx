import { useState, useEffect, useRef, useCallback } from "react";
import GiftSpectacleOverlay from "./gifts/GiftSpectacleOverlay.jsx";
import PlatformBanner from "./gifts/PlatformBanner.jsx";
import SparkStormShell from "./gifts/SparkStormShell.jsx";
import GiftEffectPreviewControls from "./gifts/GiftEffectPreviewControls.jsx";
import VybeLuxuryPreview from "./gifts/VybeLuxuryPreview.jsx";
import useGiftQueue from "./gifts/useGiftQueue.js";
import useGiftSocket from "./gifts/useGiftSocket.js";
import { getEffectForCost } from "./gifts/giftEffectCatalog.js";

/* ═══ ICONS — 40+ custom SVGs, zero emojis ═══ */
function I({n,s=20,c="currentColor",st={}}){const p={width:s,height:s,flexShrink:0,display:"inline-block",verticalAlign:"middle",...st};const d={
rose:<svg viewBox="0 0 24 24" style={p}><path d="M12 3c-1.5 2-4 4-4 7a4 4 0 008 0c0-3-2.5-5-4-7z" fill={c} opacity=".85"/><line x1="12" y1="10" x2="12" y2="22" stroke={c} strokeWidth="1.5"/></svg>,
flame:<svg viewBox="0 0 24 24" style={p}><path d="M12 2c0 4-6 6-6 12a6 6 0 0012 0c0-3-2-5-3-7 0 3-3 4-3 4s-1-4 0-9z" fill={c} opacity=".9"/></svg>,
lips:<svg viewBox="0 0 24 24" style={p}><path d="M4 13c0-3 3-5 5-5 1 0 2 1 3 2 1-1 2-2 3-2 2 0 5 2 5 5 0 4-4 7-8 7s-8-3-8-7z" fill={c} opacity=".85"/></svg>,
diamond:<svg viewBox="0 0 24 24" style={p}><polygon points="12,2 20,9 12,22 4,9" fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/><polyline points="4,9 12,12 20,9" fill="none" stroke={c} strokeWidth="1" opacity=".5"/></svg>,
crown:<svg viewBox="0 0 24 24" style={p}><path d="M3 18h18v2H3zM3 18l3-10 4 5 2-8 2 8 4-5 3 10" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>,
champagne:<svg viewBox="0 0 24 24" style={p}><path d="M9 2h6l-1 8a3 3 0 01-4 0L9 2z" fill="none" stroke={c} strokeWidth="1.5"/><line x1="12" y1="12" x2="12" y2="20" stroke={c} strokeWidth="1.5"/><line x1="8" y1="20" x2="16" y2="20" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>,
key:<svg viewBox="0 0 24 24" style={p}><circle cx="8" cy="8" r="5" fill="none" stroke={c} strokeWidth="1.8"/><line x1="12" y1="12" x2="20" y2="20" stroke={c} strokeWidth="1.8"/><line x1="17" y1="17" x2="20" y2="14" stroke={c} strokeWidth="1.5"/></svg>,
brain:<svg viewBox="0 0 24 24" style={p}><path d="M12 2C8 2 5 5 5 8c0 2 1 3.5 2 4.5V14a1 1 0 001 1h8a1 1 0 001-1v-1.5C18 11.5 19 10 19 8c0-3-3-6-7-6z" fill="none" stroke={c} strokeWidth="1.5"/><path d="M9 17h6M10 20h4" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>,
wheel:<svg viewBox="0 0 24 24" style={p}><circle cx="12" cy="12" r="9" fill="none" stroke={c} strokeWidth="1.5"/><circle cx="12" cy="12" r="3" fill="none" stroke={c} strokeWidth="1"/>{[[12,3,12,9],[3,12,9,12],[15,12,21,12],[12,15,12,21]].map(([x1,y1,x2,y2],i)=><line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="1"/>)}</svg>,
target:<svg viewBox="0 0 24 24" style={p}><circle cx="12" cy="12" r="9" fill="none" stroke={c} strokeWidth="1.5"/><circle cx="12" cy="12" r="5" fill="none" stroke={c} strokeWidth="1" opacity=".6"/><circle cx="12" cy="12" r="1.5" fill={c}/></svg>,
hotseat:<svg viewBox="0 0 24 24" style={p}><path d="M7 12h10a2 2 0 012 2v4H5v-4a2 2 0 012-2z" fill="none" stroke={c} strokeWidth="1.5"/><path d="M9 12V8a3 3 0 016 0v4" fill="none" stroke={c} strokeWidth="1.2"/><path d="M8 18v3M16 18v3" stroke={c} strokeWidth="1.5"/></svg>,
cards:<svg viewBox="0 0 24 24" style={p}><rect x="3" y="4" width="11" height="16" rx="2" fill="none" stroke={c} strokeWidth="1.5" transform="rotate(-8 8.5 12)"/><rect x="10" y="4" width="11" height="16" rx="2" fill="none" stroke={c} strokeWidth="1.5" transform="rotate(8 15.5 12)"/></svg>,
gavel:<svg viewBox="0 0 24 24" style={p}><path d="M14.5 3.5l6 6M4 20l6-6M9.5 9.5l5 5" stroke={c} strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="21" x2="10" y2="21" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>,
kinghill:<svg viewBox="0 0 24 24" style={p}><polygon points="4,20 12,6 20,20" fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/><path d="M9.5 3l2.5-1 2.5 1-1 2h-3z" fill={c} opacity=".7"/></svg>,
mystery:<svg viewBox="0 0 24 24" style={p}><rect x="4" y="8" width="16" height="12" rx="2" fill="none" stroke={c} strokeWidth="1.5"/><path d="M4 8l8-5 8 5" fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/><circle cx="12" cy="14" r="2" fill="none" stroke={c} strokeWidth="1.2"/></svg>,
ladder:<svg viewBox="0 0 24 24" style={p}><line x1="7" y1="3" x2="7" y2="21" stroke={c} strokeWidth="1.5"/><line x1="17" y1="3" x2="17" y2="21" stroke={c} strokeWidth="1.5"/>{[7,12,17].map(y=><line key={y} x1="7" y1={y} x2="17" y2={y} stroke={c} strokeWidth="1.2"/>)}</svg>,
tap:<svg viewBox="0 0 24 24" style={p}><circle cx="12" cy="8" r="3" fill="none" stroke={c} strokeWidth="1.5"/><path d="M12 11v5l3 4M12 16l-3 4" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>,
star:<svg viewBox="0 0 24 24" style={p}><polygon points="12,2 15,8.5 22,9.3 17,14 18.2,21 12,17.5 5.8,21 7,14 2,9.3 9,8.5" fill={c} opacity=".8"/></svg>,
spark:<svg viewBox="0 0 24 24" style={p}><polygon points="13,2 5,14 11,14 9,22 19,10 13,10" fill={c}/></svg>,
shield:<svg viewBox="0 0 24 24" style={p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke={c} strokeWidth="1.5"/><polyline points="9 12 11 14 15 10" stroke={c} strokeWidth="1.5" fill="none"/></svg>,
streak:<svg viewBox="0 0 24 24" style={p}><path d="M12 2c0 4-5 5-5 11a5 5 0 0010 0c0-3-2-4.5-3-6 0 2.5-2 3.5-2 3.5S11 7 12 2z" fill={c}/></svg>,
live:<svg viewBox="0 0 24 24" style={p}><circle cx="12" cy="12" r="4" fill={c}/><circle cx="12" cy="12" r="8" fill="none" stroke={c} strokeWidth="1.2" opacity=".4"/></svg>,
chat:<svg viewBox="0 0 24 24" style={p}><path d="M4 4h16a2 2 0 012 2v10a2 2 0 01-2 2H8l-4 4V6a2 2 0 012-2z" fill="none" stroke={c} strokeWidth="1.5"/></svg>,
trophy:<svg viewBox="0 0 24 24" style={p}><path d="M8 3h8v6a4 4 0 01-8 0V3z" fill="none" stroke={c} strokeWidth="1.5"/><path d="M8 5H5a2 2 0 00-2 2v1a3 3 0 003 3h2M16 5h3a2 2 0 012 2v1a3 3 0 01-3 3h-2" fill="none" stroke={c} strokeWidth="1.2"/><line x1="12" y1="13" x2="12" y2="17" stroke={c} strokeWidth="1.5"/><rect x="8" y="17" width="8" height="2" rx="1" fill="none" stroke={c} strokeWidth="1.2"/></svg>,
gear:<svg viewBox="0 0 24 24" style={p}><circle cx="12" cy="12" r="3" fill="none" stroke={c} strokeWidth="1.5"/><path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>,
play:<svg viewBox="0 0 24 24" style={p}><path d="M8 5v14l11-7z" fill={c}/></svg>,
pause:<svg viewBox="0 0 24 24" style={p}><rect x="6" y="4" width="4" height="16" rx="1" fill={c}/><rect x="14" y="4" width="4" height="16" rx="1" fill={c}/></svg>,
refresh:<svg viewBox="0 0 24 24" style={p}><path d="M20 7v5h-5M4 17v-5h5" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M18 12a6 6 0 00-10-4.5L4 11M6 12a6 6 0 0010 4.5l4-3.5" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>,
fullscreen:<svg viewBox="0 0 24 24" style={p}><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
volume:<svg viewBox="0 0 24 24" style={p}><path d="M4 9v6h4l6 5V4L8 9H4z" fill="none" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/><path d="M17 9a4 4 0 010 6M19.5 6.5a7.5 7.5 0 010 11" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>,
volumeoff:<svg viewBox="0 0 24 24" style={p}><path d="M4 9v6h4l6 5V4L8 9H4z" fill="none" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/><path d="M18 9l4 6M22 9l-4 6" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
cc:<svg viewBox="0 0 24 24" style={p}><rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke={c} strokeWidth="1.5"/><path d="M10 10a2.5 2.5 0 100 4M17 10a2.5 2.5 0 100 4" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round"/></svg>,
pip:<svg viewBox="0 0 24 24" style={p}><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke={c} strokeWidth="1.5"/><rect x="12" y="11" width="6" height="4" rx="1" fill={c}/></svg>,
orientation:<svg viewBox="0 0 24 24" style={p}><rect x="7" y="3" width="10" height="18" rx="2" fill="none" stroke={c} strokeWidth="1.5"/><path d="M10 18h4M5 8l-2 2 2 2M19 8l2 2-2 2" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
back:<svg viewBox="0 0 24 24" style={p}><polyline points="15,18 9,12 15,6" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>,
close:<svg viewBox="0 0 24 24" style={p}><line x1="18" y1="6" x2="6" y2="18" stroke={c} strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>,
users:<svg viewBox="0 0 24 24" style={p}><circle cx="9" cy="7" r="3" fill="none" stroke={c} strokeWidth="1.5"/><path d="M2 20c0-3 3-6 7-6s7 3 7 6" fill="none" stroke={c} strokeWidth="1.5"/><circle cx="17" cy="8" r="2.5" fill="none" stroke={c} strokeWidth="1.2" opacity=".6"/></svg>,
gift:<svg viewBox="0 0 24 24" style={p}><rect x="3" y="10" width="18" height="11" rx="2" fill="none" stroke={c} strokeWidth="1.5"/><line x1="12" y1="10" x2="12" y2="21" stroke={c} strokeWidth="1.2"/><path d="M12 10C12 7 9 5 7 7s2 3 5 3M12 10c0-3 3-5 5-3s-2 3-5 3" fill="none" stroke={c} strokeWidth="1.3"/></svg>,
gamepad:<svg viewBox="0 0 24 24" style={p}><path d="M6 9h12a5 5 0 01-1 10H7A5 5 0 016 9z" fill="none" stroke={c} strokeWidth="1.5"/><line x1="8" y1="13" x2="8" y2="15" stroke={c} strokeWidth="1.5" strokeLinecap="round"/><line x1="7" y1="14" x2="9" y2="14" stroke={c} strokeWidth="1.5" strokeLinecap="round"/><circle cx="15" cy="13" r=".8" fill={c}/><circle cx="17" cy="15" r=".8" fill={c}/></svg>,
wallet:<svg viewBox="0 0 24 24" style={p}><rect x="2" y="6" width="20" height="14" rx="2" fill="none" stroke={c} strokeWidth="1.5"/><path d="M2 10h20" stroke={c} strokeWidth="1"/><circle cx="17" cy="14" r="1.5" fill={c} opacity=".6"/></svg>,
user:<svg viewBox="0 0 24 24" style={p}><circle cx="12" cy="8" r="4" fill="none" stroke={c} strokeWidth="1.5"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7" fill="none" stroke={c} strokeWidth="1.5"/></svg>,
check:<svg viewBox="0 0 24 24" style={p}><polyline points="6 12 10 16 18 8" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
clock:<svg viewBox="0 0 24 24" style={p}><circle cx="12" cy="12" r="9" fill="none" stroke={c} strokeWidth="1.5"/><polyline points="12,7 12,12 16,14" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>,
plus:<svg viewBox="0 0 24 24" style={p}><line x1="12" y1="5" x2="12" y2="19" stroke={c} strokeWidth="2" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>,
menu:<svg viewBox="0 0 24 24" style={p}><line x1="3" y1="6" x2="21" y2="6" stroke={c} strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="12" x2="21" y2="12" stroke={c} strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>,
lock:<svg viewBox="0 0 24 24" style={p}><rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke={c} strokeWidth="1.5"/><path d="M8 11V7a4 4 0 018 0v4" fill="none" stroke={c} strokeWidth="1.5"/><circle cx="12" cy="16" r="1.5" fill={c}/></svg>,
id:<svg viewBox="0 0 24 24" style={p}><rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke={c} strokeWidth="1.5"/><circle cx="8" cy="11" r="2.5" fill="none" stroke={c} strokeWidth="1.2"/><line x1="15" y1="9" x2="20" y2="9" stroke={c} strokeWidth="1.2" strokeLinecap="round"/><line x1="15" y1="12" x2="20" y2="12" stroke={c} strokeWidth="1.2" strokeLinecap="round"/></svg>,
request:<svg viewBox="0 0 24 24" style={p}><path d="M12 2a7 7 0 017 7c0 3-2 5-3.5 6.5L12 19l-3.5-3.5C7 14 5 12 5 9a7 7 0 017-7z" fill="none" stroke={c} strokeWidth="1.5"/><circle cx="12" cy="9" r="2" fill={c} opacity=".6"/></svg>,
bookmark:<svg viewBox="0 0 24 24" style={p}><path d="M5 3h14a1 1 0 011 1v17l-8-4-8 4V4a1 1 0 011-1z" fill="none" stroke={c} strokeWidth="1.5"/></svg>,
eye:<svg viewBox="0 0 24 24" style={p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" fill="none" stroke={c} strokeWidth="1.5"/><circle cx="12" cy="12" r="3" fill="none" stroke={c} strokeWidth="1.5"/></svg>,
eyeoff:<svg viewBox="0 0 24 24" style={p}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" fill="none" stroke={c} strokeWidth="1.5"/><line x1="1" y1="1" x2="23" y2="23" stroke={c} strokeWidth="1.5"/></svg>,
badge:<svg viewBox="0 0 24 24" style={p}><circle cx="12" cy="9" r="6" fill="none" stroke={c} strokeWidth="1.5"/><path d="M8.5 14.5L7 22l5-3 5 3-1.5-7.5" fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/><circle cx="12" cy="9" r="2" fill={c} opacity=".4"/></svg>,
};return d[n]||null;}

/* ═══ DATA — 80/20 Split, Earned Loyalty, "You Are Known" ═══ */
const CATS=["All","Women","Men","Couples","Trans","Interactive","Solo","Fetish","VIP","New","Trending","Roleplay","Toys","HD"];
const PERFS=[
  {id:"luna",name:"Luna Voss",vibe:"Sultry game show host energy",viewers:342,game:"Tease Trivia",level:"hot",tags:["Interactive","Toys","HD"],accent:"#ff2d78",rating:4.9,sessions:1247,cats:["Women","Interactive","HD","Trending"],
    caps:{duo:true,toys:true,replay:true,wardrobe:true,maxMins:60,games:["trivia","spin","truth","hotseat","clash","auction","king","mystery","ladder","buzz","jackpot"]},
    bio:"Your favorite late-night game host. I compete — come ready to play or ready to lose.",sub:{price:29.99,trial:7},
    schedule:[{day:"Mon",time:"9PM"},{day:"Wed",time:"10PM"},{day:"Fri",time:"9PM"},{day:"Sat",time:"11PM"}],stats:{hoursLive:2840,followers:12400},
    requests:[{name:"Song & Vibe",sparks:150,desc:"She plays your song"},{name:"Outfit Choice",sparks:250,desc:"Pick her wardrobe"},{name:"Personal Shoutout",sparks:400,desc:"Your name on camera"},{name:"Custom Dare",sparks:500,desc:"You write the dare"},{name:"Game Master",sparks:750,desc:"You control 5 min"},{name:"Fantasy Intro",sparks:1000,desc:"Custom roleplay opening"},{name:"Exclusive Content",sparks:2000,desc:"Custom set for you"},{name:"Ultimate Fantasy",sparks:5000,desc:"You design it, she delivers"}],
    posts:[{text:"Tonight's trivia: spicy confessions. Bring it.",time:"2h"},{text:"New wardrobe drop — subs get first look.",time:"1d"},{text:"5-game win streak. Who's dethroning me?",time:"3d"}]},
  {id:"ari",name:"Ari Vale",vibe:"High-energy pop culture queen",viewers:218,game:"Spin & Sin",level:"rising",tags:["Solo","HD"],accent:"#ffab00",rating:4.8,sessions:894,cats:["Women","Solo","New","HD"],
    caps:{duo:false,toys:true,replay:false,wardrobe:true,maxMins:45,games:["trivia","spin","hotseat","clash","buzz"]},sub:{price:19.99,trial:0},
    requests:[{name:"Song & Vibe",sparks:100,desc:"Your song, her mood"},{name:"Custom Dare",sparks:400,desc:"You write it"},{name:"Shoutout",sparks:300,desc:"On camera callout"}],
    schedule:[{day:"Tue",time:"8PM"},{day:"Thu",time:"9PM"},{day:"Sat",time:"10PM"}],stats:{hoursLive:1200,followers:6800},posts:[{text:"Going live tonight — bring your A-game.",time:"4h"}]},
  {id:"nia",name:"Nia Stone",vibe:"Luxury VIP slow-burn specialist",viewers:156,game:"Fantasy Auction",level:"warm",tags:["VIP","Roleplay"],accent:"#00d4ff",rating:4.9,sessions:1560,cats:["Women","VIP","Roleplay"],
    caps:{duo:true,toys:true,replay:true,wardrobe:true,maxMins:60,games:["trivia","truth","auction","mystery","ladder"]},sub:{price:34.99,trial:7},
    requests:[{name:"Outfit Choice",sparks:300,desc:"Pick from collection"},{name:"Fantasy Intro",sparks:1500,desc:"Full scenario"},{name:"Ultimate Fantasy",sparks:5000,desc:"The works"}],
    schedule:[{day:"Wed",time:"9PM"},{day:"Fri",time:"10PM"},{day:"Sun",time:"8PM"}],stats:{hoursLive:3200,followers:15600},posts:[{text:"VIP night tomorrow. Limited spots.",time:"6h"}]},
  {id:"jade",name:"Jade Kincaid",vibe:"Competitive trash-talk champion",viewers:489,game:"King of the Hill",level:"finale",tags:["Interactive","Trending"],accent:"#c6ff00",rating:4.7,sessions:2103,cats:["Women","Interactive","Trending","Fetish"],
    caps:{duo:false,toys:false,replay:true,wardrobe:false,maxMins:45,games:["trivia","hotseat","clash","king","buzz","jackpot"]},sub:{price:14.99,trial:0},
    requests:[{name:"Game Master",sparks:500,desc:"You pick the games"},{name:"Custom Dare",sparks:600,desc:"Push her limits"}],
    schedule:[{day:"Mon",time:"10PM"},{day:"Thu",time:"9PM"},{day:"Sat",time:"11PM"}],stats:{hoursLive:4100,followers:22000},posts:[{text:"King of the Hill tournament tonight.",time:"1h"}]},
  {id:"raven",name:"Raven Blackwell",vibe:"Dark mystery & dare master",viewers:267,game:"Dare Ladder",level:"hot",tags:["Fetish","Roleplay"],accent:"#8b5cf6",rating:4.8,sessions:987,cats:["Women","Fetish","Roleplay","Toys"],
    caps:{duo:true,toys:true,replay:false,wardrobe:true,maxMins:60,games:["truth","mystery","ladder","spin","auction"]},sub:{price:24.99,trial:7},
    requests:[{name:"Fantasy Intro",sparks:1200,desc:"Dark roleplay"},{name:"Exclusive Content",sparks:2500,desc:"Custom, your theme"},{name:"Ultimate Fantasy",sparks:5000,desc:"Full immersion"}],
    schedule:[{day:"Tue",time:"11PM"},{day:"Fri",time:"10PM"}],stats:{hoursLive:1800,followers:9500},posts:[{text:"New dare deck unlocked. Subs only.",time:"5h"}]},
  {id:"kai",name:"Kai Mercer",vibe:"Smooth-talking couples host",viewers:178,game:"Card Clash",level:"rising",tags:["Couples","Interactive"],accent:"#f97316",rating:4.6,sessions:654,cats:["Men","Couples","Interactive"],
    caps:{duo:true,toys:false,replay:true,wardrobe:false,maxMins:30,games:["trivia","clash","king","buzz"]},sub:{price:14.99,trial:0},
    requests:[{name:"Shoutout",sparks:200,desc:"On camera callout"},{name:"Game Master",sparks:400,desc:"You run the games"}],
    schedule:[{day:"Wed",time:"9PM"},{day:"Sat",time:"10PM"}],stats:{hoursLive:900,followers:4200},posts:[{text:"Couples night Wednesday.",time:"1d"}]},
];
const GAMES=[
  {id:"trivia",name:"Desire Read",icon:"brain",desc:"Patrons predict her preference; correct answers raise room heat.",color:"#c6ff00",type:"trivia"},
  {id:"spin",name:"Velvet Dial",icon:"wheel",desc:"A cinematic mood selector with performer-approved outcomes.",color:"#ff2d78",type:"wheel"},
  {id:"truth",name:"Confession Gate",icon:"target",desc:"The room votes on polished, consent-safe prompts.",color:"#00d4ff",type:"binary"},
  {id:"hotseat",name:"Pulse Seat",icon:"hotseat",desc:"Timed questions that reward focus and anticipation.",color:"#ffab00",type:"timed"},
  {id:"clash",name:"Chemistry Cards",icon:"cards",desc:"Match mood cards to unlock a shared room moment.",color:"#8b5cf6",type:"cards"},
  {id:"auction",name:"Moment Auction",icon:"gavel",desc:"Bid for performer-approved highlights and room direction.",color:"#f472b6",type:"auction"},
  {id:"king",name:"Patron Crown",icon:"kinghill",desc:"Top patron earns a tasteful on-screen acknowledgement.",color:"#fbbf24",type:"score"},
  {id:"mystery",name:"Secret Drop",icon:"mystery",desc:"Unlock mystery prompts, badges, or subscriber previews.",color:"#34d399",type:"box"},
  {id:"ladder",name:"Tension Ladder",icon:"ladder",desc:"Climb through escalating, performer-controlled milestones.",color:"#f97316",type:"ladder"},
  {id:"buzz",name:"Touch Trace",icon:"tap",desc:"Draw glow marks on the live frame; performer accepts the winning trace.",color:"#06b6d4",type:"touch"},
  {id:"jackpot",name:"Afterglow Streak",icon:"star",desc:"Build a streak for a premium but performer-approved reward.",color:"#fbbf24",type:"jackpot"},
];
const GIFTS=[
  {id:"rose",name:"Neon Rose",cost:5,icon:"rose",color:"#ff2d78",anim:"bloom"},
  {id:"fire",name:"Fire Shot",cost:25,icon:"flame",color:"#f97316",anim:"trail"},
  {id:"kiss",name:"Blow Kiss",cost:50,icon:"lips",color:"#f472b6",anim:"float"},
  {id:"diamond",name:"Diamond Rain",cost:150,icon:"diamond",color:"#00d4ff",anim:"rain"},
  {id:"crown",name:"Crown Drop",cost:500,icon:"crown",color:"#fbbf24",anim:"descend"},
  {id:"champagne",name:"Champagne",cost:2500,icon:"champagne",color:"#c6ff00",anim:"burst"},
  {id:"key",name:"Private Key",cost:5000,icon:"key",color:"#8b5cf6",anim:"cinematic"},
];
const SPARK_PKGS=[
  {sparks:200,price:"$19.99",bonus:0,label:"Starter"},
  {sparks:550,price:"$49.99",bonus:10,label:"Popular",pop:true},
  {sparks:1250,price:"$99.99",bonus:25,label:"Premium"},
  {sparks:4000,price:"$249.99",bonus:60,label:"Elite"},
  {sparks:10000,price:"$499.99",bonus:100,label:"Whale"},
  {sparks:25000,price:"$999.99",bonus:150,label:"VIP Drop"},
];
const BOOK=[{id:"q",name:"Quick Play",mins:15,sparks:250},{id:"m",name:"Main Event",mins:30,sparks:450,pop:true},{id:"s",name:"Neon Suite",mins:45,sparks:650},{id:"e",name:"VIP Extended",mins:60,sparks:800}];
const VIPPK=[{id:"vp",name:"VIP Private",mins:60,sparks:1500},{id:"ve",name:"VIP Extended",mins:90,sparks:3000,pop:true},{id:"vu",name:"VIP Ultimate",mins:120,sparks:5000}];
const LOYALTY=[{name:"Bronze",min:0,back:0,color:"#cd7f32"},{name:"Silver",min:200,back:5,color:"#c0c0c0"},{name:"Gold",min:1000,back:10,color:"#fbbf24"},{name:"Platinum",min:5000,back:15,color:"#a78bfa"},{name:"Diamond",min:25000,back:20,color:"#67e8f9"}];
const FBQ=[{q:"What makes anticipation more exciting than the reward itself?",opts:["Dopamine loop","Serotonin burst","Oxytocin rush","Cortisol spike"],ans:0},{q:"Which sense is most powerful for physical arousal?",opts:["Touch","Smell","Sight","Hearing"],ans:0},{q:"What type of touch creates the most anticipation?",opts:["Firm pressure","Light slow tracing","Quick tapping","Static holding"],ans:1},{q:"Which color lingerie is statistically rated most attractive?",opts:["Black","Red","White","Purple"],ans:1},{q:"What does 'aftercare' mean in intimacy?",opts:["Skincare","Emotional comfort after a scene","Follow-up texts","Review"],ans:1},{q:"Which scent is most associated with arousal?",opts:["Vanilla","Lavender","Jasmine","Peppermint"],ans:0},{q:"What voice pitch is rated most attractive?",opts:["High breathy","Deep and slow","Fast energetic","Monotone"],ans:1},{q:"Eye contact held 4+ seconds signals what?",opts:["Aggression","Deep attraction","Confusion","Boredom"],ans:1},{q:"What makes 'playing hard to get' work?",opts:["Scarcity value","Disinterest","Reduces dopamine","Triggers fear"],ans:0},{q:"What is 'sensate focus' in therapy?",opts:["Visual meditation","Mindful non-goal touch","Aromatherapy","Sound healing"],ans:1},{q:"What hormone drives bonding and trust?",opts:["Testosterone","Dopamine","Oxytocin","Adrenaline"],ans:2},{q:"Which compliment style creates the most attraction?",opts:["Physical appearance","Specific observational","Generic flattery","Celebrity comparison"],ans:1},{q:"What is 'mirroring' in attraction?",opts:["Using a webcam","Copying body language","Matching outfits","Repeating words"],ans:1},{q:"Which environment most increases intimacy?",opts:["Bright lights","Dim warm lighting","Cold temperature","Loud music"],ans:1},{q:"Which trigger most effectively builds desire?",opts:["Direct statements","Mystery and suggestion","Repetition","Logic"],ans:1},{q:"What does 'the chase' activate?",opts:["Fear","Dopamine anticipation loop","Logical reasoning","Memory"],ans:1},{q:"What is social proof in attraction?",opts:["Finding someone attractive because others want them","Photos together","Many friends","Being famous"],ans:0},{q:"Most reported erogenous zone after primary zones?",opts:["Inner thigh","Neck","Lower back","Earlobes"],ans:1},{q:"What % of adults fantasize about someone they know?",opts:["45%","62%","78%","91%"],ans:2},{q:"Which texting behavior builds romantic tension?",opts:["Instant replies","Delayed but thoughtful","One-word answers","Voice notes only"],ans:1}];
const WSEGS=["Reveal +1","Dare Card","Bonus Sparks","Wildcard","Tease Moment","Mystery Gift","Double Down","Reset"];
const TDC=[{t:"Truth",x:"Most daring thing you've done on camera?"},{t:"Dare",x:"Slow dance for 30 seconds."},{t:"Truth",x:"Biggest turn-on that surprises people?"},{t:"Dare",x:"Whisper something seductive to camera."},{t:"Truth",x:"When did you feel most desired?"},{t:"Dare",x:"Show your most confident pose."},{t:"Truth",x:"Ideal intimate evening in 3 words?"},{t:"Dare",x:"Most seductive look for 10 seconds."},{t:"Truth",x:"One thing you've never told a viewer?"},{t:"Dare",x:"Move like nobody's watching, 15 seconds."}];
const GAME_ECON={
  trivia:{stake:5,reward:15,label:"answer"},
  wheel:{stake:25,reward:75,label:"spin"},
  binary:{truth:10,dare:20,reward:0,label:"prompt"},
  timed:{stake:10,reward:30,label:"answer"},
  cards:{stake:20,reward:60,label:"flip"},
  auction:{minBid:50,label:"escrow bid"},
  score:{stake:15,reward:45,label:"answer"},
  box:{stake:10,reward:50,label:"open"},
  ladder:{stepStake:15,rewardStep:25,label:"climb"},
  reaction:{stake:20,reward:80,label:"reaction tap"},
  touch:{trace:5,submit:25,reward:0,label:"trace"},
  jackpot:{stake:50,jackpot:500,label:"answer"}
};
const fsn=n=>(Number(n)||0).toLocaleString();
const gameEconomyLine=type=>{
  const e=GAME_ECON[type]||GAME_ECON.trivia;
  if(type==="auction")return "Bid escrow from spark balance";
  if(type==="ladder")return `${fsn(e.stepStake)}+ climb stake / ${fsn(e.rewardStep)} per rung`;
  if(type==="touch")return `${fsn(e.trace)} trace / ${fsn(e.submit)} submit`;
  if(type==="binary")return `${fsn(e.truth)} truth / ${fsn(e.dare)} dare`;
  if(type==="jackpot")return `${fsn(e.stake)} stake / ${fsn(e.jackpot)} jackpot`;
  return `${fsn(e.stake)} stake / ${fsn(e.reward)} reward`;
};
const requestPalette=name=>{
  const n=(name||"").toLowerCase();
  if(n.includes("ultimate"))return {a:"#fbbf24",b:"#8b5cf6",c:"#ff2d78",label:"signature"};
  if(n.includes("fantasy"))return {a:"#8b5cf6",b:"#00d4ff",c:"#f472b6",label:"scenario"};
  if(n.includes("outfit"))return {a:"#00d4ff",b:"#c6ff00",c:"#ffab00",label:"wardrobe"};
  if(n.includes("song"))return {a:"#f472b6",b:"#ffab00",c:"#00d4ff",label:"sound"};
  if(n.includes("game"))return {a:"#c6ff00",b:"#00d4ff",c:"#fbbf24",label:"control"};
  if(n.includes("dare"))return {a:"#ff2d78",b:"#f97316",c:"#fbbf24",label:"challenge"};
  return {a:"#ffab00",b:"#00d4ff",c:"#ff2d78",label:"request"};
};
const VWR=[{name:"VelvetKing",score:2450,lv:34,badge:"crown"},{name:"DiamondJay",score:1820,lv:28,badge:"diamond"},{name:"AceHigh",score:1340,lv:22,badge:"streak"},{name:"NightOwl",score:890,lv:15,badge:""},{name:"xShadowx",score:620,lv:11,badge:""}];
const HEAT={warm:"#ffab00",rising:"#f97316",hot:"#ff2d78",finale:"#c6ff00"};

/* AI Questions */
const QP='Generate 5 adult-themed trivia for a live interactive game show. Target senses: sensation, fantasy, desire, confession, attraction, intimacy. Return ONLY JSON: [{"q":"question","opts":["A","B","C","D"],"ans":0}]. Playful, suggestive, never explicit.';
async function genQs(){try{const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:QP}]})});const d=await r.json();return JSON.parse(d.content?.map(c=>c.text||"").join("").replace(/```json|```/g,"").trim())}catch(e){return FBQ.sort(()=>Math.random()-.5).slice(0,5)}}

/* CSS */
const css=`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}:root{--bg:#06080f;--sf:#0d1118;--cd:#141a28;--ch:#1a2035;--gl:rgba(10,14,24,.78);--bd:rgba(255,255,255,.08);--bh:rgba(255,255,255,.14);--tx:#e8ecf2;--mt:#7a8599;--pk:#ff2d78;--cy:#00d4ff;--lm:#c6ff00;--am:#ffab00;--vi:#8b5cf6;--gn:#22c55e}
body,#root{font-family:'Sora',system-ui,sans-serif;background:var(--bg);color:var(--tx)}
@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes gp{0%{opacity:0;transform:translateY(10px) scale(.65)}20%{opacity:1;transform:translateY(0) scale(1)}70%{opacity:1;transform:translateY(-12px) scale(1.08)}100%{opacity:0;transform:translateY(-26px) scale(.72)}}
@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(255,45,120,.1)}50%{box-shadow:0 0 45px rgba(255,45,120,.25)}}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(1080deg)}}
@keyframes bf{0%,100%{background:var(--cd)}50%{background:rgba(255,45,120,.15)}}
@keyframes rainDown{0%{opacity:1;transform:translateY(-20px)}100%{opacity:0;transform:translateY(60px)}}
.ai{animation:fi .3s ease both}.gpa{animation:gp 1.8s ease forwards;position:absolute;pointer-events:none;z-index:9}
input[type=text]{background:var(--cd);border:1px solid var(--bd);border-radius:8px;color:var(--tx);padding:8px 12px;font:inherit;outline:none;width:100%}input[type=text]:focus{border-color:var(--cy)}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:4px}`;

/* ═══ SHARED ═══ */
const G=({children,className="",style={},onClick})=><div onClick={onClick} className={className} style={{background:"var(--gl)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid var(--bd)",borderRadius:14,...style}}>{children}</div>;
const Tag=({children,color="var(--pk)"})=><span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:999,background:color+"15",color,fontSize:".66rem",fontWeight:700}}>{children}</span>;
const Lv=()=><span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:999,background:"var(--lm)",color:"#000",fontWeight:800,fontSize:".65rem"}}><span style={{width:5,height:5,borderRadius:"50%",background:"#000",animation:"pulse 1.4s infinite"}}/>LIVE</span>;
const Btn=({children,primary,full,onClick,disabled,small,style:s={}})=><button disabled={disabled} onClick={onClick} style={{height:small?32:42,padding:small?"0 12px":"0 22px",borderRadius:small?7:10,border:primary?"none":"1px solid var(--bh)",cursor:disabled?"not-allowed":"pointer",background:primary?"linear-gradient(135deg,var(--pk),var(--am))":"none",color:primary?"#fff":"var(--mt)",fontWeight:700,fontSize:small?".72rem":".82rem",boxShadow:primary?"0 6px 20px rgba(255,45,120,.2)":"none",opacity:disabled?.5:1,width:full?"100%":"auto",transition:".2s",...s}}>{children}</button>;
const Kk=({children})=><div style={{fontSize:".62rem",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"var(--pk)",marginBottom:4}}>{children}</div>;
const Tt=({children,s})=><h2 style={{fontSize:s||"1.3rem",fontWeight:800,marginBottom:3,lineHeight:1.15}}>{children}</h2>;
const Pn=({children,onClose,title,icon,ic,style:s={}})=><G className="ai" style={{padding:14,overflowY:"auto",...s}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontWeight:800,fontSize:".82rem",display:"flex",alignItems:"center",gap:5}}>{icon&&<I n={icon} s={14} c={ic||"var(--pk)"}/>}{title}</span><button onClick={onClose} style={{background:"none",border:"none",color:"var(--mt)",cursor:"pointer",display:"flex"}}><I n="close" s={13}/></button></div>{children}</G>;
const gl=s=>(LOYALTY.slice().reverse().find(t=>s>=t.min)||LOYALTY[0]);

/* ═══ AGE VERIFY ═══ */
function AgeV({onDone}){const [s,setS]=useState(0);
  const vfy=()=>{setS(2);setTimeout(()=>setS(3),2500);setTimeout(()=>onDone(),3500)};
  const bx={maxWidth:440,width:"90%",padding:"36px 28px",textAlign:"center",background:"var(--sf)",border:"1px solid var(--bh)",borderRadius:18,boxShadow:"0 40px 80px rgba(0,0,0,.5)"};
  const wp={position:"fixed",inset:0,zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",background:"radial-gradient(ellipse at 30% 20%,rgba(255,45,120,.06),transparent 55%),var(--bg)"};
  if(s===0)return<div style={wp}><div style={bx}><Tag color="var(--pk)"><I n="lock" s={10} c="var(--pk)"/> 18+ VERIFIED</Tag>
    <h1 style={{fontSize:"2.6rem",fontWeight:900,lineHeight:1,margin:"12px 0",background:"linear-gradient(135deg,var(--pk),var(--am),var(--lm))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>VYBE</h1>
    <p style={{color:"var(--mt)",fontSize:".82rem",lineHeight:1.6,marginBottom:6}}>The platform where you and a performer create something together, live.</p>
    <p style={{color:"var(--mt)",fontSize:".7rem",marginBottom:22}}>Age verification required by federal and state law. Powered by Yoti — zero-knowledge, we never see your ID.</p>
    <div style={{display:"flex",gap:10,justifyContent:"center"}}><Btn primary onClick={()=>setS(1)}>Verify My Age</Btn><Btn>Leave</Btn></div></div></div>;
  if(s===1)return<div style={wp}><div style={bx}><I n="id" s={32} c="var(--cy)" st={{marginBottom:8}}/><Tt>Verification Method</Tt>
    <p style={{color:"var(--mt)",fontSize:".78rem",marginBottom:14}}>VYBE never sees your personal information.</p>
    {[{l:"Government ID",d:"Driver's license or passport",i:"id",c:"var(--cy)"},{l:"Facial Estimation",d:"AI age estimate from selfie",i:"user",c:"var(--lm)"},{l:"Digital Wallet",d:"Existing Yoti digital ID",i:"shield",c:"var(--am)"}].map(v=>
      <button key={v.l} onClick={vfy} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:12,borderRadius:10,border:"1px solid var(--bd)",background:"var(--cd)",cursor:"pointer",textAlign:"left",marginBottom:6}}>
        <div style={{width:36,height:36,borderRadius:8,background:v.c+"15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><I n={v.i} s={18} c={v.c}/></div>
        <div><div style={{fontWeight:700,fontSize:".84rem"}}>{v.l}</div><div style={{fontSize:".68rem",color:"var(--mt)"}}>{v.d}</div></div></button>)}</div></div>;
  if(s===2)return<div style={wp}><div style={bx}><div style={{width:44,height:44,borderRadius:"50%",border:"3px solid var(--cy)",borderTopColor:"transparent",animation:"spin 1s linear infinite",margin:"0 auto 12px"}}/><Tt>Verifying...</Tt></div></div>;
  return<div style={wp}><div style={bx}><div style={{width:44,height:44,borderRadius:"50%",background:"var(--gn)20",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px"}}><I n="check" s={24} c="var(--gn)"/></div><Tt>Verified</Tt><p style={{color:"var(--mt)"}}>Entering VYBE...</p></div></div>;}

/* ═══ COOKIE ═══ */
const CK=({onOk})=><div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:60,padding:"12px 18px",background:"var(--sf)",borderTop:"1px solid var(--bd)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
  <p style={{flex:1,minWidth:180,fontSize:".76rem",lineHeight:1.5}}><I n="lock" s={12} c="var(--cy)" st={{marginRight:4}}/>We use cookies per our <a href="#" style={{color:"var(--cy)"}}>Cookie Policy</a>.</p>
  <div style={{display:"flex",gap:6}}><Btn small onClick={onOk}>Reject</Btn><Btn small primary onClick={onOk}>Accept All</Btn></div></div>;

/* ═══ MENU ═══ */
function HM({open,onClose,cat,setCat,onProfile}){if(!open)return null;
  return<div className="ai" style={{position:"fixed",top:0,left:0,bottom:0,width:"min(270px,80vw)",zIndex:50,background:"var(--sf)",borderRight:"1px solid var(--bd)",padding:16,overflowY:"auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,var(--pk),var(--am),var(--lm))",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:".6rem",color:"#000"}}>VB</div><span style={{fontWeight:800,fontSize:".9rem"}}>VYBE</span></div>
      <button onClick={onClose} style={{background:"none",border:"none",color:"var(--mt)",cursor:"pointer"}}><I n="close" s={15}/></button></div>
    <Kk>Categories</Kk>
    {CATS.map(c=><button key={c} onClick={()=>{setCat(c);onClose()}} style={{display:"flex",alignItems:"center",gap:7,width:"100%",padding:"8px 10px",borderRadius:7,border:"none",background:cat===c?"rgba(255,45,120,.1)":"none",color:cat===c?"var(--pk)":"var(--tx)",cursor:"pointer",fontWeight:600,fontSize:".8rem",textAlign:"left",marginBottom:1}}>{c}</button>)}
    <div style={{marginTop:12,borderTop:"1px solid var(--bd)",paddingTop:10}}>
      <button onClick={onProfile} style={{display:"flex",alignItems:"center",gap:7,width:"100%",padding:"8px 10px",borderRadius:7,border:"none",background:"none",color:"var(--tx)",cursor:"pointer",fontWeight:600,fontSize:".8rem",textAlign:"left"}}><I n="user" s={14} c="var(--cy)"/>My Profile</button>
    </div>
    <div style={{marginTop:12,padding:10,borderTop:"1px solid var(--bd)",fontSize:".58rem",color:"var(--mt)",lineHeight:1.6}}>
      <strong>80/20</strong> — Performers keep 80%<br/>18 USC §2257 Compliant<br/>
      <a href="#" style={{color:"var(--cy)"}}>Terms</a> · <a href="#" style={{color:"var(--cy)"}}>Privacy</a> · <a href="#" style={{color:"var(--cy)"}}>2257</a> · <a href="#" style={{color:"var(--cy)"}}>DMCA</a>
    </div></div>;}

/* ═══ VIEWER PROFILE — "You Are Known" ═══ */
function ViewerProfile({user,onClose}){const tier=gl(user.spent);
  return<div className="ai" style={{position:"fixed",inset:0,zIndex:40,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
    <Pn onClose={onClose} title="Your Identity" icon="badge" ic="var(--cy)" style={{maxWidth:460,width:"92%",maxHeight:"80vh",background:"var(--sf)"}}>
      <div style={{textAlign:"center",padding:16,borderRadius:12,background:"linear-gradient(135deg,rgba(0,212,255,.06),rgba(255,45,120,.04))",border:"1px solid var(--bd)",marginBottom:12}}>
        <div style={{width:56,height:56,borderRadius:14,background:"linear-gradient(135deg,var(--cy),var(--pk))",margin:"0 auto 8px",display:"flex",alignItems:"center",justifyContent:"center"}}><I n="user" s={28} c="#fff"/></div>
        <div style={{fontWeight:900,fontSize:"1.1rem"}}>{user.name}</div>
        <Tag color={tier.color}><I n="shield" s={9} c={tier.color}/> {tier.name} Tier</Tag>
        {tier.back>0&&<Tag color="var(--gn)"> {tier.back}% spark-back</Tag>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:12}}>
        {[{l:"Games Played",v:user.gamesPlayed,i:"gamepad"},{l:"Win Rate",v:user.winRate+"%",i:"trophy"},{l:"Sparks Earned",v:user.sparksEarned,i:"spark"},{l:"Sessions",v:user.totalSessions,i:"clock"},{l:"Top Streak",v:user.topStreak,i:"streak"},{l:"Performers",v:user.perfCount,i:"users"}].map(s=>
          <div key={s.l} style={{textAlign:"center",padding:8,borderRadius:8,border:"1px solid var(--bd)"}}>
            <I n={s.i} s={14} c="var(--am)"/><div style={{fontWeight:800,fontSize:".9rem"}}>{s.v}</div><div style={{fontSize:".55rem",color:"var(--mt)"}}>{s.l}</div></div>)}
      </div>
      <Kk>Achievements</Kk>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {user.badges.map(b=><Tag key={b} color="var(--am)"><I n="badge" s={9} c="var(--am)"/> {b}</Tag>)}
      </div>
      <Kk>Favorite Performers</Kk>
      <div style={{display:"flex",gap:6}}>
        {user.favPerfs.map(id=>{const p=PERFS.find(x=>x.id===id);return p?<div key={id} style={{padding:6,borderRadius:8,border:"1px solid var(--bd)",textAlign:"center",flex:1}}>
          <div style={{width:28,height:28,borderRadius:8,background:`${p.accent}20`,margin:"0 auto 3px",display:"flex",alignItems:"center",justifyContent:"center"}}><I n="user" s={14} c={p.accent}/></div>
          <div style={{fontSize:".68rem",fontWeight:700}}>{p.name.split(" ")[0]}</div></div>:null})}
      </div>
      <p style={{fontSize:".6rem",color:"var(--mt)",marginTop:10,textAlign:"center"}}>Your identity is persistent. Every game, every session, every interaction builds your reputation on VYBE.</p>
    </Pn></div>;}

/* ═══ WALLET ═══ */
function WL({user,onClose,onBuy}){const tier=gl(user.spent);
  return<div className="ai" style={{position:"fixed",inset:0,zIndex:40,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
    <Pn onClose={onClose} title="Wallet" icon="wallet" ic="var(--am)" style={{maxWidth:500,width:"92%",maxHeight:"82vh",background:"var(--sf)"}}>
      <div style={{padding:16,borderRadius:12,background:"linear-gradient(135deg,rgba(255,171,0,.06),rgba(255,45,120,.04))",border:"1px solid var(--bd)",marginBottom:12,textAlign:"center"}}>
        <div style={{fontSize:".62rem",color:"var(--mt)",fontWeight:600,textTransform:"uppercase",letterSpacing:".08em"}}>Balance</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginTop:3}}><I n="spark" s={24} c="var(--am)"/><span style={{fontSize:"2rem",fontWeight:900,color:"var(--am)"}}>{user.sparks.toLocaleString()}</span></div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5,marginTop:5}}><Tag color={tier.color}><I n="shield" s={9} c={tier.color}/> {tier.name}</Tag>{tier.back>0&&<Tag color="var(--gn)">{tier.back}% back</Tag>}</div>
      </div>
      <Kk>Buy Sparks</Kk>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>
        {SPARK_PKGS.map((pk,i)=><button key={i} onClick={()=>onBuy(pk)} style={{padding:10,borderRadius:9,border:pk.pop?"1px solid var(--pk)":"1px solid var(--bd)",background:"var(--cd)",cursor:"pointer",textAlign:"center",position:"relative"}}>
          {pk.pop&&<div style={{position:"absolute",top:-6,left:"50%",transform:"translateX(-50%)",padding:"1px 6px",borderRadius:999,background:"var(--pk)",color:"#fff",fontSize:".48rem",fontWeight:800}}>BEST VALUE</div>}
          <I n="spark" s={16} c="var(--am)"/><div style={{fontWeight:900,fontSize:".95rem",marginTop:2}}>{pk.sparks.toLocaleString()}</div>
          {pk.bonus>0&&<div style={{fontSize:".6rem",color:"var(--lm)",fontWeight:700}}>+{pk.bonus}%</div>}
          <div style={{fontSize:".78rem",fontWeight:800,marginTop:2,paddingTop:2,borderTop:"1px solid var(--bd)"}}>{pk.price}</div></button>)}
      </div>
      <Kk>Loyalty Tiers (Earned)</Kk>
      <div style={{display:"flex",gap:3}}>{LOYALTY.map(t=><div key={t.name} style={{flex:1,textAlign:"center",padding:5,borderRadius:5,border:"1px solid var(--bd)",background:user.spent>=t.min?t.color+"10":"var(--cd)",opacity:user.spent>=t.min?1:.35}}>
        <div style={{fontWeight:700,fontSize:".6rem",color:t.color}}>{t.name}</div><div style={{fontSize:".5rem",color:"var(--mt)"}}>{t.back}%</div></div>)}</div>
      <p style={{fontSize:".58rem",color:"var(--mt)",marginTop:8,textAlign:"center"}}>No monthly fees. Tier earned by lifetime spend. Performers keep 80%.</p>
    </Pn></div>;}

/* ═══ BOOKING ═══ */
function BK({perf,sparks,pkgs,label,onOk,onClose}){const [pk,setPk]=useState(pkgs.find(p=>p.pop)?.id||pkgs[0].id);const sel=pkgs.find(p=>p.id===pk);
  return<div className="ai" style={{position:"fixed",inset:0,zIndex:40,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
    <Pn onClose={onClose} title={label} icon="bookmark" ic="var(--pk)" style={{maxWidth:420,width:"92%",maxHeight:"78vh",background:"var(--sf)"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:8,borderRadius:8,border:"1px solid var(--bd)",background:"var(--cd)",marginBottom:10}}>
        <div style={{width:36,height:36,borderRadius:7,background:`${perf.accent}20`,display:"flex",alignItems:"center",justifyContent:"center"}}><I n="user" s={18} c={perf.accent}/></div>
        <div><div style={{fontWeight:700,fontSize:".85rem"}}>{perf.name}</div><div style={{fontSize:".68rem",color:"var(--mt)"}}>{perf.vibe}</div></div></div>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${pkgs.length},1fr)`,gap:5,marginBottom:10}}>
        {pkgs.map(p=><button key={p.id} onClick={()=>setPk(p.id)} style={{padding:8,borderRadius:7,border:pk===p.id?"2px solid var(--pk)":"1px solid var(--bd)",background:"var(--cd)",cursor:"pointer",textAlign:"center",position:"relative"}}>
          {p.pop&&<div style={{position:"absolute",top:-6,right:3,padding:"1px 4px",borderRadius:999,background:"var(--pk)",color:"#fff",fontSize:".44rem",fontWeight:800}}>TOP</div>}
          <div style={{fontWeight:800,fontSize:".78rem"}}>{p.name}</div><div style={{fontSize:".64rem",color:"var(--mt)"}}>{p.mins}min</div>
          <div style={{fontWeight:800,color:"var(--am)",fontSize:".76rem",display:"flex",alignItems:"center",justifyContent:"center",gap:2,marginTop:2}}><I n="spark" s={9} c="var(--am)"/>{sel&&p.id===pk?sel.sparks.toLocaleString():p.sparks.toLocaleString()}</div></button>)}
      </div>
      <div style={{padding:10,borderRadius:8,border:"1px solid var(--bd)",background:"var(--cd)",textAlign:"center",marginBottom:8}}>
        <div style={{fontWeight:900,fontSize:"1.3rem",color:"var(--am)",display:"flex",alignItems:"center",justifyContent:"center",gap:3}}><I n="spark" s={18} c="var(--am)"/>{sel.sparks.toLocaleString()}</div>
        {sparks<sel.sparks&&<div style={{fontSize:".68rem",color:"var(--pk)",marginTop:3}}>Not enough sparks.</div>}</div>
      <Btn full primary disabled={sparks<sel.sparks} onClick={()=>onOk(sel)}>Confirm & Enter</Btn>
    </Pn></div>;}

/* ═══ PERFORMER PROFILE ═══ */
function PF({perf,user,onBack,onLive,onBook,onVip,onWallet}){
  const [subbed,setSub]=useState(false);const tier=gl(user.spent);const canVip=user.spent>=1000;
  const avG=GAMES.filter(g=>perf.caps.games.includes(g.id));
  return<div style={{minHeight:"100vh",background:"var(--bg)",padding:"12px clamp(10px,3vw,30px)"}}>
    <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",color:"var(--mt)",cursor:"pointer",fontWeight:600,fontSize:".8rem",marginBottom:12}}><I n="back" s={14}/>Back</button>
    {/* Banner */}
    <div style={{borderRadius:14,overflow:"hidden",marginBottom:16,position:"relative",background:`linear-gradient(135deg,${perf.accent}18,transparent 50%),linear-gradient(180deg,#0c1628,#0d0f1a)`,border:"1px solid var(--bd)",minHeight:170}}>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"flex-end",padding:18,gap:14}}>
        <div style={{width:72,height:72,borderRadius:12,background:`${perf.accent}30`,border:"3px solid "+perf.accent,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><I n="user" s={32} c={perf.accent}/></div>
        <div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}><h1 style={{fontSize:"1.3rem",fontWeight:900}}>{perf.name}</h1><I n="shield" s={14} c="var(--cy)"/><Lv/></div>
          <p style={{color:"var(--mt)",fontSize:".82rem",marginTop:1}}>{perf.vibe}</p>
          <div style={{display:"flex",gap:4,marginTop:5,flexWrap:"wrap"}}>{perf.tags.map(t=><Tag key={t} color="var(--cy)">{t}</Tag>)}</div></div>
        <div style={{display:"flex",gap:5,flexShrink:0,flexWrap:"wrap"}}><Btn primary onClick={onLive}><I n="eye" s={13} c="#fff" st={{marginRight:3}}/>Watch Live</Btn>
          <Btn onClick={onBook}><I n="bookmark" s={13} c="var(--mt)" st={{marginRight:3}}/>Book</Btn>
          {canVip&&<Btn onClick={onVip} style={{border:"1px solid var(--am)",color:"var(--am)"}}><I n="crown" s={13} c="var(--am)" st={{marginRight:3}}/>VIP</Btn>}</div>
      </div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:12,alignItems:"start"}}>
      <div>
        {/* Bio + Stats + Identity Recognition */}
        <div style={{padding:16,border:"1px solid var(--bd)",borderRadius:12,background:"var(--cd)",marginBottom:12}}>
          <Kk>About</Kk><p style={{fontSize:".88rem",lineHeight:1.7,color:"var(--mt)"}}>{perf.bio}</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginTop:12}}>
            {[{l:"Sessions",v:perf.sessions.toLocaleString(),i:"clock"},{l:"Hours",v:perf.stats.hoursLive.toLocaleString(),i:"live"},{l:"Followers",v:perf.stats.followers.toLocaleString(),i:"users"},{l:"Rating",v:perf.rating,i:"star"}].map(s=>
              <div key={s.l} style={{textAlign:"center",padding:7,borderRadius:7,border:"1px solid var(--bd)"}}><I n={s.i} s={13} c="var(--am)"/><div style={{fontWeight:800,fontSize:".9rem"}}>{s.v}</div><div style={{fontSize:".55rem",color:"var(--mt)"}}>{s.l}</div></div>)}
          </div>
          {/* "You Are Known" — show viewer's history with this performer */}
          <div style={{marginTop:12,padding:10,borderRadius:8,background:"rgba(0,212,255,.04)",border:"1px solid rgba(0,212,255,.1)"}}>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}><I n="badge" s={13} c="var(--cy)"/><span style={{fontWeight:700,fontSize:".78rem",color:"var(--cy)"}}>Your History with {perf.name.split(" ")[0]}</span></div>
            <div style={{display:"flex",gap:8,fontSize:".7rem",color:"var(--mt)"}}>
              <span>{user.perfHistory[perf.id]?.sessions||0} sessions</span>
              <span>{user.perfHistory[perf.id]?.sparksSpent||0} sparks spent</span>
              <span>Since {user.perfHistory[perf.id]?.since||"today"}</span>
            </div></div>
        </div>
        {/* Games filtered */}
        <div style={{padding:16,border:"1px solid var(--bd)",borderRadius:12,background:"var(--cd)",marginBottom:12}}>
          <Kk>Game Modes ({avG.length})</Kk>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(125px,1fr))",gap:5,marginTop:6}}>
            {avG.map(g=><div key={g.id} style={{padding:"7px 9px",borderRadius:7,border:"1px solid var(--bd)"}}><div style={{display:"flex",alignItems:"center",gap:4}}><I n={g.icon} s={12} c={g.color}/><span style={{fontWeight:700,fontSize:".72rem"}}>{g.name}</span></div></div>)}</div>
        </div>
        {/* Request Menu */}
        <div style={{padding:16,border:"1px solid var(--bd)",borderRadius:12,background:"var(--cd)",marginBottom:12}}>
          <Kk>Request Menu — Performer Priced</Kk><Tt s="1rem">Custom experiences only {perf.name.split(" ")[0]} offers</Tt>
          <div style={{marginTop:8}}>{perf.requests.map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:i<perf.requests.length-1?"1px solid var(--bd)":"none"}}>
            <div><div style={{fontWeight:700,fontSize:".82rem"}}>{r.name}</div><div style={{fontSize:".68rem",color:"var(--mt)"}}>{r.desc}</div></div>
            <span style={{fontWeight:800,fontSize:".78rem",color:"var(--am)",display:"flex",alignItems:"center",gap:2,flexShrink:0}}><I n="spark" s={11} c="var(--am)"/>{r.sparks.toLocaleString()}</span></div>)}</div>
        </div>
        {/* Feed */}
        <div style={{padding:16,border:"1px solid var(--bd)",borderRadius:12,background:"var(--cd)",marginBottom:12}}>
          <Kk>Feed</Kk>
          {perf.posts.map((p,i)=><div key={i} style={{padding:"8px 0",borderBottom:i<perf.posts.length-1?"1px solid var(--bd)":"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
              <div style={{width:22,height:22,borderRadius:6,background:`${perf.accent}20`,display:"flex",alignItems:"center",justifyContent:"center"}}><I n="user" s={11} c={perf.accent}/></div>
              <span style={{fontWeight:700,fontSize:".8rem"}}>{perf.name}</span><span style={{fontSize:".62rem",color:"var(--mt)",marginLeft:"auto"}}>{p.time}</span></div>
            <p style={{fontSize:".84rem",lineHeight:1.6,paddingLeft:27}}>{p.text}</p></div>)}
        </div>
      </div>
      {/* Right */}
      <div>
        <div style={{padding:16,border:"1px solid var(--bd)",borderRadius:12,background:"var(--cd)",marginBottom:12}}>
          <Kk>Subscribe to {perf.name.split(" ")[0]}</Kk>
          {perf.sub.trial>0&&!subbed&&<div style={{padding:7,borderRadius:7,background:"rgba(0,212,255,.05)",border:"1px solid rgba(0,212,255,.12)",marginBottom:8}}>
            <div style={{fontWeight:700,fontSize:".82rem"}}>Free {perf.sub.trial}-day trial</div><div style={{fontSize:".66rem",color:"var(--cy)"}}>Cancel anytime.</div></div>}
          <div style={{padding:10,borderRadius:8,border:subbed?"2px solid var(--gn)":"2px solid var(--pk)",background:subbed?"rgba(34,197,94,.04)":"rgba(255,45,120,.03)",textAlign:"center",marginBottom:8}}>
            {subbed?<><I n="check" s={16} c="var(--gn)"/><div style={{fontWeight:800,marginTop:2}}>Subscribed</div></>
            :<><div style={{fontWeight:800,fontSize:"1.1rem"}}>${perf.sub.price}/mo</div><div style={{fontSize:".62rem",color:"var(--mt)",marginBottom:6}}>Set by {perf.name.split(" ")[0]}</div>
              <Btn full primary onClick={()=>setSub(true)}>{perf.sub.trial>0?`Start ${perf.sub.trial}-Day Trial`:"Subscribe"}</Btn></>}</div>
          <div style={{fontSize:".64rem",color:"var(--mt)",lineHeight:1.5}}>Subscribers: priority booking, content feed, DMs, sub-only games, 10% session discount, schedule alerts.</div>
        </div>
        <div style={{padding:16,border:"1px solid var(--bd)",borderRadius:12,background:"var(--cd)",marginBottom:12}}>
          <Kk>Schedule</Kk>{perf.schedule.map((s,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:i<perf.schedule.length-1?"1px solid var(--bd)":"none"}}>
            <span style={{fontWeight:700,fontSize:".8rem"}}>{s.day}</span><span style={{fontSize:".78rem",color:"var(--mt)"}}>{s.time}</span></div>)}</div>
        <Btn full primary onClick={onLive}><I n="eye" s={13} c="#fff" st={{marginRight:3}}/>Watch Live Now</Btn>
      </div>
    </div>
    <div style={{padding:10,borderTop:"1px solid var(--bd)",fontSize:".56rem",color:"var(--mt)",textAlign:"center",marginTop:10}}>VYBE Inc. · 18 USC §2257 Compliant · 80/20 Performer Split · <a href="#" style={{color:"var(--cy)"}}>Terms</a> · <a href="#" style={{color:"var(--cy)"}}>Privacy</a></div>
  </div>;}

/* ═══ GAME ENGINE — 11 Unique Modes ═══ */
function GE({game,onClose,onSB,sparks=0,onSpend=()=>{}}){
  const [qs,setQs]=useState(FBQ.sort(()=>Math.random()-.5).slice(0,5));
  const [s,setS]=useState({qi:0,fb:"",m:0,wr:null,sp:false,td:null,tm:15,cP:0,cO:0,bid:170,hb:120,at:20,hs:0,hr:1,
    bx:[...Array(6)].map((_,i)=>({id:i,op:false,pr:["10 sparks","25 sparks","50 sparks","Reveal +1","Badge","Empty"][i]})),
    lr:0,lb:false,br:false,bt:null,bres:null,bms:0,jl:3,js:0,jw:false,tc:[]});
  const u=(k,v)=>setS(p=>({...p,...(typeof k==="string"?{[k]:v}:k)}));
  const econ=GAME_ECON[game.type]||GAME_ECON.trivia;
  const balance=Math.max(0,Number(sparks)||0);
  const flash=msg=>{u("fb",msg);setTimeout(()=>u("fb",""),1800)};
  const spend=(amount,label=econ.label||"play")=>{
    const cost=Math.max(0,Math.floor(Number(amount)||0));
    if(cost<=0)return true;
    if(balance<cost){flash(`Need ${fsn(cost)} sparks to ${label}.`);return false}
    onSpend(-cost);
    return true;
  };
  const award=amount=>{const prize=Math.max(0,Math.floor(Number(amount)||0));if(prize>0)onSB(prize)};
  const stakeLine=game.type==="auction"
    ?`Bids come from balance and are held in escrow. Minimum raise ${fsn(econ.minBid)} sparks.`
    :game.type==="ladder"
      ?`Next climb costs ${fsn((s.lr+1)*(econ.stepStake||15))}. Banked reward now ${fsn(s.lr*(econ.rewardStep||25))}.`
      :game.type==="touch"
        ?`Trace points cost ${fsn(econ.trace)}. Sending the trace costs ${fsn(econ.submit)}.`
        :game.type==="binary"
          ?`Truth costs ${fsn(econ.truth)}. Dare costs ${fsn(econ.dare)}. Performer approval still applies.`
          :game.type==="jackpot"
            ?`${fsn(econ.stake)} per answer. Jackpot reward ${fsn(econ.jackpot)}.`
            :`${fsn(econ.stake)} stake per ${econ.label}. Reward up to ${fsn(econ.reward)} sparks.`;
  useEffect(()=>{genQs().then(nq=>{if(nq.length>0)setQs(nq)}).catch(()=>{})},[]);
  useEffect(()=>{if(s.qi>0&&s.qi%4===0)genQs().then(nq=>{if(nq.length>0)setQs(p=>[...p,...nq])}).catch(()=>{})},[s.qi]);
  useEffect(()=>{if(game.type==="timed"&&s.tm>0){const t=setInterval(()=>u("tm",s.tm-1),1000);return()=>clearInterval(t)}
    if(game.type==="reaction"&&!s.br&&!s.bres){const t=setTimeout(()=>u({br:true,bt:Date.now()}),2000+Math.random()*4000);return()=>clearTimeout(t)}},[s.tm,s.br,s.bres,game.type]);
  const q=qs[s.qi%qs.length]||FBQ[0];
  const ans=(i,cost=econ.stake,prize=econ.reward)=>{if(!spend(cost,"answer"))return false;if(i===q.ans){u({m:Math.min(100,s.m+12),fb:`Correct! +${fsn(prize)}`,qi:s.qi+1});award(prize)}else u({fb:"No payout",qi:s.qi+1});setTimeout(()=>u("fb",""),1800);return true};

  return<Pn onClose={onClose} title={game.name} icon={game.icon} ic={game.color} style={{position:"absolute",right:12,top:84,bottom:76,zIndex:24,width:"min(390px,34vw)",maxHeight:"none",background:"linear-gradient(180deg,rgba(10,13,22,.96),rgba(9,10,18,.9))",boxShadow:"0 30px 90px rgba(0,0,0,.45)"}}>
    <div style={{height:4,borderRadius:999,background:"rgba(255,255,255,.05)",marginBottom:8}}><div style={{height:"100%",borderRadius:"inherit",width:`${s.m}%`,transition:"width .4s",background:"linear-gradient(90deg,var(--cy),var(--lm),var(--pk))"}}/></div>
    <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:8,alignItems:"center",padding:"8px 9px",borderRadius:9,border:"1px solid rgba(255,171,0,.18)",background:"rgba(255,171,0,.055)",marginBottom:9}}>
      <div style={{fontWeight:1000,color:"var(--am)",fontSize:".82rem",display:"flex",alignItems:"center",gap:3}}><I n="spark" s={11} c="var(--am)"/>{fsn(balance)}</div>
      <div style={{fontSize:".62rem",lineHeight:1.35,color:"var(--mt)",fontWeight:700}}>{stakeLine}</div>
    </div>

    {game.type==="trivia"&&<div><h4 style={{fontSize:".92rem",fontWeight:700,lineHeight:1.2,marginBottom:7}}>{q.q}</h4>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>{q.opts.map((o,i)=><button key={i} onClick={()=>ans(i)} style={{padding:8,borderRadius:6,border:"1px solid var(--bd)",background:"var(--cd)",color:"var(--tx)",textAlign:"left",fontWeight:600,fontSize:".76rem",cursor:"pointer"}}>{o}</button>)}</div></div>}

    {game.type==="wheel"&&<div style={{textAlign:"center"}}>
      <div style={{position:"relative",width:188,height:188,margin:"2px auto 12px"}}>
        <div style={{position:"absolute",left:"50%",top:-4,transform:"translateX(-50%)",width:0,height:0,borderLeft:"9px solid transparent",borderRight:"9px solid transparent",borderTop:"18px solid #fff",filter:"drop-shadow(0 0 10px rgba(255,255,255,.45))",zIndex:2}}/>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",background:"conic-gradient(from -18deg,#ff2d78 0 44deg,#d6b15e 44deg 88deg,#c6ff00 88deg 132deg,#00d4ff 132deg 176deg,#8b5cf6 176deg 220deg,#ff8aa8 220deg 264deg,#f97316 264deg 308deg,#ff2d78 308deg 360deg)",boxShadow:"0 0 0 1px rgba(255,255,255,.12) inset,0 24px 80px rgba(255,45,120,.18)",animation:s.sp?"spin 2.4s cubic-bezier(.12,.76,.18,1) forwards":"none"}}/>
        <div style={{position:"absolute",inset:20,borderRadius:"50%",background:"radial-gradient(circle at 35% 30%,rgba(255,255,255,.22),rgba(13,15,26,.96) 45%)",border:"1px solid rgba(255,255,255,.16)",display:"grid",placeItems:"center"}}>
          <div><div style={{fontSize:".55rem",letterSpacing:".15em",textTransform:"uppercase",color:"var(--mt)",fontWeight:900}}>Mood lock</div><div style={{fontWeight:1000,fontSize:"1rem",marginTop:3}}>VYBE</div></div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:10}}>{["Glow","Whisper","Choice","Spotlight"].map(x=><span key={x} style={{padding:"6px 8px",borderRadius:999,border:"1px solid var(--bd)",background:"rgba(255,255,255,.04)",fontSize:".62rem",fontWeight:800,color:"rgba(255,255,255,.72)"}}>{x}</span>)}</div>
      {s.wr&&<div style={{fontWeight:900,fontSize:".86rem",color:"var(--lm)",marginBottom:8}}>{s.wr}</div>}
      <Btn primary small disabled={s.sp} onClick={()=>{if(!spend(econ.stake,"spin"))return;u("sp",true);setTimeout(()=>{const r=WSEGS[Math.floor(Math.random()*8)],win=r.includes("Sparks");u({sp:false,wr:r,m:Math.min(100,s.m+8),fb:win?`Bonus +${fsn(econ.reward)}`:r});if(win)award(econ.reward);setTimeout(()=>u("fb",""),1500)},2400)}}>{s.sp?"Dialing...":"Spin Velvet Dial"}</Btn></div>}

    {game.type==="binary"&&<div style={{textAlign:"center"}}>
      {s.td?<div style={{padding:12,borderRadius:8,border:"1px solid var(--bd)",background:"var(--cd)",marginBottom:6}}><Tag color={s.td.t==="Truth"?"var(--cy)":"var(--pk)"}>{s.td.t}</Tag><p style={{marginTop:5,fontWeight:600,fontSize:".85rem",lineHeight:1.4}}>{s.td.x}</p></div>
      :<p style={{color:"var(--mt)",marginBottom:6,fontSize:".8rem"}}>Pick truth or dare.</p>}
      <div style={{display:"flex",gap:5,justifyContent:"center"}}>
        <Btn small onClick={()=>{if(!spend(econ.truth,"open truth"))return;const deck=TDC.filter(c=>c.t==="Truth");u({td:deck[Math.floor(Math.random()*deck.length)],m:Math.min(100,s.m+10),fb:"Truth opened"});setTimeout(()=>u("fb",""),1300)}} style={{border:"1px solid var(--cy)",color:"var(--cy)"}}>Truth</Btn>
        <Btn small onClick={()=>{if(!spend(econ.dare,"open dare"))return;const deck=TDC.filter(c=>c.t==="Dare");u({td:deck[Math.floor(Math.random()*deck.length)]||TDC[1],m:Math.min(100,s.m+15),fb:"Dare opened"});setTimeout(()=>u("fb",""),1300)}} style={{border:"1px solid var(--pk)",color:"var(--pk)"}}>Dare</Btn></div></div>}

    {game.type==="timed"&&<div><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:".68rem",color:"var(--mt)"}}>Beat the clock</span><span style={{fontWeight:900,fontSize:"1rem",color:s.tm<5?"var(--pk)":"var(--am)"}}>{s.tm}s</span></div>
      <h4 style={{fontSize:".9rem",fontWeight:700,lineHeight:1.2,marginBottom:6}}>{q.q}</h4>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>{q.opts.map((o,i)=><button key={i} onClick={()=>{if(ans(i,econ.stake,econ.reward))u("tm",15)}} disabled={s.tm===0} style={{padding:8,borderRadius:6,border:"1px solid var(--bd)",background:"var(--cd)",color:"var(--tx)",textAlign:"left",fontWeight:600,fontSize:".76rem",cursor:s.tm===0?"not-allowed":"pointer",opacity:s.tm===0?.4:1}}>{o}</button>)}</div>
      {s.tm===0&&<Btn small primary onClick={()=>u({tm:15,qi:s.qi+1})} style={{marginTop:5}}>Next</Btn>}</div>}

    {game.type==="cards"&&<div style={{textAlign:"center"}}>
      <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:8}}>
        {[[s.cP,"var(--cy)"],[s.cO,"var(--pk)"]].map(([v,c],i)=><div key={i} style={{width:50,height:70,borderRadius:6,border:"1px solid "+c,background:"var(--cd)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:"1.2rem",color:c}}>{v||"?"}</div>)}
        <div style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",fontWeight:800,color:"var(--mt)",fontSize:".7rem"}}>VS</div>
      </div>
      <Btn primary small onClick={()=>{if(!spend(econ.stake,"flip"))return;const p=Math.floor(Math.random()*13)+2,o=Math.floor(Math.random()*13)+2;u({cP:p,cO:o,fb:p>o?`You win! +${fsn(econ.reward)}`:p<o?"Opponent wins":"Draw!",m:Math.min(100,s.m+(p>o?10:0))});if(p>o)award(econ.reward)}}>Flip</Btn></div>}

    {game.type==="auction"&&<div><div style={{padding:8,borderRadius:7,border:"1px solid var(--bd)",background:"var(--cd)",marginBottom:7,textAlign:"center"}}>
      <div style={{fontSize:".58rem",color:"var(--mt)",textTransform:"uppercase"}}>High Bid</div><div style={{fontWeight:900,fontSize:"1.2rem",color:"var(--am)"}}>{fsn(s.hb)}</div></div>
      <div style={{display:"flex",gap:4}}><input type="number" min={s.hb+econ.minBid} max={balance} value={s.bid} onChange={e=>u("bid",parseInt(e.target.value)||0)} style={{flex:1,textAlign:"center",fontWeight:700}}/>
        <Btn primary small onClick={()=>{const bid=Math.floor(Number(s.bid)||0);if(bid<s.hb+econ.minBid){flash(`Raise by at least ${fsn(econ.minBid)} sparks.`);return}if(!spend(bid,"place bid"))return;u({hb:bid,fb:"Top bidder! Bid held in escrow",m:Math.min(100,s.m+5)});setTimeout(()=>u("fb",""),1800)}}>Bid</Btn></div>
      <p style={{fontSize:".62rem",color:"var(--mt)",lineHeight:1.4,marginTop:7}}>Winning bids are deducted immediately and stay pending until the performer accepts the moment or refunds it.</p></div>}

    {game.type==="score"&&<div><div style={{textAlign:"center",marginBottom:6}}><div style={{fontWeight:900,fontSize:"1.5rem",color:"var(--lm)"}}>{s.hs}</div><div style={{fontSize:".6rem",color:"var(--mt)"}}>Round {s.hr}</div></div>
      <h4 style={{fontSize:".88rem",fontWeight:700,marginBottom:5}}>{q.q}</h4>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>{q.opts.map((o,i)=><button key={i} onClick={()=>{if(!spend(econ.stake,"answer"))return;if(i===q.ans){u({hs:s.hs+100,hr:s.hr+1,qi:s.qi+1,fb:`+100 score, +${fsn(econ.reward)}`});award(econ.reward)}else u({hr:s.hr+1,qi:s.qi+1,fb:"0pts"});setTimeout(()=>u("fb",""),1500)}} style={{padding:8,borderRadius:6,border:"1px solid var(--bd)",background:"var(--cd)",color:"var(--tx)",textAlign:"left",fontWeight:600,fontSize:".76rem",cursor:"pointer"}}>{o}</button>)}</div></div>}

    {game.type==="box"&&<div><p style={{fontSize:".76rem",color:"var(--mt)",marginBottom:6}}>Tap to reveal. 10 sparks each.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5}}>{s.bx.map((b,i)=><button key={i} onClick={()=>{if(!b.op){if(!spend(econ.stake,"open drop"))return;const nb=[...s.bx];nb[i]={...nb[i],op:true};const prize=b.pr.includes("sparks")?parseInt(b.pr):0;u({bx:nb,m:Math.min(100,s.m+6),fb:prize?`Drop +${fsn(prize)}`:`Revealed ${b.pr}`});if(prize)award(prize);setTimeout(()=>u("fb",""),1400)}}} disabled={b.op} style={{height:55,borderRadius:7,border:"1px solid var(--bd)",background:b.op?"rgba(255,255,255,.02)":"var(--cd)",cursor:b.op?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",fontSize:".66rem",fontWeight:700,color:b.op?"var(--lm)":"var(--mt)"}}>
          {b.op?b.pr:<I n="mystery" s={18} c="var(--am)"/>}</button>)}</div></div>}

    {game.type==="ladder"&&<div style={{textAlign:"center"}}>
      <div style={{display:"flex",flexDirection:"column-reverse",gap:2,marginBottom:8}}>{[1,2,3,4,5].map(r=><div key={r} style={{padding:5,borderRadius:5,border:"1px solid var(--bd)",background:s.lr>=r?"rgba(255,45,120,.08)":"var(--cd)",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:".72rem"}}>
        <span style={{fontWeight:700,color:s.lr>=r?"var(--pk)":"var(--mt)"}}>Rung {r}</span><span style={{color:"var(--am)"}}>{r*25}</span>{s.lr>=r&&<I n="check" s={11} c="var(--gn)"/>}</div>)}</div>
      {!s.lb?<div style={{display:"flex",gap:5,justifyContent:"center"}}><Btn primary small disabled={s.lr>=5} onClick={()=>{const next=s.lr+1,cost=next*econ.stepStake;if(!spend(cost,"climb"))return;u({lr:next,m:Math.min(100,s.m+12),fb:`Rung ${next} locked`});setTimeout(()=>u("fb",""),1200)}}>Climb</Btn>
        <Btn small disabled={s.lr===0} onClick={()=>{const prize=s.lr*econ.rewardStep;award(prize);u({lb:true,fb:`Banked ${fsn(prize)}!`})}}>Bank</Btn></div>:<p style={{fontWeight:700,color:"var(--gn)"}}>Banked!</p>}</div>}

    {game.type==="reaction"&&<div style={{textAlign:"center"}}>
      {!s.bres?<><p style={{fontSize:".78rem",color:"var(--mt)",marginBottom:12}}>Tap when it lights up!</p>
        <button onClick={()=>{if(s.br){if(!spend(econ.stake,"reaction tap"))return;const ms=Date.now()-s.bt;u({bres:ms<500?"F":"S",bms:ms,br:false});if(ms<500)award(econ.reward)}}} style={{width:80,height:80,borderRadius:"50%",border:"3px solid "+(s.br?"var(--pk)":"var(--bd)"),background:s.br?"rgba(255,45,120,.15)":"var(--cd)",cursor:"pointer",animation:s.br?"bf .3s infinite":"none"}}>
          <span style={{fontWeight:900,fontSize:s.br?".9rem":".72rem",color:s.br?"var(--pk)":"var(--mt)"}}>{s.br?"TAP!":"Wait..."}</span></button></>
      :<div><div style={{fontWeight:900,fontSize:"1.3rem",color:s.bms<500?"var(--gn)":"var(--pk)"}}>{s.bms}ms</div>
        <Btn primary small onClick={()=>u({br:false,bres:null,bms:0})} style={{marginTop:6}}>Again</Btn></div>}</div>}

    {game.type==="touch"&&<div>
      <p style={{fontSize:".74rem",color:"var(--mt)",lineHeight:1.45,marginBottom:8}}>Draw a glow trace over the live frame. The performer sees it as a pending interaction and accepts the one they want to acknowledge.</p>
      <div onPointerDown={e=>{if(!spend(econ.trace,"place trace"))return;const r=e.currentTarget.getBoundingClientRect(),x=((e.clientX-r.left)/r.width)*100,y=((e.clientY-r.top)/r.height)*100;u({tc:[...s.tc.slice(-7),{x,y,id:Date.now()}],m:Math.min(100,s.m+9),fb:"Trace point held"});setTimeout(()=>u("fb",""),1000)}} style={{position:"relative",height:190,borderRadius:12,border:"1px solid rgba(0,212,255,.24)",overflow:"hidden",cursor:"crosshair",background:"radial-gradient(circle at 50% 34%,rgba(255,196,160,.22),transparent 14%),linear-gradient(180deg,rgba(10,14,24,.9),rgba(14,6,22,.96))"}}>
        <div style={{position:"absolute",left:"50%",bottom:0,transform:"translateX(-50%)",width:82,height:142,borderRadius:"44% 44% 14px 14px",background:"linear-gradient(170deg,rgba(255,45,120,.76),rgba(139,92,246,.62),rgba(5,8,16,.9))",filter:"blur(.1px)"}}/>
        {s.tc.map((m,i)=><div key={m.id} style={{position:"absolute",left:`${m.x}%`,top:`${m.y}%`,width:42,height:42,borderRadius:"50%",transform:"translate(-50%,-50%)",border:"1px solid rgba(0,212,255,.7)",background:"radial-gradient(circle,rgba(0,212,255,.28),transparent 68%)",boxShadow:"0 0 30px rgba(0,212,255,.35)",opacity:.45+i*.07}}/>)}
        <div style={{position:"absolute",left:10,bottom:10,right:10,display:"flex",justifyContent:"space-between",fontSize:".58rem",color:"rgba(255,255,255,.62)",fontWeight:800}}><span>touch map</span><span>{s.tc.length} traces</span></div>
      </div>
      <div style={{display:"flex",gap:6,marginTop:8}}><Btn small primary onClick={()=>{if(!s.tc.length){flash("Place a trace first.");return}if(!spend(econ.submit,"send trace"))return;u({fb:"Trace sent for performer approval",m:Math.min(100,s.m+12)})}}>Send Trace</Btn><Btn small onClick={()=>u("tc",[])}>Clear</Btn></div>
    </div>}

    {game.type==="jackpot"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",padding:7,borderRadius:7,background:"linear-gradient(135deg,rgba(251,191,36,.05),rgba(255,45,120,.03))",border:"1px solid rgba(251,191,36,.12)",marginBottom:6}}>
        <div><div style={{fontSize:".5rem",color:"var(--mt)",textTransform:"uppercase"}}>Lives</div><div style={{display:"flex",gap:2,marginTop:1}}>{[0,1,2].map(i=><div key={i} style={{width:9,height:9,borderRadius:"50%",background:i<s.jl?"var(--pk)":"var(--bd)"}}/>)}</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:".5rem",color:"var(--mt)",textTransform:"uppercase"}}>Streak</div><div style={{fontWeight:900,fontSize:"1.1rem",color:"var(--am)"}}>{s.js}/10</div></div>
        <div style={{textAlign:"right"}}><div style={{fontSize:".5rem",color:"var(--mt)",textTransform:"uppercase"}}>Prize</div><div style={{fontWeight:700,fontSize:".65rem",color:"var(--lm)"}}>Free 1-on-1</div></div></div>
      {s.jw?<div style={{textAlign:"center",padding:14}}><I n="crown" s={32} c="var(--am)"/><div style={{fontWeight:900,fontSize:"1.1rem",color:"var(--am)",marginTop:5}}>JACKPOT!</div></div>
      :s.jl<=0?<div style={{textAlign:"center",padding:14}}><div style={{fontWeight:900,color:"var(--pk)"}}>Game Over</div></div>
      :<div><h4 style={{fontSize:".88rem",fontWeight:700,marginBottom:5}}>{q.q}</h4>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>{q.opts.map((o,i)=><button key={i} onClick={()=>{if(!spend(econ.stake,"play streak"))return;if(i===q.ans){const ns=s.js+1;if(ns>=10){u({js:ns,jw:true,m:100,fb:`Jackpot +${fsn(econ.jackpot)}`});award(econ.jackpot)}else{u({js:ns,m:ns*10,fb:ns+"/10",qi:s.qi+1})}}else{u({jl:s.jl-1,js:0,m:0,fb:"Life lost",qi:s.qi+1})}setTimeout(()=>u("fb",""),1500)}} style={{padding:8,borderRadius:6,border:"1px solid var(--bd)",background:"var(--cd)",color:"var(--tx)",textAlign:"left",fontWeight:600,fontSize:".76rem",cursor:"pointer"}}>{o}</button>)}</div></div>}</div>}

    {s.fb&&<p style={{marginTop:5,fontWeight:700,fontSize:".76rem",color:s.fb.includes("Correct")||s.fb.includes("win")||s.fb.includes("Bank")||s.fb.includes("/10")||s.fb.includes("Top bidder")||s.fb.includes("+")||s.fb.includes("opened")||s.fb.includes("sent")||s.fb.includes("locked")?"var(--gn)":"var(--pk)"}}>{s.fb}</p>}
  </Pn>;}

/* ═══ LOBBY ═══ */
function RequestMoment({item,perf}){
  const pal=requestPalette(item.name);
  return <div className="reqMoment" style={{position:"absolute",right:"max(22px,8vw)",top:"26%",zIndex:12,width:"min(340px,30vw)",minWidth:280,pointerEvents:"none",filter:"drop-shadow(0 30px 70px rgba(0,0,0,.38))"}}>
    <style>{`
      @keyframes reqMomentIn{0%{opacity:0;transform:translateY(18px) scale(.88) rotateX(18deg)}16%{opacity:1}68%{opacity:1;transform:translateY(0) scale(1) rotateX(0)}100%{opacity:0;transform:translateY(-12px) scale(.96) rotateX(0)}}
      @keyframes reqSealTurn{0%,100%{transform:rotateY(-18deg) rotateX(12deg) translateY(0)}50%{transform:rotateY(20deg) rotateX(18deg) translateY(-5px)}}
      @keyframes reqLineSweep{0%{transform:translateX(-110%);opacity:0}18%{opacity:.75}76%{opacity:.75}100%{transform:translateX(110%);opacity:0}}
      @keyframes reqPrism{0%,100%{opacity:.28;transform:scale(.92)}50%{opacity:.7;transform:scale(1.04)}}
    `}</style>
    <div style={{position:"relative",overflow:"hidden",borderRadius:16,border:`1px solid ${pal.a}66`,background:"linear-gradient(135deg,rgba(255,255,255,.12),rgba(7,9,16,.88) 45%,rgba(255,255,255,.05))",backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",animation:"reqMomentIn 5.2s cubic-bezier(.16,1,.3,1) both"}}>
      <div style={{position:"absolute",inset:-1,background:`radial-gradient(circle at 18% 10%,${pal.a}33,transparent 28%),radial-gradient(circle at 88% 74%,${pal.b}30,transparent 30%)`}}/>
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:"36%",background:`linear-gradient(100deg,transparent,${pal.a}26,transparent)`,animation:"reqLineSweep 2.2s ease-in-out infinite"}}/>
      <div style={{position:"relative",display:"grid",gridTemplateColumns:"76px 1fr",gap:14,padding:"16px 17px",alignItems:"center"}}>
        <div style={{position:"relative",width:76,height:76,perspective:700}}>
          <div style={{position:"absolute",inset:5,borderRadius:"50%",background:`radial-gradient(circle,${pal.a}44,transparent 64%)`,filter:"blur(10px)",animation:"reqPrism 1.9s ease-in-out infinite"}}/>
          <div style={{position:"absolute",inset:12,borderRadius:"50%",border:`1px solid ${pal.a}88`,transform:"rotateX(68deg)",boxShadow:`0 0 28px ${pal.a}44`}}/>
          <div style={{position:"absolute",left:16,top:13,width:44,height:50,borderRadius:"12px 12px 18px 18px",background:`linear-gradient(145deg,rgba(255,255,255,.82),${pal.a} 48%,${pal.b})`,boxShadow:`inset -10px -12px 20px rgba(0,0,0,.26), inset 8px 8px 18px rgba(255,255,255,.34), 0 18px 40px ${pal.a}44`,clipPath:"polygon(50% 0,88% 18%,88% 70%,50% 100%,12% 70%,12% 18%)",animation:"reqSealTurn 2.4s ease-in-out infinite"}}/>
          <div style={{position:"absolute",left:29,top:26,width:18,height:18,borderRadius:"50%",border:"2px solid rgba(6,8,16,.62)"}}/>
        </div>
        <div style={{minWidth:0}}>
          <div style={{fontSize:".58rem",letterSpacing:".18em",textTransform:"uppercase",fontWeight:1000,color:pal.a}}>Request accepted</div>
          <div style={{fontSize:"1rem",fontWeight:1000,lineHeight:1.1,marginTop:4,color:"#fff",textShadow:`0 0 22px ${pal.a}44`}}>{item.name}</div>
          <div style={{fontSize:".66rem",lineHeight:1.4,color:"rgba(255,255,255,.68)",marginTop:5}}>{item.user} locked {fsn(item.sparks)} sparks with {perf.name.split(" ")[0]}</div>
          <div style={{display:"flex",alignItems:"center",gap:7,marginTop:10}}>
            <span style={{height:1,flex:1,background:`linear-gradient(90deg,${pal.a},transparent)`}}/>
            <span style={{fontSize:".56rem",letterSpacing:".16em",textTransform:"uppercase",fontWeight:1000,color:pal.b}}>{pal.label} moment</span>
          </div>
        </div>
      </div>
    </div>
  </div>;
}

function LB({user,onPerf,onWallet,cat,setCat,onMenu}){
  const f=cat==="All"?PERFS:PERFS.filter(p=>p.cats.includes(cat));const tier=gl(user.spent);
  return<div style={{minHeight:"100vh",background:"var(--bg)",padding:"12px clamp(10px,3vw,30px)"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",gap:7}}>
        <button onClick={onMenu} style={{background:"none",border:"none",color:"var(--tx)",cursor:"pointer",display:"flex"}}><I n="menu" s={19}/></button>
        <div style={{width:30,height:30,borderRadius:7,background:"linear-gradient(135deg,var(--pk),var(--am),var(--lm))",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:".62rem",color:"#000"}}>VB</div>
        <div><div style={{fontWeight:800,fontSize:".88rem"}}>VYBE</div><div style={{fontSize:".5rem",color:"var(--mt)"}}>you are known here</div></div></div>
      <div style={{display:"flex",gap:4,alignItems:"center"}}>
        <G onClick={onWallet} style={{padding:"4px 8px",display:"flex",alignItems:"center",gap:3,cursor:"pointer"}}><I n="spark" s={11} c="var(--am)"/><span style={{fontWeight:700,fontSize:".74rem"}}>{user.sparks.toLocaleString()}</span><I n="plus" s={8} c="var(--mt)"/></G>
        <G style={{padding:"4px 8px",display:"flex",alignItems:"center",gap:2}}><I n="shield" s={10} c={tier.color}/><span style={{fontSize:".66rem",fontWeight:700,color:tier.color}}>{tier.name}</span></G>
      </div></div>
    <div style={{display:"flex",gap:3,overflowX:"auto",marginBottom:12,paddingBottom:2}}>{CATS.slice(0,10).map(c=><button key={c} onClick={()=>setCat(c)} style={{padding:"4px 11px",borderRadius:999,border:cat===c?"1px solid var(--pk)":"1px solid var(--bd)",background:cat===c?"rgba(255,45,120,.08)":"none",color:cat===c?"var(--pk)":"var(--mt)",fontWeight:700,fontSize:".7rem",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{c}</button>)}</div>
    {/* Featured */}
    {f[0]&&<div className="ai" onClick={()=>onPerf(f[0])} style={{position:"relative",borderRadius:12,overflow:"hidden",marginBottom:14,minHeight:200,cursor:"pointer",border:"1px solid var(--bd)",background:`linear-gradient(135deg,${f[0].accent}10,transparent 40%),linear-gradient(180deg,#0c1628,#0d0f1a)`,animation:"glow 3s ease infinite"}}>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"flex-end",padding:18}}>
        <div style={{flex:1}}><Lv/><h2 style={{fontSize:"clamp(1.2rem,2.4vw,1.7rem)",fontWeight:900,marginTop:5,lineHeight:1.1}}>{f[0].name}</h2>
          <p style={{color:"var(--mt)",fontSize:".8rem",marginTop:1}}>{f[0].vibe}</p>
          <div style={{display:"flex",gap:3,marginTop:5,flexWrap:"wrap"}}><Tag color="var(--pk)"><I n="gamepad" s={7} c="var(--pk)"/> {f[0].game}</Tag><Tag color="var(--cy)"><I n="users" s={7} c="var(--cy)"/> {f[0].viewers}</Tag></div></div>
        <Btn primary small>View Profile</Btn></div></div>}
    <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:7}}><I n="live" s={11} c="var(--pk)"/><h3 style={{fontWeight:800,fontSize:".84rem"}}>Live Now — {cat}</h3></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8,marginBottom:16}}>
      {f.map((p,i)=><G key={p.id} className="ai" onClick={()=>onPerf(p)} style={{padding:0,overflow:"hidden",cursor:"pointer",animationDelay:`${i*.04}s`}}>
        <div style={{height:90,position:"relative",background:`linear-gradient(135deg,${p.accent}10,transparent 50%),linear-gradient(180deg,#0c1628,#0d0f1a)`}}>
          <div style={{position:"absolute",top:6,left:6}}><Lv/></div><div style={{position:"absolute",top:6,right:6}}><Tag color={HEAT[p.level]}>{p.level}</Tag></div></div>
        <div style={{padding:"7px 9px"}}><div style={{display:"flex",justifyContent:"space-between"}}><h4 style={{fontWeight:700,fontSize:".8rem"}}>{p.name}</h4><span style={{fontSize:".62rem",color:"var(--mt)"}}>{p.viewers}</span></div>
          <p style={{color:"var(--mt)",fontSize:".68rem",marginTop:1}}>{p.vibe}</p></div></G>)}
    </div>
    {/* How VYBE Works */}
    <div style={{padding:16,border:"1px solid var(--bd)",borderRadius:12,background:"var(--cd)",marginBottom:14}}>
      <Kk>The VYBE Difference</Kk><Tt s="1.1rem">You are not a spectator. You are known.</Tt>
      <p style={{fontSize:".78rem",color:"var(--mt)",lineHeight:1.6,margin:"8px 0 12px"}}>On every other platform, you're anonymous viewer #47,291. On VYBE, you have a name, a reputation, a history. Performers know who you are. Your community knows your name. Every game you play, every session, every interaction builds your identity.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {[{t:"Watch Live",d:"Free rooms. Play games. Be seen.",i:"eye",c:"var(--lm)"},
          {t:"Book Private",d:"1-on-1. You pick the games.",i:"bookmark",c:"var(--cy)"},
          {t:"Go VIP",d:"Custom scenarios. Full control.",i:"crown",c:"var(--am)"}].map(x=>
          <div key={x.t} style={{padding:12,borderRadius:8,border:"1px solid var(--bd)",textAlign:"center"}}>
            <I n={x.i} s={20} c={x.c}/><div style={{fontWeight:800,fontSize:".84rem",marginTop:4}}>{x.t}</div>
            <p style={{fontSize:".68rem",color:"var(--mt)",marginTop:3,lineHeight:1.4}}>{x.d}</p></div>)}
      </div></div>
    {/* Games */}
    <div style={{padding:16,border:"1px solid var(--bd)",borderRadius:12,background:"var(--cd)",marginBottom:14}}>
      <Kk>11 Game Modes — Spark-Backed Play</Kk>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:5,marginTop:8}}>
        {GAMES.map(g=><div key={g.id} style={{padding:"7px 8px",borderRadius:7,border:"1px solid var(--bd)"}}>
          <div style={{display:"flex",alignItems:"center",gap:3}}><I n={g.icon} s={12} c={g.color}/><span style={{fontWeight:700,fontSize:".72rem"}}>{g.name}</span></div>
          <p style={{fontSize:".62rem",color:"var(--mt)",lineHeight:1.3,marginTop:1}}>{g.desc}</p>
          <div style={{marginTop:4,fontSize:".56rem",fontWeight:900,color:"var(--am)",display:"flex",alignItems:"center",gap:2}}><I n="spark" s={8} c="var(--am)"/>{gameEconomyLine(g.type)}</div></div>)}</div>
    </div>
    <div style={{padding:10,borderTop:"1px solid var(--bd)",fontSize:".56rem",color:"var(--mt)",textAlign:"center"}}>VYBE Inc. · 18 USC §2257 · 80/20 · CCBill/Segpay · <a href="#" style={{color:"var(--cy)"}}>Terms</a> · <a href="#" style={{color:"var(--cy)"}}>Privacy</a> · <a href="#" style={{color:"var(--cy)"}}>2257</a> · <a href="#" style={{color:"var(--cy)"}}>DMCA</a></div>
  </div>;}

/* ═══ LIVE ROOM ═══ */
function RM({perf,user,onBack,onSC,onWallet,onBook,onVip,onGiftSent}){
  const [pn,setPn]=useState(null);const [gm,setGm]=useState(null);
  const settingsPreview=typeof window!=="undefined"&&new URLSearchParams(window.location.search).get("settingsPreview")==="1";
  const [media,setMedia]=useState({paused:false,muted:false,settings:settingsPreview,captions:false,pip:false,quality:"1080p",layout:"Theater"});
  const [ch,setCh]=useState([{user:"VYBE",msg:`Welcome — ${perf.name} is live. You are known here.`,vip:false,id:0}]);
  const [ci,setCi]=useState("");const [chH,setChH]=useState(false);
  const [anims,setAnims]=useState([]);const [reqFx,setReqFx]=useState([]);const [notif,setNotif]=useState(null);const [tm,setTm]=useState(1800);
  const [pendingReq,setPendingReq]=useState([{id:1,user:"test",name:"Ultimate Fantasy",desc:"You design it, she delivers",sparks:5000,status:"pending"}]);
  const aid=useRef(0);const CP=[{user:"NightOwl",msg:"Let's go"},{user:"VelvetKing",msg:"Crown incoming",vip:true},{user:"AceHigh",msg:"All in",vip:true},{user:"DiamondJay",msg:"Here we go",vip:true}];
  useEffect(()=>{const t=setInterval(()=>{if(!media.paused)setTm(p=>Math.max(0,p-1))},1000);return()=>clearInterval(t)},[media.paused]);
  useEffect(()=>{const t=setInterval(()=>{setCh(p=>[...p.slice(-39),{...CP[Math.floor(Math.random()*4)],id:Date.now()}])},5000);return()=>clearInterval(t)},[]);
  const fmt=s=>`${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;
  const tog=n=>{setPn(p=>p===n?null:n);if(n)setGm(null)};
  const sg=g=>{if(user.sparks<g.cost)return;onSC(-g.cost);const id=++aid.current,x=68+Math.random()*20,y=18+Math.random()*24;
    const effectId=getEffectForCost(g.cost).id;
    setAnims(p=>[...p,{...g,id,x,y}]);setTimeout(()=>setAnims(p=>p.filter(a=>a.id!==id)),2200);
    setCh(p=>[...p.slice(-39),{user:user.name,msg:`sent ${g.name}`,vip:true,id:Date.now()}]);onGiftSent&&onGiftSent(effectId);setPn(null)};
  const sc=()=>{if(!ci.trim())return;setCh(p=>[...p.slice(-39),{user:user.name,msg:ci,vip:true,id:Date.now()}]);setCi("")};
  const sb=a=>{onSC(a);setNotif(`+${a} sparks earned`);setTimeout(()=>setNotif(null),1800)};
  const acceptReq=id=>{const rq=pendingReq.find(r=>r.id===id&&r.status==="pending");if(!rq)return;setPendingReq(p=>p.filter(r=>r.id!==id));setNotif(null);const fx={...rq,id:Date.now()};setReqFx(p=>[...p,fx]);setTimeout(()=>setReqFx(p=>p.filter(r=>r.id!==fx.id)),5400);setCh(p=>[...p.slice(-39),{user:"Performer",msg:`accepted ${rq.name}`,vip:false,id:Date.now()}])};
  const declineReq=id=>{const rq=pendingReq.find(r=>r.id===id&&r.status==="pending");if(!rq)return;setPendingReq(p=>p.filter(r=>r.id!==id));if(rq.user===user.name)onSC(rq.sparks);setCh(p=>[...p.slice(-39),{user:"VYBE",msg:`${rq.name} declined - ${rq.sparks.toLocaleString()} sparks refunded to ${rq.user}`,vip:false,id:Date.now()}]);setNotif(`${rq.sparks.toLocaleString()} sparks refunded to ${rq.user}`);setTimeout(()=>setNotif(null),2200)};
  const addReq=r=>{if(user.sparks<r.sparks)return;onSC(-r.sparks);const item={id:Date.now(),user:user.name,name:r.name,desc:r.desc,sparks:r.sparks,status:"pending"};setPendingReq(p=>[item,...p].slice(0,5));setCh(p=>[...p.slice(-39),{user:user.name,msg:`requested ${r.name} - pending performer approval`,vip:true,id:Date.now()}]);setPn(null)};
  const avG=GAMES.filter(g=>perf.caps.games.includes(g.id));

  return<div style={{position:"relative",width:"100%",height:"100vh",overflow:"hidden",background:"#050810"}}>
    <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 45% 65%,${perf.accent}15,transparent 50%),radial-gradient(ellipse at 55% 35%,rgba(0,212,255,.06),transparent 50%),linear-gradient(180deg,#080e1c,#0a0814 50%,#0d061a)`}}>
      <div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:"min(300px,36%)",height:"72%"}}>
        <div style={{position:"absolute",top:"4%",left:"50%",transform:"translateX(-50%)",width:64,height:64,borderRadius:"50%",background:"radial-gradient(circle,#e8c4a8 55%,#c49070)"}}/>
        <div style={{position:"absolute",bottom:"-3%",left:"50%",transform:"translateX(-50%)",width:160,height:"70%",borderRadius:"42% 42% 20px 20px",background:`linear-gradient(170deg,${perf.accent} 15%,var(--vi) 50%,#0a0e1a 90%)`}}/></div>
      {anims.map(g=><div key={g.id} className="gpa" style={{left:`${g.x}%`,top:`${g.y}%`}}><I n={g.icon} s={g.cost>=500?40:g.cost>=150?32:24} c={g.color}/></div>)}
      {reqFx.map(r=><RequestMoment key={r.id} item={r} perf={perf}/>)}
    </div>
    {notif&&<div className="ai" style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:50,padding:"7px 16px",borderRadius:9,background:notif.includes("refunded")?"rgba(255,171,0,.1)":"rgba(34,197,94,.1)",border:"1px solid "+(notif.includes("refunded")?"var(--am)":"var(--gn)"),fontWeight:800,fontSize:".82rem",color:notif.includes("refunded")?"var(--am)":"var(--gn)"}}>{notif}</div>}
    {/* Top */}
    <div style={{position:"absolute",top:0,left:0,right:0,display:"flex",justifyContent:"space-between",alignItems:"start",padding:"9px 10px",zIndex:10}}>
      <G style={{padding:"6px 9px",display:"flex",alignItems:"center",gap:6}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"var(--tx)",cursor:"pointer",padding:0,display:"flex"}}><I n="back" s={14}/></button>
        <div><div style={{display:"flex",alignItems:"center",gap:4}}><Lv/><span style={{fontWeight:800,fontSize:".8rem"}}>{perf.name}</span></div>
          <div style={{display:"flex",gap:4,marginTop:1,fontSize:".62rem",color:"var(--mt)"}}>
            <span><I n="users" s={8} c="var(--mt)"/> {perf.viewers}</span><span>{fmt(tm)}</span></div></div></G>
      <div style={{display:"flex",gap:3}}>
        <G onClick={onWallet} style={{padding:"4px 7px",display:"flex",alignItems:"center",gap:2,cursor:"pointer"}}><I n="spark" s={10} c="var(--am)"/><span style={{fontWeight:800,fontSize:".76rem",color:"var(--am)"}}>{user.sparks.toLocaleString()}</span><I n="plus" s={7} c="var(--mt)"/></G>
      </div></div>
    {/* Room signal + chat */}
    {!chH&&<div style={{position:"absolute",top:76,left:12,bottom:88,zIndex:8,width:"clamp(280px,28vw,360px)",display:"flex",flexDirection:"column",gap:10,pointerEvents:"auto"}}>
      <G style={{padding:12,borderRadius:12,background:"linear-gradient(180deg,rgba(8,10,16,.54),rgba(8,10,16,.86))",boxShadow:"0 22px 70px rgba(0,0,0,.28)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:".66rem",fontWeight:900,letterSpacing:".12em",textTransform:"uppercase",color:"var(--mt)"}}>Room heat</div>
          <div style={{fontSize:".68rem",fontWeight:900,color:"var(--lm)"}}>74%</div>
        </div>
        <div style={{height:84,borderRadius:10,position:"relative",overflow:"hidden",border:"1px solid rgba(255,255,255,.07)",background:"radial-gradient(circle at 72% 46%,rgba(255,45,120,.24),transparent 20%),radial-gradient(circle at 38% 70%,rgba(0,212,255,.18),transparent 24%),linear-gradient(90deg,rgba(255,255,255,.035),rgba(255,255,255,.01))"}}>
          {[18,34,50,66,82].map((x,i)=><div key={x} style={{position:"absolute",left:`${x}%`,bottom:10,width:18+i*4,height:28+i*7,borderRadius:999,background:`linear-gradient(180deg,${["#00d4ff","#c6ff00","#ffab00","#ff2d78","#8b5cf6"][i]},rgba(255,255,255,.05))`,filter:"blur(.2px)",opacity:.82}}/>)}
          <svg viewBox="0 0 320 72" preserveAspectRatio="none" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
            <path d="M0 54 C42 44 62 58 100 38 S164 28 210 40 S274 28 320 18" fill="none" stroke="rgba(255,255,255,.42)" strokeWidth="2"/>
            <path d="M0 58 C42 48 62 62 100 42 S164 32 210 44 S274 32 320 22" fill="none" stroke="rgba(255,45,120,.55)" strokeWidth="5" opacity=".28"/>
          </svg>
          <div style={{position:"absolute",left:10,bottom:8,right:10,display:"flex",justifyContent:"space-between",fontSize:".54rem",color:"rgba(255,255,255,.58)",fontWeight:800}}><span>attention</span><span>requests</span><span>spark pressure</span></div>
        </div>
      </G>
      <G style={{padding:12,borderRadius:12,background:"linear-gradient(180deg,rgba(8,10,16,.5),rgba(8,10,16,.9))",boxShadow:"0 22px 70px rgba(0,0,0,.28)",minHeight:0,display:"flex",flexDirection:"column",flex:1}}>
        <div style={{fontSize:".68rem",fontWeight:900,letterSpacing:".1em",textTransform:"uppercase",color:"var(--mt)",marginBottom:8}}>Room</div>
        {pendingReq.filter(r=>r.status==="pending").map(r=><div key={r.id} style={{padding:10,borderRadius:10,border:"1px solid rgba(255,171,0,.28)",background:"linear-gradient(135deg,rgba(255,171,0,.09),rgba(255,45,120,.05))",marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"start"}}><div><div style={{fontSize:".58rem",letterSpacing:".12em",textTransform:"uppercase",color:"var(--am)",fontWeight:900}}>Pending request</div><div style={{fontWeight:900,fontSize:".82rem",marginTop:3}}>{r.name}</div><div style={{fontSize:".66rem",color:"var(--mt)",marginTop:2}}>{r.user} escrowed {r.sparks.toLocaleString()} sparks</div></div><I n="request" s={18} c="var(--am)"/></div>
          <div style={{display:"flex",gap:6,marginTop:9}}><button onClick={()=>acceptReq(r.id)} style={{flex:1,height:30,border:0,borderRadius:8,background:"var(--gn)",color:"#04110a",fontWeight:900,cursor:"pointer"}}>Accept</button><button onClick={()=>declineReq(r.id)} style={{flex:1,height:30,border:"1px solid rgba(255,255,255,.12)",borderRadius:8,background:"rgba(255,255,255,.06)",color:"var(--tx)",fontWeight:900,cursor:"pointer"}}>Decline + refund</button></div>
        </div>)}
        <div style={{overflowY:"auto",minHeight:0,flex:1,paddingRight:4}}>
          {ch.map((m,i)=><div key={m.id} style={{padding:"4px 0",fontSize:".76rem",opacity:.62+Math.min(i,ch.length-1)/(Math.max(ch.length-1,1))*.36,lineHeight:1.35}}>
            <span style={{fontWeight:800,color:m.vip?"var(--am)":"var(--cy)",marginRight:5}}>{m.user}</span>
            <span style={{color:"rgba(255,255,255,.76)"}}>{m.msg}</span></div>)}
        </div>
        <div style={{display:"flex",gap:5,marginTop:10}}><input type="text" value={ci} onChange={e=>setCi(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sc()}} placeholder="Type..." style={{fontSize:".76rem",padding:"7px 9px",background:"rgba(255,255,255,.06)",borderRadius:999}}/>
          <button onClick={sc} style={{background:"var(--pk)",border:"none",borderRadius:999,padding:"0 11px",cursor:"pointer",color:"#fff",fontWeight:800,fontSize:".68rem"}}>Send</button></div>
      </G>
    </div>}
    {/* Panels */}
    {pn==="board"&&<Pn onClose={()=>setPn(null)} title="Leaderboard" icon="trophy" ic="var(--am)" style={{position:"absolute",right:12,top:88,zIndex:22,width:230,maxHeight:"calc(100vh - 180px)",background:"linear-gradient(180deg,rgba(10,13,22,.96),rgba(8,10,16,.9))",boxShadow:"0 24px 80px rgba(0,0,0,.42)"}}>
      {VWR.map((v,i)=><div key={v.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 0",fontSize:".7rem",borderBottom:i<4?"1px solid var(--bd)":"none"}}>
        <span style={{display:"flex",alignItems:"center",gap:3}}>{i===0&&<I n="crown" s={8} c="var(--am)"/>}{v.badge&&<I n={v.badge} s={8} c="var(--am)"/>}{v.name}</span><span style={{fontWeight:700,color:"var(--pk)"}}>{v.score}</span></div>)}</Pn>}
    {pn==="gifts"&&<G className="ai" style={{position:"absolute",left:10,right:10,bottom:56,zIndex:14,padding:"9px 10px",borderRadius:12,background:"rgba(15,18,29,.92)"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:2,flex:1}}>
          {GIFTS.map(g=><button key={g.id} onClick={()=>sg(g)} disabled={user.sparks<g.cost} style={{minWidth:78,height:72,padding:"7px 5px",borderRadius:9,border:"1px solid "+(user.sparks>=g.cost?g.color+"55":"var(--bd)"),background:user.sparks>=g.cost?"rgba(255,255,255,.055)":"rgba(255,255,255,.025)",cursor:user.sparks>=g.cost?"pointer":"not-allowed",textAlign:"center",opacity:user.sparks>=g.cost?1:.34,display:"grid",placeItems:"center",gap:1,flexShrink:0}}>
            <I n={g.icon} s={24} c={g.color}/><div style={{fontWeight:800,fontSize:".62rem",lineHeight:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:68}}>{g.name}</div><div style={{fontSize:".56rem",color:"var(--am)",fontWeight:800}}><I n="spark" s={8} c="var(--am)"/> {g.cost.toLocaleString()}</div></button>)}
        </div>
        <button onClick={()=>setPn(null)} aria-label="Close gifts" style={{width:34,height:34,borderRadius:17,border:"1px solid var(--bd)",background:"rgba(255,255,255,.07)",color:"var(--mt)",cursor:"pointer",display:"grid",placeItems:"center",flexShrink:0}}><I n="close" s={14}/></button>
      </div>
    </G>}
    {pn==="games"&&<Pn onClose={()=>setPn(null)} title="Games" icon="gamepad" ic="var(--cy)" style={{position:"absolute",right:12,top:88,bottom:76,zIndex:22,width:"min(390px,34vw)",maxHeight:"none",background:"linear-gradient(180deg,rgba(10,13,22,.96),rgba(8,10,16,.9))",boxShadow:"0 24px 80px rgba(0,0,0,.42)"}}>
      <div style={{padding:9,borderRadius:10,border:"1px solid rgba(0,212,255,.18)",background:"rgba(0,212,255,.055)",marginBottom:9}}>
        <div style={{fontWeight:900,fontSize:".78rem"}}>VYBE game direction</div>
        <p style={{fontSize:".66rem",lineHeight:1.45,color:"var(--mt)",marginTop:3}}>Games are spark-backed. Higher-value rewards require higher stakes, and performer-control outcomes still need acceptance.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr",gap:5,overflowY:"auto",maxHeight:"calc(100% - 88px)",paddingRight:3}}>{avG.map(g=><button key={g.id} onClick={()=>{setGm(g);setPn(null)}} style={{padding:"9px 8px",borderRadius:8,border:"1px solid var(--bd)",background:"var(--cd)",textAlign:"left",cursor:"pointer"}}>
        <div style={{display:"flex",alignItems:"center",gap:3}}><I n={g.icon} s={11} c={g.color}/><span style={{fontWeight:700,fontSize:".7rem"}}>{g.name}</span></div>
        <p style={{fontSize:".6rem",color:"var(--mt)",lineHeight:1.3,marginTop:1}}>{g.desc}</p>
        <div style={{marginTop:5,fontSize:".56rem",fontWeight:900,color:"var(--am)",display:"flex",alignItems:"center",gap:2}}><I n="spark" s={8} c="var(--am)"/>{gameEconomyLine(g.type)}</div></button>)}</div></Pn>}
    {pn==="requests"&&<Pn onClose={()=>setPn(null)} title="Requests" icon="request" ic="var(--am)" style={{position:"absolute",right:12,top:88,bottom:76,zIndex:22,width:"min(390px,34vw)",maxHeight:"none",background:"linear-gradient(180deg,rgba(10,13,22,.96),rgba(8,10,16,.9))",boxShadow:"0 24px 80px rgba(0,0,0,.42)"}}>
      <div style={{padding:9,borderRadius:10,border:"1px solid rgba(255,171,0,.22)",background:"rgba(255,171,0,.06)",fontSize:".66rem",lineHeight:1.45,color:"var(--mt)",marginBottom:8}}>Requests are held in spark escrow. Performer accepts to fulfill or declines to refund.</div>
      <div style={{overflowY:"auto",maxHeight:"calc(100% - 76px)",paddingRight:3}}>{(perf.requests||[]).map((r,i)=><button key={i} onClick={()=>addReq(r)} disabled={user.sparks<r.sparks} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"8px 0",background:"none",border:"none",borderBottom:i<perf.requests.length-1?"1px solid var(--bd)":"none",cursor:user.sparks>=r.sparks?"pointer":"not-allowed",opacity:user.sparks>=r.sparks?1:.35,color:"var(--tx)",textAlign:"left"}}>
        <div><div style={{fontWeight:700,fontSize:".8rem"}}>{r.name}</div><div style={{fontSize:".66rem",color:"var(--mt)"}}>{r.desc}</div></div>
        <span style={{fontWeight:800,fontSize:".76rem",color:"var(--am)",display:"flex",alignItems:"center",gap:2,flexShrink:0}}><I n="spark" s={10} c="var(--am)"/>{r.sparks.toLocaleString()}</span></button>)}</div></Pn>}
    {gm&&<GE game={gm} sparks={user.sparks} onSpend={onSC} onClose={()=>setGm(null)} onSB={sb}/>}
    {/* Viewer avatars with badges */}
    <div style={{position:"absolute",bottom:60,left:"50%",transform:"translateX(-50%)",display:"flex",zIndex:5}}>
      {VWR.slice(0,4).map((v,i)=><div key={v.name} style={{width:18,height:18,borderRadius:"50%",background:`hsl(${i*55+200},55%,48%)`,border:"2px solid #050810",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".44rem",fontWeight:800,marginLeft:i>0?-3:0,color:"#fff"}}>{v.name[0]}</div>)}</div>
    {/* Action Bar */}
    <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:15}}>
      <div style={{display:"grid",gridTemplateColumns:"minmax(210px,1fr) auto minmax(210px,1fr)",alignItems:"center",gap:12,padding:"8px 12px",background:"linear-gradient(to top,rgba(5,8,16,.96) 68%,transparent)"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <button type="button" title={media.paused?"Resume feed":"Pause feed"} onClick={()=>setMedia(p=>({...p,paused:!p.paused}))} style={{height:36,padding:"0 10px",borderRadius:18,border:"1px solid var(--bd)",background:media.paused?"rgba(255,171,0,.16)":"rgba(255,255,255,.07)",color:"#fff",display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer",fontWeight:900,fontSize:".66rem"}}><I n={media.paused?"play":"pause"} s={13}/>{media.paused?"Resume":"Pause"}</button>
          <button type="button" title="Restart preview timer" onClick={()=>{setTm(1800);setNotif("Replay marker reset");setTimeout(()=>setNotif(null),1500)}} style={{height:36,padding:"0 10px",borderRadius:18,border:"1px solid var(--bd)",background:"rgba(255,255,255,.07)",color:"#fff",display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer",fontWeight:900,fontSize:".66rem"}}><I n="refresh" s={14}/>Replay</button>
          <span style={{color:"rgba(255,255,255,.74)",fontSize:".82rem",fontWeight:900,fontVariantNumeric:"tabular-nums"}}>{fmt(1800-tm)}</span>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:3,overflowX:"auto",maxWidth:"min(620px,48vw)",paddingBottom:1}}>
          {[{i:"gift",l:"Gift",k:"gifts"},{i:"gamepad",l:"Games",k:"games"},{i:"request",l:"Request",k:"requests"},{i:"trophy",l:"Board",k:"board"},
            {i:"bookmark",l:"Book",action:onBook},{i:"crown",l:"VIP",action:onVip},{i:"wallet",l:"Top Up",action:onWallet},
            {i:chH?"eye":"eyeoff",l:chH?"Chat":"Hide",action:()=>setChH(!chH)}].map(b=>
            <button key={b.l} onClick={()=>{if(b.action)b.action();else if(b.k)tog(b.k)}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,padding:"4px 7px",borderRadius:7,border:"1px solid "+(pn===b.k?"var(--pk)":"var(--bd)"),background:pn===b.k?"rgba(255,45,120,.06)":"var(--gl)",color:"var(--tx)",cursor:"pointer",minWidth:38,flexShrink:0}}>
              <I n={b.i} s={13}/><span style={{fontSize:".46rem",fontWeight:700,color:pn===b.k?"var(--pk)":"var(--mt)"}}>{b.l}</span></button>)}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:8,position:"relative"}}>
          <MediaButton label="Settings" active={media.settings} onClick={()=>setMedia(p=>({...p,settings:!p.settings}))}><I n="gear" s={16}/></MediaButton>
          <MediaButton label="Fullscreen"><I n="fullscreen" s={16}/></MediaButton>
          <MediaButton label={media.muted?"Unmute":"Mute"} onClick={()=>setMedia(p=>({...p,muted:!p.muted}))}><I n={media.muted?"volumeoff":"volume"} s={17}/></MediaButton>
          {media.settings&&<MediaSettings media={media} setMedia={setMedia}/>}
        </div>
      </div>
    </div></div>;}

/* ═══ AUTH — Login / Register ═══ */
function MediaButton({children,label,onClick,active=false}) {
  return <button type="button" aria-label={label} title={label} onClick={onClick} style={{width:36,height:36,borderRadius:18,border:"1px solid "+(active?"rgba(255,255,255,.24)":"var(--bd)"),background:active?"rgba(255,255,255,.16)":"rgba(255,255,255,.07)",color:"#fff",display:"grid",placeItems:"center",cursor:"pointer",boxShadow:active?"0 0 24px rgba(255,255,255,.08)":"none",flexShrink:0}}>
    {children}
  </button>;
}

function MediaSettings({media,setMedia}) {
  const row=(icon,label,value,onClick)=><button type="button" onClick={onClick} style={{display:"grid",gridTemplateColumns:"22px minmax(0,1fr) auto",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",border:"none",borderRadius:9,background:"transparent",color:"#f7f7f7",textAlign:"left",cursor:"pointer",font:"inherit",fontSize:".78rem",fontWeight:800}}>
    <I n={icon} s={16} c="rgba(255,255,255,.82)"/><span>{label}</span><span style={{color:"rgba(255,255,255,.58)",fontSize:".72rem",fontWeight:900}}>{value}</span>
  </button>;
  return <G className="ai" style={{position:"fixed",right:110,bottom:58,width:274,padding:7,borderRadius:12,background:"rgba(42,42,46,.97)",border:"1px solid rgba(255,255,255,.14)",boxShadow:"0 24px 80px rgba(0,0,0,.5)",zIndex:80}}>
    {row("cc","Show captions / CC",media.captions?"On":"C",()=>setMedia(p=>({...p,captions:!p.captions})))}
    {row("orientation","Orientation",media.layout,()=>setMedia(p=>({...p,layout:p.layout==="Theater"?"Vertical":"Theater"})))}
    {row("gear","Quality",media.quality,()=>setMedia(p=>({...p,quality:p.quality==="1080p"?"720p":p.quality==="720p"?"540p":"1080p"})))}
    {row("pip","Picture-in-picture",media.pip?"On":"P",()=>setMedia(p=>({...p,pip:!p.pip})))}
    {row("fullscreen","Switch layout",media.layout==="Theater"?"Wide":"Tall",()=>setMedia(p=>({...p,layout:p.layout==="Theater"?"Vertical":"Theater"})))}
  </G>;
}

function Auth({onAuth}){
  const [mode,setMode]=useState("login");const [role,setRole]=useState("viewer");
  const [form,setForm]=useState({email:"",pass:"",name:"",confirm:"",agree:false});
  const [err,setErr]=useState("");const [show,setShow]=useState(false);
  const f=form;const uf=(k,v)=>setForm(p=>({...p,[k]:v}));
  const passStrength=(p)=>{let s=0;if(p.length>=8)s++;if(p.length>=12)s++;if(/[A-Z]/.test(p))s++;if(/[0-9]/.test(p))s++;if(/[^A-Za-z0-9]/.test(p))s++;return s};
  const ps=passStrength(f.pass);const pColors=["var(--pk)","var(--pk)","var(--am)","var(--lm)","var(--gn)"];

  const submit=()=>{
    setErr("");
    if(!f.email||!f.email.includes("@"))return setErr("Valid email required");
    if(f.pass.length<8)return setErr("Password must be 8+ characters");
    if(mode==="register"){
      if(!f.name.trim())return setErr("Display name required");
      if(f.pass!==f.confirm)return setErr("Passwords don't match");
      if(ps<3)return setErr("Password too weak — add uppercase, numbers, or symbols");
      if(!f.agree)return setErr("You must agree to Terms and confirm you are 18+");
    }
    onAuth({email:f.email,name:f.name||f.email.split("@")[0],role});
  };

  const inp=(label,key,type="text")=><div style={{marginBottom:10}}>
    <label style={{fontSize:".7rem",fontWeight:600,color:"var(--mt)",display:"block",marginBottom:3}}>{label}</label>
    <div style={{position:"relative"}}>
      <input type={key==="pass"||key==="confirm"?(show?"text":"password"):type} value={f[key]} onChange={e=>uf(key,e.target.value)}
        style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid var(--bd)",background:"var(--cd)",color:"var(--tx)",fontSize:".85rem",outline:"none"}}
        onFocus={e=>e.target.style.borderColor="var(--cy)"} onBlur={e=>e.target.style.borderColor="var(--bd)"}/>
      {(key==="pass"||key==="confirm")&&<button onClick={()=>setShow(!show)} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--mt)"}}><I n={show?"eye":"eyeoff"} s={14}/></button>}
    </div>
    {key==="pass"&&f.pass.length>0&&<div style={{display:"flex",gap:2,marginTop:4}}>{[0,1,2,3,4].map(i=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<ps?pColors[ps-1]:"var(--bd)"}}/>)}</div>}
  </div>;

  return<div style={{position:"fixed",inset:0,zIndex:998,display:"flex",alignItems:"center",justifyContent:"center",background:"radial-gradient(ellipse at 30% 20%,rgba(255,45,120,.06),transparent 55%),var(--bg)"}}>
    <div style={{maxWidth:420,width:"92%",padding:"32px 28px",background:"var(--sf)",border:"1px solid var(--bh)",borderRadius:16,boxShadow:"0 40px 80px rgba(0,0,0,.5)"}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{width:40,height:40,borderRadius:10,background:"linear-gradient(135deg,var(--pk),var(--am),var(--lm))",display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:".8rem",color:"#000",marginBottom:8}}>VB</div>
        <h1 style={{fontSize:"1.5rem",fontWeight:900}}>{mode==="login"?"Welcome Back":"Create Account"}</h1>
        <p style={{fontSize:".78rem",color:"var(--mt)",marginTop:2}}>You are known here.</p>
      </div>
      {/* Role toggle */}
      <div style={{display:"flex",borderRadius:8,border:"1px solid var(--bd)",marginBottom:16,overflow:"hidden"}}>
        {["viewer","performer"].map(r=><button key={r} onClick={()=>setRole(r)} style={{flex:1,padding:"8px 0",border:"none",background:role===r?"var(--pk)":"var(--cd)",color:role===r?"#fff":"var(--mt)",fontWeight:700,fontSize:".78rem",cursor:"pointer",textTransform:"capitalize"}}>{r}</button>)}
      </div>
      {mode==="register"&&inp("Display Name","name")}
      {inp("Email","email","email")}
      {inp(mode==="register"?"Create Password":"Password","pass","password")}
      {mode==="register"&&inp("Confirm Password","confirm","password")}
      {mode==="register"&&<label style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:12,cursor:"pointer"}}>
        <input type="checkbox" checked={f.agree} onChange={e=>uf("agree",e.target.checked)} style={{marginTop:3,accentColor:"var(--pk)"}}/>
        <span style={{fontSize:".72rem",color:"var(--mt)",lineHeight:1.4}}>I am 18+ years of age, agree to the <a href="#" style={{color:"var(--cy)"}}>Terms of Service</a>, <a href="#" style={{color:"var(--cy)"}}>Privacy Policy</a>, and acknowledge the <a href="#" style={{color:"var(--cy)"}}>18 USC §2257</a> compliance requirements.</span>
      </label>}
      {err&&<div style={{padding:8,borderRadius:6,background:"rgba(255,45,120,.08)",border:"1px solid rgba(255,45,120,.2)",fontSize:".76rem",color:"var(--pk)",marginBottom:10}}><I n="lock" s={12} c="var(--pk)" st={{marginRight:4}}/>{err}</div>}
      <Btn full primary onClick={submit}>{mode==="login"?"Sign In":"Create Account"}</Btn>
      <div style={{textAlign:"center",marginTop:12}}>
        <button onClick={()=>{setMode(mode==="login"?"register":"login");setErr("")}} style={{background:"none",border:"none",color:"var(--cy)",fontSize:".78rem",cursor:"pointer",fontWeight:600}}>
          {mode==="login"?"Don't have an account? Sign up":"Already have an account? Sign in"}</button>
      </div>
      <div style={{marginTop:16,padding:10,borderTop:"1px solid var(--bd)",fontSize:".6rem",color:"var(--mt)",lineHeight:1.5,textAlign:"center"}}>
        <I n="shield" s={10} c="var(--gn)" st={{marginRight:3}}/>Passwords are hashed with bcrypt. Sessions use httpOnly secure cookies. All connections are TLS 1.3 encrypted. We never store raw credentials.
      </div>
    </div></div>;
}

/* ═══ PERFORMER STUDIO ═══ */
function PerfDash({perfData,onGoLive,onLogout}){
  const [tab,setTab]=useState("home");const [newPost,setNewPost]=useState("");const [msgTo,setMsgTo]=useState(null);const [msgText,setMsgText]=useState("");
  const p=perfData;const earn={today:Math.floor(Math.random()*800+400),pending:2847};
  const fans=[{name:"VelvetKing",lv:34,sparks:8400,sessions:42,msg:"Can't wait for tonight",time:"2m",online:true},
    {name:"DiamondJay",lv:28,sparks:5200,sessions:28,msg:"That last session was incredible",time:"18m",online:true},
    {name:"AceHigh",lv:22,sparks:3100,sessions:19,msg:"When's the next King of the Hill?",time:"1h",online:false},
    {name:"NightOwl",lv:15,sparks:1800,sessions:12,msg:"Just subscribed!",time:"3h",online:false},
    {name:"xShadowx",lv:11,sparks:920,sessions:6,msg:"Your dare ladder game is addictive",time:"5h",online:false}];
  const content=[{type:"post",text:"Tonight's theme: confessions. Come ready.",time:"2h",likes:84,comments:12},
    {type:"photo",text:"New set — subscribers only",time:"1d",likes:312,comments:47,price:50,locked:true},
    {type:"video",text:"Behind the scenes from last week's marathon",time:"3d",likes:189,comments:23,price:100,locked:true},
    {type:"post",text:"5-game win streak last night. Who's next?",time:"5d",likes:156,comments:31}];
  const tabs=[{id:"home",label:"Home",icon:"live"},{id:"content",label:"Content",icon:"eye"},{id:"inbox",label:"Inbox",icon:"chat"},{id:"store",label:"Store",icon:"gift"},{id:"analytics",label:"Analytics",icon:"trophy"},{id:"settings",label:"Settings",icon:"gear"}];

  return <CreatorCenter p={p} earn={earn} fans={fans} content={content} tab={tab} setTab={setTab} onGoLive={onGoLive} onLogout={onLogout}/>;

  return<div style={{minHeight:"100vh",background:"var(--bg)",display:"flex"}}>
    {/* Sidebar */}
    <div style={{width:220,borderRight:"1px solid var(--bd)",padding:"16px 12px",display:"flex",flexDirection:"column",flexShrink:0,background:"var(--sf)"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
        <div style={{width:36,height:36,borderRadius:10,background:`${p.accent}30`,border:"2px solid "+p.accent,display:"flex",alignItems:"center",justifyContent:"center"}}><I n="user" s={18} c={p.accent}/></div>
        <div><div style={{fontWeight:800,fontSize:".88rem"}}>{p.name}</div><div style={{fontSize:".6rem",color:"var(--gn)",display:"flex",alignItems:"center",gap:3}}><span style={{width:6,height:6,borderRadius:"50%",background:"var(--gn)"}}/>Online</div></div>
      </div>
      <Btn full primary onClick={onGoLive} style={{marginBottom:16}}><I n="live" s={14} c="#fff" st={{marginRight:4}}/>Go Live</Btn>
      {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 10px",borderRadius:8,border:"none",background:tab===t.id?"rgba(255,45,120,.08)":"none",color:tab===t.id?"var(--pk)":"var(--mt)",cursor:"pointer",fontWeight:600,fontSize:".8rem",marginBottom:2,textAlign:"left"}}>
        <I n={t.icon} s={14} c={tab===t.id?"var(--pk)":"var(--mt)"}/>{t.label}
        {t.id==="inbox"&&<span style={{marginLeft:"auto",width:18,height:18,borderRadius:9,background:"var(--pk)",color:"#fff",fontSize:".55rem",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>3</span>}
      </button>)}
      <div style={{marginTop:"auto",padding:8,borderTop:"1px solid var(--bd)"}}>
        <div style={{fontSize:".65rem",color:"var(--mt)",marginBottom:6}}>Today's Earnings</div>
        <div style={{fontWeight:900,fontSize:"1.3rem",color:"var(--gn)"}}>${earn.today}</div>
        <div style={{fontSize:".6rem",color:"var(--mt)",marginTop:2}}>Pending: ${earn.pending.toLocaleString()}</div>
        <button onClick={onLogout} style={{display:"flex",alignItems:"center",gap:4,marginTop:10,background:"none",border:"none",color:"var(--mt)",cursor:"pointer",fontSize:".72rem"}}>
          <I n="back" s={12} c="var(--mt)"/>Sign Out</button>
      </div>
    </div>

    {/* Main Area */}
    <div style={{flex:1,padding:"20px 28px",overflowY:"auto",maxHeight:"100vh"}}>
      {/* HOME */}
      {tab==="home"&&<div>
        <h1 style={{fontSize:"1.5rem",fontWeight:900,marginBottom:4}}>Welcome back, {p.name.split(" ")[0]}</h1>
        <p style={{color:"var(--mt)",fontSize:".85rem",marginBottom:20}}>{p.viewers} viewers waiting. {fans.filter(f=>f.online).length} top fans online right now.</p>
        {/* Quick stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
          {[{l:"Earned Today",v:`$${earn.today}`,c:"var(--gn)",i:"spark"},{l:"Live Viewers",v:p.viewers,c:"var(--cy)",i:"users"},{l:"Subscribers",v:p.stats.followers.toLocaleString(),c:"var(--am)",i:"star"},{l:"Rating",v:p.rating,c:"var(--am)",i:"trophy"}].map(s=>
            <div key={s.l} style={{padding:14,borderRadius:12,border:"1px solid var(--bd)",background:"var(--cd)"}}>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}><I n={s.i} s={16} c={s.c}/><span style={{fontSize:".68rem",color:"var(--mt)"}}>{s.l}</span></div>
              <div style={{fontWeight:900,fontSize:"1.4rem",color:s.c}}>{s.v}</div></div>)}
        </div>
        {/* Quick post */}
        <div style={{padding:16,borderRadius:12,border:"1px solid var(--bd)",background:"var(--cd)",marginBottom:16}}>
          <div style={{display:"flex",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:`${p.accent}20`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><I n="user" s={18} c={p.accent}/></div>
            <div style={{flex:1}}>
              <input type="text" value={newPost} onChange={e=>setNewPost(e.target.value)} placeholder="Post an update to your fans..." style={{marginBottom:8,fontSize:".85rem"}}/>
              <div style={{display:"flex",gap:6}}>
                <Btn small style={{border:"1px solid var(--bd)",color:"var(--mt)"}}><I n="eye" s={11} c="var(--mt)" st={{marginRight:3}}/>Photo</Btn>
                <Btn small style={{border:"1px solid var(--bd)",color:"var(--mt)"}}><I n="live" s={11} c="var(--mt)" st={{marginRight:3}}/>Video</Btn>
                <Btn small style={{border:"1px solid var(--bd)",color:"var(--mt)"}}><I n="lock" s={11} c="var(--am)" st={{marginRight:3}}/>Paid</Btn>
                <Btn small primary onClick={()=>setNewPost("")} style={{marginLeft:"auto"}}>Post</Btn>
              </div></div>
          </div></div>
        {/* Top fans online */}
        <div style={{padding:16,borderRadius:12,border:"1px solid var(--bd)",background:"var(--cd)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><Kk>Your Top Fans</Kk><span style={{fontSize:".68rem",color:"var(--cy)"}}>{fans.filter(f=>f.online).length} online</span></div>
          {fans.slice(0,4).map((f,i)=><div key={f.name} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<3?"1px solid var(--bd)":"none"}}>
            <div style={{position:"relative"}}>
              <div style={{width:32,height:32,borderRadius:8,background:`hsl(${i*55+200},55%,48%)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:".6rem",color:"#fff"}}>{f.name[0]}</div>
              {f.online&&<div style={{position:"absolute",bottom:-1,right:-1,width:10,height:10,borderRadius:5,background:"var(--gn)",border:"2px solid var(--sf)"}}/>}
            </div>
            <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:".82rem"}}>{f.name} <span style={{fontSize:".62rem",color:"var(--mt)"}}>Lv.{f.lv}</span></div>
              <div style={{fontSize:".68rem",color:"var(--mt)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.msg}</div></div>
            <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:".72rem",fontWeight:700,color:"var(--am)"}}>{f.sparks.toLocaleString()}<I n="spark" s={9} c="var(--am)" st={{marginLeft:2}}/></div>
              <div style={{fontSize:".58rem",color:"var(--mt)"}}>{f.sessions} sessions</div></div>
          </div>)}
        </div>
      </div>}

      {/* CONTENT STUDIO */}
      {tab==="content"&&<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div><h2 style={{fontSize:"1.3rem",fontWeight:900}}>Content Studio</h2><p style={{fontSize:".78rem",color:"var(--mt)"}}>Upload photos, videos, and updates. Set prices for premium content.</p></div>
          <Btn primary><I n="plus" s={13} c="#fff" st={{marginRight:3}}/>New Upload</Btn>
        </div>
        {/* Content feed */}
        {content.map((c,i)=><div key={i} style={{padding:16,borderRadius:12,border:"1px solid var(--bd)",background:"var(--cd)",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <div style={{width:28,height:28,borderRadius:7,background:`${p.accent}20`,display:"flex",alignItems:"center",justifyContent:"center"}}><I n="user" s={14} c={p.accent}/></div>
            <div style={{flex:1}}><span style={{fontWeight:700,fontSize:".82rem"}}>{p.name}</span><span style={{fontSize:".65rem",color:"var(--mt)",marginLeft:6}}>{c.time} ago</span></div>
            {c.locked&&<Tag color="var(--am)"><I n="lock" s={8} c="var(--am)"/> {c.price} sparks</Tag>}
            {c.type!=="post"&&<Tag color="var(--cy)">{c.type}</Tag>}
          </div>
          {c.type!=="post"&&<div style={{height:140,borderRadius:8,background:"linear-gradient(135deg,rgba(255,45,120,.06),rgba(0,212,255,.04))",border:"1px solid var(--bd)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}>
            <I n={c.type==="photo"?"eye":"live"} s={32} c="var(--mt)"/></div>}
          <p style={{fontSize:".88rem",lineHeight:1.6}}>{c.text}</p>
          <div style={{display:"flex",gap:12,marginTop:8,fontSize:".72rem",color:"var(--mt)"}}>
            <span><I n="star" s={10} c="var(--mt)" st={{marginRight:3}}/>{c.likes} likes</span>
            <span><I n="chat" s={10} c="var(--mt)" st={{marginRight:3}}/>{c.comments} comments</span>
            <button style={{marginLeft:"auto",background:"none",border:"none",color:"var(--mt)",cursor:"pointer",fontSize:".72rem"}}>Edit</button>
          </div></div>)}
      </div>}

      {/* INBOX */}
      {tab==="inbox"&&<div>
        <h2 style={{fontSize:"1.3rem",fontWeight:900,marginBottom:4}}>Inbox</h2>
        <p style={{fontSize:".78rem",color:"var(--mt)",marginBottom:16}}>Messages from subscribers. Non-subscribers cannot DM you.</p>
        <div style={{display:"grid",gridTemplateColumns:msgTo?"1fr 1fr":"1fr",gap:12}}>
          <div>
            {fans.map((f,i)=><button key={f.name} onClick={()=>setMsgTo(f)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:12,borderRadius:10,border:msgTo?.name===f.name?"1px solid var(--pk)":"1px solid var(--bd)",background:msgTo?.name===f.name?"rgba(255,45,120,.04)":"var(--cd)",cursor:"pointer",textAlign:"left",marginBottom:4}}>
              <div style={{position:"relative"}}>
                <div style={{width:36,height:36,borderRadius:9,background:`hsl(${i*55+200},55%,48%)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:".65rem",color:"#fff"}}>{f.name[0]}</div>
                {f.online&&<div style={{position:"absolute",bottom:-1,right:-1,width:10,height:10,borderRadius:5,background:"var(--gn)",border:"2px solid var(--cd)"}}/>}</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:".82rem"}}>{f.name}</div>
                <div style={{fontSize:".68rem",color:"var(--mt)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.msg}</div></div>
              <span style={{fontSize:".6rem",color:"var(--mt)",flexShrink:0}}>{f.time}</span>
            </button>)}
          </div>
          {msgTo&&<div style={{padding:16,borderRadius:12,border:"1px solid var(--bd)",background:"var(--cd)"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,paddingBottom:8,borderBottom:"1px solid var(--bd)"}}>
              <div style={{width:32,height:32,borderRadius:8,background:"var(--vi)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:".6rem",color:"#fff"}}>{msgTo.name[0]}</div>
              <div><div style={{fontWeight:700,fontSize:".85rem"}}>{msgTo.name}</div>
                <div style={{fontSize:".62rem",color:"var(--mt)"}}>Lv.{msgTo.lv} · {msgTo.sessions} sessions · {msgTo.sparks.toLocaleString()} sparks</div></div>
            </div>
            <div style={{minHeight:200,marginBottom:10}}>
              <div style={{padding:8,borderRadius:8,background:"rgba(0,212,255,.04)",maxWidth:"80%",marginBottom:6}}><p style={{fontSize:".82rem"}}>{msgTo.msg}</p><span style={{fontSize:".55rem",color:"var(--mt)"}}>{msgTo.time} ago</span></div>
            </div>
            <div style={{display:"flex",gap:4}}>
              <input type="text" value={msgText} onChange={e=>setMsgText(e.target.value)} placeholder={`Reply to ${msgTo.name}...`} style={{flex:1,fontSize:".82rem"}}/>
              <Btn small primary onClick={()=>setMsgText("")}>Send</Btn>
            </div></div>}
        </div>
      </div>}

      {/* STORE */}
      {tab==="store"&&<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div><h2 style={{fontSize:"1.3rem",fontWeight:900}}>Your Store</h2><p style={{fontSize:".78rem",color:"var(--mt)"}}>Sell premium content, custom sets, and merch. You set every price.</p></div>
          <Btn primary><I n="plus" s={13} c="#fff" st={{marginRight:3}}/>Add Item</Btn>
        </div>
        <Kk>Request Menu — Your Custom Experiences</Kk>
        <div style={{marginBottom:16}}>{p.requests.map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderRadius:10,border:"1px solid var(--bd)",background:"var(--cd)",marginBottom:4}}>
          <div><div style={{fontWeight:700,fontSize:".85rem"}}>{r.name}</div><div style={{fontSize:".7rem",color:"var(--mt)"}}>{r.desc}</div></div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontWeight:800,color:"var(--am)",display:"flex",alignItems:"center",gap:2}}><I n="spark" s={12} c="var(--am)"/>{r.sparks.toLocaleString()}</span>
            <Btn small style={{border:"1px solid var(--bd)",color:"var(--mt)"}}>Edit</Btn></div></div>)}</div>
        <Kk>Premium Content</Kk>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8,marginBottom:16}}>
          {[{name:"Exclusive Set — Beach",price:200,sales:47,type:"photo"},{name:"Behind the Scenes",price:100,sales:89,type:"video"},{name:"Custom Voice Note",price:75,sales:124,type:"audio"}].map((item,i)=>
            <div key={i} style={{padding:14,borderRadius:10,border:"1px solid var(--bd)",background:"var(--cd)"}}>
              <div style={{height:80,borderRadius:6,background:"linear-gradient(135deg,rgba(255,45,120,.05),rgba(0,212,255,.03))",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:6}}><I n={item.type==="photo"?"eye":item.type==="video"?"live":"chat"} s={24} c="var(--mt)"/></div>
              <div style={{fontWeight:700,fontSize:".8rem"}}>{item.name}</div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:".7rem"}}>
                <span style={{color:"var(--am)",fontWeight:700}}><I n="spark" s={9} c="var(--am)"/> {item.price}</span>
                <span style={{color:"var(--mt)"}}>{item.sales} sold</span></div></div>)}
        </div>
        <Kk>Merch</Kk>
        <div style={{padding:16,borderRadius:10,border:"1px dashed var(--bd)",background:"var(--cd)",textAlign:"center"}}>
          <I n="gift" s={28} c="var(--mt)"/><p style={{color:"var(--mt)",fontSize:".8rem",marginTop:6}}>Connect a merch provider (Spring, Fourthwall) to sell physical products.</p>
          <Btn small style={{marginTop:8,border:"1px solid var(--bd)",color:"var(--mt)"}}>Connect Store</Btn></div>
      </div>}

      {/* ANALYTICS */}
      {tab==="analytics"&&<div>
        <h2 style={{fontSize:"1.3rem",fontWeight:900,marginBottom:4}}>Analytics</h2>
        <p style={{fontSize:".78rem",color:"var(--mt)",marginBottom:16}}>Understand your audience. Optimize your schedule.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
          {[{l:"This Week",v:`$${Math.floor(earn.today*5.2)}`},{l:"This Month",v:`$${Math.floor(earn.today*18)}`},{l:"All Time",v:`$${Math.floor(earn.today*180)}`}].map(s=>
            <div key={s.l} style={{padding:16,borderRadius:12,border:"1px solid var(--bd)",background:"var(--cd)",textAlign:"center"}}>
              <div style={{fontSize:".65rem",color:"var(--mt)",textTransform:"uppercase",fontWeight:600}}>{s.l}</div>
              <div style={{fontWeight:900,fontSize:"1.4rem",color:"var(--gn)",marginTop:4}}>{s.v}</div></div>)}
        </div>
        <div style={{padding:16,borderRadius:12,border:"1px solid var(--bd)",background:"var(--cd)",marginBottom:16}}>
          <Kk>Revenue Sources</Kk>
          {[{src:"Tips & Gifts",pct:38,c:"var(--pk)"},{src:"Private Sessions",pct:26,c:"var(--cy)"},{src:"Requests",pct:20,c:"var(--am)"},{src:"Subscriptions",pct:10,c:"var(--lm)"},{src:"Content Sales",pct:6,c:"var(--vi)"}].map(r=>
            <div key={r.src} style={{marginBottom:6}}><div style={{display:"flex",justifyContent:"space-between",fontSize:".76rem",marginBottom:2}}><span style={{fontWeight:600}}>{r.src}</span><span style={{fontWeight:700,color:r.c}}>{r.pct}%</span></div>
              <div style={{height:5,borderRadius:999,background:"var(--bd)"}}><div style={{height:"100%",borderRadius:"inherit",width:`${r.pct}%`,background:r.c}}/></div></div>)}
        </div>
        <div style={{padding:16,borderRadius:12,border:"1px solid var(--bd)",background:"var(--cd)"}}>
          <Kk>Best Performing Games</Kk>
          {[{game:"Tease Trivia",rev:"$1,240",sessions:89},{game:"Dare Ladder",rev:"$980",sessions:67},{game:"All-In Jackpot",rev:"$870",sessions:45}].map((g,i)=>
            <div key={g.game} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<2?"1px solid var(--bd)":"none"}}>
              <span style={{fontWeight:700,fontSize:".82rem"}}>{g.game}</span>
              <div style={{display:"flex",gap:12,fontSize:".76rem",color:"var(--mt)"}}><span style={{color:"var(--gn)",fontWeight:700}}>{g.rev}</span><span>{g.sessions} sessions</span></div></div>)}
        </div>
      </div>}

      {/* SETTINGS */}
      {tab==="settings"&&<div>
        <h2 style={{fontSize:"1.3rem",fontWeight:900,marginBottom:16}}>Settings</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={{padding:16,borderRadius:12,border:"1px solid var(--bd)",background:"var(--cd)"}}>
            <Kk>Subscription Price</Kk>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontWeight:900,fontSize:"1.3rem",color:"var(--am)"}}>${p.sub.price}/mo</span>
              <Btn small style={{border:"1px solid var(--bd)",color:"var(--mt)"}}>Change</Btn></div>
            {p.sub.trial>0&&<div style={{fontSize:".72rem",color:"var(--cy)"}}>Trial: {p.sub.trial} days free</div>}
            <p style={{fontSize:".68rem",color:"var(--mt)",marginTop:6}}>You set the price. Change anytime.</p>
          </div>
          <div style={{padding:16,borderRadius:12,border:"1px solid var(--bd)",background:"var(--cd)"}}>
            <Kk>Payout</Kk>
            <div style={{fontSize:".82rem",fontWeight:700,marginBottom:4}}>Every 2 weeks via CCBill</div>
            <div style={{fontSize:".72rem",color:"var(--mt)"}}>Minimum: $50 · Next payout: June 1</div>
            <Btn small style={{marginTop:8,border:"1px solid var(--bd)",color:"var(--mt)"}}>Manage</Btn>
          </div>
          <div style={{padding:16,borderRadius:12,border:"1px solid var(--bd)",background:"var(--cd)"}}>
            <Kk>Security</Kk>
            {[{l:"2FA",v:"Enabled",c:"var(--gn)"},{l:"Login Alerts",v:"On",c:"var(--gn)"},{l:"Sessions",v:"2 active",c:"var(--cy)"}].map(s=>
              <div key={s.l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:".78rem"}}><span>{s.l}</span><span style={{color:s.c,fontWeight:700}}>{s.v}</span></div>)}
          </div>
          <div style={{padding:16,borderRadius:12,border:"1px solid var(--bd)",background:"var(--cd)"}}>
            <Kk>Game Modes</Kk>
            <p style={{fontSize:".72rem",color:"var(--mt)",marginBottom:6}}>{GAMES.filter(g=>p.caps.games.includes(g.id)).length} active</p>
            <Btn small style={{border:"1px solid var(--bd)",color:"var(--mt)"}}>Manage Games</Btn>
          </div>
        </div>
        <div style={{padding:16,borderRadius:12,border:"1px solid var(--bd)",background:"var(--cd)",marginTop:12}}>
          <Kk>Schedule</Kk>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{p.schedule.map((s,i)=><div key={i} style={{padding:"6px 14px",borderRadius:8,border:"1px solid var(--bd)",fontSize:".82rem"}}><span style={{fontWeight:700}}>{s.day}</span> <span style={{color:"var(--mt)"}}>{s.time}</span></div>)}</div>
          <Btn small style={{marginTop:8,border:"1px solid var(--bd)",color:"var(--mt)"}}>Edit Schedule</Btn>
        </div>
      </div>}
    </div></div>;}

/* ═══ MAIN APP ═══ */
function CreatorCenter({p,earn,fans,content,tab,setTab,onGoLive,onLogout}) {
  const modules=[
    {id:"home",label:"Command",icon:"live",tone:"#d6b15e"},
    {id:"analytics",label:"Signals",icon:"trophy",tone:"#58d7c4"},
    {id:"content",label:"Vault",icon:"eye",tone:"#b98cff"},
    {id:"inbox",label:"Patrons",icon:"users",tone:"#ff8aa8"},
    {id:"store",label:"Offers",icon:"gift",tone:"#ffbd66"},
    {id:"settings",label:"Room",icon:"user",tone:"#8fb5ff"},
  ];
  const active=modules.find(m=>m.id===tab)||modules[0];
  const compact=typeof window!=="undefined"&&window.innerWidth<900;
  const ink="#f6efe5",soft="rgba(246,239,229,.62)",dim="rgba(246,239,229,.38)",line="rgba(246,239,229,.09)";
  const panel={border:`1px solid ${line}`,background:"linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.032))",borderRadius:10,boxShadow:"0 24px 70px rgba(0,0,0,.26)"};
  const label={fontSize:".62rem",fontWeight:900,letterSpacing:".13em",textTransform:"uppercase",color:dim};
  const copy={fontSize:".72rem",lineHeight:1.55,color:soft};
  const title={home:"Session Command",analytics:"Signal Map",content:"Asset Vault",inbox:"Patron Intelligence",store:"Offer Architect",settings:"Room Identity"}[tab]||"Session Command";
  const subtitle={home:"Prepare the room, read audience pressure, and launch with every operational risk visible.",analytics:"A VYBE-native read on retention, spend velocity, and room heat.",content:"Clips, drops, subscriber previews, and paid media staged from one clean vault.",inbox:"Known patrons, intent, loyalty, limits, and relationship history.",store:"Design requests, rewards, bundles, and timed premium offers without clutter.",settings:"Shape the public room promise, entry card, and compliance posture."}[tab];
  const topFans=fans.slice(0,4);
  const bars=[46,62,38,76,57,84,68,92,74,88,63,79];
  const Empty=({icon,title,body})=><div style={{minHeight:180,display:"grid",placeItems:"center",textAlign:"center",color:soft}}><div><I n={icon} s={30} c="rgba(246,239,229,.22)"/><div style={{fontWeight:900,fontSize:".82rem",marginTop:10,color:ink}}>{title}</div><div style={{...copy,maxWidth:280,margin:"5px auto 0"}}>{body}</div></div></div>;
  const Stat=({k,v,sub,tone=active.tone})=><div style={{...panel,padding:compact?10:14,minHeight:compact?78:92}}><div style={{...label,color:dim,fontSize:compact?".55rem":label.fontSize}}>{k}</div><div style={{fontSize:compact?"1.05rem":"1.45rem",fontWeight:1000,marginTop:compact?7:9,color:tone,lineHeight:1}}>{v}</div><div style={{...copy,fontSize:compact?".56rem":".64rem",marginTop:6}}>{sub}</div></div>;
  const HeaderCard=()=> <section style={{...panel,padding:compact?14:18,display:"grid",gridTemplateColumns:compact?"1fr":"minmax(0,1fr) auto",gap:compact?14:18,alignItems:"center",background:"linear-gradient(135deg,rgba(214,177,94,.12),rgba(88,215,196,.04) 42%,rgba(255,138,168,.055))"}}>
    <div>
      <div style={label}>Tonight's runway</div>
      <h2 style={{fontSize:compact?"1.1rem":"1.6rem",fontWeight:1000,lineHeight:1.08,marginTop:8}}>Private-room energy with games, gifting, and subscriber moments.</h2>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}>
        {["Age gate clear","Menu synced","Gift effects restrained","Payout guard active"].map((x,i)=><span key={x} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 9px",borderRadius:999,border:`1px solid ${line}`,background:i===0?"rgba(88,215,196,.1)":"rgba(255,255,255,.035)",fontSize:".64rem",fontWeight:900,color:i===0?"#8af0df":soft}}><span style={{width:6,height:6,borderRadius:6,background:i===0?"#58d7c4":"rgba(246,239,229,.42)"}}/>{x}</span>)}
      </div>
    </div>
    <button type="button" onClick={onGoLive} style={{height:46,width:compact?"100%":"auto",padding:"0 18px",border:0,borderRadius:9,background:"linear-gradient(135deg,#d6b15e,#ff8aa8)",color:"#17110d",font:"inherit",fontWeight:1000,cursor:"pointer",boxShadow:"0 18px 44px rgba(214,177,94,.18)"}}><I n="live" s={14} c="#17110d" st={{marginRight:7}}/>Go Live</button>
  </section>;
  const Readiness=()=> <section style={{...panel,padding:18}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}><div><div style={label}>Room readiness</div><div style={{fontSize:".82rem",fontWeight:900,marginTop:5}}>Launch quality</div></div><div style={{width:74,height:74,borderRadius:"50%",display:"grid",placeItems:"center",background:"conic-gradient(#58d7c4 0 78%,rgba(255,255,255,.08) 78% 100%)"}}><div style={{width:56,height:56,borderRadius:"50%",background:"#101019",display:"grid",placeItems:"center",fontWeight:1000}}>78%</div></div></div>
    <div style={{marginTop:16,display:"grid",gap:8}}>{["Camera framing reviewed","Intro card needs final copy","Three premium gifts tested","Subscriber queue warmed"].map((x,i)=><div key={x} style={{display:"grid",gridTemplateColumns:"16px minmax(0,1fr) auto",gap:9,alignItems:"center",fontSize:".72rem",color:i===1?"#ffbd66":soft}}><span style={{width:8,height:8,borderRadius:8,background:i===1?"#ffbd66":"#58d7c4"}}/><span>{x}</span><span style={{fontWeight:900,color:dim}}>{i===1?"OPEN":"OK"}</span></div>)}</div>
  </section>;
  const SparkLine=()=> <section style={{...panel,padding:18,minHeight:230}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div><div style={label}>Room heat</div><div style={{fontWeight:1000,marginTop:5}}>Spend velocity rising</div></div><div style={{fontSize:".72rem",fontWeight:1000,color:"#58d7c4"}}>+18%</div></div>
    <div style={{height:130,display:"flex",alignItems:"end",gap:7}}>{bars.map((h,i)=><div key={i} style={{height:h+"%",flex:1,borderRadius:5,background:i>7?"linear-gradient(180deg,#ff8aa8,#d6b15e)":"rgba(246,239,229,.12)"}}/>)}</div>
    <div style={{display:"flex",justifyContent:"space-between",marginTop:12,...copy,fontSize:".64rem"}}><span>pre-show</span><span>first gift</span><span>storm window</span></div>
  </section>;
  const PatronList=()=> <section style={{...panel,padding:18}}>
    <div style={label}>Known patrons live now</div>
    <div style={{marginTop:13,display:"grid",gap:10}}>{topFans.map((fan,i)=><div key={fan.name} style={{display:"grid",gridTemplateColumns:"32px minmax(0,1fr) auto",gap:10,alignItems:"center"}}>
      <div style={{width:32,height:32,borderRadius:9,background:`linear-gradient(135deg,hsl(${210+i*42},52%,42%),rgba(255,255,255,.12))`,display:"grid",placeItems:"center",fontWeight:1000,fontSize:".68rem"}}>{fan.name[0]}</div>
      <div style={{minWidth:0}}><div style={{fontWeight:900,fontSize:".78rem"}}>{fan.name}</div><div style={{...copy,fontSize:".64rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{fan.msg}</div></div>
      <div style={{fontSize:".72rem",fontWeight:1000,color:"#ffbd66"}}>{fan.sparks.toLocaleString()}</div>
    </div>)}</div>
  </section>;
  const RoomCard=()=> <section style={{...panel,padding:18,background:"radial-gradient(circle at 20% 5%,rgba(255,138,168,.13),transparent 32%),linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.03))"}}>
    <div style={label}>Public room card</div>
    <div style={{marginTop:14,height:178,borderRadius:10,overflow:"hidden",border:`1px solid ${line}`,position:"relative",background:`linear-gradient(145deg,${p.accent}33,rgba(15,18,28,.95) 48%,rgba(214,177,94,.12))`}}>
      <div style={{position:"absolute",left:16,bottom:16,right:16}}><div style={{fontSize:"1rem",fontWeight:1000}}>{p.name}</div><div style={{...copy,color:"rgba(255,255,255,.78)",marginTop:6,maxWidth:330}}>Luxury private-room energy with live games, clean gifting, and subscriber-only moments.</div></div>
      <div style={{position:"absolute",top:14,right:14,padding:"5px 8px",borderRadius:999,background:"rgba(0,0,0,.38)",fontSize:".62rem",fontWeight:1000}}>Preview</div>
    </div>
  </section>;
  const Analytics=()=> <div style={{display:"grid",gridTemplateColumns:compact?"1fr":"repeat(4,1fr)",gap:14}}>
    <Stat k="Average watch" v="18m" sub="session depth" tone="#58d7c4"/><Stat k="Gift conversion" v="11.4%" sub="viewers to senders" tone="#d6b15e"/><Stat k="Return intent" v="64%" sub="saved or followed" tone="#ff8aa8"/><Stat k="Requests" v="27" sub="tonight's menu taps" tone="#b98cff"/>
    <div style={{gridColumn:compact?"auto":"1 / 4"}}><SparkLine/></div><section style={{...panel,padding:18}}><div style={label}>Friction alerts</div><div style={{marginTop:14,...copy}}>No payment, stream, or age-gate incidents in the current preview. Mobile safe-area pass is still needed before launch.</div></section>
  </div>;
  const Vault=()=> <div style={{display:"grid",gridTemplateColumns:compact?"1fr":"1.2fr .8fr",gap:14}}>
    <section style={{...panel,padding:18}}><div style={label}>Staged media</div><div style={{display:"grid",gridTemplateColumns:compact?"1fr":"repeat(3,1fr)",gap:10,marginTop:14}}>{content.slice(0,3).map((c,i)=><div key={c.text} style={{minHeight:142,borderRadius:9,border:`1px solid ${line}`,background:`linear-gradient(140deg,rgba(255,255,255,.08),rgba(255,255,255,.025)),linear-gradient(135deg,${[p.accent,"#b98cff","#d6b15e"][i]}33,transparent)`,padding:12,display:"flex",flexDirection:"column",justifyContent:"end"}}><div style={{fontWeight:900,fontSize:".76rem"}}>{c.type.toUpperCase()}</div><div style={{...copy,fontSize:".63rem",marginTop:4}}>{c.text}</div></div>)}</div></section>
    <section style={{...panel,padding:18}}><div style={label}>Release queue</div><Empty icon="clock" title="Nothing scheduled" body="Drops, story moments, and paid previews will queue here with price and audience rules."/></section>
  </div>;
  const Patrons=()=> <div style={{display:"grid",gridTemplateColumns:compact?"1fr":".8fr 1.2fr",gap:14}}><PatronList/><section style={{...panel,padding:18}}><div style={label}>Relationship ledger</div>{topFans.map((fan,i)=><div key={fan.name} style={{display:"grid",gridTemplateColumns:compact?"1fr auto":"120px minmax(0,1fr) auto",gap:12,padding:"12px 0",borderBottom:i<topFans.length-1?`1px solid ${line}`:"none",alignItems:"center"}}><strong style={{fontSize:".78rem"}}>{fan.name}</strong><span style={copy}>{fan.sessions} sessions, prefers games, responds to direct acknowledgements.</span><span style={{fontSize:".68rem",fontWeight:1000,color:"#58d7c4"}}>{fan.online?"LIVE":"LATER"}</span></div>)}</section></div>;
  const Offers=()=> <div style={{display:"grid",gridTemplateColumns:compact?"1fr":"1fr 1fr",gap:14}}>
    <section style={{...panel,padding:18}}><div style={label}>Request architecture</div>{p.requests.slice(0,6).map((r,i)=><div key={r.name} style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:12,padding:"11px 0",borderBottom:i<5?`1px solid ${line}`:"none"}}><div><div style={{fontWeight:900,fontSize:".78rem"}}>{r.name}</div><div style={{...copy,fontSize:".64rem"}}>{r.desc}</div></div><strong style={{fontSize:".74rem",color:"#ffbd66"}}>{r.sparks}</strong></div>)}</section>
    <section style={{...panel,padding:18}}><div style={label}>Payout flow</div><div style={{fontSize:"2rem",fontWeight:1000,marginTop:18,color:"#58d7c4"}}>${earn.pending.toLocaleString()}</div><div style={copy}>Projected pending payout after platform split and chargeback reserve. This panel becomes a real settlement view once the backend ledger is active.</div></section>
  </div>;
  const Room=()=> <div style={{display:"grid",gridTemplateColumns:compact?"1fr":"1fr 1fr",gap:14}}><RoomCard/><section style={{...panel,padding:18}}><div style={label}>Entry promise</div><textarea defaultValue={"Come ready to play. Tonight is intimate, game-led, and subscriber moments come first."} style={{width:"100%",minHeight:122,marginTop:14,border:`1px solid ${line}`,borderRadius:9,background:"rgba(0,0,0,.18)",color:ink,padding:12,font:"inherit",fontSize:".78rem",lineHeight:1.5,resize:"vertical",outline:"none"}}/><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginTop:12,flexWrap:"wrap"}}><span style={copy}>Shown before viewers enter the room.</span><button type="button" style={{height:34,padding:"0 12px",border:`1px solid ${line}`,borderRadius:8,background:"rgba(255,255,255,.06)",color:ink,font:"inherit",fontWeight:900,cursor:"pointer"}}>Save draft</button></div></section></div>;

  return <div style={{minHeight:"100vh",display:"grid",gridTemplateColumns:compact?"74px minmax(0,1fr)":"92px minmax(0,1fr)",background:"radial-gradient(circle at 8% 0%,rgba(214,177,94,.16),transparent 34%),radial-gradient(circle at 100% 14%,rgba(88,215,196,.1),transparent 34%),#090a10",color:ink}}>
    <aside style={{borderRight:`1px solid ${line}`,background:"rgba(8,9,14,.78)",backdropFilter:"blur(18px)",padding:"18px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
      <div style={{width:46,height:46,borderRadius:14,display:"grid",placeItems:"center",fontWeight:1000,background:"linear-gradient(135deg,#d6b15e,#ff8aa8)",color:"#15100d",letterSpacing:"-.05em"}}>V</div>
      <div style={{width:"100%",display:"grid",gap:8,marginTop:8}}>{modules.map(item=><button key={item.id} type="button" title={item.label} onClick={()=>setTab(item.id)} style={{width:"100%",minHeight:compact?50:58,border:`1px solid ${tab===item.id?item.tone+"66":"transparent"}`,borderRadius:14,background:tab===item.id?`${item.tone}18`:"transparent",color:tab===item.id?ink:soft,font:"inherit",fontSize:compact?".5rem":".58rem",fontWeight:900,cursor:"pointer",display:"grid",placeItems:"center",gap:4}}>
        <I n={item.icon} s={17} c={tab===item.id?item.tone:"currentColor"}/><span>{item.label}</span>
      </button>)}</div>
      <button type="button" onClick={onLogout} title="Sign out" style={{marginTop:"auto",width:46,height:46,borderRadius:14,border:`1px solid ${line}`,background:"rgba(255,255,255,.03)",color:soft,cursor:"pointer"}}><I n="back" s={16}/></button>
    </aside>
    <main style={{minWidth:0,display:"grid",gridTemplateRows:"74px 1fr"}}>
      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:compact?"0 14px":"0 30px",borderBottom:`1px solid ${line}`,background:"rgba(11,12,18,.55)",backdropFilter:"blur(18px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:13,minWidth:0}}>
          <div style={{width:40,height:40,borderRadius:12,background:`linear-gradient(135deg,${p.accent},rgba(214,177,94,.65))`,boxShadow:`0 0 32px ${p.accent}22`}}/>
          <div style={{minWidth:0}}><div style={{fontWeight:1000,fontSize:".92rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div><div style={{...copy,fontSize:".65rem"}}>VYBE Studio workspace</div></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{...label,color:active.tone,display:compact?"none":"inline"}}>CT 12:42 AM</span>
          <span style={{height:30,display:compact?"none":"inline-flex",alignItems:"center",padding:"0 10px",border:`1px solid ${line}`,borderRadius:999,color:soft,fontSize:".66rem",fontWeight:900}}>Workspace clean</span>
        </div>
      </header>
      <div style={{padding:compact?"18px 14px 32px":"26px 32px 44px",overflowY:"auto"}}>
        <div style={{maxWidth:1180,margin:"0 auto"}}>
          <div style={{display:"flex",flexDirection:compact?"column":"row",alignItems:compact?"stretch":"end",justifyContent:"space-between",gap:14,marginBottom:18}}>
            <div><div style={{...label,color:active.tone}}>{active.label}</div><h1 style={{fontSize:compact?"1.24rem":"1.42rem",fontWeight:1000,lineHeight:1.1,marginTop:6}}>{title}</h1><p style={{...copy,maxWidth:720,marginTop:6}}>{subtitle}</p></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8}}>
              <Stat k="Now" v={p.viewers} sub="waiting" tone="#58d7c4"/><Stat k="Today" v={`$${earn.today}`} sub="earned" tone="#d6b15e"/><Stat k="Pulse" v="64%" sub="storm" tone="#ff8aa8"/>
            </div>
          </div>
          {tab==="home"&&<div style={{display:"grid",gridTemplateColumns:compact?"1fr":"minmax(0,1.55fr) minmax(300px,.85fr)",gap:14}}>
            <div style={{display:"grid",gap:14}}><HeaderCard/><SparkLine/></div>
            <div style={{display:"grid",gap:14}}><Readiness/><PatronList/></div>
            <div style={{gridColumn:"1 / -1",display:"grid",gridTemplateColumns:compact?"1fr":"1fr 1fr 1fr",gap:14}}><RoomCard/><section style={{...panel,padding:18}}><div style={label}>Compliance channel</div><div style={{...copy,marginTop:12}}>Age verification, content boundaries, payment risk, and creator safety are surfaced as live operational checks instead of hidden settings.</div></section><section style={{...panel,padding:18}}><div style={label}>Next action</div><div style={{fontSize:"1rem",fontWeight:1000,marginTop:12}}>Rewrite the intro card</div><p style={{...copy,marginTop:8}}>The room is technically ready. The public promise needs more luxury and less generic live-stream wording.</p></section></div>
          </div>}
          {tab==="analytics"&&<Analytics/>}
          {tab==="content"&&<Vault/>}
          {tab==="inbox"&&<Patrons/>}
          {tab==="store"&&<Offers/>}
          {tab==="settings"&&<Room/>}
        </div>
      </div>
    </main>
  </div>;
}

export default function App(){
  const searchParams=typeof window!=="undefined"?new URLSearchParams(window.location.search):new URLSearchParams();
  const visualPreview=searchParams.get("vybePreview")==="gift";
  const roomPreview=searchParams.get("vybePreview")==="room";
  const studioPreview=searchParams.get("vybePreview")==="studio";
  const previewMode=visualPreview||roomPreview||studioPreview;
  const previewView=visualPreview||roomPreview?"room":"lobby";
  const giftDebug=searchParams.get("giftDebug")==="1";
  const [authed,setAuthed]=useState(previewMode);const [authUser,setAuthUser]=useState(previewMode?{email:"preview@vybe.local",name:"VelvetKing",role:studioPreview?"performer":"viewer"}:null);
  const [ok,setOk]=useState(previewMode);const [ck,setCk]=useState(previewMode);const [vw,setVw]=useState(previewMode?previewView:"lobby");
  const [pf,setPf]=useState((visualPreview||roomPreview)?PERFS[0]:null);const [md,setMd]=useState(null);const [mn,setMn]=useState(false);const [cat,setCat]=useState("All");
  const [user,setUser]=useState({name:"VelvetKing",sparks:2500,spent:450,gamesPlayed:87,winRate:72,sparksEarned:1240,totalSessions:23,topStreak:8,perfCount:4,
    badges:["First Win","5-Game Streak","100 Games","Luna's Top 10","Crown Sender"],
    favPerfs:["luna","jade","raven"],
    perfHistory:{luna:{sessions:12,sparksSpent:3400,since:"Mar 2027"},jade:{sessions:6,sparksSpent:1200,since:"Apr 2027"},raven:{sessions:3,sparksSpent:800,since:"May 2027"}}});

  const {current:demoGift,enqueue:enqueueDemoGift,advance:advanceDemoGift}=useGiftQueue();
  const [giftEvents,setGiftEvents]=useState([]);
  const DEMO_GIFTS=["neon_rose","fire_shot","velvet_kiss","diamond_rain","crown_drop","champagne_pour","private_key"];
  let _demoIdx=useRef(0);
  const triggerDemoGift=useCallback((giftId)=>{
    const recipient=pf?.name||PERFS[0].name;
    const sender=user.name||"VelvetKing";
    const ev={id:Date.now(),giftId,sender,recipient,timestamp:Date.now()};
    setGiftEvents(p=>[ev,...p].slice(0,20));
    enqueueDemoGift({giftId,sender,recipient});
  },[pf,user.name]);
  const fireDemoGift=useCallback(()=>{
    const giftId=DEMO_GIFTS[_demoIdx.current%DEMO_GIFTS.length];
    _demoIdx.current++;
    triggerDemoGift(giftId);
  },[triggerDemoGift]);
  useEffect(()=>{if(visualPreview){const t=setTimeout(()=>triggerDemoGift("crown_drop"),800);return()=>clearTimeout(t)}},[visualPreview,triggerDemoGift]);
  const handleSocketGift=useCallback((ev)=>{setGiftEvents(p=>[ev,...p].slice(0,20));enqueueDemoGift(ev);},[enqueueDemoGift]);
  useGiftSocket({roomId:vw==="room"&&pf?pf.id:null,onGiftAnimation:handleSocketGift});

  const handleAuth=(u)=>{setAuthUser(u);setUser(p=>({...p,name:u.name}));setAuthed(true);if(u.role==="performer")setOk(true)};/*performers skip age verify*/
  const logout=()=>{setAuthed(false);setAuthUser(null);setOk(false);setVw("lobby")};
  const isPerf=authed&&authUser?.role==="performer";
  const perfSelf=isPerf?PERFS[0]:null;

  const vp=p=>{setPf(p);setVw("profile")};const gl2=()=>{setMd(null);setVw("room")};
  const gb=()=>setMd("book");const gv=()=>setMd("vip");const bk=()=>{setVw("lobby");setPf(null)};const bp=()=>setVw("profile");
  const cs=pk=>{setUser(u=>({...u,sparks:u.sparks-pk.sparks,spent:u.spent+pk.sparks*0.1,totalSessions:u.totalSessions+1}));setMd(null);setVw("room")};
  const by=pk=>{const b=Math.floor(pk.sparks*pk.bonus/100);setUser(u=>({...u,sparks:u.sparks+pk.sparks+b,spent:u.spent+parseFloat(pk.price.replace("$",""))}));setMd(null)};
  const sc=d=>setUser(u=>({...u,sparks:u.sparks+d}));

  if(visualPreview)return <VybeLuxuryPreview/>;

  return<>
    <style>{css}</style>
    {!authed&&<Auth onAuth={handleAuth}/>}
    {authed&&!ok&&!isPerf&&<AgeV onDone={()=>setOk(true)}/>}
    {authed&&ok&&isPerf&&vw!=="room"&&<PerfDash perfData={perfSelf} onGoLive={()=>{setPf(perfSelf);setVw("room")}} onLogout={logout}/>}
    {authed&&ok&&!isPerf&&vw==="lobby"&&<LB user={user} onPerf={vp} onWallet={()=>setMd("wallet")} cat={cat} setCat={setCat} onMenu={()=>setMn(true)}/>}
    {authed&&ok&&!isPerf&&vw==="profile"&&pf&&<PF perf={pf} user={user} onBack={bk} onLive={gl2} onBook={gb} onVip={gv} onWallet={()=>setMd("wallet")}/>}
    {authed&&ok&&vw==="room"&&pf&&<RM perf={pf} user={user} onBack={isPerf?()=>setVw("lobby"):bp} onSC={sc} onWallet={()=>setMd("wallet")} onBook={gb} onVip={gv} onGiftSent={triggerDemoGift}/>}
    <HM open={mn} onClose={()=>setMn(false)} cat={cat} setCat={setCat} onProfile={()=>{setMn(false);setMd("viewer")}}/>
    {md==="wallet"&&<WL user={user} onClose={()=>setMd(null)} onBuy={by}/>}
    {md==="book"&&pf&&<BK perf={pf} sparks={user.sparks} pkgs={BOOK.filter(p=>p.mins<=pf.caps.maxMins)} label="Book Private Session" onOk={cs} onClose={()=>setMd(null)}/>}
    {md==="vip"&&pf&&<BK perf={pf} sparks={user.sparks} pkgs={VIPPK} label="VIP Session" onOk={cs} onClose={()=>setMd(null)}/>}
    {md==="viewer"&&<ViewerProfile user={user} onClose={()=>setMd(null)}/>}
    {authed&&ok&&!ck&&<CK onOk={()=>setCk(true)}/>}
    <GiftSpectacleOverlay giftId={demoGift?.giftId} sender={demoGift?.sender} recipient={demoGift?.recipient} visible={!!demoGift} onDone={advanceDemoGift}/>
    <PlatformBanner giftId={demoGift?.giftId} sender={demoGift?.sender} recipient={demoGift?.recipient} visible={!!demoGift} onDone={()=>{}}/>
    <SparkStormShell events={giftEvents} stormThreshold={3}/>
    {giftDebug&&authed&&ok&&vw==="room"&&<GiftEffectPreviewControls onPreview={triggerDemoGift}/>}
  </>;
}
