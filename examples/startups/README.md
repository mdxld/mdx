# Idea to Startup

We can follow a disciplined entrepreneurship process to go from an idea to a startup, testing hundreds of ideas in parallel:

```typescript
on('idea.captured', async idea => {
  for await (const market of list`10 possible market segments for ${idea}`) {
    const marketResearch = await research`${market} in the context of delivering ${idea}`
    for await (const icp of list`10 possible ideal customer profiles for ${{ idea, market, marketResearch }}`) {
      const leanCanvas = await ai.leanCanvas({ idea, market, icp, marketResearch })
      const storyBrand = await ai.storyBrand({ idea, market, icp, marketResearch, leanCanvas })
      const landingPage = await ai.landingPage({ idea, market, icp, marketResearch, leanCanvas, storyBrand })
      for await (const title of list`25 blog post titles for ${{ idea, icp, market, leanCanvas, storyBrand }}`) {
        const content = await ai`write a blog post, starting with "# ${title}"`
        db.blog.create(title, content)
      }
      const influencers = await research`influencers across all social media platforms for ${icp} in ${market}`
      const competitors = await research`competitors of ${idea} for ${icp} in ${market}`
      for await (const competitor of extract`competitor names from ${competitors}`) {
        const comparison = await research`compare ${idea} to ${competitor}`
      }
    }
  }
})
```