// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi)
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "dollarsign.circle.fill": "attach-money",
  "heart.fill": "favorite",
  "brain.head.profile": "psychology",
  "brain.fill": "psychology",
  "person.fill": "person",
  "pencil": "edit",
  "trash.fill": "delete",
  "plus": "add",
  "calendar": "calendar-today",
  "doc.text.fill": "description",
  "checkmark.circle.fill": "check-circle",
  "sparkles": "auto-awesome",
  "bolt.fill": "bolt",
  "chart.bar.fill": "bar-chart",
  "list.bullet": "list",
  "book.fill": "menu-book",
  "clock.fill": "schedule",
  "star.fill": "star",
  "magnifyingglass": "search",
  "gear": "settings",
  "bell.fill": "notifications",
  "xmark": "close",
  "arrow.left": "arrow-back",
  "arrow.right": "arrow-forward",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and MaterialIcons on Android and web.
 * This ensures a consistent look across platforms, and optimal rendering.
 * Icon `name`s are based on SF Symbols and require manual mapping to MaterialIcons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
