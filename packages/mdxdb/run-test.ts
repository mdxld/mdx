import { MdxDb } from './lib/mdxdb'

async function main() {
  console.log('Initializing MdxDb...')
  const db = new MdxDb()

  try {
    console.log('--- Initial Build ---')
    let data = await db.build()
    console.log('Initial build successful. Data:', JSON.stringify(data, null, 2))

    let initialPosts = db.getCollection('posts') // Using getCollection for specific check
    if (initialPosts && initialPosts.length > 0) {
      console.log(`Initial check: Found post "${initialPosts[0].title}" with description: "${initialPosts[0].description}"`)
    } else {
      console.log('No posts found after initial build using getCollection.')
    }

    console.log('\n--- Testing list() method ---')
    // 1. List all entries
    const allEntries = db.list()
    console.log(`list() (all collections): Found ${allEntries.length} entries in total.`)
    // 2. List entries from 'posts' collection
    const postsCollectionEntries = db.list('posts')
    console.log(`list('posts'): Found ${postsCollectionEntries.length} entries.`)
    if (postsCollectionEntries.length > 0) {
      console.log(`  First post title from list('posts'): ${postsCollectionEntries[0].title}`)
    }
    // 3. List entries from a non-existent collection
    const nonExistentCollectionEntries = db.list('pages')
    console.log(`list('pages') (non-existent): Found ${nonExistentCollectionEntries.length} entries.`)


    console.log('\n--- Testing get() method ---')
    // 1. Get an existing entry by slug from 'posts' collection
    const postBySlugSpecific = db.get('test-post', 'posts')
    if (postBySlugSpecific) {
      console.log(`get('test-post', 'posts'): Found post titled "${postBySlugSpecific.title}"`)
    } else {
      console.log(`get('test-post', 'posts'): Post not found.`)
    }
    // 2. Get an existing entry by slug from any collection
    const postBySlugGlobal = db.get('test-post')
    if (postBySlugGlobal) {
      console.log(`get('test-post'): Found post titled "${postBySlugGlobal.title}" (searched all collections)`)
    } else {
      console.log(`get('test-post'): Post not found (searched all collections).`)
    }
    // 3. Get a non-existent entry by slug
    const nonExistentPost = db.get('non-existent-slug')
    if (nonExistentPost) {
      console.log(`get('non-existent-slug'): Unexpectedly found a post: ${nonExistentPost.title}`)
    } else {
      console.log(`get('non-existent-slug'): Correctly returned no post.`)
    }
    // 4. Get an entry by slug from a non-existent collection
    const postFromNonExistentCollection = db.get('test-post', 'fictionalCollection')
    if (postFromNonExistentCollection) {
      console.log(`get('test-post', 'fictionalCollection'): Unexpectedly found a post: ${postFromNonExistentCollection.title}`)
    } else {
      console.log(`get('test-post', 'fictionalCollection'): Correctly returned no post (collection does not exist).`)
    }

    // --- Testing set() method ---
    console.log('\n--- Testing set() method ---')

    const newPostId = 'new-test-post-from-set'
    const newPostContent = {
      frontmatter: { title: 'New Post via Set', date: '2024-07-30', author: 'MdxDb Setter', slug: newPostId },
      body: 'This is the body of a new post created by MdxDb.set().'
    }

    try {
      // 1. Create a new entry
      console.log(`Attempting to create '${newPostId}'...`)
      await db.set(newPostId, newPostContent, 'posts')
      console.log(`set('${newPostId}') successful.`)
      // Verify creation - requires Velite to rebuild. We'll do a manual build for this test.
      console.log('Rebuilding database to pick up new file for "set" test...')
      await db.build() 
      let createdPost = db.get(newPostId, 'posts')
      if (createdPost) {
        console.log(`get('${newPostId}') after set: Found "${createdPost.title}"`)
      } else {
        console.error(`get('${newPostId}') after set: NOT FOUND. This might indicate an issue with set or build/get timing.`)
      }

      // 2. Overwrite an existing entry
      console.log(`\nAttempting to overwrite '${newPostId}'...`)
      const updatedPostContent = {
        frontmatter: { ...newPostContent.frontmatter, title: 'Updated Post via Set' },
        body: 'This is the updated body of the post modified by MdxDb.set().'
      }
      await db.set(newPostId, updatedPostContent, 'posts')
      console.log(`set('${newPostId}' for overwrite) successful.`)
      console.log('Rebuilding database to pick up updated file for "set" test...')
      await db.build() // Rebuild again
      let updatedPost = db.get(newPostId, 'posts')
      if (updatedPost && updatedPost.title === 'Updated Post via Set') {
        console.log(`get('${newPostId}') after overwrite: Title is "${updatedPost.title}" (Correctly updated)`)
      } else if (updatedPost) {
        console.error(`get('${newPostId}') after overwrite: Title is "${updatedPost.title}" (NOT updated)`)
      } else {
        console.error(`get('${newPostId}') after overwrite: NOT FOUND.`)
      }

    } catch (e) {
      console.error('Error during set() tests for create/overwrite:', e.message, e.stack)
    }
    
    // 3. Test set() with a non-existent collection name
    try {
      console.log(`\nAttempting set() with non-existent collection 'fictionalCollection'...`)
      await db.set('some-id', newPostContent, 'fictionalCollection')
      console.error("set() with non-existent collection: Should have thrown an error but didn't.")
    } catch (e) {
      console.log(`set() with non-existent collection: Correctly threw an error: "${e.message}"`)
    }
    
    // 4. Test set() without collectionName
    try {
      console.log(`\nAttempting set() without collectionName...`)
      // @ts-expect-error Testing invalid call by omitting collectionName
      await db.set('another-id', newPostContent, undefined)
      console.error("set() without collectionName: Should have thrown an error but didn't.")
    } catch (e) {
      console.log(`set() without collectionName: Correctly threw an error: "${e.message}"`)
    }
    // --- End of set() method tests ---


    // --- Testing delete() method ---
    console.log('\n--- Testing delete() method ---')
    const postToDeleteId = 'post-to-be-deleted'
    const postToDeleteContent = {
      frontmatter: { title: 'Post To Delete', date: '2024-07-30', author: 'MdxDb Deleter', slug: postToDeleteId },
      body: 'This post is created specifically for testing the delete() method.'
    }

    try {
      // 1. Create a post to delete
      console.log(`Creating '${postToDeleteId}' for deletion test...`)
      await db.set(postToDeleteId, postToDeleteContent, 'posts')
      console.log('Rebuilding database to pick up file for deletion test...')
      await db.build()
      let entryToDelete = db.get(postToDeleteId, 'posts')
      if (!entryToDelete) {
        console.error(`Failed to create/get '${postToDeleteId}' for deletion test. Aborting delete tests.`)
      } else {
        console.log(`'${postToDeleteId}' created successfully. Proceeding with delete.`)

        // 2. Delete the existing entry
        const deleteResult = await db.delete(postToDeleteId, 'posts')
        console.log(`db.delete('${postToDeleteId}', 'posts') result: ${deleteResult}`)
        if (!deleteResult) {
             console.error(`db.delete('${postToDeleteId}', 'posts') returned false, expected true.`)
        }
        
        console.log('Rebuilding database after delete operation...')
        await db.build()
        entryToDelete = db.get(postToDeleteId, 'posts')
        if (entryToDelete) {
          console.error(`'${postToDeleteId}' still exists after delete and rebuild. Deletion test FAILED.`)
        } else {
          console.log(`'${postToDeleteId}' successfully deleted and not found after rebuild. Deletion test PASSED.`)
        }
      }
    } catch (e) {
      console.error(`Error during delete() test for existing entry: ${e.message}`, e.stack)
    }

    // 3. Test deleting a non-existent entry
    try {
      console.log(`\nAttempting to delete non-existent entry 'i-do-not-exist'...`)
      const nonExistentDeleteResult = await db.delete('i-do-not-exist', 'posts')
      console.log(`db.delete('i-do-not-exist', 'posts') result: ${nonExistentDeleteResult}`)
      if (nonExistentDeleteResult) {
        console.error('delete() of non-existent entry: Expected false, got true.')
      } else {
        console.log('delete() of non-existent entry: Correctly returned false.')
      }
    } catch (e) {
      console.error(`Error during delete() test for non-existent entry: ${e.message}`, e.stack)
    }

    // 4. Test delete() with a non-existent collection name
    try {
      console.log(`\nAttempting delete() with non-existent collection 'fictionalCollection'...`)
      await db.delete('any-id', 'fictionalCollection')
      console.error("delete() with non-existent collection: Should have thrown an error but didn't.")
    } catch (e) {
      console.log(`delete() with non-existent collection: Correctly threw an error: "${e.message}"`)
    }
    
    // 5. Test delete() without collectionName
    try {
      console.log(`\nAttempting delete() without collectionName...`)
      // @ts-expect-error Testing invalid call
      await db.delete('another-id-to-delete', undefined)
      console.error("delete() without collectionName: Should have thrown an error but didn't.")
    } catch (e) {
      console.log(`delete() without collectionName: Correctly threw an error: "${e.message}"`)
    }
    // --- End of delete() method tests ---


    console.log('\n--- Starting Watch Mode ---')
    db.watch() 

    console.log('\nWatch mode started. Velite is now monitoring for changes.')
    console.log('To test: Modify content in "packages/mdxdb/content/posts/test-post.mdx" (e.g., change the description).')
    console.log('Then, observe the console output for "Velite rebuild detected" and "Successfully re-loaded data".')
    console.log('After Velite rebuilds, the updated data will be reflected in subsequent calls to db.getData() or db.getCollection().')
    
    console.log('\nScript will keep running. Press Ctrl+C to stop the watch mode and exit.')
    
    const intervalId = setInterval(() => {
      // Keep alive
    }, 10000); 


    process.on('SIGINT', () => {
      console.log('\nSIGINT received. Stopping watch mode...')
      db.stopWatch()
      clearInterval(intervalId)
      console.log('Watch mode stopped. Exiting.')
      process.exit(0)
    })

  } catch (error) {
    console.error('Error during MdxDb operations:', error)
    db.stopWatch() 
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Unhandled error in main:', error)
  process.exit(1)
})
