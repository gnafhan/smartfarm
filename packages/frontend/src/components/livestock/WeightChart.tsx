'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import Card from '@/components/card';
import LineChart from '@/components/charts/LineChart';

interface WeightChartData {
  weightData: Array<{
    date: string;
    weight: number;
  }>;
  temperatureData: Array<{
    date: string;
    temperature: number;
  }>;
  methaneData: Array<{
    date: string;
    methanePpm: number;
  }>;
}

interface WeightChartProps {
  livestockId: string;
  barnId?: string;
}

export default function WeightChart({ livestockId, barnId }: WeightChartProps) {
  const [chartData, setChartData] = useState<WeightChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Set default date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchChartData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livestockId, startDate, endDate]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const params: any = {
        startDate,
        endDate,
      };

      const response = await api.get<WeightChartData>(
        `/api/livestock/${livestockId}/weight-entries/chart-data`,
        { params }
      );
      
      setChartData(response.data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Set empty data on error to show graceful handling
      setChartData({
        weightData: [],
        temperatureData: [],
        methaneData: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const prepareChartOptions = () => {
    if (!chartData) return null;

    // Prepare series data
    const series: any[] = [];
    
    // Weight series (primary)
    if (chartData.weightData.length > 0) {
      series.push({
        name: 'Weight (kg)',
        data: chartData.weightData.map(d => ({
          x: new Date(d.date).getTime(),
          y: d.weight,
        })),
        color: '#4318FF', // Brand color
      });
    }

    // Temperature series (secondary)
    if (chartData.temperatureData.length > 0) {
      series.push({
        name: 'Temperature (°C)',
        data: chartData.temperatureData.map(d => ({
          x: new Date(d.date).getTime(),
          y: d.temperature,
        })),
        color: '#FF6B6B', // Red for temperature
      });
    }

    // Methane series (tertiary)
    if (chartData.methaneData.length > 0) {
      series.push({
        name: 'Methane (ppm)',
        data: chartData.methaneData.map(d => ({
          x: new Date(d.date).getTime(),
          y: d.methanePpm,
        })),
        color: '#51E5FF', // Cyan for methane
      });
    }

    const options: any = {
      chart: {
        type: 'line',
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: false,
            reset: true,
          },
        },
        zoom: {
          enabled: true,
        },
      },
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      xaxis: {
        type: 'datetime',
        labels: {
          style: {
            colors: '#A3AED0',
            fontSize: '12px',
            fontWeight: '500',
          },
          datetimeFormatter: {
            year: 'yyyy',
            month: "MMM 'yy",
            day: 'dd MMM',
            hour: 'HH:mm',
          },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: series.map((s, index) => ({
        seriesName: s.name,
        show: true,
        opposite: index > 0, // Show secondary axes on the right
        labels: {
          style: {
            colors: s.color,
            fontSize: '12px',
            fontWeight: '500',
          },
        },
        title: {
          text: s.name,
          style: {
            color: s.color,
            fontSize: '12px',
            fontWeight: '600',
          },
        },
      })),
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        x: {
          format: 'dd MMM yyyy',
        },
        y: {
          formatter: function (value: number, { seriesIndex }: any) {
            if (seriesIndex === 0) return `${value.toFixed(1)} kg`;
            if (seriesIndex === 1) return `${value.toFixed(1)} °C`;
            if (seriesIndex === 2) return `${value.toFixed(0)} ppm`;
            return value.toString();
          },
        },
        style: {
          fontSize: '12px',
        },
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right',
        labels: {
          colors: '#A3AED0',
        },
        markers: {
          width: 12,
          height: 12,
          radius: 12,
        },
      },
      grid: {
        show: true,
        borderColor: '#E2E8F0',
        strokeDashArray: 5,
        yaxis: {
          lines: {
            show: true,
          },
        },
        xaxis: {
          lines: {
            show: false,
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
    };

    return { series, options };
  };

  const chartConfig = prepareChartOptions();

  return (
    <Card extra="w-full h-full p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-navy-700 dark:text-white">
          Weight Trend Analysis
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Weight measurements with environmental data overlay
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={endDate || new Date().toISOString().split('T')[0]}
            className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            max={new Date().toISOString().split('T')[0]}
            className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
          />
        </div>
      </div>

      {/* Chart */}
      <div className="h-[400px]">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Loading chart data...</p>
          </div>
        ) : !chartData || chartData.weightData.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">No weight data available for the selected period</p>
              <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                Add weight entries to see the trend analysis
              </p>
            </div>
          </div>
        ) : chartConfig ? (
          <LineChart
            chartData={chartConfig.series}
            chartOptions={chartConfig.options}
          />
        ) : null}
      </div>

      {/* Data Availability Info */}
      {!loading && chartData && chartData.weightData.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#4318FF]"></div>
            <span>Weight: {chartData.weightData.length} measurements</span>
          </div>
          {chartData.temperatureData.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#FF6B6B]"></div>
              <span>Temperature: {chartData.temperatureData.length} readings</span>
            </div>
          )}
          {chartData.methaneData.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#51E5FF]"></div>
              <span>Methane: {chartData.methaneData.length} readings</span>
            </div>
          )}
          {chartData.temperatureData.length === 0 && chartData.methaneData.length === 0 && (
            <div className="text-gray-500 dark:text-gray-500">
              No environmental data available for this period
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
