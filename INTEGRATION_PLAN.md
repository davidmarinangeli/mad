# Sprite Integration Plan - Continuation Guide

## What's Been Completed ✓

1. **Updated main character sprite** - Changed from `character.png` to `main_character.png` (line 217)
2. **Loaded NPC spritesheets** - Added nonna, sister, boyfriend spritesheets (lines 219-221)
3. **Created NPC animations** - Added idle animations for all NPCs (lines 260-272)
4. **Loaded all decorative object sprites** - Added all 30+ object sprites in preload() (lines 217-263)
5. **Removed Level 6 (Ski Resort)** - Deleted from LEVELS array (was lines 76-84)
6. **Updated Level 0 sprites** - Replaced old tesla with new sprites (lines 309-312)
7. **Added Level 1 sprites** - Olive trees, painting, picnic blanket (lines 330-335)

## What Still Needs to Be Done

### Remaining Level Decorations (in order)

Add these **after line 335** in [src/main.ts](src/main.ts), inside the create() method:

#### Level 2 - Tuscany Glamping
```typescript
// ── Level 2: Tuscany Glamping
if (this.currentLevelIndex === 2) {
    this.add.image(500, 100, 'beige_tent').setDepth(1);
    this.add.image(450, 200, 'campfire').setDepth(1);
    this.add.image(100, 150, 'tuscany_plant_1').setDepth(1);
    this.add.image(550, 450, 'tuscany_plant_2').setDepth(1);
    this.add.image(200, 500, 'tuscany_plant_1').setDepth(1);
}
```

#### Level 3 - Sicily
```typescript
// ── Level 3: Sicily
if (this.currentLevelIndex === 3) {
    this.add.image(400, 100, 'sicilian_market_stall').setDepth(1);
    this.add.image(650, 300, 'sicilian_home').setDepth(1);
}
```

#### Level 4 - Lanzarote
```typescript
// ── Level 4: Lanzarote
if (this.currentLevelIndex === 4) {
    this.add.image(150, 200, 'volcanic_rock_1').setDepth(1);
    this.add.image(600, 350, 'volcanic_rock_2').setDepth(1);
    this.add.image(300, 600, 'volcanic_rock_1').setDepth(1);
    this.add.image(500, 150, 'van').setDepth(1);
}
```

#### Level 5 - Lanzarote pt2 (Van in Sand)
```typescript
// ── Level 5: Lanzarote pt2 - Van in the Sand
if (this.currentLevelIndex === 5) {
    this.add.image(240, 400, 'van_sand').setDepth(1).setAngle(15); // Tilted stuck van
    this.add.image(100, 300, 'volcanic_rock_2').setDepth(1);
}
```

#### Level 6 - Nonna's Apartment (was Level 7)
```typescript
// ── Level 6: Tortellini with Nonna (was Level 7, renumbered after removing ski resort)
if (this.currentLevelIndex === 6) {
    this.add.image(160, 160, 'kitchen_table').setDepth(0);
    this.add.image(180, 150, 'pasta_shapes').setDepth(1);
    this.add.image(200, 170, 'rolling_pin').setDepth(1);

    // Add Nonna NPC
    const nonna = this.add.sprite(256, 160, 'nonna').setDepth(2);
    nonna.anims.play('nonna-idle');
}
```

#### Level 7 - Snow Trekking (was Level 8)
```typescript
// ── Level 7: Snow Trekking (was Level 8, renumbered after removing ski resort)
if (this.currentLevelIndex === 7) {
    this.add.image(160, 600, 'shoetrack').setDepth(0);
    this.add.image(160, 500, 'shoetrack').setDepth(0);
    this.add.image(180, 100, 'socks').setDepth(1);

    // Add Sister and Boyfriend NPCs
    const sister = this.add.sprite(140, 80, 'sister').setDepth(2);
    sister.anims.play('sister-idle');

    const boyfriend = this.add.sprite(180, 80, 'boyfriend').setDepth(2);
    boyfriend.anims.play('boyfriend-idle');
}
```

#### Level 8 - Parmesan Factory (was Level 9)
```typescript
// ── Level 8: Parmesan Factory (was Level 9, renumbered after removing ski resort)
if (this.currentLevelIndex === 8) {
    this.add.image(200, 150, 'parmesan_1').setDepth(1);
    this.add.image(350, 200, 'parmesan_2').setDepth(1);
    this.add.image(500, 180, 'parmesan_3').setDepth(1);
    this.add.image(400, 100, 'factory_shelf').setDepth(0);
}
```

#### Level 9 - Her Apartment (was Level 10)
```typescript
// ── Level 9: At Your Apartment (was Level 10, renumbered after removing ski resort)
if (this.currentLevelIndex === 9) {
    this.add.image(350, 200, 'sofa').setDepth(1);
    this.add.image(250, 120, 'macbook').setDepth(1).setScale(0.67); // Scale down 24x24 to ~16x16
    this.add.image(150, 180, 'cooking_pot').setDepth(1);
}
```

---

## Important Notes

### File Locations
- **Main file to edit:** `src/main.ts`
- **Insert location:** After line 335 (right after Level 1 code)
- **All sprites already loaded:** Lines 217-263 in preload()

### MacBook Special Handling
The macbook sprite is 24x24 pixels (not 16x16 like others), so it needs `.setScale(0.67)` to display correctly.

### Level Renumbering
After removing Level 6 (Ski Resort):
- Old Level 7 → New Level 6
- Old Level 8 → New Level 7
- Old Level 9 → New Level 8
- Old Level 10 → New Level 9

The game now has **10 levels total** (was 11).

### Depth Layers
- **0:** Ground decorations (picnic blanket, kitchen table)
- **1:** Props and objects (most decorative items)
- **2:** Characters (player, NPCs)
- **3:** Tint overlays
- **4:** Particles (rain, snow)

---

## Testing Checklist

After adding all the level decorations:

1. Run `npm run dev`
2. Play through all 10 levels:
   - **Level 0:** Check tesla_model_3, apartment_door, street_poles appear
   - **Level 1:** Check olive trees, painting, picnic blanket appear
   - **Level 2:** Check tent, campfire, plants appear
   - **Level 3:** Check market stall, sicilian home appear
   - **Level 4:** Check volcanic rocks, van appear
   - **Level 5:** Check tilted van_sand and rock appear
   - **Level 6:** Check kitchen table, pasta, rolling pin, AND Nonna NPC appears and waves
   - **Level 7:** Check shoe tracks, socks, AND sister + boyfriend NPCs appear
   - **Level 8:** Check 3 parmesan wheels, factory shelf appear
   - **Level 9:** Check sofa, macbook (scaled correctly), cooking pot appear
3. Verify no console errors
4. Verify all NPCs animate correctly
5. Confirm game ends after Level 9 (not Level 10)

---

## Quick Copy-Paste

**All remaining levels in one block** (paste after line 335 in src/main.ts):

```typescript
// ── Level 2: Tuscany Glamping
if (this.currentLevelIndex === 2) {
    this.add.image(500, 100, 'beige_tent').setDepth(1);
    this.add.image(450, 200, 'campfire').setDepth(1);
    this.add.image(100, 150, 'tuscany_plant_1').setDepth(1);
    this.add.image(550, 450, 'tuscany_plant_2').setDepth(1);
    this.add.image(200, 500, 'tuscany_plant_1').setDepth(1);
}

// ── Level 3: Sicily
if (this.currentLevelIndex === 3) {
    this.add.image(400, 100, 'sicilian_market_stall').setDepth(1);
    this.add.image(650, 300, 'sicilian_home').setDepth(1);
}

// ── Level 4: Lanzarote
if (this.currentLevelIndex === 4) {
    this.add.image(150, 200, 'volcanic_rock_1').setDepth(1);
    this.add.image(600, 350, 'volcanic_rock_2').setDepth(1);
    this.add.image(300, 600, 'volcanic_rock_1').setDepth(1);
    this.add.image(500, 150, 'van').setDepth(1);
}

// ── Level 5: Lanzarote pt2 - Van in the Sand
if (this.currentLevelIndex === 5) {
    this.add.image(240, 400, 'van_sand').setDepth(1).setAngle(15); // Tilted stuck van
    this.add.image(100, 300, 'volcanic_rock_2').setDepth(1);
}

// ── Level 6: Tortellini with Nonna (was Level 7)
if (this.currentLevelIndex === 6) {
    this.add.image(160, 160, 'kitchen_table').setDepth(0);
    this.add.image(180, 150, 'pasta_shapes').setDepth(1);
    this.add.image(200, 170, 'rolling_pin').setDepth(1);

    // Add Nonna NPC
    const nonna = this.add.sprite(256, 160, 'nonna').setDepth(2);
    nonna.anims.play('nonna-idle');
}

// ── Level 7: Snow Trekking (was Level 8)
if (this.currentLevelIndex === 7) {
    this.add.image(160, 600, 'shoetrack').setDepth(0);
    this.add.image(160, 500, 'shoetrack').setDepth(0);
    this.add.image(180, 100, 'socks').setDepth(1);

    // Add Sister and Boyfriend NPCs
    const sister = this.add.sprite(140, 80, 'sister').setDepth(2);
    sister.anims.play('sister-idle');

    const boyfriend = this.add.sprite(180, 80, 'boyfriend').setDepth(2);
    boyfriend.anims.play('boyfriend-idle');
}

// ── Level 8: Parmesan Factory (was Level 9)
if (this.currentLevelIndex === 8) {
    this.add.image(200, 150, 'parmesan_1').setDepth(1);
    this.add.image(350, 200, 'parmesan_2').setDepth(1);
    this.add.image(500, 180, 'parmesan_3').setDepth(1);
    this.add.image(400, 100, 'factory_shelf').setDepth(0);
}

// ── Level 9: At Your Apartment (was Level 10)
if (this.currentLevelIndex === 9) {
    this.add.image(350, 200, 'sofa').setDepth(1);
    this.add.image(250, 120, 'macbook').setDepth(1).setScale(0.67); // Scale down 24x24 to ~16x16
    this.add.image(150, 180, 'cooking_pot').setDepth(1);
}
```

---

## What Comes After

Once sprite integration is complete:

1. **Add atmospheric tints** - Color overlays for each level mood
2. **Add particle effects** - Snowflakes for Level 7, campfire smoke for Level 2
3. **Add sound** - Background music and SFX (optional)
4. **Replace trivia questions** - User needs to provide real questions/answers
5. **Test full playthrough** - All 10 levels end-to-end
6. **Deploy** - Build and deploy to Netlify/Vercel

See [implementation_plan.md](implementation_plan.md) for full details on next phases.
