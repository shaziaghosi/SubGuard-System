
import API from "./api";

// Fetch all subscriptions belonging to the logged-in user
export const getSubscriptions = async () => {
  const response = await API.get("/subscriptions");
  return response.data;
};

// Add a new subscription
export const addSubscription = async (subscriptionData) => {
  const response = await API.post("/subscriptions", subscriptionData);
  return response.data;
};

// Update an existing subscription
export const updateSubscription = async (id, updatedData) => {
  const response = await API.put(
    `/subscriptions/${id}`,
    updatedData
  );
  return response.data;
};

// Delete a subscription
export const deleteSubscription = async (id) => {
  const response = await API.delete(`/subscriptions/${id}`);
  return response.data;
};
