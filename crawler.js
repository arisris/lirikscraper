require("total4");
const Crawler = require("crawler");
const cheerio = require("cheerio");

const initialNumPage = parseInt(process.argv[2]) || 1;
const totalPages = 900;

function postToDB(data, done) {
  const DB = DBMS();
  DB.insert("lyrics", data).callback(done);
}
const ucFirst = (str) =>
  str
    .split("")
    .map((v, i) => (i === 0 ? v.toUpperCase() : v))
    .join("");
const ucWords = (str) =>
  str
    .split(" ")
    .map((i) => ucFirst(i))
    .join(" ");
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
      "Mozilla/5.0 (Linux; Android 6.0.1; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36",
    headers: {
      accept: "text/html",
      "accept-language": "en-US,en;q=0.9,id-ID;q=0.8,id;q=0.7",
    },
  });
  const matchKonten = (raw) => {
    const konten = raw.match(
      /<div id=\"konten\"><\/div>(.?)+<div id=\"konten\"><\/div>/s
    );
    return konten !== null ? konten[0] : null;
  };
  const handleLirikPage = (err, response, done) => {
    if (err) {
      console.error(err.message);
    } else {
      const $ = response.$;
      let title = $("h1.entry-title").text();
      title = title.replace("lirik lagu", "").trim();
      const content = matchKonten($("body").html());
      if (content) {
        const [artistLetter, artistName] = new String(
          response.request.uri.pathname
        )
          .split("/")
          .filter((i) => i);
        const data = {
          uid: UID(),
          slug: title.slug(),
          artist: ucWords(artistName.split("-").join(" ")),
          song: ucWords(title),
          source: "lirik.web.id",
          content,
        };
        return postToDB(data, (err, id) => {
          if (err) console.error(err.message);
          done();
        });
      }
    }
    done(); // next
  };
  const handleSitemapPage = (err, response, done) => {
    if (err) {
      console.error(err.message);
    } else {
      const $ = response.$;
      const konten = matchKonten($("body").html());
      if (konten) {
        const $$ = cheerio.load(konten);
        $$("ul > li > a").each(async (_, anchor) => {
          let uri = $$(anchor).attr("href");
          uri = decodeURIComponent(uri);
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
  };
  crawler.queue({
    uri: `https://lirik.web.id/sitemap/${pageNum}/`,
    callback: handleSitemapPage,
    // callback: (err, response, done) => {
    //   console.log(response.$("title").text());
    //   done();
    // },
    priority: 3,
  });
  return crawler;
}
const sleep = (s) => new Promise((resolve) => setTimeout(resolve, 3000));
LOAD("definitions, modules", async () => {
  for await (let i of Array(totalPages)
    .fill(null)
    .slice(initialNumPage - 1)
    .map((_, i) => i + initialNumPage)) {
    //let currentPage = initialNumPage + i;
    await new Promise((resolve) => {
      console.log(`Start crawling Page ${i}`, `Please wait...`);
      const crawler = crawlThePage(i);
      crawler.on("drain", resolve);
    }).finally(() => console.log(`Done crawling Page ${i}`));
    await sleep(1000 * 3600); // wait for 1 hours before next
  }
  console.log(`Crawling task is all done.....`);
});
