require("total4");
const Crawler = require("crawler");
const cheerio = require("cheerio");

const numnum = parseInt(process.argv[2]) || 1;

const crawler = new Crawler({
  rateLimit: 2000, // slow down
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

crawler.on("drain", () => {
  console.info("Well done...");
});

function runCrawler(db) {
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
          id: UID(),
          artistLetter,
          artistName,
          songName: title,
          content,
        };
        db.post("collections/lirikwebid", data)
          .then(() => {
            console.log("Successful pushing data", title);
          })
          .catch(() => {
            console.log("Failed pushing data", title);
          })
          .finally(done);
        // console.log(data);
        // done();
        return;
      }
    }
    done();
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
    uri: `https://lirik.web.id/sitemap/${numnum}/`,
    callback: handleSitemapPage,
    priority: 3,
  });
  // collectSitemapLinks((err, links) => {
  //   if (err) throw err;
  //   //links = [links[0]]; // testing only
  //   crawler.queue(
  //     links.map((uri) => ({
  //       uri,
  //       callback: handleSitemapPage,
  //       priority: 3,
  //     }))
  //   );
  // });
}

function collectSitemapLinks(callback) {
  REQUEST({
    url: "https://lirik.web.id/sitemap/",
    type: "html",
    callback: (err, response) => {
      if (err) return callback(err, null);
      const links = [];
      const konten = matchKonten(response.body);
      if (konten) {
        const $ = cheerio.load(konten);
        $("a").each((index, link) => {
          links.push($(link).attr("href"));
        });
        return callback(null, links);
      }
      callback(new Error("No links found.."), null);
    },
  });
}
function matchKonten(raw) {
  const konten = raw.match(
    /<div id=\"konten\"><\/div>(.?)+<div id=\"konten\"><\/div>/s
  );
  return konten !== null ? konten[0] : null;
}
LOAD("definitions, modules", () => {
  const db = MODULE("astradb");
  db.get("collections/lirikwebid")
    .then((d) => {
      if (d.output.status === 404) {
        db.post("collections", { name: "lirikwebid" })
          .then((d) => {
            if (d.output.status === 201) {
              runCrawler(db);
            } else {
              throw new Error("Something error...");
            }
          })
          .catch(console.error);
      } else {
        runCrawler(db);
      }
    })
    .catch(console.error);
});
