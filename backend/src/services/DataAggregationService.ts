import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface AggregatedReading {
  timestamp: string;
  temperature: number;
  humidity?: number;
  count: number;
}

export interface ReadingStats {
  min: number;
  max: number;
  avg: number;
  count: number;
}

export class DataAggregationService {
  /**
   * Get aggregated readings for a cold cell with time-based grouping
   */
  async getAggregatedReadings(
    coldCellId: string,
    range: '24h' | '7d' | '30d'
  ): Promise<{ stats: ReadingStats; data: AggregatedReading[] }> {
    try {
      // Calculate date range
      const endDate = new Date();
      let startDate: Date;
      let groupInterval: string; // PostgreSQL interval

      switch (range) {
        case '24h':
          startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
          groupInterval = '1 minute'; // Group by 1 minute
          break;
        case '7d':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          groupInterval = '30 minutes'; // Group by 30 minutes
          break;
        case '30d':
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          groupInterval = '2 hours'; // Group by 2 hours
          break;
      }

      // Get all devices for this cold cell
      const devices = await prisma.device.findMany({
        where: { coldCellId },
        select: { id: true },
      });

      if (devices.length === 0) {
        return {
          stats: { min: 0, max: 0, avg: 0, count: 0 },
          data: [],
        };
      }

      const deviceIds = devices.map(d => d.id);

      // Get raw readings
      const readings = await prisma.sensorReading.findMany({
        where: {
          deviceId: { in: deviceIds },
          recordedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          recordedAt: 'asc',
        },
      });

      if (readings.length === 0) {
        return {
          stats: { min: 0, max: 0, avg: 0, count: 0 },
          data: [],
        };
      }

      // Calculate stats (temperature only for now)
      const temperatures = readings.map(r => r.temperature);
      const stats: ReadingStats = {
        min: Math.min(...temperatures),
        max: Math.max(...temperatures),
        avg: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
        count: readings.length,
      };

      // Aggregate data by time intervals (includes humidity)
      const aggregated = this.aggregateByInterval(readings, groupInterval);

      return { stats, data: aggregated };
    } catch (error) {
      logger.error('Error getting aggregated readings', error as Error, { coldCellId, range });
      throw error;
    }
  }

  /**
   * Aggregate readings by time interval
   */
  private aggregateByInterval(
    readings: Array<{ temperature: number; humidity?: number | null; recordedAt: Date }>,
    interval: string
  ): AggregatedReading[] {
    const intervalMs = this.parseInterval(interval);
    const grouped = new Map<string, { temps: number[]; humidities: number[] }>();

    // Group readings by time bucket
    for (const reading of readings) {
      const bucketTime = Math.floor(reading.recordedAt.getTime() / intervalMs) * intervalMs;
      const bucketKey = new Date(bucketTime).toISOString();

      if (!grouped.has(bucketKey)) {
        grouped.set(bucketKey, { temps: [], humidities: [] });
      }
      const bucket = grouped.get(bucketKey)!;
      bucket.temps.push(reading.temperature);
      if (reading.humidity != null) {
        bucket.humidities.push(reading.humidity);
      }
    }

    // Calculate averages for each bucket
    const aggregated: AggregatedReading[] = [];
    for (const [timestamp, bucket] of grouped.entries()) {
      const avgTemp = bucket.temps.reduce((a, b) => a + b, 0) / bucket.temps.length;
      const avgHumidity = bucket.humidities.length > 0
        ? bucket.humidities.reduce((a, b) => a + b, 0) / bucket.humidities.length
        : undefined;
      
      aggregated.push({
        timestamp,
        temperature: Math.round(avgTemp * 10) / 10, // Round to 1 decimal
        humidity: avgHumidity != null ? Math.round(avgHumidity * 10) / 10 : undefined,
        count: bucket.temps.length,
      });
    }

    // Sort by timestamp
    return aggregated.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Parse interval string to milliseconds
   */
  private parseInterval(interval: string): number {
    const match = interval.match(/(\d+)\s*(minute|hour|day)/);
    if (!match) return 5 * 60 * 1000; // Default 5 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'minute':
        return value * 60 * 1000;
      case 'hour':
        return value * 60 * 60 * 1000;
      case 'day':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 5 * 60 * 1000;
    }
  }
}

export const dataAggregationService = new DataAggregationService();
