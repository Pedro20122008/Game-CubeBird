(() => {
  'use strict';

  const SAVE_KEY = 'cubeBird.progress.v2';
  const VERSION = 2;
  const LEVEL_XP = [0,300,900,1800,3200,5000,7500,10500,14500,20000];
  const MAX_LEVEL = 10;
  const PLAYERS_KEY = 'cubeBird.players.v1';
  const ARENA_KEY = 'cubeBird.arena.v1';
  const RULESET = 'cb4';
  const MATCH_TICKS = 120 * 180;
  const W = 560, H = 700, GROUND = 655, STEP = 1 / 120;
  const $ = id => document.getElementById(id);
  const number = value => Math.floor(value).toLocaleString('pt-BR');
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const canvas = $('gameCanvas');
  const ctx = canvas.getContext('2d');
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const REGIONS = [
    {id:'forest', name:'Bosque das Brisas', at:0, symbol:'♧', colors:['#173a45','#285a5c','#849c6c','#426f67','#30594d','#314c39','#cde48f']},
    {id:'desert', name:'Dunas de Âmbar', at:8, symbol:'◈', colors:['#70415d','#bb7766','#ead296','#b58a6d','#805d50','#655045','#ffd28e']},
    {id:'ice', name:'Picos de Cristal', at:18, symbol:'❄', colors:['#253f64','#5c829a','#b8d2cd','#799eac','#4b6f89','#36536c','#b8f4f1']},
    {id:'cloud', name:'Reino das Nuvens', at:32, symbol:'☁', colors:['#595e94','#9f9bbd','#edd9c8','#b3abc6','#817fa4','#605f85','#ffe3e5']},
    {id:'aurora', name:'Vale da Aurora', at:50, symbol:'✧', colors:['#121f49','#20526b','#62a5a2','#376a7d','#29495f','#24394f','#8dffda']},
    {id:'moon', name:'Lua Esquecida', at:75, symbol:'☾', colors:['#161c37','#3a405f','#8993a3','#596477','#3c465b','#343b50','#d7deff']},
    {id:'galaxy', name:'Mar de Estrelas', at:105, symbol:'✦', colors:['#251c48','#61436e','#b28e9f','#755582','#4b3c65','#39314e','#f4c0f4']},
    {id:'void', name:'Além do Horizonte', at:140, symbol:'◎', colors:['#080e1d','#182338','#3a4d60','#23374b','#172a3f','#152334','#c4e5ff']}
  ];
  const regionFor = score => REGIONS.filter(r => score >= r.at).at(-1) || REGIONS[0];
  const OBSTACLES = {
    forest:{name:'Passagem livre',hint:'Observe a abertura e encontre seu ritmo.',symbol:'○',amplitude:0,rate:0,gap:198},
    desert:{name:'Dunas móveis',hint:'As setas mostram para onde a passagem está indo.',symbol:'↕',amplitude:22,rate:1,gap:192},
    ice:{name:'Cristais deslizantes',hint:'A abertura desliza. Acompanhe o centro com saltos curtos.',symbol:'❄',amplitude:30,rate:1.35,gap:186},
    cloud:{name:'Maré de nuvens',hint:'A passagem sobe e desce numa onda longa. Antecipe a curva.',symbol:'≈',amplitude:38,rate:.8,gap:190},
    aurora:{name:'Portão de luz',hint:'A barra encolhe antes do portão fechar. Mire o centro.',symbol:'◫',amplitude:14,rate:1.2,gap:188,pulse:18,pulseRate:1.45},
    moon:{name:'Órbita lunar',hint:'Siga a órbita suave; a seta muda nas extremidades.',symbol:'☾',amplitude:38,rate:1.05,gap:182},
    galaxy:{name:'Pulso estelar',hint:'Abertura e altura oscilam em ritmos diferentes.',symbol:'✦',amplitude:28,rate:1.3,gap:188,pulse:18,pulseRate:1.7},
    void:{name:'Eclipse',hint:'Leia as duas ondas. O contorno avisa quando a abertura fecha.',symbol:'◎',amplitude:32,rate:1.15,gap:188,pulse:18,pulseRate:1.55,harmonic:7}
  };
  const SKINS = [
    { id:'sun', name:'Solzinho', description:'Todo grande voo começa aqui.', price:0, rarity:'Original', color:'#f5d36e', shade:'#c99b4c', wing:'#e6b955', accent:'#ffe9a6', pattern:'plain' },
    { id:'ember', name:'Fagulha', description:'Pequeno cubo, muita atitude.', price:0, rarity:'Original', color:'#f18c75', shade:'#b45a54', wing:'#d76d5a', accent:'#ffb8a0', pattern:'plain' },
    { id:'ocean', name:'Maré', description:'Leve como a brisa do mar.', price:0, rarity:'Original', color:'#80c7ec', shade:'#4a8fae', wing:'#5da9d1', accent:'#c1ebff', pattern:'plain' },
    { id:'mint', name:'Menta', description:'Um sopro de sorte no seu caminho.', price:80, rarity:'Incomum', color:'#a4e6ac', shade:'#65a784', wing:'#78c398', accent:'#d7ffb0', pattern:'leaf' },
    { id:'cotton', name:'Algodão', description:'Nuvens rosas, voos tranquilos.', price:220, rarity:'Incomum', color:'#e9b6db', shade:'#ac7da5', wing:'#cc93c0', accent:'#ffe3ed', pattern:'cheeks' },
    { id:'bee', name:'Zum-zum', description:'Seu voo mais doce até agora.', price:320, rarity:'Rara', color:'#f6cf63', shade:'#b79444', wing:'#e9e6bf', accent:'#fceeb7', pattern:'bee' },
    { id:'bot', name:'Byte', description:'100% cubo. 200% personalidade.', price:600, rarity:'Rara', color:'#b9cbd1', shade:'#657e92', wing:'#809fae', accent:'#8df6e3', pattern:'robot' },
    { id:'ghost', name:'Boo', description:'Assombrando o topo do placar.', price:1050, rarity:'Rara', color:'#d6e9df', shade:'#84aaa7', wing:'#aacfc2', accent:'#bdfbe2', pattern:'ghost' },
    { id:'vapor', name:'Vaporwave', description:'Um pedacinho de outra década.', price:1700, rarity:'Épica', color:'#b1a4f1', shade:'#715da6', wing:'#e2a4d8', accent:'#89f4e7', pattern:'vapor' },
    { id:'astro', name:'Órbita', description:'Houston, encontramos um novo recorde.', price:2550, rarity:'Épica', color:'#dee6d9', shade:'#899fa0', wing:'#a3bbba', accent:'#87e6ef', pattern:'astro' },
    { id:'royal', name:'Majestade', description:'O céu também pode ter uma coroa.', price:3600, rarity:'Lendária', color:'#ca9ce4', shade:'#8760a1', wing:'#ad7ec4', accent:'#ffd978', pattern:'crown' },
    { id:'nova', name:'Supernova', description:'Para quem nasceu para brilhar.', price:4900, rarity:'Lendária', color:'#718bbf', shade:'#465375', wing:'#b2b2f2', accent:'#f4d791', pattern:'galaxy' },
    { id:'melon', name:'Melancia', description:'Um voo com gostinho de verão.', price:140, rarity:'Incomum', color:'#f29296', shade:'#ac6372', wing:'#83bf84', accent:'#c9ee9a', pattern:'melon' },
    { id:'penguin', name:'Picolé', description:'Elegância de quem já vem de fraque.', price:450, rarity:'Rara', color:'#577384', shade:'#354d60', wing:'#334d61', accent:'#e4f1df', pattern:'penguin' },
    { id:'ninja', name:'Sombra', description:'Nenhum cano vai ouvir você chegando.', price:800, rarity:'Rara', color:'#627181', shade:'#394657', wing:'#435468', accent:'#ed9a86', pattern:'ninja' },
    { id:'bat', name:'Morceguinho', description:'A noite ficou um pouco mais fofa.', price:1350, rarity:'Rara', color:'#aa94c8', shade:'#685d92', wing:'#7665a1', accent:'#d9b8ef', pattern:'bat' },
    { id:'dragon', name:'Draco', description:'Um dragão de bolso com asas de sobra.', price:2100, rarity:'Épica', color:'#8ebd95', shade:'#527c70', wing:'#d0bd7e', accent:'#ebd58b', pattern:'dragon' },
    { id:'axolotl', name:'Axolote', description:'Sorrindo mesmo fora d’água.', price:3050, rarity:'Épica', color:'#edb5d1', shade:'#b07ca4', wing:'#e9a0c4', accent:'#ffdee7', pattern:'axolotl' },
    { id:'phoenix', name:'Fênix', description:'Todo recomeço merece pegar fogo.', price:4200, rarity:'Lendária', color:'#f0a465', shade:'#b76154', wing:'#eac26f', accent:'#ffe6a2', pattern:'phoenix' },
    { id:'disco', name:'Disco', description:'O céu virou sua pista de dança.', price:5600, rarity:'Lendária', color:'#afb9d3', shade:'#727e9d', wing:'#d6b2e4', accent:'#a9f3e6', pattern:'disco' },
    { id:'rookie', name:'Recruta', description:'Sua primeira insígnia de voo.', price:null, unlock:{type:'level',at:2}, rarity:'Incomum', color:'#98c5a7', shade:'#628778', wing:'#6ca48b', accent:'#ebde92', pattern:'badge' },
    { id:'pilot', name:'Aviador', description:'Óculos no rosto. Vento nas asas.', price:null, unlock:{type:'level',at:3}, rarity:'Rara', color:'#c9b495', shade:'#8b7966', wing:'#a18970', accent:'#b6e4e5', pattern:'pilot' },
    { id:'captain', name:'Capitão', description:'Você já conhece o caminho das nuvens.', price:null, unlock:{type:'level',at:4}, rarity:'Rara', color:'#86afcd', shade:'#527492', wing:'#5f89ac', accent:'#f2da85', pattern:'captain' },
    { id:'samurai', name:'Ronin', description:'Paciência para esperar o salto certo.', price:null, unlock:{type:'level',at:5}, rarity:'Épica', color:'#e0a092', shade:'#a36b68', wing:'#bf8179', accent:'#e8dbc0', pattern:'samurai' },
    { id:'sentinel', name:'Sentinela', description:'Uma armadura forjada em tentativas.', price:null, unlock:{type:'level',at:6}, rarity:'Épica', color:'#adc1cb', shade:'#6d879c', wing:'#7892a4', accent:'#bbe8d0', pattern:'sentinel' },
    { id:'cyber', name:'Neon', description:'Circuitos que brilham a cada salto.', price:null, unlock:{type:'level',at:7}, rarity:'Lendária', color:'#67728e', shade:'#424863', wing:'#e39acb', accent:'#8bffe1', pattern:'cyber' },
    { id:'seraph', name:'Serafim', description:'A persistência ganhou asas douradas.', price:null, unlock:{type:'level',at:8}, rarity:'Lendária', color:'#e9dfc8', shade:'#b6a385', wing:'#fff1d4', accent:'#ffdf8f', pattern:'angel' },
    { id:'ancient', name:'Ancestral', description:'Um visual que conta a sua história.', price:null, unlock:{type:'level',at:9}, rarity:'Lendária', color:'#92b7ae', shade:'#587c7b', wing:'#cfb783', accent:'#dcffb9', pattern:'runes' },
    { id:'sprout', name:'Guardião do Bosque', description:'Uma lembrança das primeiras brisas.', price:null, unlock:{type:'progress',at:50,best:25,region:'forest'}, rarity:'Incomum', color:'#8bc49c', shade:'#528c75', wing:'#afd582', accent:'#d6f1a3', pattern:'sprout' },
    { id:'sand', name:'Duninha', description:'Trouxe um raio de sol no turbante.', price:null, unlock:{type:'progress',at:100,best:25,region:'desert'}, rarity:'Rara', color:'#dfbc86', shade:'#ab825d', wing:'#c99b6c', accent:'#ffe5ac', pattern:'desert' },
    { id:'frost', name:'Geada', description:'Um cristal que aprendeu a voar.', price:null, unlock:{type:'progress',at:180,best:40,region:'ice'}, rarity:'Rara', color:'#afdce4', shade:'#70a3bc', wing:'#cfeff1', accent:'#eafffb', pattern:'crystal' },
    { id:'nimbus', name:'Nimbus', description:'Uma nuvem pequena, um sonho enorme.', price:null, unlock:{type:'progress',at:280,best:50,region:'cloud'}, rarity:'Épica', color:'#dbd4e7', shade:'#a29bbd', wing:'#eee5f0', accent:'#fff4e9', pattern:'cloud' },
    { id:'polar', name:'Polar', description:'As cores da aurora nas suas asas.', price:null, unlock:{type:'progress',at:400,best:75,region:'aurora'}, rarity:'Épica', color:'#78b9ba', shade:'#497d91', wing:'#b0b0e4', accent:'#a6ffe0', pattern:'aurora' },
    { id:'lunar', name:'Lunático', description:'Um salto pequeno. Uma viagem imensa.', price:null, unlock:{type:'progress',at:550,best:90,region:'moon'}, rarity:'Lendária', color:'#c6cddd', shade:'#8895ad', wing:'#a5b0c6', accent:'#edf4ff', pattern:'moon' },
    { id:'stellar', name:'Estelar', description:'Você encontrou seu lugar no universo.', price:null, unlock:{type:'progress',at:700,best:120,region:'galaxy'}, rarity:'Lendária', color:'#bc9acb', shade:'#806b9c', wing:'#cfa9df', accent:'#ffe4b7', pattern:'stellar' },
    { id:'singularity', name:'Singularidade', description:'Para quem foi além de todo horizonte.', price:null, unlock:{type:'progress',at:850,best:140,region:'void'}, rarity:'Lendária', color:'#556483', shade:'#303e60', wing:'#8b9cbb', accent:'#bdf4ff', pattern:'vortex' },
    { id:'ruby', name:'Rubi', description:'Um brilho lapidado em muitos voos.', price:6400, rarity:'Épica', color:'#db879e', shade:'#8f4f73', wing:'#b86887', accent:'#ffcfde', pattern:'ruby' },
    { id:'shark', name:'Tubarão', description:'Predador de espaços apertados.', price:7300, rarity:'Épica', color:'#86b0c5', shade:'#547c9b', wing:'#638eac', accent:'#e5f1ed', pattern:'shark' },
    { id:'origami', name:'Origami', description:'Precisão em cada dobra. Em cada salto.', price:8300, rarity:'Épica', color:'#e1d5b7', shade:'#aaa187', wing:'#c4b89e', accent:'#fff5d5', pattern:'origami' },
    { id:'wizard', name:'Feiticeiro', description:'Transforme tentativas em um pouco de magia.', price:9400, rarity:'Lendária', color:'#a597cf', shade:'#6a5d98', wing:'#8677b2', accent:'#f7df9c', pattern:'wizard' },
    { id:'raven', name:'Corvo', description:'A elegância de atravessar a tempestade.', price:10600, rarity:'Lendária', color:'#6b7793', shade:'#3b4764', wing:'#4d5a79', accent:'#accde3', pattern:'raven' },
    { id:'solar', name:'Guardião Solar', description:'Um pequeno sol que conquistou o céu.', price:11900, rarity:'Lendária', color:'#e3bd75', shade:'#a58250', wing:'#d49b65', accent:'#fff0b0', pattern:'solar' },
    { id:'chrome', name:'Cromo', description:'Sua persistência refletida em metal.', price:13300, rarity:'Lendária', color:'#bdced8', shade:'#738c9c', wing:'#91a9bb', accent:'#e9fbff', pattern:'chrome' },
    { id:'titan', name:'Titã', description:'Uma armadura para uma jornada enorme.', price:15000, rarity:'Lendária', color:'#a898ba', shade:'#685c82', wing:'#867599', accent:'#f1c9a6', pattern:'titan' },
    { id:'oracle', name:'Oráculo', description:'Os espaços já parecem contar o futuro.', price:null, unlock:{type:'level',at:8}, rarity:'Lendária', color:'#8fb9bc', shade:'#587e91', wing:'#aaa8cf', accent:'#e3ffed', pattern:'oracle' },
    { id:'emperor', name:'Imperador', description:'Uma coroa para quem conhece o caminho.', price:null, unlock:{type:'level',at:9}, rarity:'Lendária', color:'#c5a1c2', shade:'#886580', wing:'#ae84a5', accent:'#ffe3a0', pattern:'emperor' },
    { id:'ascendant', name:'Ascendente', description:'O nível máximo tem a sua assinatura.', price:null, unlock:{type:'level',at:10}, rarity:'Lendária', color:'#d8e8d1', shade:'#8da99f', wing:'#e8f6e3', accent:'#fff0ad', pattern:'ascendant' },
    { id:'chronicler', name:'Cronista', description:'Cada marco virou parte da sua história.', price:null, unlock:{type:'progress',at:925,best:140,region:'void'}, rarity:'Lendária', color:'#baad8e', shade:'#81785d', wing:'#9c9175', accent:'#e9ffd1', pattern:'chronicler' },
    { id:'horizon', name:'Horizonte', description:'Quase tudo ficou para trás. Você continuou.', price:null, unlock:{type:'progress',at:975,best:140,region:'void'}, rarity:'Lendária', color:'#bd9fc8', shade:'#7b678f', wing:'#aaa0d4', accent:'#ffdbb9', pattern:'horizon' },
    { id:'infinity', name:'Infinito', description:'Mil canos. Um horizonte que nunca termina.', price:null, unlock:{type:'progress',at:1000,best:140,region:'void'}, rarity:'Lendária', color:'#8299bc', shade:'#4e6086', wing:'#bcc9e5', accent:'#c7fff2', pattern:'infinity' },
    { id:'arena_bronze', name:'Bronze de Batalha', description:'O primeiro emblema de quem enfrenta rivais.', price:null, unlock:{"type":"arena","wins":5,"matches":15,"best":25,"streak":0,"chaos":0}, rarity:'Lendária', color:'#cba57d', shade:'#81664f', wing:'#a08060', accent:'#fbe2b1', pattern:'arena', rank:1 },
    { id:'arena_silver', name:'Rival de Prata', description:'Regularidade forjada em disputas de verdade.', price:null, unlock:{"type":"arena","wins":20,"matches":50,"best":40,"streak":0,"chaos":0}, rarity:'Lendária', color:'#b8d2df', shade:'#73859d', wing:'#93aec1', accent:'#effbff', pattern:'arena', rank:2 },
    { id:'arena_gold', name:'Campeão Áureo', description:'Uma coroa que precisa ser defendida.', price:null, unlock:{"type":"arena","wins":50,"matches":100,"best":70,"streak":5,"chaos":0}, rarity:'Lendária', color:'#e8c975', shade:'#9a753d', wing:'#caa458', accent:'#fff0aa', pattern:'arena', rank:3 },
    { id:'arena_storm', name:'Tempestade da Arena', description:'Domine o caos sem perder a direção.', price:null, unlock:{"type":"arena","wins":30,"matches":60,"best":50,"streak":0,"chaos":30}, rarity:'Lendária', color:'#9d9ed2', shade:'#5a5c91', wing:'#7778b7', accent:'#b3f4ff', pattern:'arena', rank:4 },
    { id:'arena_elite', name:'Elite do Céu', description:'Precisão de quem sustenta uma sequência.', price:null, unlock:{"type":"arena","wins":100,"matches":180,"best":100,"streak":10,"chaos":0}, rarity:'Lendária', color:'#bca1d4', shade:'#715a91', wing:'#9679b6', accent:'#f3d1ff', pattern:'arena', rank:5 },
    { id:'arena_legend', name:'Soberano do X1', description:'Duzentas vitórias e um legado no céu.', price:null, unlock:{"type":"arena","wins":200,"matches":300,"best":140,"streak":15,"chaos":0}, rarity:'Lendária', color:'#d6e2d5', shade:'#8b9ca0', wing:'#c3d8df', accent:'#caffed', pattern:'arena', rank:6 }
  ];

  const EVOLUTION_XP = [0,80,240,520,900];
  const EVOLUTION_COST = [1200,3500,8000,16000];
  const FAMILY_NAMES = {precision:'Precisão',magnet:'Magnetismo',collector:'Colecionador',scholar:'Aprendizado',fortitude:'Fortaleza',striker:'Ataque',focus:'Concentração',vitality:'Vitalidade'};
  const FAMILY_IDS = {"precision":["sun","pilot","samurai","origami","shark","horizon","arena_bronze"],"magnet":["ocean","mint","axolotl","sprout","polar","stellar"],"collector":["melon","bee","penguin","disco","royal","chronicler"],"scholar":["cotton","rookie","captain","ancient","oracle","emperor"],"fortitude":["ghost","ninja","sentinel","frost","chrome","arena_storm"],"striker":["ember","dragon","phoenix","ruby","solar","arena_gold","arena_legend"],"focus":["bot","vapor","astro","cyber","wizard","singularity","infinity","arena_silver"],"vitality":["bat","nova","seraph","sand","nimbus","lunar","raven","titan","ascendant","arena_elite"]};
  const BOSSES = [{"region":"forest","name":"Raiz Anciã","pattern":"sprout","hint":"Sementes miram sua última altura. Mude de rota depois do aviso.","best":10,"level":1,"evolution":1,"hp":180,"duration":42,"reward":700},{"region":"desert","name":"Sultão das Dunas","pattern":"desert","hint":"Muralhas deixam um corredor livre. Leia as duas faixas marcadas.","best":20,"level":2,"evolution":1,"hp":240,"duration":44,"reward":1100},{"region":"ice","name":"Rainha de Cristal","pattern":"crystal","hint":"Três cristais se abrem em leque. Cruze entre as trajetórias.","best":35,"level":3,"evolution":2,"hp":300,"duration":46,"reward":1700},{"region":"cloud","name":"Titã das Nuvens","pattern":"cloud","hint":"A onda sobe e desce. Saia da faixa anunciada antes do vento.","best":50,"level":4,"evolution":2,"hp":340,"duration":48,"reward":2400},{"region":"aurora","name":"Vigia da Aurora","pattern":"oracle","hint":"O feixe marca uma altura e dispara depois. Não espere o vermelho.","best":70,"level":5,"evolution":3,"hp":420,"duration":50,"reward":3300},{"region":"moon","name":"Colosso Lunar","pattern":"moon","hint":"Meteoros caem em diagonais. Procure a abertura entre as trilhas.","best":90,"level":6,"evolution":3,"hp":480,"duration":54,"reward":4400},{"region":"galaxy","name":"Fênix Estelar","pattern":"stellar","hint":"Sementes e feixes se alternam. Antecipe o próximo padrão.","best":115,"level":7,"evolution":4,"hp":590,"duration":58,"reward":5800},{"region":"void","name":"Devorador de Horizontes","pattern":"vortex","hint":"Três fases combinam todos os sinais. Só a evolução V rompe o selo.","best":140,"level":8,"evolution":5,"hp":740,"duration":66,"reward":10000}];
  const CHAOS_POWERS = {invert:{name:'Confusão',hint:'Após 1s de aviso, troca os comandos de pulo e poder do rival por 2s.'},shield:{name:'Escudo',hint:'Protege por 3s e absorve um impacto.'},wind:{name:'Turbulência',hint:'Avisa por 1s e aumenta a gravidade do rival em 8% por 2,5s.'},meteor:{name:'Meteoro',hint:'Marca a altura por 1s e lança um projétil que pode ser desviado.'}};
  const coinSkins=SKINS.filter(s=>s.price>0).sort((a,b)=>a.price-b.price);
  const coinPrices=[1200,1800,2600,3600,4800,6200,8000,10000,12500,15000,18000,21500,25500,30000,35000,40500,46500,53000,60000,67500,75500,84000,93000,102500,112500];
  coinSkins.forEach((s,i)=>{s.price=coinPrices[i];s.storeLevel=[2,3,5,7,9][Math.floor(i/5)];s.storeBest=[15,40,70,100,140][Math.floor(i/5)];});
  SKINS.forEach(s=>{s.family=Object.keys(FAMILY_IDS).find(k=>FAMILY_IDS[k].includes(s.id));});

  const FREE = SKINS.filter(s => s.price === 0).map(s => s.id);
  const skinById = id => SKINS.find(s => s.id === id) || SKINS[0];
  const RARITY = { Original:'#a6beb0', Incomum:'#bce185', Rara:'#8dcde9', Épica:'#d0abef', Lendária:'#f3cf80' };
  const ACHIEVEMENT_CATEGORIES={flight:'Domínio do voo',precision:'Precisão',technique:'Técnica',exploration:'Exploração',collection:'Coleção',arena:'Arena'};
  const goal=(label,target,value)=>({label,target,value});
  const medal=(id,category,title,text,reward,symbol,...goals)=>({id,category,title,text,reward,symbol,goals});
  const ACHIEVEMENTS = [
    medal('first','flight','Licença para voar','Encontre um ritmo que aguente 25 canos em um único voo.',80,'↗',goal('Recorde em um voo',25,p=>p.best)),
    medal('five','flight','Ritmo de piloto','Atravesse 50 canos sem encerrar o voo.',150,'✦',goal('Recorde em um voo',50,p=>p.best)),
    medal('fifteen','flight','Dono do horizonte','Chegue aos três dígitos em um único voo.',300,'♛',goal('Recorde em um voo',100,p=>p.best)),
    medal('horizon','flight','Além do mapa','Alcance a última região do cenário em um voo.',450,'◎',goal('Recorde em um voo',140,p=>p.best)),
    medal('flight200','flight','Fôlego de lenda','Mantenha o controle por 200 canos em um único voo.',700,'⤴',goal('Recorde em um voo',200,p=>p.best)),
    medal('flight300','flight','Horizonte sem fim','Atravesse 300 canos em um único voo solo.',1200,'∞',goal('Recorde em um voo',300,p=>p.best)),
    medal('flights','flight','Consistência vence','Conclua 20 voos com pelo menos 25 pontos cada.',250,'↗',goal('Voos concluídos com 25+ pontos',20,p=>p.stats.qualifiedFlights)),
    medal('veteran','flight','Rotina de mestre','Conclua 50 voos de 40+ pontos e alcance um recorde de 75.',600,'✧',goal('Voos concluídos com 40+ pontos',50,p=>p.stats.expertFlights),goal('Recorde',75,p=>p.best)),
    medal('odyssey','flight','Uma longa jornada','Acumule mil canos e prove seu domínio com um recorde de 100.',800,'◇',goal('Canos acumulados',1000,p=>p.stats.passed),goal('Recorde',100,p=>p.best)),

    medal('combo','precision','Na mesma sintonia','Colete 15 moedas centrais seguidas, sem deixar uma para trás.',150,'∞',goal('Melhor sequência de coletas',15,p=>p.stats.bestCombo)),
    medal('chain25','precision','Mãos firmes','Encaixe 25 coletas centrais consecutivas.',280,'✧',goal('Melhor sequência de coletas',25,p=>p.stats.bestCombo)),
    medal('chain40','precision','Linha de ouro','Mantenha uma sequência de 40 moedas centrais.',550,'◎',goal('Melhor sequência de coletas',40,p=>p.stats.bestCombo)),
    medal('perfect15','precision','Saída perfeita','Pegue todas as moedas centrais dos primeiros 15 canos de um voo.',180,'✦',goal('Canos iniciais com todas as moedas',15,p=>p.stats.perfectBest)),
    medal('perfect30','precision','Sem desperdiçar brilho','Colete todas as moedas centrais dos primeiros 30 canos.',380,'◇',goal('Canos iniciais com todas as moedas',30,p=>p.stats.perfectBest)),
    medal('empty25','precision','Rota alternativa','Chegue a 25 pontos antes de pegar sua primeira moeda central. As moedas por passar canos continuam valendo.',220,'↝',goal('Pontos antes da primeira coleta central',25,p=>p.stats.noPickupBest)),
    medal('empty50','precision','Entre o brilho e o risco','Chegue a 50 pontos antes de pegar sua primeira moeda central.',500,'↝',goal('Pontos antes da primeira coleta central',50,p=>p.stats.noPickupBest)),
    medal('recovery','precision','Recupere o compasso','Depois de deixar pelo menos 3 moedas para trás, faça uma sequência de 12 em um voo de 25+ pontos.',320,'⤴',goal('Sequência de recuperação em voo de 25+',12,p=>p.stats.recoveryBest)),

    medal('coins','technique','Brilho nos olhos','Ganhe 120 moedas em um único voo e conquiste um recorde de 40 pontos.',220,'◎',goal('Moedas em um único voo',120,p=>p.stats.bestRunCoins),goal('Recorde',40,p=>p.best)),
    medal('bank250','technique','Tesouro nas alturas','Ganhe 250 moedas em um único voo e alcance um recorde de 80.',450,'◎',goal('Moedas em um único voo',250,p=>p.stats.bestRunCoins),goal('Recorde',80,p=>p.best)),
    medal('economy30','technique','Menos é mais','Chegue a 30 pontos usando no máximo 100 impulsos desde o início.',250,'↗',goal('Pontos antes de superar 100 impulsos',30,p=>p.stats.economy30)),
    medal('economy60','technique','Asas calculadas','Chegue a 60 pontos usando no máximo 180 impulsos.',500,'↗',goal('Pontos antes de superar 180 impulsos',60,p=>p.stats.economy60)),
    medal('ceiling50','technique','Controle de altitude','Faça 50 pontos sem tocar o limite superior do céu.',250,'⌁',goal('Recorde sem tocar o teto',50,p=>p.stats.cleanCeilingBest)),
    medal('ceiling100','technique','Sem um salto a mais','Faça 100 pontos sem tocar o limite superior.',550,'⌁',goal('Recorde sem tocar o teto',100,p=>p.stats.cleanCeilingBest)),
    medal('moving8','technique','Leia o movimento','Passe por 8 canos móveis em um único voo e alcance um recorde de 50.',300,'↕',goal('Canos móveis em um voo',8,p=>p.stats.bestMovingPassed),goal('Recorde',50,p=>p.best)),
    medal('moving12','technique','Olho no centro','Pegue moedas de 12 canos móveis no mesmo voo e tenha recorde de 70.',500,'✧',goal('Moedas de canos móveis em um voo',12,p=>p.stats.bestMovingCoins),goal('Recorde',70,p=>p.best)),
    medal('splitChains','technique','Dois atos perfeitos','Em um voo de 50+ pontos, faça duas sequências distintas de pelo menos 15 coletas, separadas por uma moeda perdida.',500,'∞',goal('Sequências distintas em voo de 50+',2,p=>p.stats.splitChainsBest)),

    medal('cartographer','exploration','Cartógrafo dos ventos','Acumule 250 canos e alcance a Lua com um recorde de 75.',350,'◇',goal('Canos acumulados',250,p=>p.stats.passed),goal('Recorde até a Lua',75,p=>p.best)),
    medal('polarRoute','exploration','Aurora sem falhas','Chegue à Aurora, aos 50 pontos, com todas as moedas centrais desde o início.',650,'✧',goal('Canos iniciais com todas as moedas',50,p=>p.stats.perfectBest)),
    medal('moonRoute','exploration','Habitante da Lua','Alcance 75 pontos e registre um voo com 200 moedas.',450,'☾',goal('Recorde até a Lua',75,p=>p.best),goal('Moedas em um único voo',200,p=>p.stats.bestRunCoins)),
    medal('astronomer','exploration','Astrônomo','Alcance o Mar de Estrelas e registre 15 coletas em canos móveis no mesmo voo.',700,'✦',goal('Recorde até as estrelas',105,p=>p.best),goal('Moedas de canos móveis em um voo',15,p=>p.stats.bestMovingCoins)),
    medal('beyond','exploration','Além do conhecido','Descubra o último horizonte e registre uma sequência de 40 coletas.',900,'◎',goal('Recorde na última região',140,p=>p.best),goal('Melhor sequência de coletas',40,p=>p.stats.bestCombo)),
    medal('thousand','exploration','Mil marcos depois','Acumule 1.000 canos e chegue a 140 pontos em um voo. A recompensa Infinito espera por você.',1000,'∞',goal('Progresso acumulado',1000,p=>p.stats.passed),goal('Recorde na última região',140,p=>p.best)),

    medal('shop','collection','Estilo conquistado','Compre 3 skins com moedas e alcance um recorde de 40 pontos.',220,'▧',goal('Skins compradas com moedas',3,p=>p.owned.filter(id=>skinById(id).price>0).length),goal('Recorde',40,p=>p.best)),
    medal('collector','collection','Acervo de veterano','Tenha 20 skins e chegue ao nível 6.',650,'◇',goal('Skins na coleção',20,p=>p.owned.length),goal('Nível de piloto',6,p=>getLevel(p.xp).level)),
    medal('stylist','collection','Muitas formas de voar','Equipe 10 skins diferentes ao longo da jornada e tenha um recorde de 75.',450,'▧',goal('Skins diferentes já equipadas',10,p=>p.stats.equippedSkins.length),goal('Recorde',75,p=>p.best)),
    medal('completeCollection','collection','Um céu inteiro na coleção','Reúna as 56 skins e alcance o nível máximo 10.',2500,'♛',goal('Skins na coleção',56,p=>p.owned.length),goal('Nível máximo',10,p=>getLevel(p.xp).level)),

    medal('arenaRival','arena','Rival à altura','Conclua 10 voos competitivos de 40+ pontos e marque 75 em uma disputa.',400,'⚑',goal('Voos competitivos de 40+ pontos',10,p=>p.stats.competitiveFinishes),goal('Recorde em competição',75,p=>p.stats.arenaBest)),
    medal('tournamentMaster','arena','Regular como um relógio','Conclua um torneio de 3 ou 5 rodadas com um jogador marcando 40+ em todas as suas rodadas.',700,'♛',goal('Menor pontuação desse jogador no torneio',40,p=>p.stats.tournamentFloor)),
    medal('timeMaster','arena','Três minutos no limite','Termine o cronômetro competitivo de 3 minutos com pelo menos 120 pontos.',850,'◷',goal('Pontos em voo encerrado pelo tempo',120,p=>p.stats.timeFinishBest)),
    medal('signature','arena','Assinatura de campeão','Marque 120 em desafio por código, faça uma saída competitiva perfeita de 40 canos e conclua 30 voos competitivos de 40+ pontos.',1500,'♛',goal('Recorde próprio por código',120,p=>p.stats.challengeBest),goal('Canos iniciais perfeitos em competição',40,p=>p.stats.arenaPerfectBest),goal('Voos competitivos de 40+ pontos',30,p=>p.stats.competitiveFinishes))
  ];
  const STAT_KEYS=['flights','passed','coinsCollected','bestCombo','bestRunCoins','qualifiedFlights','expertFlights','perfectBest','noPickupBest','recoveryBest','economy30','economy60','cleanCeilingBest','bestMovingPassed','bestMovingCoins','splitChainsBest','arenaBest','arenaPerfectBest','challengeBest','competitiveFinishes','timeFinishBest','tournamentFloor','duelMatches','duelQualified','duelWins','duelBest','duelStreak','duelBestStreak','chaosWins','chaosQualified'];

  let storageAvailable = true, storageWarningShown = false, loadNotice = '';
  const safeGet = key => { try { return localStorage.getItem(key); } catch { storageAvailable = false; return null; } };
  const int = (value, max = 1000000000) => clamp(Number.isFinite(Number(value)) ? Math.floor(Number(value)) : 0, 0, max);
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function normalize(raw) {
    const owned = [...new Set([...FREE, ...(Array.isArray(raw.owned) ? raw.owned.filter(id => SKINS.some(s => s.id === id)) : [])])];
    return {
      version:VERSION, wallet:int(raw.wallet), xp:int(raw.xp,LEVEL_XP.at(-1)), best:int(raw.best), owned, nickname:cleanName(raw.nickname) || 'Jogador',
      equipped:owned.includes(raw.equipped) ? raw.equipped : 'sun',
      achievements:Array.isArray(raw.achievements) ? [...new Set(raw.achievements.filter(id => ACHIEVEMENTS.some(a => a.id === id)))] : [],
      stats:{...Object.fromEntries(STAT_KEYS.map(key=>[key,int(raw.stats?.[key])])),equippedSkins:[...new Set([owned.includes(raw.equipped)?raw.equipped:'sun',...(Array.isArray(raw.stats?.equippedSkins)?raw.stats.equippedSkins.filter(id=>owned.includes(id)):[])])]},
      forge:Object.fromEntries(owned.map(id=>{const mastery=int(raw.forge?.[id]?.mastery),eligible=EVOLUTION_XP.filter(n=>mastery>=n).length;return [id,{level:Math.max(1,Math.min(eligible,int(raw.forge?.[id]?.level,5)||1)),mastery}];})),
      campaign:normalizeCampaign(raw.campaign),
      settings:{ sound:raw.settings?.sound === true, reduceMotion:typeof raw.settings?.reduceMotion === 'boolean' ? raw.settings.reduceMotion : prefersReduced,focus:raw.settings?.focus===true }
    };
  }
  function loadProfile() {
    const saved = safeGet(SAVE_KEY);
    if (saved) {
      try {
        const raw = JSON.parse(saved);
        if (raw && raw.version === VERSION && typeof raw === 'object') return normalize(raw);
      } catch { /* A damaged save does not prevent playing. */ }
      loadNotice = 'O save não pôde ser lido. Você pode restaurar um backup nos ajustes.';
    }
    const color = safeGet('birdColor');
    const best = int(safeGet('highScore')), wallet = int(safeGet('totalCoins'));
    if (best || wallet || color) loadNotice = 'Seu recorde, suas moedas e sua cor do Cube Bird anterior vieram junto!';
    return normalize({ best, wallet, equipped:({yellow:'sun', red:'ember', blue:'ocean', '#FFD700':'sun', '#FF6347':'ember', '#1E90FF':'ocean'})[color] || 'sun' });
  }
  let profile = loadProfile();
  let players=loadPlayers(profile);
  profile=players.entries.find(p=>p.id===players.activeId).profile;
  let view = 'play', filter = 'all', state = 'menu', pendingImport = null;
  let achievementFilter='all',achievementStatus='all';
  let run = null, bird = {x:W * .255, y:310, vy:0, size:30};
  let particles = [], floaters = [], ambient = 0, shake = 0, previewClock = 0;
  let lastTime = 0, accumulator = 0, bannerUntil = 0;
  let audioContext = null;
  let arena = loadArena(), tournament = arena.tournament, challenge = arena.challenge;
  let latestResultCode = challenge?.ownCode || '', pendingArenaImport = null;
  let pendingPlayersImport=null, bossFight=null;
  let duel=null, countdown=0, pausedFrom='playing', flightFrames=[], review=null, playback=null, ghost=null;

  function updateSaveStatus() {
    $('saveStatus').classList.toggle('warning', !storageAvailable);
    $('saveStatus').innerHTML = storageAvailable ? '<i></i>Progresso salvo' : '<i></i>Salve um backup';
    $('saveStatus').title = storageAvailable ? 'Salvo automaticamente neste navegador' : 'O armazenamento está indisponível. Use Ajustes e backup para baixar seu progresso.';
  }
  function save() {
    try { syncActiveProfile();localStorage.setItem(PLAYERS_KEY,JSON.stringify(players));localStorage.setItem(SAVE_KEY, JSON.stringify(profile)); storageAvailable = true; }
    catch { storageAvailable = false; }
    updateSaveStatus();
    if (!storageAvailable && !storageWarningShown) {
      storageWarningShown = true;
      toast('Seu navegador não permitiu salvar.', 'Baixe um backup em Ajustes para guardar o progresso.', true);
    }
  }
  function toast(title, detail = '', error = false) {
    const item = document.createElement('div');
    item.className = 'toast' + (error ? ' error' : '');
    const strong = document.createElement('strong'); strong.textContent = title; item.append(strong);
    if (detail) { const small = document.createElement('small'); small.textContent = detail; item.append(small); }
    $('toastStack').append(item);
    while ($('toastStack').children.length > 3) $('toastStack').firstElementChild.remove();
    setTimeout(() => item.remove(), 4800);
  }
  function getLevel(xp) {
    const total=clamp(Number(xp)||0,0,LEVEL_XP.at(-1));
    let level=1;
    while(level<MAX_LEVEL&&total>=LEVEL_XP[level])level++;
    const max=level===MAX_LEVEL;
    return {level,current:max?0:total-LEVEL_XP[level-1],needed:max?0:LEVEL_XP[level]-LEVEL_XP[level-1],max};
  }
  function skinRequirement(skin) {
    if(skin.unlock?.type==='arena')return arenaSkinText(skin);
    if (skin.unlock?.type === 'level') return `Nível ${skin.unlock.at}`;
    if (skin.unlock?.type === 'region') return `${REGIONS.find(r => r.id === skin.unlock.region).name} · ${skin.unlock.at} pontos`;
    if (skin.unlock?.type === 'progress') return `${number(skin.unlock.at)} canos no total + recorde ${skin.unlock.best}`;
    return skin.price > 0 ? `${number(skin.price)} moedas · nível ${skin.storeLevel} + recorde ${skin.storeBest}` : 'Cor inicial';
  }
  function checkUnlocks(announce = true) {
    const level = getLevel(profile.xp).level;
    for (const skin of SKINS) {
      if (!skin.unlock || profile.owned.includes(skin.id)) continue;
      const reached=skin.unlock.type==='arena'?arenaSkinReady(skin,profile):skin.unlock.type==='level'?level>=skin.unlock.at:skin.unlock.type==='progress'?profile.stats.passed>=skin.unlock.at&&profile.best>=skin.unlock.best:profile.best>=skin.unlock.at;
      if (!reached) continue;
      profile.owned.push(skin.id);profile.forge[skin.id]={level:1,mastery:0};
      if (announce) toast(`Skin liberada: ${skin.name}!`, `${skinRequirement(skin)}. Já está na sua coleção, sem gastar moedas.`);
    }
  }
  function achievementProgress(a) {
    const goals=a.goals.map(g=>({...g,current:clamp(Number(g.value(profile))||0,0,g.target)}));
    const met=goals.every(g=>g.current>=g.target);
    const fraction=goals.reduce((sum,g)=>sum+g.current/g.target,0)/goals.length;
    return {goals,met,fraction,complete:goals.filter(g=>g.current>=g.target).length};
  }
  function checkAchievements(announce = true) {
    checkUnlocks(announce);
    for (const achievement of ACHIEVEMENTS) {
      if (!profile.achievements.includes(achievement.id) && achievementProgress(achievement).met) {
        profile.achievements.push(achievement.id);
        profile.wallet += achievement.reward;
        if (run && (['playing','paused'].includes(state)||run.settling)) run.bonusCoins += achievement.reward;
        if (announce) {
          toast(`Conquista: ${achievement.title}`, `+${achievement.reward} moedas na sua carteira`);
          playSound('achievement');
        }
      }
    }
  }
  function applySettings() {
    document.body.classList.toggle('reduced-motion', profile.settings.reduceMotion);
    applyFocus();
    $('soundSetting').checked = profile.settings.sound;
    $('motionSetting').checked = profile.settings.reduceMotion;
    $('soundButton').innerHTML = icon(profile.settings.sound ? 'sound' : 'mute');
    $('soundButton').setAttribute('aria-pressed', String(profile.settings.sound));
    $('soundButton').setAttribute('aria-label', profile.settings.sound ? 'Desativar som' : 'Ativar som');
    $('soundButton').title = profile.settings.sound ? 'Desativar som' : 'Ativar som';
    if (profile.settings.reduceMotion) { particles = []; floaters = []; shake = 0; }
  }
  function missionMarkup(a, expanded = false) {
    const done=profile.achievements.includes(a.id),progress=achievementProgress(a),percent=done?100:Math.floor(progress.fraction*100);
    const label=done?'COMPLETA':progress.goals.length===1?`${number(progress.goals[0].current)} / ${number(progress.goals[0].target)}`:`${progress.complete}/${progress.goals.length} metas`;
    const requirements=expanded?`<ul class="achievement-requirements">${progress.goals.map(g=>`<li class="${g.current>=g.target?'met':''}"><span>${g.current>=g.target?'✓':'○'} ${g.label}</span><strong>${number(g.current)} / ${number(g.target)}</strong></li>`).join('')}</ul>`:'';
    return `<div class="mission ${done?'done':''}"><span class="mission-icon" aria-hidden="true">${done?'✓':a.symbol}</span><div class="mission-content"><div class="mission-title"><strong>${a.title}</strong><span>+${number(a.reward)} ◎</span></div><p>${a.text}</p><div class="mission-progress"><div class="progress-track" role="progressbar" aria-label="${a.title}" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><i style="width:${percent}%"></i></div><small>${label}</small></div></div></div>${requirements}${expanded?`<div class="achievement-status">${done?(progress.met?'✓ RECOMPENSA RECEBIDA':'✓ PRESERVADA DO SEU SAVE ANTERIOR'):'CUMPRA TODOS OS REQUISITOS'}</div>`:''}`;
  }
  function updateProgressUI() {
    renderProfileBadge();
    $('walletValue').textContent = number(profile.wallet);
    $('bestValue').textContent = number(profile.best);
    $('flightsValue').textContent = number(profile.stats.flights);
    $('navCollection').textContent = `${profile.owned.length}/${SKINS.length}`;
    const level = getLevel(profile.xp);
    $('levelValue').textContent = level.level;
    $('levelTitle').textContent = level.max ? 'Mestre do horizonte' : level.level >= 6 ? 'Explorador das nuvens' : level.level >= 3 ? 'Piloto das alturas' : 'Aprendiz do céu';
    $('xpLabel').textContent = level.max ? 'NÍVEL MÁXIMO · 10/10' : `${number(level.current)} / ${number(level.needed)} XP`;
    $('xpBar').style.width = `${level.max?100:level.current/level.needed*100}%`;
    const skin = skinById(profile.equipped);
    $('equippedName').textContent = skin.name;
    $('equippedDescription').textContent = `${skin.description} Evolução ${forgeData(profile,skin.id).level}/5 · ${FAMILY_NAMES[skin.family]}.`;
    $('equippedRarity').textContent = skin.rarity.toLocaleUpperCase('pt-BR');
    $('equippedRarity').style.color = RARITY[skin.rarity];
    $('companionCanvas').setAttribute('aria-label', `Skin equipada: ${skin.name}`);
    const next = SKINS.filter(s => s.price > 0 && !profile.owned.includes(s.id)).sort((a,b) => a.price-b.price)[0];
    $('nextUnlock').innerHTML = next
      ? `<div class="next-top"><span class="eyebrow">SUA PRÓXIMA DESCOBERTA</span><span class="next-price">${icon('coin')}${next.price}</span></div><h2><span aria-hidden="true">✦</span>${next.name}</h2><div class="progress-track"><i style="width:${Math.min(100, profile.wallet / next.price * 100)}%"></i></div><div class="next-bottom"><span>${profile.wallet >= next.price ? 'Já cabe na sua carteira!' : `Faltam ${number(next.price - profile.wallet)} moedas`}</span><button class="text-button" data-view="shop">Ver na loja ↗</button></div>`
      : `<div class="next-top"><span class="eyebrow">VOCÊ FOI ALÉM</span><span class="next-price">✦</span></div><h2>${profile.owned.length === SKINS.length ? 'Coleção completa!' : 'Loja de moedas completa!'}</h2><div class="next-bottom"><span>${profile.owned.length} de ${SKINS.length} visuais na coleção.</span><button class="text-button" data-view="shop">Ver coleção ↗</button></div>`;
    const pending = ACHIEVEMENTS.filter(a => !profile.achievements.includes(a.id)).sort((a,b)=>achievementProgress(b).fraction-achievementProgress(a).fraction);
    const missions = pending.length ? pending.slice(0, 3) : ACHIEVEMENTS.slice(0, 3);
    $('missionList').innerHTML = missions.map(a => missionMarkup(a)).join('');
    if (view === 'shop') renderShop();
    if (view === 'achievements') renderAchievements();
    renderJourney();
    drawCompanion();
  }
  function renderJourney() {
    const score = run && ['playing','paused','over','replay','countdown'].includes(state) ? Math.max(run.score,duel?.second.score||0) : profile.best;
    const region = regionFor(score), index = REGIONS.indexOf(region), next = REGIONS[index+1];
    $('regionMarker').textContent = `${String(index+1).padStart(2,'0')} · ${region.name.toLocaleUpperCase('pt-BR')}`;
    $('journeyPanel').innerHTML = `<div class="panel-heading"><span class="eyebrow">${run && state !== 'menu' ? 'LUGAR DESTE VOO' : 'SEU HORIZONTE MAIS DISTANTE'}</span><span class="journey-symbol">${region.symbol}</span></div><h2>${region.name}</h2><div class="journey-dots">${REGIONS.map((r,i) => `<span class="${profile.best >= r.at ? 'reached' : ''} ${i===index ? 'current' : ''}" title="${r.name}: ${r.at} pontos">${r.symbol}</span>`).join('')}</div><p>${next ? `Próxima parada: <strong>${next.name}</strong>, aos ${next.at} pontos.` : 'Você alcançou todos os lugares. O céu agora tem a sua marca.'}</p><div class="progress-track"><i style="width:${next ? clamp((score-region.at)/(next.at-region.at)*100,0,100) : 100}%"></i></div><div class="career-progress"><span>PROGRESSO ACUMULADO</span><strong>${number(profile.stats.passed)} / 1.000 canos</strong><div class="progress-track"><i style="width:${Math.min(100,profile.stats.passed/10)}%"></i></div><small>Infinito: 1.000 canos no total e recorde de 140.</small></div>`;
  }
  function renderAchievements() {
    $('achievementCount').textContent = `${profile.achievements.length} / ${ACHIEVEMENTS.length}`;
    $('achievementsDone').textContent=profile.achievements.length;
    $('achievementsPending').textContent=ACHIEVEMENTS.length-profile.achievements.length;
    $('achievementsRewards').textContent=number(ACHIEVEMENTS.filter(a=>!profile.achievements.includes(a.id)).reduce((n,a)=>n+a.reward,0));
    document.querySelectorAll('[data-ach-filter]').forEach(b=>{b.classList.toggle('active',b.dataset.achFilter===achievementFilter);b.setAttribute('aria-pressed',String(b.dataset.achFilter===achievementFilter));});
    const items=ACHIEVEMENTS.filter(a=>(achievementFilter==='all'||a.category===achievementFilter)&&(achievementStatus==='all'||(achievementStatus==='done'?profile.achievements.includes(a.id):!profile.achievements.includes(a.id)))).sort((a,b)=>Number(profile.achievements.includes(a.id))-Number(profile.achievements.includes(b.id))||achievementProgress(b).fraction-achievementProgress(a).fraction);
    $('achievementResults').textContent=`${items.length} desafios nesta seleção`;
    $('achievementGrid').innerHTML=items.length?items.map(a=>`<article class="achievement-card ${profile.achievements.includes(a.id)?'done':''}"><span class="achievement-category">${ACHIEVEMENT_CATEGORIES[a.category]}</span>${missionMarkup(a,true)}</article>`).join(''):'<div class="empty-state"><h2>Nenhum desafio nesta seleção.</h2><p>Experimente outra categoria ou outro estado.</p></div>';
  }
  function setView(next) {
    if (!['play','shop','achievements','arena','campaign'].includes(next)) return;
    if (['playing','countdown'].includes(state) && next !== 'play') pause();
    if(state==='replay'&&playback)playback.playing=false;
    if (view !== next) window.scrollTo({top:0, behavior:'instant'});
    view = next;applyFocus();
    for (const name of ['play','shop','achievements','arena','campaign']) $(`${name}View`).hidden = name !== next;
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.view === next);
      if (b.dataset.view === next) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
    });
    const text = next === 'play'
      ? ['BEM-VINDO AO SEU PRÓXIMO VOO','O céu é só o começo','Desvie, colete moedas e voe do seu jeito.','JOGAR']
      : next === 'shop' ? ['SEU ESTILO TAMBÉM VOA','Um novo visual. Outro voo','Pequenos objetivos, uma coleção cheia de personalidade.','LOJA DE SKINS']
      : next === 'achievements' ? ['PARA QUEM APRENDE A LER O CÉU','O domínio deixa marcas','Precisão, estratégia e consistência. Cumpra todos os requisitos de cada desafio.','CONQUISTAS']
      : next==='campaign'?['OITO GUARDIÕES · UMA JORNADA','Rompa o último selo','Evolua suas skins, aprenda os padrões e liberte o horizonte.','GUARDIÕES']
      : ['UM ADVERSÁRIO. O MESMO CAMINHO','O céu tem espaço para rivais','X1 simultâneo, torneios e rivais fantasma. Sua habilidade decide.','ARENA VERSUS'];
    $('pageEyebrow').textContent = text[0];
    $('pageTitle').innerHTML = `${text[1]}<span>.</span>`;
    $('pageDescription').textContent = text[2];
    $('breadcrumbView').textContent = text[3];
    if(next==='campaign')renderCampaign();
    if (next === 'shop') renderShop();
    if (next === 'achievements') renderAchievements();
    if (next === 'arena') renderArena();
    if (next === 'play') drawCompanion();
  }
  function buyOrEquip(id) {
    const skin = SKINS.find(s => s.id === id);
    if (!skin) return;
    if (!profile.owned.includes(id)) {
      if (skin.unlock || skin.price === null) { toast('Esta skin é uma recompensa.', skinRequirement(skin)); return; }
      if(getLevel(profile.xp).level<skin.storeLevel||profile.best<skin.storeBest){toast('Esta skin exige domínio do voo.',skinRequirement(skin));return;}
      if (profile.wallet < skin.price) { toast('Ainda faltam algumas moedas.', 'Cada voo deixa você mais perto.'); return; }
      profile.wallet -= skin.price;
      profile.owned.push(id);profile.forge[id]={level:1,mastery:0};
      toast(`${skin.name} entrou na sua coleção!`, 'Skin equipada. Seu próximo voo já tem cara nova.');
      playSound('achievement');
    } else if (profile.equipped !== id) toast(`${skin.name} pronta para voar.`);
    profile.equipped = id;
    if(!profile.stats.equippedSkins.includes(id))profile.stats.equippedSkins.push(id);
    checkAchievements();
    save(); updateProgressUI();
  }

  // Only the map consumes this generator. Particles cannot change a race track.
  function randomSeed() { return Math.floor(Math.random()*4294967296)>>>0; }
  function mapRandom(flight) {
    flight.rng=(Math.imul(flight.rng,1664525)+1013904223)>>>0;
    return flight.rng/4294967296;
  }
  function createPipeFor(flight,x,firstCenter) {
    if(flight.rules!== 'cb3'){
      const ordinal=flight.score+flight.pipes.filter(p=>!p.passed).length+1;
      const region=regionFor(ordinal), spec=OBSTACLES[region.id], last=flight.pipes.at(-1);
      const phase=mapRandom(flight)*Math.PI*2;
      const amplitude=firstCenter===undefined?spec.amplitude:0, harmonic=spec.harmonic||0;
      const margin=spec.gap/2+(spec.pulse||0)/2+amplitude+harmonic;
      const base=firstCenter===undefined?clamp((last?.base??GROUND*.46)+(mapRandom(flight)*2-1)*78,72+margin,GROUND-65-margin):firstCenter;
      flight.pipes.push({x,width:66,gap:spec.gap,baseGap:spec.gap,base,center:base,phase,amplitude,rate:spec.rate,type:region.id,pulse:spec.pulse||0,pulseRate:spec.pulseRate||0,harmonic,ordinal,passed:false,collected:false,closing:false});
      return;
    }
    const gap=Math.max(170,198-Math.floor(flight.score/5)*3), last=flight.pipes.at(-1);
    const moving=firstCenter===undefined&&flight.score>=12&&mapRandom(flight)<.3;
    const amplitude=moving?22:0, previous=last?last.base:GROUND*.46;
    const base=firstCenter===undefined?clamp(previous+(mapRandom(flight)*2-1)*92,94+gap/2+amplitude,GROUND-88-gap/2-amplitude):firstCenter;
    flight.pipes.push({x,width:66,gap,base,center:base,phase:mapRandom(flight)*Math.PI*2,amplitude,passed:false,collected:false});
  }
  function makeFlight(seed,competitive=false,rules=RULESET) {
    const flight={seed:seed>>>0,rng:seed>>>0,competitive,rules,tick:0,inputs:[],pendingFlap:false,dead:false,deadReason:'',impact:null,score:0,coins:0,elapsed:0,distance:0,streak:0,bestCombo:0,comboAwarded:false,picked:0,missed:0,ceilingTouches:0,movingPassed:0,movingCoins:0,longChains:0,pipes:[],bird:{x:W*.255,y:GROUND*.46,vy:0,size:30}};
    createPipeFor(flight,W+75,GROUND*.46);
    return flight;
  }
  // The same fixed-step engine drives live games and verifies shared replays.
  function stepFlight(flight,flap=false) {
    if(flight.dead)return [];
    const events=[], b=flight.bird;
    if(flap){b.vy=-420;flight.inputs.push(flight.tick);}
    flight.tick++;flight.elapsed=flight.tick*STEP;
    const speed=184+Math.min(48,flight.score)*1.5;
    flight.distance+=speed*STEP;b.vy=Math.min(700,b.vy+1440*(flight.windUntil>flight.tick?1.08:1)*STEP);b.y+=b.vy*STEP;
    if(b.y<8){b.y=8;b.vy=0;flight.ceilingTouches++;}
    const collide=(kind,x,y,edge)=>{if(flight.invulnerableUntil>flight.tick)return false;if(flight.shieldUntil>flight.tick){flight.shieldUntil=0;flight.invulnerableUntil=flight.tick+108;if(kind==='ground')b.vy=-420;events.push({type:'block',amount:0,x,y});return false;}flight.dead=true;flight.deadReason='collision';flight.impact={kind,x,y,edge};return true;};
    if(b.y+b.size-4>=GROUND){b.y=GROUND-b.size;if(collide('ground',b.x+b.size/2,GROUND,'ground'))return events;}
    for(const pipe of flight.pipes){
      pipe.x-=speed*STEP;
      const wave=flight.elapsed*(pipe.rate??1.25)+pipe.phase;
      pipe.center=pipe.base+Math.sin(wave)*pipe.amplitude+Math.sin(wave*2)*(pipe.harmonic||0);
      if(pipe.pulse){const pulse=flight.elapsed*pipe.pulseRate+pipe.phase;pipe.gap=pipe.baseGap+Math.sin(pulse)*pipe.pulse;pipe.closing=Math.cos(pulse)<0;}
      if(pipe.type)pipe.direction=Math.cos(wave)>=0?1:-1;
      const top=pipe.center-pipe.gap/2, bottom=pipe.center+pipe.gap/2;
      const inset=5+(flight.loadout?.family==='precision'?.25*flight.loadout.level:0);
      const overlap=b.x+b.size-inset>pipe.x-6&&b.x+inset<pipe.x+pipe.width+6;
      if(overlap&&(b.y+inset<top||b.y+b.size-inset>bottom)){const upper=b.y+inset<top;if(collide(pipe.type||'pipe',clamp(b.x+b.size/2,pipe.x-6,pipe.x+pipe.width+6),upper?top:bottom,upper?'top':'bottom'))return events;}
      const x=pipe.x+pipe.width/2,y=pipe.center;
      if(!pipe.collected&&Math.abs(b.x+b.size/2-x)<27+(flight.loadout?.family==='magnet'?flight.loadout.level*1.5:0)&&Math.abs(b.y+b.size/2-y)<31+(flight.loadout?.family==='magnet'?flight.loadout.level*1.5:0)){
        pipe.collected=true;flight.streak++;flight.picked++;flight.bestCombo=Math.max(flight.bestCombo,flight.streak);
        if(pipe.amplitude)flight.movingCoins++;
        if(flight.streak===15)flight.longChains++;
        const amount=flight.streak>=3?3:2;flight.coins+=amount;events.push({type:'coin',amount,x,y});
        if(flight.streak>=5&&!flight.comboAwarded){flight.comboAwarded=true;flight.coins+=5;events.push({type:'combo',amount:5,x,y});}
      }
      if(!pipe.passed&&pipe.x+pipe.width+6<b.x+5){
        pipe.passed=true;flight.score++;flight.coins++;if(pipe.amplitude)flight.movingPassed++;
        if(!pipe.collected){flight.streak=0;flight.missed++;}
        events.push({type:'pass',amount:1,score:flight.score,x:b.x,y:b.y});
      }
    }
    flight.pipes=flight.pipes.filter(p=>p.x+p.width>-15);
    const last=flight.pipes.at(-1);
    if(!last||last.x<W+75-300)createPipeFor(flight,last?last.x+300:W+75);
    if(flight.competitive&&flight.tick>=MATCH_TICKS){flight.dead=true;flight.deadReason='time';}
    return events;
  }

  function syncHUD() {
    const isDuel=run?.mode==='duel'&&!!duel, practice=run?.mode==='training';
    const scene=isDuel&&duel.second.tick>run.tick?duel.second:run;
    $('runScore').textContent = run ? run.score : 0;
    $('runCoins').textContent = run ? run.coins : 0;
    $('comboLabel').textContent = run && run.streak >= 2 ? `SEQUÊNCIA ×${run.streak}` : '';
    $('difficultyLabel').textContent=practice?'TREINO LIVRE':isDuel?'X1 SIMULTÂNEO':run?.rules==='cb3'?'PISTA CLÁSSICA':OBSTACLES[regionFor(scene?.score||0).id].name;
    const next=scene?.pipes.find(p=>p.x+p.width>=scene.bird.x);
    $('obstacleHint').textContent=run?.rules==='cb3'?'Pista clássica recebida de uma versão anterior.':OBSTACLES[next?.type||regionFor(scene?.score||0).id].hint;
    $('pauseButton').disabled=!['playing','paused','countdown'].includes(state);
    $('pauseButton').setAttribute('aria-label',state==='paused'?'Continuar voo':'Pausar voo');
    $('pauseButton').innerHTML=icon(state==='paused'?'play':'pause');
    $('gameHud').hidden=isDuel||!['playing','paused','over','replay'].includes(state);
    $('jumpButton').hidden=isDuel||state==='replay';
    $('jumpButton').disabled=state==='paused';
    $('duelTouch').hidden=!isDuel||state==='replay';
    $('duelHud').hidden=!isDuel||state==='menu';
    if(isDuel)$('duelHud').innerHTML=[run,duel.second].map((f,i)=>`<div class="player-${i?'two':'one'} ${f.dead?'eliminated':''}"><small>P${i+1} · ${escapeHTML(duel.players[i].name)}</small><strong>${f.score}</strong><span>${f.dead?'FORA · '+f.coins+' ◎':`${f.coins} ◎ · ${duelJumpKey(i)} para pular`}</span></div>`).join('');
    $('gameInstructions').innerHTML=isDuel?'<kbd>W</kbd> P1 · <kbd>↑</kbd> P2 · P pausa':practice?'TREINO · sem recompensas':'<kbd>ESPAÇO</kbd> ou toque para voar';
    canvas.setAttribute('aria-label',isDuel?'X1 simultâneo. Jogador 1 usa W; jogador 2 usa seta para cima. P ou Escape pausa os dois.':'Cube Bird. Espaço, seta para cima, W ou toque para pular. P ou Escape para pausar.');
    const competitive=run&&['local','challenge','duel'].includes(run.mode);
    $('competitionStrip').hidden=!competitive&&!practice;
    if(competitive||practice)$('competitionStrip').textContent=practice?'TREINO DO TRECHO · volte ao resultado quando quiser':isDuel?`X1 SIMULTÂNEO · ${Math.max(0,180-Math.floor(scene.elapsed))}s · PLACAR DA SESSÃO ${duel.wins[0]} × ${duel.wins[1]}`:`${run.mode==='local'?`RODADA ${run.round+1}/${tournament?.rounds||1}`:'DESAFIO POR CÓDIGO'} · ${run.player} · ${Math.max(0,180-Math.floor(run.elapsed))}s`;
    $('replayControls').hidden=state!=='replay';
    syncBossHUD();syncChaosHUD();
    $('ghostHud').hidden=!ghost||!['playing','paused','over'].includes(state)||isDuel||practice;
    if(ghost){const delta=(run?.score||0)-ghost.flight.score;$('ghostHud').textContent=`FANTASMA · ${ghost.player} · ${ghost.flight.score} pts${ghost.done?' · voo encerrado':''} · ${delta===0?'empatados':delta>0?`você +${delta}`:`rival +${-delta}`}`;}
  }

  function renderOverlay() {
    const overlay = $('gameOverlay');
    overlay.hidden = state === 'playing'||state==='replay';
    overlay.className = 'game-overlay';
    if(state==='countdown'){
      overlay.classList.add('ready');overlay.innerHTML=`<div class="ready-screen"><div class="eyebrow">W · JOGADOR 1 &nbsp; ↑ · JOGADOR 2</div><h2>${Math.max(1,Math.ceil(countdown))}</h2><p>Preparem as asas. A largada é juntos.</p></div>`;
    } else if (state === 'menu') {
      overlay.classList.add('intro');
      overlay.innerHTML = `<div class="intro-screen"><div><div class="eyebrow">UM CUBO. UM CÉU INTEIRO.</div><h2>O próximo<br>salto é seu.</h2><p>Encontre seu ritmo.<br>Deixe seu recorde para trás.</p></div><div class="intro-bottom"><button class="button primary" data-action="prepare">Jogar agora ${icon('arrow')}</button><div class="intro-controls"><kbd>ESPAÇO</kbd><kbd>↑</kbd><kbd>W</kbd><span>ou toque para voar</span></div><p class="intro-foot">3 cores para começar. Um céu para conquistar.</p></div></div>`;
    } else if(run?.mode==='boss'&&bossFight&&(state==='ready'||state==='over')){renderBossOverlay(overlay);
    } else if (state === 'ready') {
      overlay.classList.add('ready');
      overlay.innerHTML = run?.mode==='duel'?`<div class="result-card"><div class="eyebrow">DOIS PLAYERS · MESMA PISTA</div><h2>Preparem o X1.</h2><p class="impact-note">P1: W · P2: ↑<br>Os pássaros têm contornos verde e azul.<br>Cada um desvia dos canos por conta própria.</p><button class="button primary" data-action="duel-go">Iniciar contagem de 3 segundos</button><button class="text-button" data-view="arena">Voltar à arena</button></div>`:'<div class="ready-screen"><div class="eyebrow">SEU PRIMEIRO SALTO</div><h2>Encontre o ritmo.</h2><p>Espaço, ↑, W ou toque para começar.</p></div>';
    } else if (state === 'paused') {
      overlay.classList.add('dim');
      overlay.innerHTML = `<div class="result-card"><span class="result-icon">Ⅱ</span><div class="eyebrow">O CÉU PODE ESPERAR</div><h2>Uma pausa.</h2><p>Respire. Seu voo continua daqui.</p><div class="pause-actions"><button class="button primary" data-action="resume">Continuar ${run?.mode==='training'?'treino':'voo'} ${icon('play')}</button><button class="button secondary" data-action="finish">${['training','duel','boss'].includes(run?.mode)?'Encerrar partida':'Encerrar e guardar moedas'}</button>${run?.mode==='training'?'<button class="text-button" data-action="review-back">Voltar ao resultado</button>':''}</div></div>`;
    } else if(state==='over'&&run?.mode==='duel'){renderDuelResult(overlay);
    } else if(state==='over'&&run?.mode==='training'){
      overlay.classList.add('dim');overlay.innerHTML=`<div class="result-card"><span class="result-icon">${run.reason==='complete'?'✓':'↻'}</span><div class="eyebrow">TREINO SEM RECOMPENSAS</div><h2>${run.reason==='complete'?'Trecho superado!':'Tente outro ritmo.'}</h2><p class="impact-note">${run.reason==='complete'?'Você passou do ponto da colisão original.':'O mesmo trecho continua disponível para praticar.'}</p><button class="button primary" data-action="train">Repetir o treino ↻</button><button class="button secondary" data-action="review-back">Voltar ao resultado</button></div>`;
    } else if (state === 'over' && run) {
      const record = run.score > run.bestAtStart;
      overlay.classList.add('dim');
      const arenaRun=run.mode!=='solo';
      const primary=run.mode==='local'?'<button class="button primary" data-view="arena">Próximo jogador / placar ↗</button>':`<button class="button primary" data-action="${run.mode==='challenge'?'retry-challenge':'prepare'}">${run.mode==='challenge'?'Tentar nesta pista':'Jogar de novo'} ${icon('arrow')}</button>`;
      overlay.innerHTML=`<div class="result-card"><span class="result-icon">${record?'✦':'↗'}</span><div class="eyebrow">${arenaRun?escapeHTML(run.player)+' · RESULTADO REGISTRADO':record?'VOCÊ FOI MAIS LONGE':'CADA VOO CONTA'}</div><h2>${run.reason==='time'?'Tempo encerrado!':record?'Novo recorde!':run.score>=5?'Que belo voo.':'O próximo vai longe.'}</h2><div class="result-scores"><div><small>PONTOS</small><strong>${run.score}</strong></div><div><small>${arenaRun?'MOEDAS DO VOO':'RECORDE'}</small><strong>${number(arenaRun?run.coins:profile.best)}</strong></div></div><div class="run-breakdown"><div><span>Moedas do voo</span><strong>+${run.coins} ◎</strong></div>${run.bonusCoins?`<div><span>Bônus de conquistas</span><strong>+${run.bonusCoins} ◎</strong></div>`:''}<div><span>Experiência ganha</span><strong>+${run.xp} XP</strong></div><div><span>Lugar alcançado</span><strong>${regionFor(run.score).name}</strong></div></div>${review&&review.source===run?`<p class="impact-note">${impactText(run)}</p><div class="review-actions"><button class="button secondary" data-action="replay">Rever colisão · 0,35×</button><button class="button secondary" data-action="train">Treinar este trecho</button></div>`:''}${primary}${arenaRun?'<button class="button secondary" data-view="arena">Ver disputa / compartilhar</button>':'<button class="button secondary" data-view="shop">Visitar a loja '+icon('shop')+'</button>'}<button class="text-button" data-action="menu">Voltar ao início</button></div>`;
    }
    syncHUD();
  }
  function prepareFlight(context = null) {
    if (['playing','paused','countdown','replay'].includes(state)) return;
    if(!context&&state==='over'&&run?.mode==='local'){setView('arena');return;}
    if(!context&&state==='over'&&run?.mode==='challenge'){startChallengeFlight();return;}
    setView('play'); state = 'ready';
    ghost=null;review=null;playback=null;flightFrames=[];duel=null;bossFight=null;
    const mode=context?.mode||'solo';
    run=Object.assign(makeFlight(context?.seed??randomSeed(),mode!=='solo',context?.rules||RULESET),{mode,player:'',bonusCoins:0,xp:0,bestAtStart:profile.best,finished:false,reason:'',recorded:false},context||{});
    run.skinId=profile.equipped;if(mode==='solo')run.loadout=skinLoadout(profile,profile.equipped);
    bird=run.bird;
    captureFlightFrame(true);
    particles = []; floaters = []; shake = 0; accumulator = 0;
    renderOverlay();
    renderJourney();
    canvas.focus({preventScroll:true});
    if (window.innerWidth <= 650) $('gameStage').scrollIntoView({block:'center', behavior:'instant'});
  }
  function beginFlight() {
    if (state !== 'ready' || !run) return;
    if((run.mode==='local'&&(!tournament||run.tournamentId!==tournament.id||run.turn!==tournament.results.length))||(run.mode==='challenge'&&(!challenge||run.seed!==challenge.seed))){
      state='menu';run=null;renderOverlay();setView('arena');toast('Esta disputa mudou.','Prepare o voo pelo painel da arena.');return;
    }
    state = 'playing';
    if(run.mode==='boss'){renderOverlay();return;}
    if(run.mode==='duel'){state='countdown';countdown=3;renderOverlay();return;}
    if(run.mode!=='training')profile.stats.flights++;
    checkAchievements(); save(); updateProgressUI(); renderOverlay();
  }
  function action(playerIndex=0) {
    if (view !== 'play' || $('settingsDialog').open || $('helpDialog').open||$('profilesDialog').open) return;
    if(state==='over'&&['duel','training','boss'].includes(run?.mode))return;
    if (state === 'menu' || state === 'over') { prepareFlight(); return; }
    if (state === 'ready') beginFlight();
    if (state !== 'playing') return;
    const active=run.mode==='duel'&&playerIndex===1?duel.second:run;
    if(active.dead)return;
    active.pendingFlap=true;
    active.bird.vy = -420;
    playSound('flap');
    emit(bird.x - 9, bird.y + bird.size * .5, 3, skinById(profile.equipped).accent, 40);
  }
  function pause() {
    if (!['playing','countdown'].includes(state)) return;
    pausedFrom=state;state = 'paused'; accumulator = 0; save(); renderOverlay();
  }
  function resume() {
    if (state !== 'paused' || view !== 'play' || document.hidden || $('settingsDialog').open || $('helpDialog').open||$('profilesDialog').open) return;
    state = pausedFrom; accumulator = 0; renderOverlay(); canvas.focus({preventScroll:true});
  }
  function finishFlight(reason = 'collision') {
    if (!run || run.finished || !['playing','paused'].includes(state)) return;
    if(run.mode==='boss'){finishBoss(reason);return;}
    if(run.mode==='duel'){finishDuel(reason);return;}
    if(run.mode==='training'){run.finished=true;run.reason=reason;state='over';renderOverlay();return;}
    captureFlightFrame(true);
    run.finished = true; run.reason = reason;
    if(reason==='collision')buildReview();
    state = 'over';
    recordMastery();
    if(run.score>=25)profile.stats.qualifiedFlights++;
    if(run.score>=40)profile.stats.expertFlights++;
    if(run.mode!=='solo'){
      profile.stats.arenaBest=Math.max(profile.stats.arenaBest,run.score);
      if(run.score>=40)profile.stats.competitiveFinishes++;
      if(run.mode==='challenge')profile.stats.challengeBest=Math.max(profile.stats.challengeBest,run.score);
      if(reason==='time')profile.stats.timeFinishBest=Math.max(profile.stats.timeFinishBest,run.score);
    }
    recordCompetition();
    run.settling=true;checkAchievements();run.settling=false;save();updateProgressUI();
    if (reason === 'collision') {
      playSound('hit'); shake = profile.settings.reduceMotion ? 0 : 7;
      emit(bird.x + 15, bird.y + 15, 17, skinById(profile.equipped).color, 180);
    }
    renderOverlay();
  }
  function addXP(amount) {
    if(run?.mode==='solo'&&run.loadout?.family==='scholar'){run.bonusXpRemainder=(run.bonusXpRemainder||0)+amount*(.03+run.loadout.level*.02);const extra=Math.floor(run.bonusXpRemainder);run.bonusXpRemainder-=extra;amount+=extra;}
    const previous = getLevel(profile.xp).level;
    const gained=Math.min(amount,Math.max(0,LEVEL_XP.at(-1)-profile.xp));
    profile.xp+=gained;
    if (run) run.xp += gained;
    const current = getLevel(profile.xp).level;
    if (current > previous) toast(`Você chegou ao nível ${current}!`, 'Seu lugar no céu está crescendo.');
  }
  function awardCoins(amount, x, y) {
    profile.wallet += amount; profile.stats.coinsCollected += amount;
    if (!profile.settings.reduceMotion) floaters.push({x,y,text:`+${amount}`,life:1, max:1});
  }
  function banner(text) {
    $('milestoneBanner').textContent = text;
    $('milestoneBanner').classList.add('show');
    bannerUntil = ambient + 2.3;
  }
  function createPipe(x, firstCenter) { createPipeFor(run,x,firstCenter); }
  function recordMastery() {
    if(!run||['training','duel','boss'].includes(run.mode))return;
    const s=profile.stats;
    s.bestCombo=Math.max(s.bestCombo,run.bestCombo);
    s.bestRunCoins=Math.max(s.bestRunCoins,run.coins);
    s.bestMovingPassed=Math.max(s.bestMovingPassed,run.movingPassed);
    s.bestMovingCoins=Math.max(s.bestMovingCoins,run.movingCoins);
    if(run.missed===0)s.perfectBest=Math.max(s.perfectBest,run.score);
    if(run.picked===0)s.noPickupBest=Math.max(s.noPickupBest,run.score);
    if(run.missed>=3&&run.score>=25)s.recoveryBest=Math.max(s.recoveryBest,run.streak);
    if(run.inputs.length<=100)s.economy30=Math.max(s.economy30,Math.min(30,run.score));
    if(run.inputs.length<=180)s.economy60=Math.max(s.economy60,Math.min(60,run.score));
    if(run.ceilingTouches===0)s.cleanCeilingBest=Math.max(s.cleanCeilingBest,run.score);
    if(run.score>=50)s.splitChainsBest=Math.max(s.splitChainsBest,run.longChains);
    if(run.mode!=='solo'&&run.missed===0)s.arenaPerfectBest=Math.max(s.arenaPerfectBest,run.score);
  }
  function update() {
    if(state!=='playing'||!run)return;
    if(run.mode==='boss'){updateBoss();return;}
    if(run.mode==='duel'){updateDuel();return;}
    if(run.mode==='training'){
      const events=stepFlight(run,run.pendingFlap);run.pendingFlap=false;
      if(events.length||run.tick%30===0)syncHUD();
      if(run.dead)finishFlight(run.deadReason);else if(run.tick>=review.source.tick+120)finishFlight('complete');return;
    }
    const before=regionFor(run.score).id;
    const events=stepFlight(run,run.pendingFlap);
    run.pendingFlap=false;
    stepGhost();captureFlightFrame();
    for(const event of events){
      awardCoins(event.amount,event.x,event.y-15);
      if(event.type==='coin'){
        profile.stats.bestCombo=Math.max(profile.stats.bestCombo,run.bestCombo);
        addXP(2);playSound('coin');emit(event.x,event.y,9,'#ffe3a1',100);
      }else if(event.type==='combo'){
        banner('5 COLETAS SEGUIDAS! +5 MOEDAS');
      }else if(event.type==='pass'){
        gainMastery(profile,run.skinId||profile.equipped,1);
        if(run.mode==='solo'&&run.loadout?.family==='collector'&&event.score%Math.max(12,22-run.loadout.level*2)===0){run.coins++;awardCoins(1,bird.x,bird.y);}
        profile.stats.passed++;profile.best=Math.max(profile.best,event.score);addXP(5);
        if([5,10,20,30,50,75,100].includes(event.score))banner(`${event.score} PONTOS. CONTINUA ASSIM! ✦`);
        if(event.score===12&&run.rules==='cb3')banner('OLHO NO RITMO: CANOS MÓVEIS À FRENTE');
        playSound('score');
      }
    }
    if(events.length){
      recordMastery();
      if(regionFor(run.score).id!==before)banner(`NOVA REGIÃO: ${regionFor(run.score).name.toLocaleUpperCase('pt-BR')}`);
      checkAchievements();save();updateProgressUI();syncHUD();
    }
    if(run.tick%30===0)syncHUD();
    if(run.dead)finishFlight(run.deadReason);
  }

  function applyFocus() {
    document.body.classList.toggle('focus-play',profile.settings.focus&&view==='play');
    $('focusButton').setAttribute('aria-pressed',String(profile.settings.focus));
    $('focusButton').textContent=profile.settings.focus?'Mostrar painéis':'Modo foco';
  }
  function toggleFocus() { profile.settings.focus=!profile.settings.focus;applyFocus();save();canvas.focus({preventScroll:true}); }
  async function toggleFullscreen() {
    const card=canvas.closest('.flight-card');
    try {
      if(document.fullscreenElement)await document.exitFullscreen();
      else if(card.requestFullscreen)await card.requestFullscreen();
      else {profile.settings.focus=true;applyFocus();save();toast('Modo foco ativado.','Este navegador não oferece tela cheia.');}
    } catch {profile.settings.focus=true;applyFocus();save();toast('Modo foco ativado.','A tela cheia não ficou disponível neste navegador.');}
    canvas.focus({preventScroll:true});
  }
  function copyFlight(flight,commands=true) {
    return {...flight,bird:{...flight.bird},pipes:flight.pipes.map(p=>({...p})),inputs:commands?[...flight.inputs]:[],inputCount:flight.inputs.length,impact:flight.impact?{...flight.impact}:null};
  }
  function captureFlightFrame(force=false) {
    if(!run||(!force&&Math.max(run.tick,duel?.second.tick||0)%4!==0))return;
    const sample={first:copyFlight(run,false),second:duel?copyFlight(duel.second,false):null,chaos:duel?.chaotic?{hazards:duel.hazards.map(h=>({...h}))}:null};
    if(flightFrames.at(-1)?.first.tick===run.tick&&flightFrames.at(-1)?.second?.tick===sample.second?.tick)flightFrames[flightFrames.length-1]=sample;
    else flightFrames.push(sample);
    while(flightFrames.length>151)flightFrames.shift();
  }
  function impactText(flight) {
    const hit=flight.impact;
    if(!hit)return 'Veja o fim do voo e experimente outro ritmo.';
    if(hit.kind==='ground')return 'Você tocou o chão. Um salto um pouco antes pode salvar o voo.';
    const name=OBSTACLES[hit.kind]?.name||'Cano';
    return `${name}: você tocou a borda ${hit.edge==='top'?'superior':'inferior'} da passagem. ${OBSTACLES[hit.kind]?.hint||'Ajuste a altura antes de chegar ao cano.'}`;
  }
  function buildReview() {
    review={source:run,duel,frames:flightFrames.slice(),ghost};
  }
  function startReplay() {
    if(!review?.frames.length||['playing','paused','countdown'].includes(state))return;
    run=review.source;duel=review.duel;bird=run.bird;ghost=null;
    setView('play');state='replay';playback={index:0,elapsed:0,playing:true};particles=[];floaters=[];shake=0;
    $('replayTrain').hidden=!!duel;renderOverlay();updateReplayCaption();canvas.focus({preventScroll:true});
  }
  function updateReplay(dt) {
    if(!playback?.playing)return;
    playback.elapsed+=dt*.35;
    const frames=review.frames, start=Math.max(frames[0].first.tick,frames[0].second?.tick||0);
    while(playback.index<frames.length-1){
      const f=frames[playback.index+1], tick=Math.max(f.first.tick,f.second?.tick||0);
      if((tick-start)*STEP>playback.elapsed)break;
      playback.index++;
    }
    if(playback.index===frames.length-1)playback.playing=false;
    updateReplayCaption();
  }
  function updateReplayCaption() {
    if(!playback||!review)return;
    const duration=(Math.max(review.frames.at(-1).first.tick,review.frames.at(-1).second?.tick||0)-Math.max(review.frames[0].first.tick,review.frames[0].second?.tick||0))*STEP;
    const atEnd=playback.index===review.frames.length-1;
    $('replayCaption').textContent=atEnd?`IMPACTO MARCADO EM VERMELHO · ${duel?'Cada pássaro tem sua colisão indicada.':impactText(review.source)}`:`ÚLTIMOS ${duration.toFixed(1).replace('.',',')}s · CÂMERA LENTA 0,35×`;
    $('replayToggle').textContent=playback.playing?'Pausar':atEnd?'Recomeçar':'Continuar';
    const sample=review.frames[playback.index];
    $('runScore').textContent=sample.first.score;$('runCoins').textContent=sample.first.coins;
    $('comboLabel').textContent=sample.first.streak>=2?`SEQUÊNCIA ×${sample.first.streak}`:'';
    if(duel)$('duelHud').innerHTML=[sample.first,sample.second].map((f,i)=>`<div class="player-${i?'two':'one'} ${f.dead?'eliminated':''}"><small>P${i+1} · ${escapeHTML(duel.players[i].name)}</small><strong>${f.score}</strong><span>${f.coins} ◎ ${f.dead?'· FORA':''}</span></div>`).join('');
  }
  function backToResult() {
    if(!review)return;
    run=review.source;duel=review.duel;bird=run.bird;ghost=review.ghost;playback=null;state='over';particles=[];floaters=[];accumulator=0;renderOverlay();renderJourney();
  }
  function startTraining() {
    if(!review||review.duel||['playing','paused','countdown'].includes(state))return;
    const checkpoint=review.frames[0].first;
    run=copyFlight(checkpoint);run.inputs=review.source.inputs.slice(0,checkpoint.inputCount);
    Object.assign(run,{mode:'training',dead:false,deadReason:'',impact:null,finished:false,pendingFlap:false,bonusCoins:0,xp:0,reason:'',recorded:true});
    bird=run.bird;ghost=null;duel=null;playback=null;state='paused';pausedFrom='playing';accumulator=0;particles=[];floaters=[];shake=0;
    setView('play');renderOverlay();
    $('gameOverlay').innerHTML=`<div class="result-card"><span class="result-icon">↻</span><div class="eyebrow">O MESMO TRECHO · OUTRA CHANCE</div><h2>Ensaie o próximo salto.</h2><p class="impact-note">O jogo voltou alguns segundos antes da colisão, com a mesma posição e velocidade.<br>Supere o ponto da batida. Este treino não concede recompensas.</p><button class="button primary" data-action="resume">Começar treino ${icon('play')}</button><button class="button secondary" data-action="review-back">Voltar ao resultado</button></div>`;
  }
  function updateDuel() {
    updateChaos();let changed=false;
    for(const [index,f] of [run,duel.second].entries()){
      const wasDead=f.dead;
      if(!wasDead&&stepFlight(f,f.pendingFlap).length)changed=true;f.pendingFlap=false;accumulateMetrics(duel.metrics[index],f);
      if(!wasDead&&f.dead){changed=true;playSound('hit');emit(f.bird.x+15,f.bird.y+15,12,f===run?'#ddf594':'#9ce5ff',110);}
    }
    captureFlightFrame();if(changed||Math.max(run.tick,duel.second.tick)%30===0)syncHUD();
    if(run.dead&&duel.second.dead)finishDuel('complete');
  }
  function finishDuel(reason) {
    if(!duel||run.finished)return;
    run.finished=true;run.reason=reason;state='over';
    const compare=run.score-duel.second.score||run.coins-duel.second.coins;
    if(reason==='quit')duel.result='Partida encerrada';
    else {
      const other=duel.second,compare=run.score-other.score||run.coins-other.coins;
      const winner=compare>0?0:1;
      duel.result=compare===0?'Empate!':`${duel.players[winner].name} venceu!`;
      if(compare!==0)duel.wins[winner]++;
    }
    settleDuel(reason,compare);
    captureFlightFrame(true);if(run.impact||duel.second.impact)buildReview();
    renderOverlay();
  }
  function renderDuelResult(overlay) {
    overlay.classList.add('dim');
    overlay.innerHTML=`<div class="result-card"><span class="result-icon">VS</span><div class="eyebrow">X1 SIMULTÂNEO · RESULTADO</div><h2>${escapeHTML(duel.result)}</h2><div class="duel-result">${[run,duel.second].map((f,i)=>`<div class="player-${i?'two':'one'}"><small>${escapeHTML(duel.players[i].name)}</small><strong>${f.score}</strong><small>pontos · ${f.coins} moedas</small><small>+${duel.payouts[i]?.xp||0} XP · +${duel.payouts[i]?.coins||0} ◎ no perfil</small></div>`).join('')}</div><p class="impact-note">Placar da sessão: ${duel.wins[0]} × ${duel.wins[1]}<br>${duel.qualified?'Duelo qualificado: conta para as skins competitivas.':'Skins competitivas: ambos precisam de 15+ pontos, 25s e 30 saltos.'}<br>Pontos decidem; moedas do voo desempatam.</p><button class="button primary" data-action="duel-rematch">Revanche · nova pista ↗</button>${review?.source===run?'<button class="button secondary" data-action="replay">Rever o fim do X1 · 0,35×</button>':''}<button class="button secondary" data-view="arena">Voltar à arena</button><button class="text-button" data-action="menu">Jogar solo</button></div>`;
  }
  function prepareGhost() {
    ghost=null;
    if(!challenge?.ghostCode||!$('ghostEnabled').checked)return;
    try {
      const result=verifyReplay(challenge.ghostCode,challenge.seed,challenge.rules);
      ghost={player:result.player,flight:makeFlight(challenge.seed,true,challenge.rules),actions:result.actions,cursor:0,end:result.ticks,done:result.ticks===0};
    } catch {toast('O fantasma não pôde ser carregado.','Importe novamente o resultado do rival.');}
  }
  function stepGhost() {
    if(!ghost||ghost.done)return;
    const f=ghost.flight,flap=ghost.actions[ghost.cursor]===f.tick;
    if(flap)ghost.cursor++;
    stepFlight(f,flap);ghost.done=f.dead||f.tick>=ghost.end;
  }

  // Separate local careers. The legacy key mirrors the active career for migration.
  function normalizeCampaign(raw) {
    const cleared=[];for(const b of BOSSES){if(!Array.isArray(raw?.cleared)||!raw.cleared.includes(b.region))break;cleared.push(b.region);}
    return {cleared,clears:Object.fromEntries(REGIONS.map(r=>[r.id,cleared.includes(r.id)?Math.max(1,int(raw?.clears?.[r.id])):0])),bestTimes:Object.fromEntries(REGIONS.map(r=>[r.id,cleared.includes(r.id)?int(raw?.bestTimes?.[r.id],120000):0]))};
  }
  function normalizePlayers(raw) {
    if(!raw||raw.version!==1||!Array.isArray(raw.entries)||raw.entries.length<1||raw.entries.length>8)throw Error('Perfis inválidos.');
    const entries=raw.entries.map(e=>{
      if(!e||typeof e.id!=='string'||!/^[a-zA-Z0-9_-]{1,60}$/.test(e.id)||!cleanName(e.name)||!e.profile||e.profile.version!==VERSION)throw Error('Perfil inválido.');
      return {id:e.id,name:cleanName(e.name),profile:normalize(e.profile)};
    });
    if(new Set(entries.map(e=>e.id)).size!==entries.length||new Set(entries.map(e=>e.name.toLocaleLowerCase('pt-BR'))).size!==entries.length)throw Error('Perfis repetidos.');
    return {version:1,activeId:entries.some(e=>e.id===raw.activeId)?raw.activeId:entries[0].id,entries};
  }
  function loadPlayers(legacy) {
    const saved=safeGet(PLAYERS_KEY);
    if(saved)try{return normalizePlayers(JSON.parse(saved));}catch{loadNotice='A lista de perfis não pôde ser lida. O último perfil salvo foi recuperado.';}
    return {version:1,activeId:'player-1',entries:[{id:'player-1',name:legacy.nickname||'Jogador',profile:legacy}]};
  }
  function syncActiveProfile() { const entry=players.entries.find(e=>e.id===players.activeId);if(entry)entry.profile=profile; }
  function profileBusy() {return ['playing','paused','countdown','replay'].includes(state);}
  function renderProfileBadge() {
    $('activeProfileName').textContent=players.entries.find(e=>e.id===players.activeId)?.name||profile.nickname;
  }
  function renderProfiles() {
    syncActiveProfile();renderProfileBadge();
    $('profileList').innerHTML=players.entries.map(e=>`<article class="local-profile ${e.id===players.activeId?'selected':''}"><div><strong>${escapeHTML(e.name)}</strong><small>Nível ${getLevel(e.profile.xp).level} · ${e.profile.owned.length} skins · ${number(e.profile.wallet)} ◎ · ${e.profile.campaign.cleared.length}/8 guardiões</small></div><button class="button ${e.id===players.activeId?'equipped-button':'secondary'}" data-profile="${e.id}" ${e.id===players.activeId?'disabled':''}>${e.id===players.activeId?'Em uso':'Usar perfil'}</button></article>`).join('');
    $('profileRename').value=players.entries.find(e=>e.id===players.activeId).name;
    $('createProfile').disabled=players.entries.length>=8;
    $('profileStatus').textContent=profileBusy()?'Encerre a partida para criar ou trocar de perfil.':`${players.entries.length}/8 perfis. Cada um tem seu próprio progresso.`;
  }
  function switchProfile(id,keepView=true) {
    if(profileBusy()){toast('Há uma partida em andamento.','Encerre a partida antes de trocar de perfil.');return false;}
    const entry=players.entries.find(e=>e.id===id);if(!entry)return false;
    syncActiveProfile();players.activeId=id;profile=entry.profile;
    state='menu';run=null;duel=null;ghost=null;bossFight=null;review=null;playback=null;flightFrames=[];particles=[];floaters=[];
    $('playerNickname').value=profile.nickname;checkAchievements(false);save();applySettings();updateProgressUI();renderOverlay();renderProfiles();
    if(view==='arena')renderArena();if(view==='campaign')renderCampaign();if(!keepView)setView('play');return true;
  }
  function createProfile() {
    if(profileBusy()||players.entries.length>=8){$('profileStatus').textContent='Encerre a partida. Há espaço para até 8 perfis.';return;}
    const name=cleanName($('newProfileName').value);
    if(!name||players.entries.some(e=>e.name.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR'))){$('profileStatus').textContent='Digite um nome que ainda não esteja em uso.';return;}
    let id;do{id=`p-${randomSeed().toString(36)}-${Date.now().toString(36)}`;}while(players.entries.some(e=>e.id===id));
    syncActiveProfile();players.entries.push({id,name,profile:normalize({nickname:name})});switchProfile(id);$('newProfileName').value='';renderProfiles();
  }
  function renameProfile() {
    if(profileBusy()){$('profileStatus').textContent='Encerre a partida para renomear o perfil.';return;}
    const name=cleanName($('profileRename').value),entry=players.entries.find(e=>e.id===players.activeId);
    if(!name||players.entries.some(e=>e.id!==entry.id&&e.name.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR'))){$('profileStatus').textContent='Escolha um nome diferente dos demais perfis.';return;}
    entry.name=name;profile.nickname=name;$('playerNickname').value=name;save();renderProfiles();renderArena();
  }
  function forgeData(p,id) {return p.forge[id]||{level:1,mastery:0};}
  function skinLoadout(p,id) {return {id,level:forgeData(p,id).level,family:skinById(id).family};}
  function gainMastery(p,id,amount) {
    if(!p.owned.includes(id)||amount<=0)return;
    const f=p.forge[id]||(p.forge[id]={level:1,mastery:0});f.mastery=Math.min(1e9,f.mastery+Math.floor(amount));
  }
  function perkText(skin,level=1) {
    const n=Math.max(1,Math.min(5,level));
    return ({precision:`Margem de colisão +${(n*.25).toLocaleString('pt-BR')} px no solo e nos chefes.`,magnet:`Alcance de coleta +${(n*1.5).toLocaleString('pt-BR')} px no solo.`,collector:`+1 moeda a cada ${22-n*2} canos no solo.`,scholar:`+${3+n*2}% de XP de ações no solo.`,fortitude:`Recebe ${n*3}% menos dano dos chefes.`,striker:`Causa ${n*4}% mais dano aos chefes.`,focus:`Recarga da proteção dos chefes ${n*3}% mais rápida.`,vitality:`+${n*3} pontos de vida contra chefes.`})[skin.family];
  }
  function upgradeSkin(id) {
    const skin=SKINS.find(s=>s.id===id);if(!skin||!profile.owned.includes(id))return;
    const f=forgeData(profile,id);if(f.level>=5)return;
    const mastery=EVOLUTION_XP[f.level],cost=EVOLUTION_COST[f.level-1];
    if(f.mastery<mastery||profile.wallet<cost){toast('Esta evolução exige prática e moedas.',`${number(mastery)} de domínio com ${skin.name} + ${number(cost)} moedas.`);return;}
    profile.wallet-=cost;profile.forge[id]={level:f.level+1,mastery:f.mastery};save();updateProgressUI();renderShop();toast(`${skin.name}: evolução ${f.level+1}/5!`,perkText(skin,f.level+1));
  }
  function arenaSkinReady(skin,p) {const u=skin.unlock,s=p.stats;return s.duelWins>=u.wins&&s.duelQualified>=u.matches&&s.duelBest>=u.best&&s.duelBestStreak>=u.streak&&s.chaosWins>=u.chaos;}
  function arenaSkinText(skin) {const u=skin.unlock;return `${u.wins} vitórias qualificadas · ${u.matches} X1 qualificados · recorde X1 ${u.best}${u.streak?' · sequência '+u.streak:''}${u.chaos?' · '+u.chaos+' vitórias no caos':''}`;}
  function canBuySkin(s,p=profile) {return s.price>0&&p.wallet>=s.price&&getLevel(p.xp).level>=s.storeLevel&&p.best>=s.storeBest;}
  function renderShop() {
    $('collectionCount').textContent=profile.owned.length;$('collectionTotal').textContent=SKINS.length;
    const percent=Math.round(profile.owned.length/SKINS.length*100);$('collectionBar').style.width=`${percent}%`;$('collectionPercent').textContent=`${percent}% da coleção`;
    const items=SKINS.filter(s=>filter==='all'||(filter==='owned'?profile.owned.includes(s.id):filter==='locked'?!profile.owned.includes(s.id):filter==='coins'?s.price>0:s.unlock?.type===filter));
    $('skinGrid').innerHTML=items.length?items.map(s=>{
      const owned=profile.owned.includes(s.id),equipped=profile.equipped===s.id,f=forgeData(profile,s.id),buy=canBuySkin(s);
      const badge=equipped?'EM USO':owned?'NA COLEÇÃO':s.unlock?.type==='arena'?'COMPETITIVA':s.unlock?.type==='level'?'POR NÍVEL':s.unlock?'PROGRESSO':`${number(s.price)} ◎`;
      const upgrade=owned?(f.level>=5?'<div class="evolution-max">EVOLUÇÃO V · SELO FINAL LIBERADO</div>':`<div class="forge-progress"><span>Domínio ${number(f.mastery)} / ${number(EVOLUTION_XP[f.level])}</span><div class="progress-track"><i style="width:${Math.min(100,f.mastery/EVOLUTION_XP[f.level]*100)}%"></i></div><button class="button forge-button" data-upgrade="${s.id}" ${f.mastery<EVOLUTION_XP[f.level]||profile.wallet<EVOLUTION_COST[f.level-1]?'disabled':''}>Evoluir para ${f.level+1}/5 · ${number(EVOLUTION_COST[f.level-1])} ◎</button></div>`):'';
      const label=equipped?'Equipada':owned?'Equipar':buy?`Comprar · ${number(s.price)} ◎`:s.unlock?'Cumpra os requisitos':getLevel(profile.xp).level<s.storeLevel||profile.best<s.storeBest?`Exige nível ${s.storeLevel} e recorde ${s.storeBest}`:`Faltam ${number(s.price-profile.wallet)} ◎`;
      return `<article class="skin-card ${equipped?'equipped':''}" style="--skin-accent:${RARITY[s.rarity]};--skin-glow:${s.accent}20"><div class="skin-top"><span class="rarity-label">${s.rarity.toLocaleUpperCase('pt-BR')}</span><span class="skin-badge">${badge}</span></div><div class="skin-preview"><canvas width="280" height="150" data-skin-preview="${s.id}" aria-label="${s.name}"></canvas></div><h3>${s.name}</h3><p>${s.description}</p><div class="skin-perk"><strong>${FAMILY_NAMES[s.family]} · evolução ${f.level}/5</strong><span>${perkText(s,f.level)}</span><small>Chefes: ${Math.round([12,15,19,24,30][f.level-1]*(s.family==='striker'?1+f.level*.04:1))} dano base por acerto. Atributos normalizados no X1.</small></div><div class="skin-requirement">${skinRequirement(s)}</div><button class="button ${equipped?'equipped-button':owned?'secondary':'primary'}" data-skin="${s.id}" ${equipped||(!owned&&!buy)?'disabled':''}>${label}</button>${upgrade}</article>`;
    }).join(''):'<div class="empty-state"><h2>Você completou a coleção!</h2><p>Novos desafios esperam nos guardiões e na arena.</p></div>';
    document.querySelectorAll('[data-skin-preview]').forEach(c=>drawBird(c.getContext('2d'),skinById(c.dataset.skinPreview),136,75,54,-.08,0));
    $('competitiveProgress').innerHTML=`<strong>SEU HISTÓRICO DO X1</strong><span>${profile.stats.duelWins} vitórias qualificadas · ${profile.stats.duelQualified} duelos qualificados · recorde ${profile.stats.duelBest} · melhor sequência ${profile.stats.duelBestStreak} · ${profile.stats.chaosWins} vitórias no caos</span><small>Um duelo qualificado exige 15+ pontos, 25s de voo e 30 saltos de cada jogador. As skins competitivas exigem todos os requisitos mostrados.</small>`;
  }
  function renderDuelSkins() {
    syncActiveProfile();
    for(const i of [1,2]){
      const select=$(`duelProfile${i}`),old=select.value;
      select.innerHTML=players.entries.map(p=>`<option value="${p.id}">${escapeHTML(p.name)}</option>`).join('');
      select.value=players.entries.some(p=>p.id===old)?old:i===1?players.activeId:players.entries.find(p=>p.id!==$('duelProfile1').value)?.id||players.activeId;
      const entry=players.entries.find(p=>p.id===select.value),el=$(`duelSkin${i}`),skin=el.value;
      el.innerHTML=entry.profile.owned.map(id=>`<option value="${id}">${skinById(id).name} · ${forgeData(entry.profile,id).level}/5</option>`).join('');el.value=entry.profile.owned.includes(skin)?skin:entry.profile.equipped;
    }
  }
  function startDuel(rematch=false) {
    if(!canStartCompetition())return;
    syncActiveProfile();
    const selected=rematch&&duel?duel.players:[1,2].map(i=>{const entry=players.entries.find(p=>p.id===$(`duelProfile${i}`).value);if(!entry)return null;return {id:entry.id,name:entry.name,skin:entry.profile.owned.includes($(`duelSkin${i}`).value)?$(`duelSkin${i}`).value:entry.profile.equipped,power:$(`duelPower${i}`).value||'shield'};});
    if(selected.some(p=>!p)||selected[0].id===selected[1].id){$('duelStatus').textContent='Escolha dois perfis diferentes. Crie o segundo perfil em Perfis.';return;}
    const wins=duel&&duel.players.every((p,i)=>p.id===selected[i].id)?[...duel.wins]:[0,0],chaotic=rematch&&duel?duel.chaotic:$('chaosMode').checked;
    const seed=randomSeed();prepareFlight({mode:'duel',seed,player:selected[0].name});
    duel={players:selected,wins,chaotic,second:Object.assign(makeFlight(seed,true),{mode:'duel',xp:0,bonusCoins:0}),result:null,cooldowns:[360,360],hazards:[],metrics:[{},{}],settled:false,payouts:[],notices:['','']};
    flightFrames=[];captureFlightFrame(true);renderOverlay();
  }
  function syncChaosHUD() {
    const active=run?.mode==='duel'&&duel?.chaotic;
    for(const i of [0,1]){
      const el=$(`powerP${i+1}`);el.hidden=!active||state==='replay';
      if(active){const f=i?duel.second:run,left=Math.max(0,Math.ceil((duel.cooldowns[i]-Math.max(run.tick,duel.second.tick))/120));el.disabled=state!=='playing'||f.dead||(i?run:duel.second).dead||left>0;el.textContent=left?`PODER · ${left}s`:`${CHAOS_POWERS[duel.players[i].power].name} · ${i?'←':'A'}`;}
    }
    for(const i of [0,1]){const f=i?duel?.second:run,jump=$(`jumpP${i+1}`),reversed=active&&f?.invertedUntil>f.tick,left=active?Math.max(0,Math.ceil((duel.cooldowns[i]-Math.max(run.tick,duel.second.tick))/120)):0;jump.disabled=state==='paused'||state==='countdown'||(reversed&&(left>0||f.dead||(i?run:duel.second).dead));jump.textContent=reversed?`PODER · ${i?'↑':'W'}`:`P${i+1} · ${i?'↑':'W'}`;if(reversed){const power=$(`powerP${i+1}`);power.disabled=state!=='playing'||f.dead;power.textContent=`PULAR · ${i?'←':'A'}`;}}
    if(active&&state!=='replay'){
      $('difficultyLabel').textContent='X1 CAÓTICO';
      $('obstacleHint').textContent=duel.notices.filter(Boolean).join(' · ')||'P1: W pula / A poder · P2: ↑ pula / ← poder';
    }
  }
  function duelJumpKey(index){const f=index?duel?.second:run;return f?.invertedUntil>f.tick?(index?'←':'A'):(index?'↑':'W');}
  function duelInput(index,power=false){const f=index?duel?.second:run;if(power!==(f?.invertedUntil>f?.tick))useChaosPower(index);else action(index);}
  function useChaosPower(index) {
    if(state!=='playing'||!duel?.chaotic)return;
    const tick=Math.max(run.tick,duel.second.tick),self=index?duel.second:run,other=index?run:duel.second;
    if(self.dead||other.dead||tick<duel.cooldowns[index])return;
    const key=duel.players[index].power;duel.cooldowns[index]=tick+2160;
    if(key==='shield'){self.shieldUntil=tick+360;duel.notices[index]='ESCUDO · 1 IMPACTO';}
    else duel.hazards.push({type:key,target:1-index,start:tick+120,end:tick+(key==='wind'?420:key==='invert'?360:600),y:clamp(other.bird.y+15,90,580),x:W+30,applied:false,hit:false});
    playSound('coin');syncHUD();
  }
  function updateChaos() {
    if(!duel?.chaotic)return;
    const tick=Math.max(run.tick,duel.second.tick);duel.notices=['',''];
    for(const h of duel.hazards){
      const f=h.target?duel.second:run;if(f.dead)continue;
      if(tick<h.start){duel.notices[h.target]=`${h.type==='wind'?'TURBULÊNCIA':h.type==='invert'?'TROCA DE COMANDOS':'METEORO'} EM ${((h.start-tick)/120).toFixed(1)}s`;continue;}
      if(h.type==='wind'){if(!h.applied){f.windUntil=h.end;h.applied=true;}if(tick<h.end)duel.notices[h.target]='TURBULÊNCIA · GRAVIDADE +8%';}
      else if(h.type==='invert'){if(!h.applied){f.invertedUntil=h.end;h.applied=true;}if(tick<h.end)duel.notices[h.target]=`COMANDOS TROCADOS · PULE COM ${h.target?'←':'A'}`;}
      else if(!h.hit){h.x-=250*STEP;duel.notices[h.target]='DESVIE DO METEORO';const b=f.bird;if(Math.abs(h.x-b.x-b.size/2)<25&&Math.abs(h.y-b.y-b.size/2)<24){h.hit=true;if(f.invulnerableUntil>f.tick)continue;if(f.shieldUntil>f.tick){f.shieldUntil=0;f.invulnerableUntil=f.tick+108;}else{f.dead=true;f.deadReason='collision';f.impact={kind:'meteor',x:h.x,y:h.y,edge:'side'};}}}
    }
    duel.hazards=duel.hazards.filter(h=>tick<h.end&&h.x>-30&&!h.hit);
  }
  function accumulateMetrics(out,f) {
    const max=(key,value)=>out[key]=Math.max(out[key]||0,value);
    max('bestCombo',f.bestCombo);max('bestRunCoins',f.coins);max('bestMovingPassed',f.movingPassed);max('bestMovingCoins',f.movingCoins);
    if(!f.missed){max('perfectBest',f.score);max('arenaPerfectBest',f.score);}if(!f.picked)max('noPickupBest',f.score);if(!f.ceilingTouches)max('cleanCeilingBest',f.score);
    if(f.inputs.length<=100)max('economy30',Math.min(30,f.score));if(f.inputs.length<=180)max('economy60',Math.min(60,f.score));if(f.missed>=3&&f.score>=25)max('recoveryBest',f.streak);if(f.score>=50)max('splitChainsBest',f.longChains);
  }
  function settleDuel(reason,compare) {
    if(duel.settled)return;duel.settled=true;syncActiveProfile();
    const original=profile,qualified=reason!=='quit'&&[run,duel.second].every(f=>f.score>=15&&f.elapsed>=25&&f.inputs.length>=30);
    duel.qualified=qualified;
    for(const [i,f] of [run,duel.second].entries()){
      const entry=players.entries.find(e=>e.id===duel.players[i].id);if(!entry)continue;
      profile=entry.profile;const before=profile.wallet,beforeXP=profile.xp,s=profile.stats;
      profile.wallet+=f.coins;s.coinsCollected+=f.coins;s.passed+=f.score;s.flights++;profile.best=Math.max(profile.best,f.score);
      profile.xp=Math.min(20000,profile.xp+f.score*5+f.picked*2);gainMastery(profile,duel.players[i].skin,f.score);
      for(const [key,val] of Object.entries(duel.metrics[i]))s[key]=Math.max(s[key],val);
      s.duelBest=Math.max(s.duelBest,f.score);s.arenaBest=Math.max(s.arenaBest,f.score);
      if(f.score>=25)s.qualifiedFlights++;if(f.score>=40){s.expertFlights++;s.competitiveFinishes++;}
      if(reason!=='quit')s.duelMatches++;
      if(qualified){s.duelQualified++;if(duel.chaotic)s.chaosQualified++;const won=compare!==0&&(compare>0?0:1)===i;if(won){s.duelWins++;s.duelStreak++;s.duelBestStreak=Math.max(s.duelBestStreak,s.duelStreak);if(duel.chaotic)s.chaosWins++;}else s.duelStreak=0;}
      checkAchievements(false);entry.profile=profile;duel.payouts.push({coins:profile.wallet-before,xp:profile.xp-beforeXP});
    }
    profile=original;save();updateProgressUI();
  }
  function campaignRequirement(index,p=profile) {
    const b=BOSSES[index],f=forgeData(p,p.equipped),requirements=[];
    if(index&&BOSSES.slice(0,index).some(b=>!p.campaign.cleared.includes(b.region)))requirements.push(`Vença os guardiões anteriores, até ${BOSSES[index-1].name}`);
    if(p.best<b.best)requirements.push(`Recorde ${b.best}`);if(getLevel(p.xp).level<b.level)requirements.push(`Nível ${b.level}`);if(f.level<b.evolution)requirements.push(`Skin equipada na evolução ${b.evolution}/5`);
    return requirements;
  }
  function renderCampaign() {
    const cleared=profile.campaign.cleared.length,skin=skinById(profile.equipped),f=forgeData(profile,skin.id);
    $('campaignSummary').innerHTML=`<span class="eyebrow">${cleared===8?'JORNADA CONCLUÍDA':'CADA SELO EXIGE PREPARO'}</span><h2>${cleared===8?'Você libertou o horizonte.':`${cleared} de 8 guardiões vencidos`}</h2><p>${cleared===8?'Os oito selos foram rompidos. Sua carreira continua na arena e na coleção.':'Os guardiões exigem nível, recorde e evolução da skin equipada. O último exige evolução V.'}</p><div class="campaign-loadout"><strong>${skin.name} · evolução ${f.level}/5</strong><span>${perkText(skin,f.level)}</span><button class="text-button" data-view="shop">Evoluir ou trocar skin ↗</button></div>`;
    $('bossGrid').innerHTML=BOSSES.map((b,i)=>{const r=REGIONS[i],done=profile.campaign.cleared.includes(r.id),needs=campaignRequirement(i);return `<article class="panel boss-card ${done?'cleared':''}" style="--boss-accent:${r.colors[6]}"><div class="boss-card-heading"><span>${r.symbol}</span><strong>${done?'SELO ROMPIDO':`GUARDIÃO ${i+1}/8`}</strong></div><canvas width="280" height="120" data-boss-preview="${i}" aria-label="${b.name}"></canvas><span class="eyebrow">${r.name}</span><h3>${b.name}</h3><p>${b.hint}</p><div class="boss-requirements">Nível ${b.level} · recorde ${b.best} · evolução ${b.evolution}/5<br>${b.hp} vida · ${b.duration}s · primeira vitória +${number(b.reward)} ◎</div><small>${done?`${profile.campaign.clears[r.id]||1} vitórias · repetição: ${Math.floor(b.reward*.22)} ◎`:needs.length?needs.join(' · '):'Preparação concluída. Aprenda o padrão e enfrente.'}</small><button class="button ${needs.length?'secondary':'primary'}" data-boss="${i}" ${needs.length?'disabled':''}>${done?'Enfrentar novamente':'Enfrentar guardião'} ↗</button></article>`;}).join('');
    document.querySelectorAll('[data-boss-preview]').forEach(c=>{const b=BOSSES[Number(c.dataset.bossPreview)],r=REGIONS[Number(c.dataset.bossPreview)];drawBird(c.getContext('2d'),{...skinById('dragon'),color:r.colors[6],shade:r.colors[4],wing:r.colors[3],accent:'#fff0ba',pattern:b.pattern},138,65,62,-.08,0);});
  }
  function makeBossFight(index,loadout,seed=1) {
    const spec=BOSSES[index],f=makeFlight(seed,false);f.pipes=[];f.mode='boss';f.loadout={...loadout};f.skinId=loadout.id;f.xp=0;f.bonusCoins=0;f.finished=false;f.reason='';
    const maxHP=100+(loadout.family==='vitality'?loadout.level*3:0);
    return {index,flight:f,hp:maxHP,maxHP,bossHP:spec.hp,maxBossHP:spec.hp,y:310,phase:1,open:false,shots:[],attacks:[],elapsed:0,lastShot:-100,nextAttack:240,guardReady:0,guardUntil:0,invulnerableUntil:0,damage:0,landed:0,done:false,outcome:'',reward:0,xp:0,first:false};
  }
  function bossHurt(b,damage) {
    const t=b.flight.tick;if(t<b.invulnerableUntil)return;
    if(t<b.guardUntil){b.guardUntil=0;b.invulnerableUntil=t+90;return;}
    const l=b.flight.loadout;b.hp=Math.max(0,b.hp-damage*(l.family==='fortitude'?1-l.level*.03:1));b.invulnerableUntil=t+84;
  }
  function queueBossAttack(b) {
    const i=b.index,clock=b.flight.tick,aim=clamp(b.flight.bird.y+15,110,570),phase=b.phase;
    const kind=i===0?'aim':i===1?'walls':i===2?'fan':i===3?'wave':i===4?'laser':i===5?'rain':i===6?(Math.floor(clock/240)%2?'laser':'fan'):['walls','laser','rain'][(Math.floor(clock/240)+phase)%3];
    const start=clock+132;
    if(kind==='walls')for(const y of [clamp(aim-125,60,590),clamp(aim+125,60,590)])b.attacks.push({kind:'orb',start,end:start+540,x:W+30,y,vy:0,size:20,vx:-(215+i*5)});
    else if(kind==='fan')for(const vy of [-70,0,70])b.attacks.push({kind:'orb',start,end:start+540,x:465,y:b.y,vy,size:12,vx:-240});
    else if(kind==='rain')for(const offset of [0,135,270])b.attacks.push({kind:'rain',start:start+offset/3,end:start+650,x:230+offset,y:20,vy:240,size:15,vx:-65});
    else if(kind==='laser'||kind==='wave')b.attacks.push({kind:'laser',start,end:start+105,x:0,y:kind==='wave'?clamp(320+Math.sin(clock*.004)*155,120,560):aim,vy:0,size:kind==='wave'?22:17,vx:0});
    else b.attacks.push({kind:'orb',start,end:start+540,x:W+25,y:aim,vy:0,size:18,vx:-225});
    b.nextAttack=clock+Math.max(245,370-i*10-(phase-1)*20);
  }
  function stepBoss(b,flap=false) {
    if(b.done)return;
    const f=b.flight,body=f.bird,spec=BOSSES[b.index],l=f.loadout;
    if(flap){body.vy=-420;f.inputs.push(f.tick);}f.tick++;f.elapsed=f.tick*STEP;b.elapsed=f.elapsed;f.distance+=90*STEP;
    body.vy=Math.min(700,body.vy+1440*STEP);body.y+=body.vy*STEP;
    if(body.y<8){body.y=8;body.vy=0;}if(body.y+body.size-4>=GROUND){body.y=GROUND-body.size;body.vy=-360;bossHurt(b,20);}
    b.phase=b.bossHP<=b.maxBossHP*.33?3:b.bossHP<=b.maxBossHP*.66?2:1;
    b.y=310+Math.sin(b.elapsed*(.48+b.index*.025))*135+Math.sin(b.elapsed*.27+b.index)*32;
    const cycle=b.elapsed%6;b.open=cycle>=1.7&&cycle<=4.7;
    if(f.tick-b.lastShot>=54){b.lastShot=f.tick;b.shots.push({x:body.x+30,y:body.y+15});}
    const dmg=[12,15,19,24,30][l.level-1]*(l.family==='striker'?1+l.level*.04:1);
    for(const shot of b.shots){shot.x+=460*STEP;if(shot.x>=438&&shot.x<465){if(b.open&&Math.abs(shot.y-b.y)<43){const dealt=Math.min(b.bossHP,dmg);b.bossHP-=dealt;b.damage+=dealt;b.landed++;}shot.x=W+100;}}
    b.shots=b.shots.filter(s=>s.x<W+50);
    if(f.tick>=b.nextAttack)queueBossAttack(b);
    const inset=5+(l.family==='precision'?l.level*.25:0),cx=body.x+15,cy=body.y+15;
    for(const a of b.attacks){if(f.tick<a.start)continue;
      if(a.kind==='laser'){if(Math.abs(cy-a.y)<a.size+15-inset)bossHurt(b,26+b.index);}
      else {a.x+=a.vx*STEP;a.y+=a.vy*STEP;if(Math.abs(a.x-cx)<a.size+15-inset&&Math.abs(a.y-cy)<a.size+15-inset){bossHurt(b,23+b.index);a.end=0;}}
    }
    b.attacks=b.attacks.filter(a=>f.tick<a.end&&a.x>-40&&a.y<GROUND+40);
    if(b.bossHP<=0){b.done=true;b.outcome='victory';}else if(b.hp<=0){b.done=true;b.outcome='defeat';}else if(b.elapsed>=spec.duration){b.done=true;b.outcome='time';}
  }
  function startBoss(index) {
    if(!Number.isInteger(index)||!BOSSES[index]||!canStartCompetition())return;
    const needs=campaignRequirement(index);if(needs.length){toast('Prepare-se para este guardião.',needs.join(' · '));return;}
    prepareFlight({mode:'boss',player:profile.nickname});bossFight=makeBossFight(index,skinLoadout(profile,profile.equipped),run.seed);run=bossFight.flight;run.bestAtStart=profile.best;bird=run.bird;renderOverlay();renderJourney();
  }
  function useBossGuard() {
    if(state!=='playing'||run?.mode!=='boss'||!bossFight||run.tick<bossFight.guardReady)return;
    const l=run.loadout;bossFight.guardUntil=run.tick+240;bossFight.guardReady=run.tick+Math.round(2400*(l.family==='focus'?1-l.level*.03:1));playSound('coin');syncHUD();
  }
  function updateBoss() {
    stepBoss(bossFight,run.pendingFlap);run.pendingFlap=false;
    if(run.tick%12===0)syncHUD();if(bossFight.done)finishBoss(bossFight.outcome);
  }
  function finishBoss(reason) {
    if(!bossFight||run.finished)return;
    if(reason==='victory'&&(!bossFight.done||bossFight.outcome!=='victory'||bossFight.bossHP>0))return;
    run.finished=true;run.reason=reason;state='over';const b=bossFight,spec=BOSSES[b.index];
    b.outcome=reason;
    if(reason==='victory'){
      b.first=!profile.campaign.cleared.includes(spec.region);
      if(b.first)profile.campaign.cleared.push(spec.region);
      profile.campaign.clears[spec.region]=(profile.campaign.clears[spec.region]||0)+1;
      const old=profile.campaign.bestTimes[spec.region];profile.campaign.bestTimes[spec.region]=old?Math.min(old,run.tick):run.tick;
      b.reward=b.first?spec.reward:Math.floor(spec.reward*.22);b.xp=b.first?180+b.index*70:60+b.index*20;
      profile.wallet+=b.reward;addXP(b.xp);gainMastery(profile,run.skinId,100+b.index*15);playSound('achievement');
    }else gainMastery(profile,run.skinId,Math.floor(b.damage/8));
    save();updateProgressUI();renderOverlay();
  }
  function renderBossOverlay(overlay) {
    const b=bossFight,spec=BOSSES[b.index];overlay.classList.add('dim');
    if(state==='ready')overlay.innerHTML=`<div class="result-card"><span class="result-icon">${REGIONS[b.index].symbol}</span><div class="eyebrow">GUARDIÃO ${b.index+1}/8 · ${REGIONS[b.index].name}</div><h2>${spec.name}</h2><p class="impact-note">${spec.hint}<br><br>Seus disparos são automáticos. Alinhe-se ao círculo quando ele acender. Use E ou Proteção para absorver um impacto.</p><div class="boss-ready-stats">${skinById(run.skinId).name} · evolução ${run.loadout.level}/5<br>${Math.round(b.maxHP)} vida · ${spec.duration}s para vencer</div><button class="button primary" data-action="boss-go">Enfrentar guardião ↗</button><button class="button secondary" data-view="campaign">Voltar aos guardiões</button></div>`;
    else if(state==='over'){
      const won=b.outcome==='victory',ending=won&&profile.campaign.cleared.length===8;
      overlay.innerHTML=`<div class="result-card"><span class="result-icon">${ending?'♛':won?'✓':'↻'}</span><div class="eyebrow">${ending?'OS OITO SELOS FORAM ROMPIDOS':won?'GUARDIÃO VENCIDO':b.outcome==='time'?'TEMPO ESGOTADO':'APRENDA O PRÓXIMO MOVIMENTO'}</div><h2>${ending?'Você zerou Cube Bird!':won?`${spec.name} caiu.`:'O guardião resistiu.'}</h2><p class="impact-note">${ending?'O horizonte está livre. Sua persistência, sua skin e seu domínio romperam o último selo.':won?'A próxima região espera por você.':spec.hint}</p><div class="run-breakdown"><div><span>Dano causado</span><strong>${Math.round(b.damage)} / ${spec.hp}</strong></div><div><span>Recompensa</span><strong>+${b.reward} ◎ · +${run.xp} XP</strong></div><div><span>Guardiões vencidos</span><strong>${profile.campaign.cleared.length}/8</strong></div></div><button class="button primary" data-view="campaign">${ending?'Ver jornada concluída':'Ver jornada / próximo guardião'} ↗</button><button class="button secondary" data-boss="${b.index}">Enfrentar novamente</button><button class="text-button" data-view="shop">Evoluir skin</button></div>`;
    }
  }
  function syncBossHUD() {
    const bossMode=run?.mode==='boss'&&!!bossFight;
    $('bossHud').hidden=!bossMode;
    $('bossSkill').hidden=!bossMode;
    if(!bossMode)return;
    const b=bossFight,spec=BOSSES[b.index];$('gameHud').hidden=true;$('competitionStrip').hidden=false;$('competitionStrip').textContent=`GUARDIÃO ${b.index+1}/8 · ${spec.name} · ${Math.max(0,Math.ceil(spec.duration-b.elapsed))}s`;
    $('difficultyLabel').textContent=`FASE ${b.phase} · ${b.open?'NÚCLEO ABERTO':'AGUARDE O NÚCLEO'}`;$('obstacleHint').textContent=spec.hint;$('gameInstructions').innerHTML='<kbd>ESPAÇO</kbd> voa · <kbd>E</kbd> protege';
    $('bossHud').innerHTML=`<div><span>VOCÊ · ${Math.ceil(b.hp)}/${b.maxHP}</span><i><b style="width:${b.hp/b.maxHP*100}%"></b></i></div><div><span>${spec.name} · ${Math.ceil(b.bossHP)}/${b.maxBossHP}</span><i><b style="width:${b.bossHP/b.maxBossHP*100}%"></b></i></div>`;
    const left=Math.max(0,Math.ceil((b.guardReady-run.tick)/120));$('bossSkill').disabled=state!=='playing'||left>0;$('bossSkill').textContent=left?`PROTEÇÃO · ${left}s`:'PROTEÇÃO · E';
    $('regionMarker').textContent=`${String(b.index+1).padStart(2,'0')} · ${REGIONS[b.index].name.toLocaleUpperCase('pt-BR')}`;
  }
  function drawBossScene() {
    const b=bossFight,f=run,spec=BOSSES[b.index],region=REGIONS[b.index];drawBackground(ctx,ambient,f.distance,region);
    for(const a of b.attacks){
      const warning=f.tick<a.start;ctx.save();ctx.fillStyle=warning?'#ffd992':'#ff8f80';ctx.strokeStyle=warning?'#ffd992':'#ff8f80';
      if(a.kind==='laser'){
        ctx.globalAlpha=warning?.14:.7;ctx.fillRect(0,a.y-a.size,W,a.size*2);ctx.globalAlpha=warning?.8:1;ctx.setLineDash(warning?[8,9]:[]);ctx.beginPath();ctx.moveTo(0,a.y);ctx.lineTo(W,a.y);ctx.stroke();
      }else if(warning){ctx.globalAlpha=.55;ctx.setLineDash([6,9]);ctx.beginPath();if(a.kind==='rain'){ctx.moveTo(a.x,0);ctx.lineTo(a.x-170,GROUND);}else{ctx.moveTo(0,a.y);ctx.lineTo(W,a.y);}ctx.stroke();}
      else {ctx.beginPath();ctx.moveTo(a.x,a.y-a.size);ctx.lineTo(a.x+a.size,a.y);ctx.lineTo(a.x,a.y+a.size);ctx.lineTo(a.x-a.size,a.y);ctx.closePath();ctx.fill();}
      ctx.restore();
    }
    for(const shot of b.shots){ctx.fillStyle='#e4ffa9';ctx.fillRect(shot.x-7,shot.y-2,13,4);}
    const bossSkin={...skinById('dragon'),color:region.colors[6],shade:region.colors[4],wing:region.colors[3],accent:'#fff0ba',pattern:spec.pattern};
    drawBird(ctx,bossSkin,470,b.y,68,-.12,b.elapsed);ctx.strokeStyle=b.open?'#f9edaa':'#7795a1';ctx.lineWidth=b.open?4:2;ctx.beginPath();ctx.arc(448,b.y,43,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle=b.open?'#fff3aa':'#bbd1d7';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText(b.open?'ATAQUE O NÚCLEO':'NÚCLEO PROTEGIDO',440,b.y-57);
    const body=f.bird;ctx.save();if(run.tick<b.invulnerableUntil)ctx.globalAlpha=.55;drawBird(ctx,skinById(run.skinId),body.x+15,body.y+15,30,clamp(body.vy*.001,-.32,1.1),b.elapsed);ctx.restore();
    if(run.tick<b.guardUntil){ctx.strokeStyle='#a9eaff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(body.x+15,body.y+15,27,0,Math.PI*2);ctx.stroke();}
    ctx.lineWidth=1;
  }
  function drawChaos(f,second,snapshot=null) {
    if(!duel?.chaotic)return;
    for(const [i,b] of [f,second].entries())if(b.shieldUntil>b.tick){ctx.strokeStyle=i?'#9ce5ff':'#ddf594';ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.bird.x+15,b.bird.y+15,26,0,Math.PI*2);ctx.stroke();}
    const tick=Math.max(f.tick,second.tick);
    for(const h of (snapshot?.hazards||duel.hazards)){ctx.save();ctx.fillStyle=h.target?'#a9e5ff':'#e0f8a5';ctx.strokeStyle=ctx.fillStyle;if(tick<h.start){ctx.globalAlpha=.35;ctx.setLineDash([6,8]);ctx.beginPath();ctx.moveTo(0,h.y);ctx.lineTo(W,h.y);ctx.stroke();}else if(h.type==='meteor'){ctx.fillRect(h.x-13,h.y-13,26,26);ctx.fillStyle='#fff1be';ctx.fillRect(h.x-5,h.y-5,10,10);}ctx.restore();}
  }

  function emit(x, y, count, color, force) {
    if (profile.settings.reduceMotion) return;
    for (let i = 0; i < count; i++) particles.push({x,y,vx:(Math.random()-.5)*force,vy:(Math.random()-.6)*force,life:.4+Math.random()*.4,color,size:2+Math.random()*4});
    if (particles.length > 120) particles.splice(0, particles.length - 120);
  }
  function drawSparkle(c, x, y, size, color) {
    c.fillStyle = color; c.fillRect(x - size, y - 1, size * 2 + 1, 2); c.fillRect(x - 1, y - size, 2, size * 2 + 1);
  }
  function pixelCloud(c, x, y, scale, color) {
    c.fillStyle = color;
    c.fillRect(x,y,80*scale,12*scale); c.fillRect(x+13*scale,y-10*scale,52*scale,10*scale); c.fillRect(x+28*scale,y-20*scale,22*scale,10*scale);
  }
  function drawBackground(c, time, distance, region=regionFor(run?.score||0)) {
    const [topColor,midColor,bottomColor,farColor,nearColor,groundColor,accent]=region.colors;
    const sky = c.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,topColor); sky.addColorStop(.5,midColor); sky.addColorStop(1,bottomColor);
    c.fillStyle=sky;c.fillRect(0,0,W,H);
    const glow = c.createRadialGradient(442,180,5,442,180,210); glow.addColorStop(0,'#cfdfa31c');glow.addColorStop(1,'#cfdfa300');c.fillStyle=glow;c.fillRect(0,0,W,460);
    c.fillStyle=accent;c.globalAlpha=.68;c.fillRect(421,132,41,41);c.fillRect(414,139,55,27);c.globalAlpha=1;c.fillStyle=nearColor;c.fillRect(428,141,10,8);c.fillRect(449,153,9,9);
    if(region.id==='aurora'){
      for(let i=0;i<4;i++){c.fillStyle=['#78e2bb22','#a4cced22','#c2a5e922','#80f4ce22'][i];c.beginPath();c.moveTo(-60,180+i*23);c.bezierCurveTo(120,20+i*16,320,260+i*15,600,40+i*28);c.lineTo(600,110+i*28);c.bezierCurveTo(300,315+i*15,130,90+i*16,-60,240+i*23);c.closePath();c.fill();}
    }
    if(region.id==='void'){
      c.fillStyle='#080e1d';c.beginPath();c.arc(434,153,35,0,Math.PI*2);c.fill();c.strokeStyle='#aad9ef88';c.lineWidth=3;c.beginPath();c.ellipse(434,153,68,17,-.3,0,Math.PI*2);c.stroke();c.lineWidth=1;
    }
    if(region.id==='galaxy'){
      c.strokeStyle='#f4c0f477';c.lineWidth=3;c.beginPath();c.ellipse(440,151,59,12,-.3,0,Math.PI*2);c.stroke();c.lineWidth=1;
      for(let i=0;i<18;i++)drawSparkle(c,(i*113+27)%W,(i*59+81)%410,2,accent+'66');
    }
    for(let i=0;i<26;i++){const x=(i*97+36)%W,y=(i*61+30)%370;c.globalAlpha=.16+((i%4)/10);drawSparkle(c,x,y,i%5===0?3:1,'#d7ecd0');}c.globalAlpha=1;
    pixelCloud(c,((110-distance*.10)%760+760)%760-100,107,1.3,'#b1cba412');pixelCloud(c,((420-distance*.07)%800+800)%800-100,287,1.1,'#b1cba422');pixelCloud(c,((30-distance*.13)%760+760)%760-90,354,1.5,'#bbd7ae20');
    const shift=distance*.13%320;
    for(let i=-1;i<3;i++){const x=i*320-shift;c.fillStyle=farColor;c.beginPath();c.moveTo(x-65,GROUND);c.lineTo(x+35,450);c.lineTo(x+98,510);c.lineTo(x+200,357);c.lineTo(x+345,GROUND);c.closePath();c.fill();c.strokeStyle=accent+'22';c.beginPath();c.moveTo(x+95,510);c.lineTo(x+200,357);c.lineTo(x+256,465);c.stroke();if(region.id==='ice'){c.fillStyle='#d7f4e777';c.beginPath();c.moveTo(x+178,390);c.lineTo(x+200,357);c.lineTo(x+229,404);c.lineTo(x+204,391);c.lineTo(x+193,406);c.closePath();c.fill();}}
    const shift2=distance*.23%260;
    for(let i=-1;i<4;i++){const x=i*260-shift2;c.fillStyle=nearColor;c.fillRect(x,552,36,GROUND-552);c.fillRect(x+36,512,47,GROUND-512);c.fillRect(x+83,576,34,GROUND-576);c.fillRect(x+117,542,66,GROUND-542);c.fillRect(x+183,600,77,GROUND-600);c.fillStyle=accent+'22';c.fillRect(x+39,512,41,3);c.fillRect(x+120,542,60,3);if(region.id==='desert'){c.fillStyle=groundColor;c.fillRect(x+206,553,8,59);c.fillRect(x+195,565,11,7);c.fillRect(x+194,549,5,23);c.fillRect(x+213,579,14,7);c.fillRect(x+223,564,5,22);}if(region.id==='cloud'){pixelCloud(c,x-15,520,1.6,'#f9e9ee33');pixelCloud(c,x+130,587,1.3,'#fff2eb33');}}
    c.fillStyle='#1d4039';c.fillRect(0,GROUND-13,W,14);
    const ground=c.createLinearGradient(0,GROUND,0,H);ground.addColorStop(0,groundColor);ground.addColorStop(1,topColor);c.fillStyle=ground;c.fillRect(0,GROUND,W,H-GROUND);
    c.fillStyle=accent;c.fillRect(0,GROUND,W,4);c.fillStyle=nearColor;c.fillRect(0,GROUND+4,W,6);
    if(region.id==='moon'){c.fillStyle='#c7d2e333';for(let i=0;i<6;i++){const x=(i*113-distance*.3)%650;c.fillRect(x,GROUND+16,23,6);c.fillRect(x+3,GROUND+13,16,12);}}
    for(let i=-1;i<19;i++){const x=i*36-distance%36;c.fillStyle='#9da96b40';c.fillRect(x,GROUND+15,17,3);c.fillStyle='#0e282e66';c.fillRect(x+14,GROUND+31,25,3);}
    if(!profile.settings.reduceMotion){for(let i=0;i<7;i++){const x=((i*83+time*(7+i))%(W+30))-15,y=430+Math.sin(time*.6+i)*65+i*20;c.globalAlpha=.3;drawSparkle(c,x,y,1,'#e4efba');}c.globalAlpha=1;}
  }
  function drawPipe(pipe,score=run?.score||0) {
    const x=pipe.x, w=pipe.width, top=pipe.center-pipe.gap/2, bottom=pipe.center+pipe.gap/2;
    const theme=(REGIONS.find(r=>r.id===pipe.type)||regionFor(score)).colors;
    const gradient=ctx.createLinearGradient(x,0,x+w,0);gradient.addColorStop(0,theme[4]);gradient.addColorStop(.25,theme[3]);gradient.addColorStop(.28,theme[4]);gradient.addColorStop(1,theme[5]);
    ctx.fillStyle='#0d3336';ctx.fillRect(x-2,0,w+4,top);ctx.fillRect(x-2,bottom,w+4,GROUND-bottom);
    ctx.fillStyle=gradient;ctx.fillRect(x,0,w,top-10);ctx.fillRect(x,bottom+10,w,GROUND-bottom-10);
    ctx.fillStyle='#6c925e';ctx.fillRect(x+5,0,4,top-13);ctx.fillRect(x+5,bottom+13,4,GROUND-bottom-13);
    ctx.fillStyle='#1f4439';ctx.fillRect(x-6,top-21,w+12,23);ctx.fillRect(x-6,bottom-2,w+12,23);
    ctx.fillStyle=theme[6];ctx.fillRect(x-6,top-21,w+12,5);ctx.fillRect(x-6,bottom-2,w+12,5);
    ctx.fillStyle=theme[3];ctx.fillRect(x-3,top-14,w+6,9);ctx.fillRect(x-3,bottom+6,w+6,8);
    ctx.fillStyle='#a4b676';ctx.fillRect(x+3,top-21,12,3);ctx.fillRect(x+3,bottom-2,12,3);
    for(let i=0;i<3;i++){ctx.fillStyle='#1c493d66';ctx.fillRect(x+20+(i%2)*17,top-50-i*63,12,5);ctx.fillRect(x+15+(i%2)*23,bottom+49+i*72,15,5);}
    if(pipe.amplitude){ctx.fillStyle='#b6d99b';ctx.globalAlpha=.65;ctx.fillRect(x+w/2-4,top-12,8,3);ctx.fillRect(x+w/2-4,bottom+9,8,3);ctx.globalAlpha=1;}
    if(pipe.type&&pipe.type!=='forest'){
      const color=pipe.pulse&&pipe.closing?'#ffc994':theme[6];
      ctx.strokeStyle=color;ctx.lineWidth=2;ctx.strokeRect(x-6,top-21,w+12,23);ctx.strokeRect(x-6,bottom-2,w+12,23);
      ctx.fillStyle=color;ctx.font='bold 14px sans-serif';ctx.textAlign='center';
      ctx.fillText(pipe.amplitude?(pipe.direction>0?'↓':'↑'):OBSTACLES[pipe.type].symbol,x+w/2,top-31);
      if(pipe.pulse){ctx.fillStyle='#0a2038';ctx.fillRect(x+5,top-16,w-10,7);ctx.fillStyle=color;ctx.fillRect(x+7,top-14,(w-14)*clamp((pipe.gap-170)/36,0,1),3);}
      ctx.lineWidth=1;
    }
    if(!pipe.collected) drawCoin(pipe.x+w/2,pipe.center);
  }
  function drawCoin(x,y) {
    ctx.save();ctx.translate(x,y);
    if(!profile.settings.reduceMotion){ctx.shadowBlur=16;ctx.shadowColor='#ffe4a766';}
    ctx.fillStyle='#d59a42';ctx.beginPath();ctx.moveTo(-12,-7);ctx.lineTo(-7,-13);ctx.lineTo(7,-13);ctx.lineTo(12,-7);ctx.lineTo(12,7);ctx.lineTo(7,13);ctx.lineTo(-7,13);ctx.lineTo(-12,7);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle='#f7d681';ctx.fillRect(-8,-9,16,18);ctx.fillRect(-10,-5,20,10);ctx.fillStyle='#fff0ae';ctx.fillRect(-7,-7,4,9);ctx.fillStyle='#b4823a';ctx.fillRect(2,-5,3,10);ctx.fillRect(0,-3,7,6);ctx.restore();
  }
  function drawBird(c, skin, x, y, size, rotation, time) {
    c.save();c.translate(x,y);c.rotate(rotation);const u=size/10;c.scale(u,u);
    if(skin.pattern==='bat'||skin.pattern==='dragon'||skin.pattern==='angel'){
      c.fillStyle=skin.wing;c.beginPath();c.moveTo(-3,1);c.lineTo(-9,-3);c.lineTo(-8,2);c.lineTo(-6,1);c.lineTo(-5,4);c.closePath();c.fill();
      if(skin.pattern==='angel'){c.fillStyle=skin.accent;c.fillRect(-8,-1,2,4);c.fillRect(-6,0,2,4);}
    }
    if(skin.pattern==='vortex'){
      c.strokeStyle=skin.accent+'99';c.lineWidth=.7;c.beginPath();c.ellipse(0,0,7,2,-.4,0,Math.PI*2);c.stroke();
    }
    if(skin.pattern==='axolotl'){
      c.fillStyle='#dc83b1';for(let i=0;i<3;i++){c.fillRect(-7,-3+i*2,3,1);c.fillRect(4,-4+i*2,2,1);}c.fillStyle=skin.accent;c.fillRect(-7,-4,1,6);
    }
    if(skin.pattern==='ghost')c.globalAlpha=.86;
    if(['galaxy','ascendant','infinity'].includes(skin.pattern)){c.shadowBlur=18;c.shadowColor=skin.accent+'88';}
    c.fillStyle='#112d33';c.fillRect(-5.5,-3.5,11,8);c.fillRect(-4.5,-4.5,9,10);
    c.fillStyle=skin.shade;c.fillRect(-4.5,-3.5,9,8);c.fillRect(-3.5,-4.5,7,10);
    c.fillStyle=skin.color;c.fillRect(-4.5,-3.5,8,7);c.fillRect(-3.5,-4.5,6,1);c.shadowBlur=0;
    c.fillStyle=skin.accent;c.globalAlpha*=.32;c.fillRect(-3.5,-3.5,5,1);c.globalAlpha=skin.pattern==='ghost'?.86:1;
    if(skin.pattern==='bee'){c.fillStyle='#424541';c.fillRect(-2.5,-3.5,1.8,8);c.fillRect(.5,-3.5,1.5,8);c.fillStyle='#2b4443';c.fillRect(-2,-6.5,1,2);c.fillRect(1,-6,1,2);}
    if(skin.pattern==='vapor'){c.fillStyle='#83e1d9';c.fillRect(-4.5,1,8,1);c.fillStyle='#efb1cd';c.fillRect(-4.5,2,8,1);c.fillStyle='#e3cced';c.fillRect(-4.5,3,8,1);}
    if(skin.pattern==='galaxy'){c.fillStyle='#ad9ac9';c.fillRect(-3,-3,3,1);c.fillRect(-1,-2,3,2);c.fillStyle='#e7dfa9';c.fillRect(-2,-2,1,1);c.fillRect(0,3,1,1);c.fillRect(3,-3,1,1);drawSparkle(c,-2,1,.7,'#efdab0');}
    if(skin.pattern==='melon'){
      c.fillStyle='#8dc284';c.fillRect(-4,3,8,1.5);c.fillStyle='#bfe0a3';c.fillRect(-4,2.5,8,.6);c.fillStyle='#75485c';c.fillRect(-2,-1,.7,1.2);c.fillRect(0,1,.7,1);c.fillRect(-1,-3,.7,1);
    }
    if(skin.pattern==='penguin'){c.fillStyle=skin.accent;c.fillRect(-2,-1,5,5);c.fillRect(-1,-2,3,1);}
    if(skin.pattern==='dragon'){c.fillStyle=skin.accent;c.fillRect(-1,1,4,3);c.fillRect(-3,-6,1,2);c.fillRect(1,-6,1,2);c.fillStyle=skin.wing;c.fillRect(-5,-4,1,2);}
    if(skin.pattern==='phoenix'){
      c.fillStyle=skin.accent;c.fillRect(-3,-6,1,2);c.fillRect(-1,-7,1,3);c.fillRect(1,-6,1,2);c.fillRect(-7,1,3,1);c.fillRect(-8,2,2,1);c.fillStyle='#e67c58';c.fillRect(-6,0,2,1);
    }
    if(skin.pattern==='disco'){
      for(let j=0;j<4;j++)for(let i=0;i<4;i++){c.fillStyle=['#d7e8ee','#c8a9d9','#8ed6d0','#8c9fbe'][(i+j)%4];c.fillRect(-4+i*2,-3+j*2,1.5,1.4);}drawSparkle(c,-6,-4,1,skin.accent);
    }
    if(skin.pattern==='badge'||skin.pattern==='captain'){c.fillStyle=skin.accent;c.fillRect(-1,1,2,2);c.fillStyle=skin.shade;c.fillRect(-.5,3,.6,1);}
    if(skin.pattern==='sentinel'){c.fillStyle=skin.accent;c.fillRect(-3,-2,1,6);c.fillRect(-2,2,4,1);c.fillStyle=skin.wing;c.fillRect(-1,-4,1,4);}
    if(skin.pattern==='cyber'){c.fillStyle=skin.accent;c.fillRect(-4,-3,3,.5);c.fillRect(-4,0,.5,3);c.fillRect(-3,3,3,.5);c.fillStyle=skin.wing;c.fillRect(-1,0,1,2);}
    if(skin.pattern==='runes'){c.strokeStyle=skin.accent;c.lineWidth=.5;c.beginPath();c.moveTo(-2,-2);c.lineTo(0,0);c.lineTo(-2,2);c.lineTo(-2,-2);c.moveTo(-3,0);c.lineTo(0,0);c.stroke();c.fillStyle=skin.accent;c.fillRect(1,3,1,1);}
    if(skin.pattern==='moon'){c.fillStyle=skin.shade;c.fillRect(-3,-2,2,1.5);c.fillRect(-1,1,1,1);c.fillRect(1,3,1.5,1);c.fillStyle=skin.accent;c.fillRect(-3,-2,1,.5);}
    if(skin.pattern==='aurora'){c.fillStyle='#98f9ce';c.fillRect(-4,-2,4,1);c.fillStyle='#b2a9ef';c.fillRect(-3,-1,4,1);c.fillStyle='#92d6f3';c.fillRect(-2,0,3,1);}
    if(skin.pattern==='stellar'){drawSparkle(c,-1,0,1.3,skin.accent);drawSparkle(c,-7,-4,.7,skin.accent);drawSparkle(c,6,-5,.6,skin.accent);}
    if(skin.pattern==='ruby'){
      c.fillStyle=skin.accent;c.beginPath();c.moveTo(-3,-2);c.lineTo(-1,-4);c.lineTo(1,-1);c.lineTo(-1,2);c.closePath();c.fill();c.fillStyle=skin.wing;c.beginPath();c.moveTo(-1,-4);c.lineTo(1,-1);c.lineTo(3,2);c.lineTo(-1,2);c.closePath();c.fill();
    }
    if(skin.pattern==='shark'){
      c.fillStyle=skin.shade;c.beginPath();c.moveTo(-3,-4);c.lineTo(-2,-8);c.lineTo(1,-4);c.closePath();c.fill();c.fillStyle=skin.accent;c.fillRect(-1,1,5,3);c.fillStyle=skin.shade;c.fillRect(1,2,3,.6);
    }
    if(skin.pattern==='origami'){
      c.fillStyle=skin.accent;c.beginPath();c.moveTo(-4,-3);c.lineTo(3,-3);c.lineTo(-1,2);c.closePath();c.fill();c.strokeStyle=skin.shade;c.lineWidth=.4;c.beginPath();c.moveTo(-4,-3);c.lineTo(-1,2);c.lineTo(3,4);c.moveTo(-1,2);c.lineTo(3,-3);c.stroke();
    }
    if(skin.pattern==='chrome'){
      c.fillStyle=skin.accent;c.fillRect(-3.5,-3,1.2,7);c.fillRect(-2.3,-1,4,1);c.fillStyle=skin.wing;c.fillRect(-1.5,-3,1.4,7);c.fillStyle=skin.shade;c.fillRect(-3.5,1,7,.6);
    }
    if(skin.pattern==='chronicler'){
      c.fillStyle='#526d66';c.fillRect(-3,-2,4.5,6);c.fillStyle=skin.accent;c.fillRect(-2.5,-1.5,3.5,5);c.fillStyle=skin.wing;c.fillRect(-.8,-1.5,.5,5);c.fillRect(-2,0,1,.4);c.fillRect(-2,1,1,.4);c.fillRect(0,0,.7,.4);
    }
    if(skin.pattern==='horizon'){
      c.fillStyle='#f7cda5';c.fillRect(-3,0,5,1);c.fillStyle='#b8b4df';c.fillRect(-3,1,5,1);c.fillStyle='#77b5ca';c.fillRect(-3,2,5,1);c.strokeStyle=skin.accent;c.lineWidth=.6;c.beginPath();c.arc(0,-1,6.3,Math.PI,Math.PI*1.9);c.stroke();
    }
    if(skin.pattern==='oracle'){
      c.fillStyle=skin.accent;c.fillRect(-3,-2,3,1.4);c.fillStyle=skin.shade;c.fillRect(-1.9,-2,1,1.4);drawSparkle(c,-6,0,.6,skin.accent);c.fillStyle=skin.wing;c.fillRect(-3,2,4,.7);
    }
    c.fillStyle=skin.wing;const flap=(state==='playing'&&rotation<0)?-1:Math.sin(time*4)*.3;c.fillRect(-5,1+flap,4,2.5);c.fillStyle=skin.shade;c.fillRect(-4,3+flap,3,1);
    if(skin.pattern==='ghost'){c.fillStyle=skin.color;c.fillRect(-4,4,2,2);c.fillRect(0,4,2,2);c.fillStyle='#c2dfd4';c.fillRect(3,4,1,2);}
    if(skin.pattern==='astro'){c.fillStyle='#5a7f89';c.fillRect(-1,-3.5,6,5);c.fillStyle='#93d1d9';c.fillRect(0,-3,4,3);c.fillStyle='#d9ffff';c.fillRect(.5,-2.5,1,1);c.fillStyle='#d5e7e1';c.fillRect(-5.5,-2,1,5);}
    else{c.fillStyle='#f6f4df';c.fillRect(1,-2.5,3,3);c.fillStyle='#163339';c.fillRect(2.5,-2,1.5,2);c.fillStyle='#fbfcde';c.fillRect(2.6,-2,.6,.7);}
    c.fillStyle='#e6a558';c.fillRect(4,0,3,2);c.fillStyle='#ffcf7b';c.fillRect(4,0,3,1);
    if(skin.pattern==='cheeks'){c.fillStyle='#d477a7';c.fillRect(1,1,1.6,1);}
    if(skin.pattern==='leaf'){c.fillStyle='#7aa655';c.fillRect(-1,-6.5,1,2);c.fillStyle='#c4ed87';c.fillRect(-3,-7.5,3,2);c.fillStyle='#9fce78';c.fillRect(0,-6.5,2,1.5);}
    if(skin.pattern==='robot'){c.fillStyle='#d1f9ef';c.fillRect(2,-2,1.5,1.5);c.fillStyle='#879e9d';c.fillRect(-.5,-6,.7,1.5);c.fillStyle=skin.accent;c.fillRect(-1.2,-7.2,2,1.5);c.fillStyle='#53747d';c.fillRect(-2,3,4,1);}
    if(skin.pattern==='crown'||skin.pattern==='emperor'){c.fillStyle='#bd903e';c.fillRect(-3.5,-6,7,2);c.fillStyle='#f5d67b';c.fillRect(-3.5,-7,1.6,3);c.fillRect(-.8,-8,1.6,4);c.fillRect(1.9,-7,1.6,3);c.fillRect(-3.5,-5,7,1);c.fillStyle='#fff1b0';c.fillRect(-.5,-7.5,1,1);if(skin.pattern==='emperor'){c.fillStyle=skin.accent;c.fillRect(-3,0,1,4);c.fillRect(-2,3,5,1);c.fillStyle='#cf86a0';c.fillRect(-.5,-5.8,1,1);}}
    if(skin.pattern==='ninja'||skin.pattern==='samurai'){
      c.fillStyle=skin.accent;c.fillRect(-4.5,-3.5,9,1);c.fillRect(-6,-3,2,1);c.fillRect(-7,-2,2,1);c.fillStyle=skin.shade;c.fillRect(0,1,4,2);if(skin.pattern==='samurai'){c.fillStyle='#554a51';c.fillRect(-1,-6,2,2);}
    }
    if(skin.pattern==='pilot'){
      c.fillStyle='#6b645b';c.fillRect(-4,-5,8,1.8);c.fillStyle=skin.accent;c.fillRect(0,-3.5,4,2);c.fillStyle='#567c8b';c.fillRect(1,-3,2,1);c.fillStyle='#edb090';c.fillRect(-5,3,5,1);
    }
    if(skin.pattern==='captain'){
      c.fillStyle='#e6e8db';c.fillRect(-4,-5.8,7,2);c.fillStyle=skin.shade;c.fillRect(-3,-4,8,1);c.fillStyle=skin.accent;c.fillRect(-1,-5.6,1,1);
    }
    if(skin.pattern==='bat'){c.fillStyle=skin.color;c.fillRect(-4,-6.5,2,3);c.fillRect(2,-6.5,2,3);c.fillStyle=skin.accent;c.fillRect(-3.5,-6,1,1.5);}
    if(skin.pattern==='angel'){c.strokeStyle=skin.accent;c.lineWidth=.7;c.beginPath();c.ellipse(0,-7,3.5,1.1,0,0,Math.PI*2);c.stroke();}
    if(skin.pattern==='sprout'){
      c.fillStyle=skin.wing;c.fillRect(-1,-7,1,3);c.fillStyle=skin.accent;c.fillRect(-4,-7,3,1.5);c.fillRect(0,-8,3,1.5);c.fillStyle=skin.wing;c.fillRect(-3,-6,2,1);
    }
    if(skin.pattern==='desert'){
      c.fillStyle=skin.accent;c.fillRect(-4.5,-5,8.5,2);c.fillRect(-5,-3,2,5);c.fillRect(-3,-6,6,1);c.fillStyle=skin.wing;c.fillRect(-4,-4.5,7,.5);c.fillRect(0,1,4,1.3);
    }
    if(skin.pattern==='crystal'){
      c.fillStyle=skin.accent;c.beginPath();c.moveTo(-3,-4);c.lineTo(-4,-7);c.lineTo(-1,-5);c.lineTo(0,-8);c.lineTo(2,-5);c.lineTo(4,-6);c.lineTo(3,-4);c.closePath();c.fill();c.fillStyle=skin.wing;c.fillRect(-3,1,2,1);
    }
    if(skin.pattern==='cloud'){c.fillStyle=skin.accent;c.fillRect(-5,-3,2,2);c.fillRect(-3,-5,2,2);c.fillRect(0,-5,2,2);c.fillRect(-5,2,2,2);c.fillRect(1,4,2,1);}
    if(skin.pattern==='cyber'){c.fillStyle=skin.accent;c.fillRect(0,-2.3,4,1);c.fillStyle=skin.shade;c.fillRect(1,-1.5,3,.5);}
    if(skin.pattern==='vortex'){c.strokeStyle=skin.accent;c.lineWidth=.45;c.beginPath();c.arc(-.5,0,1.9,0,Math.PI*1.7);c.stroke();c.fillStyle=skin.shade;c.fillRect(-1,-.5,1,1);}
    if(skin.pattern==='wizard'){
      c.fillStyle=skin.shade;c.beginPath();c.moveTo(-4,-4);c.lineTo(-1,-10);c.lineTo(2,-4);c.closePath();c.fill();c.fillRect(-5,-4.5,8,1);c.fillStyle=skin.accent;c.fillRect(-1.7,-7,1,1);drawSparkle(c,-2,1,1,skin.accent);
    }
    if(skin.pattern==='raven'){
      c.fillStyle=skin.shade;c.fillRect(-4,-6,1,2);c.fillRect(-2,-7,1,3);c.fillRect(0,-6,1,2);c.fillRect(-7,1,3,1);c.fillRect(-6,2,2,1);c.fillStyle=skin.accent;c.fillRect(2.6,-2,1,.8);
    }
    if(skin.pattern==='solar'){
      c.strokeStyle=skin.accent;c.lineWidth=.6;c.beginPath();for(let i=0;i<7;i++){const a=Math.PI+(i/6)*Math.PI;c.moveTo(Math.cos(a)*6,Math.sin(a)*6);c.lineTo(Math.cos(a)*7.7,Math.sin(a)*7.7);}c.stroke();c.fillStyle=skin.accent;c.fillRect(-2,0,2,2);
    }
    if(skin.pattern==='titan'){
      c.fillStyle=skin.shade;c.fillRect(-4,-4.5,8,1.5);c.fillRect(-4,-3,1.5,6);c.fillStyle=skin.accent;c.fillRect(-5,-7,1.4,4);c.fillRect(3,-7,1.4,4);c.fillStyle=skin.wing;c.fillRect(-3.5,-7,1.5,1);c.fillRect(1.5,-7,1.5,1);
    }
    if(skin.pattern==='ascendant'){
      c.fillStyle=skin.wing;for(let i=0;i<3;i++){c.fillRect(-7-i,-2+i*1.3,3,1);c.fillRect(5+i,-3+i*1.3,2,1);}c.strokeStyle=skin.accent;c.lineWidth=.7;c.beginPath();c.ellipse(0,-7,4.5,1.4,0,0,Math.PI*2);c.stroke();drawSparkle(c,-1,1,1.2,skin.accent);drawSparkle(c,7,-7,.7,skin.accent);
    }
    if(skin.pattern==='arena'){c.fillStyle=skin.shade;c.fillRect(-4,-6,8,2);c.fillStyle=skin.accent;for(let i=0;i<skin.rank;i++)c.fillRect(-4+i*1.5,-7-(i%2),1,2);c.fillRect(-2,0,3,3);c.fillStyle=skin.color;c.fillRect(-1,1,1,1);if(skin.rank>=4){c.fillStyle=skin.wing;c.fillRect(-7,-1,2,4);c.fillRect(-8,0,2,1);}if(skin.rank===6){c.strokeStyle=skin.accent;c.lineWidth=.5;c.beginPath();c.ellipse(0,-8,5,1.2,0,0,Math.PI*2);c.stroke();}}
    if(skin.pattern==='infinity'){
      c.strokeStyle=skin.accent;c.lineWidth=.65;c.beginPath();c.moveTo(-4.2,0);c.bezierCurveTo(-4.2,-2.5,-1,-2.5,0,0);c.bezierCurveTo(1,2.5,4,2.5,4,0);c.bezierCurveTo(4,-2.5,1,-2.5,0,0);c.bezierCurveTo(-1,2.5,-4.2,2.5,-4.2,0);c.stroke();c.fillStyle=skin.accent;for(const [px,py]of[[-6,-5],[4,-7],[7,4],[-6,6]])c.fillRect(px,py,1.2,1.2);
    }
    c.restore();
  }
  function drawCompanion() {
    if (view !== 'play') return;
    const c=$('companionCanvas'), cc=c.getContext('2d');cc.clearRect(0,0,c.width,c.height);
    const t=profile.settings.reduceMotion?0:ambient;
    cc.fillStyle='#0002';cc.beginPath();cc.ellipse(240,126,38,5,0,0,Math.PI*2);cc.fill();
    drawBird(cc,skinById(profile.equipped),236,78+Math.sin(t*1.9)*4,53,-.08,t);
    drawSparkle(cc,154,56,4,'#b5cf8a88');drawSparkle(cc,316,97,3,'#b5cf8a44');
  }
  function drawImpact(flight) {
    if(!flight.impact)return;
    const hit=flight.impact,b=flight.bird;
    ctx.strokeStyle='#ff8678';ctx.lineWidth=2;ctx.strokeRect(b.x+5,b.y+5,b.size-10,b.size-10);
    ctx.beginPath();ctx.arc(hit.x,hit.y,12,0,Math.PI*2);ctx.moveTo(hit.x-18,hit.y);ctx.lineTo(hit.x+18,hit.y);ctx.moveTo(hit.x,hit.y-18);ctx.lineTo(hit.x,hit.y+18);ctx.stroke();ctx.lineWidth=1;
  }
  function drawPlayer(flight,index) {
    const b=flight.bird,color=index?'#9ce5ff':'#ddf594';
    ctx.save();ctx.globalAlpha=flight.dead ? .4 : .88;
    drawBird(ctx,skinById(duel.players[index].skin),b.x+b.size/2,b.y+b.size/2,b.size,clamp(b.vy*.001,-.32,1.1),flight.elapsed);
    ctx.strokeStyle=color;ctx.lineWidth=2;ctx.strokeRect(b.x-4,b.y-4,b.size+8,b.size+8);
    ctx.globalAlpha=1;ctx.fillStyle=color;ctx.font='bold 13px sans-serif';ctx.textAlign=index?'left':'right';
    ctx.fillText(`P${index+1}${flight.dead?' ×':''}`,index?b.x+b.size+9:b.x-9,b.y+18);
    ctx.restore();
  }
  function draw() {
    if(run?.mode==='boss'&&bossFight){drawBossScene();return;}
    const isReplay=state==='replay'&&review&&playback, sample=isReplay?review.frames[playback.index]:null;
    const first=sample?.first||run,second=sample?.second||duel?.second;
    const scene=duel&&second&&second.tick>first.tick?second:first;
    const active=scene&&['playing','paused','over','replay','countdown','ready'].includes(state);
    const distance=active?scene.distance:(profile.settings.reduceMotion?0:ambient*12);
    ctx.save();
    if(shake>0&&!isReplay&&!profile.settings.reduceMotion)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
    drawBackground(ctx,isReplay?scene.elapsed:ambient,distance,regionFor(active?scene.score:0));
    if(active)scene.pipes.forEach(pipe=>drawPipe(pipe,scene.score));
    if(ghost&&!isReplay&&['playing','paused','over'].includes(state)){
      const g=ghost.flight.bird;
      if(!ghost.done){
        ctx.save();ctx.globalAlpha=.38;drawBird(ctx,skinById('ocean'),g.x+g.size/2,g.y+g.size/2,g.size,clamp(g.vy*.001,-.32,1.1),ghost.flight.elapsed);ctx.globalAlpha=.8;ctx.strokeStyle='#b4dfff';ctx.setLineDash([4,4]);ctx.strokeRect(g.x-5,g.y-5,g.size+10,g.size+10);ctx.setLineDash([]);ctx.fillStyle='#d3ebff';ctx.font='bold 10px sans-serif';ctx.textAlign='left';ctx.fillText('RIVAL',g.x+g.size+12,g.y+18);ctx.restore();
      }
    }
    if(duel&&first&&second&&active){drawPlayer(first,0);drawPlayer(second,1);drawChaos(first,second,sample?.chaos);if(isReplay){drawImpact(first);drawImpact(second);}}
    else {
      const b=first?.bird||bird,idle=state==='menu'||state==='ready';
      const bx=state==='menu'?W*.48:b.x+b.size/2,by=state==='menu'?H*.49:b.y+b.size/2;
      const bob=idle&&!profile.settings.reduceMotion?Math.sin(ambient*2.6)*7:0;
      if(isReplay||state!=='over'||run?.reason!=='collision')drawBird(ctx,skinById(run?.skinId||profile.equipped),bx,by+bob,state==='menu'?48:b.size,idle?-.08:clamp(b.vy*.001,-.32,1.1),isReplay?first.elapsed:ambient);
      if(isReplay)drawImpact(first);
    }
    if(!isReplay){
      for(const p of particles){ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);}ctx.globalAlpha=1;
      ctx.font='bold 17px "Segoe UI", sans-serif';ctx.textAlign='center';
      for(const f of floaters){ctx.globalAlpha=Math.min(1,f.life*2);ctx.fillStyle='#ffdfa0';ctx.fillText(f.text,f.x,f.y);}ctx.globalAlpha=1;
    }
    ctx.restore();
  }
  function frame(timestamp) {
    const dt=lastTime?Math.min(.05,Math.max(0,(timestamp-lastTime)/1000)):0;lastTime=timestamp;
    ambient+=dt;
    if(state==='countdown'&&view==='play'&&!document.hidden){countdown-=dt;if(countdown<=0){state='playing';run.pendingFlap=true;duel.second.pendingFlap=true;banner('JÁ! W · P1 / ↑ · P2');playSound('score');renderOverlay();}else if(Math.ceil(countdown)!==Math.ceil(countdown+dt))renderOverlay();}
    if(state==='replay'&&view==='play'&&!document.hidden)updateReplay(dt);
    if(state==='playing'&&view==='play'&&!document.hidden){accumulator+=dt;while(accumulator>=STEP){update(STEP);accumulator-=STEP;if(state!=='playing'){accumulator=0;break;}}}else accumulator=0;
    if(state!=='paused'){
      for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;p.life-=dt;}
      particles=particles.filter(p=>p.life>0);
      for(const f of floaters){f.y-=35*dt;f.life-=dt;}floaters=floaters.filter(f=>f.life>0);
      shake=Math.max(0,shake-dt*28);
    }
    if(bannerUntil&&ambient>bannerUntil){$('milestoneBanner').classList.remove('show');bannerUntil=0;}
    if(view==='play'&&!document.hidden){draw();previewClock+=dt;if(previewClock>.07){drawCompanion();previewClock=0;}}
    requestAnimationFrame(frame);
  }

  function cleanName(value) {
    return typeof value==='string'?Array.from(value.normalize('NFC').replace(/[\u0000-\u001f\u007f]/g,'').trim()).slice(0,18).join(''):'';
  }
  function hashText(value) {
    let hash=2166136261;
    for(let i=0;i<value.length;i++)hash=Math.imul(hash^value.charCodeAt(i),16777619);
    return hash>>>0;
  }
  function checksum(value) { return hashText(value).toString(36).toUpperCase().padStart(7,'0').slice(-4); }
  function trackCode(seed,rules=RULESET) {
    const id=(seed>>>0).toString(36).toUpperCase().padStart(7,'0');
    return `${rules==='cb3'?'CB3':'CB4'}-${id}-${checksum(rules+id)}`;
  }
  function parseTrack(code) {
    const match=String(code).trim().toUpperCase().match(/^CB([34])-([0-9A-Z]{7})-([0-9A-Z]{4})$/);
    if(!match||checksum('cb'+match[1]+match[2])!==match[3])throw Error('Código de pista inválido. Copie o código CB4 completo.');
    const seed=parseInt(match[2],36);
    if(seed>4294967295||trackCode(seed,'cb'+match[1])!==match[0])throw Error('Código de pista inválido.');
    return seed;
  }
  function roundSeed(seed,round,rules=RULESET) { return hashText(`${rules}:${seed>>>0}:round:${round}`); }
  function normalizeArena(raw) {
    const out={version:1,tournament:null,challenge:null};
    const validSeed=n=>Number.isInteger(n)&&n>=0&&n<=4294967295;
    const validResult=r=>r&&cleanName(r.player)===r.player&&r.player.length>0&&Number.isInteger(r.score)&&r.score>=0&&r.score<10000&&Number.isInteger(r.coins)&&r.coins>=0&&r.coins<100000&&Number.isInteger(r.ticks)&&r.ticks>=0&&r.ticks<=MATCH_TICKS;
    if(raw?.version!==1)return out;
    const t=raw.tournament;
    if(t&&validSeed(t.seed)&&typeof t.id==='string'&&t.id.length<=60&&[1,3,5].includes(t.rounds)&&Array.isArray(t.players)&&t.players.length>=2&&t.players.length<=8&&t.players.every(n=>typeof n==='string'&&n.length>0&&n===cleanName(n))&&new Set(t.players.map(n=>n.toLocaleLowerCase('pt-BR'))).size===t.players.length&&Array.isArray(t.results)&&t.results.length<=t.players.length*t.rounds){
      const rules=t.rules===RULESET?RULESET:'cb3';
      const results=t.results.filter((r,i)=>validResult(r)&&r.turn===i&&r.playerIndex===i%t.players.length&&r.player===t.players[r.playerIndex]&&r.round===Math.floor(i/t.players.length)&&r.seed===roundSeed(t.seed,r.round,rules));
      if(results.length===t.results.length)out.tournament={playerIds:Array.isArray(t.playerIds)&&t.playerIds.length===t.players.length?t.playerIds.map(id=>typeof id==='string'?id:''):null,id:t.id,seed:t.seed,rules,rounds:t.rounds,players:t.players,results};
    }
    const c=raw.challenge;
    if(c&&validSeed(c.seed)&&Array.isArray(c.results)){
      out.challenge={seed:c.seed,rules:c.rules===RULESET?RULESET:'cb3',results:c.results.slice(0,50).filter(validResult).map(r=>({player:r.player,score:r.score,coins:r.coins,ticks:r.ticks,fingerprint:typeof r.fingerprint==='string'?r.fingerprint.slice(0,20):'',region:regionFor(r.score).id})),ownCode:typeof c.ownCode==='string'&&c.ownCode.length<=180000?c.ownCode:'',ghostCode:typeof c.ghostCode==='string'&&c.ghostCode.length<=180000?c.ghostCode:''};
    }
    return out;
  }
  function loadArena() {
    try { const raw=safeGet(ARENA_KEY);return normalizeArena(raw?JSON.parse(raw):null); }
    catch { return {version:1,tournament:null,challenge:null}; }
  }
  function saveArena() {
    arena={version:1,tournament,challenge};
    try { localStorage.setItem(ARENA_KEY,JSON.stringify(arena)); }
    catch { storageAvailable=false;updateSaveStatus();toast('A disputa está apenas nesta sessão.','Baixe um backup para guardar o placar.',true); }
  }
  function canStartCompetition() {
    if(['playing','paused','countdown','replay'].includes(state)){
      toast('Você tem um voo em andamento.','Continue ou encerre o voo antes de começar outra disputa.');setView('play');return false;
    }
    return true;
  }
  function standings(players,results,sum) {
    const names=players||[...new Map(results.map(r=>[r.player.toLocaleLowerCase('pt-BR'),r.player])).values()];
    return names.map(player=>{
      const runs=results.filter(r=>r.player.toLocaleLowerCase('pt-BR')===player.toLocaleLowerCase('pt-BR'));
      const best=[...runs].sort((a,b)=>b.score-a.score||b.coins-a.coins)[0];
      return {player,score:sum?runs.reduce((v,r)=>v+r.score,0):(best?.score||0),coins:sum?runs.reduce((v,r)=>v+r.coins,0):(best?.coins||0),played:runs.length,best:Math.max(0,...runs.map(r=>r.score))};
    }).sort((a,b)=>b.score-a.score||b.coins-a.coins||a.player.localeCompare(b.player,'pt-BR'));
  }
  function boardMarkup(rows,local=false) {
    if(!rows.length)return '<div class="board-empty">O placar está esperando os primeiros voos. Jogue e importe os resultados dos seus amigos.</div>';
    return `<div class="leaderboard-wrap"><table class="leaderboard"><thead><tr><th>POS.</th><th>JOGADOR</th><th>PONTOS</th><th>MOEDAS</th>${local?'<th>VOOS</th>':''}</tr></thead><tbody>${rows.map((r,i)=>{
      const rank=rows.findIndex(p=>p.score===r.score&&p.coins===r.coins)+1;
      return `<tr class="${rank===1?'leading':''}"><td>${rank===1?'✦':rank}</td><td><strong>${escapeHTML(r.player)}</strong><small>${regionFor(r.best).name}</small></td><td>${number(r.score)}</td><td>${number(r.coins)} ◎</td>${local?`<td>${r.played}</td>`:''}</tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function renderArena() {
    renderDuelSkins();
    $('tournamentPanel').hidden=!tournament;
    if(tournament){
      const total=tournament.players.length*tournament.rounds,done=tournament.results.length>=total;
      const turn=tournament.results.length,round=Math.floor(turn/tournament.players.length);
      const rows=standings(tournament.players,tournament.results,true);
      const winners=rows.filter(r=>r.score===rows[0].score&&r.coins===rows[0].coins);
      const title=done?(winners.length>1?'Vitória compartilhada!':`${escapeHTML(winners[0].player)} levou o céu!`):`Sua vez, ${escapeHTML(tournament.players[turn%tournament.players.length])}.`;
      $('tournamentPanel').innerHTML=`<div class="panel-heading"><div><span class="eyebrow">${done?'TORNEIO ENCERRADO':`RODADA ${round+1} DE ${tournament.rounds}`} · ${tournament.results.length}/${total} VOOS</span><h2>${title}</h2></div><span class="arena-rule-tag">${tournament.players.length} PLAYERS</span></div><p class="arena-note">${done?(winners.length>1?`Empate em pontos e moedas entre ${winners.map(r=>escapeHTML(r.player)).join(', ')}.`:'Maior soma de pontos; moedas do voo são o desempate.'):'Uma tentativa por jogador. Todos recebem a mesma pista nesta rodada. O próximo só começa quando você escolher.'}</p>${boardMarkup(rows,true)}<div class="arena-form-actions">${done?'':`<button class="button primary" data-action="start-turn">Preparar voo de ${escapeHTML(tournament.players[turn%tournament.players.length])} ↗</button>`}<button class="button secondary" data-action="end-tournament">${done?'Novo torneio':'Encerrar torneio'}</button></div>`;
    }
    $('challengePanel').hidden=!challenge;
    if(challenge){
      $('activeChallengeCode').value=trackCode(challenge.seed,challenge.rules);
      $('challengeLeaderboard').innerHTML=boardMarkup(standings(null,challenge.results,false));
      $('resultSharing').hidden=!latestResultCode;
      $('resultCodeOutput').value=latestResultCode;
      $('ghostStatus').textContent=challenge.ghostCode?'O último resultado recebido será seu rival fantasma. Importe outro para trocar. O fantasma não colide com seu pássaro.':'Importe um resultado para ver o rival voando na mesma pista.';
    }
    if(!$('playerNickname').value)$('playerNickname').value=profile.nickname;
  }
  function createTournament() {
    if(!canStartCompetition())return;
    if(tournament&&tournament.results.length<tournament.players.length*tournament.rounds){$('tournamentStatus').textContent='Há um torneio em andamento. Use Encerrar torneio no placar antes de criar outro.';return;}
    const names=$('playerNames').value.split(/\r?\n/).map(cleanName).filter(Boolean);
    const rounds=Number($('roundCount').value);
    if(names.length<2||names.length>8||![1,3,5].includes(rounds)){ $('tournamentStatus').textContent='Use de 2 a 8 nomes, um por linha, e escolha 1, 3 ou 5 rodadas.';return; }
    if(new Set(names.map(n=>n.toLocaleLowerCase('pt-BR'))).size!==names.length){$('tournamentStatus').textContent='Cada jogador precisa de um nome diferente.';return;}
    const ids=names.map(name=>players.entries.find(p=>p.name.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR'))?.id);
    if(ids.some(id=>!id)){$('tournamentStatus').textContent='Crie um perfil para cada nome do torneio usando Perfis.';return;}
    const seed=randomSeed();tournament={playerIds:ids,id:`${seed.toString(36)}-${Date.now().toString(36)}`,seed,rules:RULESET,players:names,rounds,results:[]};
    saveArena();renderArena();$('tournamentStatus').textContent='Torneio criado! Prepare o primeiro voo no placar abaixo.';
    $('tournamentPanel').scrollIntoView({block:'start',behavior:'instant'});
  }
  function startTurn() {
    if(!canStartCompetition()||!tournament)return;
    const turn=tournament.results.length;
    if(turn>=tournament.players.length*tournament.rounds)return;
    const round=Math.floor(turn/tournament.players.length),playerIndex=turn%tournament.players.length;
    if(tournament.playerIds){const id=tournament.playerIds[playerIndex];if(!players.entries.some(p=>p.id===id)){toast('Perfil do jogador não encontrado.','Restaure o backup que contém os perfis do torneio.');return;}if(id!==players.activeId&&!switchProfile(id))return;}
    prepareFlight({mode:'local',rules:tournament.rules,player:tournament.players[playerIndex],seed:roundSeed(tournament.seed,round,tournament.rules),tournamentId:tournament.id,turn,round,playerIndex});
  }
  function enterChallenge(seed,rules=RULESET) {
    if(!canStartCompetition())return;
    const nickname=cleanName($('playerNickname').value);
    if(!nickname){$('challengeStatus').textContent='Digite seu nome para entrar na disputa.';return;}
    if(challenge&&(challenge.seed!==seed||challenge.rules!==rules)&&challenge.results.length&&!window.confirm('Trocar de pista substitui o placar desta disputa neste aparelho. Quer continuar?'))return;
    profile.nickname=nickname;save();
    if(!challenge||challenge.seed!==seed||challenge.rules!==rules){challenge={seed,rules,results:[],ownCode:'',ghostCode:''};latestResultCode='';}
    $('challengeInput').value=trackCode(seed,rules);saveArena();renderArena();
    $('challengeStatus').textContent='Pista pronta. Compartilhe o código e faça seu voo no painel abaixo.';
    $('challengePanel').scrollIntoView({block:'start',behavior:'instant'});
  }
  function startChallengeFlight() {
    if(!canStartCompetition()||!challenge)return;
    const nickname=cleanName($('playerNickname').value)||profile.nickname;
    profile.nickname=nickname;save();
    prepareFlight({mode:'challenge',rules:challenge.rules,seed:challenge.seed,player:nickname});
    prepareGhost();syncHUD();
  }
  function encodeText(value) {
    const bytes=new TextEncoder().encode(value);
    return btoa(Array.from(bytes,b=>String.fromCharCode(b)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function decodeText(value) {
    const bytes=Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
    return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }
  function resultCode(flight) {
    let previous=0;
    const actions=flight.inputs.map((tick,i)=>{const delta=i?tick-previous:tick;previous=tick;return delta.toString(36);}).join('-');
    const rules=flight.rules||RULESET;
    const data=encodeText(JSON.stringify({r:rules,s:flight.seed,n:flight.player,t:flight.tick,a:actions,e:flight.reason,p:flight.score,c:flight.coins}));
    return `CBR${rules==='cb3'?3:4}.${data}.${checksum(data)}`;
  }
  function verifyReplay(code,expectedSeed,expectedRules=null) {
    const raw=String(code).trim();
    if(raw.length>180000)throw Error('O resultado é muito grande.');
    const parts=raw.match(/^CBR[34]\.([A-Za-z0-9_-]+)\.([0-9A-Z]{4})$/);
    if(!parts||checksum(parts[1])!==parts[2])throw Error('Resultado inválido ou incompleto. Copie o código CBR4 inteiro.');
    let data;
    try { data=JSON.parse(decodeText(parts[1])); }catch { throw Error('Não foi possível ler o resultado.'); }
    if(!['cb3',RULESET].includes(data.r)||raw.slice(0,4)!==`CBR${data.r==='cb3'?3:4}`||(expectedRules&&data.r!==expectedRules))throw Error('Este resultado usa outra versão de pista. Use o código de pista correspondente.');
    if(!Number.isInteger(data.s)||data.s<0||data.s>4294967295||data.s!==expectedSeed)throw Error('Este resultado pertence a outra pista.');
    if(!data.n||data.n!==cleanName(data.n)||!Number.isInteger(data.t)||data.t<0||data.t>MATCH_TICKS||!['collision','quit','time'].includes(data.e)||typeof data.a!=='string'||data.a.length>100000)throw Error('Os dados do voo são inválidos.');
    const actions=[];let tick=0;
    if(data.a){
      const deltas=data.a.split('-');if(deltas.length>5000)throw Error('Este voo tem comandos demais.');
      for(let i=0;i<deltas.length;i++){
        if(!/^[0-9a-z]{1,5}$/.test(deltas[i]))throw Error('Há comandos inválidos no voo.');
        const delta=parseInt(deltas[i],36);tick=i?tick+delta:delta;
        if((i&&delta===0)||tick>=data.t)throw Error('Os comandos estão fora do tempo do voo.');
        actions.push(tick);
      }
    }
    const replay=makeFlight(data.s,true,data.r);let cursor=0;
    for(let i=0;i<data.t;i++){
      if(replay.dead)throw Error('O resultado continua depois do fim do voo.');
      stepFlight(replay,actions[cursor]===i);if(actions[cursor]===i)cursor++;
    }
    const validEnd=data.e==='quit'?!replay.dead:replay.dead&&replay.deadReason===data.e;
    if(!validEnd||data.p!==replay.score||data.c!==replay.coins)throw Error('O placar não corresponde ao voo gravado.');
    return {player:data.n,score:replay.score,coins:replay.coins,ticks:replay.tick,fingerprint:hashText(raw).toString(36),region:regionFor(replay.score).id,actions,rules:data.r};
  }
  function addChallengeResult(result) {
    if(!challenge)return false;
    const {actions,rules,...entry}=result;
    result=entry;
    const at=challenge.results.findIndex(r=>r.player.toLocaleLowerCase('pt-BR')===result.player.toLocaleLowerCase('pt-BR'));
    if(at>=0){
      const old=challenge.results[at];
      if(old.score>result.score||(old.score===result.score&&old.coins>=result.coins))return false;
      challenge.results[at]=result;
    }else{
      if(challenge.results.length>=50)throw Error('Esta disputa já tem 50 jogadores. Crie outra pista para continuar.');
      challenge.results.push(result);
    }
    return true;
  }
  function recordCompetition() {
    if(!run||!['local','challenge'].includes(run.mode)||run.recorded)return;
    run.recorded=true;
    if(run.mode==='local'&&tournament&&run.tournamentId===tournament.id&&run.turn===tournament.results.length){
      tournament.results.push({turn:run.turn,round:run.round,playerIndex:run.playerIndex,player:run.player,score:run.score,coins:run.coins,ticks:run.tick,seed:run.seed});
      if(tournament.rounds>=3&&tournament.results.length===tournament.players.length*tournament.rounds){
        const floor=Math.max(...tournament.players.map(player=>Math.min(...tournament.results.filter(r=>r.player===player).map(r=>r.score))));
        if(tournament.playerIds){
          syncActiveProfile();const original=profile;
          for(const [i,id] of tournament.playerIds.entries()){
            const entry=players.entries.find(p=>p.id===id);if(!entry)continue;
            const ownFloor=Math.min(...tournament.results.filter(r=>r.playerIndex===i).map(r=>r.score));
            entry.profile.stats.tournamentFloor=Math.max(entry.profile.stats.tournamentFloor,ownFloor);
            profile=entry.profile;checkAchievements(false);
          }
          profile=original;
        }else profile.stats.tournamentFloor=Math.max(profile.stats.tournamentFloor,floor);
      }
    }else if(run.mode==='challenge'&&challenge&&challenge.seed===run.seed){
      latestResultCode=resultCode(run);challenge.ownCode=latestResultCode;
      addChallengeResult({player:run.player,score:run.score,coins:run.coins,ticks:run.tick,fingerprint:hashText(latestResultCode).toString(36),region:regionFor(run.score).id});
    }
    saveArena();
  }
  async function copyField(id) {
    const field=$(id),value=field.value;
    if(!value)return;
    try { if(!navigator.clipboard?.writeText)throw Error('manual');await navigator.clipboard.writeText(value);toast('Código copiado!','Envie ao seu amigo para entrar na disputa.'); }
    catch { field.focus();field.select();toast('O código está selecionado.','Use Ctrl+C ou a opção Copiar do seu aparelho.'); }
  }
  function unlockAudio() {
    if (!profile.settings.sound) return;
    try { const Audio=window.AudioContext||window.webkitAudioContext; if(!Audio)return;if(!audioContext)audioContext=new Audio();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{}); } catch { /* Audio is optional. */ }
  }
  function playSound(kind) {
    if(!profile.settings.sound)return;
    unlockAudio();if(!audioContext||audioContext.state!=='running')return;
    try {
      const tones={flap:[400,250,.055,.025],coin:[850,1400,.11,.04],score:[620,850,.06,.025],hit:[180,55,.2,.06],achievement:[700,1400,.24,.045]};
      const [from,to,duration,volume]=tones[kind]||tones.score;
      const oscillator=audioContext.createOscillator(), gain=audioContext.createGain(), now=audioContext.currentTime;
      oscillator.type=kind==='hit'?'triangle':'sine';oscillator.frequency.setValueAtTime(from,now);oscillator.frequency.exponentialRampToValueAtTime(to,now+duration);
      gain.gain.setValueAtTime(volume,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);
      oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(now);oscillator.stop(now+duration+.01);
    } catch { /* Audio failure must not stop gameplay. */ }
  }
  function openDialog(id) { if(['playing','countdown'].includes(state))pause();if(playback)playback.playing=false;$(id).showModal(); }
  function exportProgress() {
    save();
    const content=JSON.stringify({game:'cube-bird',version:VERSION,exportedAt:new Date().toISOString(),profile,players,arena:{version:1,tournament,challenge}},null,2);
    const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=`cube-bird-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    $('backupStatus').textContent='Backup pronto. Guarde o arquivo JSON para restaurar depois.';
  }
  async function inspectImport(file) {
    pendingImport=null;pendingArenaImport=null;pendingPlayersImport=null;$('importConfirmation').hidden=true;
    if(!file)return;
    try {
      if(file.size>2000000)throw new Error('large');
      const backup=JSON.parse(await file.text()), raw=backup.profile;
      if(backup.game!=='cube-bird'||backup.version!==VERSION||!raw||raw.version!==VERSION||!Array.isArray(raw.owned)||!Number.isFinite(raw.wallet)||raw.wallet<0||!Number.isFinite(raw.xp)||!Number.isFinite(raw.best)||!raw.stats)throw new Error('invalid');
      pendingPlayersImport=backup.players?normalizePlayers(backup.players):null;
      pendingImport=pendingPlayersImport?pendingPlayersImport.entries.find(p=>p.id===pendingPlayersImport.activeId).profile:normalize(raw);
      pendingArenaImport=normalizeArena(backup.arena);
      $('importSummary').textContent=`${pendingPlayersImport?'Este backup substitui os '+pendingPlayersImport.entries.length+' perfis salvos. ':'Este backup substitui apenas o perfil ativo. '}Ele tem ${number(pendingImport.wallet)} moedas, ${pendingImport.owned.length} skins e recorde de ${number(pendingImport.best)}. Ao confirmar, ele substitui o progresso atual deste navegador.`;
      $('importConfirmation').hidden=false;$('backupStatus').textContent='Confira o progresso antes de restaurar.';
    } catch { $('backupStatus').textContent='Não foi possível ler este backup. Escolha um arquivo JSON exportado pelo Cube Bird.'; }
    $('importFile').value='';
  }

  document.addEventListener('click', event => {
    const target=event.target.closest('button, a.brand');
    if(!target)return;
    if(target.matches('a.brand')){event.preventDefault();setView('play');return;}
    if(target.dataset.view){setView(target.dataset.view);return;}
    if(target.dataset.profile){switchProfile(target.dataset.profile);return;}
    if(target.dataset.upgrade){upgradeSkin(target.dataset.upgrade);return;}
    if(target.dataset.boss!==undefined){startBoss(Number(target.dataset.boss));return;}
    if(target.dataset.skin){buyOrEquip(target.dataset.skin);return;}
    if(target.dataset.achFilter){achievementFilter=target.dataset.achFilter;renderAchievements();return;}
    if(target.dataset.filter){filter=target.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===target);b.setAttribute('aria-pressed',String(b===target));});renderShop();return;}
    if(target.hasAttribute('data-close-dialog')){target.closest('dialog').close();return;}
    const actionName=target.dataset.action;
    if(actionName==='prepare')prepareFlight();
    if(actionName==='duel-go'||actionName==='boss-go')beginFlight();
    if(actionName==='duel-rematch')startDuel(true);
    if(actionName==='replay'||actionName==='replay-again')startReplay();
    if(actionName==='replay-toggle'&&playback){if(playback.index===review.frames.length-1)startReplay();else {playback.playing=!playback.playing;updateReplayCaption();}}
    if(actionName==='train')startTraining();
    if(actionName==='review-back')backToResult();
    if(actionName==='retry-challenge')startChallengeFlight();
    if(actionName==='start-turn')startTurn();
    if(actionName==='end-tournament'){
      if(!tournament)return;
      const complete=tournament.results.length>=tournament.players.length*tournament.rounds;
      if(complete||window.confirm('Encerrar este torneio e limpar o placar local? Seu progresso de skins e moedas será mantido.')){tournament=null;saveArena();renderArena();$('tournamentStatus').textContent='Pronto para criar um novo torneio.';}
    }
    if(actionName==='resume')resume();
    if(actionName==='finish')finishFlight('quit');
    if(actionName==='menu'){state='menu';run=null;duel=null;bossFight=null;ghost=null;review=null;playback=null;flightFrames=[];particles=[];floaters=[];renderOverlay();renderJourney();}
  });
  canvas.addEventListener('pointerdown',event=>{if(event.button!==0&&event.pointerType==='mouse')return;event.preventDefault();canvas.focus({preventScroll:true});if(run?.mode!=='duel')action();});
  $('jumpButton').addEventListener('click',()=>{action();canvas.focus({preventScroll:true});});
  $('pauseButton').addEventListener('click',()=>state==='paused'?resume():pause());
  $('focusButton').addEventListener('click',toggleFocus);
  $('fullscreenButton').addEventListener('click',toggleFullscreen);
  $('startDuel').addEventListener('click',()=>startDuel());
  for(const i of [1,2]){
    $(`jumpP${i}`).addEventListener('pointerdown',event=>{event.preventDefault();duelInput(i-1);});
    $(`jumpP${i}`).addEventListener('click',event=>{if(event.detail===0)duelInput(i-1);});
  }
  document.addEventListener('keydown',event=>{
    if(event.repeat||$('settingsDialog').open||$('helpDialog').open||$('profilesDialog').open||view!=='play')return;
    if(['KeyP','Escape'].includes(event.code)&&['playing','paused','countdown'].includes(state)){event.preventDefault();state==='paused'?resume():pause();return;}
    if(event.target.closest('button,a,input,select,textarea,[contenteditable="true"]'))return;
    if(run?.mode==='boss'&&event.code==='KeyE'){event.preventDefault();useBossGuard();return;}
    if(event.code==='KeyF'){event.preventDefault();toggleFocus();return;}
    if(state==='replay'){
      if(['Space','KeyP'].includes(event.code)){event.preventDefault();$('replayToggle').click();}
      if(event.code==='Escape'){event.preventDefault();backToResult();}
      return;
    }
    if(run?.mode==='duel'){
      if(['KeyA','ArrowLeft'].includes(event.code)){event.preventDefault();duelInput(event.code==='KeyA'?0:1,true);return;}
      if(['KeyW','ArrowUp'].includes(event.code)){event.preventDefault();duelInput(event.code==='ArrowUp'?1:0);}
      if(event.code==='Enter'&&state==='ready'){event.preventDefault();beginFlight();}
      return;
    }
    if(['Space','ArrowUp','KeyW','Enter'].includes(event.code)){event.preventDefault();action();}
    if(event.code==='KeyR'&&state==='over'){event.preventDefault();prepareFlight();}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();if(playback){playback.playing=false;updateReplayCaption();}}});
  window.addEventListener('blur',()=>{pause();if(playback){playback.playing=false;updateReplayCaption();}});
  window.addEventListener('pagehide',()=>{if(['playing','countdown'].includes(state))pause();save();});
  $('profilesButton').addEventListener('click',()=>{openDialog('profilesDialog');renderProfiles();});
  $('arenaProfilesButton').addEventListener('click',()=>{openDialog('profilesDialog');renderProfiles();});
  $('createProfile').addEventListener('click',createProfile);
  $('renameProfile').addEventListener('click',renameProfile);
  $('bossSkill').addEventListener('click',useBossGuard);
  $('powerP1').addEventListener('pointerdown',e=>{e.preventDefault();duelInput(0,true);});
  $('powerP2').addEventListener('pointerdown',e=>{e.preventDefault();duelInput(1,true);});
  for(const i of [0,1])$(`powerP${i+1}`).addEventListener('click',e=>{if(e.detail===0)duelInput(i,true);});
  for(const i of [1,2])$(`duelProfile${i}`).addEventListener('change',renderDuelSkins);
  $('helpButton').addEventListener('click',()=>openDialog('helpDialog'));
  $('settingsButton').addEventListener('click',()=>openDialog('settingsDialog'));
  for(const id of ['helpDialog','settingsDialog','profilesDialog'])$(id).addEventListener('click',e=>{if(e.target===$(id)){const r=$(id).getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$(id).close();}});
  $('soundButton').addEventListener('click',()=>{profile.settings.sound=!profile.settings.sound;applySettings();unlockAudio();save();playSound('coin');});
  $('soundSetting').addEventListener('change',e=>{profile.settings.sound=e.target.checked;applySettings();unlockAudio();save();playSound('coin');});
  $('motionSetting').addEventListener('change',e=>{profile.settings.reduceMotion=e.target.checked;applySettings();save();});
  $('exportButton').addEventListener('click',exportProgress);
  $('importButton').addEventListener('click',()=>$('importFile').click());
  $('importFile').addEventListener('change',e=>inspectImport(e.target.files[0]));
  $('cancelImport').addEventListener('click',()=>{pendingImport=null;pendingArenaImport=null;pendingPlayersImport=null;$('importConfirmation').hidden=true;$('backupStatus').textContent='Restauração cancelada. Seu progresso foi mantido.';});
  $('confirmImport').addEventListener('click',()=>{
    if(!pendingImport)return;
    if(pendingPlayersImport){players=pendingPlayersImport;pendingPlayersImport=null;}
    profile=pendingImport;syncActiveProfile();pendingImport=null;state='menu';run=null;duel=null;bossFight=null;ghost=null;review=null;playback=null;flightFrames=[];particles=[];floaters=[];
    $('playerNickname').value=profile.nickname;
    tournament=pendingArenaImport?.tournament||null;challenge=pendingArenaImport?.challenge||null;latestResultCode=challenge?.ownCode||'';pendingArenaImport=null;saveArena();
    checkAchievements(false);save();applySettings();updateProgressUI();renderOverlay();
    if(view==='arena')renderArena();
    $('importConfirmation').hidden=true;$('backupStatus').textContent='Progresso restaurado com sucesso!';toast('Sua coleção está de volta.','Tudo pronto para o próximo voo.');
  });
  $('fillTournamentProfiles').addEventListener('click',()=>{$('playerNames').value=players.entries.map(p=>p.name).join('\n');});
  $('createTournament').addEventListener('click',createTournament);
  $('achievementStatus').addEventListener('change',event=>{achievementStatus=event.target.value;renderAchievements();});
  $('generateChallenge').addEventListener('click',()=>enterChallenge(randomSeed()));
  $('joinChallenge').addEventListener('click',()=>{try{const code=$('challengeInput').value;enterChallenge(parseTrack(code),code.trim().toUpperCase().startsWith('CB3-')?'cb3':RULESET);}catch(error){$('challengeStatus').textContent=error.message;}});
  $('startChallenge').addEventListener('click',startChallengeFlight);
  $('copyChallenge').addEventListener('click',()=>copyField('activeChallengeCode'));
  $('copyResult').addEventListener('click',()=>copyField('resultCodeOutput'));
  $('verifyResult').addEventListener('click',()=>{
    if(!challenge){$('resultImportStatus').textContent='Entre em uma pista antes de receber resultados.';return;}
    try{
      const code=$('resultCodeInput').value.trim(),result=verifyReplay(code,challenge.seed,challenge.rules);
      const changed=addChallengeResult(result);challenge.ghostCode=code;saveArena();renderArena();
      $('ghostStatus').textContent=`Rival fantasma: ${result.player} · ${result.score} pontos. Será reproduzido na sua próxima tentativa.`;
      $('resultImportStatus').textContent=(changed?`Voo conferido: ${result.player}, ${result.score} pontos e ${result.coins} moedas. Placar atualizado!`:'Esse jogador já tem um resultado igual ou melhor nesta pista.')+' Rival fantasma preparado.';
      $('resultCodeInput').value='';
    }catch(error){$('resultImportStatus').textContent=error.message;}
  });
  $('obstacleGuide').innerHTML=REGIONS.map(r=>`<div><strong>${r.symbol} ${r.name} · ${r.at}+ pontos</strong>${OBSTACLES[r.id].name}: ${OBSTACLES[r.id].hint}</div>`).join('');
  checkAchievements(false);applySettings();save();updateProgressUI();renderOverlay();
  if(loadNotice)toast(loadNotice);
  requestAnimationFrame(frame);
})();
