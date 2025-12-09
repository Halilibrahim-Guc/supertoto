// --- AYARLAR ---
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Events = Matter.Events,
      Body = Matter.Body,
      Vector = Matter.Vector;

// Motoru oluştur
const engine = Engine.create();
const world = engine.world;

// Yerçekimi ayarı (Aşağı doğru)
engine.gravity.y = 1.0; 

// Ekran boyutlarını al
const width = window.innerWidth;
const height = window.innerHeight;

// Render (Çizim) aracını oluştur
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: width,
        height: height,
        wireframes: false, // Gerçek renkler görünsün
        background: '#27ae60' // Çim Yeşili
    }
});

// --- OYUN NESNELERİ ---

// 1. Duvarlar (Toplar dışarı kaçmasın)
const wallOptions = { isStatic: true, render: { fillStyle: 'transparent' } };
const ground = Bodies.rectangle(width/2, height + 50, width, 100, { isStatic: true, label: "Ground" }); // Zemin
const leftWall = Bodies.rectangle(-10, height/2, 20, height, wallOptions);
const rightWall = Bodies.rectangle(width+10, height/2, 20, height, wallOptions);

// 2. Kale (Topların birikeceği yer)
// Kalenin yan duvarlarını ve zeminini çiziyoruz ki toplar içinde biriksin.
const goalLeftPost = Bodies.rectangle(width/2 - 100, height - 60, 10, 120, { isStatic: true, render: { fillStyle: 'white'} });
const goalRightPost = Bodies.rectangle(width/2 + 100, height - 60, 10, 120, { isStatic: true, render: { fillStyle: 'white'} });
// Kalenin üst direği (Sadece görsel veya engel olabilir, burayı açık bırakıyoruz ki toplar girsin)

// 3. Pinler (Engeller)
const pins = [];
const rows = 5; 
for (let i = 0; i < rows; i++) {
    for (let j = 0; j < i + 3; j++) {
        // Piramit şeklinde dizersin veya görseldeki gibi sıralı
        let x = (width / 2) - (i * 40) + (j * 80); 
        let y = 200 + (i * 80);
        let pin = Bodies.circle(x, y, 5, { 
            isStatic: true,
            render: { fillStyle: 'white' },
            restitution: 0.8 // Zıplatma katsayısı
        });
        pins.push(pin);
    }
}

// 4. Kaleci (Hareketli Engel)
const goalie = Bodies.circle(width/2, height - 150, 20, { 
    isStatic: true, // Fizikten etkilenmez ama çarpışır
    label: "Goalie",
    render: { fillStyle: '#ecf0f1' } 
});

// Hepsini dünyaya ekle
Composite.add(world, [ground, leftWall, rightWall, goalLeftPost, goalRightPost, goalie, ...pins]);

// --- OYUN DÖNGÜSÜ VE MANTIK ---

// Kaleci Hareketi
let goalieSpeed = 3; // Hız
let goalieDirection = 1;
let goalieRange = 80; // Ne kadar sağa sola gidecek

Events.on(engine, 'beforeUpdate', function() {
    // Kaleciyi sürekli hareket ettir (Manuel kodlama kısmı)
    const px = goalie.position.x;
    if (px > (width/2 + goalieRange)) goalieDirection = -1;
    if (px < (width/2 - goalieRange)) goalieDirection = 1;
    
    // Pozisyonu güncelle
    Body.setPosition(goalie, {
        x: px + (goalieSpeed * goalieDirection),
        y: goalie.position.y
    });
});

// Çarpışma Mantığı (Kaleci Vuruşu)
Events.on(engine, 'collisionStart', function(event) {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
        let otherBody = null;
        if (pair.bodyA.label === "Goalie") otherBody = pair.bodyB;
        if (pair.bodyB.label === "Goalie") otherBody = pair.bodyA;

        if (otherBody && !otherBody.isStatic) {
            // Kaleci topa çarptı!
            // Topa kalecinin hareket yönünde ve yukarı doğru sert bir güç uygula
            let forceX = (Math.random() - 0.5) * 0.1; // Hafif rastgele sağ/sol
            let forceY = -0.05; // Yukarı sert fırlat
            
            // Eğer kaleci sağa gidiyorsa sağa, sola gidiyorsa sola ekstra güç
            forceX += goalieDirection * 0.02;

            Body.applyForce(otherBody, otherBody.position, { x: forceX, y: forceY });
        }
    });
});

// --- TOPLARI DÜŞÜRME FONKSİYONU ---
let ballCount = 9;
let monScore = 0;
let gsScore = 0;

function spawnBalls() {
    if (ballCount <= 0) {
        endGame();
        return;
    }

    // Top oluştur (Takım 1)
    let ball1 = Bodies.circle(width/2 - 50, 50, 15, {
        restitution: 0.6, // Sekme
        label: "Ball_MON",
        render: { 
            sprite: { texture: 'monacofc.png', xScale: 0.1, yScale: 0.1 } // Görsel ekleyebilirsin
            // Yoksa: fillStyle: 'red'
        }
    });

    // Top oluştur (Takım 2)
    let ball2 = Bodies.circle(width/2 + 50, 50, 15, {
        restitution: 0.6,
        label: "Ball_GS",
        render: { 
			sprite: { texture: 'gs.png', xScale: 0.1, yScale: 0.1 } // Görsel ekleyebilirsin
		} // Veya texture
    });

    Composite.add(world, [ball1, ball2]);
    
    ballCount--;
    document.getElementById('remaining-balls').innerText = ballCount;
}

// Skoru Kontrol Et (Basitçe: Top kalenin dibine değdi mi?)
// Not: Matter.js'de "collisionActive" ile kalenin içindeki zeminle temas eden topları sayabilirsin.

function endGame() {
    setTimeout(() => {
        document.getElementById('end-screen').style.display = 'flex';
        // Skor mantığını buraya bağlayıp kazananı yazdırırsın
    }, 5000); // Son toptan 5 sn sonra bitir
}

// Oyunu Başlat
Render.run(render);
var runner = Runner.create();
Runner.run(runner, engine);

// Her 2 saniyede bir top at
let gameInterval = setInterval(spawnBalls, 2000);