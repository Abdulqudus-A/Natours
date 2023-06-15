const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();
// const redis = new Redis();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1. GLOBAL Middlewares
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// // Max login attempts implementation
// const maxNoOfFailedAttempts = 3;
// const timeOutWindowForFailedAttempts = 60 * 60 * 1000;

// app.get('/api/v1/users/login', limiter, async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     // Check if user is not attempted too many login req
//     const userAttempts = await redis.get(email);
//     if (userAttempts > maxNoOfFailedAttempts) {
//       return next(
//         new AppError('Too many attempts, try again in an hour!', 429)
//       );
//     }
//     // Check user
//     const loginResult = authController.login;

//     // Attempt failed
//     if (!loginResult) {
//       await redis.set(
//         email,
//         ++userAttempts,
//         'ex',
//         timeOutWindowForFailedAttempts
//       );
//       res.send('failed');
//       next();
//     } else {
//       // Succesful login
//       await redis.del(email);
//       res.send('success');
//       next();
//     }
//   } catch (err) {
//     return next(new AppError('Error redis', 400));
//   }
// });

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent http parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'difficulty',
      'ratingsAverage',
      'maxGroupSize',
      'price',
      'ratingsQuantity',
    ],
  })
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//2. Route handlers
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

//4. Start Server
module.exports = app;
