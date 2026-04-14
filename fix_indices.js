const fs = require('fs');
let code = fs.readFileSync('src/main.ts', 'utf8');

code = code.replace(/this\.currentLevelIndex === (\d+)/g, (match, d) => {
    let num = parseInt(d);
    if (num === 0) return `levelConfig.mapKey === 'map_0'`;
    if (num === 1) return `levelConfig.mapKey === 'map_1'`;
    if (num === 2) return `levelConfig.mapKey === 'map_2'`;
    if (num === 3) return `levelConfig.mapKey === 'map_3'`;
    if (num === 4) return `levelConfig.mapKey === 'map_4_1'`;
    if (num === 5) return `levelConfig.mapKey === 'map_5'`;
    if (num === 6) return `levelConfig.mapKey === 'map_7'`;
    if (num === 7) return `levelConfig.mapKey === 'map_8' && levelConfig.title === 'Ciaspolata'`;
    if (num === 8) return `levelConfig.mapKey === 'map_8' && levelConfig.title === 'A casa, finalmente'`;
    return match;
});

code = code.replace(/this\.currentLevelIndex !== 0 && this\.currentLevelIndex !== 1/g, "levelConfig.mapKey !== 'map_0' && levelConfig.mapKey !== 'map_1'");

fs.writeFileSync('src/main.ts', code, 'utf8');
console.log('Fixed indices');
