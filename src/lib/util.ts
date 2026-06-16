import jwt from 'jsonwebtoken';

export const signJWT = (payload: object) => {
  return jwt.sign(payload, process.env.JWT_SECRET!);
};

export const getToken = () => {
  const token = sessionStorage.getItem("admin_token");

  
  if (!token) {
    console.error("No admin_token in sessionStorage");
    return {}; // or throw error, redirect to login
  }

  return { headers: { Authorization: `Bearer ${token}` } };
};