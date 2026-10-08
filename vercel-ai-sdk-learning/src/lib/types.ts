//* types declaration

export type JobItem = {
  id: string;
  imageUrl: string;
  prompt: string;
  state: "pending" | "completed" | "failed";
  result?: string;
};
