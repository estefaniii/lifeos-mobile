import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps } from 'react-native';

/**
 * Envoltura ligera que hace un fade-in + subida suave al montar.
 * Uso: <FadeInView delay={80}>...</FadeInView>
 */
export function FadeInView({ children, delay = 0, style, ...rest }: ViewProps & { delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 340, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 340, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]} {...rest}>
      {children}
    </Animated.View>
  );
}
