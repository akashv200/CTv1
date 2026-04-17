import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DomainKey } from "../types";

type DensityMode = "comfortable" | "compact";
type DateRange = "7d" | "30d" | "90d";
type WalletOption = "metamask" | "walletconnect" | "coinbase";
type GasMode = "slow" | "normal" | "fast";
type MapStyle = "light" | "dark" | "satellite";
type Sensitivity = "low" | "medium" | "high";
type ExportFormat = "csv" | "pdf" | "json";

export interface PlatformSettings {
  profile: {
    displayName: string;
    email: string;
    organization: string;
    timezone: string;
    locale: string;
  };
  appearance: {
    theme: "light" | "dark";
    density: DensityMode;
    reducedMotion: boolean;
  };
  notifications: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    smsCritical: boolean;
    quietHoursEnabled: boolean;
    quietStart: string;
    quietEnd: string;
    alertTypes: {
      recalls: boolean;
      temperatureViolations: boolean;
      expiryWarnings: boolean;
      anomalies: boolean;
      checkpointDelays: boolean;
      certificateRenewals: boolean;
    };
  };
  security: {
    twoFactor: boolean;
    biometric: boolean;
    sessionTimeoutMinutes: number;
    ipWhitelistEnabled: boolean;
    ipWhitelist: string;
  };
  dashboard: {
    defaultDomain: DomainKey | "all";
    autoRefreshSeconds: number;
    defaultDateRange: DateRange;
    showRightPanel: boolean;
  };
  blockchain: {
    networkName: string;
    chainId: number;
    explorerBaseUrl: string;
    preferredWallet: WalletOption;
    gasMode: GasMode;
    autoVerifyOnCheckpoint: boolean;
  };
  iot: {
    mqttEnabled: boolean;
    sensorPollingSeconds: number;
    anomalySensitivity: Sensitivity;
    temperatureUnit: "c" | "f";
    mapStyle: MapStyle;
    liveTrackingTrail: boolean;
    simulationMode: boolean;
  };
  ai: {
    assistantEnabled: boolean;
    naturalLanguageQuery: boolean;
    smartRecommendations: boolean;
    forecastDays: 30 | 60 | 90;
  };
  integrations: {
    webhookEnabled: boolean;
    webhookUrl: string;
    webhookSecret: string;
    sap: boolean;
    shopify: boolean;
    awsIot: boolean;
    fedex: boolean;
  };
  dataGovernance: {
    defaultExportFormat: ExportFormat;
    anonymizeExports: boolean;
    retainLogsDays: number;
    telemetryOptIn: boolean;
  };
}

export const defaultPlatformSettings: PlatformSettings = {
  profile: {
    displayName: "ChainTrace Operator",
    email: "operator@chaintrace.local",
    organization: "ChainTrace Demo Org",
    timezone: "Asia/Kolkata",
    locale: "en-IN"
  },
  appearance: {
    theme: "light",
    density: "comfortable",
    reducedMotion: false
  },
  notifications: {
    inApp: true,
    email: true,
    push: true,
    smsCritical: true,
    quietHoursEnabled: false,
    quietStart: "22:00",
    quietEnd: "07:00",
    alertTypes: {
      recalls: true,
      temperatureViolations: true,
      expiryWarnings: true,
      anomalies: true,
      checkpointDelays: true,
      certificateRenewals: true
    }
  },
  security: {
    twoFactor: false,
    biometric: false,
    sessionTimeoutMinutes: 60,
    ipWhitelistEnabled: false,
    ipWhitelist: ""
  },
  dashboard: {
    defaultDomain: "all",
    autoRefreshSeconds: 30,
    defaultDateRange: "30d",
    showRightPanel: true
  },
  blockchain: {
    networkName: "Ganache Local",
    chainId: 1337,
    explorerBaseUrl: "http://127.0.0.1:7545",
    preferredWallet: "metamask",
    gasMode: "normal",
    autoVerifyOnCheckpoint: true
  },
  iot: {
    mqttEnabled: true,
    sensorPollingSeconds: 5,
    anomalySensitivity: "medium",
    temperatureUnit: "c",
    mapStyle: "light",
    liveTrackingTrail: true,
    simulationMode: false
  },
  ai: {
    assistantEnabled: true,
    naturalLanguageQuery: true,
    smartRecommendations: true,
    forecastDays: 60
  },
  integrations: {
    webhookEnabled: false,
    webhookUrl: "",
    webhookSecret: "",
    sap: false,
    shopify: false,
    awsIot: false,
    fedex: false
  },
  dataGovernance: {
    defaultExportFormat: "csv",
    anonymizeExports: false,
    retainLogsDays: 180,
    telemetryOptIn: true
  }
};

function cloneDefaults(): PlatformSettings {
  return JSON.parse(JSON.stringify(defaultPlatformSettings)) as PlatformSettings;
}

interface PlatformSettingsState {
  settings: PlatformSettings;
  setSettings: (settings: PlatformSettings) => void;
  resetSettings: () => void;
}

export const usePlatformSettingsStore = create<PlatformSettingsState>()(
  persist(
    (set) => ({
      settings: cloneDefaults(),
      setSettings: (settings) => set({ settings }),
      resetSettings: () => set({ settings: cloneDefaults() })
    }),
    {
      name: "chaintrace-platform-settings",
      version: 1
    }
  )
);

