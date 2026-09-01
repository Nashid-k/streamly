import axios from 'axios';
const API_URL = "https://streamly-backend-9q7i.onrender.com/api";

async function test() {
  const res = await axios.get(`${API_URL}/movies/search?q=stranger things&_cb=v2`);
  const tvShow = res.data.movies.find(m => m.id.includes('-tv-'));
  console.log("TV Show:", tvShow.id, tvShow.title || tvShow.name);
  
  const details = await axios.get(`${API_URL}/movies/${tvShow.id}?platform=netflix&_cb=v2`);
  console.log("Details ID:", details.data.id);
  console.log("Details type:", details.data.type);
  console.log("Details seasons:", details.data.seasons);
}
test().catch(console.error);
