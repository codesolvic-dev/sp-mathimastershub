import API from "./axios";

export type SupportQuery = {
  _id: string;
  id?: string;
  userId?: string;
  name?: string;
  email: string;
  subject: string;
  description: string;
  source?: "profile" | "contact" | "contact-us" | "website";
  status: "Pending" | "Read" | "Replied";
  adminReply?: string;
  repliedAt?: string;
  repliedBy?: string;
  createdAt: string;
  updatedAt?: string;
};

export type CreateQueryPayload = {
  email: string;
  subject: string;
  description: string;
  name?: string;
  source?: SupportQuery["source"];
};

// Get all queries (admin only)
export const getQueries = async () => {
  const res = await API.get("/queries");
  return res.data as SupportQuery[];
};

// Get logged-in user's queries
export const getMyQueries = async () => {
  const res = await API.get("/queries/my-queries");
  return res.data as SupportQuery[];
};

// Create query (public)
export const createQuery = async (data: CreateQueryPayload) => {
  const res = await API.post("/queries/create", data);
  return res.data as SupportQuery;
};

// Admin reply to query
export const replyToQuery = async (id: string, reply: string) => {
  const res = await API.patch(`/queries/${id}/reply`, { reply });
  return res.data as SupportQuery;
};

// Update query status (admin only)
export const updateQueryStatus = async (id: string, status: "Pending" | "Read" | "Replied") => {
  const res = await API.patch(`/queries/${id}/status`, { status });
  return res.data as SupportQuery;
};

// Delete query (admin only)
export const deleteQuery = async (id: string) => {
  const res = await API.delete(`/queries/${id}`);
  return res.data;
};

export function getQuerySourceLabel(source?: string) {
  switch (source) {
    case "profile":
      return "User Profile";
    case "contact":
      return "Contact Section";
    case "contact-us":
      return "Contact Us Page";
    default:
      return "Website";
  }
}
