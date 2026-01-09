/**
 * DTO for weight chart data with environmental overlays
 * Requirements: 3.1, 3.2, 3.3
 */
export class WeightChartDataDto {
  weightData: Array<{
    date: Date;
    weight: number;
  }>;

  temperatureData: Array<{
    date: Date;
    temperature: number;
  }>;

  methaneData: Array<{
    date: Date;
    methanePpm: number;
  }>;
}
