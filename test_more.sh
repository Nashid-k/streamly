domains=("superembed.stream" "autoembed.to" "embed.su" "vidsrc.rip" "multiembed.mov")
for domain in "${domains[@]}"; do
  echo "Testing $domain"
  curl -I -s -L -A "Mozilla/5.0" -m 3 "https://$domain/embed/movie?tmdb=564147" | head -n 1
done
