export type CategoryStatus = "active" | "inactive";

export interface Category {
  id: string;
  icon: string;
  name: string;
  products: number;
  status?: CategoryStatus;
}
