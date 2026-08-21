import { loadMovies } from './data/movieService';

console.log('--- CineScribbl Master Telugu Movie Dataset Seeder ---');
const movies = loadMovies();
console.log(`Successfully verified ${movies.length} unique Telugu movies:`);
console.log(movies.slice(0, 15).map((m, i) => ` ${i + 1}. ${m}`).join('\n'));
console.log(`... and ${movies.length - 15} more.`);
console.log('Dataset is ready for multiplayer games!');
