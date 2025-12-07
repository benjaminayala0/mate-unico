import { API } from "./axios";

export const getProducts = async () => {
  const res = await API.get("/productos");
  return res.data;
};

export const getProductById = async (id) => {
  const res = await API.get(`/productos/${id}`);
  return res.data;
};
