'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import LineChart from '@/components/charts/LineChart';
import { MdDateRange, MdBarChart } from 'react-icons/md';

interface Barn {
  id: string;
  name: string;
  code: string;
  sensors: string[];
}

interface AggregatedReading {
  periodStart: string;
  periodEnd: string;
  sensorId: string;
  barnId: string;
  avgMethanePpm: number;
  avgCo2Ppm: number;
  avgNh3Ppm: number;
  avgTemperature: number;
  avgHumidity: number;
  maxMethanePpm: number;
  maxCo2Ppm: number;
  maxNh3Ppm: number;
  minMethanePpm: number;
  minCo2Ppm: number;
  minNh3Ppm: number;
  readingCount: number;
  maxAlertLevel: string;
}

type AggregationPeriod = 'hourly' | 'daily' | 'weekly';
type GasType = 'methane' | 'co2' | 'nh3';

// Gas thresholds for reference lines
const GAS_THRESHOLDS = {
  methane: {
    warning: 500,
    danger: 1000,
  },
  co2: {
    warning: 2000,
    danger: 3000,
  },
  nh3: {
    warning: 15,
    danger: 25,
  },
};

export default function HistoricalChartsPage() {
  const [barns, setBarns] = useState<Barn[]>([]);
  const [availableSensors, setAvailableSensors] = useState<string[]>([]);
  const [selectedBarn, setSelectedBarn] = useState<string>('');
  const [selectedSensor, setSelectedSensor] = useState<string>('');
  const [selectedGas, setSelectedGas] = useState<GasType>('methane');
  const [aggregation, setAggregation] = useState<AggregationPeriod>('hourly');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [data, setData] = useState<AggregatedReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize date range (last 7 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  // Fetch barns on mount
  useEffect(() => {
    const fetchBarns = async () => {
      try {
        const response = await api.get('/api/barns');
        // Backend returns PaginatedResponse with data property
        const barnsList = response.data?.data || response.data?.items || [];
        setBarns(barnsList);
        
        // Auto-select first barn if available
        if (barnsList.length > 0) {
          setSelectedBarn(barnsList[0].id);
          if (barnsList[0].sensors && barnsList[0].sensors.length > 0) {
            setSelectedSensor(barnsList[0].sensors[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching barns:', err);
        setError('Failed to load barns');
      }
    };

    fetchBarns();
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    if (!selectedBarn || !startDate || !endDate) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          barnId: selectedBarn,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate + 'T23:59:59').toISOString(),
          aggregation,
        });

        // Only add sensorId if selected
        if (selectedSensor) {
          params.append('sensorId', selectedSensor);
        }

        const response = await api.get(`/api/monitoring/readings/aggregated?${params}`);
        setData(response.data || []);
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setError('Failed to load historical data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedBarn, selectedSensor, startDate, endDate, aggregation]);

  // Update sensor when barn changes - fetch available sensors from monitoring data
  useEffect(() => {
    const fetchSensors = async () => {
      if (!selectedBarn) {
        setAvailableSensors([]);
        setSelectedSensor('');
        return;
      }

      try {
        const response = await api.get(`/api/monitoring/sensors/${selectedBarn}`);
        const sensors = response.data || [];
        setAvailableSensors(sensors);
        
        // Auto-select first sensor if available
        if (sensors.length > 0) {
          setSelectedSensor(sensors[0]);
        } else {
          setSelectedSensor('');
        }
      } catch (err) {
        console.error('Error fetching sensors:', err);
        setAvailableSensors([]);
        setSelectedSensor('');
      }
    };

    fetchSensors();
  }, [selectedBarn]);

  // Prepare chart data
  const getChartData = () => {
    if (!data || data.length === 0) {
      return {
        series: [],
        options: {},
      };
    }

    const gasConfig = {
      methane: {
        label: 'Methane (CH₄)',
        unit: 'ppm',
        avgKey: 'avgMethanePpm' as keyof AggregatedReading,
        maxKey: 'maxMethanePpm' as keyof AggregatedReading,
        minKey: 'minMethanePpm' as keyof AggregatedReading,
        color: '#3B82F6',
      },
      co2: {
        label: 'Carbon Dioxide (CO₂)',
        unit: 'ppm',
        avgKey: 'avgCo2Ppm' as keyof AggregatedReading,
        maxKey: 'maxCo2Ppm' as keyof AggregatedReading,
        minKey: 'minCo2Ppm' as keyof AggregatedReading,
        color: '#10B981',
      },
      nh3: {
        label: 'Ammonia (NH₃)',
        unit: 'ppm',
        avgKey: 'avgNh3Ppm' as keyof AggregatedReading,
        maxKey: 'maxNh3Ppm' as keyof AggregatedReading,
        minKey: 'minNh3Ppm' as keyof AggregatedReading,
        color: '#F59E0B',
      },
    };

    const config = gasConfig[selectedGas];
    const thresholds = GAS_THRESHOLDS[selectedGas];

    const categories = data.map((d) => new Date(d.periodStart).toLocaleString());
    const avgData = data.map((d) => Number(d[config.avgKey]));
    const maxData = data.map((d) => Number(d[config.maxKey]));
    const minData = data.map((d) => Number(d[config.minKey]));

    const series = [
      {
        name: `Average ${config.label}`,
        data: avgData,
        color: config.color,
      },
      {
        name: `Max ${config.label}`,
        data: maxData,
        color: '#EF4444',
      },
      {
        name: `Min ${config.label}`,
        data: minData,
        color: '#6B7280',
      },
    ];

    const options = {
      chart: {
        type: 'line',
        toolbar: {
          show: true,
        },
        zoom: {
          enabled: true,
        },
      },
      stroke: {
        curve: 'smooth' as const,
        width: 2,
      },
      xaxis: {
        categories,
        labels: {
          rotate: -45,
          style: {
            fontSize: '12px',
          },
        },
      },
      yaxis: {
        title: {
          text: `${config.label} (${config.unit})`,
        },
        labels: {
          formatter: (value: number) => value.toFixed(1),
        },
      },
      annotations: {
        yaxis: [
          {
            y: thresholds.warning,
            borderColor: '#F59E0B',
            label: {
              borderColor: '#F59E0B',
              style: {
                color: '#fff',
                background: '#F59E0B',
              },
              text: 'Warning Threshold',
            },
          },
          {
            y: thresholds.danger,
            borderColor: '#EF4444',
            label: {
              borderColor: '#EF4444',
              style: {
                color: '#fff',
                background: '#EF4444',
              },
              text: 'Danger Threshold',
            },
          },
        ],
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: (value: number) => `${value.toFixed(2)} ${config.unit}`,
        },
      },
      legend: {
        position: 'top' as const,
        horizontalAlign: 'left' as const,
      },
      grid: {
        borderColor: '#e7e7e7',
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5,
        },
      },
    };

    return { series, options };
  };

  const chartData = getChartData();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Historical Gas Level Charts
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View historical trends and patterns in gas levels
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Barn Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Barn
            </label>
            <select
              value={selectedBarn}
              onChange={(e) => setSelectedBarn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select Barn</option>
              {barns.map((barn) => (
                <option key={barn.id} value={barn.id}>
                  {barn.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sensor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sensor
            </label>
            <select
              value={selectedSensor}
              onChange={(e) => setSelectedSensor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={availableSensors.length === 0}
            >
              <option value="">All Sensors</option>
              {availableSensors.map((sensor) => (
                <option key={sensor} value={sensor}>
                  {sensor}
                </option>
              ))}
            </select>
          </div>

          {/* Gas Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gas Type
            </label>
            <select
              value={selectedGas}
              onChange={(e) => setSelectedGas(e.target.value as GasType)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="methane">Methane (CH₄)</option>
              <option value="co2">Carbon Dioxide (CO₂)</option>
              <option value="nh3">Ammonia (NH₃)</option>
            </select>
          </div>

          {/* Aggregation Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MdBarChart className="inline mr-1" />
              Aggregation
            </label>
            <select
              value={aggregation}
              onChange={(e) => setAggregation(e.target.value as AggregationPeriod)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MdDateRange className="inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MdDateRange className="inline mr-1" />
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-600 dark:text-gray-400">Loading chart data...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <MdBarChart className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 dark:text-gray-400">
                No data available for the selected filters
              </p>
            </div>
          </div>
        ) : (
          <div className="h-96">
            <LineChart chartData={chartData.series} chartOptions={chartData.options} />
          </div>
        )}
      </div>

      {/* Legend */}
      {data.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Threshold Reference
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Normal</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Below warning threshold
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Warning</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {selectedGas === 'methane' && '500-1000 ppm'}
                  {selectedGas === 'co2' && '2000-3000 ppm'}
                  {selectedGas === 'nh3' && '15-25 ppm'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Danger</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {selectedGas === 'methane' && '> 1000 ppm'}
                  {selectedGas === 'co2' && '> 3000 ppm'}
                  {selectedGas === 'nh3' && '> 25 ppm'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
