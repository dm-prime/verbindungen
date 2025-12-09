import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";

export default function AdminLayout() {
  const { isAdmin, isLoading } = useAdmin();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const isOnLoginPage = segments[segments.length - 1] === "login";

    if (!isAdmin && !isOnLoginPage) {
      router.replace("/admin/login");
    } else if (isAdmin && isOnLoginPage) {
      router.replace("/admin/boards");
    }
  }, [isAdmin, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5A594E" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1A1A1A",
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "700",
        },
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: "Admin Login",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="boards"
        options={{
          title: "Spielbretter verwalten",
        }}
      />
      <Stack.Screen
        name="board-editor"
        options={{
          title: "Spielbrett bearbeiten",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
  },
});
