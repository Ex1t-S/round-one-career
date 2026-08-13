import { Region, Team, TeamTier } from '@/types/game';
import { ACTIVE_MAP_IDS } from './maps';

/**
 * Valve Regional Standings global snapshot — 2026-08-03.
 * Rank, points, team name and roster are transcribed from ValveSoftware's public
 * counter-strike_regional_standings repository. Simulation-only fields are derived.
 */
const VRS_SNAPSHOT = `
1|2011|Spirit|donk,magixx,sh1ro,tN1R,zont1x
2|1950|Falcons|karrigan,kyousuke,m0NESY,NiKo,TeSeS
3|1873|MOUZ|PR,Spinx,torzsi,xelex,xertioN
4|1847|9z|dgt,HUASOPEEK,luchov,max,meyern
5|1836|Vitality|apEX,flameZ,mezii,ropz,ZywOo
6|1802|Natus Vincere|Aleksib,b1t,iM,makazze,w0nderful
7|1773|Legacy|arT,dumau,latto,n1ssim,saadzin
8|1771|FURIA|FalleN,KSCERATO,molodoy,YEKINDAR,yuurih
9|1742|BetBoom|Boombl4,d1Ledez,FL4MUS,Magnojez,zorte
10|1690|Aurora|Jimpphat,kyxsan,Wicadia,woxic,XANTARES
11|1688|G2|HeavyGod,huNter-,MATYS,NertZ,SunPayus
12|1685|PARIVISION|HObbit,Jame,slaxejezzz,xiELO,zweih
13|1677|FaZe|frozen,JBOEN,jcobbb,Neityu,Twistzz
14|1663|FUT|cmtry,dem0n,dziugss,Krabeni,lauNX
15|1637|The MongolZ|910,bLitz,cobrazera,mzinho,Techno
16|1611|MIBR|brnz4n,insani,LNZ,nqz,venomzera
17|1583|Alliance|avid,bobeksde,eraa,twist,upE
18|1565|TYLOO|JamYoung,Jee,Mercury,Moseyuh,Zero
19|1555|Astralis|HooXi,jabbi,phzy,ryu,Staehr
20|1550|B8|alex666,esenthial,kensizor,npl,s1zzi
21|1516|BIG|blameF,faveN,gr1ks,JDC,tabseN
22|1504|GamerLegion|hypex,PR,REZ,Snax,Tauson
23|1478|magic|AW,MaSvAl,mo0N,sFade8,tenzy
24|1468|Luminosity|afro,AZUWU,Bymas,Gizmy,Rainwaker
25|1464|Inner Circle|cptkurtka023,Dawy,headtr1ck,onic,zeRRoFIX
26|1446|paiN|biguzera,piriajr,saffee,snow,vsm
27|1444|Ninjas in Pyjamas|n0te,sjuush,Snappi,stavn,xKacpersky
28|1440|DENDELE|doc,gafolo,koala,maxxkor,rdnzao
29|1431|Lynn Vision|C4LLM3SU3,EmiliaQAQ,Starry,Westmelon,z4KR
30|1427|HEROIC|Brollan,Chr1zN,MartinezSa,nilo,susp
31|1410|3DMAX|Graviti,Kursy,Lucky,Maka,misutaaa
32|1397|Liquid|EliGE,malbsMd,NAF,siuhy,ultimate
33|1385|EYEBALLERS|dex,JW,KRIMZ,maxster,Ro1f
34|1374|Nemesis|mag1k3Y,r3salt,Sdaim,SELLTER,tex1y
35|1365|HOTU|dwushka,frontales,kade0,mizu,n0rb3r7
36|1361|M80|JBa,Lake,s1n,slaxz-,Swisher
37|1359|Virtus.pro|AquaRS,b1st,F0R3VER,mir,tO0RO
38|1352|Wildcard|Cxzi,HexT,mhL,nEMANHA,reck
39|1319|K27|kashl1d,qw1nk1,shalfey,X5G7V,xeedo
40|1310|100 Thieves|Ag1l,device,poiii,rain,sirah
41|1295|FlyQuest|Gratisfaction,INS,jks,nettik,Vexite
42|1289|Echo|Boye,IceBerg,leakz,NickyB,salazar
43|1285|FOKUS|Banjo,Jorko,Matheos,volt,ztr
44|1283|Bulgaria|h4rn,KalubeR,REDSTAR,Skrimo,SPELLAN
45|1274|Gentle Mates|alex,CRUC1AL,dav1g,mopoz,sausol
46|1272|INFINITE|Blytz,Dytor,kreaz,sl3nd,volt
47|1259|Nuclear TigeRES|ayuki,flouzer,m1QUSE,senka,z1k4
48|1228|TDK|ArtFr0st,Ax1Le,BELCHONOKK,fame,nafany
49|1228|NRG|Grim,hallzerk,Jeorge,nitr0,Sonic
50|1222|WW|ct0m,deko,kelieN,m3wsu,StRoGo
51|1221|ex-RUBY|H4SAN4TOR,relaxxie,robo,sh1nejezzz,YumsaN
52|1202|Nemiga|1eeR,KaiR0N-,khaN,sowalio,syph0
53|1196|SINNERS|beastik,kisserek,MoDo,SHOCK,stressarN
54|1190|Walczaki|bajmi,moonwalk,olimp,SaMey,sk1tt
55|1179|Sashi|acoR,Beccie,Cabbi,MistR,Zyphon
56|1177|BESTIA|buda,cass1n,nacho,timo,tomaszin
57|1159|Fluxo|dav1deuS,exit,kye,Ltz,zevy
58|1159|JiJieHao|0SAMAS,Bibu,CacaNito,m1N1,sinnopsyy
59|1150|Imperial|chelo,decenty,noway,saadzin,VINI
60|1149|THUNDER dOWNUNDER|aliStair,asap,dexter,Liazz,TjP
61|1141|fnatic|cairne,fEAR,jackasmo,jambo,mazay
62|1141|ARCRED|Get_Jeka,Raijin,Ryujin,shg,synyx
63|1140|Omega|adai,Aldikon,Botpa1,dan4o,def1zer
64|1130|Phantom|KEi,Kunai,Kylar,mwlky,TMB
65|1123|ex-1win|cronuss,lattykk,oz1k,Qikert,reyoz
66|1119|NOVAQ|AdreN,neaLaN,Pump,tasman
67|1114|CYBERSHOKE|Alkaren,alpha,bl1x1,glowiing,Mokuj1n
68|1095|GenOne|bL4SEZ,Brooxsy,Chucky,Djoko,Keoz
69|1094|INOX Division|FenomeN,finW,k0s,k1slll,notineki
70|1087|LP|Alisson,divine,happ,Leomonster,zmb
71|1084|ShindeN|abizz,guty,ivz,naz,tom1jed
72|1084|DEPO|buster,Krad,sh1seido,shoxs,wetfy
73|1078|STATE|kwezz,Patti,sL1m3,thamlike,Zanto
74|1077|Voca|junior,MarKE,nosraC,snav
75|1077|BASEMENT BOYS|fakerealityy,kr1vda,maggent,OWNER,Tr0ublE
76|1076|Metizport|F1KU,forsyy,isak,Plopski,stanislaw
77|1075|BRUTE|aidKiT,hfah,majky,nbqq,ZEDKO
78|1061|CYBERSHOKE Prospects|DAN9ARMATURA,dezl3bio,pleynnn,SquEzxc,tw1sterzaza
79|1061|KOLESIE|b1elany,ex1st,fr3nd,innocent,Qlocuu
80|1056|Butterfly|ayano,Forester,k1ssly,Kurama,nitzie
81|1051|BC.Game|electroNic,Magisk,mzinho,s1mple,Senzu
82|1045|EAC|anber,bekker,Fessor,n1Xen,sSen
83|1040|Johnny Speeds|HEAP,jocab,Lekr0,nawwk,titulus
84|1034|Rune Eaters|demente,forkyz,her1tage,kumao,noni
85|1032|OG|adamb,bodyy,cadiaN,pr1metapz,spooke
86|1031|Eternal Fire|DemQQ,jottAAA,MisteM,regali,rigoN
87|1024|The Huns|Annihilation,Bart4k,beyxz,controlez,nin9
88|1017|Just Players|h1te,kAlash,sm3t,spirit,sstiNiX
89|1009|9INE|bnox,cej0t,flayy,kraghen,raalz
90|1009|5star|ariucle,clouden,hoolig4n,NEUZ,rate
91|1004|QUAZAR|gehji,kaiori,Ne1XXX,newt,Porya
92|1004|Galorys|destiny,gbb,k1not1,nython,tomate
93|1002|ASTRAL|gxx-,meowpop,Neqy,RaY5ive,swiz
94|1002|Passion UA|JT,Kvem,nicx,sdy,try
95|1001|BAKS|k9ppy,Sa1nTy,turbo,whisper,xdENiSZERA
96|993|SPARTA|Djon8,El1an,k4nfuz,NickelBack,TRAVIS
97|991|Bounty Hunters|fREQ,KAISER,pepe,ponter,zock
98|987|AM|Altekz,k1to,kyuubii,L00m1,myltsi
99|986|BET-M|bluewh1te,executor,kinqie,KIRO,z1Nny
100|986|Leo|aimy,amster,kL1o,leen,next1me
`.trim();

const americas = new Set(['9z', 'Legacy', 'FURIA', 'MIBR', 'paiN', 'DENDELE', 'Liquid', 'M80', 'Wildcard', 'NRG', 'BESTIA', 'Fluxo', 'Imperial', 'LP', 'ShindeN', 'Voca', 'Galorys', 'Bounty Hunters']);
const asia = new Set(['The MongolZ', 'TYLOO', 'Lynn Vision', 'JiJieHao', 'Nuclear TigeRES', 'The Huns', '5star']);
const oceania = new Set(['FlyQuest', 'THUNDER dOWNUNDER']);
const middleEast = new Set(['Falcons']);
const international = new Set(['Vitality', 'Natus Vincere', 'G2', 'FaZe', 'Liquid', '100 Thieves', 'BC.Game']);
const argentina = new Set(['9z', 'BESTIA', 'ShindeN']);
const brazil = new Set(['Legacy', 'FURIA', 'MIBR', 'paiN', 'DENDELE', 'Fluxo', 'Imperial', 'LP', 'Galorys', 'Bounty Hunters']);
const northAmerica = new Set(['M80', 'Wildcard', 'NRG', 'Voca']);

const teamMeta: Record<string, { country: string; region?: Region; city?: string }> = {
  Spirit: { country: 'Russia', region: 'CIS', city: 'Belgrade' }, Falcons: { country: 'Saudi Arabia', region: 'Middle East', city: 'Riyadh' }, MOUZ: { country: 'Germany', city: 'Hamburg' }, '9z': { country: 'Argentina', city: 'Buenos Aires' }, Vitality: { country: 'France', city: 'Paris' }, 'Natus Vincere': { country: 'Ukraine', region: 'CIS', city: 'Kyiv' }, FURIA: { country: 'Brazil', city: 'São Paulo' }, MIBR: { country: 'Brazil', city: 'São Paulo' }, Liquid: { country: 'United States', region: 'North America', city: 'Los Angeles' }, 'The MongolZ': { country: 'Mongolia', region: 'Asia', city: 'Ulaanbaatar' }, TYLOO: { country: 'China', region: 'Asia', city: 'Shanghai' }, FlyQuest: { country: 'Australia', region: 'Oceania', city: 'Sydney' }, BESTIA: { country: 'Argentina', city: 'Buenos Aires' }, ShindeN: { country: 'Argentina', city: 'Buenos Aires' }, Imperial: { country: 'Brazil', city: 'São Paulo' }, paiN: { country: 'Brazil', city: 'São Paulo' }, Legacy: { country: 'Brazil', city: 'São Paulo' }, Fluxo: { country: 'Brazil', city: 'Rio de Janeiro' }, Astralis: { country: 'Denmark', city: 'Copenhagen' }, BIG: { country: 'Germany', city: 'Berlin' }, 'Ninjas in Pyjamas': { country: 'Sweden', city: 'Stockholm' }, fnatic: { country: 'United Kingdom', city: 'London' }, 'Eternal Fire': { country: 'Turkey', city: 'Istanbul' }, Aurora: { country: 'Turkey', city: 'Istanbul' }, FUT: { country: 'Turkey', city: 'Istanbul' }, '100 Thieves': { country: 'United States', region: 'North America', city: 'Los Angeles' }, NRG: { country: 'United States', region: 'North America', city: 'Los Angeles' }, M80: { country: 'United States', region: 'North America', city: 'Boston' }, Wildcard: { country: 'United States', region: 'North America', city: 'Dallas' }, 'Lynn Vision': { country: 'China', region: 'Asia', city: 'Shanghai' }, 'THUNDER dOWNUNDER': { country: 'Australia', region: 'Oceania', city: 'Sydney' }, JiJieHao: { country: 'China', region: 'Asia', city: 'Shanghai' }, 'The Huns': { country: 'Mongolia', region: 'Asia', city: 'Ulaanbaatar' }, 'Gentle Mates': { country: 'Spain', city: 'Madrid' }, 'Passion UA': { country: 'Ukraine', region: 'CIS', city: 'Kyiv' }, B8: { country: 'Ukraine', region: 'CIS', city: 'Kyiv' }, 'Virtus.pro': { country: 'Russia', region: 'CIS', city: 'Moscow' }, PARIVISION: { country: 'Russia', region: 'CIS', city: 'Moscow' }, BetBoom: { country: 'Russia', region: 'CIS', city: 'Moscow' },
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function resolveRegion(name: string): Region {
  if (international.has(name)) return 'International';
  if (argentina.has(name)) return 'Argentina';
  if (brazil.has(name)) return 'Brazil';
  if (northAmerica.has(name)) return 'North America';
  if (asia.has(name)) return 'Asia';
  if (oceania.has(name)) return 'Oceania';
  if (middleEast.has(name)) return 'Middle East';
  if (americas.has(name)) return 'South America';
  return teamMeta[name]?.region ?? 'Europe';
}

function tierForRank(rank: number): TeamTier {
  if (rank <= 16) return 'Tier 1';
  if (rank <= 45) return 'Tier 2';
  if (rank <= 80) return 'Tier 3';
  return 'Semi-pro';
}

const palette = ['#ff6a2b', '#75a7ff', '#62d99b', '#b085f5', '#f2c45d', '#f06f72', '#5dd5d5'];

export const TEAMS: Team[] = VRS_SNAPSHOT.split('\n').map((line) => {
  const [rankRaw, pointsRaw, name, rosterRaw] = line.split('|');
  const rank = Number(rankRaw);
  const points = Number(pointsRaw);
  const roster = rosterRaw.split(',');
  const level = Math.max(58, Math.round(97 - (rank - 1) * 0.34));
  const meta = teamMeta[name] ?? { country: resolveRegion(name), city: resolveRegion(name) };
  const region = resolveRegion(name);
  const tier = tierForRank(rank);
  return {
    id: slugify(name), name, abbreviation: name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase(),
    region, country: meta.country, city: meta.city ?? meta.country, tier, globalLevel: level,
    initialRanking: rank, vrsPoints: points, budget: Math.round((110 - rank) * 90000 + 250000),
    averageSalary: Math.max(800, Math.round((105 - rank) * 320)), popularity: Math.max(20, 96 - Math.round(rank * 0.55)),
    fanbase: Math.max(12, 95 - Math.round(rank * 0.5)), staffQuality: Math.max(48, level - 4 + (rank % 5)),
    analystQuality: Math.max(45, level - 7 + (rank % 7)), coachQuality: Math.max(48, level - 5 + (rank % 4)),
    stability: Math.max(35, 82 - (rank % 17)), culture: rank % 6 === 0 ? 'Development' : rank % 5 === 0 ? 'Star system' : rank % 4 === 0 ? 'Aggressive' : 'Structured',
    aggression: 48 + ((rank * 7) % 42), tacticalStyle: rank % 3 === 0 ? 'Explosive defaults' : rank % 3 === 1 ? 'Structured control' : 'Adaptive mid-rounds',
    mapPool: [...ACTIVE_MAP_IDS].sort((a, b) => ((a.charCodeAt(0) + rank) % 7) - ((b.charCodeAt(0) + rank) % 7)).slice(0, 5),
    objective: tier === 'Tier 1' ? 'Win a Major' : tier === 'Tier 2' ? 'Reach international playoffs' : tier === 'Tier 3' ? 'Qualify for an S-tier event' : 'Enter the VRS top 80',
    rivals: [], roster, substitutes: [], igl: roster[0], awper: roster[2] ?? roster[0], star: roster[rank % roster.length],
    contractStatus: rank % 9 === 0 ? 'Rebuilding' : rank % 13 === 0 ? 'Expiring' : 'Stable', chemistry: 58 + ((rank * 3) % 29),
    titles: Math.max(0, 9 - Math.floor(rank / 11)), sponsorLevel: Math.max(20, 95 - Math.round(rank * 0.6)),
    rosterRisk: 25 + ((rank * 9) % 60), transferActivity: 20 + ((rank * 11) % 70), color: palette[(rank - 1) % palette.length],
    dataStatus: 'official-snapshot',
  };
});

const byName = new Map(TEAMS.map((team) => [team.name, team.id]));
const rivalryPairs = [['Spirit', 'Natus Vincere'], ['Falcons', 'Vitality'], ['MOUZ', 'G2'], ['9z', 'BESTIA'], ['FURIA', 'MIBR'], ['Legacy', 'paiN'], ['Astralis', 'Ninjas in Pyjamas'], ['TYLOO', 'Lynn Vision'], ['Liquid', 'M80']];
for (const [a, b] of rivalryPairs) {
  const teamA = TEAMS.find((team) => team.name === a);
  const teamB = TEAMS.find((team) => team.name === b);
  if (teamA && teamB) { teamA.rivals.push(teamB.id); teamB.rivals.push(teamA.id); }
}

export const STARTER_TEAMS = TEAMS.filter((team) => ['Tier 3', 'Semi-pro'].includes(team.tier)).slice(0, 24);
export const getTeam = (id: string) => TEAMS.find((team) => team.id === id) ?? TEAMS[99];
export const getTeamByName = (name: string) => TEAMS.find((team) => team.id === byName.get(name));
export const TEAM_DATA_SOURCE = 'Valve Regional Standings 2026-08-03; simulation fields approximate/configurable';
