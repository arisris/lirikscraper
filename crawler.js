require("total4");
const Crawler = require("crawler");
const cheerio = require("cheerio");

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

function runCrawler() {
  const handleLirikPage = (err, response, done) => {
    if (err) {
      console.error(err.message);
    } else {
      const $ = response.$;
      let title = $("h1.entry-title").text();
      title = title.replace("lirik lagu", "");
      const lirik = matchKonten($("body").html());
      if (lirik) {
        console.log("Pushing Data", title);
        const data = {
          id: UID(),
          pathname: response.request.uri.pathname,
          title,
          lirik,
        };
        console.log(data);
        done();
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
  collectSitemapLinks((err, links) => {
    if (err) throw err;
    links = [links[0]]; // testing only
    crawler.queue(
      links.map((uri) => ({
        uri,
        callback: handleSitemapPage,
        priority: 3,
      }))
    );
  });
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
  console.log(CONF.ASTRA_DB)
});
