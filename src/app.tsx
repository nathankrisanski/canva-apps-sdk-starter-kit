import { useEffect, useRef } from "react";
import {
  Text,
  Button,
  Rows,
  Box,
  Column,
  Columns,
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  LoadingIndicator,
} from "@canva/app-ui-kit";
import { AgentSearchTab } from "./components/agent_search_tab";
import { SearchableTab } from "./components/searchable_tab";
import { ApiConfigSetup } from "./components/api_config_setup";
import { useApiConfig } from "./hooks/use_api_config";
import { useMicrosoftAuth } from "./hooks/use_microsoft_auth";
import ConfigurationService from "./services/config";
import * as styles from "styles/components.css";

export const App = () => {
  const { isAuthenticated, user, loading, login, logout } = useMicrosoftAuth();
  const { isReady } = useApiConfig();
  const loginAttemptedRef = useRef(false);

  // Initialize middleware API authentication when user logs in
  useEffect(() => {
    const initializeMiddlewareAuth = async () => {
      if (isAuthenticated) {
        try {
          console.log("Initializing middleware API authentication...");
          const configService = ConfigurationService.getInstance();
          await configService.initializeFromEnv();
          console.log("Middleware API authentication successful");
        } catch (error) {
          console.error("Middleware API authentication failed:", error);
        }
      }
    };

    initializeMiddlewareAuth();
  }, [isAuthenticated]);

  // Automatically trigger OAuth if not authenticated (only once)
  useEffect(() => {
    if (!loading && !isAuthenticated && !loginAttemptedRef.current) {
      console.log("Not authenticated, triggering OAuth flow...");
      loginAttemptedRef.current = true;
      login();
    }

    // Reset the ref if user becomes authenticated
    if (isAuthenticated) {
      loginAttemptedRef.current = false;
    }
  }, [loading, isAuthenticated, login]);

  // Show error message if OAuth is not configured
  if (!loading && !isAuthenticated && loginAttemptedRef.current) {
    return (
      <div className={styles.scrollContainer}>
        <Box
          justifyContent="center"
          width="full"
          alignItems="center"
          display="flex"
          height="full"
          padding="4u"
        >
          <Rows spacing="3u">
            <Text variant="bold" size="large">OAuth Configuration Required</Text>
            <Text variant="regular">
              To use this app, you need to configure Azure AD OAuth in the Canva Developer Portal.
            </Text>
            <Text variant="regular" size="small">
              Please follow the setup instructions:
            </Text>
            <Box background="neutralLow" padding="2u" borderRadius="standard">
              <Rows spacing="1u">
                <Text variant="regular" size="small">1. Go to Canva Developer Portal</Text>
                <Text variant="regular" size="small">2. Select your app</Text>
                <Text variant="regular" size="small">3. Configure Authentication with Azure AD</Text>
                <Text variant="regular" size="small">4. Add the Canva redirect URI to Azure AD</Text>
                <Text variant="regular" size="small">5. Refresh this page</Text>
              </Rows>
            </Box>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </Rows>
        </Box>
      </div>
    );
  }

  // Show loading screen during authentication
  if (loading || !isAuthenticated) {
    return (
      <div className={styles.scrollContainer}>
        <Box
          justifyContent="center"
          width="full"
          alignItems="center"
          display="flex"
          height="full"
        >
          <Rows spacing="2u">
            <LoadingIndicator size="medium" />
            <Text variant="regular">
              {loading ? "Checking authentication..." : "Connecting..."}
            </Text>
          </Rows>
        </Box>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    // Clear middleware API auth
    ConfigurationService.getInstance().reset();
  };

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="1u">
        <Box background="neutralLow" padding="1u" borderRadius="standard">
          <Columns spacing="1u" alignY="center">
            <Column>
              <Text>Hi {user?.displayName || "Agent"}</Text>
            </Column>
            <Column width="content">
              <Button variant="tertiary" onClick={handleLogout}>
                Sign out
              </Button>
            </Column>
          </Columns>
        </Box>

        {/* Main App Content */}
        {!isReady ? (
          <ApiConfigSetup />
        ) : (
          <Tabs>
            <TabList>
              <Tab id="agents">Agent Search</Tab>
              <Tab id="listings">Listings</Tab>
              <Tab id="market">Market Data</Tab>
            </TabList>
            <TabPanels>
              <TabPanel id="agents">
                <AgentSearchTab userEmail={user?.mail} />
              </TabPanel>
              <TabPanel id="listings">
                <SearchableTab
                  endpoint="listings"
                  tabName="Listings"
                  userEmail={user?.mail}
                />
              </TabPanel>
              <TabPanel id="market">
                <SearchableTab endpoint="market-data" tabName="Market Data" />
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </Rows>
    </div>
  );
};
