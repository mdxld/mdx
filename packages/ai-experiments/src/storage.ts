/**
 * Persistent storage for Elo ratings and experiment history
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { ParameterRating, CombinationRating, EloRating } from './elo.js';

export interface ExperimentHistory {
  timestamp: number;
  description: string;
  combinations: Array<Record<string, any>>;
  results: Array<{
    combination: Record<string, any>;
    result: any;
    error?: string;
    score?: number;
    rank?: number;
  }>;
  comparisons?: Array<{
    indexA: number;
    indexB: number;
    winner?: 'A' | 'B';
    isDraw: boolean;
    confidence: number;
  }>;
}

export interface RatingStorage {
  parameters: ParameterRating[];
  combinations: CombinationRating[];
  history: ExperimentHistory[];
  lastUpdated: number;
}

/**
 * Default storage directory
 */
const DEFAULT_STORAGE_DIR = '.ai-experiments';

/**
 * Storage file names
 */
const RATINGS_FILE = 'ratings.json';
const HISTORY_FILE = 'history.json';

/**
 * Storage manager class
 */
export class StorageManager {
  private storageDir: string;

  constructor(storageDir: string = DEFAULT_STORAGE_DIR) {
    this.storageDir = storageDir;
  }

  /**
   * Ensure storage directory exists
   */
  private async ensureStorageDir(): Promise<void> {
    try {
      await fs.access(this.storageDir);
    } catch {
      await fs.mkdir(this.storageDir, { recursive: true });
    }
  }

  /**
   * Load ratings from storage
   */
  async loadRatings(): Promise<RatingStorage> {
    await this.ensureStorageDir();
    const ratingsPath = join(this.storageDir, RATINGS_FILE);

    try {
      const data = await fs.readFile(ratingsPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return {
        parameters: [],
        combinations: [],
        history: [],
        lastUpdated: Date.now(),
      };
    }
  }

  /**
   * Save ratings to storage
   */
  async saveRatings(storage: RatingStorage): Promise<void> {
    await this.ensureStorageDir();
    const ratingsPath = join(this.storageDir, RATINGS_FILE);
    
    storage.lastUpdated = Date.now();
    await fs.writeFile(ratingsPath, JSON.stringify(storage, null, 2));
  }

  /**
   * Add experiment to history
   */
  async addExperimentHistory(experiment: ExperimentHistory): Promise<void> {
    const storage = await this.loadRatings();
    storage.history.push(experiment);
    
    if (storage.history.length > 1000) {
      storage.history = storage.history.slice(-1000);
    }
    
    await this.saveRatings(storage);
  }

  /**
   * Find or create parameter rating
   */
  async findOrCreateParameterRating(
    parameterType: string,
    parameterValue: any
  ): Promise<ParameterRating> {
    const storage = await this.loadRatings();
    
    const existing = storage.parameters.find(
      p => p.parameterType === parameterType && 
           JSON.stringify(p.parameterValue) === JSON.stringify(parameterValue)
    );

    if (existing) {
      return existing;
    }

    const newRating: ParameterRating = {
      parameterType,
      parameterValue,
      rating: {
        rating: 1200,
        matches: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      },
    };

    storage.parameters.push(newRating);
    await this.saveRatings(storage);
    
    return newRating;
  }

  /**
   * Find or create combination rating
   */
  async findOrCreateCombinationRating(
    combination: Record<string, any>
  ): Promise<CombinationRating> {
    const storage = await this.loadRatings();
    
    const existing = storage.combinations.find(
      c => JSON.stringify(c.combination) === JSON.stringify(combination)
    );

    if (existing) {
      return existing;
    }

    const newRating: CombinationRating = {
      combination,
      rating: {
        rating: 1200,
        matches: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      },
    };

    storage.combinations.push(newRating);
    await this.saveRatings(storage);
    
    return newRating;
  }

  /**
   * Update parameter rating
   */
  async updateParameterRating(
    parameterType: string,
    parameterValue: any,
    newRating: EloRating
  ): Promise<void> {
    const storage = await this.loadRatings();
    
    const index = storage.parameters.findIndex(
      p => p.parameterType === parameterType && 
           JSON.stringify(p.parameterValue) === JSON.stringify(parameterValue)
    );

    if (index >= 0) {
      storage.parameters[index].rating = newRating;
      await this.saveRatings(storage);
    }
  }

  /**
   * Update combination rating
   */
  async updateCombinationRating(
    combination: Record<string, any>,
    newRating: EloRating
  ): Promise<void> {
    const storage = await this.loadRatings();
    
    const index = storage.combinations.findIndex(
      c => JSON.stringify(c.combination) === JSON.stringify(combination)
    );

    if (index >= 0) {
      storage.combinations[index].rating = newRating;
      await this.saveRatings(storage);
    }
  }

  /**
   * Get top parameters by type
   */
  async getTopParametersByType(
    parameterType: string,
    limit: number = 10
  ): Promise<ParameterRating[]> {
    const storage = await this.loadRatings();
    
    return storage.parameters
      .filter(p => p.parameterType === parameterType)
      .sort((a, b) => b.rating.rating - a.rating.rating)
      .slice(0, limit);
  }

  /**
   * Get top combinations
   */
  async getTopCombinations(limit: number = 10): Promise<CombinationRating[]> {
    const storage = await this.loadRatings();
    
    return storage.combinations
      .sort((a, b) => b.rating.rating - a.rating.rating)
      .slice(0, limit);
  }

  /**
   * Get experiment history
   */
  async getHistory(limit?: number): Promise<ExperimentHistory[]> {
    const storage = await this.loadRatings();
    
    if (limit) {
      return storage.history.slice(-limit);
    }
    
    return storage.history;
  }

  /**
   * Clear all data (useful for testing)
   */
  async clearAll(): Promise<void> {
    const storage: RatingStorage = {
      parameters: [],
      combinations: [],
      history: [],
      lastUpdated: Date.now(),
    };
    
    await this.saveRatings(storage);
  }

  /**
   * Export ratings to a different format
   */
  async exportRatings(format: 'json' | 'csv' = 'json'): Promise<string> {
    const storage = await this.loadRatings();
    
    if (format === 'json') {
      return JSON.stringify(storage, null, 2);
    }
    
    if (format === 'csv') {
      const headers = ['Type', 'Value', 'Rating', 'Matches', 'Wins', 'Losses', 'Draws'];
      const rows = storage.parameters.map(p => [
        p.parameterType,
        JSON.stringify(p.parameterValue),
        p.rating.rating,
        p.rating.matches,
        p.rating.wins,
        p.rating.losses,
        p.rating.draws,
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Default storage manager instance
 */
export const defaultStorage = new StorageManager();
