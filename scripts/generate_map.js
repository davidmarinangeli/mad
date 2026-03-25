import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT = path.join(__dirname, '../public/assets');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const FENCE = 101;
const GRASS = 2;

// ─── Shared helpers ────────────────────────────────────────────────────────
function makeGrid(W, H, fill = GRASS) { return new Array(W * H).fill(fill); }
function setTile(grid, W, H, x, y, tile) { if (x >= 0 && x < W && y >= 0 && y < H) grid[y * W + x] = tile; }
function hWall(grid, W, H, x0, x1, y) { for (let x = x0; x <= x1; x++) setTile(grid, W, H, x, y, FENCE); }
function vWall(grid, W, H, x, y0, y1) { for (let y = y0; y <= y1; y++) setTile(grid, W, H, x, y, FENCE); }
function border(grid, W, H) {
    hWall(grid, W, H, 0, W-1, 0); hWall(grid, W, H, 0, W-1, H-1);
    vWall(grid, W, H, 0, 0, H-1); vWall(grid, W, H, W-1, 0, H-1);
}
// city.png tileset: 160x128 (10x8 tiles at 16x16)
// Tile IDs (1-indexed in Tiled):
// GID 1-80  = city.png tiles (rows left-to-right)
//   Row 0: asphalt, asphalt+center line, asphalt+edge line, asphalt plain, cobblestone, cobble corner, curb, curb vert, sidewalk manhole, gutter
//   Row 1: building wall window, building wall plain, building top, building door, building ground, building corner, lamp base, lamp top, puddle, wet shimmer
//   GID 2  = asphalt center (row 0 col 1, 0-indexed)
//   GID 5  = cobblestone sidewalk (row 0 col 4)
//   GID 11 = building wall with window (row 1 col 0)
//   GID 16 = building corner (row 1 col 5)
// GID 101+ = fences.png (collision walls)

const CITY_ASPHALT   = 2;   // dark asphalt
const CITY_ROAD_LINE = 2;   // use same tile, road center line added as decoration
const CITY_SIDEWALK  = 5;   // cobblestone sidewalk tile
const CITY_BUILDING  = 11;  // building wall tile with window (collision row)
const CITY_BLDG_PLAIN= 12;  // building wall no window
const CITY_CORNER    = 16;  // building corner
const CITY_LAMP_BOT  = 17;  // lamp post base
const CITY_LAMP_TOP  = 18;  // lamp post top glow
const CITY_PUDDLE    = 19;  // puddle tile

function saveCityMap(name, W, H, ground, walls) {
    const data = {
        compressionlevel: -1, width: W, height: H, infinite: false,
        layers: [
            { data: ground, height: H, id: 1, name: "Ground", opacity: 1, type: "tilelayer", visible: true, width: W, x: 0, y: 0 },
            { data: walls,  height: H, id: 2, name: "Walls",  opacity: 1, type: "tilelayer", visible: true, width: W, x: 0, y: 0 }
        ],
        nextlayerid: 3, nextobjectid: 1, orientation: "orthogonal",
        renderorder: "right-down", tiledversion: "1.10.2",
        tileheight: 16, tilewidth: 16, type: "map", version: "1.10",
        tilesets: [
            { columns: 10, firstgid: 1,   image: "city.png",   imageheight: 128, imagewidth: 160, margin: 0, name: "city",   spacing: 0, tilecount: 80, tileheight: 16, tilewidth: 16 },
            { columns: 4,  firstgid: 101, image: "fences.png", imageheight: 64,  imagewidth: 64,  margin: 0, name: "fences", spacing: 0, tilecount: 16, tileheight: 16, tilewidth: 16 }
        ]
    };
    fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(data));
    console.log(`✓ ${name}.json (${W}x${H}) [city tileset]`);
}

function saveMap(name, W, H, walls) {
    const ground = makeGrid(W, H, GRASS);
    const data = {
        compressionlevel: -1, width: W, height: H, infinite: false,
        layers: [
            { data: ground, height: H, id: 1, name: "Ground", opacity: 1, type: "tilelayer", visible: true, width: W, x: 0, y: 0 },
            { data: walls,  height: H, id: 2, name: "Walls",  opacity: 1, type: "tilelayer", visible: true, width: W, x: 0, y: 0 }
        ],
        nextlayerid: 3, nextobjectid: 1, orientation: "orthogonal",
        renderorder: "right-down", tiledversion: "1.10.2",
        tileheight: 16, tilewidth: 16, type: "map", version: "1.10",
        tilesets: [
            { columns: 10, firstgid: 1, image: "grass_01.png", imageheight: 128, imagewidth: 160, margin: 0, name: "grass", spacing: 0, tilecount: 80, tileheight: 16, tilewidth: 16 },
            { columns: 4, firstgid: 101, image: "fences.png", imageheight: 64, imagewidth: 64, margin: 0, name: "fences", spacing: 0, tilecount: 16, tileheight: 16, tilewidth: 16 }
        ]
    };
    fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(data));
    console.log(`✓ ${name}.json (${W}x${H})`);
}

function saveMapGrass2(name, W, H, walls) {
    const ground = makeGrid(W, H, GRASS);
    const data = {
        compressionlevel: -1, width: W, height: H, infinite: false,
        layers: [
            { data: ground, height: H, id: 1, name: "Ground", opacity: 1, type: "tilelayer", visible: true, width: W, x: 0, y: 0 },
            { data: walls,  height: H, id: 2, name: "Walls",  opacity: 1, type: "tilelayer", visible: true, width: W, x: 0, y: 0 }
        ],
        nextlayerid: 3, nextobjectid: 1, orientation: "orthogonal",
        renderorder: "right-down", tiledversion: "1.10.2",
        tileheight: 16, tilewidth: 16, type: "map", version: "1.10",
        tilesets: [
            { columns: 10, firstgid: 1, image: "grass_02.png", imageheight: 128, imagewidth: 160, margin: 0, name: "grass", spacing: 0, tilecount: 80, tileheight: 16, tilewidth: 16 },
            { columns: 4, firstgid: 101, image: "fences.png", imageheight: 64, imagewidth: 64, margin: 0, name: "fences", spacing: 0, tilecount: 16, tileheight: 16, tilewidth: 16 }
        ]
    };
    fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(data));
    console.log(`✓ ${name}.json (${W}x${H}) [grass_02 tileset]`);
}

function saveTuscanyMap(name, W, H, walls) {
    const ground = makeGrid(W, H, 1); // Use tile ID 1 for single-tile repeating texture
    const data = {
        compressionlevel: -1, width: W, height: H, infinite: false,
        layers: [
            { data: ground, height: H, id: 1, name: "Ground", opacity: 1, type: "tilelayer", visible: true, width: W, x: 0, y: 0 },
            { data: walls,  height: H, id: 2, name: "Walls",  opacity: 1, type: "tilelayer", visible: true, width: W, x: 0, y: 0 }
        ],
        nextlayerid: 3, nextobjectid: 1, orientation: "orthogonal",
        renderorder: "right-down", tiledversion: "1.10.2",
        tileheight: 127, tilewidth: 127, type: "map", version: "1.10",
        tilesets: [
            { columns: 1, firstgid: 1, image: "tuscany_grass.png", imageheight: 127, imagewidth: 127, margin: 0, name: "tuscany_grass", spacing: 0, tilecount: 1, tileheight: 127, tilewidth: 127 },
            { columns: 4, firstgid: 101, image: "fences.png", imageheight: 64, imagewidth: 64, margin: 0, name: "fences", spacing: 0, tilecount: 16, tileheight: 16, tilewidth: 16 }
        ]
    };
    fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(data));
    console.log(`✓ ${name}.json (${W}x${H}) [tuscany_grass tileset - 127x127 tiles]`);
}

// ─── Level 0: The Apartment Street ─ Italian city, Modena, night, rain ──────
// Layout: 60 wide x 16 tall
//   Rows 0-2:  building wall (collision + decorative)
//   Row 3:     sidewalk
//   Rows 4-11: road (asphalt, player walks here)
//   Row 12:    sidewalk
//   Rows 13-15: building wall (collision + decorative)
{
    const W = 20, H = 16;
    const ground = new Array(W * H);
    const walls  = new Array(W * H).fill(0); // 0 = no tile (passable)

    function g(x, y, tile) { ground[y * W + x] = tile; }
    function w(x, y, tile) { walls[y * W + x] = tile; } // collision tile

    for (let x = 0; x < W; x++) {
        // Building rows (top) — use city building tile, mark as fence for collision
        for (let row = 0; row <= 2; row++) {
            const tile = (x % 5 === 0) ? CITY_BUILDING : (x % 5 === 3 ? CITY_BLDG_PLAIN : CITY_BUILDING);
            g(x, row, tile);
            w(x, row, FENCE); // collision
        }
        // Sidewalk top (row 3)
        g(x, 3, CITY_SIDEWALK);

        // Curb top (row 4)
        g(x, 4, 7); // GID 7 = curb

        // Road (rows 5-10)
        for (let row = 5; row <= 10; row++) {
            if (row === 7 && x % 4 < 2) { g(x, row, 2); } // asphalt with center line
            else { g(x, row, CITY_ASPHALT); }
        }

        // Curb bottom (row 11)
        g(x, 11, 7);

        // Sidewalk bottom (row 12)
        g(x, 12, CITY_SIDEWALK);
        // Occasional puddles on sidewalk
        if (x % 8 === 5) g(x, 12, CITY_PUDDLE);

        // Building rows (bottom)
        for (let row = 13; row <= 15; row++) {
            const tile = (x % 6 === 0) ? CITY_BUILDING : CITY_BLDG_PLAIN;
            g(x, row, tile);
            w(x, row, FENCE);
        }
    }

    // Lamp posts on sidewalks every 8 tiles
    for (let x = 3; x < W; x += 8) {
        g(x, 3, CITY_LAMP_TOP);
        g(x, 12, CITY_LAMP_BOT);
    }

    saveCityMap('map_0', W, H, ground, walls);
}

// ─── Level 1: 1st of May field ─ with narrow street at bottom ──────────────
{
    const W = 20, H = 15;
    const w = makeGrid(W, H);
    border(w, W, H);
    
    // Add horizontal street separator near bottom (row 12)
    // Layout from bottom up: little grass (rows 13-14), street (row 12), main grass area (rows 1-11)
    hWall(w, W, H, 1, W-2, 12);
    
    saveMapGrass2('map_1', W, H, w);
}

// ─── Level 2: Tuscany glamping ─ forest clearing (3x3 @ 127px) ─────────────
{
    const W = 3, H = 3;
    const w = makeGrid(W, H, 0); // Fill with 0 (no tile/passable) for walls layer
    border(w, W, H);
    // Simple border only for open space in the woods
    saveTuscanyMap('map_2', W, H, w);
}

// ─── Level 3: Sicily ─ L-shaped coastal walk ────────────────────────────────
{
    const W = 50, H = 30;
    const w = makeGrid(W, H);
    border(w, W, H);
    // Interior divider: horizontal then vertical — like navigating a coastline
    hWall(w, W, H, 1, 25, 15);
    vWall(w, W, H, 25, 15, 29);
    saveMap('map_3', W, H, w);
}

// ─── Level 4: Lanzarote ─ wide open volcanic terrain ───────────────────────
{
    const W = 50, H = 50;
    const w = makeGrid(W, H);
    border(w, W, H);
    // Volcanic rocks = scattered small obstacle clusters
    const rocks = [[10,10],[10,11],[11,10],[20,30],[21,30],[20,31],[35,8],[35,9],[36,8],[15,40],[16,40],[15,41]];
    for (const [x,y] of rocks) setTile(w, W, x, y, FENCE);
    saveMap('map_4', W, H, w);
}

// ─── Level 5: Lanzarote pt2 ─ van stuck in sand, tight S-curve ─────────────
{
    const W = 30, H = 50;
    const w = makeGrid(W, H);
    border(w, W, H);
    // Very tight S bends (harder navigation)
    hWall(w, W, H, 1, 22, 16); // gap on right
    hWall(w, W, H, 8, 29, 33); // gap on left
    saveMap('map_5', W, H, w);
}

// ─── Level 6: Ski Resort ─ slalom pole course ───────────────────────────────
{
    const W = 20, H = 60;
    const w = makeGrid(W, H);
    border(w, W, H);
    // Slalom poles alternating left and right
    for (let i = 0; i < 8; i++) {
        const y = 6 + i * 7;
        const x = (i % 2 === 0) ? 12 : 7;
        vWall(w, W, H, x, y, y + 3);
    }
    saveMap('map_6', W, H, w);
}

// ─── Level 7: Tortellini making (Nonna's apartment) ─ cozy small room ───────
{
    const W = 20, H = 20;
    const w = makeGrid(W, H);
    border(w, W, H);
    // Kitchen table obstacle in the middle
    hWall(w, W, H, 7, 13, 9); hWall(w, W, H, 7, 13, 11);
    vWall(w, W, H, 7, 9, 11); vWall(w, W, H, 13, 9, 11);
    saveMap('map_7', W, H, w);
}

// ─── Level 8: Snow trekking ─ long winding mountain path ───────────────────
{
    const W = 20, H = 70;
    const w = makeGrid(W, H);
    border(w, W, H);
    // Narrow winding path down a mountain
    hWall(w, W, H, 1, 13, 12);  // gap right
    hWall(w, W, H, 7, 19, 24);  // gap left
    hWall(w, W, H, 1, 13, 36);  // gap right
    hWall(w, W, H, 7, 19, 48);  // gap left
    hWall(w, W, H, 1, 13, 60);  // gap right
    saveMap('map_8', W, H, w);
}

// ─── Level 9: Parmesan factory ─ industrial corridor maze ──────────────────
{
    const W = 40, H = 25;
    const w = makeGrid(W, H);
    border(w, W, H);
    // Parallel factory "aisles"
    for (let col = 7; col <= 35; col += 7) {
        vWall(w, W, H, col, 1, 11);  // top aisle
        vWall(w, W, H, col, 13, 23); // bottom aisle
    }
    saveMap('map_9', W, H, w);
}

// ─── Level 10: Her apartment ─ two-room cozy space ─────────────────────────
{
    const W = 30, H = 20;
    const w = makeGrid(W, H);
    border(w, W, H);
    // Living room divider with a doorway gap at y=9-11
    vWall(w, W, H, 15, 1, 7);
    vWall(w, W, H, 15, 11, 18);
    saveMap('map_10', W, H, w);
}
