import express, { Express } from 'express';
import helmet from 'helmet';
import xss from 'xss-clean';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import cors from 'cors';
import passport from 'passport';
import httpStatus from 'http-status';
import config from './config/config';
import { morgan } from './modules/logger';
import { jwtStrategy } from './modules/auth';
import { authLimiter } from './modules/utils';
import { ApiError, errorConverter, errorHandler } from './modules/errors';
import routes from './routes/v1';

const app: Express = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// enable cors
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://192.168.1.196:3002',
  'http://192.168.1.129:3002',
  config.clientUrl,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.options('*', cors());
// Add this before your static middleware
app.use((req, _res, next) => {
  // Normalize path to remove double slashes
  req.url = req.url.replace(/\/+/g, '/');
  next();
});

app.use('/uploads', express.static('uploads'));

// Handle missing static files gracefully
app.use('/uploads', (req, res) => {
  // If the static middleware didn't serve a file, it means the file doesn't exist
  if (!res.headersSent) {
    // Log the missing file for debugging
    console.log(`Missing file requested: ${req.path}`);

    // Return a proper 404 with more information
    res.status(404).json({
      message: 'File not found',
      path: req.path,
      timestamp: new Date().toISOString(),
      suggestion: 'The file may have been deleted or the path may be incorrect',
    });
  }
});

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(ExpressMongoSanitize());

// gzip compression
app.use(compression());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// v1 api routes
app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((_req, _res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
