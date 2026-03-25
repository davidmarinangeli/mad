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
    { title: 'The Apartment Street', mapKey: 'map_0', startX: 160, startY: 270, signX: 280, signY: 80, questionId: 'q-apartment', isCustomMap: true },
    {
        mapKey: 'map_1',
        title: "1st of May",
        startX: 32, startY: 120,    // 20x15 map = 320x240px
        signX: 280, signY: 120      // Not used (custom multi-stage logic)
    },
    {
        mapKey: 'map_2',
        title: "Tuscany Glamping",
        startX: 64, startY: 317,    // 3x3 map @ 127px tiles = 381x381px
        signX: 317, signY: 64,      // top-right in the clearing
        question: "What was the name of the glamping site?",
        options: ["Option A", "Option B", "Option C"],
        correctIndex: 0  // [TODO]
    },
    {
        mapKey: 'map_3',
        title: "Sicily",
        startX: 40, startY: 200,    // horizontal flow - spawn far left
        signX: 0, signY: 0,
        isCustomMap: true,
    },
    {
        mapKey: 'map_4',
        title: "Lanzarote",
        startX: 32, startY: 752,    // 50x50 map = 800x800px
        signX: 752, signY: 48,      // top right corner
        question: "What was the van called that we rented?",
        options: ["Option A", "Option B", "Option C"],
        correctIndex: 0  // [TODO]
    },
    {
        mapKey: 'map_5',
        title: "Lanzarote: Van in the Sand",
        startX: 32, startY: 752,    // 30x50 map = 480x800px
        signX: 432, signY: 48,      // top right after tight S
        question: "Who came to help us when the van was stuck?",
        options: ["Option A", "Option B", "Option C"],
        correctIndex: 0  // [TODO]
    },
    {
        mapKey: 'map_7',
        title: "Tortellini with Nonna",
        startX: 32, startY: 272,    // 20x20 map = 320x320px
        signX: 256, signY: 160,     // across the kitchen table from start
        question: "What's the secret Nonna adds to tortellini filling?",
        options: ["Option A", "Option B", "Option C"],
        correctIndex: 0  // [TODO]
    },
    {
        mapKey: 'map_8',
        title: "Snow Trekking",
        startX: 160, startY: 1072,  // 20x70 map = 320x1120px
        signX: 160, signY: 48,      // top of mountain
        question: "How did I attempt to dry my soaking socks by the fire?",
        options: ["Option A", "Option B", "Option C"],
        correctIndex: 0  // [TODO]
    },
    {
        mapKey: 'map_9',
        title: "Parmesan Factory",
        startX: 32, startY: 288,    // 40x25 map = 640x400px
        signX: 592, signY: 176,     // far right across factory floor
        question: "How many months does the parmesan we tasted age for?",
        options: ["Option A", "Option B", "Option C"],
        correctIndex: 0  // [TODO]
    },
    {
        mapKey: 'map_10',
        title: "At Your Apartment",
        startX: 32, startY: 176,    // 30x20 map = 480x320px
        signX: 432, signY: 160,     // across the two-room divider
        question: "What's our favourite thing to cook together at home?",
        options: ["Option A", "Option B", "Option C"],
        correctIndex: 0  // [TODO]
    },
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

        this.add.text(160, 70, 'CORE MEMORIES', {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            color: '#f8fafc'
        }).setOrigin(0.5);

        const prompt = this.add.text(160, 120, 'PRESS [E] TO START', {
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
                this.scene.start('GameScene', { levelIndex: 3 }); // DEBUG: Start with Level 3 (Sicily)
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

        this.add.text(160, 70, 'HAPPY ANNIVERSARY', {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            color: '#22c55e'
        }).setOrigin(0.5);

        this.add.text(160, 110, 'Thanks for playing <3', {
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

    constructor() { super('GameScene'); }

    init(data: any) {
        this.currentLevelIndex = data.levelIndex || 0;
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
        this.load.image('volcanic_rock_1', '/assets/volcanic_rock_1.png');
        this.load.image('volcanic_rock_2', '/assets/volcanic_rock_2.png');
        this.load.image('van', '/assets/van.png');

        // Level 5 objects
        this.load.image('van_sand', '/assets/van_sand.png');

        // Level 6 objects 
        this.load.image('table', '/assets/table.png');
        this.load.image('tortellini_shape', '/assets/tortellini_shape.png');
        this.load.image('rolling_pin', '/assets/rolling_pin.png');

        // Level 7 objects 
        this.load.image('snow_tracks', '/assets/snow_tracks.png');
        this.load.image('socks', '/assets/socks.png');

        // Level 8 objects 
        this.load.image('parmigiano_1', '/assets/parmigiano_1.png');
        this.load.image('parmigiano_2', '/assets/parmigiano_2.png');
        this.load.image('parmigiano_3', '/assets/parmigiano_3.png');
        this.load.image('factory_shelf', '/assets/factory_shelf.png');

        // Level 9 objects 
        this.load.image('sofa', '/assets/sofa.png');
        this.load.image('macbook', '/assets/macbook.png');
        this.load.image('cooking_pot', '/assets/cooking_pot.png');

        // Characters (Upgraded 128x128 spritesheets inside 512x512 grids)
        this.load.spritesheet('character', '/assets/main_character.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('nonna', '/assets/nonna.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('sister', '/assets/sister.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('boyfriend', '/assets/boyfriend.png', { frameWidth: 128, frameHeight: 128 });
    }

    create() {
        this.cameras.main.fadeIn(800, 0, 0, 0);
        this.cameras.main.setZoom(4);

        // Apply LINEAR anti-aliasing filter to detailed custom images so they render smoothly in High-DPI mode
        const detailedImages = [
            'tesla', 'apartment_door', 'night_pole', 'olive_tree', 'basel_painting', 'frames', 'picnic',
            'tent', 'fireplace', 'tree_1', 'tree_2', 'sicilian_market_1', 'sicilian_market_2', 'sicilian_market_3', 'sicilian_house',
            'volcanic_rock_1', 'volcanic_rock_2', 'van', 'van_sand', 'table', 'tortellini_shape', 'rolling_pin',
            'snow_tracks', 'socks', 'parmigiano_1', 'parmigiano_2', 'parmigiano_3', 'factory_shelf', 'sofa', 'macbook', 'cooking_pot',
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
            if (this.currentLevelIndex === 1) {
                grassKey = 'grass02';
            } else if (this.currentLevelIndex === 2) {
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

        if (!this.anims.exists('boyfriend-idle')) {
            this.anims.create({ key: 'boyfriend-idle', frames: this.anims.generateFrameNumbers('boyfriend', { start: 0, end: 0 }), frameRate: 1, repeat: 0 });
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
                            prompt: 'David: "allora vado..."\n\n(Press E to continue)',
                            onComplete: () => {
                                this.showHTMLDialog({
                                    prompt: 'Maddalena: "ti inviterei su ma abbiamo 30 anni e domani si lavora..."\n\n(Press E to continue)',
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
                                                                    this.showHTMLDialog({ prompt: "✓ Correct! Memory unlocked." });
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
                                                                                prompt: "✓ Correct! Memory unlocked."
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
                                                                    this.showHTMLDialog({ prompt: "✓ Correct! Memory unlocked." });
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
            const stallXs = [100, 170, 250, 330, 410, 480, 550];
            const stallTypes = ['sicilian_market_1', 'sicilian_market_2', 'sicilian_market_3'];

            stallXs.forEach((x, i) => {
                // Top row stall
                const tm = this.physics.add.staticImage(x, 135, stallTypes[i % 3]).setDepth(1).setScale(0.195);
                tm.refreshBody();
                this.physics.add.collider(this.player, tm);

                // Bottom row stall - rotated 180 degrees
                const bm = this.physics.add.staticImage(x, 265, stallTypes[(i + 1) % 3]).setDepth(1).setScale(0.195).setAngle(180);
                bm.refreshBody();
                this.physics.add.collider(this.player, bm);
            });

            // Invisible wall behind top stalls (blocks player from going too far up)
            const wallTop = this.physics.add.staticImage(300, 125, '__DEFAULT').setAlpha(0).setDepth(0);
            (wallTop.body as Phaser.Physics.Arcade.StaticBody).setSize(660, 10);
            wallTop.refreshBody();
            this.physics.add.collider(this.player, wallTop);

            // Invisible wall behind bottom stalls (blocks player from going too far down)
            const wallBot = this.physics.add.staticImage(300, 275, '__DEFAULT').setAlpha(0).setDepth(0);
            (wallBot.body as Phaser.Physics.Arcade.StaticBody).setSize(660, 10);
            wallBot.refreshBody();
            this.physics.add.collider(this.player, wallBot);

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
            trans1Sand.tileScaleX = 0.125; trans1Sand.tileScaleY = 0.125;

            // Cobblestone horizontal walls (y=150 and y=250) - touching at 20px spacing
            for (let cx = 600; cx <= 750; cx += 20) {
                const cl = this.physics.add.staticImage(cx, 150, 'cobblestone').setDepth(1).setScale(0.05).setAngle(90);
                cl.refreshBody();
                this.physics.add.collider(this.player, cl);

                const cr = this.physics.add.staticImage(cx, 250, 'cobblestone').setDepth(1).setScale(0.05).setAngle(-90);
                cr.refreshBody();
                this.physics.add.collider(this.player, cr);
            }

            // ──────────────────────────────────────────────────────────────────
            // SCENE 2: CALAMOSCHE BEACH (x 750 – 1400)
            // Sand floor
            const beachSand = this.add.tileSprite(1075, 200, 650, 400, 'sand').setDepth(0);
            beachSand.tileScaleX = 0.125; beachSand.tileScaleY = 0.125;

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

            // ──────────────────────────────────────────────────────────────────
            // TRANSITION 2: Beach → Oasis (x 1400 – 1550)
            const trans2Sand = this.add.tileSprite(1475, 200, 150, 400, 'sand').setDepth(0);
            trans2Sand.tileScaleX = 0.125; trans2Sand.tileScaleY = 0.125;

            for (let cx2 = 1400; cx2 <= 1550; cx2 += 20) {
                const cl2 = this.physics.add.staticImage(cx2, 150, 'cobblestone').setDepth(1).setScale(0.05).setAngle(90);
                cl2.refreshBody();
                this.physics.add.collider(this.player, cl2);

                const cr2 = this.physics.add.staticImage(cx2, 250, 'cobblestone').setDepth(1).setScale(0.05).setAngle(-90);
                cr2.refreshBody();
                this.physics.add.collider(this.player, cr2);
            }

            // Direction signpost
            this.add.image(1475, 200, 'direction').setDepth(1).setScale(0.08);

            // ──────────────────────────────────────────────────────────────────
            // SCENE 3: OASI DELLA FRUTTA (x 1550 – 2000)
            const oasisSand = this.add.tileSprite(1775, 200, 450, 400, 'sand').setDepth(0);
            oasisSand.tileScaleX = 0.125; oasisSand.tileScaleY = 0.125;

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

            (this as any)._setupBf2 = () => {
                this.interactables = [{
                    x: boyfriend2.x, y: boyfriend2.y, radius: 36,
                    getQuestion: () => ({
                        prompt: 'David: "che posto assurdo... ma come si chiama questa spiaggia?"',
                        options: ['Calamosche', 'Cala Rossa', 'Isola delle Correnti'],
                        correctIndex: 0,
                        onCorrect: () => {
                            this.closeHTMLDialog();
                            this.tweens.add({
                                targets: boyfriend2, alpha: 0, duration: 800, onComplete: () => {
                                    boyfriend2.body.enable = false;
                                    this.interactables = [];
                                }
                            });
                        }
                    })
                }];
            };

            (this as any)._setupBf3 = () => {
                this.interactables = [{
                    x: boyfriend3.x, y: boyfriend3.y, radius: 36,
                    getQuestion: () => ({
                        prompt: 'David: "guarda che roba... ma dove siamo esatti?"',
                        options: ['Oasi della Frutta', 'Mercato di Ortigia', 'Bar del Porto'],
                        correctIndex: 0,
                        onCorrect: () => {
                            this.closeHTMLDialog();
                            this.tweens.add({
                                targets: boyfriend3, alpha: 0, duration: 800, onComplete: () => {
                                    boyfriend3.body.enable = false;
                                    this.showHTMLDialog({ prompt: '✓ Memory unlocked!' });
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
            this.add.image(150, 200, 'volcanic_rock_1').setDepth(1).setScale(0.08);
            this.add.image(600, 350, 'volcanic_rock_2').setDepth(1).setScale(0.08);
            this.add.image(300, 600, 'volcanic_rock_1').setDepth(1).setScale(0.08);
            this.add.image(500, 150, 'van').setDepth(1).setScale(0.15);
        }

        // ── Level 5: Lanzarote pt2 - Van in the Sand
        if (this.currentLevelIndex === 5) {
            this.add.image(240, 400, 'van_sand').setDepth(1).setAngle(15).setScale(0.15); // Tilted stuck van
            this.add.image(100, 300, 'volcanic_rock_2').setDepth(1).setScale(0.08);
        }

        // ── Level 6: Tortellini with Nonna
        if (this.currentLevelIndex === 6) {
            this.add.image(160, 160, 'table').setDepth(0).setScale(0.1);
            this.add.image(180, 150, 'tortellini_shape').setDepth(1).setScale(0.04);
            this.add.image(200, 170, 'rolling_pin').setDepth(1).setScale(0.05);

            // Add Nonna NPC
            const nonna = this.add.sprite(256, 160, 'nonna').setDepth(2).setScale(0.125);
            nonna.anims.play('nonna-idle');
        }

        // ── Level 7: Snow Trekking
        if (this.currentLevelIndex === 7) {
            this.add.image(160, 600, 'snow_tracks').setDepth(0).setScale(0.1);
            this.add.image(160, 500, 'snow_tracks').setDepth(0).setScale(0.1);
            this.add.image(180, 100, 'socks').setDepth(1).setScale(0.05);

            // Add Sister and Boyfriend NPCs
            const sister = this.add.sprite(140, 80, 'sister').setDepth(2).setScale(0.125);
            sister.anims.play('sister-idle');
            const boyfriend = this.add.sprite(180, 80, 'boyfriend').setDepth(2).setScale(0.125);
            boyfriend.anims.play('boyfriend-idle');
        }

        // ── Level 8: Parmesan Factory
        if (this.currentLevelIndex === 8) {
            this.add.image(200, 150, 'parmigiano_1').setDepth(1).setScale(0.08);
            this.add.image(350, 200, 'parmigiano_2').setDepth(1).setScale(0.08);
            this.add.image(500, 180, 'parmigiano_3').setDepth(1).setScale(0.08);
            this.add.image(400, 100, 'factory_shelf').setDepth(0).setScale(0.15);
        }

        // ── Level 9: At Your Apartment
        if (this.currentLevelIndex === 9) {
            this.add.image(350, 200, 'sofa').setDepth(1).setScale(0.12);
            this.add.image(250, 120, 'macbook').setDepth(1).setScale(0.03);
            this.add.image(150, 180, 'cooking_pot').setDepth(1).setScale(0.05);
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
                        this.showHTMLDialog({ prompt: "✓ Correct! Memory unlocked." });
                        setTimeout(() => {
                            this.closeHTMLDialog();
                            this.advanceLevel();
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

        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0);

        let moving = false;
        if (this.keys.left.isDown) { body.setVelocityX(-this.SPEED); this.lastDir = 'left'; moving = true; }
        if (this.keys.right.isDown) { body.setVelocityX(+this.SPEED); this.lastDir = 'right'; moving = true; }
        if (this.keys.up.isDown) { body.setVelocityY(-this.SPEED); this.lastDir = 'up'; moving = true; }
        if (this.keys.down.isDown) { body.setVelocityY(+this.SPEED); this.lastDir = 'down'; moving = true; }

        if (moving) {
            this.player.anims.play(`walk-${this.lastDir}`, true);
        } else {
            this.player.anims.play('idle', true);
        }

        this.activeInteractable = null;
        this.interactPrompt.setVisible(false);

        for (const obj of this.interactables) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, obj.x, obj.y);
            if (dist <= obj.radius) {
                this.activeInteractable = obj;
                this.interactPrompt.setPosition(obj.x, obj.y - 12);
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
