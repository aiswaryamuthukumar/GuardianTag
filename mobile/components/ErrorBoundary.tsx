import React from 'react';
import { View, Text, Button, ScrollView } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorStack?: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      error,
      errorStack: error.stack,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service here (e.g., Sentry)
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-background justify-center items-center p-4">
          <ScrollView className="flex-1 w-full">
            <Text className="text-red-500 text-xl font-bold mb-4">
              Something went wrong
            </Text>
            
            <Text className="text-white mb-2 font-semibold">Error:</Text>
            <Text className="text-white mb-4 font-mono text-sm">
              {this.state.error?.message || 'Unknown error'}
            </Text>

            {this.state.errorStack && (
              <>
                <Text className="text-white mb-2 font-semibold">Stack trace:</Text>
                <Text className="text-white mb-4 font-mono text-xs">
                  {this.state.errorStack}
                </Text>
              </>
            )}

            <Text className="text-muted mb-4">
              This error has been logged. Please try closing and reopening the app.
            </Text>
          </ScrollView>

          <Button
            title="Reload App"
            onPress={() => {
              this.setState({ hasError: false, error: undefined, errorStack: undefined });
            }}
          />
        </View>
      );
    }

    return this.props.children;
  }
}