import { writable } from "svelte/store";

export const videoLength = writable<number>(15);
export const backgroundUrl = writable<string>(
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBxDgF10K7pouD7MG0K5YctMikezJ5XfImNw9DYPsUR7RFZ-5RFY3q9CI6mP4_DJC8F_Z48Nl-fqAgGUGUnBGKQ8GyDJ8S30tkqqdiACXwlpD6bnlXILCxggTZX3yHKKuhnVD9PKwN7TARWIcKFeca5gJw-FO1gE_6VPnWaw79EOoxNbmR2M9hXtOmr6xzBYy6Qe4H_1dsHo3Dc0cJyOEvJdcK79wFWOfyQs-ajw50B9e_1xviY_Z7Q88v2o-EvbWN_lWcwDUJ57Bfn",
);
export const autoResume = writable<boolean>(true);
export const darkMode = writable<boolean>(true);
export const textScale = writable<number>(110);
