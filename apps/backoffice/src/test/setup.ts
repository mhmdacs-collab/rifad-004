import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
import { BROWSER_CATALOG_STORAGE_KEY } from "../../../adapters/catalog/browserCatalog";

beforeEach(() => window.localStorage.removeItem(BROWSER_CATALOG_STORAGE_KEY));
afterEach(() => cleanup());
