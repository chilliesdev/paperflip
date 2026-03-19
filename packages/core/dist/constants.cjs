"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/constants.ts
var constants_exports = {};
__export(constants_exports, {
  CHARS_PER_SECOND: () => CHARS_PER_SECOND,
  videoSources: () => videoSources,
  wordCount: () => wordCount
});
module.exports = __toCommonJS(constants_exports);
var wordCount = 8;
var CHARS_PER_SECOND = 16.6;
var videoSources = [
  {
    url: "https://hcidefilvllxloywohwf.supabase.co/storage/v1/object/public/paperflip/bg-video-1.mp4",
    previewUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBxDgF10K7pouD7MG0K5YctMikezJ5XfImNw9DYPsUR7RFZ-5RFY3q9CI6mP4_DJC8F_Z48Nl-fqAgGUGUnBGKQ8GyDJ8S30tkqqdiACXwlpD6bnlXILCxggTZX3yHKKuhnVD9PKwN7TARWIcKFeca5gJw-FO1gE_6VPnWaw79EOoxNbmR2M9hXtOmr6xzBYy6Qe4H_1dsHo3Dc0cJyOEvJdcK79wFWOfyQs-ajw50B9e_1xviY_Z7Q88v2o-EvbWN_lWcwDUJ57Bfn",
    name: "Nebula"
  },
  {
    url: "https://hcidefilvllxloywohwf.supabase.co/storage/v1/object/public/paperflip/bg-video-2.mp4",
    previewUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDkHZkdKSjJpO6nVpPIUdwpC-gUZaaBNPNs8ziAehYw9IXATqyVkFgESUKZJ4IprybuEb4MMYq6dZyLgEHSsmjfAl4F_aeYE90_2nKDgYlm9utzLItT6Bd7qBKio3o74es2v9Gl7FW2MhOFqVfYtxYTm0HfeR3dzg-zn3tYF6Q-5CxmKxGqEWld99xvWmInYFVUrzWQf6epqBMZAm2lIQ4i4DzITgsnz8_NHjyMKpdLP5GLhF9aNQgPZV833qBHE-Dqs3PEjOasdCCb",
    name: "Forest"
  }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CHARS_PER_SECOND,
  videoSources,
  wordCount
});
//# sourceMappingURL=constants.cjs.map