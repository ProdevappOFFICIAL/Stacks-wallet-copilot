import {
  AppConfig,
  showConnect,
  type UserData,
  UserSession,
} from "@stacks/connect";
import { useEffect, useState, useMemo } from "react";
import { NETWORK_CONFIG } from "../utils/network";

export function useStacks() {
  const [userData, setUserData] = useState<UserData | null>(null);

  // Create application config that allows
  // storing authentication state in browser's local storage
  const appConfig = useMemo(() => new AppConfig(["store_write"]), []);

  // Creating a new user session based on the application config
  const userSession = useMemo(() => new UserSession({ appConfig }), [appConfig]);

  function connectWallet() {
    showConnect({
      appDetails: {
        name: "Stacks Chat Assistant",
        icon: "https://avatars.githubusercontent.com/u/231766800?s=400&u=252add02370d1b05ace6d96f7afc90f0c69bb588&v=4",
      },
      onFinish: () => {
        // Update userData without reloading the page
        setUserData(userSession.loadUserData());
      },
      userSession,
      // Ensure the wallet connects to the correct network
      network: NETWORK_CONFIG.networkName,
    });
  }

  function disconnectWallet() {
    // Sign out the user and close their session
    // also clear out the user data
    userSession.signUserOut();
    setUserData(null);
  }

  // Clear corrupted session data from localStorage
  function clearCorruptedSessionData() {
    try {
      // Common localStorage keys used by Stacks Connect
      const stacksKeys = [
        'blockstack-session',
        'blockstack-gaia-hub-config',
        'stacks-session',
        'transit-core-session-token'
      ];
      
      stacksKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('Cleared corrupted session data');
    } catch (error) {
      console.error('Error clearing session data:', error);
    }
  }

  // When the page first loads, if the user is already signed in,
  // set the userData
  // If the user has a pending sign-in instead, resume the sign-in flow
  useEffect(() => {
    try {
      if (userSession.isUserSignedIn()) {
        setUserData(userSession.loadUserData());
      } else if (userSession.isSignInPending()) {
        userSession.handlePendingSignIn().then((userData) => {
          setUserData(userData);
        });
      }
    } catch (error) {
      // Handle InvalidStateError or other session-related errors
      if (error instanceof Error && error.name === 'InvalidStateError') {
        console.error('Invalid session data detected:', error.message);
        clearCorruptedSessionData();
        // Optionally reload the page after clearing
        // window.location.reload();
      } else {
        console.error('Error initializing user session:', error);
      }
    }
  }, [userSession]);

  // Return the user data, connect wallet function, disconnect wallet function, and userSession
  return { userData, connectWallet, disconnectWallet, userSession };
}