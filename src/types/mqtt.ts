export interface Device {
  friendly_name: string;
  ieee_address: string;
  state: Record<string, any>;
  definition: {
    description: string;
    model: string;
    vendor: string;
  };
} 