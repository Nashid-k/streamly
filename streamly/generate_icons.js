const fs = require('fs');
const { Resvg } = require('@resvg/resvg-js');

const svgCode = fs.readFileSync('../frontend/public/favicon.svg', 'utf8');

const sizes = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192
};

Object.entries(sizes).forEach(([dpi, size]) => {
  const resvg = new Resvg(svgCode, {
    fitTo: { mode: 'width', value: size },
  });
  const pngData = resvg.render().asPng();
  
  const dir = `android/app/src/main/res/mipmap-${dpi}`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(`${dir}/ic_launcher.png`, pngData);
  fs.writeFileSync(`${dir}/ic_launcher_round.png`, pngData);
});

console.log("Icons generated successfully");
