const fs = require('fs');
let be = fs.readFileSync('backend/src/movies/movies.service.ts', 'utf8');

const target = `        return { id: rail.id, name: rail.name, slug: rail.id, movies: titles };
      }));`;

const replace = `        return { id: rail.id, name: rail.name, slug: rail.id, movies: titles };
      }));
      categories.push(...chunkCategories);
      if (rIdx + 3 < dynamicRails.length) await new Promise(r => setTimeout(r, 500));
    }`;

be = be.replace(target, replace);
fs.writeFileSync('backend/src/movies/movies.service.ts', be);
