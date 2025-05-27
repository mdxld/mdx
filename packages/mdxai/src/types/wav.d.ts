declare module 'wav' {
  export interface FileWriterOptions {
    channels: number;
    sampleRate: number;
    bitDepth: number;
  }

  export class FileWriter {
    constructor(filename: string, options: FileWriterOptions);
    on(event: 'finish', callback: () => void): void;
    on(event: 'error', callback: (error: Error) => void): void;
    write(data: Buffer): void;
    end(): void;
  }
}
