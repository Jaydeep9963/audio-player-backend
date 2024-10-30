/* eslint-disable prettier/prettier */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUserDoc } from '../../modules/admin/admin.interfaces'; // Ensure to import or define your user interface

// Middleware to check token
const authenticateToken = (req: Request, res: Response, next: NextFunction) : void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Authorization: Bearer <token>

    if (!token) {
      res.status(401).json({ message: 'Unauthenticated: Token required' });
      return;
    }
  
  jwt.verify(token, process.env['JWT_SECRET'] as string, (err, decoded) => {
      if (err) {
        res.status(403).json({ message: 'Forbidden: Invalid token' });
        return;
      }

    // Check if decoded has the properties of IUserDoc
    if (typeof decoded === 'object' && 'email' in decoded && 'id' in decoded) {
     req.user = decoded as IUserDoc; // Cast to IUserDoc
    } else {
      req.user = decoded as IUserDoc  // Keep as JwtPayload
    }
    next();
  });
};

export default authenticateToken;
