require("total4");
require("dbms");
const Fs = require("fs");

const db = DBMS();

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

async function readSource(n) {
  const data = {};
  let source = Fs.readFileSync(
    PATH.databases("storage/lagu-" + n + ".json"),
    "utf-8"
  );
  source = JSON.parse(source);
  for await (let item of source) {
    try {
      const artistName = ucWords(item.artist.split("-").join(" "));
      const songName = ucWords(item.song.split("-").join(" "));
      const slug = (ucWords(artistName) + " - " + ucWords(songName)).slug();
      const content = `<p>${item.lirik.join("<br />")}</p>`;
      const response = await db
        .insert("lirik", {
          uid: UID(),
          slug,
          artistName,
          songName,
          letter: n,
          content,
        })
        .promise();
    } catch (e) {
      console.error(e.message);
    }
  }
  return true;
}

const schemas = `CREATE TABLE IF NOT EXISTS lirik (
  uid VARCHAR(20) NOT NULL,
  slug VARCHAR(256),
  songName VARCHAR(256),
  artistName VARCHAR(256),
  letter ENUM("en", "id") default 'en',
  content MEDIUMTEXT,
  PRIMARY KEY (uid)
);
`;

LOAD("definitions, modules", async () => {
  try {
    await db.query(schemas).promise();
    await readSource("id");
    await readSource("en");
    console.log("Done......");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
});
