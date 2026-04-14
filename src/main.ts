import Phaser from 'phaser';

const anyWindow = window as any;
if (anyWindow.__GAME__) {
    anyWindow.__GAME__.destroy(true);
    anyWindow.__GAME__ = undefined;
}

// ─── Data Models ───────────────────────────────────────────────────────────
interface Question {
    prompt: string;
    options?: string[];
    correctIndex?: number;
    onCorrect?: () => void;
    onComplete?: () => void;
    textInput?: boolean;
    correctAnswer?: string;
    onTextCorrect?: () => void;
}

// ─── Level Registry ────────────────────────────────────────────────────────
// Each level needs: mapKey, title, startX/Y (player spawn in px), signX/Y (memory sign in px), question + options + correctIndex
// Map pixel coords = tile * 16. E.g. tile(3,13) on a 60x16 map = pixel(48, 208).
// [TODO] Replace placeholder questions / answers with real ones before gifting!
const LEVELS = [
    { title: '14 aprile 2025', mapKey: 'map_0', startX: 160, startY: 270, signX: 280, signY: 80, questionId: 'q-apartment', isCustomMap: true },
    {
        mapKey: 'map_1',
        title: "Primo Maggio",
        startX: 32, startY: 120,    // 20x15 map = 320x240px
        signX: 280, signY: 120      // Not used (custom multi-stage logic)
    },
    {
        mapKey: 'map_2',
        title: "Primo di...",
        startX: 64, startY: 317,    // 3x3 map @ 127px tiles = 381x381px
        signX: 317, signY: 64,      // top-right in the clearing
        question: "What was the name of the glamping site?",
        options: ["Option A", "Option B", "Option C"],
        correctIndex: 0  // [TODO]
    },
    {
        mapKey: 'map_3',
        title: "Arancin*",
        startX: 10, startY: 180,    // horizontal flow - spawn far left, clear of stalls
        signX: 0, signY: 0,
        isCustomMap: true,
    },
    {
        mapKey: 'map_4_1',
        title: "Lanzarote",
        startX: 32, startY: 150,    // Left side of asphalt
        signX: 0, signY: 0,
        isCustomMap: true
    },

    {
        mapKey: 'map_5',
        title: "Lanzarote, PT2",
        startX: 32, startY: 150,
        signX: 0, signY: 0,
        isCustomMap: true
    },
    {
        mapKey: 'map_7',
        title: "Tortellini",
        startX: 2200, startY: 1000,
        signX: 0, signY: 0,
        isCustomMap: true
    },
    {
        mapKey: 'map_8',
        title: "A casa, finalmente",
        startX: 2600, startY: 400,
        signX: 0, signY: 0,
        isCustomMap: true
    }
];

// ─── Title Scene ───────────────────────────────────────────────────────────
class TitleScene extends Phaser.Scene {
    constructor() { super('TitleScene'); }

    create() {
        const titleEl = document.getElementById('level-title');
        if (titleEl) titleEl.innerText = '';

        this.cameras.main.fadeIn(1000, 0, 0, 0);
        this.cameras.main.setZoom(4);
        this.cameras.main.centerOn(160, 90);

        this.add.text(160, 70, 'PRIMO DI MOLTI', {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            color: '#f8fafc'
        }).setOrigin(0.5);

        const prompt = this.add.text(160, 120, 'PREMI [E] PER INIZIARE', {
            fontFamily: '"Press Start 2P"',
            fontSize: '8px',
            color: '#94a3b8'
        }).setOrigin(0.5);

        // Simple blinking effect
        this.time.addEvent({
            delay: 600,
            loop: true,
            callback: () => prompt.setVisible(!prompt.visible)
        });

        const kb = this.input.keyboard!;
        const eKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        eKey.once('down', () => {
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('GameScene', { levelIndex: 0 });
            });
        });
    }
}

// ─── End Scene ─────────────────────────────────────────────────────────────
class EndScene extends Phaser.Scene {
    constructor() { super('EndScene'); }

    create() {
        // Hide the HTML dialog box entirely if it's somehow lingering
        document.getElementById('dialog-box')!.classList.add('hidden');
        const titleEl = document.getElementById('level-title');
        if (titleEl) titleEl.innerText = '';

        this.cameras.main.fadeIn(2000, 0, 0, 0);
        this.cameras.main.setZoom(4);
        this.cameras.main.centerOn(160, 90);

        this.add.text(160, 70, 'BUON 15 APRILE!', {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            color: '#22c55e'
        }).setOrigin(0.5);

        this.add.text(160, 110, 'Grazie per aver giocato \nal "Primo di Molti". \nPronta per rigiocare \nanche quest\'anno? <3', {
            fontFamily: '"Press Start 2P"',
            fontSize: '8px',
            color: '#94a3b8'
        }).setOrigin(0.5);
    }
}

// ─── Game Scene ────────────────────────────────────────────────────────────
class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite; // Sprite for HD 128x128 frame animations
    private keys!: { up: Phaser.Input.Keyboard.Key, down: Phaser.Input.Keyboard.Key, left: Phaser.Input.Keyboard.Key, right: Phaser.Input.Keyboard.Key, interact: Phaser.Input.Keyboard.Key };
    private SPEED = 80;

    private interactables: any[] = [];
    private activeInteractable: any = null;
    private interactPrompt!: Phaser.GameObjects.Text;

    private isDialogActive = false;
    private activeQuestion: Question | null = null;

    private currentLevelIndex = 0;
    private isDrivingVan = false;
    private hasDismountedVan = false;
    private vanSprite!: Phaser.Physics.Arcade.Sprite;

    constructor() { super('GameScene'); }

    init(data: any) {
        // Start the game at the beginning
        this.currentLevelIndex = data.levelIndex !== undefined ? data.levelIndex : 4;
        this.interactables = [];
        this.activeInteractable = null;
        this.isDialogActive = false;
    }

    preload() {
        const levelConfig = LEVELS[this.currentLevelIndex];
        if (!(levelConfig as any).isCustomMap) {
            this.load.tilemapTiledJSON(levelConfig.mapKey as string, `/assets/${levelConfig.mapKey}.json?v=` + Date.now());
        }
        this.load.image('grass', '/assets/grass_01.png');
        this.load.image('grass02', '/assets/grass_02.png'); // For Level 1
        this.load.image('tuscany_grass', '/assets/tuscany_grass.png'); // For Level 2
        this.load.image('fences', '/assets/fences.png');
        this.load.image('city', '/assets/city.png');

        // Level 0 objects
        this.load.image('tesla', '/assets/tesla.png');
        this.load.image('apartment_door', '/assets/apartment_door.png');
        this.load.image('night_pole', '/assets/night_pole.png');

        // Level 1 objects
        this.load.image('olive_tree', '/assets/olive_tree.png');
        // Level 0 missing assets
        this.load.image('road_asphalt', '/assets/road_asphalt.png');
        this.load.image('sidewalk_pavement', '/assets/sidewalk_pavement.png');
        this.load.image('building_1', '/assets/building_1.png');
        this.load.image('building_2', '/assets/building_2.png');
        this.load.image('building_3', '/assets/building_3.png');
        this.load.image('spark_car', '/assets/spark_car.png');

        this.load.image('basel_painting', '/assets/basel_painting.png');
        this.load.image('frames', '/assets/frames.png');
        this.load.image('picnic', '/assets/picnic.png');

        // Level 1 animations
        this.load.image('butterfly', '/assets/butterfly.png');
        this.load.spritesheet('bird', '/assets/bird.png', { frameWidth: 256, frameHeight: 256 });

        // Level 2 objects
        this.load.image('tent', '/assets/tent.png');
        this.load.image('night_tent', '/assets/night_tent.png');
        this.load.image('fireplace', '/assets/fireplace.png');
        this.load.image('tree_1', '/assets/tree_1.png');
        this.load.image('tree_2', '/assets/tree_2.png');

        // Level 3 objects
        this.load.image('sicilian_market_1', '/assets/sicilian_market_1.png');
        this.load.image('sicilian_market_2', '/assets/sicilian_market_2.png');
        this.load.image('sicilian_market_3', '/assets/sicilian_market_3.png');
        this.load.image('sicilian_house', '/assets/sicilian_house.png');
        this.load.image('sicily_pavement', '/assets/sicily_pavement.png');
        this.load.image('cobblestone', '/assets/cobblestone.png');
        this.load.image('sand', '/assets/sand.png');
        this.load.image('sea', '/assets/sea.png');
        this.load.image('panda', '/assets/panda.png');
        this.load.image('umbrella', '/assets/umbrella.png');
        this.load.image('oasis_fruit', '/assets/oasis_fruit.png');
        this.load.image('oasis', '/assets/oasis.png');
        this.load.image('direction', '/assets/direction.png');

        // Level 4 objects
        this.load.image('lanzarote_bg', '/assets/lanzarote_background.jpg');
        this.load.image('volcanic_rock_1', '/assets/volcanic_rock_1.png');
        this.load.image('volcanic_rock_2', '/assets/volcanic_rock_2.png');
        this.load.image('van', '/assets/van.png');
        this.load.image('papagayo', '/assets/papagayo.png');

        // Level 5 objects
        this.load.image('van_sand', '/assets/van_sand.png');
        this.load.image('sand_lanzarote', '/assets/sand_lanzarote.png');
        this.load.spritesheet('carlos', '/assets/carlos.png', { frameWidth: 128, frameHeight: 128 });

        // Level 6 objects 
        this.load.image('table', '/assets/table.png');
        this.load.image('tortellini_shape', '/assets/tortellini_shape.png');
        this.load.image('rolling_pin', '/assets/rolling_pin.png');

        // Level 7 objects 
        this.load.image('snow_tracks', '/assets/snow_tracks.png');
        this.load.image('socks', '/assets/socks.png');

        // Level 8 objects 
        this.load.image('apartment', '/assets/apartment.png');
        this.load.image('nonna_apartment', '/assets/nonna_apartment.png');
        this.load.spritesheet('amber', '/assets/amber.png', { frameWidth: 128, frameHeight: 128 });

        // Characters (Upgraded 128x128 spritesheets inside 512x512 grids)
        this.load.spritesheet('character', '/assets/main_character.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('nonna', '/assets/nonna.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('sister', '/assets/sister.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('sister_nonnas', '/assets/sister_nonnas.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('boyfriend', '/assets/boyfriend.png', { frameWidth: 128, frameHeight: 128 });
    }

    create() {
        this.cameras.main.fadeIn(800, 0, 0, 0);
        // Determine base zoom: normal is 4, +20% zoom is 4.8
        let targetZoom = 4.8;
        if (this.currentLevelIndex === 0) {
            targetZoom = 5.8; // Zoomed in an extra 20%
        } else if (this.currentLevelIndex === 6 || this.currentLevelIndex === 7) {
            targetZoom = 0.5; // Huge maps
        } else if (this.currentLevelIndex === 4) {
            targetZoom = 4; // Original zoom for Lanzarote PT1 map
        }
        this.cameras.main.setZoom(targetZoom);


        // Apply LINEAR anti-aliasing filter to detailed custom images so they render smoothly in High-DPI mode
        const detailedImages = [
            'tesla', 'apartment_door', 'night_pole', 'olive_tree', 'basel_painting', 'frames', 'picnic',
            'tent', 'fireplace', 'tree_1', 'tree_2', 'sicilian_market_1', 'sicilian_market_2', 'sicilian_market_3', 'sicilian_house',
            'lanzarote_bg', 'timanfaya_bg', 'papagayo', 'volcanic_rock_1', 'volcanic_rock_2', 'van', 'van_sand', 'table', 'tortellini_shape', 'rolling_pin',
            'sofa', 'macbook', 'cooking_pot', 'nonna_apartment',
            'road_asphalt', 'sidewalk_pavement', 'building_1', 'building_2', 'building_3', 'spark_car',
            'butterfly', 'bird',
            'panda', 'umbrella', 'direction', 'oasis_fruit', 'sicily_pavement', 'cobblestone', 'sand', 'sea',
            'character', 'nonna', 'sister', 'boyfriend'
        ];
        detailedImages.forEach(key => {
            if (this.textures.exists(key)) {
                this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
            }
        });

        // Force NEAREST filtering for grass tilesets (pixel art)
        const pixelArtTextures = ['grass', 'grass02', 'fences', 'city'];
        pixelArtTextures.forEach(key => {
            if (this.textures.exists(key)) {
                this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
            }
        });

        const levelConfig = LEVELS[this.currentLevelIndex];

        // ── Player sprite (Scale 0.125 -> exactly 16px from 128px frame)
        this.player = this.physics.add.sprite(levelConfig.startX, levelConfig.startY, 'character').setDepth(2).setScale(0.125);
        (this.player.body as Phaser.Physics.Arcade.Body).setSize(120, 120); // Scale 0.125 of 120 is 15px body
        this.player.setCollideWorldBounds(true);

        // Map bounds + camera
        let mapWidth = 320;
        let mapHeight = 180;

        if ((levelConfig as any).isCustomMap) {
            // Level-specific custom map sizes
            if (this.currentLevelIndex === 0) {
                mapWidth = 320; mapHeight = 300;
            } else if (this.currentLevelIndex === 3) {
                mapWidth = 2000; mapHeight = 400;
            } else if (this.currentLevelIndex === 4) {
                mapWidth = 2500; mapHeight = 384; // Map height dictated by 2 rows of scale 0.1 (1920*0.1*2=384)
            } else if (this.currentLevelIndex === 5) {
                mapWidth = 1000; mapHeight = 300;
            } else if (this.currentLevelIndex === 6) {
                mapWidth = 2861; mapHeight = 2861;
            } else if (this.currentLevelIndex === 7) {
                mapWidth = 2861; mapHeight = 2792;
            } else {
                mapWidth = 320; mapHeight = 300;
            }
        } else {
            const map = this.make.tilemap({ key: levelConfig.mapKey });
            mapWidth = map.widthInPixels;
            mapHeight = map.heightInPixels;

            // Use grass_02 for Level 1, tuscany_grass for Level 2, grass_01 for others
            let grassKey = 'grass';
            let grassTilesetName = 'grass';
            if (levelConfig.mapKey === 'map_1') {
                grassKey = 'grass02';
            } else if (levelConfig.mapKey === 'map_2') {
                grassKey = 'tuscany_grass';
                grassTilesetName = 'tuscany_grass';
            }
            const tGrass = map.addTilesetImage(grassTilesetName, grassKey);
            const tCity = map.addTilesetImage('city', 'city');
            const tFences = map.addTilesetImage('fences', 'fences');

            if (tCity || tGrass) {
                void map.createLayer('Ground', [tGrass, tCity].filter(t => !!t) as Phaser.Tilemaps.Tileset[], 0, 0)!.setDepth(0);
                // Force pixel-perfect rendering for grass tiles
                if (tGrass && tGrass.image) {
                    tGrass.image.setFilter(Phaser.Textures.FilterMode.NEAREST);
                }
            }
            if (tFences || tCity) {
                const walls = map.createLayer('Walls', [tFences, tCity].filter(t => !!t) as Phaser.Tilemaps.Tileset[], 0, 0)!.setDepth(1);
                // Force pixel-perfect rendering for wall tiles
                if (tFences && tFences.image) {
                    tFences.image.setFilter(Phaser.Textures.FilterMode.NEAREST);
                }
                if (tCity && tCity.image) {
                    tCity.image.setFilter(Phaser.Textures.FilterMode.NEAREST);
                }
                map.setCollisionBetween(1, 9999, true, false, 'Walls');
                this.physics.add.collider(this.player, walls);
            }
        }

        this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Character animations restored (128x128 HD frames)
        if (!this.anims.exists('walk-down')) {
            this.anims.create({ key: 'walk-down', frames: this.anims.generateFrameNumbers('character', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'walk-left', frames: this.anims.generateFrameNumbers('character', { start: 4, end: 7 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'walk-right', frames: this.anims.generateFrameNumbers('character', { start: 8, end: 11 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'walk-up', frames: this.anims.generateFrameNumbers('character', { start: 12, end: 15 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('character', { start: 0, end: 0 }), frameRate: 1, repeat: 0 });
        }

        if (!this.anims.exists('nonna-idle')) {
            this.anims.create({ key: 'nonna-idle', frames: this.anims.generateFrameNumbers('nonna', { start: 0, end: 3 }), frameRate: 4, repeat: -1 });
        }

        if (!this.anims.exists('sister-idle')) {
            this.anims.create({ key: 'sister-idle', frames: this.anims.generateFrameNumbers('sister', { start: 0, end: 0 }), frameRate: 1, repeat: 0 });
        }

        if (!this.anims.exists('sister_nonnas-idle')) {
            this.anims.create({ key: 'sister_nonnas-idle', frames: this.anims.generateFrameNumbers('sister_nonnas', { start: 0, end: 0 }), frameRate: 1, repeat: 0 });
            this.anims.create({ key: 'sister_nonnas-walk-down', frames: this.anims.generateFrameNumbers('sister_nonnas', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'sister_nonnas-walk-left', frames: this.anims.generateFrameNumbers('sister_nonnas', { start: 4, end: 7 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'sister_nonnas-walk-right', frames: this.anims.generateFrameNumbers('sister_nonnas', { start: 8, end: 11 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'sister_nonnas-walk-up', frames: this.anims.generateFrameNumbers('sister_nonnas', { start: 12, end: 15 }), frameRate: 8, repeat: -1 });
        }

        if (!this.anims.exists('boyfriend-idle')) {
            this.anims.create({ key: 'boyfriend-idle', frames: this.anims.generateFrameNumbers('boyfriend', { start: 0, end: 0 }), frameRate: 1, repeat: 0 });
            this.anims.create({ key: 'boyfriend-walk-down', frames: this.anims.generateFrameNumbers('boyfriend', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'boyfriend-walk-right', frames: this.anims.generateFrameNumbers('boyfriend', { start: 4, end: 7 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'boyfriend-walk-left', frames: this.anims.generateFrameNumbers('boyfriend', { start: 8, end: 11 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'boyfriend-walk-up', frames: this.anims.generateFrameNumbers('boyfriend', { start: 12, end: 15 }), frameRate: 8, repeat: -1 });
        }

        if (!this.anims.exists('carlos-walk-left')) {
            this.anims.create({ key: 'carlos-walk-left', frames: this.anims.generateFrameNumbers('carlos', { start: 8, end: 11 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'carlos-idle', frames: [{ key: 'carlos', frame: 8 }], frameRate: 1, repeat: 0 });
        }

        if (!this.anims.exists('amber-idle')) {
            this.anims.create({ key: 'amber-idle', frames: this.anims.generateFrameNumbers('amber', { start: 0, end: 3 }), frameRate: 4, repeat: -1 });
        }

        // ── Level 0 exclusive assets: Tesla, NPC, rain, night tint
        if (this.currentLevelIndex === 0) {
            // Road and Sidewalk TileSprites (Vertically Looping Floor) centered in 320px width window
            // The trimmed urban span is 192px wide. 320 - 192 = 128 / 2 = 64px offset buffer padded per side.
            const road = this.add.tileSprite(160, 150, 132, 300, 'road_asphalt').setDepth(0);
            road.tileScaleX = 0.125; road.tileScaleY = 0.125;

            const ls = this.add.tileSprite(79, 150, 30, 300, 'sidewalk_pavement').setDepth(0);
            ls.tileScaleX = 0.125; ls.tileScaleY = 0.125;

            const rs = this.add.tileSprite(241, 150, 30, 300, 'sidewalk_pavement').setDepth(0);
            rs.tileScaleX = 0.125; rs.tileScaleY = 0.125;

            // Collidable Buildings (Edges) - stacked shoulder to shoulder
            const leftBuildings = ['building_1', 'building_2', 'building_3'];
            const rightBuildings = ['building_3', 'building_1', 'building_2'];
            let bIndex = 0;
            for (let y = 38; y <= 350; y += 75) {
                const lb = this.physics.add.staticImage(64, y, leftBuildings[bIndex % 3]).setDepth(1).setScale(0.15);
                lb.refreshBody();
                const rb = this.physics.add.staticImage(256, y, rightBuildings[bIndex % 3]).setDepth(1).setScale(0.15);
                rb.refreshBody();

                this.physics.add.collider(this.player, lb);
                this.physics.add.collider(this.player, rb);
                bIndex++;
            }

            // Night Poles spaced uniquely
            for (let y = 50; y <= 300; y += 100) {
                this.add.image(84, y, 'night_pole').setDepth(1).setScale(0.05);
                this.add.image(236, y, 'night_pole').setDepth(1).setScale(0.05);
            }

            // Vehicles Parked on Left Side, mapped to face Left
            const spark = this.physics.add.staticImage(114, 150, 'spark_car').setDepth(1).setScale(0.12);
            spark.refreshBody();
            // Flipped to face Left native layout
            spark.setFlipX(true);

            const car = this.physics.add.staticImage(114, 175, 'tesla').setDepth(1).setScale(0.12);
            car.refreshBody();
            car.setFlipX(true);

            this.physics.add.collider(this.player, car);
            this.physics.add.collider(this.player, spark);

            // Boyfriend NPC — standing just below the Tesla
            const boyfriend = this.physics.add.staticSprite(114, 190, 'boyfriend').setDepth(2).setScale(0.125);
            boyfriend.refreshBody();
            boyfriend.anims.play('boyfriend-idle');

            // Advance logic machine for Level 0
            this.interactables.push({
                x: boyfriend.x,
                y: boyfriend.y,
                radius: 36,
                getQuestion: () => ({
                    prompt: "Che musica state ascoltando?",
                    options: ["Tony Pitony", "The Story So Far", "Vasco Rossi", "Salmo"],
                    correctIndex: 1,
                    onCorrect: () => {
                        this.showHTMLDialog({
                            prompt: 'David: "allora vado..."\n\n(Premi E per continuare)',
                            onComplete: () => {
                                this.showHTMLDialog({
                                    prompt: 'Maddalena: "ti inviterei su ma abbiamo 30 anni e domani si lavora..."\n\n(Premi E per continuare)',
                                    onComplete: () => {
                                        this.closeHTMLDialog();
                                        this.tweens.add({
                                            targets: [boyfriend, car],
                                            alpha: 0,
                                            duration: 1000,
                                            onComplete: () => {
                                                car.body.enable = false;
                                                boyfriend.body.enable = false;

                                                const door = this.physics.add.staticImage(75, 150, 'apartment_door').setDepth(1).setScale(0.08).setAngle(90);
                                                door.setFlipX(true);
                                                door.refreshBody();
                                                door.setAlpha(0);
                                                this.physics.add.collider(this.player, door);

                                                this.tweens.add({
                                                    targets: door,
                                                    alpha: 1,
                                                    duration: 1000,
                                                    onComplete: () => {
                                                        this.interactables = [{
                                                            x: door.x,
                                                            y: door.y,
                                                            radius: 36,
                                                            getQuestion: () => ({
                                                                prompt: "David: \"Hai dimenticato qualcosa che devo assolutamente riportarti ora?\"",
                                                                options: ["i fantasmini", "il mio dente temporaneo", "io no, tu le buone maniere", "l'ombrello nel bagagliaio"],
                                                                correctIndex: 3,
                                                                onCorrect: () => {
                                                                    this.showHTMLDialog({ prompt: "✓ Suuuuuuu" });
                                                                    setTimeout(() => {
                                                                        this.closeHTMLDialog();
                                                                        this.advanceLevel();
                                                                    }, 1500);
                                                                }
                                                            })
                                                        }];
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                })
            });

            // Night tint overlay (dark blue semi-transparent rect covering whole world)
            this.add.rectangle(0, 0, mapWidth, mapHeight, 0x0f172a, 0.45)
                .setOrigin(0, 0).setDepth(3).setScrollFactor(1);

            // Rain particles (small white dots falling down)
            const rainGraphics = this.make.graphics({ x: 0, y: 0 });
            rainGraphics.fillStyle(0xaad4f5, 1);
            rainGraphics.fillRect(0, 0, 1, 4);
            rainGraphics.generateTexture('raindrop', 1, 4);
            rainGraphics.destroy();

            this.add.particles(0, 0, 'raindrop', {
                x: { min: 0, max: mapWidth },
                y: { min: 0, max: mapHeight }, // spawn everywhere
                lifespan: 800,
                speedY: { min: 400, max: 600 },
                speedX: { min: -15, max: -5 },
                quantity: 4,
                frequency: 20,
                alpha: { start: 0.6, end: 0 },
                scale: { min: 0.8, max: 1.2 },
            }).setDepth(4);
        }

        // ── Level 1: 1st of May (Three-stage progressive interaction)
        if (this.currentLevelIndex === 1) {
            // Olive trees - all positioned on upper side only
            const olivePositions = [
                { x: 50, y: 50 }, { x: 120, y: 45 }, { x: 190, y: 55 },
                { x: 260, y: 50 }, { x: 280, y: 90 }, { x: 350, y: 55 }
            ];
            olivePositions.forEach(pos => {
                this.add.image(pos.x, pos.y, 'olive_tree').setDepth(1).setScale(0.1);
            });

            // Picnic blanket - 30% smaller (0.12 * 0.7 = 0.084)
            this.add.image(250, 120, 'picnic').setDepth(0).setScale(0.084);

            // Horizontal road at bottom (road_asphalt TileSprite)
            const road = this.add.tileSprite(160, 200, 320, 60, 'road_asphalt').setDepth(0);
            road.tileScaleX = 0.125; road.tileScaleY = 0.125;

            // Butterfly animation (if not created yet)
            if (!this.anims.exists('butterfly-fly')) {
                // Single frame butterfly - no animation needed
            }

            // Bird animation (4 frames in 2x2 grid)
            if (!this.anims.exists('bird-fly')) {
                this.anims.create({
                    key: 'bird-fly',
                    frames: this.anims.generateFrameNumbers('bird', { start: 0, end: 3 }),
                    frameRate: 8,
                    repeat: -1
                });
            }

            // Butterflies - particle emitters using sprite
            this.add.particles(0, 0, 'butterfly', {
                x: { min: 30, max: 300 },
                y: { min: 20, max: 140 },
                speedX: { min: -20, max: 20 },
                speedY: { min: -30, max: -10 },
                lifespan: 3000,
                frequency: 800,
                quantity: 1,
                scale: { min: 0.004, max: 0.008 },
                alpha: { start: 0.8, end: 0.3 },
                angle: { min: 0, max: 360 },
                rotate: { min: -180, max: 180 },
            }).setDepth(2);

            // Rare bird - flies across screen periodically
            const spawnBird = () => {
                const bird = this.add.sprite(-30, Phaser.Math.Between(20, 100), 'bird')
                    .setDepth(2).setScale(0.03).setAlpha(0.9);

                bird.anims.play('bird-fly');

                this.tweens.add({
                    targets: bird,
                    x: 350,
                    y: Phaser.Math.Between(30, 110),
                    duration: Phaser.Math.Between(4000, 6000),
                    ease: 'Linear',
                    onComplete: () => bird.destroy()
                });
            };

            // Spawn first bird after 2 seconds, then every 8-15 seconds
            this.time.delayedCall(2000, spawnBird);
            this.time.addEvent({
                delay: Phaser.Math.Between(8000, 15000),
                callback: spawnBird,
                loop: true
            });

            // STAGE 1: Boyfriend NPC (interactive from start) - NOT WALKABLE
            const boyfriend = this.physics.add.staticSprite(230, 120, 'boyfriend')
                .setDepth(2).setScale(0.125);
            boyfriend.refreshBody();
            this.physics.add.collider(this.player, boyfriend);
            boyfriend.anims.play('boyfriend-idle');

            // STAGE 2: Frames (hidden, will fade in after Stage 1)
            const frames = this.add.image(250, 145, 'frames')
                .setDepth(1).setScale(0.06).setAlpha(0);

            // STAGE 3: Tesla (always has collision - NOT WALKABLE)
            const tesla = this.physics.add.staticImage(50, 180, 'tesla')
                .setDepth(1).setScale(0.12);
            tesla.refreshBody();
            this.physics.add.collider(this.player, tesla);

            // Warm tint overlay for late afternoon 6pm (hidden initially)
            // Create graphics object that fills entire screen
            const tintGraphics = this.add.graphics();
            tintGraphics.fillStyle(0xd69555, 0); // Darker warm orange for 6pm
            tintGraphics.fillRect(-5000, -5000, 10000, 10000);
            tintGraphics.setDepth(100);
            tintGraphics.setScrollFactor(0);

            // Store alpha separately since graphics don't tween alpha well
            let tintAlpha = 0;
            const updateTint = () => {
                tintGraphics.clear();
                tintGraphics.fillStyle(0xd69555, tintAlpha); // Darker warm orange
                tintGraphics.fillRect(-5000, -5000, 10000, 10000);
            };

            // STAGE 1 INTERACTION: Boyfriend asks about painting inspiration
            this.interactables.push({
                x: boyfriend.x,
                y: boyfriend.y,
                radius: 36,
                getQuestion: () => ({
                    prompt: "David: non ho mai fatto un quadretto con i colori in acrillico, dove posso prendere inspo tra...?",
                    options: [
                        "Il canale dei robot aspirapolvere",
                        "pinterest",
                        "crudelia memon",
                        "il blog di Android Developers"
                    ],
                    correctIndex: 1, // "pinterest"
                    onCorrect: () => {
                        this.closeHTMLDialog();

                        // Fade in the frames
                        this.tweens.add({
                            targets: frames,
                            alpha: 1,
                            duration: 1000,
                            onComplete: () => {
                                // Replace interactables array with Stage 2
                                this.interactables = [{
                                    x: frames.x,
                                    y: frames.y,
                                    radius: 36,
                                    getQuestion: () => ({
                                        prompt: "Che bei quadretti, ma aspetta, qual è l'intruso?",
                                        options: ["1", "2", "3"], // 3 options only
                                        correctIndex: 1, // "2"
                                        onCorrect: () => {
                                            this.closeHTMLDialog();
                                            console.log('[DEBUG] Triggering lighting change tween...');

                                            // Change lighting to late afternoon (6pm golden hour)
                                            this.tweens.addCounter({
                                                from: 0,
                                                to: 0.25,
                                                duration: 2000,
                                                onUpdate: (tween) => {
                                                    const val = tween.getValue();
                                                    if (val !== null) {
                                                        tintAlpha = val;
                                                        updateTint();
                                                    }
                                                },
                                                onStart: () => {
                                                    console.log('[DEBUG] Lighting tween started, changing from 0 to 0.45');
                                                },
                                                onComplete: () => {
                                                    console.log('[DEBUG] Lighting tween complete, alpha is now', tintAlpha);
                                                    // STAGE 3: Boyfriend notices the time
                                                    this.interactables = [{
                                                        x: boyfriend.x,
                                                        y: boyfriend.y,
                                                        radius: 36,
                                                        getQuestion: () => ({
                                                            prompt: 'David: "si è fatta una certa..."',
                                                            onComplete: () => {
                                                                this.closeHTMLDialog();

                                                                // Now enable Tesla interaction (STAGE 4)
                                                                this.interactables = [{
                                                                    x: tesla.x,
                                                                    y: tesla.y,
                                                                    radius: 36,
                                                                    getQuestion: () => ({
                                                                        prompt: "Andiamo a vedere il tramonto a...",
                                                                        options: [
                                                                            "Serramazzonicasainmontagna",
                                                                            "Monte Vangelo",
                                                                            "Vante Mongelo",
                                                                            "Sarnano"
                                                                        ],
                                                                        correctIndex: 1, // "Monte Vangelo"
                                                                        onCorrect: () => {
                                                                            this.showHTMLDialog({
                                                                                prompt: "✓ Suuuuuuu"
                                                                            });
                                                                            setTimeout(() => {
                                                                                this.closeHTMLDialog();
                                                                                this.advanceLevel();
                                                                            }, 1500);
                                                                        }
                                                                    })
                                                                }];
                                                            }
                                                        })
                                                    }];
                                                }
                                            });
                                        }
                                    })
                                }];
                            }
                        });
                    }
                })
            });
        }

        // ── Level 2: Tuscany Glamping - Multi-stage narrative with hidden forest path
        if (this.currentLevelIndex === 2) {
            // Tent in center of clearing (store reference for texture switching)
            const tent = this.add.image(190, 190, 'tent').setDepth(1).setScale(0.15);

            // Dense forest of 84 trees creating visual path: spawn → boyfriend → tesla → tent
            // Trees at depth 3 so characters/objects appear to walk "under" canopy
            const treePositions = [
                // Inner ring around tent
                [150, 150], [190, 140], [230, 150], [240, 190], [230, 230], [190, 240], [150, 230], [140, 190],

                // Middle area
                [120, 120], [190, 110], [260, 120], [270, 190], [260, 260], [190, 270], [120, 260], [110, 190],
                [135, 135], [245, 135], [245, 245], [135, 245],

                // Corners and edges (dense forest)
                [30, 30], [95, 30], [160, 30], [220, 30], [285, 30], [350, 30],
                [30, 95], [350, 95], [30, 160], [350, 160], [30, 220], [350, 220],
                [30, 285], [95, 285], [160, 285], [220, 285], [285, 285], [350, 285],
                [30, 350], [95, 350], [160, 350], [220, 350], [285, 350], [350, 350],

                // Additional scattered trees
                [60, 60], [190, 60], [320, 60], [60, 190], [320, 190], [60, 320], [190, 320], [320, 320],
                [45, 120], [335, 120], [45, 260], [335, 260], [120, 45], [260, 45], [120, 335], [260, 335],

                // 28 additional trees for 84 total (1.5x increase) - filling gaps in hidden path
                [75, 75], [105, 75], [145, 75], [175, 75], [205, 75], [235, 75], [265, 75], [305, 75],
                [75, 105], [305, 105], [75, 145], [305, 145], [75, 175], [305, 175],
                [75, 205], [305, 205], [75, 235], [305, 235], [75, 265], [305, 265],
                [75, 305], [105, 305], [145, 305], [175, 305], [205, 305], [235, 305], [265, 305], [305, 305]
            ];

            // Make trees collidable to create maze-like hidden path
            // Only some trees have collision - creating a subtle guiding path
            const treeSprites: Phaser.Physics.Arcade.Image[] = [];
            const collidableIndices = new Set([
                // Strategic trees to create path boundaries (not all trees)
                0, 2, 4, 6, // Inner ring (some)
                8, 10, 12, 14, 16, // Middle area (some)
                20, 22, 24, 26, 28, 30, 32, 34, 36, 38, // Corners/edges (alternating)
                44, 46, 48, 50, 52, // Additional scattered (some)
                56, 58, 60, 62, 64, 66, 68, 70, // Extra trees (some)
                72, 74, 76, 78, 80, 82 // Filling gaps (some)
            ]);

            treePositions.forEach(([x, y], i) => {
                const treeType = i % 2 === 0 ? 'tree_1' : 'tree_2';

                if (collidableIndices.has(i)) {
                    // Collidable tree - creates maze walls
                    const tree = this.physics.add.staticImage(x, y, treeType).setDepth(3).setScale(0.1);
                    tree.refreshBody();
                    (tree.body as Phaser.Physics.Arcade.StaticBody).setCircle(8); // Small collision radius
                    this.physics.add.collider(this.player, tree);
                    treeSprites.push(tree);
                } else {
                    // Decorative tree - walkable
                    this.add.image(x, y, treeType).setDepth(3).setScale(0.1);
                }
            });

            // Boyfriend NPC - starting interaction point
            const boyfriend = this.physics.add.staticSprite(100, 200, 'boyfriend').setDepth(2).setScale(0.125);
            boyfriend.refreshBody();
            boyfriend.anims.play('boyfriend-idle');
            this.physics.add.collider(this.player, boyfriend);

            // Tesla - second stage interaction (top-right corner)
            const tesla = this.physics.add.staticImage(330, 50, 'tesla').setDepth(2).setScale(0.12);
            tesla.refreshBody();
            tesla.setFlipX(true);
            this.physics.add.collider(this.player, tesla);

            // Night tint overlay for lighting transition (initially transparent)
            const nightGraphics = this.add.graphics();
            nightGraphics.fillStyle(0x0a1128, 0);
            nightGraphics.fillRect(-5000, -5000, 10000, 10000);
            nightGraphics.setDepth(100);
            nightGraphics.setScrollFactor(0);

            let nightAlpha = 0;
            const updateNightTint = () => {
                nightGraphics.clear();
                nightGraphics.fillStyle(0x0a1128, nightAlpha);
                nightGraphics.fillRect(-5000, -5000, 10000, 10000);
            };

            // STAGE 1: Boyfriend asks about the location
            this.interactables.push({
                x: boyfriend.x,
                y: boyfriend.y,
                radius: 36,
                getQuestion: () => ({
                    prompt: "Carino sto posto, come si chiama?",
                    options: [
                        "Il muletto",
                        "l'albicocco",
                        "la gallinella",
                        "la melanzana"
                    ],
                    correctIndex: 2,
                    onCorrect: () => {
                        this.closeHTMLDialog();

                        // Switch tent to night version IMMEDIATELY in daylight (before night transition)
                        tent.setTexture('night_tent');

                        // Wait a moment so player can see the night tent in daylight, THEN start night transition
                        setTimeout(() => {
                            // Transition to night
                            this.tweens.addCounter({
                                from: 0,
                                to: 0.55,
                                duration: 2500,
                                onUpdate: (tween) => {
                                    const val = tween.getValue();
                                    if (val !== null) {
                                        nightAlpha = val;
                                        updateNightTint();
                                    }
                                },
                                onComplete: () => {
                                    // STAGE 2: Enable tesla interaction
                                    this.interactables = [{
                                        x: tesla.x,
                                        y: tesla.y,
                                        radius: 36,
                                        getQuestion: () => ({
                                            prompt: 'la macchina è tutta appannata...',
                                            onComplete: () => {
                                                this.closeHTMLDialog();

                                                // STAGE 3: Enable tent text input interaction
                                                this.interactables = [{
                                                    x: tent.x,
                                                    y: tent.y,
                                                    radius: 36,
                                                    getQuestion: () => ({
                                                        prompt: 'benveuti alla Gallinella, prenota qui la colazione',
                                                        textInput: true,
                                                        correctAnswer: 'Maddalena X 2',
                                                        onTextCorrect: () => {
                                                            this.closeHTMLDialog();

                                                            // Final quiz question
                                                            this.showHTMLDialog({
                                                                prompt: 'per colazione ci sarà...',
                                                                options: [
                                                                    "Torta all'albicocca",
                                                                    "Torta alla gallinella",
                                                                    "Torta alla melanzana",
                                                                    "Torta al muletto"
                                                                ],
                                                                correctIndex: 0,
                                                                onCorrect: () => {
                                                                    this.showHTMLDialog({ prompt: "✓ Suuuuuuu" });
                                                                    setTimeout(() => {
                                                                        this.closeHTMLDialog();
                                                                        this.advanceLevel();
                                                                    }, 1500);
                                                                }
                                                            });
                                                        }
                                                    })
                                                }];
                                            }
                                        })
                                    }];
                                }
                            });
                        }, 1000);
                    }
                })
            });
        }

        // ── Level 3: Sicily — Horizontal three sub-scenes: Siracusa → Calamosche → Oasi della Frutta
        if (this.currentLevelIndex === 3) {
            // ──────────────────────────────────────────────────────────────────
            // SCENE 1: SIRACUSA CITY (x 0 – 600)
            // Floor: sicilian pavement tiled horizontally
            const pavSprite = this.add.tileSprite(300, 200, 600, 400, 'sicily_pavement').setDepth(0);
            pavSprite.tileScaleX = 0.125; pavSprite.tileScaleY = 0.125;

            // Smaller houses (0.08 scale) – behind the top stall row
            this.add.image(70, 70, 'sicilian_house').setDepth(1).setScale(0.08);
            this.add.image(280, 70, 'sicilian_house').setDepth(1).setScale(0.08);
            this.add.image(490, 70, 'sicilian_house').setDepth(1).setScale(0.08);

            // Market stalls: two rows forming a horizontal corridor
            // Top row y=135, Bottom row y=265
            const stallXs = [60, 130, 200, 270, 340, 410, 480, 550];
            const stallTypes = ['sicilian_market_1', 'sicilian_market_2', 'sicilian_market_3'];

            stallXs.forEach((x, i) => {
                // Top row stall
                const tm = this.physics.add.staticImage(x, 135, stallTypes[i % 3]).setDepth(1).setScale(0.195);
                tm.refreshBody();
                this.physics.add.collider(this.player, tm);

                // Bottom row stall - rotated 180 degrees
                const bm = this.physics.add.staticImage(x, 265, stallTypes[(i + 1) % 3]).setDepth(1).setScale(0.195).setAngle(180);
                bm.refreshBody();  // Refresh after rotation to align physics body
                this.physics.add.collider(this.player, bm);
            });

            // Panda car – near spawn
            this.add.image(30, 200, 'panda').setDepth(1).setScale(0.13);

            // BF1 near the end of the stalls, slightly higher (closer to top row)
            const boyfriend1 = this.physics.add.staticSprite(550, 180, 'boyfriend').setDepth(2).setScale(0.138);
            boyfriend1.refreshBody();
            boyfriend1.anims.play('boyfriend-idle');

            this.interactables.push({
                x: boyfriend1.x,
                y: boyfriend1.y,
                radius: 36,
                getQuestion: () => ({
                    prompt: 'David: "buono sto panino anche se forse fa un po\' caldino... come si chiama sto posto?"',
                    options: ['Multe a Ortigia', 'Iris dentro le tasche', 'caseificio borderi'],
                    correctIndex: 2,
                    onCorrect: () => {
                        this.closeHTMLDialog();
                        this.tweens.add({
                            targets: boyfriend1, alpha: 0, duration: 800, onComplete: () => {
                                boyfriend1.body.enable = false;
                                this.interactables = [];
                            }
                        });
                    }
                })
            });

            // ──────────────────────────────────────────────────────────────────
            // TRANSITION 1: Siracusa → Beach (x 600 – 750)
            const trans1Sand = this.add.tileSprite(675, 200, 150, 400, 'sand').setDepth(0);
            trans1Sand.tileScaleX = 0.02; trans1Sand.tileScaleY = 0.02;

            // Cobblestone visual decorations (no collision)
            for (let cx = 600; cx <= 750; cx += 20) {
                this.add.image(cx, 175, 'cobblestone').setDepth(1).setScale(0.05).setAngle(90);
                this.add.image(cx, 225, 'cobblestone').setDepth(1).setScale(0.05).setAngle(-90);
            }

            // Invisible collision walls for transition 1
            const trans1WallTop = this.physics.add.staticImage(675, 165, '__DEFAULT').setAlpha(0).setDepth(0);
            (trans1WallTop.body as Phaser.Physics.Arcade.StaticBody).setSize(150, 30);
            trans1WallTop.refreshBody();
            this.physics.add.collider(this.player, trans1WallTop);

            const trans1WallBot = this.physics.add.staticImage(675, 235, '__DEFAULT').setAlpha(0).setDepth(0);
            (trans1WallBot.body as Phaser.Physics.Arcade.StaticBody).setSize(150, 30);
            trans1WallBot.refreshBody();
            this.physics.add.collider(this.player, trans1WallBot);

            // ──────────────────────────────────────────────────────────────────
            // SCENE 2: CALAMOSCHE BEACH (x 750 – 1400)
            // Sand floor
            const beachSand = this.add.tileSprite(1075, 200, 650, 400, 'sand').setDepth(0);
            beachSand.tileScaleX = 0.02; beachSand.tileScaleY = 0.02;

            // Sea at the bottom
            const seaSprite = this.add.tileSprite(1075, 360, 650, 80, 'sea').setDepth(1);
            seaSprite.tileScaleX = 0.125; seaSprite.tileScaleY = 0.125;

            // Umbrella
            this.add.image(1100, 200, 'umbrella').setDepth(1).setScale(0.12);

            // BF2 near umbrella
            const boyfriend2 = this.physics.add.staticSprite(1150, 200, 'boyfriend').setDepth(2).setScale(0.138).setAlpha(0);
            boyfriend2.refreshBody();
            boyfriend2.body.enable = false;
            boyfriend2.anims.play('boyfriend-idle');

            (this as any)._bf2Spawned = false;
            (this as any)._bf2 = boyfriend2;
            (this as any)._bf2X = 850; // trigger X

            // Invisible collision walls for beach
            const beachWallTop = this.physics.add.staticImage(1075, 165, '__DEFAULT').setAlpha(0).setDepth(0);
            (beachWallTop.body as Phaser.Physics.Arcade.StaticBody).setSize(650, 30);
            beachWallTop.refreshBody();
            this.physics.add.collider(this.player, beachWallTop);

            const beachWallBot = this.physics.add.staticImage(1075, 235, '__DEFAULT').setAlpha(0).setDepth(0);
            (beachWallBot.body as Phaser.Physics.Arcade.StaticBody).setSize(650, 30);
            beachWallBot.refreshBody();
            this.physics.add.collider(this.player, beachWallBot);

            // ──────────────────────────────────────────────────────────────────
            // TRANSITION 2: Beach → Oasis (x 1400 – 1550)
            const trans2Sand = this.add.tileSprite(1475, 200, 150, 400, 'sand').setDepth(0);
            trans2Sand.tileScaleX = 0.02; trans2Sand.tileScaleY = 0.02;

            // Cobblestone visual decorations (no collision)
            for (let cx2 = 1400; cx2 <= 1550; cx2 += 20) {
                this.add.image(cx2, 175, 'cobblestone').setDepth(1).setScale(0.05).setAngle(90);
                this.add.image(cx2, 225, 'cobblestone').setDepth(1).setScale(0.05).setAngle(-90);
            }

            // Invisible collision walls for transition 2
            const trans2WallTop = this.physics.add.staticImage(1475, 165, '__DEFAULT').setAlpha(0).setDepth(0);
            (trans2WallTop.body as Phaser.Physics.Arcade.StaticBody).setSize(150, 30);
            trans2WallTop.refreshBody();
            this.physics.add.collider(this.player, trans2WallTop);

            const trans2WallBot = this.physics.add.staticImage(1475, 235, '__DEFAULT').setAlpha(0).setDepth(0);
            (trans2WallBot.body as Phaser.Physics.Arcade.StaticBody).setSize(150, 30);
            trans2WallBot.refreshBody();
            this.physics.add.collider(this.player, trans2WallBot);

            // Direction signpost
            this.add.image(1475, 200, 'direction').setDepth(1).setScale(0.08);

            // ──────────────────────────────────────────────────────────────────
            // SCENE 3: OASI DELLA FRUTTA (x 1550 – 2000)
            const oasisSand = this.add.tileSprite(1775, 200, 450, 400, 'sand').setDepth(0);
            oasisSand.tileScaleX = 0.02; oasisSand.tileScaleY = 0.02;

            // NEW Oasis asset
            this.add.image(1850, 200, 'oasis').setDepth(1).setScale(0.2);

            // BF3
            const boyfriend3 = this.physics.add.staticSprite(1930, 200, 'boyfriend').setDepth(2).setScale(0.138).setAlpha(0);
            boyfriend3.refreshBody();
            boyfriend3.body.enable = false;
            boyfriend3.anims.play('boyfriend-idle');

            (this as any)._bf3Spawned = false;
            (this as any)._bf3 = boyfriend3;
            (this as any)._bf3X = 1650; // trigger X

            // Invisible collision walls for oasis
            const oasisWallTop = this.physics.add.staticImage(1775, 165, '__DEFAULT').setAlpha(0).setDepth(0);
            (oasisWallTop.body as Phaser.Physics.Arcade.StaticBody).setSize(450, 30);
            oasisWallTop.refreshBody();
            this.physics.add.collider(this.player, oasisWallTop);

            const oasisWallBot = this.physics.add.staticImage(1775, 235, '__DEFAULT').setAlpha(0).setDepth(0);
            (oasisWallBot.body as Phaser.Physics.Arcade.StaticBody).setSize(450, 30);
            oasisWallBot.refreshBody();
            this.physics.add.collider(this.player, oasisWallBot);

            (this as any)._setupBf2 = () => {
                let bf2Stage = 0;
                this.interactables = [{
                    x: boyfriend2.x, y: boyfriend2.y, radius: 36,
                    getQuestion: () => {
                        if (bf2Stage === 0) {
                            return {
                                prompt: 'David: "questo ombrello va benissimo, non preocupparti..."',
                                onComplete: () => {
                                    this.closeHTMLDialog();
                                    bf2Stage = 1;
                                }
                            };
                        } else {
                            return {
                                prompt: 'David: "ok vado a vedere i pesciolini..."',
                                onComplete: () => {
                                    this.closeHTMLDialog();
                                    this.tweens.add({
                                        targets: boyfriend2, alpha: 0, duration: 800, onComplete: () => {
                                            boyfriend2.body.enable = false;
                                            this.interactables = [];
                                        }
                                    });
                                }
                            };
                        }
                    }
                }];
            };

            (this as any)._setupBf3 = () => {
                this.interactables = [{
                    x: boyfriend3.x, y: boyfriend3.y, radius: 36,
                    getQuestion: () => ({
                        prompt: 'David: "no vabe guarda sto posto, ci fermiamo a prendere qualcosa?"',
                        options: ['yes', 'yes'],
                        correctIndex: 0,
                        onCorrect: () => {
                            this.closeHTMLDialog();
                            this.tweens.add({
                                targets: boyfriend3, alpha: 0, duration: 800, onComplete: () => {
                                    boyfriend3.body.enable = false;
                                    this.showHTMLDialog({ prompt: '✓ Suuuuuuu' });
                                    setTimeout(() => { this.closeHTMLDialog(); this.advanceLevel(); }, 1500);
                                }
                            });
                        }
                    })
                }];
            };
        }

        // ── Level 4: Lanzarote
        if (this.currentLevelIndex === 4) {
            const bgScale = 0.1;
            const bgWidth = 1920 * bgScale;
            const bgHeight = 1920 * bgScale;

            for (let row = 0; row < 2; row++) {
                for (let col = 0; col < 5; col++) {
                    const x = col * bgWidth;
                    const y = row * bgHeight;
                    const img = this.add.image(x, y, 'lanzarote_bg').setOrigin(0, 0).setDepth(-1).setScale(bgScale);
                    if (col % 2 === 1) img.setFlipX(true);
                    if (row % 2 === 1) img.setFlipY(true);
                }
            }

            const roadScale = 0.1;
            // The tileScale only scales the inner texture, so the sprite's width should be the exact world length we want to draw.
            // Since the van stops at x=1050, we set the road width to 1100.
            const road = this.add.tileSprite(0, 150, 1100, 60, 'road_asphalt').setOrigin(0, 0).setDepth(0);
            road.tileScaleX = roadScale; road.tileScaleY = roadScale;

            // Place Papagayo at the end of the 5-tile grid (5 * 1920 * 0.1 = 960)
            this.add.image(960, 0, 'papagayo').setOrigin(0, 0).setDepth(-2).setScale(0.13);
            this.vanSprite = this.physics.add.sprite(32, 153, 'van').setDepth(1).setScale(0.12);
            this.isDrivingVan = true;
            this.hasDismountedVan = false;
            this.player.setVisible(false);
            (this.player.body as Phaser.Physics.Arcade.Body).enable = false;

            this.cameras.main.startFollow(this.vanSprite, true, 0.1, 0.1);
        }

        // ── Level 5: Lanzarote pt2 - Van in the Sand
        if (this.currentLevelIndex === 5) {
            // Unscaled repeated sand texture filling the background map
            const bg = this.add.tileSprite(0, 0, 2000, 1000, 'sand_lanzarote').setOrigin(0, 0).setDepth(-1);
            bg.tileScaleX = 0.03; bg.tileScaleY = 0.03;

            this.vanSprite = this.physics.add.sprite(32, 160, 'van').setDepth(1).setScale(0.12);
            this.isDrivingVan = true;
            this.hasDismountedVan = false;
            this.player.setVisible(false);
            (this.player.body as Phaser.Physics.Arcade.Body).enable = false;

            this.cameras.main.startFollow(this.vanSprite, true, 0.1, 0.1);
        }

        // ── Level 6: Tortellini with Nonna
        if (this.currentLevelIndex === 6) {
            this.add.image(0, 0, 'nonna_apartment').setOrigin(0, 0).setDepth(0);

            // Scale the player up heavily to match the large map
            this.player.setScale(3);
            // Tighten the collision body so the huge bounding box doesn't push the player far away 
            (this.player.body as Phaser.Physics.Arcade.Body).setSize(40, 80);

            // Add Table Collision in the middle - invisible static body
            const tableCollision = this.add.rectangle(1330, 1630, 1000, 800, 0xff0000, 0).setOrigin(0.5);
            this.physics.add.existing(tableCollision, true);
            this.physics.add.collider(this.player, tableCollision);

            // Add Amber in a bottom-right spot for this level
            const amber = this.physics.add.staticSprite(2100, 2300, 'amber').setDepth(2).setScale(3);
            this.physics.add.collider(this.player, amber);
            amber.anims.play('amber-idle');

            // Add Nonna NPC - moved even more southern
            const nonna = this.physics.add.staticSprite(1600, 2300, 'nonna').setDepth(2).setScale(3);
            this.physics.add.collider(this.player, nonna);
            nonna.anims.play('nonna-idle');

            // Add Boyfriend NPC - moved northern
            const bf = this.physics.add.staticSprite(1850, 1000, 'boyfriend').setDepth(2).setScale(3);
            this.physics.add.collider(this.player, bf);
            bf.anims.play('boyfriend-idle');

            // Add Sister NPC (Nonna's version) - moved northern and makes her move
            const sisterNonnas = this.physics.add.sprite(1100, 1150, 'sister_nonnas').setDepth(2).setScale(3);
            sisterNonnas.setImmovable(true);
            this.physics.add.collider(this.player, sisterNonnas);
            sisterNonnas.anims.play('sister_nonnas-idle');

            // Sister interaction - follows her movement
            const sisterInteractable = {
                x: sisterNonnas.x, y: sisterNonnas.y, radius: 350,
                getQuestion: () => ({
                    prompt: "la nonna è troppo veloce a fare la sfoglia, dobbiamo essere più rapide!",
                    onComplete: () => {
                        this.closeHTMLDialog();
                    }
                })
            };
            this.interactables.push(sisterInteractable);
            (sisterInteractable as any).sprite = sisterNonnas;

            // Movement sequence: -400x, +500y, and back twice (2x faster)
            const sStartX = 1100;
            const sStartY = 1150;
            this.tweens.chain({
                targets: sisterNonnas,
                loop: 1, // Repeat once = total 2 cycles
                tweens: [
                    {
                        x: sStartX - 400,
                        duration: 1000,
                        ease: 'Linear',
                        onStart: () => sisterNonnas.anims.play('sister_nonnas-walk-left', true)
                    },
                    {
                        y: sStartY + 500,
                        duration: 2000,
                        ease: 'Linear',
                        onStart: () => sisterNonnas.anims.play('sister_nonnas-walk-down', true)
                    },
                    {
                        y: sStartY,
                        duration: 2000,
                        ease: 'Linear',
                        onStart: () => sisterNonnas.anims.play('sister_nonnas-walk-up', true)
                    },
                    {
                        x: sStartX,
                        duration: 1000,
                        ease: 'Linear',
                        onStart: () => sisterNonnas.anims.play('sister_nonnas-walk-right', true)
                    }
                ],
                onComplete: () => {
                    sisterNonnas.anims.play('sister_nonnas-idle', true);
                }
            });

            this.interactables.push({
                x: 2100, y: 2300, radius: 350,
                getQuestion: () => ({
                    prompt: "Woof! *annusa un pezzetto di prosciutto* ...",
                    onComplete: () => {
                        this.closeHTMLDialog();
                    }
                })
            });

            // Boyfriend interaction (2 stages)
            let bfStage = 0;
            this.interactables.push({
                x: 1850, y: 1000, radius: 350,
                getQuestion: () => ({
                    prompt: bfStage === 0 ? "mentre io ne faccio uno voi ne avete già preparati 4..." : "tutti soldatini come dice Lara...",
                    onComplete: () => {
                        this.closeHTMLDialog();
                        if (bfStage === 0) bfStage = 1;
                    }
                })
            });

            // Nonna interaction (2 stages + level end)
            let nonnaStage = 0;
            this.interactables.push({
                x: 1600, y: 2300, radius: 350,
                getQuestion: () => ({
                    prompt: nonnaStage === 0 ? "ma no maddalena devono essere tutti uguali i tortellini, questo qui è più corto dell'altro..." : "dammi il rullino, vedrai che saranno buonissimi...",
                    onComplete: () => {
                        this.closeHTMLDialog();
                        if (nonnaStage === 0) {
                            nonnaStage = 1;
                        } else {
                            this.advanceLevel();
                        }
                    }
                })
            });
        }


        // ── Level 7: At Your Apartment
        if (this.currentLevelIndex === 7) {
            this.add.image(0, 0, 'apartment').setOrigin(0, 0).setDepth(0);

            // The apartment is huge, so scale the player up heavily to match the furniture size
            this.player.setScale(3);
            // Tighten the collision body so the huge bounding box doesn't push the player far away 
            (this.player.body as Phaser.Physics.Arcade.Body).setSize(40, 80);

            // Add Amber, also giant scale to match
            const amber = this.physics.add.staticSprite(600, 1900, 'amber').setDepth(2).setScale(3);
            // Do NOT call refreshBody() so her collision box stays small and tight at the center
            this.physics.add.collider(this.player, amber);
            amber.anims.play('amber-idle');

            this.interactables.push({
                x: 600, y: 1900, radius: 350,
                getQuestion: () => ({
                    prompt: "Woof! *si mette l'intera gamba in gola* ...",
                    onComplete: () => {
                        this.closeHTMLDialog();
                    }
                })
            });

            // Add Boyfriend to trigger the end scene on the other side of Amber (Right side, x: 900)
            const boyfriend = this.physics.add.staticSprite(1900, 2300, 'boyfriend').setDepth(2).setScale(3);
            // Do NOT call refreshBody() so his collision box stays small
            this.physics.add.collider(this.player, boyfriend);
            boyfriend.anims.play('boyfriend-idle');

            let bfStage = 0;
            this.interactables.push({
                x: 1900, y: 2200, radius: 350,
                getQuestion: () => {
                    if (bfStage === 0) {
                        return {
                            prompt: "Giriamo e rigiriamo ma moltissimi ricordi li stiamo costruendo a casa, anche non facendo nulla\n\n(Premi E per continuare)",
                            onComplete: () => {
                                this.closeHTMLDialog();
                                bfStage = 1;
                            }
                        };
                    } else if (bfStage === 1) {
                        return {
                            prompt: "però aspetta, c'è un quadro che non c'entra nulla qui e che Gemini ha sballato nella creazione di questo mondo. Quale?\n\n(Premi E per continuare)",
                            onComplete: () => {
                                this.closeHTMLDialog();
                                bfStage = 2;
                            }
                        }; 1
                    } else if (bfStage === 2) {
                        return {
                            prompt: "Quale è questo quadro?",
                            options: ["the batman", "Vi/ Va", "Le due mani bianche e nere", "quando a letto l'amore c'è"],
                            correctIndex: 0,
                            onCorrect: () => {
                                this.showHTMLDialog({
                                    prompt: "bella la bacheca...\n\n(Premi E per continuare)",
                                    onComplete: () => {
                                        this.closeHTMLDialog();
                                        bfStage = 3;
                                    }
                                });
                            }
                        };
                    } else {
                        return {
                            prompt: "Vai a vedere la bacheca!",
                            onComplete: () => { this.closeHTMLDialog(); }
                        };
                    }
                }
            });

            // The right-side middle interaction
            this.interactables.push({
                x: 2700, y: 1000, radius: 250, // wide radius to catch player walking near the right edge
                getQuestion: () => {
                    if (bfStage < 3) {
                        return {
                            prompt: "Sembra esserci una carta, ma prima dovrei parlare con lui...",
                            onComplete: () => { this.closeHTMLDialog(); }
                        };
                    } else {
                        return {
                            prompt: "c'è una carta sulla bacheca...che carta è?",
                            options: ["Re di quadri", "regina di fiori", "re di cuori", "asso di bastoni"],
                            correctIndex: 1,
                            onCorrect: () => {
                                this.showHTMLDialog({ prompt: "✓ Suuuuuuu" });
                                setTimeout(() => {
                                    this.closeHTMLDialog();
                                    this.advanceLevel();
                                }, 1500);
                            }
                        };
                    }
                }
            });
        }

        const kb = this.input.keyboard!;
        this.keys = {
            up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            interact: kb.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        };

        const titleEl = document.getElementById('level-title');
        if (titleEl) titleEl.innerText = levelConfig.title;

        // Core Memory Interactable
        if (this.currentLevelIndex !== 0 && this.currentLevelIndex !== 1) {
            const sign = this.physics.add.staticImage(levelConfig.signX, levelConfig.signY, 'picnic').setDepth(0).setVisible(false);
            this.add.rectangle(levelConfig.signX, levelConfig.signY, 12, 12, 0x3b82f6).setDepth(0);

            this.interactables.push({
                x: sign.x,
                y: sign.y,
                radius: 36, // 15 distance for 320x180 = ~36 for zoomed characters
                getQuestion: () => ({
                    prompt: levelConfig.question,
                    options: levelConfig.options,
                    correctIndex: levelConfig.correctIndex,
                    onCorrect: () => {
                        this.showHTMLDialog({ prompt: "✓ Suuuuuuu" });
                        setTimeout(() => {
                            this.closeHTMLDialog();
                        }, 1500); // Wait 1.5 seconds, then transition to next level
                    }
                })
            });
        }

        this.interactPrompt = this.add.text(0, 0, 'E', {
            fontSize: '10px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#0f172a',
            backgroundColor: '#f8fafc',
            padding: { x: 3, y: 1 }
        }).setDepth(10).setOrigin(0.5, 1.5).setVisible(false);

        if (this.currentLevelIndex === 7 || this.currentLevelIndex === 6) {
            this.interactPrompt.setScale(5);
        }

        kb.on('keydown-E', () => {
            // Don't handle E key if text input is active (prevent closing dialog during typing)
            if (this.activeQuestion?.textInput) return;

            if (this.isDialogActive && !this.activeQuestion?.options) {
                const completeCb = this.activeQuestion?.onComplete;
                this.closeHTMLDialog();
                if (completeCb) completeCb();
            } else if (!this.isDialogActive && this.activeInteractable) {
                this.showHTMLDialog(this.activeInteractable.getQuestion());
            }
        });

        anyWindow.handleDialogAnswer = (index: number) => this.handleAnswer(index);
        anyWindow.handleTextInput = (value: string) => this.handleTextInput(value);

        if (this.currentLevelIndex === 0) {
            this.showHTMLDialog({
                prompt: "Come giocare:\n- WASD per muoversi\n- E per interagire\n- Mouse per le risposte",
                onComplete: () => {
                    this.closeHTMLDialog();
                }
            });
        }
    }

    advanceLevel() {
        this.player.setVelocity(0); // Stop player
        this.cameras.main.fadeOut(1000, 0, 0, 0); // Cinematic fade out
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            if (this.currentLevelIndex + 1 < LEVELS.length) {
                // Restart scene with the next level index
                this.scene.restart({ levelIndex: this.currentLevelIndex + 1 });
            } else {
                // Out of levels, show the End Screen
                this.scene.start('EndScene');
            }
        });
    }

    // ── HTML Dialog Logic ──
    showHTMLDialog(q: Question) {
        this.isDialogActive = true;
        this.activeQuestion = q;
        this.interactPrompt.setVisible(false);
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0);

        const box = document.getElementById('dialog-box')!;
        const textEl = document.getElementById('dialog-text')!;
        const optsEl = document.getElementById('dialog-options')!;
        const promptEl = document.getElementById('dialog-prompt')!;
        const inputContainer = document.getElementById('dialog-input-container')!;
        const inputEl = document.getElementById('dialog-input') as HTMLInputElement;

        textEl.innerText = q.prompt;
        box.classList.remove('hidden');

        optsEl.innerHTML = '';
        inputContainer.style.display = 'none';
        promptEl.style.display = 'none';

        if (q.textInput) {
            // Show text input mode
            inputContainer.style.display = 'block';
            inputEl.value = '';

            // Disable Phaser keyboard input to prevent WASD/E from interfering with text input
            if (this.input.keyboard) {
                this.input.keyboard.enabled = false;
            }

            // Re-enable Phaser keyboard when input loses focus or dialog closes
            const restoreKeyboard = () => {
                if (this.input.keyboard) {
                    this.input.keyboard.enabled = true;
                }
            };

            inputEl.addEventListener('blur', restoreKeyboard, { once: true });

            // Focus input after a tiny delay to ensure keyboard is fully disabled
            setTimeout(() => {
                inputEl.focus();
            }, 50);
        } else if (q.options) {
            // Show button options mode
            q.options.forEach((opt, idx) => {
                const btn = document.createElement('button');
                btn.className = 'dialog-option';
                btn.innerText = opt;
                btn.onclick = () => anyWindow.handleDialogAnswer(idx);
                optsEl.appendChild(btn);
            });
        } else {
            // Show press E to continue mode
            promptEl.style.display = 'block';
        }
    }

    closeHTMLDialog() {
        this.isDialogActive = false;
        this.activeQuestion = null;
        document.getElementById('dialog-box')!.classList.add('hidden');

        // Re-enable Phaser keyboard input (in case it was disabled for text input)
        if (this.input.keyboard) {
            this.input.keyboard.enabled = true;
        }
    }

    handleAnswer(index: number) {
        if (!this.activeQuestion) return;

        const opts = document.querySelectorAll<HTMLElement>('.dialog-option');
        const clickedBtn = opts[index];
        opts.forEach(b => (b as HTMLButtonElement).disabled = true);

        if (index === this.activeQuestion.correctIndex && this.activeQuestion.onCorrect) {
            clickedBtn.classList.add('correct');
            setTimeout(() => this.activeQuestion!.onCorrect!(), 500);
        } else {
            clickedBtn.classList.add('wrong');
            setTimeout(() => {
                clickedBtn.classList.remove('wrong');
                opts.forEach(b => (b as HTMLButtonElement).disabled = false);
            }, 700);
        }
    }

    handleTextInput(value: string) {
        if (!this.activeQuestion || !this.activeQuestion.textInput) return;

        const inputEl = document.getElementById('dialog-input') as HTMLInputElement;
        const submitBtn = document.getElementById('dialog-submit-btn') as HTMLButtonElement;

        // Disable input while processing
        inputEl.disabled = true;
        submitBtn.disabled = true;

        // Normalize both strings for comparison (trim, lowercase, remove extra spaces)
        const normalizedInput = value.trim().toLowerCase().replace(/\s+/g, ' ');
        const normalizedAnswer = this.activeQuestion.correctAnswer?.trim().toLowerCase().replace(/\s+/g, ' ');

        if (normalizedInput === normalizedAnswer && this.activeQuestion.onTextCorrect) {
            inputEl.classList.add('correct');
            submitBtn.classList.add('correct');
            setTimeout(() => this.activeQuestion!.onTextCorrect!(), 500);
        } else {
            inputEl.classList.add('wrong');
            submitBtn.classList.add('wrong');
            setTimeout(() => {
                inputEl.classList.remove('wrong');
                submitBtn.classList.remove('wrong');
                inputEl.disabled = false;
                submitBtn.disabled = false;
                inputEl.value = '';

                // Re-disable Phaser keyboard for retry (since we're refocusing)
                if (this.input.keyboard) {
                    this.input.keyboard.enabled = false;
                }

                inputEl.focus();
            }, 700);
        }
    }

    // ── Player velocity ──────────────────────────────────────────────────────
    private lastDir = 'down';

    update() {
        // Disable player movement during any dialog (including text input)
        if (this.isDialogActive) {
            this.player.anims.play('idle', true);
            (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0);
            return;
        }

        this.activeInteractable = null;
        this.interactPrompt.setVisible(false);

        if (this.isDrivingVan && !this.hasDismountedVan && this.vanSprite) {
            const vanBody = this.vanSprite.body as Phaser.Physics.Arcade.Body;
            vanBody.setVelocity(0);

            // Van can only move horizontally
            let speedMult = 1.5;
            if (this.currentLevelIndex === 5 && this.vanSprite.x > 200) {
                // Slow down the van before it hits the stuck point (at 300)
                speedMult = 0.5;
            }

            if (this.keys.left.isDown) { vanBody.setVelocityX(-this.SPEED * speedMult); this.vanSprite.setFlipX(true); }
            if (this.keys.right.isDown) { vanBody.setVelocityX(+this.SPEED * speedMult); this.vanSprite.setFlipX(false); }

            // Check if arrived at beach
            const stopPoint = this.currentLevelIndex === 4 ? 950 : 300;
            if (this.vanSprite.x > stopPoint) {
                vanBody.setVelocityX(0); // Stop the van

                // Dismount logic interaction
                this.interactables = [{
                    x: this.vanSprite.x,
                    y: this.vanSprite.y,
                    radius: 80,
                    getQuestion: () => ({
                        prompt: "Premi E per scendere dal van",
                        onComplete: () => {
                            this.hasDismountedVan = true;
                            this.isDrivingVan = false;
                            this.player.setVisible(true);
                            this.player.setPosition(this.vanSprite.x + 30, this.vanSprite.y + 20);
                            (this.player.body as Phaser.Physics.Arcade.Body).enable = true;
                            this.vanSprite.body!.immovable = true;
                            this.physics.add.collider(this.player, this.vanSprite);
                            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

                            if (this.currentLevelIndex === 4) {
                                // Load boyfriend interaction after dismounting (Level 4)
                                const boyfriend = this.physics.add.staticSprite(1250, 200, 'boyfriend').setDepth(2).setScale(0.125);
                                boyfriend.anims.play('boyfriend-idle');

                                this.interactables = [{
                                    x: 1250,
                                    y: 200,
                                    radius: 40,
                                    getQuestion: () => ({
                                        prompt: "Bella Papagayo. Lo sai chi ha costruito questa spiaggia?",
                                        options: ["Manrique", "César", "un famoso artista e architetto delle canarie"],
                                        correctIndex: 0,
                                        onCorrect: () => {
                                            this.closeHTMLDialog();
                                            this.interactables = []; // Clear current interaction

                                            // Make boyfriend walk left towards the van
                                            boyfriend.anims.play('boyfriend-walk-left', true);

                                            this.tweens.add({
                                                targets: boyfriend,
                                                x: this.vanSprite.x + 80,
                                                y: this.vanSprite.y + 30,
                                                duration: 2000,
                                                onComplete: () => {
                                                    boyfriend.anims.play('boyfriend-idle', true);

                                                    // Night tint overlay for lighting transition
                                                    const nightGraphics = this.add.graphics();
                                                    nightGraphics.fillStyle(0x0a1128, 0);
                                                    nightGraphics.fillRect(-5000, -5000, 10000, 10000);
                                                    nightGraphics.setDepth(100);
                                                    nightGraphics.setScrollFactor(0);

                                                    let nightAlpha = 0;
                                                    const updateNightTint = () => {
                                                        nightGraphics.clear();
                                                        nightGraphics.fillStyle(0x0a1128, nightAlpha);
                                                        nightGraphics.fillRect(-5000, -5000, 10000, 10000);
                                                    };

                                                    // Transition to night
                                                    this.tweens.addCounter({
                                                        from: 0,
                                                        to: 0.65,
                                                        duration: 2500,
                                                        onUpdate: (tween) => {
                                                            const val = tween.getValue();
                                                            if (val !== null) {
                                                                nightAlpha = val;
                                                                updateNightTint();
                                                            }
                                                        },
                                                        onComplete: () => {
                                                            // Re-enable interaction with the second question
                                                            this.interactables = [{
                                                                x: boyfriend.x,
                                                                y: boyfriend.y,
                                                                radius: 50,
                                                                getQuestion: () => ({
                                                                    prompt: "mi devi dire qualcosa?",
                                                                    options: ["Bisogna svuotare le acque grigie", "Il cous cous si è scotto", "Tele club stasera?", "Ti Amo"],
                                                                    correctIndex: 3,
                                                                    onCorrect: () => {
                                                                        this.showHTMLDialog({ prompt: "✓ Suuuuuuu" });
                                                                        setTimeout(() => {
                                                                            this.closeHTMLDialog();
                                                                            this.advanceLevel();
                                                                        }, 1500);
                                                                    }
                                                                })
                                                            }];
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    })
                                }];
                            } else if (this.currentLevelIndex === 5) {
                                // Level 5 Dis-mount logic
                                this.vanSprite.setTexture('van_sand');
                                this.vanSprite.setScale(0.1425); // NO ANGLE (no tilt), 5% smaller than before

                                // Adjust visual offset because van_sand is a slightly different size
                                this.vanSprite.setPosition(this.vanSprite.x + 30, this.vanSprite.y + 15);

                                const bfX = this.vanSprite.x + 70;
                                const bfY = this.vanSprite.y + 20;
                                const boyfriend = this.physics.add.staticSprite(bfX, bfY, 'boyfriend').setDepth(2).setScale(0.125);
                                boyfriend.anims.play('boyfriend-idle');
                                boyfriend.setAlpha(0);
                                this.tweens.add({ targets: boyfriend, alpha: 1, duration: 800 });

                                const createEndBfInteraction = () => {
                                    this.interactables = [{
                                        x: bfX, y: bfY, radius: 40,
                                        getQuestion: () => ({
                                            prompt: "grandeee, con questo ce la faremo sicuramente...",
                                            onComplete: () => {
                                                this.showHTMLDialog({
                                                    prompt: "mmm...",
                                                    onComplete: () => {
                                                        this.showHTMLDialog({
                                                            prompt: "mi sa che dormiamo qui",
                                                            onComplete: () => {
                                                                this.closeHTMLDialog();
                                                                this.interactables = []; // Clear for now

                                                                // Spawn Carlos off-screen right
                                                                const carlosX = bfX + 300;
                                                                const carlosY = bfY;
                                                                const carlos = this.physics.add.sprite(carlosX, carlosY, 'carlos').setDepth(2).setScale(0.125);
                                                                carlos.setFlipX(false); // Do not flip horizontally, let the row frames dictate direction
                                                                (carlos.body as Phaser.Physics.Arcade.Body).immovable = true;
                                                                carlos.anims.play('carlos-walk-left', true);

                                                                // Tween walking towards boyfriend
                                                                this.tweens.add({
                                                                    targets: carlos,
                                                                    x: bfX + 60,
                                                                    duration: 3000,
                                                                    onComplete: () => {
                                                                        carlos.anims.play('carlos-idle', true);
                                                                        this.interactables = [{
                                                                            x: bfX + 60, y: carlosY, radius: 40,
                                                                            getQuestion: () => ({
                                                                                prompt: "hola, mi chiamo carlos, acabo de terminar de trabajar en mi pizzería",
                                                                                onComplete: () => {
                                                                                    this.showHTMLDialog({
                                                                                        prompt: "Cómo se llama mi pizzería? parlos anche italiano...",
                                                                                        options: ["Erbazzones", "Ciapapolveres", "cajun", "El Sabio"],
                                                                                        correctIndex: 3,
                                                                                        onCorrect: () => {
                                                                                            this.showHTMLDialog({
                                                                                                prompt: "ah husto, ecco una tabla de madera",
                                                                                                onComplete: () => {
                                                                                                    this.showHTMLDialog({ prompt: "✓ Suuuuuuu" });
                                                                                                    setTimeout(() => {
                                                                                                        this.closeHTMLDialog();
                                                                                                        this.advanceLevel();
                                                                                                    }, 1500);
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                    });
                                                                                }
                                                                            })
                                                                        }];
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        })
                                    }];
                                };

                                const createVanCenterInteraction = () => {
                                    this.interactables = [{
                                        x: this.vanSprite.x, y: this.vanSprite.y + 20, radius: 40, // center bottom
                                        getQuestion: () => ({
                                            prompt: "vediamo cosa c'è...",
                                            options: ["tappetini", "tagliere", "asse di legno"],
                                            correctIndex: 1,
                                            onCorrect: () => {
                                                this.showHTMLDialog({ prompt: "Hai trovato il tagliere!" });
                                                setTimeout(() => {
                                                    this.closeHTMLDialog();
                                                    createEndBfInteraction();
                                                }, 1500);
                                            }
                                        })
                                    }];
                                };

                                this.interactables = [{
                                    x: bfX, y: bfY, radius: 40,
                                    getQuestion: () => ({
                                        prompt: "ma che cazzo...e ora come facciamo?",
                                        onComplete: () => {
                                            this.closeHTMLDialog();
                                            createVanCenterInteraction();
                                        }
                                    })
                                }];
                            }
                        }
                    })
                }];
            } else {
                this.interactables = []; // Clear interactables while driving before beach
            }
        } else {
            const body = this.player.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(0);

            let moving = false;
            const currentSpeed = (this.currentLevelIndex === 7 || this.currentLevelIndex === 6) ? this.SPEED * 6 : this.SPEED;
            if (this.keys.left.isDown) { body.setVelocityX(-currentSpeed); this.lastDir = 'left'; moving = true; }
            if (this.keys.right.isDown) { body.setVelocityX(+currentSpeed); this.lastDir = 'right'; moving = true; }
            if (this.keys.up.isDown) { body.setVelocityY(-currentSpeed); this.lastDir = 'up'; moving = true; }
            if (this.keys.down.isDown) { body.setVelocityY(+currentSpeed); this.lastDir = 'down'; moving = true; }

            if (moving) {
                this.player.anims.play(`walk-${this.lastDir}`, true);
            } else {
                this.player.anims.play('idle', true);
            }
        }

        for (const obj of this.interactables) {
            const targetSprite = (this.isDrivingVan && !this.hasDismountedVan) ? this.vanSprite : this.player;
            // Support interactables following a moving sprite
            const curX = (obj as any).sprite ? (obj as any).sprite.x : obj.x;
            const curY = (obj as any).sprite ? (obj as any).sprite.y : obj.y;
            const dist = Phaser.Math.Distance.Between(targetSprite.x, targetSprite.y, curX, curY);
            if (dist <= obj.radius) {
                this.activeInteractable = obj;
                this.interactPrompt.setPosition(curX, curY - 12);
                this.interactPrompt.setVisible(true);
                break;
            }
        }

        // ── Sicily level: trigger boyfriend2 and boyfriend3 zone spawns
        if (this.currentLevelIndex === 3) {
            // Boyfriend 2 – beach umbrella
            if (!(this as any)._bf2Spawned && this.player.x >= (this as any)._bf2X) {
                (this as any)._bf2Spawned = true;
                const bf2 = (this as any)._bf2 as Phaser.Physics.Arcade.Sprite;
                (bf2.body as Phaser.Physics.Arcade.Body).enable = true;
                this.tweens.add({
                    targets: bf2,
                    alpha: 1,
                    duration: 600,
                    onComplete: () => {
                        (this as any)._setupBf2?.();
                    }
                });
            }
            // Boyfriend 3 – oasis
            if (!(this as any)._bf3Spawned && this.player.x >= (this as any)._bf3X) {
                (this as any)._bf3Spawned = true;
                const bf3 = (this as any)._bf3 as Phaser.Physics.Arcade.Sprite;
                (bf3.body as Phaser.Physics.Arcade.Body).enable = true;
                this.tweens.add({
                    targets: bf3,
                    alpha: 1,
                    duration: 600,
                    onComplete: () => {
                        (this as any)._setupBf3?.();
                    }
                });
            }
        }
    }
}

// ─── Game Config ───────────────────────────────────────────────────────────
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    title: 'Core Memories',
    width: 1280,
    height: 720,
    backgroundColor: '#0f172a',
    parent: 'game-container',
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: [TitleScene, GameScene, EndScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    pixelArt: true, // keeps tiles and pixel-art characters sharp
};

anyWindow.__GAME__ = new Phaser.Game(config);

if (import.meta.hot) {
    import.meta.hot.dispose(() => anyWindow.__GAME__.destroy(true));
}
