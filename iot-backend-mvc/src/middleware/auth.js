export function verifyToken(req, res, next) {
  // Lấy token từ header
  const token = req.headers['authorization'];

  // Token mặc định (có thể đặt trong .env)
  const API_TOKEN = process.env.API_TOKEN;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Yêu cầu client gửi kiểu "Bearer mytoken"
  const provided = token.split(' ')[1]; 
  if (provided !== API_TOKEN) {
    return res.status(403).json({ message: 'Invalid token' });
  }

  next();
}
