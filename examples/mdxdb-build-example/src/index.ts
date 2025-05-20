import { articles } from '../.db'; // Adjusted path if Velite outputs directly to .db
                                   // Or from 'mdxdb/.db' if it were a published package and types resolved that way.
                                   // For local example, direct import from ../.db should work after build-content.

function displayArticles() {
  if (!articles || articles.length === 0) {
    console.log("No articles found. Did you run 'pnpm build-content'?");
    return;
  }

  console.log('--- Published Articles ---');
  articles.forEach(article => {
    console.log(`Title: ${article.title}`);
    console.log(`Slug: ${article.slug}`);
    console.log(`Date: ${article.date}`);
    console.log(`Permalink: ${article.permalink}`);
    console.log(`Description: ${article.description}`);
    // console.log(`Body (HTML): ${article.body.substring(0, 50)}...`); // Accessing processed markdown
    console.log('-------------------------');
  });
}

displayArticles();
