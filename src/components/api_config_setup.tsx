import React from "react";
import { Rows, Button, Text, Alert } from "@canva/app-ui-kit";
import { useIntl } from "react-intl";
import { useApiConfig } from "../hooks/use_api_config";

interface ApiConfigSetupProps {
  onConfigured?: () => void;
}

export const ApiConfigSetup: React.FC<ApiConfigSetupProps> = ({
  onConfigured,
}) => {
  const { isReady, isInitializing, error, status, retry } = useApiConfig();
  const intl = useIntl();

  if (isReady) {
    return (
      <Rows spacing="2u">
        <Alert tone="positive">
          <Text>
            {intl.formatMessage({
              
              defaultMessage: "API authentication configured successfully!",
              description: "Success message when API is configured",
            })}
          </Text>
        </Alert>

        <Text variant="regular">
          {intl.formatMessage(
            {
              
              defaultMessage: "Status: {status}",
              description: "API status information",
            },
            {
              status: status.authStatus.hasValidToken
                ? "Connected"
                : "Configured",
            },
          )}
        </Text>
      </Rows>
    );
  }

  return (
    <Rows spacing="2u">
      <Text variant="bold">
        {intl.formatMessage({
          
          defaultMessage: "Environment Configuration Required",
          description: "Title for environment configuration section",
        })}
      </Text>

      <Text variant="regular">
        {intl.formatMessage({
          
          defaultMessage:
            "API credentials must be configured via environment variables.",
          description: "Description for environment configuration",
        })}
      </Text>

      {error && (
        <Alert tone="critical">
          <Text>
            {intl.formatMessage(
              {
                
                defaultMessage: "Configuration Error: {error}",
                description: "Error message for API configuration",
              },
              { error },
            )}
          </Text>
        </Alert>
      )}

      <Alert tone="info">
        <Text>
          {intl.formatMessage({
            
            defaultMessage: "Required environment variables:",
            description: "Label for required environment variables",
          })}
        </Text>
        <Text variant="bold">• AGENCY_CLIENT_ID</Text>
        <Text variant="bold">• AGENCY_CLIENT_SECRET</Text>
      </Alert>

      {isInitializing ? (
        <Text variant="regular">
          {intl.formatMessage({
            
            defaultMessage: "Connecting...",
            description: "Button text while connecting to API",
          })}
        </Text>
      ) : (
        <Button variant="primary" onClick={retry} stretch>
          {intl.formatMessage({
            
            defaultMessage: "Retry Connection",
            description: "Button text to retry API connection",
          })}
        </Button>
      )}

      <Text variant="regular">
        {intl.formatMessage({
          
          defaultMessage:
            "Set these environment variables with your API credentials from The Agency Middleware dashboard, then restart the application.",
          description: "Help text for setting environment variables",
        })}
      </Text>
    </Rows>
  );
};
