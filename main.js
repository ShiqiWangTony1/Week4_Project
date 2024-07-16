const Koa = require('koa');
const fs = require('fs');
const path = require('path');
const md5 = require('md5');
const jpeg = require('jpeg-js');
const mongoose = require('mongoose');
const { Track } = require('./models');
const app = new Koa();

mongoose.connect('mongodb://localhost:27017/ytm', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

async function libraryInit(libraryPath) {
  console.log('Initializing library...');
  const musicMetadata = await import('music-metadata');
  const files = fs.readdirSync(libraryPath).filter(file => file.endsWith('.mp3'));
  console.log(`Found ${files.length} MP3 files.`);

  for (const file of files) {
    try {
      console.log(`Processing file: ${file}`);
      const filePath = path.join(libraryPath, file);
      const metadata = await musicMetadata.parseFile(filePath);

      const artist = metadata.common.artist || 'Unknown Artist';
      const title = metadata.common.title || 'Unknown Title';
      const album = metadata.common.album || 'Unknown Album';
      const trackId = md5(artist + title + album).slice(0, 16);

      const trackInfo = {
        track_id: trackId,
        title,
        artist: [artist],
        album,
        album_id: md5(album).slice(0, 16),
        genre: metadata.common.genre || [],
        length: metadata.format.duration || 0,
        track_number: metadata.common.track.no || 0,
        quality: 'STD',
        file: filePath
      };

      if (metadata.common.picture) {
        const imageBuffer = jpeg.encode({ data: metadata.common.picture[0].data, width: metadata.common.picture[0].width, height: metadata.common.picture[0].height }).data;
        fs.writeFileSync(path.join(libraryPath, 'cover', `${trackInfo.album_id}.jpg`), imageBuffer);
      }

      await Track.create(trackInfo);
      console.log(`Processed metadata for file: ${file}`);
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }

  console.log('Library Initialized');
}

app.use(async ctx => {
  const libraryPath = path.join(__dirname, 'Library');
  const indexPath = path.join(libraryPath, 'index.json');

  console.log(`Checking if ${indexPath} exists...`);

  if (!fs.existsSync(indexPath)) {
    console.log(`${indexPath} does not exist. Initializing library.`);
    await libraryInit(libraryPath);
  } else {
    console.log(`${indexPath} already exists. Skipping library initialization.`);
  }

  ctx.body = 'Library is ready';
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
