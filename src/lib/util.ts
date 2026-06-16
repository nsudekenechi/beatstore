import jwt from 'jsonwebtoken';

export const signJWT = (payload: object) => {
  return jwt.sign(payload, process.env.JWT_SECRET!);
};

export const getToken = () => {
  const token = sessionStorage.getItem("admin_token");
  console.log("Raw token:", token);
  console.log("First 20 chars:", token?.slice(0, 20));
  console.log("Length:", token?.length);
  console.log("Starts with e:", token?.startsWith('e'));
  
  if (!token) {
    console.error("No admin_token in sessionStorage");
    return {}; // or throw error, redirect to login
  }

  return { headers: { Authorization: `Bearer ${token}` } };
};