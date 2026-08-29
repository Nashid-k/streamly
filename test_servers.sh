echo "Testing Server 1: vidlink.pro"
curl -I -s -L -A "Mozilla/5.0" -m 5 https://vidlink.pro/movie/564147 | head -n 1

echo "Testing Server 2: vidsrc.xyz"
curl -I -s -L -A "Mozilla/5.0" -m 5 https://vidsrc.xyz/embed/movie?tmdb=564147 | head -n 1

echo "Testing Server 3: 2embed.cc"
curl -I -s -L -A "Mozilla/5.0" -m 5 https://www.2embed.cc/embed/564147 | head -n 1

echo "Testing Server 4: vidsrc.in"
curl -I -s -L -A "Mozilla/5.0" -m 5 https://vidsrc.in/embed/movie?tmdb=564147 | head -n 1
