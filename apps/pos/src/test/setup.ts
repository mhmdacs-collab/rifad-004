import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
import { RESTAURANT_SERVICE_STORAGE_KEY } from "../adapters/mockRestaurantService";

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(RESTAURANT_SERVICE_STORAGE_KEY, JSON.stringify({
    config: {
      restaurantServiceEnabled: false,
      placeManagementEnabled: false,
    },
    openOrders: [],
  }));
});
afterEach(() => cleanup());
