const fs = require('fs');

const SEARCH_FILE = "./public/search.json";
const DATA_FOLDER = "src/database/json";

// 读取 authors.json 和 works.json
// const authorsData = JSON.parse(fs.readFileSync('scripts/authors.json', 'utf-8'));
// const worksData = JSON.parse(fs.readFileSync('scripts/works.json', 'utf-8'));

const authorsData = JSON.parse(fs.readFileSync(`${DATA_FOLDER}/authors.json`, 'utf-8'));
const worksData = JSON.parse(fs.readFileSync(`${DATA_FOLDER}/works.json`, 'utf-8'));
const collectionsData = JSON.parse(fs.readFileSync(`${DATA_FOLDER}/collections.json`, 'utf-8'));

const searchResults = [];

const frontmatter = (title, fields = {}) => ({
  title,
  ...Object.fromEntries(
    Object.entries(fields).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== "";
    }),
  ),
});

// 处理 collections.json
// 过滤 works.json 中特定的数据项，例如过滤掉 id=10001 的项
const filteredCollections = collectionsData.collections
  .filter(collection => collection.online_data == 0);

filteredCollections.forEach((collection) => {
  searchResults.push({
    group: "诗集",
    slug: `collections/${collection.id}`,
    frontmatter: frontmatter(collection.name, {
      categories: [collection.kind],
    }),
    content: collection.desc || ""
  });
});

// 处理 authors.json
authorsData.authors.forEach((author) => {
  searchResults.push({
    group: "诗人",
    slug: `authors/${author.id}`,
    frontmatter: frontmatter(author.name, {
      categories: [author.dynasty],
    }),
    content: author.intro ? author.intro.slice(0, 50) : ""
  });
});

// 处理 works.json
worksData.works.forEach((work) => {
  searchResults.push({
    group: "诗词",
    slug: `works/${work.id}`,
    frontmatter: frontmatter(work.title, {
      categories: [work.dynasty],
      tags: [work.author], // 由于 works.json 中没有提供标签信息，这里留空
    }),
    content: work.content ? work.content.slice(0, 50) : ""
  });
});


try {
  // Keep the search index as a separate runtime asset instead of embedding
  // the entire dataset into every hydrated client bundle.
  const searchFolder = "./public";
  if (!fs.existsSync(searchFolder)) {
    fs.mkdirSync(searchFolder, { recursive: true });
  }

  fs.writeFileSync(SEARCH_FILE, JSON.stringify(searchResults), 'utf-8');

  console.log('search.json has been generated successfully.');
} catch (err) {
  console.error(err);
}
