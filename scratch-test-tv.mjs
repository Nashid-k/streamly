import axios from 'axios';
const API_URL = "https://streamly-backend-9q7i.onrender.com/api";

async function test() {
  const res = await axios.get(`${API_URL}/movies/search?q=breaking bad&_cb=v2`);
  const tvShow = res.data.movies ? res.data.movies[0] : res.data[0];
  console.log("TV Show:", tvShow.id, tvShow.title || tvShow.name);
  
  const details = await axios.get(`${API_URL}/movies/${tvShow.id}?platform=netflix&_cb=v2`);
  console.log("Details has seasons?", !!details.data.seasons);
  console.log("Details type:", details.data.type);
  
  const eps = await axios.get(`${API_URL}/movies/${tvShow.id}/season/1?platform=netflix&_cb=v2`);
  console.log("Season 1 keys:", Object.keys(eps.data));
  if (eps.data.episodes) {
    console.log("Episodes count:", eps.data.episodes.length);
  } else if (Array.isArray(eps.data)) {
    console.log("Returned array directly, length:", eps.data.length);
  } else {
    console.log("Unknown format:", eps.data);
  }
}
test().catch(console.error);
