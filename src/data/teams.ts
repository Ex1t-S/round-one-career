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

// Positions 101–200 from the same public Valve snapshot. Duplicate organization
// names are collapsed below because a snapshot can contain more than one eligible
// lineup for the same organization.
const VRS_EXTENDED_SNAPSHOT = `
101|984|The Last Resort|arTisT, bevve, Extinct, Girafffe, Vacancy
102|984|Rebels|Icarus, NOPEEj, snapy, stadodo, TMKj
103|983|Ground Zero|apocdud, hazr, Omichella, sliimey, tucks
104|981|Betclic|Demho, Dr3nquu, eskyy, hades, Prism
105|980|SportsBetExpert|consti, Infinite, motm, Peeping, shane
106|972|Gaimin Gladiators|fer, HEN1, JOTA, Luken, NEKIZ
107|971|NEXVOID|AccuracyTG, erkaSt, MiQ, sergelen19k, Zesta
108|970|Chicken Coop|Crisp, Drop, jared, mds, REKMEISTER
109|967|Black Phoenix|4X1s, karnez, Sa1nTy, Salazar, topo
110|966|Turma do Pagode|felps, ksloks, naitte, pesadelo, WOOD7
111|959|Fisher College|AlekS, corn, CrePoW, ReFuZR, TH0R
112|958|Isurus|atarax1a, deco, dott1, Hezz, rzk
113|957|Marsborne|freshie, Grizz, nicx, ogwizard, WUMBO
114|955|PCIFIC|eNs, jresy, lugseN, maxy0y0, scolleN
115|954|PsychoFace|abiraju, anttzz, eightz999, facecrack, PsychoDoctor
116|951|MASONIC|b0RUP, Botman, Frøslev, kralle, Noruyp
117|949|Lavked|1NVISIBLEE, KENSI, sol, xm1nd
118|948|G2 Ares|hitori, Junyme, SHiNE, tAk, yksjupe
119|942|Lazer Cats|Kiy0o, Magic, nikitea, Polbandana, tripex17
120|929|Keyd Stars|ckzao, lash, matios, xureba, zede
121|928|TDK|Ax1Le, h1te, nafany, sugaR, Xant3r
122|927|Nordic Partners|Altekz, k1to, L00m1, Marix, myltsi
123|925|ex-RUSTEC|Brilliance, jakekeS, Patsi, yiksrezo, youka
124|923|DragonClaw|AntyVirus, Brylu, fanatyk, PeTeRoOo, suonko
125|917|Washed|ANSG1, kiR, kroK, Lucky, suma
126|916|ReThink|chucker, macke, p1ke, Rack, zeak
127|915|SemperFi|hazr, keen, SaVage, shadiy, sliimey
128|913|Nexus|fNk, Nexius, s0und, SBT, shield
129|907|RED Canids|chayJESUS, dav1deuS, drop, kauez, reNTU
130|905|Eternal Fire|DemQQ, EMSTAR, jottAAA, rigoN, Woro2k
131|899|PURE|MAGILA, maty, Sh1karee, Toshas, yakuza
132|899|Honvéd|1NSERT2, esor, fleav, iBALLY, noleN
133|898|ENCE|Cliqq, HENU, millert, Schwarz, teme
134|897|Sangal|clax, CYPHER, Patsi, pr1metapz, smooya
135|887|UNO MILLE|ALLE, cLd, drg, pancc, remix
136|882|Enjoy|kurosa, nbl, roxesz, sh1geo, zazzer
137|880|BERG|Askan, CrePoW, KiMaRR, Rezst, Tree60
138|880|Atreides|Chill, DEPRESHN, Goody, Nivera, Python
139|877|Endless Journey|Aliot, Caleyy, deb0, pavlysha666, swetsi
140|875|illwill|7Kick, hAdji, Maden, shalfey, VLDN
141|874|Young Ninjas|joeski, mASKED, n0te, rud, tein
142|872|Yawara|deemO, edv, j0w, r3kt, tele
143|870|Fake do Biru|b4rtiN, detr0ittJ, hardzao, pesadelo, PKL
144|870|ECSTATIC|Anlelele, Buzz, nicoodoz, nut nut, TMB
145|870|Bebop|faydett, iDISBALANCE, lov1kus, redzed
146|866|Bushido Wildcats|cacan, cadnyx, Darendeli, Muk0s, Vej
147|862|Entropy|delle, dottie, flaw, L00m1, tevsii
148|862|Strael Bora|5 Star, AdaMmMm, maddeN, newhope, Wumbo
149|860|ex-Zero Tenacity|aVN, brutmonster, Cjoffo, Dragon, Kind0
150|857|Poland|Demho, Prism, Qlocuu
151|857|Chinggis Warriors|cool4st, Efire, Redka, ROUX, tikuak
152|856|ex-RUBY|danistzz, H4SAN4TOR, Kaide, sh1nejezzz, YumsaN
153|854|Rare Atom|3gl, chengking, L1haNg, Summer, Trash
154|854|HAVU|Alxc, ottob, p3kko, puuha, uli
155|852|Inner Circle Academy|3ippoch, L1seYoung, n0rths, NaYz, Tamefear
156|849|MOUZ NXT|ay0k, eSx, mixer, Nikodeon, opdust
157|847|LAG|Bwills, Cryptic, djay, Sandman, SLIGHT
158|845|HYPERSPIRIT|ADRON, Ciocardau, d1maje, ragga, starplajerz
159|833|regain|dvrk, grape, H0NeST, sasha, Zucar
160|831|Marsborne|chop, Cxzi, Grizz, motm, WolfY
161|830|Noir Verse|fostar, kirxttu, Naginat, Santuriano, xeNji
162|830|Kaleido|chuzhongT, expSasiKi, rage, SPine, suki
163|826|roamsfiest|Realyummy, Sn0w, TiiREX
164|821|SINQU|Eem3l1, imbaemba, MikOne, Onjib, wejkko
165|820|WBT|fl1peR, marat2k, NxStep, svemyy, tired73
166|820|Alter Ego|BnTeT, Gratisfaction, PokemoN, Polbandana, tomiko
167|816|ODDIK|Ceruttera, diozera, nardes, PremiuM, righi
168|815|Chinggis Warriors|Efire, hasteka, ROUX, tikuak, yAmi
169|815|FAVBET|bondik, j3kie, Marix, s4ltovsk1yy, Smash
170|812|ALGO|adeX, aNdu, Bambosh, nukkye, szejn
171|809|Rooster|ADK, chelleos, ju1ces, rekonz, SkulL
172|805|MIBR Academy|fl4sh, Jerr1, lkz, revoltz, stormzyn
173|804|SAW Youngsters|Jayy2s, jERK0z, M1KA, snowiee, tuxa
174|804|illwill|7Kick, adamS, dycha, hAdji, nEMANHA
175|803|WAZABI|BacH, BangBang, Laykinn, m0vski, VireZ
176|800|MIBR fe|Dani, GaBi, Olga, poppins, yungher
177|789|Spirit Academy|k0gaSs, Kiryasoo, Netrix, s1nside, VILBy
178|787|Falcons Force|grecu, NaToSaphiX, NucleonZ, Tapewaare, VENO
179|785|BMZ|fury5k, MagnumZ, QQLIGHTNING, rhittacrit, Wonderzce
180|782|Sashi Academy|Bl4zE, Damsi, Mizi, Mol011, Thom
181|780|Hashiras|birdfromsky, Burmylov, c0llins, JACKZ, Queenix
182|775|Lavked|1NVISIBLEE, Djon8, k4nfuz, sol, yuramyata
183|775|Liquid|EliGE, jL, NAF, siuhy, ultimate
184|774|BC.Game|aragornN, electroNic, krazy, MUTiRiS, s1mple
185|773|los kogutos|AdrieN, hotd0g, maaryy, Markoś, tomiko
186|772|NuTorious|bones, cmrn, Kermi, neight, Signal
187|766|Last Bullet|B1NGO, BZA, lan, Miami, Roninbaby
188|766|Mindfreak|Bay, kairo, phoebe, void, zune
189|766|Mai Tai|aimy, chudy, Melavi, next1me, tomiko
190|766|UNO MILLE|brokeN, cLd, clon7, Ltz, remix
191|766|Villainous|Burglar, DYLAN, Jolts, Panic, Sunk
192|765|Leo|amster, leri511, Malkiss, marat2k, OneUn1que
193|763|Vexar|ADntZ, datet, KarmaN, KEEMBO, obsward
194|760|aimclub|ERSIN, waZz, zewts
195|757|Haunted House|fr0k, icyvl0ne, malinov, SasukeQO, Schwarzkopf
196|756|Fortress|As K, BqreBedre, Brand, GrEnNiE, K1ngShield
197|753|HOTU|dukefissura, gokushima, kAlash, mizu, n0rb3r7
198|752|NAVI Junior|FAZERY, kodak, MahaR, skizzyee, yoki
199|752|DONSTU|Due1yant, gleb86rus, LAKSHERi, NeoLife, phorate
200|752|Misa|Ckanic, EMSTAR, h0kz, souv, Zuedsta
`.trim();

const americas = new Set(['9z', 'Legacy', 'FURIA', 'MIBR', 'paiN', 'DENDELE', 'Liquid', 'M80', 'Wildcard', 'NRG', 'BESTIA', 'Fluxo', 'Imperial', 'LP', 'ShindeN', 'Voca', 'Galorys', 'Bounty Hunters']);
const asia = new Set(['The MongolZ', 'TYLOO', 'Lynn Vision', 'JiJieHao', 'Nuclear TigeRES', 'The Huns', '5star', 'NEXVOID', 'Chinggis Warriors', 'Rare Atom', 'Kaleido', 'Alter Ego']);
const oceania = new Set(['FlyQuest', 'THUNDER dOWNUNDER', 'Ground Zero', 'SemperFi', 'Rooster', 'Mindfreak']);
const middleEast = new Set(['Falcons']);
const international = new Set(['Vitality', 'Natus Vincere', 'G2', 'FaZe', 'Liquid', '100 Thieves', 'BC.Game']);
const argentina = new Set(['9z', 'BESTIA', 'ShindeN', 'Isurus']);
const brazil = new Set(['Legacy', 'FURIA', 'MIBR', 'paiN', 'DENDELE', 'Fluxo', 'Imperial', 'LP', 'Galorys', 'Bounty Hunters', 'Gaimin Gladiators', 'Turma do Pagode', 'Keyd Stars', 'RED Canids', 'UNO MILLE', 'Yawara', 'Fake do Biru', 'ODDIK', 'MIBR Academy', 'MIBR fe']);
const northAmerica = new Set(['M80', 'Wildcard', 'NRG', 'Voca', 'SportsBetExpert', 'Chicken Coop', 'Fisher College', 'Marsborne', 'LAG', 'regain', 'Villainous']);

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

const VRS_ROWS = `${VRS_SNAPSHOT}\n${VRS_EXTENDED_SNAPSHOT}`.split('\n').filter((line, index, rows) => {
  const name = line.split('|')[2];
  return rows.findIndex((candidate) => candidate.split('|')[2] === name) === index;
});

export const TEAMS: Team[] = VRS_ROWS.map((line) => {
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
    initialRanking: rank, vrsPoints: points, budget: Math.max(90000, Math.round((210 - rank) * 48000 + 180000)),
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

export const LOW_TIER_TEAMS = TEAMS.filter((team) => team.initialRanking >= 80);
export const STARTER_TEAMS = LOW_TIER_TEAMS.slice(0, 48);
export const getTeam = (id: string) => TEAMS.find((team) => team.id === id) ?? TEAMS[99];
export const getTeamByName = (name: string) => TEAMS.find((team) => team.id === byName.get(name));
export const TEAM_DATA_SOURCE = 'Valve Regional Standings 2026-08-03; simulation fields approximate/configurable';
