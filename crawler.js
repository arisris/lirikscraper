require('total4');
const Crawler = require('crawler');
const cheerio = require('cheerio');

const initialNumPage = parseInt(process.argv[2]) || 1;
const totalPages = 900;

function postToDB(data, done) {
  try {
    const DB = DBMS();
    DB.insert('lyrics', data).callback(done);
  } catch (e) {
    done(e, null);
  }
}

function crawlThePage(pageNum) {
  const crawler = new Crawler({
    rateLimit: 2000, // slow down requests
    maxConnections: 1, // only one connection
    callback: (err, res, done) => {
      if (err) {
        console.error(err.message);
      } else {
        console.info(res.statusCode);
      }
      done();
    },
    userAgent:
      'Mozilla/5.0 (Linux; Android 6.0.1; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36',
    headers: {
      accept: 'text/html',
      'accept-language': 'en-US,en;q=0.9,id-ID;q=0.8,id;q=0.7',
    },
  });
  const matchKonten = (raw) => {
    try {
      raw = raw.match(
        /<div id=\"konten\"><\/div>(.?)+<div id=\"konten\"><\/div>/s,
      );
      return raw !== null ? raw[0] : null;
    } catch (e) {
      console.error('Matching konten error..')
      return null;
    }
  };
  const handleLirikPage = (err, response, done) => {
    try {
      if (err) {
        console.error(err.message);
      } else {
        const $ = response.$;
        let title = $('h1.entry-title').text();
        title = title.replace('lirik lagu', '').trim();
        const content = matchKonten($('body').html());
        if (content) {
          const [artistLetter, artistName] = new String(
            response.request.uri.pathname,
          )
            .split('/')
            .filter((i) => i);
          const data = {
            uid: UID(),
            slug: title.slug(),
            artist: DEF.ucWords(artistName.split('-').join(' ')),
            song: DEF.ucWords(title),
            source: 'lirik.web.id',
            content,
          };
          return postToDB(data, (err, id) => {
            if (err) console.error('Error push to db.');
            done();
          });
        }
      }
      done(); // next
    } catch (e) {
      console.error('Crawler error.. but still continues..')
      done();
    }
  };
  const handleSitemapPage = (err, response, done) => {
    try {
      if (err) {
        console.error(err.message);
      } else {
        const $ = response.$;
        const konten = matchKonten($('body').html());
        if (konten) {
          const $$ = cheerio.load(konten);
          $$('ul > li > a').each(async (_, anchor) => {
            let uri = $$(anchor).attr('href');
            //uri = decodeURIComponent(uri);
            crawler.queue({
              uri,
              callback: handleLirikPage,
              priority: 5,
            });
          });
          done();
          return;
        }
      }
      done();
    } catch (e) {
      console.error('Crawler error.. but still continues..')
      done();
    }
  };
  crawler.queue({
    uri: `https://lirik.web.id/sitemap/${pageNum}/`,
    callback: handleSitemapPage,
    priority: 3,
  });
  return crawler;
}
const sleep = (s) => new Promise((resolve) => setTimeout(resolve, 3000));
LOAD('definitions, modules', async () => {
  //console.log(process.env);
  for await (let i of Array(totalPages)
    .fill(null)
    .slice(initialNumPage - 1)
    .map((_, i) => i + initialNumPage)) {
    await new Promise((resolve) => {
      console.log(`Start crawling Page ${i}`, `Please wait...`);
      const crawler = crawlThePage(i);
      crawler.on('drain', resolve);
    })
      .catch(console.error)
      .finally(() => console.log(`Done crawling Page ${i}`));
    await sleep(1000 * 3600); // wait for 1 hours before next
  }
  console.log(`Crawling task is all done.....`);
});
