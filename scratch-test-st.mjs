import axios from 'axios';
const API_URL = "https://streamly-backend-9q7i.onrender.com/api";

async function test() {
  const res = await axios.get(`${API_URL}/movies/tmdb-tv-66732?platform=netflix&_cb=v2`);
  console.log(JSON.stringify(res.data, null, 2));
}
test().catch(console.error);
