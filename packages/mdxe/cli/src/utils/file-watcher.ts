import chokidar, { FSWatcher } from 'chokidar'
import path from 'node:path'
import { debounce } from './debounce'

export interface WatchOptions {
  debounceDelay?: number
  ignored?: string[]
}

export class FileWatcher {
  private watcher: FSWatcher | null = null

  constructor(
    private filePath: string,
    private onChange: (filePath: string) => void,
    private options: WatchOptions = {},
  ) {}

  start() {
    const { debounceDelay = 300, ignored = [] } = this.options

    const debouncedOnChange = debounce(this.onChange, debounceDelay)

    const watchPath = path.dirname(this.filePath)

    this.watcher = chokidar.watch(watchPath, {
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', ...ignored],
      ignoreInitial: true,
      persistent: true,
    })

    this.watcher.on('change', (changedPath: string) => {
      if (changedPath === this.filePath || path.extname(changedPath).match(/\.(md|mdx)$/)) {
        console.log(`File changed: ${path.basename(changedPath)}`)
        debouncedOnChange(changedPath)
      }
    })

    console.log(`👀 Watching for changes in ${path.dirname(this.filePath)}...`)
  }

  stop() {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
  }
}
