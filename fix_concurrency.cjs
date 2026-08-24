const fs = require('fs');

let be = fs.readFileSync('backend/src/movies/movies.service.ts', 'utf8');

const targetStr = `      const categories = await Promise.all(dynamicRails.map(async (rail) => {`;
const replaceStr = `      const categories: any[] = [];
      // Process rails in smaller chunks to avoid overwhelming the network and hitting TMDB rate limits
      for (let rIdx = 0; rIdx < dynamicRails.length; rIdx += 3) {
        const railChunk = dynamicRails.slice(rIdx, rIdx + 3);
        const chunkCategories = await Promise.all(railChunk.map(async (rail) => {`;

be = be.replace(targetStr, replaceStr);

// Close the map properly
const endTargetStr = `            uniqueTitles.set(movie.id, movie);
          }
        });
        return {
          id: rail.id,
          name: rail.name,
          slug: rail.id,
          movies: Array.from(uniqueTitles.values())
        };
      }));`;
const endReplaceStr = `            uniqueTitles.set(movie.id, movie);
          }
        });
        return {
          id: rail.id,
          name: rail.name,
          slug: rail.id,
          movies: Array.from(uniqueTitles.values())
        };
      }));
      categories.push(...chunkCategories);
      if (rIdx + 3 < dynamicRails.length) await new Promise(r => setTimeout(r, 500));
    }`;

be = be.replace(endTargetStr, endReplaceStr);

fs.writeFileSync('backend/src/movies/movies.service.ts', be);
