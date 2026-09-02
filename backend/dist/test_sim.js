"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const movies_service_1 = require("./src/movies/movies.service");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const service = app.get(movies_service_1.MoviesService);
    await service.ensureCatalog('nflix');
    const res = await service.getSimilarMovies('tmdb-tv-85937', 'nflix');
    console.log(res.map(r => r.title));
    await app.close();
}
bootstrap();
//# sourceMappingURL=test_sim.js.map