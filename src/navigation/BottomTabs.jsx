import { Pressable, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import BottomTabIcon from "../components/BottomTabIcon";
import colors from "../constants/colors";
import AddFoodScreen from "../screens/AddFoodScreen";
import HomeScreen from "../screens/HomeScreen";
import MealScreen from "../screens/MealScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ProgressScreen from "../screens/ProgressScreen";
import { useApp } from "../utils/appState";

const Tab = createBottomTabNavigator();

function AddFoodTabButton({
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  children,
  onLongPress,
  onPress,
  style,
  testID
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      className="-mt-7 flex-1 items-center justify-center"
      onLongPress={onLongPress}
      onPress={(event) => {
        console.log("[BottomTabs] AddFood tab button pressed");
        onPress?.(event);
      }}
      style={style}
      testID={testID}
    >
      {children}
    </Pressable>
  );
}

export default function BottomTabs() {
  const { isDark } = useApp();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#9A9388",
        tabBarLabel: ({ focused, color }) =>
          route.name === "AddFood" ? null : (
            <Text className="text-[11px] font-bold" style={{ color }}>
              {route.name === "Profile" ? "Me" : route.name}
            </Text>
          ),
        tabBarIcon: ({ focused }) => <BottomTabIcon routeName={route.name} focused={focused} />,
        tabBarStyle: {
          height: 86,
          paddingTop: 10,
          paddingBottom: 14,
          borderTopWidth: 0,
          backgroundColor: isDark ? colors.cardDark : colors.card,
          shadowColor: "#6F846A",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
          elevation: 18
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Meal" component={MealScreen} />
      <Tab.Screen
        name="AddFood"
        component={AddFoodScreen}
        listeners={{
          tabPress: () => {
            console.log("[BottomTabs] AddFood tabPress");
          }
        }}
        options={{
          tabBarButton: (props) => <AddFoodTabButton {...props} />
        }}
      />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
