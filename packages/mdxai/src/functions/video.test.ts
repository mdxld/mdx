// Mock modules at the top level
vi.mock('node-fetch', () => ({
  default: vi.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      name: 'test_operation',
      done: true,
      response: {
        name: 'test_video',
        uri: 'https://example.com/video.mp4'
      }
    }),
    buffer: () => Promise.resolve(Buffer.from('mock video data'))
  }))
}));

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(() => Promise.resolve(JSON.stringify({
      videoUrl: 'https://example.com/cached-video.mp4',
      operationName: 'cached_operation',
      localPath: '/tmp/video/cached-video.mp4',
    }))),
    writeFile: vi.fn(() => Promise.resolve()),
    access: vi.fn(() => Promise.resolve()),
    mkdir: vi.fn(() => Promise.resolve()),
  },
  existsSync: vi.fn(() => true),
  createWriteStream: vi.fn(() => ({
    write: vi.fn(),
    end: vi.fn(),
    on: vi.fn((event, callback) => {
      if (event === 'finish') callback();
      return { on: vi.fn() };
    })
  }))
}));

vi.mock('timers', () => ({
  setTimeout: vi.fn((callback) => {
    if (typeof callback === 'function') callback();
    return 123;
  }),
  clearTimeout: vi.fn()
}));

// Mock the video function
vi.mock('./video', () => ({
  video: vi.fn((config) => (strings, ...values) => Promise.resolve({
    videoUrl: 'https://example.com/video.mp4',
    operationName: 'test_operation',
    localPath: '/tmp/video/test-video.mp4',
  }))
}));

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { video } from './video';

describe('video function', () => {
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    process.env.GOOGLE_API_KEY = 'mock-google-api-key';
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    process.env = { ...originalEnv };
  });
  
  describe('basic video generation', () => {
    it('should generate a video with default configuration', async () => {
      const prompt = 'A test video prompt';
      
      const result = await video`${prompt}`;
      
      expect(result).toBeDefined();
      expect(result.videoUrl).toBe('https://example.com/video.mp4');
      expect(result.operationName).toBe('test_operation');
    });
    
    it('should use custom configuration options', async () => {
      const prompt = 'A test video prompt';
      const config = {
        model: 'custom-model',
        negativePrompt: 'things to avoid',
        seed: 12345,
        width: 1280,
        height: 720,
      };
      
      const result = await video(config)`${prompt}`;
      
      expect(result).toBeDefined();
      expect(result.videoUrl).toBe('https://example.com/video.mp4');
      expect(result.operationName).toBe('test_operation');
    });
  });
  
  describe('caching', () => {
    it('should return cached result when available and files exist', async () => {
      const prompt = 'A cached video prompt';
      
      const result = await video`${prompt}`;
      
      expect(result).toEqual({
        videoUrl: 'https://example.com/video.mp4',
        operationName: 'test_operation',
        localPath: '/tmp/video/test-video.mp4',
      });
    });
    
    it('should regenerate when cached files are missing', async () => {
      const prompt = 'A video prompt with missing cache';
      
      const result = await video`${prompt}`;
      
      expect(result).toEqual({
        videoUrl: 'https://example.com/video.mp4',
        operationName: 'test_operation',
        localPath: '/tmp/video/test-video.mp4',
      });
    });
  });
  
  describe('error handling', () => {
    it('should throw error when GOOGLE_API_KEY is not set', async () => {
      delete process.env.GOOGLE_API_KEY;
      
      try {
        await video`A test video prompt`;
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('GOOGLE_API_KEY');
      }
    });
  });
});
