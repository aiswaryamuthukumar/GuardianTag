import React from "react";
import { Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/src/components/ui/Button";
import { colors } from "@/src/theme";

interface State {
  hasError: boolean;
}

/** Last-resort catch for render errors: a friendly screen instead of a red box or a stack trace. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <View className="mb-4">
          <Feather name="shield" size={48} color={colors.primary} />
        </View>
        <Text className="text-white text-xl font-bold mb-2 text-center">Something went wrong</Text>
        <Text className="text-muted text-center mb-6">
          GuardianTag hit an unexpected error. Your device keeps guarding locally; reload to reconnect.
        </Text>
        <View className="w-48">
          <Button label="Try again" onPress={() => this.setState({ hasError: false })} />
        </View>
      </View>
    );
  }
}
