import { vi } from "vitest";

export const GlobalWorkerOptions = {
  workerSrc: "",
};

export const version = "1.0.0";

export const getDocument = vi.fn(() => ({
  promise: Promise.resolve({
    numPages: 1,
    getPage: vi.fn(() =>
      Promise.resolve({
        getTextContent: vi.fn(() =>
          Promise.resolve({
            items: [{ str: "Test Content" }],
          }),
        ),
      }),
    ),
  }),
}));

export default {
  GlobalWorkerOptions,
  version,
  getDocument,
};
