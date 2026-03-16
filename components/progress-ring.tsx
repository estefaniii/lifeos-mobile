import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useColors } from '@/hooks/use-colors';

interface ProgressRingProps {
  progress: number;
  size?: number;
  radius?: number;
  strokeWidth?: number;
  label: string;
  value?: string;
  color?: string;
  onPress?: () => void;
}

/**
 * ProgressRing Component
 * 
 * Displays a circular progress indicator with a label and optional value.
 * Used for daily progress tracking (Finances, Health, Productivity).
 * 
 * Example:
 * ```tsx
 * <ProgressRing
 *   progress={75}
 *   label="Finanzas"
 *   value="$250"
 *   color="#0a7ea4"
 *   size={120}
 * />
 * ```
 */
export function ProgressRing({
  progress,
  size: propSize,
  radius: propRadius = 50,
  strokeWidth = 8,
  label,
  value,
  color,
  onPress,
}: ProgressRingProps) {
  const colors = useColors();
  const ringColor = color || colors.primary;
  const backgroundColor = colors.surface;

  const radius = propSize ? (propSize / 2) - strokeWidth : propRadius;
  const size = propSize || (radius + strokeWidth) * 2;
  const center = size / 2;

  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const content = (
    <>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={center} cy={center} r={radius} fill="none" stroke={backgroundColor} strokeWidth={strokeWidth} />
        <Circle
          cx={center} cy={center} r={radius}
          fill="none" stroke={ringColor} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" rotation={-90} origin={`${center}, ${center}`}
        />
      </Svg>
      <View className="items-center gap-1">
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
        {value && <Text className="text-xs text-muted">{value}</Text>}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable className="items-center gap-2 active:opacity-70" onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View className="items-center gap-2">{content}</View>;
}
