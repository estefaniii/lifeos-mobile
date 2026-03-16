import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { VictoryBar, VictoryChart, VictoryPie, VictoryLine, VictoryAxis } from 'victory';
import { useColors } from '@/hooks/use-colors';

const screenWidth = Dimensions.get('window').width;

/**
 * BarChart Component
 * Displays a bar chart for comparing values across categories
 */
interface BarChartProps {
  data: Array<{ x: string; y: number }>;
  title?: string;
  yLabel?: string;
  color?: string;
}

export function BarChart({ data, title, yLabel, color }: BarChartProps) {
  const colors = useColors();
  const chartColor = color || colors.primary;

  return (
    <View className="bg-surface rounded-lg p-4 mb-4">
      {title && <Text className="text-lg font-semibold text-foreground mb-4">{title}</Text>}
      <VictoryChart width={screenWidth - 40} height={250} padding={{ top: 20, bottom: 60, left: 60, right: 20 }}>
        <VictoryAxis
          style={{
            axis: { stroke: colors.border },
            ticks: { stroke: colors.border },
            tickLabels: { fill: colors.muted, fontSize: 12 },
          }}
        />
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: colors.border },
            ticks: { stroke: colors.border },
            tickLabels: { fill: colors.muted, fontSize: 12 },
          }}
          label={yLabel}
        />
        <VictoryBar
          data={data}
          style={{
            data: { fill: chartColor, width: 20 },
          }}
        />
      </VictoryChart>
    </View>
  );
}

/**
 * PieChart Component
 * Displays a pie chart for showing proportions
 */
interface PieChartProps {
  data: Array<{ x: string; y: number }>;
  title?: string;
  colors?: string[];
}

export function PieChart({ data, title, colors: customColors }: PieChartProps) {
  const colors = useColors();
  const chartColors = customColors || [
    colors.primary,
    colors.success,
    colors.warning,
    colors.error,
  ];

  return (
    <View className="bg-surface rounded-lg p-4 mb-4">
      {title && <Text className="text-lg font-semibold text-foreground mb-4">{title}</Text>}
      <VictoryChart width={screenWidth - 40} height={300}>
        <VictoryPie
          data={data}
          colorScale={chartColors}
          style={{
            labels: { fill: colors.foreground, fontSize: 12 },
          }}
        />
      </VictoryChart>
    </View>
  );
}

/**
 * LineChart Component
 * Displays a line chart for showing trends over time
 */
interface LineChartProps {
  data: Array<{ x: string | number; y: number }>;
  title?: string;
  yLabel?: string;
  color?: string;
}

export function LineChart({ data, title, yLabel, color }: LineChartProps) {
  const colors = useColors();
  const chartColor = color || colors.primary;

  return (
    <View className="bg-surface rounded-lg p-4 mb-4">
      {title && <Text className="text-lg font-semibold text-foreground mb-4">{title}</Text>}
      <VictoryChart width={screenWidth - 40} height={250} padding={{ top: 20, bottom: 60, left: 60, right: 20 }}>
        <VictoryAxis
          style={{
            axis: { stroke: colors.border },
            ticks: { stroke: colors.border },
            tickLabels: { fill: colors.muted, fontSize: 12 },
          }}
        />
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: colors.border },
            ticks: { stroke: colors.border },
            tickLabels: { fill: colors.muted, fontSize: 12 },
          }}
          label={yLabel}
        />
        <VictoryLine
          data={data}
          style={{
            data: { stroke: chartColor, strokeWidth: 2 },
            parent: { border: '1px solid #ccc' },
          }}
        />
      </VictoryChart>
    </View>
  );
}
