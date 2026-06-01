export interface FoodLogItem {
  food: string;
  amount: string;
  calories: number;
  protein: number;
}

export interface JournalFoodLogResponse {
  action: "log_food";
  meal_type: string;
  items: FoodLogItem[];
  total_calories: number;
  total_protein: number;
  message: string;
}

export interface JournalReplyResponse {
  action: "reply";
  message: string;
}

export type JournalAiResponse = JournalFoodLogResponse | JournalReplyResponse;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  log?: JournalFoodLogResponse;
  createdAt: string;
}
